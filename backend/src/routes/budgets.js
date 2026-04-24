const express = require('express');
const { body } = require('express-validator');

const Budget = require('../models/Budget');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { CATEGORIES } = require('../config/categories');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const budgets = await Budget.find({ userId: req.userId }).lean();
    res.json({ budgets });
  } catch (err) {
    next(err);
  }
});

router.put(
  '/',
  [
    body('category').isIn(CATEGORIES).withMessage('invalid category'),
    body('monthlyLimit').isFloat({ min: 0 }).withMessage('monthlyLimit must be >= 0'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { category, monthlyLimit } = req.body;
      const budget = await Budget.findOneAndUpdate(
        { userId: req.userId, category },
        { $set: { monthlyLimit } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      res.json({ budget });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
