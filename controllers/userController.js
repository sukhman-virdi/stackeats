const express       = require('express');
const router        = express.Router();
const User          = require('../models/User');
const mapperFactory = require('../server/mapperFactory');
const DBUtil        = require('../server/db');
const { authenticate, authorize } = require('../server/authMiddleware');

const userMapper = mapperFactory.create('user');

// ─── GET /api/users ───────────────────────────────────────────────────────
// Admin only. List all users.
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const users = await DBUtil.findAll(User);
    res.json({ users: users.map(userMapper.toResponse) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/users/:id ───────────────────────────────────────────────────
// Admin can view any user. Member can only view themselves.
router.get('/:id', authenticate, authorize('admin', 'member'), async (req, res) => {
  try {
    if (req.user.role === 'member' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const user = await DBUtil.findById(User, req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    res.json({ user: userMapper.toResponse(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/users/:id/role ──────────────────────────────────────────────
// Admin only. Promote or demote a user's role.
router.put('/:id/role', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'member', 'guest'].includes(role)) {
      return res.status(400).json({ error: 'Role must be admin, member, or guest.' });
    }

    const updated = await DBUtil.updateById(User, req.params.id, { role });
    if (!updated) return res.status(404).json({ error: 'User not found.' });

    res.json({ message: `Role updated to "${role}".`, user: userMapper.toResponse(updated) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/users/:id ────────────────────────────────────────────────
// Admin only. Remove a user.
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const deleted = await DBUtil.deleteById(User, req.params.id);
    if (!deleted) return res.status(404).json({ error: 'User not found.' });
    res.json({ message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
