const mongoose = require('mongoose');
const Investment = require('../../models/Investment');
const User = require('../../models/User');

require('../setup');

describe('Investment Model', () => {
  let user;

  beforeEach(async () => {
    user = await User.create({ name: 'Test User', email: 'test@example.com', password: 'password123' });
  });

  describe('Schema Validation', () => {
    it('should create an investment with valid fields', async () => {
      const investment = await Investment.create({
        user: user._id,
        name: 'AAPL Stock',
        type: 'stocks',
        purchasePrice: 150,
        currentValue: 175,
        quantity: 10,
        purchaseDate: new Date('2025-01-15'),
      });

      expect(investment._id).toBeDefined();
      expect(investment.name).toBe('AAPL Stock');
      expect(investment.type).toBe('stocks');
      expect(investment.purchasePrice).toBe(150);
      expect(investment.currentValue).toBe(175);
      expect(investment.quantity).toBe(10);
    });

    it('should require name', async () => {
      await expect(Investment.create({
        user: user._id,
        type: 'stocks',
        purchasePrice: 100,
        currentValue: 110,
        purchaseDate: new Date(),
      })).rejects.toThrow();
    });

    it('should require type', async () => {
      await expect(Investment.create({
        user: user._id,
        name: 'Test',
        purchasePrice: 100,
        currentValue: 110,
        purchaseDate: new Date(),
      })).rejects.toThrow();
    });

    it('should reject invalid type', async () => {
      await expect(Investment.create({
        user: user._id,
        name: 'Test',
        type: 'invalid_type',
        purchasePrice: 100,
        currentValue: 110,
        purchaseDate: new Date(),
      })).rejects.toThrow();
    });

    it('should default quantity to 1', async () => {
      const investment = await Investment.create({
        user: user._id,
        name: 'Bond',
        type: 'bonds',
        purchasePrice: 1000,
        currentValue: 1050,
        purchaseDate: new Date(),
      });

      expect(investment.quantity).toBe(1);
    });

    it('should default hideFromFamily to false', async () => {
      const investment = await Investment.create({
        user: user._id,
        name: 'ETF',
        type: 'etf',
        purchasePrice: 200,
        currentValue: 220,
        purchaseDate: new Date(),
      });

      expect(investment.hideFromFamily).toBe(false);
    });
  });

  describe('Virtuals', () => {
    it('should compute totalCost correctly', async () => {
      const investment = await Investment.create({
        user: user._id,
        name: 'AAPL',
        type: 'stocks',
        purchasePrice: 150,
        currentValue: 175,
        quantity: 10,
        purchaseDate: new Date(),
      });

      expect(investment.totalCost).toBe(1500);
    });

    it('should compute totalValue correctly', async () => {
      const investment = await Investment.create({
        user: user._id,
        name: 'AAPL',
        type: 'stocks',
        purchasePrice: 150,
        currentValue: 175,
        quantity: 10,
        purchaseDate: new Date(),
      });

      expect(investment.totalValue).toBe(1750);
    });

    it('should compute gainLoss correctly', async () => {
      const investment = await Investment.create({
        user: user._id,
        name: 'AAPL',
        type: 'stocks',
        purchasePrice: 150,
        currentValue: 175,
        quantity: 10,
        purchaseDate: new Date(),
      });

      expect(investment.gainLoss).toBe(250);
    });

    it('should compute gainLossPercent correctly', async () => {
      const investment = await Investment.create({
        user: user._id,
        name: 'AAPL',
        type: 'stocks',
        purchasePrice: 100,
        currentValue: 150,
        quantity: 1,
        purchaseDate: new Date(),
      });

      expect(investment.gainLossPercent).toBeCloseTo(50);
    });
  });
});
