const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  splitType: {
    type: String,
    enum: ['equal', 'percentage', 'unequal'],
    required: true
  },
  splits: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    trim: true,
    default: 'Uncategorized'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Validate that splits add up correctly
expenseSchema.pre('save', function(next) {
  const totalSplitAmount = this.splits.reduce((sum, split) => sum + split.amount, 0);
  
  // Allow small rounding errors (within 0.01)
  if (Math.abs(totalSplitAmount - this.totalAmount) > 0.01) {
    return next(new Error('Split amounts must add up to total amount'));
  }
  
  if (this.splitType === 'percentage') {
    const totalPercentage = this.splits.reduce((sum, split) => sum + (split.percentage || 0), 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return next(new Error('Percentages must add up to 100'));
    }
  }
  
  next();
});

module.exports = mongoose.model('Expense', expenseSchema);
