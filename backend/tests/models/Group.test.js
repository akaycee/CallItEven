const mongoose = require('mongoose');
const Group = require('../../models/Group');
const User = require('../../models/User');

require('../setup');

describe('Group Model', () => {
  let user1, user2, user3;

  beforeEach(async () => {
    user1 = await User.create({ name: 'User 1', email: 'user1@example.com', password: 'password123' });
    user2 = await User.create({ name: 'User 2', email: 'user2@example.com', password: 'password123' });
    user3 = await User.create({ name: 'User 3', email: 'user3@example.com', password: 'password123' });
  });

  describe('Schema Validation', () => {
    it('should create a group with valid fields', async () => {
      const group = await Group.create({
        name: 'Test Group',
        members: [user1._id, user2._id],
        createdBy: user1._id,
      });

      expect(group._id).toBeDefined();
      expect(group.name).toBe('Test Group');
      expect(group.members).toHaveLength(2);
      expect(group.createdBy).toEqual(user1._id);
      expect(group.createdAt).toBeDefined();
    });

    it('should require name', async () => {
      await expect(
        Group.create({ members: [user1._id, user2._id], createdBy: user1._id })
      ).rejects.toThrow();
    });

    it('should require createdBy', async () => {
      await expect(
        Group.create({ name: 'Test Group', members: [user1._id, user2._id] })
      ).rejects.toThrow();
    });

    it('should trim name', async () => {
      const group = await Group.create({
        name: '  Test Group  ',
        members: [user1._id, user2._id],
        createdBy: user1._id,
      });

      expect(group.name).toBe('Test Group');
    });
  });

  describe('Minimum Members Validation', () => {
    it('should reject group with less than 2 members', async () => {
      await expect(
        Group.create({
          name: 'Small Group',
          members: [user1._id],
          createdBy: user1._id,
        })
      ).rejects.toThrow('A group must have at least 2 members');
    });

    it('should accept group with exactly 2 members', async () => {
      const group = await Group.create({
        name: 'Pair Group',
        members: [user1._id, user2._id],
        createdBy: user1._id,
      });

      expect(group.members).toHaveLength(2);
    });

    it('should accept group with 3+ members', async () => {
      const group = await Group.create({
        name: 'Big Group',
        members: [user1._id, user2._id, user3._id],
        createdBy: user1._id,
      });

      expect(group.members).toHaveLength(3);
    });

    it('should reject group with empty members array', async () => {
      await expect(
        Group.create({
          name: 'Empty Group',
          members: [],
          createdBy: user1._id,
        })
      ).rejects.toThrow('A group must have at least 2 members');
    });
  });

  describe('Population', () => {
    it('should populate members with user data', async () => {
      const group = await Group.create({
        name: 'Test Group',
        members: [user1._id, user2._id],
        createdBy: user1._id,
      });

      const populatedGroup = await Group.findById(group._id)
        .populate('members', 'name email')
        .populate('createdBy', 'name email');

      expect(populatedGroup.members[0].name).toBeDefined();
      expect(populatedGroup.members[0].email).toBeDefined();
      expect(populatedGroup.createdBy.name).toBe('User 1');
    });
  });
});
