const request = require('supertest');
require('../setup');
const app = require('../../app');
const Income = require('../../models/Income');
const Expense = require('../../models/Expense');
const { createTestUser } = require('../helpers');

describe('Cash Flow Routes', () => {
  let user, token;

  beforeEach(async () => {
    const result = await createTestUser();
    user = result.user;
    token = result.token;
  });

  describe('GET /api/cashflow', () => {
    it('should return cash flow summary for date range', async () => {
      // Create income
      await Income.create({
        user: user._id,
        source: 'Salary',
        amount: 5000,
        date: new Date('2026-03-01'),
      });
      await Income.create({
        user: user._id,
        source: 'Freelance',
        amount: 1000,
        date: new Date('2026-03-15'),
      });

      // Create expense
      await Expense.create({
        description: 'Groceries',
        totalAmount: 200,
        paidBy: user._id,
        splitType: 'equal',
        splits: [{ user: user._id, amount: 200 }],
        createdBy: user._id,
        category: 'Groceries',
        isPersonal: true,
        date: new Date('2026-03-10'),
        createdAt: new Date('2026-03-10'),
      });

      const res = await request(app)
        .get('/api/cashflow?startDate=2026-03-01&endDate=2026-03-31')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.totalIncome).toBe(6000);
      expect(res.body.totalExpenses).toBe(200);
      expect(res.body.netSavings).toBe(5800);
      expect(res.body.incomeBySource).toHaveLength(2);
      expect(res.body.expensesByCategory).toHaveLength(1);
      expect(res.body.monthly).toHaveLength(1);
      expect(res.body.monthly[0].month).toBe('2026-03');
    });

    it('should include recurring income in cash flow', async () => {
      await Income.create({
        user: user._id,
        source: 'Salary',
        amount: 5000,
        date: new Date('2026-01-01'),
        isRecurring: true,
        recurrence: { frequency: 'monthly' },
      });

      const res = await request(app)
        .get('/api/cashflow?startDate=2026-01-01&endDate=2026-03-31')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.totalIncome).toBe(15000); // 3 months × 5000
      expect(res.body.monthly).toHaveLength(3);
    });

    it('should default to current month if no date range', async () => {
      const res = await request(app)
        .get('/api/cashflow')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalIncome');
      expect(res.body).toHaveProperty('totalExpenses');
      expect(res.body).toHaveProperty('netSavings');
      expect(res.body).toHaveProperty('incomeBySource');
      expect(res.body).toHaveProperty('expensesByCategory');
      expect(res.body).toHaveProperty('monthly');
    });

    it('should only include user share of split expenses', async () => {
      const user2 = await createTestUser({ email: 'user2@example.com' });

      await Expense.create({
        description: 'Dinner',
        totalAmount: 100,
        paidBy: user._id,
        splitType: 'equal',
        splits: [
          { user: user._id, amount: 50 },
          { user: user2.user._id, amount: 50 },
        ],
        createdBy: user._id,
        category: 'Food & Dining',
        date: new Date('2026-03-10'),
        createdAt: new Date('2026-03-10'),
      });

      const res = await request(app)
        .get('/api/cashflow?startDate=2026-03-01&endDate=2026-03-31')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.totalExpenses).toBe(50);
    });

    it('should exclude settlement expenses', async () => {
      await Expense.create({
        description: 'Settlement',
        totalAmount: 100,
        paidBy: user._id,
        splitType: 'equal',
        splits: [{ user: user._id, amount: 100 }],
        createdBy: user._id,
        category: 'Settlement - Venmo',
        isPersonal: true,
        date: new Date('2026-03-10'),
        createdAt: new Date('2026-03-10'),
      });

      const res = await request(app)
        .get('/api/cashflow?startDate=2026-03-01&endDate=2026-03-31')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.totalExpenses).toBe(0);
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app).get('/api/cashflow');
      expect(res.status).toBe(401);
    });

    it('should return empty data when no income or expenses', async () => {
      const res = await request(app)
        .get('/api/cashflow?startDate=2026-03-01&endDate=2026-03-31')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.totalIncome).toBe(0);
      expect(res.body.totalExpenses).toBe(0);
      expect(res.body.netSavings).toBe(0);
      expect(res.body.incomeBySource).toHaveLength(0);
      expect(res.body.expensesByCategory).toHaveLength(0);
    });
  });
});
