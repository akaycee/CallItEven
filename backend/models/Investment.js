const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['stocks', 'bonds', 'real_estate', 'crypto', 'mutual_fund', 'etf', 'retirement', 'other'],
    required: true
  },
  purchasePrice: {
    type: Number,
    required: true,
    min: 0
  },
  currentValue: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    default: 1,
    min: 0
  },
  purchaseDate: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  tag: {
    type: String,
    trim: true,
    default: ''
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  hideFromFamily: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
investmentSchema.index({ user: 1, type: 1 });

// Virtuals
investmentSchema.virtual('totalCost').get(function() {
  return this.purchasePrice * (this.quantity || 1);
});

investmentSchema.virtual('totalValue').get(function() {
  return this.currentValue * (this.quantity || 1);
});

investmentSchema.virtual('gainLoss').get(function() {
  return this.totalValue - this.totalCost;
});

investmentSchema.virtual('gainLossPercent').get(function() {
  if (this.totalCost === 0) return 0;
  return ((this.totalValue - this.totalCost) / this.totalCost) * 100;
});

module.exports = mongoose.model('Investment', investmentSchema);
