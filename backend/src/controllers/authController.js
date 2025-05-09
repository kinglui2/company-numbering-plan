const User = require('../models/User');

const authController = {
    async login(req, res) {
        try {
            const { username, password } = req.body;

            // Find user by username
            const user = await User.findByUsername(username);
            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Check if account is active
            if (!user.is_active) {
                return res.status(403).json({ error: 'Account is inactive' });
            }

            // Verify password
            const isValidPassword = await User.verifyPassword(password, user.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Create session and get token
            const token = await User.createSession(user.id);

            // Update last login
            await User.updateLastLogin(user.id);

            // Return user info and token
            res.json({
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                },
                token
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    },

    async logout(req, res) {
        try {
            await User.invalidateSession(req.token);
            res.json({ message: 'Logged out successfully' });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({ error: 'Logout failed' });
        }
    },

    async getCurrentUser(req, res) {
        try {
            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            });
        } catch (error) {
            console.error('Get current user error:', error);
            res.status(500).json({ error: 'Failed to get user information' });
        }
    }
};

module.exports = authController; 