const mongoose = require('mongoose');
const { CATEGORIES } = require('../config/categories');

const expenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, required: true, trim: true },
    category: { type: String, enum: CATEGORIES, required: true },
    date: { type: Date, default: Date.now, index: true },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

expenseSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Expense', expenseSchema);
