const mongoose = require('mongoose');
require('../setup');
const Income = require('../../models/Income');

describe('Income Model', () => {
  it('should create a valid income entry', async () => {
    const income = await Income.create({
      user: new mongoose.Types.ObjectId(),
      source: 'Salary',
      amount: 5000,
      date: new Date('2026-03-01'),
      category: 'Employment',
    });

    expect(income.source).toBe('Salary');
    expect(income.amount).toBe(5000);
    expect(income.category).toBe('Employment');
    expect(income.isRecurring).toBe(false);
    expect(income.description).toBe('');
  });

  it('should require source', async () => {
    await expect(Income.create({
      user: new mongoose.Types.ObjectId(),
      amount: 1000,
      date: new Date(),
    })).rejects.toThrow();
  });

  it('should require amount', async () => {
    await expect(Income.create({
      user: new mongoose.Types.ObjectId(),
      source: 'Freelance',
      date: new Date(),
    })).rejects.toThrow();
  });

  it('should require date', async () => {
    await expect(Income.create({
      user: new mongoose.Types.ObjectId(),
      source: 'Freelance',
      amount: 1000,
    })).rejects.toThrow();
  });

  it('should not allow negative amounts', async () => {
    await expect(Income.create({
      user: new mongoose.Types.ObjectId(),
      source: 'Freelance',
      amount: -100,
      date: new Date(),
    })).rejects.toThrow();
  });

  it('should default category to General', async () => {
    const income = await Income.create({
      user: new mongoose.Types.ObjectId(),
      source: 'Bonus',
      amount: 1000,
      date: new Date(),
    });

    expect(income.category).toBe('General');
  });

  it('should create a recurring income entry', async () => {
    const income = await Income.create({
      user: new mongoose.Types.ObjectId(),
      source: 'Salary',
      amount: 5000,
      date: new Date('2026-01-01'),
      isRecurring: true,
      recurrence: {
        frequency: 'monthly',
        endDate: new Date('2026-12-31'),
      },
    });

    expect(income.isRecurring).toBe(true);
    expect(income.recurrence.frequency).toBe('monthly');
    expect(income.recurrence.endDate).toBeTruthy();
  });

  it('should fail if recurring but no frequency', async () => {
    await expect(Income.create({
      user: new mongoose.Types.ObjectId(),
      source: 'Salary',
      amount: 5000,
      date: new Date('2026-01-01'),
      isRecurring: true,
      recurrence: {},
    })).rejects.toThrow('Recurrence frequency is required');
  });

  it('should validate recurrence frequency enum', async () => {
    await expect(Income.create({
      user: new mongoose.Types.ObjectId(),
      source: 'Salary',
      amount: 5000,
      date: new Date('2026-01-01'),
      isRecurring: true,
      recurrence: { frequency: 'daily' },
    })).rejects.toThrow();
  });

  it('should allow group reference', async () => {
    const groupId = new mongoose.Types.ObjectId();
    const income = await Income.create({
      user: new mongoose.Types.ObjectId(),
      source: 'Joint Income',
      amount: 3000,
      date: new Date(),
      group: groupId,
    });

    expect(income.group.toString()).toBe(groupId.toString());
  });
});
