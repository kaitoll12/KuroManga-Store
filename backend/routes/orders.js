const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateOrder = [
  body('shipping_address')
    .isLength({ min: 10, max: 500 })
    .withMessage('Shipping address must be between 10 and 500 characters'),
  body('phone')
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters')
];

// Create new order
router.post('/create', authenticateToken, validateOrder, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = req.user.id;
    const { shipping_address, phone, notes } = req.body;

    // Get user's cart items
    const [cartItems] = await pool.execute(`
      SELECT 
        ci.id as cart_item_id,
        ci.product_id,
        ci.quantity,
        p.title,
        p.price,
        p.stock_quantity
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
    `, [userId]);

    if (cartItems.length === 0) {
      return res.status(400).json({
        error: 'Cart is empty',
        message: 'Cannot create order with empty cart'
      });
    }

    // Check stock availability
    const insufficientStock = cartItems.filter(item => item.stock_quantity < item.quantity);
    if (insufficientStock.length > 0) {
      return res.status(400).json({
        error: 'Insufficient stock',
        message: `Insufficient stock for: ${insufficientStock.map(item => item.title).join(', ')}`
      });
    }

    // Calculate total
    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Generate unique order number
    const orderNumber = 'ORD-' + uuidv4().substring(0, 8).toUpperCase();

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Create order
      const [orderResult] = await connection.execute(`
        INSERT INTO orders (user_id, order_number, total_amount, shipping_address, phone, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [userId, orderNumber, totalAmount, shipping_address, phone, notes || null]);

      const orderId = orderResult.insertId;

      // Create order items
      for (const item of cartItems) {
        await connection.execute(`
          INSERT INTO order_items (order_id, product_id, quantity, price)
          VALUES (?, ?, ?, ?)
        `, [orderId, item.product_id, item.quantity, item.price]);

        // Update product stock
        await connection.execute(`
          UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?
        `, [item.quantity, item.product_id]);
      }

      // Clear user's cart
      await connection.execute('DELETE FROM cart_items WHERE user_id = ?', [userId]);

      await connection.commit();

      // Get created order details
      const [orderDetails] = await pool.execute(`
        SELECT 
          o.id,
          o.order_number,
          o.total_amount,
          o.status,
          o.shipping_address,
          o.phone,
          o.notes,
          o.created_at,
          u.username,
          u.email
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.id = ?
      `, [orderId]);

      const [orderItems] = await pool.execute(`
        SELECT 
          oi.quantity,
          oi.price,
          p.title,
          p.author,
          p.image
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [orderId]);

      res.status(201).json({
        message: 'Order created successfully',
        order: {
          ...orderDetails[0],
          items: orderItems
        }
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      error: 'Failed to create order',
      message: 'An error occurred while creating your order'
    });
  }
});

// Get user's orders
router.get('/my-orders', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [orders] = await pool.execute(`
      SELECT 
        o.id,
        o.order_number,
        o.total_amount,
        o.status,
        o.shipping_address,
        o.phone,
        o.notes,
        o.created_at,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [userId]);

    res.json({
      orders
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      error: 'Failed to fetch orders',
      message: 'An error occurred while retrieving your orders'
    });
  }
});

// Get order details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = parseInt(req.params.id);

    if (isNaN(orderId)) {
      return res.status(400).json({
        error: 'Invalid order ID',
        message: 'Order ID must be a valid number'
      });
    }

    // Check if order belongs to user or user is admin
    const [orders] = await pool.execute(`
      SELECT 
        o.id,
        o.order_number,
        o.total_amount,
        o.status,
        o.shipping_address,
        o.phone,
        o.notes,
        o.created_at,
        u.username,
        u.email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ? AND (o.user_id = ? OR ? = 'admin')
    `, [orderId, userId, req.user.role]);

    if (orders.length === 0) {
      return res.status(404).json({
        error: 'Order not found',
        message: 'The order does not exist or you do not have permission to view it'
      });
    }

    const [orderItems] = await pool.execute(`
      SELECT 
        oi.quantity,
        oi.price,
        p.title,
        p.author,
        p.image,
        p.genre
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [orderId]);

    res.json({
      order: {
        ...orders[0],
        items: orderItems
      }
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      error: 'Failed to fetch order',
      message: 'An error occurred while retrieving the order'
    });
  }
});

// Update order status (admin only)
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Admin access required',
        message: 'Only administrators can update order status'
      });
    }

    const orderId = parseInt(req.params.id);
    const { status } = req.body;

    if (isNaN(orderId)) {
      return res.status(400).json({
        error: 'Invalid order ID',
        message: 'Order ID must be a valid number'
      });
    }

    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const [result] = await pool.execute(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, orderId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Order not found',
        message: 'The order does not exist'
      });
    }

    res.json({
      message: 'Order status updated successfully',
      status
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      error: 'Failed to update order status',
      message: 'An error occurred while updating the order status'
    });
  }
});

// Get all orders (admin only)
router.get('/admin/all', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Admin access required',
        message: 'Only administrators can view all orders'
      });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];

    if (status && ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      whereClause = 'WHERE o.status = ?';
      params.push(status);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM orders o 
      ${whereClause}
    `;
    const [countResult] = await pool.execute(countQuery, params);
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    // Get orders
    const ordersQuery = `
      SELECT 
        o.id,
        o.order_number,
        o.total_amount,
        o.status,
        o.shipping_address,
        o.phone,
        o.notes,
        o.created_at,
        u.username,
        u.email,
        COUNT(oi.id) as item_count
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${whereClause}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [orders] = await pool.execute(ordersQuery, [...params, parseInt(limit), parseInt(offset)]);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      error: 'Failed to fetch orders',
      message: 'An error occurred while retrieving orders'
    });
  }
});

module.exports = router;