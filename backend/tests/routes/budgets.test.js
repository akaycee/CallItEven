const request = require('supertest');
const app = require('../../app');
const Budget = require('../../models/Budget');
const Expense = require('../../models/Expense');
const Category = require('../../models/Category');
const { createTestUser, createAdminUser } = require('../helpers');

require('../setup');

describe('Budget Routes', () => {
  let user1, token1, user2, token2;

  beforeEach(async () => {
    ({ user: user1, token: token1 } = await createTestUser({ email: 'user1@example.com', name: 'User One' }));
    ({ user: user2, token: token2 } = await createTestUser({ email: 'user2@example.com', name: 'User Two' }));
  });

  describe('POST /api/budgets', () => {
    it('should create a budget for a valid category', async () => {
      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${token1}`)
        .send({ category: 'Food & Dining', amount: 500 });

      expect(res.status).toBe(201);
      expect(res.body.category).toBe('Food & Dining');
      expect(res.body.amount).toBe(500);
      expect(res.body.user).toBe(user1._id.toString());
    });

    it('should return 400 for missing category', async () => {
      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${token1}`)
        .send({ amount: 500 });

      expect(res.status).toBe(400);
    });

    it('should return 400 for missing amount', async () => {
      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${token1}`)
        .send({ category: 'Food & Dining' });

      expect(res.status).toBe(400);
    });

    it('should return 400 for zero amount', async () => {
      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${token1}`)
        .send({ category: 'Food & Dining', amount: 0 });

      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid category', async () => {
      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${token1}`)
        .send({ category: 'Nonexistent Category', amount: 500 });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid category');
    });

    it('should return 400 for duplicate budget', async () => {
      await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${token1}`)
        .send({ category: 'Food & Dining', amount: 500 });

      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${token1}`)
        .send({ category: 'Food & Dining', amount: 300 });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Budget already exists for this category');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .post('/api/budgets')
        .send({ category: 'Food & Dining', amount: 500 });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/budgets', () => {
    beforeEach(async () => {
      await Budget.create({ user: user1._id, category: 'Food & Dining', amount: 500 });
      await Budget.create({ user: user1._id, category: 'Transportation', amount: 200 });
      await Budget.create({ user: user2._id, category: 'Shopping', amount: 300 });
    });

    it('should return only the current user\'s budgets', async () => {
      const res = await request(app)
        .get('/api/budgets')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body.every(b => b.user === user1._id.toString())).toBe(true);
    });

    it('should return budgets sorted by category', async () => {
      const res = await request(app)
        .get('/api/budgets')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.body[0].category).toBe('Food & Dining');
      expect(res.body[1].category).toBe('Transportation');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/budgets');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/budgets/:id', () => {
    let budget;

    beforeEach(async () => {
      budget = await Budget.create({ user: user1._id, category: 'Food & Dining', amount: 500 });
    });

    it('should update budget amount', async () => {
      const res = await request(app)
        .put(`/api/budgets/${budget._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ amount: 750 });

      expect(res.status).toBe(200);
      expect(res.body.amount).toBe(750);
    });

    it('should return 404 for non-existent budget', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .put(`/api/budgets/${fakeId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ amount: 750 });

      expect(res.status).toBe(404);
    });

    it('should return 403 for non-owner', async () => {
      const res = await request(app)
        .put(`/api/budgets/${budget._id}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ amount: 750 });

      expect(res.status).toBe(403);
    });

    it('should return 400 for invalid amount', async () => {
      const res = await request(app)
        .put(`/api/budgets/${budget._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ amount: 0 });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/budgets/:id', () => {
    let budget;

    beforeEach(async () => {
      budget = await Budget.create({ user: user1._id, category: 'Food & Dining', amount: 500 });
    });

    it('should delete a budget', async () => {
      const res = await request(app)
        .delete(`/api/budgets/${budget._id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Budget deleted successfully');

      const found = await Budget.findById(budget._id);
      expect(found).toBeNull();
    });

    it('should return 404 for non-existent budget', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .delete(`/api/budgets/${fakeId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(404);
    });

    it('should return 403 for non-owner', async () => {
      const res = await request(app)
        .delete(`/api/budgets/${budget._id}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/budgets/summary', () => {
    it('should return empty array when no budgets exist', async () => {
      const res = await request(app)
        .get('/api/budgets/summary')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should return budget summary with correct spending from personal expenses', async () => {
      // Create a budget
      await Budget.create({ user: user1._id, category: 'Food & Dining', amount: 500 });

      // Create a personal expense
      await Expense.create({
        description: 'Solo lunch',
        totalAmount: 30,
        paidBy: user1._id,
        splitType: 'equal',
        splits: [{ user: user1._id, amount: 30, percentage: 100 }],
        createdBy: user1._id,
        category: 'Food & Dining',
        isPersonal: true,
      });

      const res = await request(app)
        .get('/api/budgets/summary')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].category).toBe('Food & Dining');
      expect(res.body[0].budgetAmount).toBe(500);
      expect(res.body[0].spentAmount).toBe(30);
    });

    it('should include user share of shared expenses in budget', async () => {
      // Create a budget
      await Budget.create({ user: user1._id, category: 'Food & Dining', amount: 500 });

      // Create a personal expense ($30)
      await Expense.create({
        description: 'Solo lunch',
        totalAmount: 30,
        paidBy: user1._id,
        splitType: 'equal',
        splits: [{ user: user1._id, amount: 30, percentage: 100 }],
        createdBy: user1._id,
        category: 'Food & Dining',
        isPersonal: true,
      });

      // Create a shared expense ($100 split equally → user1's share = $50)
      await Expense.create({
        description: 'Group dinner',
        totalAmount: 100,
        paidBy: user1._id,
        splitType: 'equal',
        splits: [
          { user: user1._id, amount: 50, percentage: 50 },
          { user: user2._id, amount: 50, percentage: 50 },
        ],
        createdBy: user1._id,
        category: 'Food & Dining',
      });

      const res = await request(app)
        .get('/api/budgets/summary')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body[0].spentAmount).toBe(80); // 30 + 50
    });

    it('should not include settlement expenses in budget summary', async () => {
      await Budget.create({ user: user1._id, category: 'Settlement - Cash', amount: 500 });

      await Expense.create({
        description: 'Settlement with User Two',
        totalAmount: 50,
        paidBy: user1._id,
        splitType: 'unequal',
        splits: [
          { user: user1._id, amount: 0 },
          { user: user2._id, amount: 50 },
        ],
        createdBy: user1._id,
        category: 'Settlement - Cash',
      });

      const res = await request(app)
        .get('/api/budgets/summary')
        .set('Authorization', `Bearer ${token1}`);

      // Settlement expenses are excluded from the aggregation
      expect(res.body[0].spentAmount).toBe(0);
    });

    it('should only count expenses from the current month', async () => {
      await Budget.create({ user: user1._id, category: 'Food & Dining', amount: 500 });

      // Current month expense
      await Expense.create({
        description: 'Recent lunch',
        totalAmount: 30,
        paidBy: user1._id,
        splitType: 'equal',
        splits: [{ user: user1._id, amount: 30, percentage: 100 }],
        createdBy: user1._id,
        category: 'Food & Dining',
        isPersonal: true,
      });

      // Old expense (last year)
      await Expense.create({
        description: 'Old lunch',
        totalAmount: 100,
        paidBy: user1._id,
        splitType: 'equal',
        splits: [{ user: user1._id, amount: 100, percentage: 100 }],
        createdBy: user1._id,
        category: 'Food & Dining',
        isPersonal: true,
        date: new Date('2024-01-15'),
        createdAt: new Date('2024-01-15'),
      });

      const res = await request(app)
        .get('/api/budgets/summary')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.body[0].spentAmount).toBe(30); // Only the current month expense
    });
  });
});
