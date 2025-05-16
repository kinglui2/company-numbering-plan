const express = require('express');
const router = express.Router();
const phoneNumberController = require('../controllers/phoneNumberController');

// Get all phone numbers with pagination
router.get('/', phoneNumberController.getAllNumbers);

// Get dashboard stats
router.get('/stats', phoneNumberController.getDashboardStats);

// Get cooloff numbers
router.get('/cooloff', phoneNumberController.getCooloffNumbers);

// Get available numbers
router.get('/available', phoneNumberController.getAvailableNumbers);

// Get numbers by status (assigned/unassigned)
router.get('/status/:status', phoneNumberController.getNumbersByStatus);

// Get numbers with missing data
router.get('/missing', phoneNumberController.getMissingDataNumbers);

// Get phone number by ID (this should come after more specific routes)
router.get('/:id', phoneNumberController.getNumberById);

// Assign a number
router.post('/:id/assign', phoneNumberController.assignNumber);

// Unassign a number
router.post('/:id/unassign', phoneNumberController.unassignNumber);

module.exports = router; 