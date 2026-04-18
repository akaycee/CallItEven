const mongoose = require('mongoose');

const savingsGoalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  targetAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  deadline: {
    type: Date
  },
  category: {
    type: String,
    trim: true,
    default: 'General'
  },
  isFamilyGoal: {
    type: Boolean,
    default: false
  },
  familyGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyGroup'
  },
  description: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
savingsGoalSchema.index({ user: 1 });

// Virtuals
savingsGoalSchema.virtual('progress').get(function() {
  if (this.targetAmount === 0) return 100;
  return Math.min(100, (this.currentAmount / this.targetAmount) * 100);
});

savingsGoalSchema.virtual('remaining').get(function() {
  return Math.max(0, this.targetAmount - this.currentAmount);
});

savingsGoalSchema.virtual('isComplete').get(function() {
  return this.currentAmount >= this.targetAmount;
});

module.exports = mongoose.model('SavingsGoal', savingsGoalSchema);
