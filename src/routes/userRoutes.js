const express = require('express');
const { getProfile, updateProfile } = require('../controllers/userController');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.get('/me', requireAuth, getProfile);
router.patch('/me', requireAuth, updateProfile);

module.exports = router;
