const mongoose = require('mongoose');
const SavingsGoal = require('../../models/SavingsGoal');
const User = require('../../models/User');

require('../setup');

describe('SavingsGoal Model', () => {
  let user;

  beforeEach(async () => {
    user = await User.create({ name: 'Test User', email: 'test@example.com', password: 'password123' });
  });

  describe('Schema Validation', () => {
    it('should create a savings goal with valid fields', async () => {
      const goal = await SavingsGoal.create({
        user: user._id,
        name: 'Emergency Fund',
        targetAmount: 10000,
        currentAmount: 2500,
      });

      expect(goal._id).toBeDefined();
      expect(goal.name).toBe('Emergency Fund');
      expect(goal.targetAmount).toBe(10000);
      expect(goal.currentAmount).toBe(2500);
      expect(goal.category).toBe('General');
    });

    it('should require name', async () => {
      await expect(SavingsGoal.create({
        user: user._id,
        targetAmount: 5000,
      })).rejects.toThrow();
    });

    it('should require targetAmount', async () => {
      await expect(SavingsGoal.create({
        user: user._id,
        name: 'Goal',
      })).rejects.toThrow();
    });

    it('should default currentAmount to 0', async () => {
      const goal = await SavingsGoal.create({
        user: user._id,
        name: 'New Goal',
        targetAmount: 5000,
      });

      expect(goal.currentAmount).toBe(0);
    });

    it('should default isFamilyGoal to false', async () => {
      const goal = await SavingsGoal.create({
        user: user._id,
        name: 'My Goal',
        targetAmount: 3000,
      });

      expect(goal.isFamilyGoal).toBe(false);
    });
  });

  describe('Virtuals', () => {
    it('should compute progress correctly', async () => {
      const goal = await SavingsGoal.create({
        user: user._id,
        name: 'Goal',
        targetAmount: 10000,
        currentAmount: 2500,
      });

      expect(goal.progress).toBe(25);
    });

    it('should cap progress at 100', async () => {
      const goal = await SavingsGoal.create({
        user: user._id,
        name: 'Completed',
        targetAmount: 1000,
        currentAmount: 1500,
      });

      expect(goal.progress).toBe(100);
    });

    it('should compute remaining correctly', async () => {
      const goal = await SavingsGoal.create({
        user: user._id,
        name: 'Goal',
        targetAmount: 5000,
        currentAmount: 3000,
      });

      expect(goal.remaining).toBe(2000);
    });

    it('should compute isComplete correctly', async () => {
      const incomplete = await SavingsGoal.create({
        user: user._id,
        name: 'Incomplete',
        targetAmount: 5000,
        currentAmount: 3000,
      });

      const complete = await SavingsGoal.create({
        user: user._id,
        name: 'Complete',
        targetAmount: 5000,
        currentAmount: 5000,
      });

      expect(incomplete.isComplete).toBe(false);
      expect(complete.isComplete).toBe(true);
    });
  });
});
