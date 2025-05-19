const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        console.log('Auth middleware - Token:', token ? 'Present' : 'Missing');
        
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Auth middleware - Decoded token:', decoded);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Auth middleware - Error:', error.message);
        res.status(401).json({ message: 'Invalid token' });
    }
};

const authorize = (roles = []) => {
    return (req, res, next) => {
        console.log('Authorize middleware - User role:', req.user.role);
        console.log('Authorize middleware - Required roles:', roles);
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied' });
        }
        next();
    };
};

module.exports = { auth, authorize }; 