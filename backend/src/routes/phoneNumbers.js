const express = require('express');
const router = express.Router();
const phoneNumberController = require('../controllers/phoneNumberController');

// Get all phone numbers with pagination
router.get('/', phoneNumberController.getAllNumbers);

// Get phone number by ID
router.get('/:id', phoneNumberController.getNumberById);

// Get cooloff numbers
router.get('/cooloff', phoneNumberController.getCooloffNumbers);

// Assign a number
router.post('/:id/assign', phoneNumberController.assignNumber);

// Unassign a number
router.post('/:id/unassign', phoneNumberController.unassignNumber);

module.exports = router; 