const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

// Debug endpoint to test product query
router.get('/debug/products', async (req, res) => {
  try {
    console.log('🐛 Debug: Testing product query...');
    
    // Test simple query first
    const simpleQuery = 'SELECT COUNT(*) as total FROM products';
    console.log('🐛 Debug: Running simple count query...');
    const [countResult] = await pool.execute(simpleQuery);
    console.log('🐛 Debug: Count result:', countResult);
    
    // Test full query with JOIN
    const fullQuery = `
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
      LIMIT 5
    `;
    
    console.log('🐛 Debug: Running full query...');
    const [products] = await pool.execute(fullQuery);
    console.log('🐛 Debug: Found products:', products.length);
    
    res.json({
      debug: 'Product query successful',
      totalProducts: countResult[0].total,
      sampleProducts: products
    });
    
  } catch (error) {
    console.error('❌ Debug query error:', error.message);
    console.error('❌ Full error:', error);
    res.status(500).json({
      error: 'Debug query failed',
      message: error.message,
      sqlMessage: error.sqlMessage,
      sql: error.sql
    });
  }
});

module.exports = router;