const express = require('express');
const mongoose = require('mongoose');
const { query } = require('express-validator');

const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { monthRange, currentMonthString } = require('../utils/month');

const router = express.Router();
router.use(requireAuth);

router.get(
  '/summary',
  [query('month').optional().matches(/^\d{4}-\d{2}$/).withMessage('month must be YYYY-MM')],
  validate,
  async (req, res, next) => {
    try {
      const monthStr = req.query.month || currentMonthString();
      const { start, end } = monthRange(monthStr);
      const userObjectId = new mongoose.Types.ObjectId(req.userId);

      const byCategoryAgg = await Expense.aggregate([
        { $match: { userId: userObjectId, date: { $gte: start, $lt: end } } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $project: { _id: 0, category: '$_id', total: 1, count: 1 } },
        { $sort: { total: -1 } },
      ]);

      const total = byCategoryAgg.reduce((sum, row) => sum + row.total, 0);

      const budgets = await Budget.find({ userId: userObjectId }).lean();
      const spentByCategory = Object.fromEntries(byCategoryAgg.map((r) => [r.category, r.total]));
      const budgetStatus = budgets.map((b) => {
        const spent = spentByCategory[b.category] || 0;
        return {
          category: b.category,
          monthlyLimit: b.monthlyLimit,
          spent,
          overBudget: spent > b.monthlyLimit,
        };
      });

      res.json({
        month: monthStr,
        total,
        byCategory: byCategoryAgg,
        budgets: budgetStatus,
      });
    } catch (err) {
      next(err);
    }
  }
);

// Bar chart data: monthly totals for the last N months.
router.get(
  '/monthly',
  [query('months').optional().isInt({ min: 1, max: 24 })],
  validate,
  async (req, res, next) => {
    try {
      const months = parseInt(req.query.months, 10) || 6;
      const now = new Date();
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));
      const userObjectId = new mongoose.Types.ObjectId(req.userId);

      const rows = await Expense.aggregate([
        { $match: { userId: userObjectId, date: { $gte: start } } },
        {
          $group: {
            _id: { y: { $year: '$date' }, m: { $month: '$date' } },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.y': 1, '_id.m': 1 } },
      ]);

      const byKey = new Map(
        rows.map((r) => [`${r._id.y}-${String(r._id.m).padStart(2, '0')}`, r.total])
      );

      const series = [];
      for (let i = months - 1; i >= 0; i--) {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
        const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
        series.push({ month: key, total: byKey.get(key) || 0 });
      }
      res.json({ series });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
