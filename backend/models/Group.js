const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for better query performance
groupSchema.index({ members: 1 });
groupSchema.index({ createdBy: 1 });

// Validation: at least 2 members
groupSchema.pre('save', function(next) {
  if (this.members.length < 2) {
    next(new Error('A group must have at least 2 members'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Group', groupSchema);
