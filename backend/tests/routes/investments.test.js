const request = require('supertest');
const app = require('../../app');
const Investment = require('../../models/Investment');
const { createTestUser } = require('../helpers');

require('../setup');

describe('Investment Routes', () => {
  let user1, token1, user2, token2;

  beforeEach(async () => {
    ({ user: user1, token: token1 } = await createTestUser({ email: 'user1@example.com', name: 'User One' }));
    ({ user: user2, token: token2 } = await createTestUser({ email: 'user2@example.com', name: 'User Two' }));
  });

  describe('POST /api/investments', () => {
    it('should create an investment', async () => {
      const res = await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'AAPL Stock',
          type: 'stocks',
          purchasePrice: 150,
          currentValue: 175,
          quantity: 10,
          purchaseDate: '2025-01-15',
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('AAPL Stock');
      expect(res.body.type).toBe('stocks');
    });

    it('should return 400 with invalid type', async () => {
      const res = await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'Test',
          type: 'invalid',
          purchasePrice: 100,
          currentValue: 110,
          purchaseDate: '2025-01-01',
        });

      expect(res.status).toBe(400);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/investments')
        .send({ name: 'Test', type: 'stocks', purchasePrice: 100, currentValue: 110, purchaseDate: '2025-01-01' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/investments', () => {
    beforeEach(async () => {
      await Investment.create({
        user: user1._id, name: 'AAPL', type: 'stocks', purchasePrice: 150, currentValue: 175, purchaseDate: new Date()
      });
      await Investment.create({
        user: user1._id, name: 'BTC', type: 'crypto', purchasePrice: 30000, currentValue: 45000, purchaseDate: new Date()
      });
      await Investment.create({
        user: user2._id, name: 'GOOG', type: 'stocks', purchasePrice: 2800, currentValue: 3000, purchaseDate: new Date()
      });
    });

    it('should return only user investments', async () => {
      const res = await request(app)
        .get('/api/investments')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('should filter by type', async () => {
      const res = await request(app)
        .get('/api/investments?type=stocks')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('AAPL');
    });
  });

  describe('GET /api/investments/summary', () => {
    beforeEach(async () => {
      await Investment.create({
        user: user1._id, name: 'AAPL', type: 'stocks', purchasePrice: 150, currentValue: 175, quantity: 10, purchaseDate: new Date()
      });
      await Investment.create({
        user: user1._id, name: 'BTC', type: 'crypto', purchasePrice: 30000, currentValue: 45000, quantity: 1, purchaseDate: new Date()
      });
    });

    it('should return portfolio summary', async () => {
      const res = await request(app)
        .get('/api/investments/summary')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.totalInvested).toBe(31500);
      expect(res.body.currentValue).toBe(46750);
      expect(res.body.count).toBe(2);
      expect(res.body.byType).toHaveLength(2);
    });
  });

  describe('PUT /api/investments/:id', () => {
    let investmentId;

    beforeEach(async () => {
      const inv = await Investment.create({
        user: user1._id, name: 'AAPL', type: 'stocks', purchasePrice: 150, currentValue: 175, purchaseDate: new Date()
      });
      investmentId = inv._id;
    });

    it('should update investment by owner', async () => {
      const res = await request(app)
        .put(`/api/investments/${investmentId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ currentValue: 200 });

      expect(res.status).toBe(200);
      expect(res.body.currentValue).toBe(200);
    });

    it('should return 403 for non-owner', async () => {
      const res = await request(app)
        .put(`/api/investments/${investmentId}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ currentValue: 200 });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/investments/:id', () => {
    let investmentId;

    beforeEach(async () => {
      const inv = await Investment.create({
        user: user1._id, name: 'AAPL', type: 'stocks', purchasePrice: 150, currentValue: 175, purchaseDate: new Date()
      });
      investmentId = inv._id;
    });

    it('should delete by owner', async () => {
      const res = await request(app)
        .delete(`/api/investments/${investmentId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      const deleted = await Investment.findById(investmentId);
      expect(deleted).toBeNull();
    });

    it('should return 403 for non-owner', async () => {
      const res = await request(app)
        .delete(`/api/investments/${investmentId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(403);
    });
  });
});
