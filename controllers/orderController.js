const express       = require('express');
const router        = express.Router();
const Order         = require('../models/Order');
const MenuItem      = require('../models/MenuItem');
const mapperFactory = require('../server/mapperFactory');
const DBUtil        = require('../server/db');
const { authenticate, authorize } = require('../server/authMiddleware');

const orderMapper = mapperFactory.create('order');

// ─── POST /api/orders ─────────────────────────────────────────────────────
// Member only. Place a new order.
// Body: { items: [{ menuItemId, quantity }], deliveryAddress }
router.post('/', authenticate, authorize('admin', 'member'), async (req, res) => {
  try {
    const { items, deliveryAddress } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item.' });
    }

    // Fetch each menu item to validate it exists and snapshot its price/name
    const resolvedItems = [];
    let total = 0;

    for (const entry of items) {
      const menuItem = await DBUtil.findById(MenuItem, entry.menuItemId);
      if (!menuItem) {
        return res.status(404).json({ error: `Menu item ${entry.menuItemId} not found.` });
      }
      if (!menuItem.available) {
        return res.status(400).json({ error: `"${menuItem.name}" is currently unavailable.` });
      }

      const qty = parseInt(entry.quantity, 10) || 1;
      resolvedItems.push({
        menuItemId: menuItem._id,
        name:       menuItem.name,
        price:      menuItem.price,
        quantity:   qty,
      });
      total += menuItem.price * qty;
    }

    const doc = orderMapper.toDocument({
      userId:          req.user.id,
      items:           resolvedItems,
      total:           Math.round(total * 100) / 100, // round to 2 decimal places
      deliveryAddress: deliveryAddress || '',
    });

    const order = await DBUtil.create(Order, doc);
    res.status(201).json({ message: 'Order placed.', order: orderMapper.toResponse(order) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/orders ──────────────────────────────────────────────────────
// Admin: sees all orders. Member: sees only their own orders.
router.get('/', authenticate, authorize('admin', 'member'), async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { userId: req.user.id };
    const orders = await DBUtil.findAll(Order, filter);
    res.json({ orders: orders.map(orderMapper.toResponse) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/orders/:id ──────────────────────────────────────────────────
// Member can only fetch their own order. Admin can fetch any.
router.get('/:id', authenticate, authorize('admin', 'member'), async (req, res) => {
  try {
    const order = await DBUtil.findById(Order, req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    // Members cannot view other members' orders
    if (req.user.role === 'member' && order.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    res.json({ order: orderMapper.toResponse(order) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/orders/:id/status ─────────────────────────────────────────
// Admin only. Update order status.
router.patch('/:id/status', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const updated = await DBUtil.updateById(Order, req.params.id, { status });
    if (!updated) return res.status(404).json({ error: 'Order not found.' });

    res.json({ message: `Order status updated to "${status}".`, order: orderMapper.toResponse(updated) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/orders/:id ───────────────────────────────────────────────
// Member can cancel their own pending order. Admin can delete any.
router.delete('/:id', authenticate, authorize('admin', 'member'), async (req, res) => {
  try {
    const order = await DBUtil.findById(Order, req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    if (req.user.role === 'member') {
      if (order.userId.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Access denied.' });
      }
      if (order.status !== 'pending') {
        return res.status(400).json({ error: 'Only pending orders can be cancelled.' });
      }
    }

    await DBUtil.deleteById(Order, req.params.id);
    res.json({ message: 'Order cancelled.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
