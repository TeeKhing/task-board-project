const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

const signToken = (user) =>
  jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

const normalizeEmail = (email) => (typeof email === 'string' ? email.trim().toLowerCase() : '');
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = normalizeEmail(email);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!isValidEmail(normalizedEmail) || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Enter a valid email and a password with at least 8 characters' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
    });

    const token = signToken(user);

    return res.status(201).json({
      token,
      user: { id: user._id, email: user.email },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    console.error('Account creation failed', error);
    return res.status(500).json({ error: 'Unable to create account' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail) || typeof password !== 'string' || password.length === 0) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(user);

    return res.json({
      token,
      user: { id: user._id, email: user.email },
    });
  } catch (error) {
    console.error('Sign in failed', error);
    return res.status(500).json({ error: 'Unable to sign in' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('email');
    if (!user) {
      return res.status(401).json({ error: 'Account not found' });
    }

    return res.json({ id: user._id, email: user.email });
  } catch (error) {
    console.error('Loading account failed', error);
    return res.status(500).json({ error: 'Unable to load account' });
  }
});

router.post('/logout', (req, res) => {
  return res.json({ message: 'logged out' });
});

module.exports = router;
