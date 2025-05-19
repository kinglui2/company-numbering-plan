const User = require('../models/User');
const jwt = require('jsonwebtoken');

const authController = {
    async login(req, res) {
        try {
            const { username, password } = req.body;

            // Find user by username
            const user = await User.findByUsername(username);
            if (!user) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            // Check if account is active
            if (!user.is_active) {
                return res.status(403).json({ message: 'Account is inactive' });
            }

            // Verify password
            const isValidPassword = await User.verifyPassword(password, user.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            // Generate JWT token
            const token = jwt.sign(
                { 
                    id: user.id, 
                    username: user.username,
                    role: user.role 
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            // Create session record
            await User.createSession(user.id, token);

            // Update last login
            await User.updateLastLogin(user.id);

            // Return user info and token
            res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ message: 'Login failed' });
        }
    },

    async logout(req, res) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (token) {
                await User.invalidateSession(token);
            }
            res.json({ message: 'Logged out successfully' });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({ message: 'Logout failed' });
        }
    },

    async getCurrentUser(req, res) {
        try {
            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.json({
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            });
        } catch (error) {
            console.error('Get current user error:', error);
            res.status(500).json({ message: 'Failed to get user information' });
        }
    }
};

module.exports = authController; 