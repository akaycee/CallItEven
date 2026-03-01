const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const { createTestUser, createAdminUser } = require('../helpers');

require('../setup');

describe('User Routes', () => {
  describe('GET /api/users/search', () => {
    let user, token;

    beforeEach(async () => {
      ({ user, token } = await createTestUser({ email: 'searcher@example.com' }));
      await User.create({ name: 'Alice', email: 'alice@example.com', password: 'password123' });
      await User.create({ name: 'Bob', email: 'bob@example.com', password: 'password123' });
      await User.create({ name: 'Admin', email: 'admin@example.com', password: 'password123', isAdmin: true });
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/users/search?email=alice');
      expect(res.status).toBe(401);
    });

    it('should search users by email', async () => {
      const res = await request(app)
        .get('/api/users/search?email=alice')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].email).toBe('alice@example.com');
    });

    it('should exclude current user from results', async () => {
      const res = await request(app)
        .get('/api/users/search?email=searcher')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(0);
    });

    it('should exclude admin users from results', async () => {
      const res = await request(app)
        .get('/api/users/search?email=admin')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(0);
    });

    it('should return 400 without email query param', async () => {
      const res = await request(app)
        .get('/api/users/search')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });

    it('should be case-insensitive', async () => {
      const res = await request(app)
        .get('/api/users/search?email=ALICE')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it('should limit results to 10', async () => {
      // Create 15 users
      for (let i = 0; i < 15; i++) {
        await User.create({ name: `User ${i}`, email: `bulkuser${i}@test.com`, password: 'password123' });
      }

      const res = await request(app)
        .get('/api/users/search?email=bulkuser')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeLessThanOrEqual(10);
    });

    it('should not return password field', async () => {
      const res = await request(app)
        .get('/api/users/search?email=alice')
        .set('Authorization', `Bearer ${token}`);

      expect(res.body[0].password).toBeUndefined();
    });
  });

  describe('GET /api/users/profile', () => {
    it('should return current user profile', async () => {
      const { user, token } = await createTestUser({ name: 'Profile User', email: 'profile@example.com' });

      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Profile User');
      expect(res.body.email).toBe('profile@example.com');
      expect(res.body.password).toBeUndefined();
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/users/profile');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/users/profile', () => {
    let user, token;

    beforeEach(async () => {
      ({ user, token } = await createTestUser({ email: 'update@example.com', name: 'Original Name' }));
    });

    it('should update name and email', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name', email: 'updated@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Name');
      expect(res.body.email).toBe('updated@example.com');
    });

    it('should return 400 if name is missing', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'updated@example.com' });

      expect(res.status).toBe(400);
    });

    it('should return 400 if email is missing', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(400);
    });

    it('should update password when provided', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Original Name', email: 'update@example.com', password: 'newpassword123' });

      expect(res.status).toBe(200);

      // Verify login with new password works
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'update@example.com', password: 'newpassword123' });

      expect(loginRes.status).toBe(200);
    });

    it('should return 400 for password shorter than 6 characters', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Original Name', email: 'update@example.com', password: '12345' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Password must be at least 6 characters');
    });

    it('should return 400 when email is already taken', async () => {
      await User.create({ name: 'Other', email: 'taken@example.com', password: 'password123' });

      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Original Name', email: 'taken@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Email already in use');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .send({ name: 'Test', email: 'test@example.com' });

      expect(res.status).toBe(401);
    });
  });
});
