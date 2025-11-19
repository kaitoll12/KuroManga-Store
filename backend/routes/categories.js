const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateCategory = [
  body('name')
    .isLength({ min: 1, max: 50 })
    .withMessage('Category name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Category name can only contain letters and spaces'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters')
];

// Get all categories
router.get('/', async (req, res) => {
  try {
    const [categories] = await pool.execute(`
      SELECT 
        c.id,
        c.name,
        c.description,
        c.created_at,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.name ASC
    `);

    res.json({
      categories
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      error: 'Failed to fetch categories',
      message: 'An error occurred while retrieving categories'
    });
  }
});

// Get category by ID
router.get('/:id', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);

    if (isNaN(categoryId)) {
      return res.status(400).json({
        error: 'Invalid category ID',
        message: 'Category ID must be a valid number'
      });
    }

    const [categories] = await pool.execute(`
      SELECT 
        c.id,
        c.name,
        c.description,
        c.created_at,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      WHERE c.id = ?
      GROUP BY c.id
    `, [categoryId]);

    if (categories.length === 0) {
      return res.status(404).json({
        error: 'Category not found',
        message: 'The requested category does not exist'
      });
    }

    // Get products in this category
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
        p.stock_quantity,
        p.is_offer
      FROM products p
      WHERE p.category_id = ?
      ORDER BY p.created_at DESC
    `, [categoryId]);

    res.json({
      category: categories[0],
      products
    });

  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      error: 'Failed to fetch category',
      message: 'An error occurred while retrieving the category'
    });
  }
});

// Create new category (admin only)
router.post('/', authenticateToken, requireAdmin, validateCategory, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { name, description } = req.body;

    // Check if category already exists
    const [existingCategories] = await pool.execute(
      'SELECT id FROM categories WHERE LOWER(name) = LOWER(?)',
      [name]
    );

    if (existingCategories.length > 0) {
      return res.status(409).json({
        error: 'Category already exists',
        message: 'A category with this name already exists'
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [name, description || null]
    );

    const [newCategory] = await pool.execute(
      'SELECT id, name, description, created_at FROM categories WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Category created successfully',
      category: newCategory[0]
    });

  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      error: 'Failed to create category',
      message: 'An error occurred while creating the category'
    });
  }
});

// Update category (admin only)
router.put('/:id', authenticateToken, requireAdmin, validateCategory, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const categoryId = parseInt(req.params.id);
    const { name, description } = req.body;

    if (isNaN(categoryId)) {
      return res.status(400).json({
        error: 'Invalid category ID',
        message: 'Category ID must be a valid number'
      });
    }

    // Check if category exists
    const [existingCategories] = await pool.execute(
      'SELECT id FROM categories WHERE id = ?',
      [categoryId]
    );

    if (existingCategories.length === 0) {
      return res.status(404).json({
        error: 'Category not found',
        message: 'The category to update does not exist'
      });
    }

    // Check if new name conflicts with existing category
    const [nameConflict] = await pool.execute(
      'SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND id != ?',
      [name, categoryId]
    );

    if (nameConflict.length > 0) {
      return res.status(409).json({
        error: 'Category name already exists',
        message: 'Another category with this name already exists'
      });
    }

    const [result] = await pool.execute(
      'UPDATE categories SET name = ?, description = ? WHERE id = ?',
      [name, description || null, categoryId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Category not found',
        message: 'The category to update does not exist'
      });
    }

    const [updatedCategory] = await pool.execute(
      'SELECT id, name, description, created_at FROM categories WHERE id = ?',
      [categoryId]
    );

    res.json({
      message: 'Category updated successfully',
      category: updatedCategory[0]
    });

  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      error: 'Failed to update category',
      message: 'An error occurred while updating the category'
    });
  }
});

// Delete category (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);

    if (isNaN(categoryId)) {
      return res.status(400).json({
        error: 'Invalid category ID',
        message: 'Category ID must be a valid number'
      });
    }

    // Check if category has products
    const [products] = await pool.execute(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
      [categoryId]
    );

    if (products[0].count > 0) {
      return res.status(409).json({
        error: 'Category has products',
        message: 'Cannot delete category that contains products. Please reassign or delete products first.'
      });
    }

    const [result] = await pool.execute('DELETE FROM categories WHERE id = ?', [categoryId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Category not found',
        message: 'The category to delete does not exist'
      });
    }

    res.json({
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      error: 'Failed to delete category',
      message: 'An error occurred while deleting the category'
    });
  }
});

module.exports = router;