const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth, authorize } = require('../middleware/auth');
const { body } = require('express-validator');

// Validation middleware
const validateUser = [
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
    body('email').isEmail().withMessage('Must be a valid email address'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('role').isIn(['manager', 'support']).withMessage('Invalid role')
];

// Routes
router.get('/', auth, authorize(['manager']), userController.getUsers);
router.post('/', auth, authorize(['manager']), validateUser, userController.createUser);
router.put('/:id', auth, authorize(['manager']), validateUser, userController.updateUser);
router.delete('/:id', auth, authorize(['manager']), userController.deleteUser);
router.put('/:id/status', auth, authorize(['manager']), userController.toggleUserStatus);

module.exports = router; 