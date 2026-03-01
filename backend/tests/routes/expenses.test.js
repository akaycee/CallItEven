const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const Expense = require('../../models/Expense');
const { createTestUser, createAdminUser } = require('../helpers');

require('../setup');

describe('Expense Routes', () => {
  let user1, token1, user2, token2, user3;

  beforeEach(async () => {
    ({ user: user1, token: token1 } = await createTestUser({ email: 'user1@example.com', name: 'User One' }));
    ({ user: user2, token: token2 } = await createTestUser({ email: 'user2@example.com', name: 'User Two' }));
    user3 = (await createTestUser({ email: 'user3@example.com', name: 'User Three' })).user;
  });

  describe('POST /api/expenses', () => {
    it('should create an expense with equal split', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          description: 'Dinner',
          totalAmount: 100,
          paidBy: user1._id,
          splitType: 'equal',
          splits: [{ user: user1._id }, { user: user2._id }],
          category: 'Food & Dining',
        });

      expect(res.status).toBe(201);
      expect(res.body.description).toBe('Dinner');
      expect(res.body.totalAmount).toBe(100);
      expect(res.body.splitType).toBe('equal');
      expect(res.body.splits).toHaveLength(2);
      expect(res.body.splits[0].amount).toBe(50);
      expect(res.body.splits[1].amount).toBe(50);
      expect(res.body.category).toBe('Food & Dining');
    });

    it('should create an expense with percentage split', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          description: 'Rent',
          totalAmount: 200,
          paidBy: user1._id,
          splitType: 'percentage',
          splits: [
            { user: user1._id, percentage: 60 },
            { user: user2._id, percentage: 40 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.splits[0].amount).toBe(120);
      expect(res.body.splits[1].amount).toBe(80);
    });

    it('should create an expense with unequal split', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          description: 'Groceries',
          totalAmount: 100,
          paidBy: user1._id,
          splitType: 'unequal',
          splits: [
            { user: user1._id, amount: 70 },
            { user: user2._id, amount: 30 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.splits[0].amount).toBe(70);
      expect(res.body.splits[1].amount).toBe(30);
    });

    it('should return 400 for missing description', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          totalAmount: 100,
          paidBy: user1._id,
          splitType: 'equal',
          splits: [{ user: user1._id }, { user: user2._id }],
        });

      expect(res.status).toBe(400);
    });

    it('should return 400 for zero totalAmount', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          description: 'Test',
          totalAmount: 0,
          paidBy: user1._id,
          splitType: 'equal',
          splits: [{ user: user1._id }, { user: user2._id }],
        });

      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid split type', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          description: 'Test',
          totalAmount: 100,
          paidBy: user1._id,
          splitType: 'invalid',
          splits: [{ user: user1._id }, { user: user2._id }],
        });

      expect(res.status).toBe(400);
    });

    it('should return 400 when paidBy user is admin', async () => {
      const { user: adminUser } = await createAdminUser();

      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          description: 'Test',
          totalAmount: 100,
          paidBy: adminUser._id,
          splitType: 'equal',
          splits: [{ user: user1._id }, { user: user2._id }],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Admin users cannot be added to expenses');
    });

    it('should return 400 when split user is admin', async () => {
      const { user: adminUser } = await createAdminUser();

      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          description: 'Test',
          totalAmount: 100,
          paidBy: user1._id,
          splitType: 'equal',
          splits: [{ user: user1._id }, { user: adminUser._id }],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Admin users cannot be added to expenses');
    });

    it('should default category to Uncategorized', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          description: 'Test',
          totalAmount: 100,
          paidBy: user1._id,
          splitType: 'equal',
          splits: [{ user: user1._id }, { user: user2._id }],
        });

      expect(res.status).toBe(201);
      expect(res.body.category).toBe('Uncategorized');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .send({
          description: 'Test',
          totalAmount: 100,
          paidBy: user1._id,
          splitType: 'equal',
          splits: [{ user: user1._id }, { user: user2._id }],
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/expenses', () => {
    beforeEach(async () => {
      // Create expenses involving user1
      await Expense.create({
        description: 'Expense 1',
        totalAmount: 100,
        paidBy: user1._id,
        splitType: 'equal',
        splits: [{ user: user1._id, amount: 50 }, { user: user2._id, amount: 50 }],
        createdBy: user1._id,
      });

      // Expense created by user2 where user1 is in splits
      await Expense.create({
        description: 'Expense 2',
        totalAmount: 60,
        paidBy: user2._id,
        splitType: 'equal',
        splits: [{ user: user1._id, amount: 30 }, { user: user2._id, amount: 30 }],
        createdBy: user2._id,
      });

      // Expense not involving user1
      await Expense.create({
        description: 'Expense 3',
        totalAmount: 80,
        paidBy: user2._id,
        splitType: 'equal',
        splits: [{ user: user2._id, amount: 40 }, { user: user3._id, amount: 40 }],
        createdBy: user2._id,
      });
    });

    it('should return all expenses involving the user', async () => {
      const res = await request(app)
        .get('/api/expenses')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('should sort by newest first', async () => {
      const res = await request(app)
        .get('/api/expenses')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      const dates = res.body.map(e => new Date(e.createdAt).getTime());
      expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/expenses');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/expenses/tagged', () => {
    beforeEach(async () => {
      await Expense.create({
        description: 'Tagged Expense',
        totalAmount: 100,
        paidBy: user2._id,
        splitType: 'equal',
        splits: [{ user: user1._id, amount: 50 }, { user: user2._id, amount: 50 }],
        createdBy: user2._id,
      });
    });

    it('should return expenses where user is tagged in splits', async () => {
      const res = await request(app)
        .get('/api/expenses/tagged')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].description).toBe('Tagged Expense');
    });
  });

  describe('GET /api/expenses/:id', () => {
    let expense;

    beforeEach(async () => {
      expense = await Expense.create({
        description: 'Specific Expense',
        totalAmount: 100,
        paidBy: user1._id,
        splitType: 'equal',
        splits: [{ user: user1._id, amount: 50 }, { user: user2._id, amount: 50 }],
        createdBy: user1._id,
      });
    });

    it('should return expense for creator', async () => {
      const res = await request(app)
        .get(`/api/expenses/${expense._id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.description).toBe('Specific Expense');
    });

    it('should return expense for split participant', async () => {
      const res = await request(app)
        .get(`/api/expenses/${expense._id}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(200);
    });

    it('should return 403 for non-participant', async () => {
      const { token: token3 } = await createTestUser({ email: 'outsider@example.com' });

      const res = await request(app)
        .get(`/api/expenses/${expense._id}`)
        .set('Authorization', `Bearer ${token3}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent expense', async () => {
      const mongoose = require('mongoose');
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/expenses/${fakeId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/expenses/:id', () => {
    let expense;

    beforeEach(async () => {
      expense = await Expense.create({
        description: 'Original',
        totalAmount: 100,
        paidBy: user1._id,
        splitType: 'equal',
        splits: [{ user: user1._id, amount: 50 }, { user: user2._id, amount: 50 }],
        createdBy: user1._id,
      });
    });

    it('should update expense by creator', async () => {
      const res = await request(app)
        .put(`/api/expenses/${expense._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          description: 'Updated',
          totalAmount: 200,
          paidBy: user1._id,
          splitType: 'equal',
          splits: [{ user: user1._id }, { user: user2._id }],
        });

      expect(res.status).toBe(200);
      expect(res.body.description).toBe('Updated');
      expect(res.body.totalAmount).toBe(200);
    });

    it('should return 403 when non-creator tries to update', async () => {
      const res = await request(app)
        .put(`/api/expenses/${expense._id}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({
          description: 'Hacked',
          totalAmount: 200,
          paidBy: user2._id,
          splitType: 'equal',
          splits: [{ user: user1._id }, { user: user2._id }],
        });

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent expense', async () => {
      const mongoose = require('mongoose');
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .put(`/api/expenses/${fakeId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          description: 'Test',
          totalAmount: 100,
          paidBy: user1._id,
          splitType: 'equal',
          splits: [{ user: user1._id }, { user: user2._id }],
        });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/expenses/:id', () => {
    let expense;

    beforeEach(async () => {
      expense = await Expense.create({
        description: 'To Delete',
        totalAmount: 100,
        paidBy: user1._id,
        splitType: 'equal',
        splits: [{ user: user1._id, amount: 50 }, { user: user2._id, amount: 50 }],
        createdBy: user1._id,
      });
    });

    it('should delete expense by creator', async () => {
      const res = await request(app)
        .delete(`/api/expenses/${expense._id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Expense deleted successfully');

      const deleted = await Expense.findById(expense._id);
      expect(deleted).toBeNull();
    });

    it('should return 403 when non-creator tries to delete', async () => {
      const res = await request(app)
        .delete(`/api/expenses/${expense._id}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent expense', async () => {
      const mongoose = require('mongoose');
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .delete(`/api/expenses/${fakeId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/expenses/balance/summary', () => {
    it('should calculate balances correctly', async () => {
      // user1 paid $100, split equally between user1 and user2
      // So user2 owes user1 $50
      await Expense.create({
        description: 'Dinner',
        totalAmount: 100,
        paidBy: user1._id,
        splitType: 'equal',
        splits: [{ user: user1._id, amount: 50 }, { user: user2._id, amount: 50 }],
        createdBy: user1._id,
      });

      const res = await request(app)
        .get('/api/expenses/balance/summary')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].amount).toBe(50);
      expect(res.body[0].type).toBe('owes_you');
    });

    it('should show you_owe for the other user perspective', async () => {
      await Expense.create({
        description: 'Dinner',
        totalAmount: 100,
        paidBy: user1._id,
        splitType: 'equal',
        splits: [{ user: user1._id, amount: 50 }, { user: user2._id, amount: 50 }],
        createdBy: user1._id,
      });

      const res = await request(app)
        .get('/api/expenses/balance/summary')
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].amount).toBe(50);
      expect(res.body[0].type).toBe('you_owe');
    });

    it('should net out multiple expenses', async () => {
      // user1 paid $100, split equally → user2 owes user1 $50
      await Expense.create({
        description: 'Dinner',
        totalAmount: 100,
        paidBy: user1._id,
        splitType: 'equal',
        splits: [{ user: user1._id, amount: 50 }, { user: user2._id, amount: 50 }],
        createdBy: user1._id,
      });

      // user2 paid $60, split equally → user1 owes user2 $30
      await Expense.create({
        description: 'Lunch',
        totalAmount: 60,
        paidBy: user2._id,
        splitType: 'equal',
        splits: [{ user: user1._id, amount: 30 }, { user: user2._id, amount: 30 }],
        createdBy: user2._id,
      });

      // Net: user2 owes user1 $20
      const res = await request(app)
        .get('/api/expenses/balance/summary')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].amount).toBe(20);
      expect(res.body[0].type).toBe('owes_you');
    });

    it('should return empty when no expenses', async () => {
      const res = await request(app)
        .get('/api/expenses/balance/summary')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(0);
    });

    it('should filter out balances under $0.01', async () => {
      // Create expense where user pays for themselves
      await Expense.create({
        description: 'Solo',
        totalAmount: 100,
        paidBy: user1._id,
        splitType: 'unequal',
        splits: [{ user: user1._id, amount: 100 }],
        createdBy: user1._id,
      });

      const res = await request(app)
        .get('/api/expenses/balance/summary')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      // No balance since user1 paid and owes the full amount to themselves
      expect(res.body).toHaveLength(0);
    });
  });
});
