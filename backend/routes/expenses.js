const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const Expense = require('../models/Expense');
const User = require('../models/User');
const { validateExpenseUsers, calculateSplits, parsePagination } = require('../utils/helpers');

const router = express.Router();

// @route   POST /api/expenses
// @desc    Create a new expense
// @access  Private
router.post('/', [
  protect,
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('totalAmount').isFloat({ min: 0.01 }).withMessage('Total amount must be greater than 0'),
  body('paidBy').notEmpty().withMessage('Paid by user is required'),
  body('splitType').isIn(['equal', 'percentage', 'unequal']).withMessage('Invalid split type'),
  body('splits').isArray({ min: 1 }).withMessage('At least one split is required')
], async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { description, totalAmount, paidBy, splitType, splits, category, isPersonal, tag } = req.body;

    let calculatedSplits;

    if (isPersonal) {
      // Personal expense: auto-assign single split to the current user
      calculatedSplits = [{
        user: req.user._id,
        amount: parseFloat(totalAmount),
        percentage: 100
      }];
    } else {
      // Validate that paidBy and split users exist and are not admin
      const validation = await validateExpenseUsers(paidBy, splits, User);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.error });
      }

      // Calculate split amounts based on split type
      calculatedSplits = calculateSplits(totalAmount, splitType, splits);
    }

    // Create expense
    const expense = await Expense.create({
      description,
      totalAmount,
      paidBy: isPersonal ? req.user._id : paidBy,
      splitType: isPersonal ? 'equal' : splitType,
      splits: calculatedSplits,
      createdBy: req.user._id,
      category: category || 'Uncategorized',
      isPersonal: !!isPersonal,
      tag: tag || ''
    });

    // Populate user data
    await expense.populate('paidBy splits.user createdBy', 'name email');
    await expense.populate('group', 'name members');

    res.status(201).json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/expenses
// @desc    Get all expenses for the current user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const filter = {
      $or: [
        { createdBy: req.user._id },
        { paidBy: req.user._id },
        { 'splits.user': req.user._id }
      ]
    };
    const { page, limit, skip } = parsePagination(req.query);

    let query = Expense.find(filter)
      .populate('paidBy splits.user createdBy', 'name email')
      .populate('group', 'name members')
      .sort({ createdAt: -1 });

    if (limit > 0) {
      const total = await Expense.countDocuments(filter);
      query = query.skip(skip).limit(limit);
      res.set('X-Total-Count', total.toString());
    }

    const expenses = await query;
    res.json(expenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/expenses/personal
// @desc    Get all personal (non-split) expenses for the current user
// @access  Private
router.get('/personal', protect, async (req, res) => {
  try {
    const filter = {
      createdBy: req.user._id,
      isPersonal: true
    };
    const { page, limit, skip } = parsePagination(req.query);

    let query = Expense.find(filter)
      .populate('paidBy splits.user createdBy', 'name email')
      .sort({ createdAt: -1 });

    if (limit > 0) {
      const total = await Expense.countDocuments(filter);
      query = query.skip(skip).limit(limit);
      res.set('X-Total-Count', total.toString());
    }

    const expenses = await query;
    res.json(expenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/expenses/tagged
// @desc    Get all expenses where the current user is tagged (in splits)
// @access  Private
router.get('/tagged', protect, async (req, res) => {
  try {
    const filter = { 'splits.user': req.user._id };
    const { page, limit, skip } = parsePagination(req.query);

    let query = Expense.find(filter)
      .populate('paidBy splits.user createdBy', 'name email')
      .populate('group', 'name members')
      .sort({ createdAt: -1 });

    if (limit > 0) {
      const total = await Expense.countDocuments(filter);
      query = query.skip(skip).limit(limit);
      res.set('X-Total-Count', total.toString());
    }

    const expenses = await query;
    res.json(expenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/expenses/balance/summary
// @desc    Get balance summary for current user
// @access  Private
router.get('/balance/summary', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const summary = await Expense.aggregate([
      {
        $match: {
          $or: [
            { paidBy: userId },
            { 'splits.user': userId }
          ]
        }
      },
      { $unwind: '$splits' },
      {
        $addFields: {
          _isPayer: { $eq: ['$paidBy', userId] },
          _isSplitUser: { $eq: ['$splits.user', userId] }
        }
      },
      {
        $match: {
          $or: [
            { _isPayer: true, _isSplitUser: false },
            { _isPayer: false, _isSplitUser: true }
          ]
        }
      },
      {
        $addFields: {
          _otherUser: {
            $cond: { if: '$_isPayer', then: '$splits.user', else: '$paidBy' }
          },
          _flowAmount: {
            $cond: {
              if: '$_isPayer',
              then: '$splits.amount',
              else: { $multiply: ['$splits.amount', -1] }
            }
          }
        }
      },
      {
        $group: {
          _id: '$_otherUser',
          netAmount: { $sum: '$_flowAmount' }
        }
      },
      {
        $match: {
          $expr: { $gt: [{ $abs: '$netAmount' }, 0.01] }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          _id: 0,
          user: {
            _id: '$userInfo._id',
            name: '$userInfo.name',
            email: '$userInfo.email'
          },
          amount: { $round: [{ $abs: '$netAmount' }, 2] },
          type: {
            $cond: {
              if: { $gt: ['$netAmount', 0] },
              then: 'owes_you',
              else: 'you_owe'
            }
          }
        }
      }
    ]);

    res.json(summary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/expenses/:id
// @desc    Get a single expense by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('paidBy splits.user createdBy', 'name email')
    .populate('group', 'name members');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Check if user has access to this expense
    const hasAccess = expense.createdBy._id.equals(req.user._id) ||
                     expense.paidBy._id.equals(req.user._id) ||
                     expense.splits.some(split => split.user._id.equals(req.user._id));

    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to view this expense' });
    }

    res.json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/expenses/:id
// @desc    Update an expense
// @access  Private
router.put('/:id', [
  protect,
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('totalAmount').isFloat({ min: 0.01 }).withMessage('Total amount must be greater than 0'),
  body('paidBy').notEmpty().withMessage('Paid by user is required'),
  body('splitType').isIn(['equal', 'percentage', 'unequal']).withMessage('Invalid split type'),
  body('splits').isArray({ min: 1 }).withMessage('At least one split is required')
], async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Only creator can update the expense
    if (!expense.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this expense' });
    }

    const { description, totalAmount, paidBy, splitType, splits, category, isPersonal, tag } = req.body;

    let calculatedSplits;

    if (isPersonal) {
      // Personal expense: auto-assign single split to the current user
      calculatedSplits = [{
        user: req.user._id,
        amount: parseFloat(totalAmount),
        percentage: 100
      }];
    } else {
      // Validate that paidBy and split users exist and are not admin
      const validation = await validateExpenseUsers(paidBy, splits, User);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.error });
      }

      // Calculate split amounts based on split type
      calculatedSplits = calculateSplits(totalAmount, splitType, splits);
    }

    // Update expense fields
    expense.description = description;
    expense.totalAmount = totalAmount;
    expense.paidBy = isPersonal ? req.user._id : paidBy;
    expense.splitType = isPersonal ? 'equal' : splitType;
    expense.splits = calculatedSplits;
    expense.category = category || expense.category || 'Uncategorized';
    expense.isPersonal = !!isPersonal;
    if (tag !== undefined) expense.tag = tag;

    await expense.save();

    // Populate user data
    await expense.populate('paidBy splits.user createdBy', 'name email');
    await expense.populate('group', 'name members');

    res.json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete an expense
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Only creator can delete the expense
    if (!expense.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this expense' });
    }

    await expense.deleteOne();
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
