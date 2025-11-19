const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateCartItem = [
  body('product_id')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer')
];

// Get user's cart
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [cartItems] = await pool.execute(`
      SELECT 
        ci.id as cart_item_id,
        ci.quantity,
        p.id as product_id,
        p.title,
        p.author,
        p.price,
        p.original_price,
        p.rating,
        p.genre,
        p.image,
        p.stock_quantity,
        (p.price * ci.quantity) as subtotal
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
      ORDER BY ci.created_at DESC
    `, [userId]);

    const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

    res.json({
      cart: {
        items: cartItems,
        total,
        itemCount: cartItems.length
      }
    });

  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      error: 'Failed to fetch cart',
      message: 'An error occurred while retrieving your cart'
    });
  }
});

// Add item to cart
router.post('/add', authenticateToken, validateCartItem, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = req.user.id;
    const { product_id, quantity } = req.body;

    // Check if product exists and has sufficient stock
    const [products] = await pool.execute(
      'SELECT id, title, price, stock_quantity FROM products WHERE id = ?',
      [product_id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        error: 'Product not found',
        message: 'The product you are trying to add does not exist'
      });
    }

    const product = products[0];

    if (product.stock_quantity < quantity) {
      return res.status(400).json({
        error: 'Insufficient stock',
        message: `Only ${product.stock_quantity} units available for ${product.title}`
      });
    }

    // Check if item already exists in cart
    const [existingItems] = await pool.execute(
      'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
      [userId, product_id]
    );

    if (existingItems.length > 0) {
      // Update existing item quantity
      const newQuantity = existingItems[0].quantity + quantity;
      
      if (product.stock_quantity < newQuantity) {
        return res.status(400).json({
          error: 'Insufficient stock',
          message: `Cannot add ${quantity} more units. You already have ${existingItems[0].quantity} in cart and only ${product.stock_quantity} available.`
        });
      }

      await pool.execute(
        'UPDATE cart_items SET quantity = ? WHERE id = ?',
        [newQuantity, existingItems[0].id]
      );
    } else {
      // Add new item to cart
      await pool.execute(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [userId, product_id, quantity]
      );
    }

    // Return updated cart
    const [updatedCart] = await pool.execute(`
      SELECT 
        ci.id as cart_item_id,
        ci.quantity,
        p.id as product_id,
        p.title,
        p.author,
        p.price,
        p.original_price,
        p.rating,
        p.genre,
        p.image,
        p.stock_quantity,
        (p.price * ci.quantity) as subtotal
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
      ORDER BY ci.created_at DESC
    `, [userId]);

    const total = updatedCart.reduce((sum, item) => sum + item.subtotal, 0);

    res.json({
      message: 'Item added to cart successfully',
      cart: {
        items: updatedCart,
        total,
        itemCount: updatedCart.length
      }
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      error: 'Failed to add to cart',
      message: 'An error occurred while adding the item to your cart'
    });
  }
});

// Update cart item quantity
router.put('/update/:id', authenticateToken, validateCartItem, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = req.user.id;
    const cartItemId = parseInt(req.params.id);
    const { quantity } = req.body;

    if (isNaN(cartItemId)) {
      return res.status(400).json({
        error: 'Invalid cart item ID',
        message: 'Cart item ID must be a valid number'
      });
    }

    // Check if cart item exists and belongs to user
    const [cartItems] = await pool.execute(`
      SELECT ci.id, ci.product_id, ci.quantity, p.stock_quantity, p.title
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.id = ? AND ci.user_id = ?
    `, [cartItemId, userId]);

    if (cartItems.length === 0) {
      return res.status(404).json({
        error: 'Cart item not found',
        message: 'The cart item does not exist or does not belong to you'
      });
    }

    const cartItem = cartItems[0];

    if (quantity === 0) {
      // Remove item from cart
      await pool.execute('DELETE FROM cart_items WHERE id = ?', [cartItemId]);
    } else {
      // Check if sufficient stock available
      if (cartItem.stock_quantity < quantity) {
        return res.status(400).json({
          error: 'Insufficient stock',
          message: `Only ${cartItem.stock_quantity} units available for ${cartItem.title}`
        });
      }

      // Update quantity
      await pool.execute(
        'UPDATE cart_items SET quantity = ? WHERE id = ?',
        [quantity, cartItemId]
      );
    }

    // Return updated cart
    const [updatedCart] = await pool.execute(`
      SELECT 
        ci.id as cart_item_id,
        ci.quantity,
        p.id as product_id,
        p.title,
        p.author,
        p.price,
        p.original_price,
        p.rating,
        p.genre,
        p.image,
        p.stock_quantity,
        (p.price * ci.quantity) as subtotal
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
      ORDER BY ci.created_at DESC
    `, [userId]);

    const total = updatedCart.reduce((sum, item) => sum + item.subtotal, 0);

    res.json({
      message: quantity === 0 ? 'Item removed from cart' : 'Cart updated successfully',
      cart: {
        items: updatedCart,
        total,
        itemCount: updatedCart.length
      }
    });

  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({
      error: 'Failed to update cart',
      message: 'An error occurred while updating your cart'
    });
  }
});

// Remove item from cart
router.delete('/remove/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const cartItemId = parseInt(req.params.id);

    if (isNaN(cartItemId)) {
      return res.status(400).json({
        error: 'Invalid cart item ID',
        message: 'Cart item ID must be a valid number'
      });
    }

    const [result] = await pool.execute(
      'DELETE FROM cart_items WHERE id = ? AND user_id = ?',
      [cartItemId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Cart item not found',
        message: 'The cart item does not exist or does not belong to you'
      });
    }

    // Return updated cart
    const [updatedCart] = await pool.execute(`
      SELECT 
        ci.id as cart_item_id,
        ci.quantity,
        p.id as product_id,
        p.title,
        p.author,
        p.price,
        p.original_price,
        p.rating,
        p.genre,
        p.image,
        p.stock_quantity,
        (p.price * ci.quantity) as subtotal
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
      ORDER BY ci.created_at DESC
    `, [userId]);

    const total = updatedCart.reduce((sum, item) => sum + item.subtotal, 0);

    res.json({
      message: 'Item removed from cart successfully',
      cart: {
        items: updatedCart,
        total,
        itemCount: updatedCart.length
      }
    });

  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      error: 'Failed to remove from cart',
      message: 'An error occurred while removing the item from your cart'
    });
  }
});

// Clear entire cart
router.delete('/clear', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.execute('DELETE FROM cart_items WHERE user_id = ?', [userId]);

    res.json({
      message: 'Cart cleared successfully',
      cart: {
        items: [],
        total: 0,
        itemCount: 0
      }
    });

  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      error: 'Failed to clear cart',
      message: 'An error occurred while clearing your cart'
    });
  }
});

module.exports = router;