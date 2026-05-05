const express = require('express');
const { createQueue, getQueues, callNext } = require('../controllers/queueController');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// Public: kiosk creates queue + TV display reads queue without auth
router.post('/', createQueue);
router.get('/', getQueues);

// Protected: staff/admin only
router.post('/next/:counterId', authenticate, callNext);

module.exports = router;
