const mongoose = require('mongoose');
const Expense = require('../../models/Expense');
const User = require('../../models/User');

require('../setup');

describe('Expense Model', () => {
  let user1, user2, user3;

  beforeEach(async () => {
    user1 = await User.create({ name: 'User 1', email: 'user1@example.com', password: 'password123' });
    user2 = await User.create({ name: 'User 2', email: 'user2@example.com', password: 'password123' });
    user3 = await User.create({ name: 'User 3', email: 'user3@example.com', password: 'password123' });
  });

  describe('Schema Validation', () => {
    it('should create an expense with valid equal split', async () => {
      const expense = await Expense.create({
        description: 'Dinner',
        totalAmount: 100,
        paidBy: user1._id,
        splitType: 'equal',
        splits: [
          { user: user1._id, amount: 50 },
          { user: user2._id, amount: 50 },
        ],
        createdBy: user1._id,
      });

      expect(expense._id).toBeDefined();
      expect(expense.description).toBe('Dinner');
      expect(expense.totalAmount).toBe(100);
      expect(expense.splitType).toBe('equal');
      expect(expense.splits).toHaveLength(2);
      expect(expense.category).toBe('Uncategorized');
    });

    it('should require description', async () => {
      await expect(
        Expense.create({
          totalAmount: 100,
          paidBy: user1._id,
          splitType: 'equal',
          splits: [{ user: user1._id, amount: 50 }, { user: user2._id, amount: 50 }],
          createdBy: user1._id,
        })
      ).rejects.toThrow();
    });

    it('should require totalAmount', async () => {
      await expect(
        Expense.create({
          description: 'Test',
          paidBy: user1._id,
          splitType: 'equal',
          splits: [{ user: user1._id, amount: 50 }, { user: user2._id, amount: 50 }],
          createdBy: user1._id,
        })
      ).rejects.toThrow();
    });

    it('should require splitType', async () => {
      await expect(
        Expense.create({
          description: 'Test',
          totalAmount: 100,
          paidBy: user1._id,
          splits: [{ user: user1._id, amount: 50 }, { user: user2._id, amount: 50 }],
          createdBy: user1._id,
        })
      ).rejects.toThrow();
    });

    it('should only allow valid splitType values', async () => {
      await expect(
        Expense.create({
          description: 'Test',
          totalAmount: 100,
          paidBy: user1._id,
          splitType: 'invalid',
          splits: [{ user: user1._id, amount: 50 }, { user: user2._id, amount: 50 }],
          createdBy: user1._id,
        })
      ).rejects.toThrow();
    });

    it('should trim description', async () => {
      const expense = await Expense.create({
        description: '  Dinner  ',
        totalAmount: 100,
        paidBy: user1._id,
        splitType: 'equal',
        splits: [{ user: user1._id, amount: 50 }, { user: user2._id, amount: 50 }],
        createdBy: user1._id,
      });

      expect(expense.description).toBe('Dinner');
    });

    it('should default category to Uncategorized', async () => {
      const expense = await Expense.create({
        description: 'Dinner',
        totalAmount: 100,
        paidBy: user1._id,
        splitType: 'equal',
        splits: [{ user: user1._id, amount: 50 }, { user: user2._id, amount: 50 }],
        createdBy: user1._id,
      });

      expect(expense.category).toBe('Uncategorized');
    });

    it('should allow setting a custom category', async () => {
      const expense = await Expense.create({
        description: 'Dinner',
        totalAmount: 100,
        paidBy: user1._id,
        splitType: 'equal',
        splits: [{ user: user1._id, amount: 50 }, { user: user2._id, amount: 50 }],
        createdBy: user1._id,
        category: 'Food & Dining',
      });

      expect(expense.category).toBe('Food & Dining');
    });
  });

  describe('Split Validation', () => {
    it('should reject when split amounts do not sum to totalAmount', async () => {
      await expect(
        Expense.create({
          description: 'Bad Split',
          totalAmount: 100,
          paidBy: user1._id,
          splitType: 'equal',
          splits: [
            { user: user1._id, amount: 30 },
            { user: user2._id, amount: 30 },
          ],
          createdBy: user1._id,
        })
      ).rejects.toThrow('Split amounts must add up to total amount');
    });

    it('should allow small rounding errors (within 0.01)', async () => {
      const expense = await Expense.create({
        description: 'Close Split',
        totalAmount: 100,
        paidBy: user1._id,
        splitType: 'equal',
        splits: [
          { user: user1._id, amount: 33.34 },
          { user: user2._id, amount: 33.33 },
          { user: user3._id, amount: 33.33 },
        ],
        createdBy: user1._id,
      });

      expect(expense).toBeDefined();
    });

    it('should reject when percentage split does not sum to 100', async () => {
      // Amounts sum to totalAmount but percentages don't sum to 100
      await expect(
        Expense.create({
          description: 'Bad Percentage',
          totalAmount: 100,
          paidBy: user1._id,
          splitType: 'percentage',
          splits: [
            { user: user1._id, amount: 50, percentage: 30 },
            { user: user2._id, amount: 50, percentage: 30 },
          ],
          createdBy: user1._id,
        })
      ).rejects.toThrow('Percentages must add up to 100');
    });

    it('should accept valid percentage split summing to 100', async () => {
      const expense = await Expense.create({
        description: 'Good Percentage',
        totalAmount: 200,
        paidBy: user1._id,
        splitType: 'percentage',
        splits: [
          { user: user1._id, amount: 120, percentage: 60 },
          { user: user2._id, amount: 80, percentage: 40 },
        ],
        createdBy: user1._id,
      });

      expect(expense.splits[0].percentage).toBe(60);
      expect(expense.splits[1].percentage).toBe(40);
    });

    it('should accept valid unequal split', async () => {
      const expense = await Expense.create({
        description: 'Unequal Split',
        totalAmount: 100,
        paidBy: user1._id,
        splitType: 'unequal',
        splits: [
          { user: user1._id, amount: 70 },
          { user: user2._id, amount: 30 },
        ],
        createdBy: user1._id,
      });

      expect(expense.splits[0].amount).toBe(70);
      expect(expense.splits[1].amount).toBe(30);
    });
  });

  describe('Population', () => {
    it('should populate paidBy and splits.user', async () => {
      const expense = await Expense.create({
        description: 'Dinner',
        totalAmount: 100,
        paidBy: user1._id,
        splitType: 'equal',
        splits: [
          { user: user1._id, amount: 50 },
          { user: user2._id, amount: 50 },
        ],
        createdBy: user1._id,
      });

      const populated = await Expense.findById(expense._id)
        .populate('paidBy', 'name email')
        .populate('splits.user', 'name email');

      expect(populated.paidBy.name).toBe('User 1');
      expect(populated.splits[0].user.name).toBeDefined();
    });
  });
});
