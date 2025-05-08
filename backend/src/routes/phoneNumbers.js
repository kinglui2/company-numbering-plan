const express = require('express');
const router = express.Router();
const phoneNumberController = require('../controllers/phoneNumberController');

// Get all phone numbers
router.get('/', phoneNumberController.getAllNumbers);

// Get available numbers
router.get('/available', phoneNumberController.getAvailableNumbers);

// Get a specific number
router.get('/:id', phoneNumberController.getNumberById);

// Assign a number
router.post('/:id/assign', phoneNumberController.assignNumber);

// Unassign a number
router.post('/:id/unassign', phoneNumberController.unassignNumber);

module.exports = router; 