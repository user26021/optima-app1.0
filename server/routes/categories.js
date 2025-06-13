const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const authMiddleware = require('../middleware/auth');

// Get all categories
router.get('/', authMiddleware, async (req, res) => {
  try {
    const categories = await db.all(
      'SELECT id, name, slug, description, icon, is_premium FROM categories WHERE is_active = 1 ORDER BY name'
    );

    res.json({
      success: true,
      categories: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get category by slug
router.get('/:slug', authMiddleware, async (req, res) => {
  try {
    const { slug } = req.params;
    
    const category = await db.get(
      'SELECT * FROM categories WHERE slug = ? AND is_active = 1',
      [slug]
    );

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      success: true,
      category: category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

module.exports = router;