const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const Group = require('../../models/Group');
const PendingGroupInvite = require('../../models/PendingGroupInvite');
const { createTestUser } = require('../helpers');

require('../setup');

describe('Group Routes', () => {
  let user1, token1, user2, token2, user3;

  beforeEach(async () => {
    ({ user: user1, token: token1 } = await createTestUser({ email: 'user1@example.com', name: 'User One' }));
    ({ user: user2, token: token2 } = await createTestUser({ email: 'user2@example.com', name: 'User Two' }));
    user3 = (await createTestUser({ email: 'user3@example.com', name: 'User Three' })).user;
  });

  describe('GET /api/groups', () => {
    it('should return groups the user is a member of', async () => {
      await Group.create({
        name: 'Group A',
        members: [user1._id, user2._id],
        createdBy: user1._id,
      });

      await Group.create({
        name: 'Group B',
        members: [user2._id, user3._id],
        createdBy: user2._id,
      });

      const res = await request(app)
        .get('/api/groups')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('Group A');
    });

    it('should populate members and createdBy', async () => {
      await Group.create({
        name: 'Group A',
        members: [user1._id, user2._id],
        createdBy: user1._id,
      });

      const res = await request(app)
        .get('/api/groups')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body[0].createdBy).toHaveProperty('name');
      expect(res.body[0].createdBy).toHaveProperty('email');
      expect(res.body[0].members[0]).toHaveProperty('name');
    });

    it('should exclude admin users from populated members', async () => {
      const adminUser = await User.create({
        name: 'Admin',
        email: 'admin@example.com',
        password: 'password123',
        isAdmin: true,
      });

      await Group.create({
        name: 'Admin Group',
        members: [user1._id, user2._id, adminUser._id],
        createdBy: user1._id,
      });

      const res = await request(app)
        .get('/api/groups')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      const memberEmails = res.body[0].members.map(m => m.email);
      expect(memberEmails).not.toContain('admin@example.com');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/groups');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/groups/:id', () => {
    it('should return a group for a member', async () => {
      const group = await Group.create({
        name: 'My Group',
        members: [user1._id, user2._id],
        createdBy: user1._id,
      });

      const res = await request(app)
        .get(`/api/groups/${group._id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('My Group');
    });

    it('should return 403 for non-member', async () => {
      const group = await Group.create({
        name: 'Private Group',
        members: [user1._id, user2._id],
        createdBy: user1._id,
      });

      const { token: token3 } = await createTestUser({ email: 'outsider@example.com' });

      const res = await request(app)
        .get(`/api/groups/${group._id}`)
        .set('Authorization', `Bearer ${token3}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent group', async () => {
      const mongoose = require('mongoose');
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/groups/${fakeId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/groups', () => {
    it('should create a group with found members', async () => {
      const res = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'New Group',
          memberEmails: ['user2@example.com'],
        });

      expect(res.status).toBe(201);
      expect(res.body.group.name).toBe('New Group');
      expect(res.body.notFoundEmails).toHaveLength(0);
    });

    it('should auto-add creator as member', async () => {
      const res = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'New Group',
          memberEmails: ['user2@example.com'],
        });

      expect(res.status).toBe(201);
      const memberIds = res.body.group.members.map(m => m._id);
      expect(memberIds).toContain(user1._id.toString());
    });

    it('should return notFoundEmails for non-existent users', async () => {
      const res = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'New Group',
          memberEmails: ['user2@example.com', 'unknown@example.com'],
        });

      expect(res.status).toBe(201);
      expect(res.body.notFoundEmails).toContain('unknown@example.com');
    });

    it('should create pending invites for non-existent users', async () => {
      await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'Invite Group',
          memberEmails: ['user2@example.com', 'newperson@example.com'],
        });

      const invites = await PendingGroupInvite.find({ email: 'newperson@example.com' });
      expect(invites).toHaveLength(1);
      expect(invites[0].invitedBy.toString()).toBe(user1._id.toString());
    });

    it('should return 400 without name', async () => {
      const res = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          memberEmails: ['user2@example.com'],
        });

      expect(res.status).toBe(400);
    });

    it('should return 400 without memberEmails', async () => {
      const res = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'No Members Group',
        });

      expect(res.status).toBe(400);
    });

    it('should return 400 when resulting group has less than 2 members', async () => {
      const res = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'Too Small',
          memberEmails: ['nonexistent@example.com'], // only creator + no found members = 1
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('at least 2 members');
    });

    it('should exclude admin users from group members', async () => {
      await User.create({
        name: 'Admin',
        email: 'admingroup@example.com',
        password: 'password123',
        isAdmin: true,
      });

      const res = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'No Admin Group',
          memberEmails: ['user2@example.com', 'admingroup@example.com'],
        });

      expect(res.status).toBe(201);
      const memberEmails = res.body.group.members.map(m => m.email);
      expect(memberEmails).not.toContain('admingroup@example.com');
    });
  });

  describe('PUT /api/groups/:id', () => {
    let group;

    beforeEach(async () => {
      group = await Group.create({
        name: 'Update Group',
        members: [user1._id, user2._id],
        createdBy: user1._id,
      });
    });

    it('should update group name by creator', async () => {
      const res = await request(app)
        .put(`/api/groups/${group._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.group.name).toBe('Updated Name');
    });

    it('should update group members by creator', async () => {
      const res = await request(app)
        .put(`/api/groups/${group._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'Updated Group',
          memberEmails: ['user2@example.com', 'user3@example.com'],
        });

      expect(res.status).toBe(200);
      expect(res.body.group.members.length).toBeGreaterThanOrEqual(2);
    });

    it('should return 403 when non-creator tries to update', async () => {
      const res = await request(app)
        .put(`/api/groups/${group._id}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ name: 'Hacked Name' });

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent group', async () => {
      const mongoose = require('mongoose');
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .put(`/api/groups/${fakeId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ name: 'Test' });

      expect(res.status).toBe(404);
    });

    it('should create pending invites for unknown emails on update', async () => {
      await request(app)
        .put(`/api/groups/${group._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'Updated Group',
          memberEmails: ['user2@example.com', 'newperson2@example.com'],
        });

      const invites = await PendingGroupInvite.find({ email: 'newperson2@example.com' });
      expect(invites).toHaveLength(1);
    });

    it('should ensure creator remains a member after update', async () => {
      const res = await request(app)
        .put(`/api/groups/${group._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          memberEmails: ['user2@example.com', 'user3@example.com'],
        });

      expect(res.status).toBe(200);
      const memberIds = res.body.group.members.map(m => m._id);
      expect(memberIds).toContain(user1._id.toString());
    });
  });

  describe('DELETE /api/groups/:id', () => {
    let group;

    beforeEach(async () => {
      group = await Group.create({
        name: 'Delete Group',
        members: [user1._id, user2._id],
        createdBy: user1._id,
      });
    });

    it('should delete group by creator', async () => {
      const res = await request(app)
        .delete(`/api/groups/${group._id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Group deleted successfully');

      const deleted = await Group.findById(group._id);
      expect(deleted).toBeNull();
    });

    it('should return 403 when non-creator tries to delete', async () => {
      const res = await request(app)
        .delete(`/api/groups/${group._id}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent group', async () => {
      const mongoose = require('mongoose');
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .delete(`/api/groups/${fakeId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(404);
    });
  });
});
