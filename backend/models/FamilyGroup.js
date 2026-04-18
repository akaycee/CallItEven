const mongoose = require('mongoose');

const familyGroupSchema = new mongoose.Schema({
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
  }
}, {
  timestamps: true
});

// Index for query performance
familyGroupSchema.index({ members: 1 });

// Validation: at least 2 members
familyGroupSchema.pre('save', function(next) {
  if (this.members.length < 2) {
    next(new Error('A family group must have at least 2 members'));
  } else {
    next();
  }
});

module.exports = mongoose.model('FamilyGroup', familyGroupSchema);
