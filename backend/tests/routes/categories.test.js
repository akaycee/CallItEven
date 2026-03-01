const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const Category = require('../../models/Category');
const Expense = require('../../models/Expense');
const { createTestUser, createAdminUser } = require('../helpers');

require('../setup');

describe('Category Routes', () => {
  describe('GET /api/categories', () => {
    let user, token;

    beforeEach(async () => {
      ({ user, token } = await createTestUser());
    });

    it('should return default categories', async () => {
      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toContain('Food & Dining');
      expect(res.body).toContain('Transportation');
      expect(res.body).toContain('Shopping');
      expect(res.body).toContain('Entertainment');
      expect(res.body).toContain('Groceries');
      expect(res.body).toContain('Utilities');
      expect(res.body).toContain('Healthcare');
      expect(res.body).toContain('Travel');
      expect(res.body).toContain('Housing');
      expect(res.body).toContain('Other');
    });

    it('should include custom categories', async () => {
      const { user: admin } = await createAdminUser();
      await Category.create({ name: 'Custom Category', createdBy: admin._id });

      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toContain('Custom Category');
    });

    it('should return sorted categories', async () => {
      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const sorted = [...res.body].sort();
      expect(res.body).toEqual(sorted);
    });

    it('should deduplicate categories', async () => {
      const { user: admin } = await createAdminUser();
      await Category.create({ name: 'Food & Dining', createdBy: admin._id });

      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${token}`);

      const foodCount = res.body.filter(c => c === 'Food & Dining').length;
      expect(foodCount).toBe(1);
    });

    it('should return detailed view for admin', async () => {
      const { token: adminToken } = await createAdminUser();

      const res = await request(app)
        .get('/api/categories?detailed=true')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body[0]).toHaveProperty('name');
      expect(res.body[0]).toHaveProperty('isDefault');
    });

    it('should not return detailed view for non-admin even with query param', async () => {
      const res = await request(app)
        .get('/api/categories?detailed=true')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      // Non-admin gets string array, not objects
      expect(typeof res.body[0]).toBe('string');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/categories');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/categories', () => {
    it('should create category as admin', async () => {
      const { token: adminToken } = await createAdminUser();

      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'New Category' });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('New Category');
    });

    it('should return 400 for non-admin', async () => {
      const { token } = await createTestUser();

      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Category' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid category');
    });

    it('should return 400 for empty name', async () => {
      const { token: adminToken } = await createAdminUser();

      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '' });

      expect(res.status).toBe(400);
    });

    it('should return existing category for case-insensitive duplicate', async () => {
      const { user: admin, token: adminToken } = await createAdminUser();
      await Category.create({ name: 'Existing Category', createdBy: admin._id });

      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'existing category' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Existing Category');
    });
  });

  describe('DELETE /api/categories/:name', () => {
    it('should delete category as admin', async () => {
      const { user: admin, token: adminToken } = await createAdminUser();
      await Category.create({ name: 'To Delete', createdBy: admin._id });

      const res = await request(app)
        .delete('/api/categories/To%20Delete')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Category deleted successfully');
    });

    it('should reassign expenses to Uncategorized on category delete', async () => {
      const { user: admin, token: adminToken } = await createAdminUser();
      const { user: regularUser } = await createTestUser();
      const user2 = (await createTestUser({ email: 'user2delete@example.com' })).user;

      await Category.create({ name: 'OldCategory', createdBy: admin._id });

      await Expense.create({
        description: 'Test',
        totalAmount: 100,
        paidBy: regularUser._id,
        splitType: 'equal',
        splits: [{ user: regularUser._id, amount: 50 }, { user: user2._id, amount: 50 }],
        createdBy: regularUser._id,
        category: 'OldCategory',
      });

      await request(app)
        .delete('/api/categories/OldCategory')
        .set('Authorization', `Bearer ${adminToken}`);

      const expense = await Expense.findOne({ description: 'Test' });
      expect(expense.category).toBe('Uncategorized');
    });

    it('should return 403 for non-admin', async () => {
      const { token } = await createTestUser();

      const res = await request(app)
        .delete('/api/categories/Food')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent category', async () => {
      const { token: adminToken } = await createAdminUser();

      const res = await request(app)
        .delete('/api/categories/NonExistent')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });
});
