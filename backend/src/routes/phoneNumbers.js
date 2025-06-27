const express = require('express');
const router = express.Router();
const phoneNumberController = require('../controllers/phoneNumberController');
const { auth } = require('../middleware/auth');

// Public route for iframe (no authentication required)
router.get('/public/published', phoneNumberController.getPublishedNumbers);

// Apply auth middleware to all other routes
router.use(auth);

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

// Get published numbers for management page
router.get('/published', phoneNumberController.getPublishedNumbersPaginated);

// Get phone number by ID (this should come after more specific routes)
router.get('/:id', phoneNumberController.getNumberById);

// Update phone number
router.put('/:id', phoneNumberController.updateNumber);

// Assign a number
router.post('/:id/assign', phoneNumberController.assignNumber);

// Unassign a number
router.post('/:id/unassign', phoneNumberController.unassignNumber);

// Publish a number
router.post('/:id/publish', phoneNumberController.publishNumber);

// Unpublish a number
router.post('/:id/unpublish', phoneNumberController.unpublishNumber);

// Bulk publish numbers
router.post('/bulk-publish', phoneNumberController.bulkPublishNumbers);

module.exports = router; 