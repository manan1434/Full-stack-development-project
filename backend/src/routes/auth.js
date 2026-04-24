const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');

const User = require('../models/User');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { COOKIE_NAME, cookieOptions } = require('../utils/cookies');

const router = express.Router();

function signToken(userId) {
  return jwt.sign({ sub: userId.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

router.post(
  '/register',
  [
    body('name').isString().trim().isLength({ min: 1, max: 80 }).withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').isString().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, email, password } = req.body;
      const existing = await User.findOne({ email });
      if (existing) return res.status(409).json({ error: 'Email already registered' });

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({ name, email, passwordHash });

      const token = signToken(user._id);
      res.cookie(COOKIE_NAME, token, cookieOptions());
      res.status(201).json({ user: user.toJSON() });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').isString().isLength({ min: 1 }).withMessage('Password required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });

      const ok = await user.comparePassword(password);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

      const token = signToken(user._id);
      res.cookie(COOKIE_NAME, token, cookieOptions());
      res.json({ user: user.toJSON() });
    } catch (err) {
      next(err);
    }
  }
);

router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
  res.json({ ok: true });
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: user.toJSON() });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
