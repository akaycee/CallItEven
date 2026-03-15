const mongoose = require('mongoose');
const Budget = require('../../models/Budget');
const User = require('../../models/User');

require('../setup');

describe('Budget Model', () => {
  let user1, user2;

  beforeEach(async () => {
    user1 = await User.create({ name: 'User 1', email: 'user1@example.com', password: 'password123' });
    user2 = await User.create({ name: 'User 2', email: 'user2@example.com', password: 'password123' });
  });

  describe('Schema Validation', () => {
    it('should create a budget with valid fields', async () => {
      const budget = await Budget.create({
        user: user1._id,
        category: 'Food & Dining',
        amount: 500,
      });

      expect(budget._id).toBeDefined();
      expect(budget.user).toEqual(user1._id);
      expect(budget.category).toBe('Food & Dining');
      expect(budget.amount).toBe(500);
      expect(budget.createdAt).toBeDefined();
    });

    it('should require user', async () => {
      await expect(
        Budget.create({ category: 'Food & Dining', amount: 500 })
      ).rejects.toThrow();
    });

    it('should require category', async () => {
      await expect(
        Budget.create({ user: user1._id, amount: 500 })
      ).rejects.toThrow();
    });

    it('should require amount', async () => {
      await expect(
        Budget.create({ user: user1._id, category: 'Food & Dining' })
      ).rejects.toThrow();
    });

    it('should reject negative amount', async () => {
      await expect(
        Budget.create({ user: user1._id, category: 'Food & Dining', amount: -10 })
      ).rejects.toThrow();
    });

    it('should trim category name', async () => {
      const budget = await Budget.create({
        user: user1._id,
        category: '  Food & Dining  ',
        amount: 500,
      });

      expect(budget.category).toBe('Food & Dining');
    });
  });

  describe('Unique Index', () => {
    it('should enforce unique user + category combination', async () => {
      await Budget.create({
        user: user1._id,
        category: 'Food & Dining',
        amount: 500,
      });

      await expect(
        Budget.create({
          user: user1._id,
          category: 'Food & Dining',
          amount: 300,
        })
      ).rejects.toThrow();
    });

    it('should allow same category for different users', async () => {
      await Budget.create({
        user: user1._id,
        category: 'Food & Dining',
        amount: 500,
      });

      const budget2 = await Budget.create({
        user: user2._id,
        category: 'Food & Dining',
        amount: 300,
      });

      expect(budget2._id).toBeDefined();
    });

    it('should allow different categories for the same user', async () => {
      await Budget.create({
        user: user1._id,
        category: 'Food & Dining',
        amount: 500,
      });

      const budget2 = await Budget.create({
        user: user1._id,
        category: 'Transportation',
        amount: 200,
      });

      expect(budget2._id).toBeDefined();
    });
  });

  describe('Population', () => {
    it('should populate user field', async () => {
      const budget = await Budget.create({
        user: user1._id,
        category: 'Food & Dining',
        amount: 500,
      });

      const populated = await Budget.findById(budget._id).populate('user', 'name email');
      expect(populated.user.name).toBe('User 1');
      expect(populated.user.email).toBe('user1@example.com');
    });
  });
});
