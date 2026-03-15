const request = require('supertest');
require('../setup');
const app = require('../../app');
const Income = require('../../models/Income');
const Group = require('../../models/Group');
const { createTestUser } = require('../helpers');

describe('Income Routes', () => {
  let user, token;

  beforeEach(async () => {
    const result = await createTestUser();
    user = result.user;
    token = result.token;
  });

  describe('POST /api/income', () => {
    it('should create an income entry', async () => {
      const res = await request(app)
        .post('/api/income')
        .set('Authorization', `Bearer ${token}`)
        .send({
          source: 'Salary',
          amount: 5000,
          date: '2026-03-01',
          category: 'Employment',
          description: 'Monthly salary',
        });

      expect(res.status).toBe(201);
      expect(res.body.source).toBe('Salary');
      expect(res.body.amount).toBe(5000);
      expect(res.body.category).toBe('Employment');
    });

    it('should create a recurring income entry', async () => {
      const res = await request(app)
        .post('/api/income')
        .set('Authorization', `Bearer ${token}`)
        .send({
          source: 'Salary',
          amount: 5000,
          date: '2026-01-01',
          isRecurring: true,
          recurrence: { frequency: 'monthly' },
        });

      expect(res.status).toBe(201);
      expect(res.body.isRecurring).toBe(true);
      expect(res.body.recurrence.frequency).toBe('monthly');
    });

    it('should reject recurring income without frequency', async () => {
      const res = await request(app)
        .post('/api/income')
        .set('Authorization', `Bearer ${token}`)
        .send({
          source: 'Salary',
          amount: 5000,
          date: '2026-01-01',
          isRecurring: true,
          recurrence: {},
        });

      expect(res.status).toBe(400);
    });

    it('should reject missing source', async () => {
      const res = await request(app)
        .post('/api/income')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 5000, date: '2026-03-01' });

      expect(res.status).toBe(400);
    });

    it('should reject missing amount', async () => {
      const res = await request(app)
        .post('/api/income')
        .set('Authorization', `Bearer ${token}`)
        .send({ source: 'Salary', date: '2026-03-01' });

      expect(res.status).toBe(400);
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app)
        .post('/api/income')
        .send({ source: 'Salary', amount: 5000, date: '2026-03-01' });

      expect(res.status).toBe(401);
    });

    it('should allow income with a valid group', async () => {
      const user2 = await createTestUser({ email: 'user2@example.com' });
      const group = await Group.create({
        name: 'Test Group',
        members: [user._id, user2.user._id],
        createdBy: user._id,
      });

      const res = await request(app)
        .post('/api/income')
        .set('Authorization', `Bearer ${token}`)
        .send({
          source: 'Shared Income',
          amount: 1000,
          date: '2026-03-01',
          group: group._id,
        });

      expect(res.status).toBe(201);
      expect(res.body.group).toBe(group._id.toString());
    });

    it('should reject income with invalid group', async () => {
      const res = await request(app)
        .post('/api/income')
        .set('Authorization', `Bearer ${token}`)
        .send({
          source: 'Shared Income',
          amount: 1000,
          date: '2026-03-01',
          group: '507f1f77bcf86cd799439011',
        });

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/income', () => {
    it('should return all income for the user', async () => {
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

      const res = await request(app)
        .get('/api/income')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('should filter by date range', async () => {
      await Income.create({
        user: user._id,
        source: 'Salary',
        amount: 5000,
        date: new Date('2026-03-01'),
      });
      await Income.create({
        user: user._id,
        source: 'Old Income',
        amount: 1000,
        date: new Date('2026-01-01'),
      });

      const res = await request(app)
        .get('/api/income?startDate=2026-03-01&endDate=2026-03-31')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].source).toBe('Salary');
    });

    it('should expand recurring income within date range', async () => {
      await Income.create({
        user: user._id,
        source: 'Salary',
        amount: 5000,
        date: new Date('2026-01-01'),
        isRecurring: true,
        recurrence: { frequency: 'monthly' },
      });

      const res = await request(app)
        .get('/api/income?startDate=2026-01-01&endDate=2026-03-31')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(3); // Jan, Feb, Mar
    });

    it('should not return other users income', async () => {
      const other = await createTestUser({ email: 'other@example.com' });
      await Income.create({
        user: other.user._id,
        source: 'Other Salary',
        amount: 9000,
        date: new Date('2026-03-01'),
      });

      const res = await request(app)
        .get('/api/income')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(0);
    });
  });

  describe('GET /api/income/:id', () => {
    it('should return a single income entry', async () => {
      const income = await Income.create({
        user: user._id,
        source: 'Salary',
        amount: 5000,
        date: new Date('2026-03-01'),
      });

      const res = await request(app)
        .get(`/api/income/${income._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.source).toBe('Salary');
    });

    it('should return 404 for non-existent income', async () => {
      const res = await request(app)
        .get('/api/income/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('should not allow access to other users income', async () => {
      const other = await createTestUser({ email: 'other@example.com' });
      const income = await Income.create({
        user: other.user._id,
        source: 'Other Salary',
        amount: 9000,
        date: new Date('2026-03-01'),
      });

      const res = await request(app)
        .get(`/api/income/${income._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/income/:id', () => {
    it('should update an income entry', async () => {
      const income = await Income.create({
        user: user._id,
        source: 'Salary',
        amount: 5000,
        date: new Date('2026-03-01'),
      });

      const res = await request(app)
        .put(`/api/income/${income._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 6000, source: 'Updated Salary' });

      expect(res.status).toBe(200);
      expect(res.body.amount).toBe(6000);
      expect(res.body.source).toBe('Updated Salary');
    });

    it('should not allow updating other users income', async () => {
      const other = await createTestUser({ email: 'other@example.com' });
      const income = await Income.create({
        user: other.user._id,
        source: 'Other Salary',
        amount: 9000,
        date: new Date('2026-03-01'),
      });

      const res = await request(app)
        .put(`/api/income/${income._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 1 });

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent income', async () => {
      const res = await request(app)
        .put('/api/income/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 1000 });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/income/:id', () => {
    it('should delete an income entry', async () => {
      const income = await Income.create({
        user: user._id,
        source: 'Salary',
        amount: 5000,
        date: new Date('2026-03-01'),
      });

      const res = await request(app)
        .delete(`/api/income/${income._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Income deleted successfully');

      const found = await Income.findById(income._id);
      expect(found).toBeNull();
    });

    it('should not allow deleting other users income', async () => {
      const other = await createTestUser({ email: 'other@example.com' });
      const income = await Income.create({
        user: other.user._id,
        source: 'Other Salary',
        amount: 9000,
        date: new Date('2026-03-01'),
      });

      const res = await request(app)
        .delete(`/api/income/${income._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent income', async () => {
      const res = await request(app)
        .delete('/api/income/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});
