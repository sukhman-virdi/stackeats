const express       = require('express');
const router        = express.Router();
const User          = require('../models/User');
const mapperFactory = require('../server/mapperFactory');
const { signToken, authenticate } = require('../server/authMiddleware');
const DBUtil        = require('../server/db');

const userMapper = mapperFactory.create('user');

// ─── POST /api/auth/register ──────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Username and password are required.' });

    const existing = await DBUtil.findOne(User, { username: username.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Username already taken.' });

    const safeRole = role === 'guest' ? 'guest' : 'member';
    const user     = await DBUtil.create(User, { username, password, role: safeRole });
    const token    = signToken(user);

    res.status(201).json({ message: 'Account created.', token, user: userMapper.toResponse(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Username and password are required.' });

    // findOne without .lean() so comparePassword method is available
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid username or password.' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ error: 'Invalid username or password.' });

    const token = signToken(user);
    res.json({ message: 'Login successful.', token, user: userMapper.toResponse(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await DBUtil.findById(User, req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: userMapper.toResponse(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────
router.post('/logout', authenticate, (req, res) => {
  res.json({ message: 'Logged out. Please delete your token on the client.' });
});

module.exports = router;