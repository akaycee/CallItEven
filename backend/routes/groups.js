const express = require('express');
const { protect } = require('../middleware/auth');
const Group = require('../models/Group');
const User = require('../models/User');
const PendingGroupInvite = require('../models/PendingGroupInvite');
const { resolveGroupMembers, storePendingInvites } = require('../utils/helpers');

const router = express.Router();

// @route   GET /api/groups
// @desc    Get all groups for the logged-in user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const groups = await Group.find({ 
      members: req.user._id 
    })
    .populate({
      path: 'members',
      select: 'name email',
      match: { isAdmin: { $ne: true } }
    })
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

    res.json(groups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/groups/:id
// @desc    Get a single group by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate({
        path: 'members',
        select: 'name email',
        match: { isAdmin: { $ne: true } }
      })
      .populate('createdBy', 'name email');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is a member of the group
    const isMember = group.members.some(member => member._id.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/groups
// @desc    Create a new group
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { name, memberEmails } = req.body;

    if (!name || !memberEmails || memberEmails.length < 1) {
      return res.status(400).json({ message: 'Name and at least one other member are required' });
    }

    // Resolve members from emails
    const { memberIds, notFoundEmails } = await resolveGroupMembers(memberEmails, req.user._id, User);

    if (memberIds.length < 2) {
      return res.status(400).json({ message: 'A group must have at least 2 members' });
    }

    const group = await Group.create({
      name,
      members: memberIds,
      createdBy: req.user._id
    });

    // Store pending invitations for users who haven't signed up yet
    await storePendingInvites(notFoundEmails, group._id, req.user._id, PendingGroupInvite);

    const populatedGroup = await Group.findById(group._id)
      .populate('members', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json({ group: populatedGroup, notFoundEmails });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   PUT /api/groups/:id
// @desc    Update a group
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, memberEmails } = req.body;

    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Only creator can update
    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the creator can update this group' });
    }

    if (name) {
      group.name = name;
    }

    let notFoundEmails = [];
    
    if (memberEmails) {
      const resolved = await resolveGroupMembers(memberEmails, req.user._id, User);
      notFoundEmails = resolved.notFoundEmails;

      if (resolved.memberIds.length < 2) {
        return res.status(400).json({ message: 'A group must have at least 2 members' });
      }

      group.members = resolved.memberIds;
      
      // Store pending invitations for users who haven't signed up yet
      await storePendingInvites(notFoundEmails, group._id, req.user._id, PendingGroupInvite);
    }

    await group.save();

    const populatedGroup = await Group.findById(group._id)
      .populate('members', 'name email')
      .populate('createdBy', 'name email');

    res.json({ group: populatedGroup, notFoundEmails });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   DELETE /api/groups/:id
// @desc    Delete a group
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Only creator can delete
    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the creator can delete this group' });
    }

    await Group.findByIdAndDelete(req.params.id);

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
