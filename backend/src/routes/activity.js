const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { auth, authorize } = require('../middleware/auth');
const { query } = require('express-validator');

// Validation middleware for getActivities
const validateGetActivities = [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('actionType').optional().isIn(['assign', 'unassign', 'update', 'login', 'logout']),
    query('targetType').optional().isIn(['phone_number', 'user', 'system']),
    query('userId').optional().isInt(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('searchTerm').optional().isString()
];

// Routes
router.get('/', 
    auth,
    authorize(['manager']),
    validateGetActivities,
    activityController.getActivities
);

router.get('/:id',
    auth,
    authorize(['manager']),
    activityController.getActivityById
);

module.exports = router; 