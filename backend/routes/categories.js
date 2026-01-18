const express = require('express');
const { protect } = require('../middleware/auth');
const Category = require('../models/Category');

const router = express.Router();

// @route   GET /api/categories
// @desc    Get all categories
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // Get default categories
    const defaultCategories = [
      'Food & Dining',
      'Transportation',
      'Shopping',
      'Entertainment',
      'Groceries',
      'Utilities',
      'Healthcare',
      'Travel',
      'Housing',
      'Other'
    ];

    // Get custom categories created by users
    const customCategories = await Category.find().distinct('name');

    // Combine and remove duplicates
    const allCategories = [...new Set([...defaultCategories, ...customCategories])].sort();

    res.json(allCategories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/categories
// @desc    Create a new category
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });

    if (existingCategory) {
      return res.json({ name: existingCategory.name });
    }

    // Create new category
    const category = await Category.create({
      name: name.trim(),
      createdBy: req.user._id
    });

    res.status(201).json({ name: category.name });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
