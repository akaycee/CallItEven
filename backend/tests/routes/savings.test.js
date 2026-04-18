const request = require('supertest');
const app = require('../../app');
const SavingsGoal = require('../../models/SavingsGoal');
const { createTestUser } = require('../helpers');

require('../setup');

describe('Savings Routes', () => {
  let user1, token1, user2, token2;

  beforeEach(async () => {
    ({ user: user1, token: token1 } = await createTestUser({ email: 'user1@example.com', name: 'User One' }));
    ({ user: user2, token: token2 } = await createTestUser({ email: 'user2@example.com', name: 'User Two' }));
  });

  describe('POST /api/savings', () => {
    it('should create a savings goal', async () => {
      const res = await request(app)
        .post('/api/savings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'Emergency Fund',
          targetAmount: 10000,
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Emergency Fund');
      expect(res.body.targetAmount).toBe(10000);
      expect(res.body.currentAmount).toBe(0);
    });

    it('should return 400 without name', async () => {
      const res = await request(app)
        .post('/api/savings')
        .set('Authorization', `Bearer ${token1}`)
        .send({ targetAmount: 5000 });

      expect(res.status).toBe(400);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/savings')
        .send({ name: 'Goal', targetAmount: 5000 });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/savings', () => {
    beforeEach(async () => {
      await SavingsGoal.create({ user: user1._id, name: 'Goal 1', targetAmount: 5000, currentAmount: 2000 });
      await SavingsGoal.create({ user: user1._id, name: 'Goal 2', targetAmount: 10000, currentAmount: 10000 });
      await SavingsGoal.create({ user: user2._id, name: 'Other Goal', targetAmount: 3000 });
    });

    it('should return only user goals', async () => {
      const res = await request(app)
        .get('/api/savings')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('should include virtual fields', async () => {
      const res = await request(app)
        .get('/api/savings')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      const goal = res.body.find(g => g.name === 'Goal 1');
      expect(goal.progress).toBe(40);
      expect(goal.remaining).toBe(3000);
      expect(goal.isComplete).toBe(false);

      const completedGoal = res.body.find(g => g.name === 'Goal 2');
      expect(completedGoal.isComplete).toBe(true);
    });
  });

  describe('GET /api/savings/summary', () => {
    beforeEach(async () => {
      await SavingsGoal.create({ user: user1._id, name: 'Goal 1', targetAmount: 5000, currentAmount: 2000 });
      await SavingsGoal.create({ user: user1._id, name: 'Goal 2', targetAmount: 10000, currentAmount: 10000 });
    });

    it('should return summary', async () => {
      const res = await request(app)
        .get('/api/savings/summary')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.totalSaved).toBe(12000);
      expect(res.body.totalTarget).toBe(15000);
      expect(res.body.goalCount).toBe(2);
      expect(res.body.completedCount).toBe(1);
    });
  });

  describe('PUT /api/savings/:id/contribute', () => {
    let goalId;

    beforeEach(async () => {
      const goal = await SavingsGoal.create({ user: user1._id, name: 'Goal', targetAmount: 5000, currentAmount: 2000 });
      goalId = goal._id;
    });

    it('should add contribution', async () => {
      const res = await request(app)
        .put(`/api/savings/${goalId}/contribute`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ amount: 500 });

      expect(res.status).toBe(200);
      expect(res.body.currentAmount).toBe(2500);
    });

    it('should return 403 for non-owner', async () => {
      const res = await request(app)
        .put(`/api/savings/${goalId}/contribute`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ amount: 500 });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/savings/:id', () => {
    let goalId;

    beforeEach(async () => {
      const goal = await SavingsGoal.create({ user: user1._id, name: 'Goal', targetAmount: 5000 });
      goalId = goal._id;
    });

    it('should delete by owner', async () => {
      const res = await request(app)
        .delete(`/api/savings/${goalId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      const deleted = await SavingsGoal.findById(goalId);
      expect(deleted).toBeNull();
    });

    it('should return 403 for non-owner', async () => {
      const res = await request(app)
        .delete(`/api/savings/${goalId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(403);
    });
  });
});
