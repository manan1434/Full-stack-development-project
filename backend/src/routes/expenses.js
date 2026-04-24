const express = require('express');
const { body, param, query } = require('express-validator');

const Expense = require('../models/Expense');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { classifyExpense } = require('../services/mlClient');
const { CATEGORIES } = require('../config/categories');
const { monthRange } = require('../utils/month');

const router = express.Router();
router.use(requireAuth);

router.post(
  '/',
  [
    body('amount').isFloat({ min: 0 }).withMessage('amount must be a non-negative number'),
    body('description').isString().trim().isLength({ min: 1, max: 500 }).withMessage('description is required'),
    body('date').optional().isISO8601().withMessage('date must be ISO8601'),
    body('category').optional().isIn(CATEGORIES).withMessage('invalid category'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { amount, description, date, category: overrideCategory } = req.body;

      let category = overrideCategory;
      if (!category) {
        const prediction = await classifyExpense({ description, amount });
        category = prediction.category;
      }

      const expense = await Expense.create({
        userId: req.userId,
        amount,
        description,
        category,
        date: date ? new Date(date) : new Date(),
      });
      res.status(201).json({ expense });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/',
  [
    query('month').optional().matches(/^\d{4}-\d{2}$/).withMessage('month must be YYYY-MM'),
    query('category').optional().isIn(CATEGORIES).withMessage('invalid category'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const filter = { userId: req.userId };
      if (req.query.category) filter.category = req.query.category;
      if (req.query.month) {
        const { start, end } = monthRange(req.query.month);
        filter.date = { $gte: start, $lt: end };
      }
      const expenses = await Expense.find(filter).sort({ date: -1, _id: -1 }).lean();
      res.json({ expenses });
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/:id',
  [
    param('id').isMongoId(),
    body('amount').optional().isFloat({ min: 0 }),
    body('description').optional().isString().trim().isLength({ min: 1, max: 500 }),
    body('date').optional().isISO8601(),
    body('category').optional().isIn(CATEGORIES),
  ],
  validate,
  async (req, res, next) => {
    try {
      const updates = {};
      for (const key of ['amount', 'description', 'category']) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }
      if (req.body.date !== undefined) updates.date = new Date(req.body.date);

      const expense = await Expense.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        updates,
        { new: true, runValidators: true }
      );
      if (!expense) return res.status(404).json({ error: 'Expense not found' });
      res.json({ expense });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/:id',
  [param('id').isMongoId()],
  validate,
  async (req, res, next) => {
    try {
      const deleted = await Expense.findOneAndDelete({
        _id: req.params.id,
        userId: req.userId,
      });
      if (!deleted) return res.status(404).json({ error: 'Expense not found' });
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
