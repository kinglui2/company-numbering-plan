const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { auth, authorize } = require('../middleware/auth');

// All routes require authentication and manager role
router.use(auth);
router.use(authorize(['manager']));

// System settings routes
router.get('/system', settingsController.getSystemSettings);
router.put('/system', settingsController.updateSystemSettings);

// Security settings routes
router.get('/security', settingsController.getSecuritySettings);
router.put('/security', settingsController.updateSecuritySettings);

module.exports = router; 