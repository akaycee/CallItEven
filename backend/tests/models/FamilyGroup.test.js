const mongoose = require('mongoose');
const FamilyGroup = require('../../models/FamilyGroup');
const User = require('../../models/User');

require('../setup');

describe('FamilyGroup Model', () => {
  let user1, user2, user3;

  beforeEach(async () => {
    user1 = await User.create({ name: 'User 1', email: 'user1@example.com', password: 'password123' });
    user2 = await User.create({ name: 'User 2', email: 'user2@example.com', password: 'password123' });
    user3 = await User.create({ name: 'User 3', email: 'user3@example.com', password: 'password123' });
  });

  describe('Schema Validation', () => {
    it('should create a family group with valid fields', async () => {
      const family = await FamilyGroup.create({
        name: 'Test Family',
        members: [user1._id, user2._id],
        createdBy: user1._id,
      });

      expect(family._id).toBeDefined();
      expect(family.name).toBe('Test Family');
      expect(family.members).toHaveLength(2);
      expect(family.createdBy).toEqual(user1._id);
      expect(family.createdAt).toBeDefined();
    });

    it('should require name', async () => {
      await expect(
        FamilyGroup.create({ members: [user1._id, user2._id], createdBy: user1._id })
      ).rejects.toThrow();
    });

    it('should require createdBy', async () => {
      await expect(
        FamilyGroup.create({ name: 'Test Family', members: [user1._id, user2._id] })
      ).rejects.toThrow();
    });

    it('should trim name', async () => {
      const family = await FamilyGroup.create({
        name: '  Test Family  ',
        members: [user1._id, user2._id],
        createdBy: user1._id,
      });

      expect(family.name).toBe('Test Family');
    });
  });

  describe('Minimum Members Validation', () => {
    it('should reject family group with less than 2 members', async () => {
      await expect(
        FamilyGroup.create({
          name: 'Small Family',
          members: [user1._id],
          createdBy: user1._id,
        })
      ).rejects.toThrow('A family group must have at least 2 members');
    });

    it('should accept family group with exactly 2 members', async () => {
      const family = await FamilyGroup.create({
        name: 'Couple',
        members: [user1._id, user2._id],
        createdBy: user1._id,
      });

      expect(family.members).toHaveLength(2);
    });

    it('should accept family group with 3+ members', async () => {
      const family = await FamilyGroup.create({
        name: 'Big Family',
        members: [user1._id, user2._id, user3._id],
        createdBy: user1._id,
      });

      expect(family.members).toHaveLength(3);
    });

    it('should reject family group with empty members array', async () => {
      await expect(
        FamilyGroup.create({
          name: 'Empty Family',
          members: [],
          createdBy: user1._id,
        })
      ).rejects.toThrow('A family group must have at least 2 members');
    });
  });

  describe('Population', () => {
    it('should populate members with user data', async () => {
      const family = await FamilyGroup.create({
        name: 'Test Family',
        members: [user1._id, user2._id],
        createdBy: user1._id,
      });

      const populatedFamily = await FamilyGroup.findById(family._id)
        .populate('members', 'name email')
        .populate('createdBy', 'name email');

      expect(populatedFamily.members[0].name).toBeDefined();
      expect(populatedFamily.members[0].email).toBeDefined();
      expect(populatedFamily.createdBy.name).toBe('User 1');
    });
  });
});
