const express       = require('express');
const router        = express.Router();
const MenuItem      = require('../models/MenuItem');
const mapperFactory = require('../server/mapperFactory');
const DBUtil        = require('../server/db');
const { authenticate, authorize } = require('../server/authMiddleware');

const menuMapper = mapperFactory.create('menuItem');

// ─── GET /api/menu ────────────────────────────────────────────────────────
// Public. Guests, members, and admins can all browse the menu.
// Optional query params: ?category=burger  ?available=true
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.category)  filter.category  = req.query.category.toLowerCase();
    if (req.query.available) filter.available = req.query.available === 'true';

    const items = await DBUtil.findAll(MenuItem, filter);
    res.json({ items: items.map(menuMapper.toResponse) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/menu/:id ────────────────────────────────────────────────────
// Public. Single menu item by ID.
router.get('/:id', async (req, res) => {
  try {
    const item = await DBUtil.findById(MenuItem, req.params.id);
    if (!item) return res.status(404).json({ error: 'Menu item not found.' });
    res.json({ item: menuMapper.toResponse(item) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/menu ───────────────────────────────────────────────────────
// Admin only. Add a new menu item.
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const doc  = menuMapper.toDocument(req.body);
    const item = await DBUtil.create(MenuItem, doc);
    res.status(201).json({ message: 'Menu item created.', item: menuMapper.toResponse(item) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── PUT /api/menu/:id ────────────────────────────────────────────────────
// Admin only. Update an existing menu item.
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const doc     = menuMapper.toDocument(req.body);
    const updated = await DBUtil.updateById(MenuItem, req.params.id, doc);
    if (!updated) return res.status(404).json({ error: 'Menu item not found.' });
    res.json({ message: 'Menu item updated.', item: menuMapper.toResponse(updated) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── DELETE /api/menu/:id ─────────────────────────────────────────────────
// Admin only. Remove a menu item.
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const deleted = await DBUtil.deleteById(MenuItem, req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Menu item not found.' });
    res.json({ message: 'Menu item deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
