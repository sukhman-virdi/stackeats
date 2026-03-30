require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const path    = require('path');
const { connectDB } = require('./db');
const { logRequest } = require('../models/Log');

// ─── Singleton: one app instance ─────────────────────────────────────────
const AppSingleton = (() => {
  let instance;

  function createApp() {
    const app = express();

    // ── Middleware ────────────────────────────────────────────────────────
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static(path.join(__dirname, '../views')));

    // ── Accountability: log every request to MongoDB ──────────────────────
    app.use((req, res, next) => {
      res.on('finish', () => {
        logRequest({
          method:     req.method,
          path:       req.path,
          query:      req.query,
          statusCode: res.statusCode,
        }).catch(err => console.error('Log error:', err.message));
      });
      next();
    });

    // ── Routes ────────────────────────────────────────────────────────────
    app.use('/api/auth',   require('../controllers/authController'));
    app.use('/api/menu',   require('../controllers/menuController'));
    app.use('/api/orders', require('../controllers/orderController'));
    app.use('/api/users',  require('../controllers/userController'));
    app.use('/api/maps',   require('../controllers/mapsController'));

    // ── Catch-all: serve index.html ───────────────────────────────────────
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../views/index.html'));
    });

    return app;
  }

  return {
    getInstance() {
      if (!instance) instance = createApp();
      return instance;
    },
  };
})();

// ── Boot ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

(async () => {
  // false = Atlas, true = local MongoDB
  await connectDB(false);
  const app = AppSingleton.getInstance();
  app.listen(PORT, () => {
    console.log(`StackEats running on http://localhost:${PORT}`);
  });
})();

module.exports = AppSingleton.getInstance();