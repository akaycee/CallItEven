const express = require('express');
const logger = require('../utils/logger');
const { protect } = require('../middleware/auth');
const FamilyGroup = require('../models/FamilyGroup');
const User = require('../models/User');

const router = express.Router();

// @route   POST /api/family
// @desc    Create a family group
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { name, memberEmails } = req.body;

    if (!name || !memberEmails || memberEmails.length < 1) {
      return res.status(400).json({ message: 'Name and at least one other member email are required' });
    }

    // Check if current user is already in a family
    const currentUser = await User.findById(req.user._id);
    if (currentUser.familyGroup) {
      return res.status(400).json({ message: 'You are already in a family group' });
    }

    // Resolve members from emails
    const members = await User.find({
      email: { $in: memberEmails },
      isAdmin: { $ne: true }
    }).select('_id email familyGroup');

    // Check if any found member is already in a family
    for (const member of members) {
      if (member.familyGroup) {
        return res.status(400).json({ message: `${member.email} is already in a family group` });
      }
    }

    const memberIds = members.map(m => m._id.toString());
    if (!memberIds.includes(req.user._id.toString())) {
      memberIds.push(req.user._id);
    }

    if (memberIds.length < 2) {
      return res.status(400).json({ message: 'A family group must have at least 2 members' });
    }

    const familyGroup = await FamilyGroup.create({
      name,
      members: memberIds,
      createdBy: req.user._id
    });

    // Update all members' familyGroup field
    await User.updateMany(
      { _id: { $in: memberIds } },
      { familyGroup: familyGroup._id }
    );

    await familyGroup.populate('members', 'name email');
    await familyGroup.populate('createdBy', 'name email');

    res.status(201).json(familyGroup);
  } catch (error) {
    logger.error({ err: error }, error.message);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   GET /api/family
// @desc    Get current user's family group
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    if (!currentUser.familyGroup) {
      return res.json(null);
    }

    const familyGroup = await FamilyGroup.findById(currentUser.familyGroup)
      .populate('members', 'name email')
      .populate('createdBy', 'name email')
      .lean();

    if (!familyGroup) {
      return res.json(null);
    }

    res.json(familyGroup);
  } catch (error) {
    logger.error({ err: error }, error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/family/members
// @desc    Get family member IDs (quick endpoint)
// @access  Private
router.get('/members', protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    if (!currentUser.familyGroup) {
      return res.json([]);
    }

    const familyGroup = await FamilyGroup.findById(currentUser.familyGroup).lean();
    if (!familyGroup) {
      return res.json([]);
    }

    res.json(familyGroup.members);
  } catch (error) {
    logger.error({ err: error }, error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/family/:id
// @desc    Update family group (name, add/remove members) - creator only
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, memberEmails } = req.body;

    const familyGroup = await FamilyGroup.findById(req.params.id);
    if (!familyGroup) {
      return res.status(404).json({ message: 'Family group not found' });
    }

    if (familyGroup.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the creator can update this family group' });
    }

    if (name) {
      familyGroup.name = name;
    }

    if (memberEmails) {
      const members = await User.find({
        email: { $in: memberEmails },
        isAdmin: { $ne: true }
      }).select('_id email familyGroup');

      // Check if any new member is already in a different family
      for (const member of members) {
        if (member.familyGroup && member.familyGroup.toString() !== familyGroup._id.toString()) {
          return res.status(400).json({ message: `${member.email} is already in another family group` });
        }
      }

      const newMemberIds = members.map(m => m._id.toString());
      if (!newMemberIds.includes(req.user._id.toString())) {
        newMemberIds.push(req.user._id);
      }

      if (newMemberIds.length < 2) {
        return res.status(400).json({ message: 'A family group must have at least 2 members' });
      }

      // Clear familyGroup for removed members
      const oldMemberIds = familyGroup.members.map(m => m.toString());
      const removedMembers = oldMemberIds.filter(id => !newMemberIds.includes(id));
      if (removedMembers.length > 0) {
        await User.updateMany(
          { _id: { $in: removedMembers } },
          { familyGroup: null }
        );
      }

      // Set familyGroup for new members
      const addedMembers = newMemberIds.filter(id => !oldMemberIds.includes(id));
      if (addedMembers.length > 0) {
        await User.updateMany(
          { _id: { $in: addedMembers } },
          { familyGroup: familyGroup._id }
        );
      }

      familyGroup.members = newMemberIds;
    }

    await familyGroup.save();

    await familyGroup.populate('members', 'name email');
    await familyGroup.populate('createdBy', 'name email');

    res.json(familyGroup);
  } catch (error) {
    logger.error({ err: error }, error.message);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   DELETE /api/family/:id
// @desc    Delete family group - creator only
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const familyGroup = await FamilyGroup.findById(req.params.id);

    if (!familyGroup) {
      return res.status(404).json({ message: 'Family group not found' });
    }

    if (familyGroup.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the creator can delete this family group' });
    }

    // Clear familyGroup on all members
    await User.updateMany(
      { _id: { $in: familyGroup.members } },
      { familyGroup: null }
    );

    await FamilyGroup.findByIdAndDelete(req.params.id);

    res.json({ message: 'Family group deleted successfully' });
  } catch (error) {
    logger.error({ err: error }, error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
