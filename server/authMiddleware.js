const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// ─── Module: Auth Middleware ──────────────────────────────────────────────

// ── Authentication: verify JWT token ──────────────────────────────────────
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Access denied. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, username, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// ── Authorization: role-based access control ───────────────────────────────
// Usage: authorize('admin') or authorize('admin', 'member')
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}.`,
      });
    }
    next();
  };
};

// ── Helper: sign a JWT for a user document ────────────────────────────────
const signToken = (user) =>
  jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

module.exports = { authenticate, authorize, signToken };
