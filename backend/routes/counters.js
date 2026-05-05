const express = require('express');
const { getCounters, updateCounterStatus } = require('../controllers/counterController');
const { authenticate, adminOnly } = require('../middleware/auth');
const router = express.Router();

// Optionally attach user if token present (TV display has no token)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const jwt = require('jsonwebtoken');
    try {
      req.user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    } catch {}
  }
  next();
};

router.get('/', optionalAuth, getCounters);
router.patch('/:id/status', authenticate, adminOnly, updateCounterStatus);

module.exports = router;
