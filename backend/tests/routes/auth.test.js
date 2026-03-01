const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const Group = require('../../models/Group');
const PendingGroupInvite = require('../../models/PendingGroupInvite');

require('../setup');

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'John Doe', email: 'john@example.com', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body).toHaveProperty('token');
      expect(res.body.name).toBe('John Doe');
      expect(res.body.email).toBe('john@example.com');
      expect(res.body.isAdmin).toBe(false);
    });

    it('should return 400 for missing name', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'john@example.com', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 400 for invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'John', email: 'notanemail', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 400 for short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'John', email: 'john@example.com', password: '12345' });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 400 for duplicate email', async () => {
      await User.create({ name: 'John', email: 'john@example.com', password: 'password123' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Jane', email: 'john@example.com', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('User already exists with this email');
    });

    it('should auto-add user to pending group invites on registration', async () => {
      // Create an existing user and group
      const creator = await User.create({ name: 'Creator', email: 'creator@example.com', password: 'password123' });
      const member = await User.create({ name: 'Member', email: 'member@example.com', password: 'password123' });
      const group = await Group.create({
        name: 'Test Group',
        members: [creator._id, member._id],
        createdBy: creator._id,
      });

      // Create a pending invite for the new user's email
      await PendingGroupInvite.create({
        email: 'newuser@example.com',
        group: group._id,
        invitedBy: creator._id,
      });

      // Register the new user
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'New User', email: 'newuser@example.com', password: 'password123' });

      expect(res.status).toBe(201);

      // Verify user was added to the group
      const updatedGroup = await Group.findById(group._id);
      const newUser = await User.findOne({ email: 'newuser@example.com' });
      expect(updatedGroup.members.map(m => m.toString())).toContain(newUser._id.toString());

      // Verify pending invite was deleted
      const remainingInvites = await PendingGroupInvite.find({ email: 'newuser@example.com' });
      expect(remainingInvites).toHaveLength(0);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({ name: 'John', email: 'john@example.com', password: 'password123' });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'john@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.name).toBe('John');
      expect(res.body.email).toBe('john@example.com');
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'john@example.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should return 401 for non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should return 400 for missing email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });

      expect(res.status).toBe(400);
    });

    it('should return 400 for missing password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'john@example.com' });

      expect(res.status).toBe(400);
    });
  });
});
