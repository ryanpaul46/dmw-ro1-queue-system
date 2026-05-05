const express = require('express');
const { getUsers, createUser, deleteUser } = require('../controllers/adminController');
const { authenticate, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate, adminOnly);

router.get('/users', getUsers);
router.post('/users', createUser);
router.delete('/users/:id', deleteUser);

module.exports = router;
