const express = require('express');
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const { protect } = require('../middleware/auth');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const { parseDateRange, fetchIncomeWithRecurring } = require('../utils/helpers');

const router = express.Router();

// @route   GET /api/cashflow
// @desc    Get cash flow summary (income vs expenses) for a given date range
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // Determine date range from query params or default to current month
    const { startDate, endDate } = parseDateRange(req.query);

    const groupFilter = req.query.group || null;

    // --- Fetch income ---
    const incomeQuery = { user: req.user._id };
    if (groupFilter) incomeQuery.group = groupFilter;

    const allIncome = await fetchIncomeWithRecurring(Income, incomeQuery, startDate, endDate);

    // --- Fetch expenses via aggregation pipeline ---
    const expenseMatch = {
      'splits.user': req.user._id,
      createdAt: { $gte: startDate, $lte: endDate },
      category: { $not: /^Settlement/ }
    };
    if (groupFilter) expenseMatch.group = new mongoose.Types.ObjectId(groupFilter);

    const expenseAgg = await Expense.aggregate([
      { $match: expenseMatch },
      { $unwind: '$splits' },
      { $match: { 'splits.user': req.user._id } },
      {
        $facet: {
          byCategory: [
            {
              $group: {
                _id: { $ifNull: ['$category', 'Uncategorized'] },
                total: { $sum: '$splits.amount' }
              }
            }
          ],
          byMonth: [
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' }
                },
                total: { $sum: '$splits.amount' }
              }
            }
          ],
          total: [
            { $group: { _id: null, total: { $sum: '$splits.amount' } } }
          ]
        }
      }
    ]);

    const facetResult = expenseAgg[0];

    // --- Aggregate income by source ---
    const incomeBySource = {};
    allIncome.forEach(inc => {
      const key = inc.source || 'Other';
      incomeBySource[key] = (incomeBySource[key] || 0) + inc.amount;
    });

    // --- Extract expense aggregation results ---
    const expensesByCategory = {};
    facetResult.byCategory.forEach(item => {
      expensesByCategory[item._id] = item.total;
    });
    const totalExpenses = facetResult.total.length > 0 ? facetResult.total[0].total : 0;

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

    // Fill in expenses (from aggregation)
    facetResult.byMonth.forEach(item => {
      const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
      if (monthlyMap[key]) {
        monthlyMap[key].expenses += item.total;
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
    logger.error({ err: error }, error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
