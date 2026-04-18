const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const FamilyGroup = require('../../models/FamilyGroup');
const { createTestUser } = require('../helpers');

require('../setup');

describe('Family Routes', () => {
  let user1, token1, user2, token2, user3, token3;

  beforeEach(async () => {
    ({ user: user1, token: token1 } = await createTestUser({ email: 'user1@example.com', name: 'User One' }));
    ({ user: user2, token: token2 } = await createTestUser({ email: 'user2@example.com', name: 'User Two' }));
    ({ user: user3, token: token3 } = await createTestUser({ email: 'user3@example.com', name: 'User Three' }));
  });

  describe('POST /api/family', () => {
    it('should create a family group', async () => {
      const res = await request(app)
        .post('/api/family')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'Our Family',
          memberEmails: ['user2@example.com'],
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Our Family');
      expect(res.body.members).toHaveLength(2);
    });

    it('should set familyGroup on all members', async () => {
      const res = await request(app)
        .post('/api/family')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'Our Family',
          memberEmails: ['user2@example.com'],
        });

      expect(res.status).toBe(201);

      const u1 = await User.findById(user1._id);
      const u2 = await User.findById(user2._id);
      expect(u1.familyGroup.toString()).toBe(res.body._id);
      expect(u2.familyGroup.toString()).toBe(res.body._id);
    });

    it('should return 400 if user already in a family', async () => {
      await request(app)
        .post('/api/family')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'Family A',
          memberEmails: ['user2@example.com'],
        });

      const res = await request(app)
        .post('/api/family')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'Family B',
          memberEmails: ['user3@example.com'],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already in a family');
    });

    it('should return 400 if a member is already in another family', async () => {
      await request(app)
        .post('/api/family')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'Family A',
          memberEmails: ['user2@example.com'],
        });

      const res = await request(app)
        .post('/api/family')
        .set('Authorization', `Bearer ${token3}`)
        .send({
          name: 'Family B',
          memberEmails: ['user2@example.com'],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already in a family');
    });

    it('should return 400 without name', async () => {
      const res = await request(app)
        .post('/api/family')
        .set('Authorization', `Bearer ${token1}`)
        .send({ memberEmails: ['user2@example.com'] });

      expect(res.status).toBe(400);
    });

    it('should return 400 when resulting group has less than 2 members', async () => {
      const res = await request(app)
        .post('/api/family')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'Too Small',
          memberEmails: ['nonexistent@example.com'],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('at least 2 members');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .post('/api/family')
        .send({ name: 'Family', memberEmails: ['user2@example.com'] });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/family', () => {
    it('should return null if user has no family', async () => {
      const res = await request(app)
        .get('/api/family')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body).toBeNull();
    });

    it('should return the family group with populated members', async () => {
      await request(app)
        .post('/api/family')
        .set('Authorization', `Bearer ${token1}`)
        .send({ name: 'Our Family', memberEmails: ['user2@example.com'] });

      const res = await request(app)
        .get('/api/family')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Our Family');
      expect(res.body.members).toHaveLength(2);
      expect(res.body.members[0]).toHaveProperty('name');
      expect(res.body.members[0]).toHaveProperty('email');
    });
  });

  describe('GET /api/family/members', () => {
    it('should return empty array if no family', async () => {
      const res = await request(app)
        .get('/api/family/members')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should return member IDs', async () => {
      await request(app)
        .post('/api/family')
        .set('Authorization', `Bearer ${token1}`)
        .send({ name: 'Our Family', memberEmails: ['user2@example.com'] });

      const res = await request(app)
        .get('/api/family/members')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });
  });

  describe('PUT /api/family/:id', () => {
    let familyId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/family')
        .set('Authorization', `Bearer ${token1}`)
        .send({ name: 'Our Family', memberEmails: ['user2@example.com'] });
      familyId = res.body._id;
    });

    it('should update family name', async () => {
      const res = await request(app)
        .put(`/api/family/${familyId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ name: 'Updated Family' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Family');
    });

    it('should add new members', async () => {
      const res = await request(app)
        .put(`/api/family/${familyId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ memberEmails: ['user2@example.com', 'user3@example.com'] });

      expect(res.status).toBe(200);
      expect(res.body.members).toHaveLength(3);

      const u3 = await User.findById(user3._id);
      expect(u3.familyGroup.toString()).toBe(familyId);
    });

    it('should clear familyGroup on removed members', async () => {
      // Add user3 first
      await request(app)
        .put(`/api/family/${familyId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ memberEmails: ['user2@example.com', 'user3@example.com'] });

      // Now remove user3
      await request(app)
        .put(`/api/family/${familyId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ memberEmails: ['user2@example.com'] });

      const u3 = await User.findById(user3._id);
      expect(u3.familyGroup).toBeNull();
    });

    it('should return 403 for non-creator', async () => {
      const res = await request(app)
        .put(`/api/family/${familyId}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ name: 'Hacked' });

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent family', async () => {
      const fakeId = new (require('mongoose').Types.ObjectId)();
      const res = await request(app)
        .put(`/api/family/${fakeId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ name: 'Test' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/family/:id', () => {
    let familyId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/family')
        .set('Authorization', `Bearer ${token1}`)
        .send({ name: 'Our Family', memberEmails: ['user2@example.com'] });
      familyId = res.body._id;
    });

    it('should delete family group and clear all members', async () => {
      const res = await request(app)
        .delete(`/api/family/${familyId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Family group deleted successfully');

      const u1 = await User.findById(user1._id);
      const u2 = await User.findById(user2._id);
      expect(u1.familyGroup).toBeNull();
      expect(u2.familyGroup).toBeNull();

      const deleted = await FamilyGroup.findById(familyId);
      expect(deleted).toBeNull();
    });

    it('should return 403 for non-creator', async () => {
      const res = await request(app)
        .delete(`/api/family/${familyId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent family', async () => {
      const fakeId = new (require('mongoose').Types.ObjectId)();
      const res = await request(app)
        .delete(`/api/family/${fakeId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(404);
    });
  });
});
