const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  isFamilyBudget: {
    type: Boolean,
    default: false
  },
  familyGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyGroup'
  }
}, {
  timestamps: true
});

// One budget per category per user per budget type
budgetSchema.index({ user: 1, category: 1, isFamilyBudget: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
