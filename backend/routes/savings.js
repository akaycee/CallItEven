const express = require('express');
const logger = require('../utils/logger');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const SavingsGoal = require('../models/SavingsGoal');
const User = require('../models/User');
const FamilyGroup = require('../models/FamilyGroup');

const router = express.Router();

// @route   POST /api/savings
// @desc    Create a new savings goal
// @access  Private
router.post('/', [
  protect,
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('targetAmount').isFloat({ min: 0.01 }).withMessage('Target amount must be greater than 0'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, targetAmount, currentAmount, deadline, category, isFamilyGoal, familyGroup, description } = req.body;

    const goal = await SavingsGoal.create({
      user: req.user._id,
      name,
      targetAmount,
      currentAmount: currentAmount || 0,
      deadline: deadline ? new Date(deadline) : undefined,
      category: category || 'General',
      isFamilyGoal: !!isFamilyGoal,
      familyGroup: isFamilyGoal ? familyGroup : undefined,
      description: description || ''
    });

    res.status(201).json(goal);
  } catch (error) {
    logger.error({ err: error }, error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/savings
// @desc    Get all savings goals (supports ?household=true)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let filter;

    if (req.query.household === 'true') {
      const currentUser = await User.findById(req.user._id).select('familyGroup').lean();
      if (!currentUser?.familyGroup) {
        return res.status(400).json({ message: 'You are not in a family group' });
      }
      const family = await FamilyGroup.findById(currentUser.familyGroup).lean();
      if (!family) {
        return res.status(400).json({ message: 'Family group not found' });
      }
      filter = {
        $or: [
          { user: { $in: family.members } },
          { isFamilyGoal: true, familyGroup: currentUser.familyGroup }
        ]
      };
    } else {
      filter = { user: req.user._id };
    }

    const goals = await SavingsGoal.find(filter).sort({ createdAt: -1 }).lean();

    // Add virtual fields to lean results
    const goalsWithVirtuals = goals.map(g => ({
      ...g,
      progress: g.targetAmount === 0 ? 100 : Math.min(100, (g.currentAmount / g.targetAmount) * 100),
      remaining: Math.max(0, g.targetAmount - g.currentAmount),
      isComplete: g.currentAmount >= g.targetAmount
    }));

    res.json(goalsWithVirtuals);
  } catch (error) {
    logger.error({ err: error }, error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/savings/summary
// @desc    Get savings summary
// @access  Private
router.get('/summary', protect, async (req, res) => {
  try {
    let filter;

    if (req.query.household === 'true') {
      const currentUser = await User.findById(req.user._id).select('familyGroup').lean();
      if (!currentUser?.familyGroup) {
        return res.status(400).json({ message: 'You are not in a family group' });
      }
      const family = await FamilyGroup.findById(currentUser.familyGroup).lean();
      if (!family) {
        return res.status(400).json({ message: 'Family group not found' });
      }
      filter = {
        $or: [
          { user: { $in: family.members } },
          { isFamilyGoal: true, familyGroup: currentUser.familyGroup }
        ]
      };
    } else {
      filter = { user: req.user._id };
    }

    const goals = await SavingsGoal.find(filter).lean();

    const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const completedCount = goals.filter(g => g.currentAmount >= g.targetAmount).length;
    const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

    // Find nearest deadline
    const goalsWithDeadline = goals.filter(g => g.deadline && g.currentAmount < g.targetAmount);
    goalsWithDeadline.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    const nearestDeadline = goalsWithDeadline.length > 0 ? goalsWithDeadline[0] : null;

    res.json({
      totalSaved: parseFloat(totalSaved.toFixed(2)),
      totalTarget: parseFloat(totalTarget.toFixed(2)),
      goalCount: goals.length,
      completedCount,
      overallProgress: parseFloat(overallProgress.toFixed(2)),
      nearestDeadline: nearestDeadline ? {
        name: nearestDeadline.name,
        deadline: nearestDeadline.deadline,
        remaining: Math.max(0, nearestDeadline.targetAmount - nearestDeadline.currentAmount)
      } : null
    });
  } catch (error) {
    logger.error({ err: error }, error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/savings/:id
// @desc    Update a savings goal
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const goal = await SavingsGoal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ message: 'Savings goal not found' });
    }

    // Owner or family member for family goals
    const isOwner = goal.user.toString() === req.user._id.toString();
    let isFamilyMember = false;
    if (goal.isFamilyGoal && goal.familyGroup) {
      const family = await FamilyGroup.findById(goal.familyGroup).lean();
      isFamilyMember = family && family.members.some(m => m.toString() === req.user._id.toString());
    }

    if (!isOwner && !isFamilyMember) {
      return res.status(403).json({ message: 'Not authorized to update this savings goal' });
    }

    const { name, targetAmount, currentAmount, deadline, category, isFamilyGoal, familyGroup, description } = req.body;

    if (name !== undefined) goal.name = name;
    if (targetAmount !== undefined) goal.targetAmount = targetAmount;
    if (currentAmount !== undefined) goal.currentAmount = currentAmount;
    if (deadline !== undefined) goal.deadline = deadline ? new Date(deadline) : undefined;
    if (category !== undefined) goal.category = category;
    if (isFamilyGoal !== undefined) goal.isFamilyGoal = !!isFamilyGoal;
    if (familyGroup !== undefined) goal.familyGroup = familyGroup || undefined;
    if (description !== undefined) goal.description = description;

    await goal.save();
    res.json(goal);
  } catch (error) {
    logger.error({ err: error }, error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/savings/:id/contribute
// @desc    Add contribution to savings goal
// @access  Private
router.put('/:id/contribute', [
  protect,
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const goal = await SavingsGoal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ message: 'Savings goal not found' });
    }

    // Owner or family member for family goals
    const isOwner = goal.user.toString() === req.user._id.toString();
    let isFamilyMember = false;
    if (goal.isFamilyGoal && goal.familyGroup) {
      const family = await FamilyGroup.findById(goal.familyGroup).lean();
      isFamilyMember = family && family.members.some(m => m.toString() === req.user._id.toString());
    }

    if (!isOwner && !isFamilyMember) {
      return res.status(403).json({ message: 'Not authorized to contribute to this savings goal' });
    }

    goal.currentAmount += req.body.amount;
    await goal.save();

    const result = goal.toObject();
    result.progress = goal.targetAmount === 0 ? 100 : Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
    result.remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
    result.isComplete = goal.currentAmount >= goal.targetAmount;

    res.json(result);
  } catch (error) {
    logger.error({ err: error }, error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/savings/:id
// @desc    Delete a savings goal (owner only)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const goal = await SavingsGoal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ message: 'Savings goal not found' });
    }

    if (goal.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this savings goal' });
    }

    await goal.deleteOne();
    res.json({ message: 'Savings goal deleted successfully' });
  } catch (error) {
    logger.error({ err: error }, error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
