const mongoose = require('mongoose');
const User = require('../../models/User');

require('../setup');

describe('User Model', () => {
  describe('Schema Validation', () => {
    it('should create a user with valid fields', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      expect(user._id).toBeDefined();
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.isAdmin).toBe(false);
      expect(user.createdAt).toBeDefined();
    });

    it('should require name', async () => {
      await expect(
        User.create({ email: 'test@example.com', password: 'password123' })
      ).rejects.toThrow();
    });

    it('should require email', async () => {
      await expect(
        User.create({ name: 'John', password: 'password123' })
      ).rejects.toThrow();
    });

    it('should require password', async () => {
      await expect(
        User.create({ name: 'John', email: 'john@example.com' })
      ).rejects.toThrow();
    });

    it('should enforce unique email', async () => {
      await User.create({
        name: 'John',
        email: 'duplicate@example.com',
        password: 'password123',
      });

      await expect(
        User.create({
          name: 'Jane',
          email: 'duplicate@example.com',
          password: 'password456',
        })
      ).rejects.toThrow();
    });

    it('should lowercase email', async () => {
      const user = await User.create({
        name: 'John',
        email: 'JOHN@EXAMPLE.COM',
        password: 'password123',
      });

      expect(user.email).toBe('john@example.com');
    });

    it('should trim name and email', async () => {
      const user = await User.create({
        name: '  John  ',
        email: '  john@example.com  ',
        password: 'password123',
      });

      expect(user.name).toBe('John');
      expect(user.email).toBe('john@example.com');
    });

    it('should default isAdmin to false', async () => {
      const user = await User.create({
        name: 'John',
        email: 'john@example.com',
        password: 'password123',
      });

      expect(user.isAdmin).toBe(false);
    });

    it('should allow setting isAdmin to true', async () => {
      const user = await User.create({
        name: 'Admin',
        email: 'admin@example.com',
        password: 'password123',
        isAdmin: true,
      });

      expect(user.isAdmin).toBe(true);
    });
  });

  describe('Password Hashing', () => {
    it('should hash password on creation', async () => {
      const user = await User.create({
        name: 'John',
        email: 'john@example.com',
        password: 'password123',
      });

      expect(user.password).not.toBe('password123');
      expect(user.password).toMatch(/^\$2[aby]?\$/); // bcrypt hash pattern
    });

    it('should hash password on update when password is modified', async () => {
      const user = await User.create({
        name: 'John',
        email: 'john@example.com',
        password: 'password123',
      });

      const originalHash = user.password;
      user.password = 'newpassword456';
      await user.save();

      expect(user.password).not.toBe('newpassword456');
      expect(user.password).not.toBe(originalHash);
    });

    it('should not re-hash password when other fields are modified', async () => {
      const user = await User.create({
        name: 'John',
        email: 'john@example.com',
        password: 'password123',
      });

      const originalHash = user.password;
      user.name = 'John Updated';
      await user.save();

      expect(user.password).toBe(originalHash);
    });
  });

  describe('matchPassword Method', () => {
    it('should return true for correct password', async () => {
      const user = await User.create({
        name: 'John',
        email: 'john@example.com',
        password: 'password123',
      });

      const isMatch = await user.matchPassword('password123');
      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const user = await User.create({
        name: 'John',
        email: 'john@example.com',
        password: 'password123',
      });

      const isMatch = await user.matchPassword('wrongpassword');
      expect(isMatch).toBe(false);
    });
  });
});
