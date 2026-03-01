const mongoose = require('mongoose');
const Category = require('../../models/Category');
const User = require('../../models/User');

require('../setup');

describe('Category Model', () => {
  let adminUser;

  beforeEach(async () => {
    adminUser = await User.create({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'password123',
      isAdmin: true,
    });
  });

  describe('Schema Validation', () => {
    it('should create a category with valid fields', async () => {
      const category = await Category.create({
        name: 'Custom Category',
        createdBy: adminUser._id,
      });

      expect(category._id).toBeDefined();
      expect(category.name).toBe('Custom Category');
      expect(category.createdBy).toEqual(adminUser._id);
      expect(category.createdAt).toBeDefined();
    });

    it('should require name', async () => {
      await expect(
        Category.create({ createdBy: adminUser._id })
      ).rejects.toThrow();
    });

    it('should require createdBy', async () => {
      await expect(
        Category.create({ name: 'Test Category' })
      ).rejects.toThrow();
    });

    it('should enforce unique name', async () => {
      await Category.create({
        name: 'Unique Category',
        createdBy: adminUser._id,
      });

      await expect(
        Category.create({
          name: 'Unique Category',
          createdBy: adminUser._id,
        })
      ).rejects.toThrow();
    });

    it('should trim name', async () => {
      const category = await Category.create({
        name: '  Custom Category  ',
        createdBy: adminUser._id,
      });

      expect(category.name).toBe('Custom Category');
    });
  });
});
