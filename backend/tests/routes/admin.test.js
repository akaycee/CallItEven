const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const Expense = require('../../models/Expense');
const { createTestUser, createAdminUser } = require('../helpers');

require('../setup');

describe('Admin Routes', () => {
  let admin, adminToken;

  beforeEach(async () => {
    ({ user: admin, token: adminToken } = await createAdminUser());
  });

  describe('GET /api/admin/users', () => {
    it('should return all users for admin', async () => {
      await createTestUser({ email: 'regular1@example.com' });
      await createTestUser({ email: 'regular2@example.com' });

      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(3); // admin + 2 users
      expect(res.body[0].password).toBeUndefined();
    });

    it('should sort users by newest first', async () => {
      await createTestUser({ email: 'early@example.com' });

      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      const dates = res.body.map(u => new Date(u.createdAt).getTime());
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
      }
    });

    it('should return 403 for non-admin', async () => {
      const { token: userToken } = await createTestUser();

      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/admin/users');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/admin/users/:id', () => {
    it('should update user as admin', async () => {
      const { user: regularUser } = await createTestUser({ name: 'Original', email: 'original@example.com' });

      const res = await request(app)
        .put(`/api/admin/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated', email: 'updated@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated');
      expect(res.body.email).toBe('updated@example.com');
    });

    it('should toggle admin status', async () => {
      const { user: regularUser } = await createTestUser();

      const res = await request(app)
        .put(`/api/admin/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isAdmin: true });

      expect(res.status).toBe(200);
      expect(res.body.isAdmin).toBe(true);
    });

    it('should return 400 for duplicate email', async () => {
      const { user: user1 } = await createTestUser({ email: 'user1@example.com' });
      await createTestUser({ email: 'taken@example.com' });

      const res = await request(app)
        .put(`/api/admin/users/${user1._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'taken@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Email already in use');
    });

    it('should return 404 for non-existent user', async () => {
      const mongoose = require('mongoose');
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .put(`/api/admin/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test' });

      expect(res.status).toBe(404);
    });

    it('should return 403 for non-admin', async () => {
      const { user: regularUser, token: userToken } = await createTestUser();

      const res = await request(app)
        .put(`/api/admin/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Hacked' });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should delete user and cascade delete their expenses', async () => {
      const { user: regularUser } = await createTestUser({ email: 'todelete@example.com' });
      const { user: otherUser } = await createTestUser({ email: 'other@example.com' });

      // Create expense involving the user to be deleted
      await Expense.create({
        description: 'To cascade',
        totalAmount: 100,
        paidBy: regularUser._id,
        splitType: 'equal',
        splits: [{ user: regularUser._id, amount: 50 }, { user: otherUser._id, amount: 50 }],
        createdBy: regularUser._id,
      });

      const res = await request(app)
        .delete(`/api/admin/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('User deleted successfully');

      // Verify user is deleted
      const deletedUser = await User.findById(regularUser._id);
      expect(deletedUser).toBeNull();

      // Verify expenses are cascade deleted
      const expenses = await Expense.find({ paidBy: regularUser._id });
      expect(expenses).toHaveLength(0);
    });

    it('should not allow admin to delete themselves', async () => {
      const res = await request(app)
        .delete(`/api/admin/users/${admin._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Cannot delete your own account');
    });

    it('should return 404 for non-existent user', async () => {
      const mongoose = require('mongoose');
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .delete(`/api/admin/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 403 for non-admin', async () => {
      const { user: regularUser, token: userToken } = await createTestUser();

      const res = await request(app)
        .delete(`/api/admin/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/admin/stats', () => {
    it('should return platform statistics', async () => {
      const { user: u1 } = await createTestUser({ email: 'stat1@example.com' });
      const { user: u2 } = await createTestUser({ email: 'stat2@example.com' });

      await Expense.create({
        description: 'Expense A',
        totalAmount: 100,
        paidBy: u1._id,
        splitType: 'equal',
        splits: [{ user: u1._id, amount: 50 }, { user: u2._id, amount: 50 }],
        createdBy: u1._id,
      });

      await Expense.create({
        description: 'Expense B',
        totalAmount: 200,
        paidBy: u2._id,
        splitType: 'equal',
        splits: [{ user: u1._id, amount: 100 }, { user: u2._id, amount: 100 }],
        createdBy: u2._id,
      });

      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.totalUsers).toBeGreaterThanOrEqual(3); // admin + 2 users
      expect(res.body.totalExpenses).toBe(2);
      expect(res.body.totalAmount).toBe(300);
    });

    it('should return 0 totalAmount when no expenses', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.totalAmount).toBe(0);
    });

    it('should return 403 for non-admin', async () => {
      const { token: userToken } = await createTestUser();

      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });
});
