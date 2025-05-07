const express = require('express');
const router = express.Router();
const phoneNumberController = require('../controllers/phoneNumberController');

// Get all phone numbers
router.get('/', phoneNumberController.getAllNumbers);

// Get phone number by ID
router.get('/:id', phoneNumberController.getNumberById);

// Get phone number by full number
router.get('/number/:number', phoneNumberController.getNumberByNumber);

// Create new phone number
router.post('/', phoneNumberController.createNumber);

// Update number
router.put('/:id', phoneNumberController.updateNumber);

// Get numbers by status
router.get('/status/:status', phoneNumberController.getNumbersByStatus);

// Get golden numbers
router.get('/golden/all', phoneNumberController.getGoldenNumbers);

module.exports = router; 