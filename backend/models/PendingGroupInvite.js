const mongoose = require('mongoose');

const pendingGroupInviteSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 2592000, // Auto-delete after 30 days
  },
});

// Create compound index for efficient lookups
pendingGroupInviteSchema.index({ email: 1, group: 1 }, { unique: true });
pendingGroupInviteSchema.index({ group: 1 });

module.exports = mongoose.model('PendingGroupInvite', pendingGroupInviteSchema);
