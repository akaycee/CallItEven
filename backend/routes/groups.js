const express = require('express');
const { protect } = require('../middleware/auth');
const Group = require('../models/Group');
const User = require('../models/User');
const PendingGroupInvite = require('../models/PendingGroupInvite');

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

    // Find users by email
    const members = await User.find({ 
      email: { $in: memberEmails },
      isAdmin: { $ne: true }
    }).select('_id email');
    
    // Track not found emails for invite dialog
    const foundEmails = members.map(m => m.email);
    const notFoundEmails = memberEmails.filter(email => !foundEmails.includes(email));

    // Add creator to members if not already included
    const memberIds = members.map(m => m._id.toString());
    if (!memberIds.includes(req.user._id.toString())) {
      memberIds.push(req.user._id);
    }

    if (memberIds.length < 2) {
      return res.status(400).json({ message: 'A group must have at least 2 members' });
    }

    const group = await Group.create({
      name,
      members: memberIds,
      createdBy: req.user._id
    });

    // Store pending invitations for users who haven't signed up yet
    if (notFoundEmails.length > 0) {
      const pendingInvites = notFoundEmails.map(email => ({
        email,
        group: group._id,
        invitedBy: req.user._id,
      }));
      
      // Use insertMany with ordered: false to skip duplicates without failing
      await PendingGroupInvite.insertMany(pendingInvites, { ordered: false }).catch(err => {
        // Ignore duplicate key errors (code 11000)
        if (err.code !== 11000) throw err;
      });
    }

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
      const members = await User.find({ 
        email: { $in: memberEmails },
        isAdmin: { $ne: true }
      }).select('_id email');
      
      // Track not found emails for pending invitations
      const foundEmails = members.map(m => m.email);
      notFoundEmails = memberEmails.filter(email => !foundEmails.includes(email));

      const memberIds = members.map(m => m._id.toString());
      
      // Ensure creator is always a member
      if (!memberIds.includes(req.user._id.toString())) {
        memberIds.push(req.user._id);
      }

      if (memberIds.length < 2) {
        return res.status(400).json({ message: 'A group must have at least 2 members' });
      }

      group.members = memberIds;
      
      // Store pending invitations for users who haven't signed up yet
      if (notFoundEmails.length > 0) {
        const pendingInvites = notFoundEmails.map(email => ({
          email,
          group: group._id,
          invitedBy: req.user._id,
        }));
        
        // Use insertMany with ordered: false to skip duplicates without failing
        await PendingGroupInvite.insertMany(pendingInvites, { ordered: false }).catch(err => {
          // Ignore duplicate key errors (code 11000)
          if (err.code !== 11000) throw err;
        });
      }
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
