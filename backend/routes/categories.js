const express = require('express');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');
const Category = require('../models/Category');
const Expense = require('../models/Expense');

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

    // If requesting detailed view (for admin)
    if (req.query.detailed === 'true' && req.user.isAdmin) {
      const customCategories = await Category.find().populate('createdBy', 'name email');
      
      const categoriesWithDetails = [
        ...defaultCategories.map(name => ({ name, isDefault: true })),
        ...customCategories.map(cat => ({ 
          name: cat.name, 
          isDefault: false,
          _id: cat._id,
          createdBy: cat.createdBy,
          createdAt: cat.createdAt
        }))
      ].sort((a, b) => a.name.localeCompare(b.name));
      
      return res.json(categoriesWithDetails);
    }

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
// @desc    Create a new category (Admin only)
// @access  Private/Admin
router.post('/', protect, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(400).json({ message: 'Invalid category' });
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

// @route   DELETE /api/categories/:name
// @desc    Delete a category (Admin only)
// @access  Private/Admin
router.delete('/:name', protect, async (req, res) => {
  try {
    const { name } = req.params;

    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    // Reassign all expenses with this category to "Uncategorized"
    await Expense.updateMany(
      { category: { $regex: new RegExp(`^${name}$`, 'i') } },
      { $set: { category: 'Uncategorized' } }
    );

    // Delete the category
    const result = await Category.deleteOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
