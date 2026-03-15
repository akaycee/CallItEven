const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  source: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  category: {
    type: String,
    trim: true,
    default: 'General'
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrence: {
    frequency: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly', 'yearly']
    },
    endDate: {
      type: Date,
      default: null
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Validate recurrence fields
incomeSchema.pre('save', function(next) {
  if (this.isRecurring && !this.recurrence?.frequency) {
    return next(new Error('Recurrence frequency is required for recurring income'));
  }
  next();
});

incomeSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Income', incomeSchema);
