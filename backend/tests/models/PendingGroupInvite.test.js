const mongoose = require('mongoose');
const PendingGroupInvite = require('../../models/PendingGroupInvite');
const Group = require('../../models/Group');
const User = require('../../models/User');

require('../setup');

describe('PendingGroupInvite Model', () => {
  let user1, user2, group;

  beforeEach(async () => {
    user1 = await User.create({ name: 'User 1', email: 'user1@example.com', password: 'password123' });
    user2 = await User.create({ name: 'User 2', email: 'user2@example.com', password: 'password123' });
    group = await Group.create({
      name: 'Test Group',
      members: [user1._id, user2._id],
      createdBy: user1._id,
    });
  });

  describe('Schema Validation', () => {
    it('should create a pending invite with valid fields', async () => {
      const invite = await PendingGroupInvite.create({
        email: 'newuser@example.com',
        group: group._id,
        invitedBy: user1._id,
      });

      expect(invite._id).toBeDefined();
      expect(invite.email).toBe('newuser@example.com');
      expect(invite.group).toEqual(group._id);
      expect(invite.invitedBy).toEqual(user1._id);
      expect(invite.createdAt).toBeDefined();
    });

    it('should require email', async () => {
      await expect(
        PendingGroupInvite.create({ group: group._id, invitedBy: user1._id })
      ).rejects.toThrow();
    });

    it('should require group', async () => {
      await expect(
        PendingGroupInvite.create({ email: 'test@example.com', invitedBy: user1._id })
      ).rejects.toThrow();
    });

    it('should require invitedBy', async () => {
      await expect(
        PendingGroupInvite.create({ email: 'test@example.com', group: group._id })
      ).rejects.toThrow();
    });

    it('should lowercase email', async () => {
      const invite = await PendingGroupInvite.create({
        email: 'NEWUSER@EXAMPLE.COM',
        group: group._id,
        invitedBy: user1._id,
      });

      expect(invite.email).toBe('newuser@example.com');
    });

    it('should trim email', async () => {
      const invite = await PendingGroupInvite.create({
        email: '  newuser@example.com  ',
        group: group._id,
        invitedBy: user1._id,
      });

      expect(invite.email).toBe('newuser@example.com');
    });
  });

  describe('Compound Unique Index', () => {
    it('should prevent duplicate invites for same email + group', async () => {
      await PendingGroupInvite.create({
        email: 'newuser@example.com',
        group: group._id,
        invitedBy: user1._id,
      });

      await expect(
        PendingGroupInvite.create({
          email: 'newuser@example.com',
          group: group._id,
          invitedBy: user1._id,
        })
      ).rejects.toThrow();
    });

    it('should allow same email in different groups', async () => {
      const group2 = await Group.create({
        name: 'Group 2',
        members: [user1._id, user2._id],
        createdBy: user1._id,
      });

      await PendingGroupInvite.create({
        email: 'newuser@example.com',
        group: group._id,
        invitedBy: user1._id,
      });

      const invite2 = await PendingGroupInvite.create({
        email: 'newuser@example.com',
        group: group2._id,
        invitedBy: user1._id,
      });

      expect(invite2).toBeDefined();
    });
  });
});
