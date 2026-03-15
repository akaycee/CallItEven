const express = require('express');
const { protect } = require('../middleware/auth');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const { expandRecurringIncome } = require('../utils/helpers');

const router = express.Router();

// @route   GET /api/cashflow
// @desc    Get cash flow summary (income vs expenses) for a given date range
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // Determine date range from query params or default to current month
    let startDate, endDate;
    if (req.query.startDate && req.query.endDate) {
      startDate = new Date(req.query.startDate + 'T00:00:00.000Z');
      endDate = new Date(req.query.endDate + 'T23:59:59.999Z');
    } else {
      const now = new Date();
      startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
    }

    const groupFilter = req.query.group || null;

    // --- Fetch income ---
    const incomeQuery = { user: req.user._id };
    if (groupFilter) incomeQuery.group = groupFilter;

    // Non-recurring within range
    const nonRecurringIncome = await Income.find({
      ...incomeQuery,
      isRecurring: { $ne: true },
      date: { $gte: startDate, $lte: endDate }
    });

    // Recurring that started before range end
    const recurringIncome = await Income.find({
      ...incomeQuery,
      isRecurring: true,
      date: { $lte: endDate }
    });

    const expandedRecurring = recurringIncome.flatMap(inc =>
      expandRecurringIncome(inc, startDate, endDate)
    );

    const allIncome = [
      ...nonRecurringIncome.map(i => i.toObject()),
      ...expandedRecurring
    ];

    // --- Fetch expenses ---
    const expenseQuery = {
      'splits.user': req.user._id,
      createdAt: { $gte: startDate, $lte: endDate },
      category: { $not: /^Settlement/ }
    };
    if (groupFilter) expenseQuery.group = groupFilter;

    const expenses = await Expense.find(expenseQuery);

    // --- Aggregate income by source ---
    const incomeBySource = {};
    allIncome.forEach(inc => {
      const key = inc.source || 'Other';
      incomeBySource[key] = (incomeBySource[key] || 0) + inc.amount;
    });

    // --- Aggregate expenses by category (user's share) ---
    const expensesByCategory = {};
    let totalExpenses = 0;
    expenses.forEach(expense => {
      const category = expense.category || 'Uncategorized';
      const userSplit = expense.splits.find(
        s => s.user.toString() === req.user._id.toString()
      );
      const userAmount = userSplit ? userSplit.amount : 0;
      expensesByCategory[category] = (expensesByCategory[category] || 0) + userAmount;
      totalExpenses += userAmount;
    });

    const totalIncome = allIncome.reduce((sum, inc) => sum + inc.amount, 0);
    const netSavings = totalIncome - totalExpenses;

    // --- Monthly breakdown ---
    const monthlyMap = {};
    
    // Initialize months within range
    const current = new Date(startDate);
    while (current <= endDate) {
      const key = `${current.getUTCFullYear()}-${String(current.getUTCMonth() + 1).padStart(2, '0')}`;
      monthlyMap[key] = { month: key, income: 0, expenses: 0, net: 0 };
      current.setUTCMonth(current.getUTCMonth() + 1);
    }

    // Fill in income
    allIncome.forEach(inc => {
      const d = new Date(inc.date);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap[key]) {
        monthlyMap[key].income += inc.amount;
      }
    });

    // Fill in expenses
    expenses.forEach(expense => {
      const d = new Date(expense.createdAt);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap[key]) {
        const userSplit = expense.splits.find(
          s => s.user.toString() === req.user._id.toString()
        );
        monthlyMap[key].expenses += userSplit ? userSplit.amount : 0;
      }
    });

    // Calculate net for each month
    const monthly = Object.values(monthlyMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(m => ({
        ...m,
        income: parseFloat(m.income.toFixed(2)),
        expenses: parseFloat(m.expenses.toFixed(2)),
        net: parseFloat((m.income - m.expenses).toFixed(2))
      }));

    res.json({
      incomeBySource: Object.entries(incomeBySource).map(([source, total]) => ({
        source,
        total: parseFloat(total.toFixed(2))
      })),
      expensesByCategory: Object.entries(expensesByCategory).map(([category, total]) => ({
        category,
        total: parseFloat(total.toFixed(2))
      })),
      totalIncome: parseFloat(totalIncome.toFixed(2)),
      totalExpenses: parseFloat(totalExpenses.toFixed(2)),
      netSavings: parseFloat(netSavings.toFixed(2)),
      monthly
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
