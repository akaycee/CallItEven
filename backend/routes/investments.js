const express = require('express');
const logger = require('../utils/logger');
const { body, param, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const Investment = require('../models/Investment');
const User = require('../models/User');
const FamilyGroup = require('../models/FamilyGroup');
const { parsePagination } = require('../utils/helpers');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const router = express.Router();

/**
 * Get family member IDs for the current user.
 */
async function getFamilyMemberIds(userId) {
  const user = await User.findById(userId).select('familyGroup').lean();
  if (!user?.familyGroup) return null;
  const family = await FamilyGroup.findById(user.familyGroup).lean();
  return family ? family.members : null;
}

// @route   GET /api/investments/lookup/:symbol
// @desc    Verify a stock ticker and return quote info
// @access  Private
router.get('/lookup/:symbol', [
  protect,
  param('symbol').trim().matches(/^[A-Za-z0-9.\-]{1,10}$/).withMessage('Invalid ticker symbol'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const symbol = req.params.symbol.toUpperCase();
    const quote = await yahooFinance.quote(symbol);

    if (!quote || !quote.regularMarketPrice) {
      return res.status(404).json({ message: 'Ticker not found' });
    }

    const result = {
      symbol: quote.symbol,
      name: quote.shortName || quote.longName || quote.symbol,
      price: quote.regularMarketPrice,
      exchange: quote.fullExchangeName || quote.exchange || '',
      currency: quote.currency || 'USD',
    };

    // If a date is provided, fetch historical closing price
    if (req.query.date) {
      try {
        const dateStr = req.query.date;
        const d = new Date(dateStr);
        const nextDay = new Date(d);
        nextDay.setDate(nextDay.getDate() + 5); // window of 5 days to handle weekends/holidays
        const chart = await yahooFinance.chart(symbol, {
          period1: dateStr,
          period2: nextDay.toISOString().split('T')[0],
          interval: '1d',
        });
        if (chart && chart.quotes && chart.quotes.length > 0) {
          result.historicalPrice = chart.quotes[0].close;
          result.historicalDate = chart.quotes[0].date;
        }
      } catch (histErr) {
        logger.warn({ err: histErr }, `Historical price lookup failed for ${symbol} on ${req.query.date}`);
        // Non-fatal: return current price without historical
      }
    }

    res.json(result);
  } catch (error) {
    logger.error({ err: error }, `Ticker lookup failed for ${req.params.symbol}`);
    return res.status(404).json({ message: 'Ticker not found' });
  }
});

// @route   PUT /api/investments/refresh-prices
// @desc    Refresh current values for all ticker-based investments
// @access  Private
router.put('/refresh-prices', protect, async (req, res) => {
  try {
    const investments = await Investment.find({
      user: req.user._id,
      ticker: { $ne: null, $exists: true, $nin: [''] }
    });

    if (investments.length === 0) {
      return res.json({ updated: 0, investments: [] });
    }

    const results = await Promise.allSettled(
      investments.map(async (inv) => {
        const quote = await yahooFinance.quote(inv.ticker);
        if (quote && quote.regularMarketPrice) {
          inv.currentValue = quote.regularMarketPrice;
          inv.lastPriceUpdate = new Date();
          await inv.save();
          return inv;
        }
        throw new Error(`No price for ${inv.ticker}`);
      })
    );

    const updated = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    const failed = results.filter(r => r.status === 'rejected').length;

    res.json({
      updated: updated.length,
      failed,
      investments: updated,
    });
  } catch (error) {
    logger.error({ err: error }, error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/investments
// @desc    Create a new investment
// @access  Private
router.post('/', [
  protect,
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('type').isIn(['stocks', 'bonds', 'real_estate', 'crypto', 'mutual_fund', 'etf', 'savings_account', 'espp', 'other']).withMessage('Invalid investment type'),
  body('purchasePrice').isFloat({ min: 0 }).withMessage('Purchase price must be >= 0'),
  body('currentValue').isFloat({ min: 0 }).withMessage('Current value must be >= 0'),
  body('purchaseDate').notEmpty().withMessage('Purchase date is required'),
  body('ticker').optional({ values: 'null' }).trim().matches(/^[A-Za-z0-9.\-]{1,10}$/).withMessage('Invalid ticker symbol'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, type, purchasePrice, currentValue, quantity, purchaseDate, description, tag, group, hideFromFamily, ticker, account, interestRate, offeringDate, esppDiscount } = req.body;

    const investment = await Investment.create({
      user: req.user._id,
      name,
      type,
      purchasePrice,
      currentValue,
      quantity: quantity || 1,
      purchaseDate: new Date(purchaseDate),
      description: description || '',
      tag: tag || '',
      group: group || undefined,
      hideFromFamily: !!hideFromFamily,
      ticker: ticker || null,
      lastPriceUpdate: ticker ? new Date() : null,
      account: account || 'taxable',
      interestRate: interestRate != null ? interestRate : null,
      offeringDate: offeringDate ? new Date(offeringDate) : null,
      esppDiscount: esppDiscount != null ? esppDiscount : null,
    });

    res.status(201).json(investment);
  } catch (error) {
    logger.error({ err: error }, error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/investments
// @desc    Get all investments (supports ?household=true, ?type=...)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let filter;

    if (req.query.household === 'true') {
      const familyMemberIds = await getFamilyMemberIds(req.user._id);
      if (!familyMemberIds) {
        return res.status(400).json({ message: 'You are not in a family group' });
      }
      filter = { user: { $in: familyMemberIds }, hideFromFamily: { $ne: true } };
    } else {
      filter = { user: req.user._id };
    }

    if (req.query.type) {
      filter.type = req.query.type;
    }

    if (req.query.account) {
      filter.account = req.query.account;
    }

    const { page, limit, skip } = parsePagination(req.query);

    let query = Investment.find(filter).sort({ createdAt: -1 }).lean();

    if (limit > 0) {
      const total = await Investment.countDocuments(filter);
      query = query.skip(skip).limit(limit);
      res.set('X-Total-Count', total.toString());
    }

    const investments = await query;
    res.json(investments);
  } catch (error) {
    logger.error({ err: error }, error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/investments/summary
// @desc    Get portfolio summary
// @access  Private
router.get('/summary', protect, async (req, res) => {
  try {
    let filter;

    if (req.query.household === 'true') {
      const familyMemberIds = await getFamilyMemberIds(req.user._id);
      if (!familyMemberIds) {
        return res.status(400).json({ message: 'You are not in a family group' });
      }
      filter = { user: { $in: familyMemberIds }, hideFromFamily: { $ne: true } };
    } else {
      filter = { user: req.user._id };
    }

    const investments = await Investment.find(filter).lean();

    const totalInvested = investments.reduce((sum, inv) => sum + (inv.purchasePrice * (inv.quantity || 1)), 0);
    const currentValue = investments.reduce((sum, inv) => sum + (inv.currentValue * (inv.quantity || 1)), 0);
    const gainLoss = currentValue - totalInvested;
    const gainLossPercent = totalInvested > 0 ? ((gainLoss / totalInvested) * 100) : 0;

    // Breakdown by type
    const byType = {};
    investments.forEach(inv => {
      if (!byType[inv.type]) {
        byType[inv.type] = { totalInvested: 0, currentValue: 0, count: 0 };
      }
      byType[inv.type].totalInvested += inv.purchasePrice * (inv.quantity || 1);
      byType[inv.type].currentValue += inv.currentValue * (inv.quantity || 1);
      byType[inv.type].count += 1;
    });

    res.json({
      totalInvested: parseFloat(totalInvested.toFixed(2)),
      currentValue: parseFloat(currentValue.toFixed(2)),
      gainLoss: parseFloat(gainLoss.toFixed(2)),
      gainLossPercent: parseFloat(gainLossPercent.toFixed(2)),
      count: investments.length,
      byType: Object.entries(byType).map(([type, data]) => ({
        type,
        totalInvested: parseFloat(data.totalInvested.toFixed(2)),
        currentValue: parseFloat(data.currentValue.toFixed(2)),
        gainLoss: parseFloat((data.currentValue - data.totalInvested).toFixed(2)),
        count: data.count
      }))
    });
  } catch (error) {
    logger.error({ err: error }, error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/investments/:id
// @desc    Get a single investment
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const investment = await Investment.findById(req.params.id).lean();

    if (!investment) {
      return res.status(404).json({ message: 'Investment not found' });
    }

    if (investment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(investment);
  } catch (error) {
    logger.error({ err: error }, error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/investments/:id
// @desc    Update an investment (owner only)
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const investment = await Investment.findById(req.params.id);

    if (!investment) {
      return res.status(404).json({ message: 'Investment not found' });
    }

    if (investment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this investment' });
    }

    const { name, type, purchasePrice, currentValue, quantity, purchaseDate, description, tag, group, hideFromFamily, ticker, lastPriceUpdate, account, interestRate, offeringDate, esppDiscount } = req.body;

    if (name !== undefined) investment.name = name;
    if (type !== undefined) investment.type = type;
    if (purchasePrice !== undefined) investment.purchasePrice = purchasePrice;
    if (currentValue !== undefined) investment.currentValue = currentValue;
    if (quantity !== undefined) investment.quantity = quantity;
    if (purchaseDate !== undefined) investment.purchaseDate = new Date(purchaseDate);
    if (description !== undefined) investment.description = description;
    if (tag !== undefined) investment.tag = tag;
    if (group !== undefined) investment.group = group || undefined;
    if (hideFromFamily !== undefined) investment.hideFromFamily = !!hideFromFamily;
    if (ticker !== undefined) investment.ticker = ticker || null;
    if (lastPriceUpdate !== undefined) investment.lastPriceUpdate = lastPriceUpdate;
    if (account !== undefined) investment.account = account;
    if (interestRate !== undefined) investment.interestRate = interestRate;
    if (offeringDate !== undefined) investment.offeringDate = offeringDate ? new Date(offeringDate) : null;
    if (esppDiscount !== undefined) investment.esppDiscount = esppDiscount;

    await investment.save();
    res.json(investment);
  } catch (error) {
    logger.error({ err: error }, error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/investments/:id
// @desc    Delete an investment (owner only)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const investment = await Investment.findById(req.params.id);

    if (!investment) {
      return res.status(404).json({ message: 'Investment not found' });
    }

    if (investment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this investment' });
    }

    await investment.deleteOne();
    res.json({ message: 'Investment deleted successfully' });
  } catch (error) {
    logger.error({ err: error }, error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
