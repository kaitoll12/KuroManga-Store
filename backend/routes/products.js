const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateProduct = [
  body('title')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('author')
    .isLength({ min: 1, max: 100 })
    .withMessage('Author must be between 1 and 100 characters'),
  body('price')
    .isInt({ min: 0 })
    .withMessage('Price must be a positive integer'),
  body('original_price')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Original price must be a positive integer'),
  body('rating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating must be between 0 and 5'),
  body('genre')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Genre must be less than 50 characters'),
  body('stock_quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a positive integer'),
  body('is_offer')
    .optional()
    .isBoolean()
    .withMessage('Is offer must be a boolean')
];

const validateSearch = [
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  query('genre')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Genre must be less than 50 characters'),
  query('sort')
    .optional()
    .isIn(['title', 'price-low', 'price-high', 'rating', 'newest'])
    .withMessage('Invalid sort parameter'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Get all products with filtering and pagination
router.get('/', validateSearch, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { search, genre, sort = 'title', page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];

    if (search) {
      whereConditions.push('(p.title LIKE ? OR p.author LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (genre && genre !== 'all') {
      whereConditions.push('p.genre = ?');
      params.push(genre);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    let orderBy = 'p.title ASC';
    switch (sort) {
      case 'price-low':
        orderBy = 'p.price ASC';
        break;
      case 'price-high':
        orderBy = 'p.price DESC';
        break;
      case 'rating':
        orderBy = 'p.rating DESC';
        break;
      case 'newest':
        orderBy = 'p.created_at DESC';
        break;
      default:
        orderBy = 'p.title ASC';
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM products p 
      ${whereClause}
    `;
    const [countResult] = await pool.execute(countQuery, params);
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    // Get products
    const productsQuery = `
      SELECT 
        p.id,
        p.title,
        p.author,
        p.price,
        p.original_price,
        p.rating,
        p.genre,
        p.image,
        p.description,
        p.stock_quantity,
        p.is_offer,
        p.created_at,
        COALESCE(c.name, p.genre) as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `;

    const [products] = await pool.execute(productsQuery, params);

    // Fix broken placeholder URLs on-the-fly
    const safeProducts = products.map(p => ({
      ...p,
      image: p.image && p.image.includes('via.placeholder.com')
        ? '/placeholder.jpg'
        : p.image
    }));

    res.json({
      products,
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
    console.error('Get products error:', error);
    res.status(500).json({
      error: 'Failed to fetch products',
      message: 'An error occurred while retrieving products',
      details: process.env.NODE_ENV === 'development' ? {
        code: error.code,
        message: error.message,
        sqlMessage: error.sqlMessage,
        sql: error.sql
      } : undefined
    });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    if (isNaN(productId)) {
      return res.status(400).json({
        error: 'Invalid product ID',
        message: 'Product ID must be a valid number'
      });
    }

    const [products] = await pool.execute(`
      SELECT 
        p.id,
        p.title,
        p.author,
        p.price,
        p.original_price,
        p.rating,
        p.genre,
        p.image,
        p.description,
        p.stock_quantity,
        p.is_offer,
        p.created_at,
        COALESCE(c.name, p.genre) as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [productId]);

    if (products.length === 0) {
      return res.status(404).json({
        error: 'Product not found',
        message: 'The requested product does not exist'
      });
    }

    const product = products[0];
    if (product.image && product.image.includes('via.placeholder.com')) {
      product.image = '/placeholder.jpg';
    }

    res.json({
      product
    });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      error: 'Failed to fetch product',
      message: 'An error occurred while retrieving the product'
    });
  }
});

// Create new product (admin only)
router.post('/', authenticateToken, requireAdmin, validateProduct, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      title,
      author,
      price,
      original_price,
      rating = 0,
      genre,
      image,
      description,
      stock_quantity = 0,
      is_offer = false,
      category_id
    } = req.body;

    const [result] = await pool.execute(`
      INSERT INTO products (
        title, author, price, original_price, rating, genre, image, 
        description, stock_quantity, is_offer, category_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title, author, price, original_price || null, rating, genre || null,
      image || null, description || null, stock_quantity, is_offer, category_id || null
    ]);

    const [newProduct] = await pool.execute(`
      SELECT 
        p.id,
        p.title,
        p.author,
        p.price,
        p.original_price,
        p.rating,
        p.genre,
        p.image,
        p.description,
        p.stock_quantity,
        p.is_offer,
        p.created_at,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [result.insertId]);

    res.status(201).json({
      message: 'Product created successfully',
      product: newProduct[0]
    });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      error: 'Failed to create product',
      message: 'An error occurred while creating the product'
    });
  }
});

// Update product (admin only)
router.put('/:id', authenticateToken, requireAdmin, validateProduct, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const productId = parseInt(req.params.id);

    if (isNaN(productId)) {
      return res.status(400).json({
        error: 'Invalid product ID',
        message: 'Product ID must be a valid number'
      });
    }

    const {
      title,
      author,
      price,
      original_price,
      rating,
      genre,
      image,
      description,
      stock_quantity,
      is_offer,
      category_id
    } = req.body;

    const [result] = await pool.execute(`
      UPDATE products SET
        title = ?, author = ?, price = ?, original_price = ?, rating = ?,
        genre = ?, image = ?, description = ?, stock_quantity = ?, 
        is_offer = ?, category_id = ?
      WHERE id = ?
    `, [
      title, author, price, original_price || null, rating || 0, genre || null,
      image || null, description || null, stock_quantity || 0, is_offer || false,
      category_id || null, productId
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Product not found',
        message: 'The product to update does not exist'
      });
    }

    const [updatedProduct] = await pool.execute(`
      SELECT 
        p.id,
        p.title,
        p.author,
        p.price,
        p.original_price,
        p.rating,
        p.genre,
        p.image,
        p.description,
        p.stock_quantity,
        p.is_offer,
        p.created_at,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [productId]);

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct[0]
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      error: 'Failed to update product',
      message: 'An error occurred while updating the product'
    });
  }
});

// Delete product (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    if (isNaN(productId)) {
      return res.status(400).json({
        error: 'Invalid product ID',
        message: 'Product ID must be a valid number'
      });
    }

    const [result] = await pool.execute('DELETE FROM products WHERE id = ?', [productId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Product not found',
        message: 'The product to delete does not exist'
      });
    }

    res.json({
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      error: 'Failed to delete product',
      message: 'An error occurred while deleting the product'
    });
  }
});

// Get all genres
router.get('/filters/genres', async (req, res) => {
  try {
    const [genres] = await pool.execute(`
      SELECT DISTINCT genre, COUNT(*) as count
      FROM products
      WHERE genre IS NOT NULL AND genre != ''
      GROUP BY genre
      ORDER BY genre ASC
    `);

    res.json({
      genres: genres.map(g => ({
        name: g.genre,
        count: g.count
      }))
    });

  } catch (error) {
    console.error('Get genres error:', error);
    res.status(500).json({
      error: 'Failed to fetch genres',
      message: 'An error occurred while retrieving genres'
    });
  }
});

module.exports = router;