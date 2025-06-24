const db = require('../config/database');
const bcrypt = require('bcrypt');
const UserActivity = require('../models/UserActivity');

const userController = {
    // Get all users with pagination
    async getUsers(req, res) {
        try {
            const { page = 0, pageSize = 10 } = req.query;
            const offset = page * pageSize;

            // Get users with pagination
            const [users] = await db.query(
                `SELECT 
                    id, 
                    username, 
                    email, 
                    role, 
                    is_active,
                    last_login,
                    DATE_FORMAT(last_login, '%Y-%m-%d %H:%i:%s') as formatted_last_login,
                    created_at 
                FROM users 
                ORDER BY created_at DESC 
                LIMIT ? OFFSET ?`,
                [parseInt(pageSize), offset]
            );

            const formattedUsers = users.map(user => ({
                ...user,
                last_login: user.formatted_last_login
            }));

            // Get total count
            const [total] = await db.query('SELECT COUNT(*) as count FROM users');

            const response = {
                rows: formattedUsers,
                rowCount: total[0].count,
                pageCount: Math.ceil(total[0].count / pageSize)
            };

            res.json(response);
        } catch (error) {
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    // Create new user
    async createUser(req, res) {
        try {
            const { username, email, password, role } = req.body;

            // Check if username already exists
            const [existing] = await db.query(
                'SELECT * FROM users WHERE username = ?',
                [username]
            );

            if (existing.length > 0) {
                return res.status(400).json({ message: 'Username already exists' });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);

            // Insert new user
            const [result] = await db.query(
                'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
                [username, email, password_hash, role]
            );

            // Log the activity
            try {
                await UserActivity.create({
                    user_id: req.user.id,
                    action_type: 'create',
                    target_type: 'user',
                    target_id: result.insertId,
                    old_value: null,
                    new_value: { username, email, role },
                    ip_address: req.ip
                });
            } catch (activityError) {
                // Log the error but don't fail the request
            }

            res.status(201).json({
                message: 'User created successfully',
                userId: result.insertId
            });
        } catch (error) {
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    // Update user
    async updateUser(req, res) {
        try {
            const { id } = req.params;
            const { username, email, password, role } = req.body;

            // Check if user exists and get current values
            const [users] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
            if (users.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            const oldUser = users[0];

            // Check if new username conflicts with existing users
            const [existing] = await db.query(
                'SELECT * FROM users WHERE username = ? AND id != ?',
                [username, id]
            );

            if (existing.length > 0) {
                return res.status(400).json({ message: 'Username already exists' });
            }

            // Update user
            let query = 'UPDATE users SET username = ?, email = ?, role = ?';
            let params = [username, email, role];

            // Only update password if provided
            if (password) {
                const salt = await bcrypt.genSalt(10);
                const password_hash = await bcrypt.hash(password, salt);
                query += ', password_hash = ?';
                params.push(password_hash);
            }

            query += ' WHERE id = ?';
            params.push(id);

            await db.query(query, params);

            // Log the activity
            const newValue = {
                username,
                email,
                role,
                ...(password ? { password_changed: true } : {})
            };

            await UserActivity.create({
                user_id: req.user.id,
                action_type: 'update',
                target_type: 'user',
                target_id: id,
                old_value: {
                    username: oldUser.username,
                    email: oldUser.email,
                    role: oldUser.role
                },
                new_value: newValue,
                ip_address: req.ip
            });

            res.json({ message: 'User updated successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    // Toggle user status
    async toggleUserStatus(req, res) {
        try {
            const { id } = req.params;
            const { is_active } = req.body;

            // Get current user status
            const [users] = await db.query('SELECT is_active FROM users WHERE id = ?', [id]);
            if (users.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            const oldStatus = users[0].is_active;

            const [result] = await db.query(
                'UPDATE users SET is_active = ? WHERE id = ?',
                [is_active, id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Log the activity
            await UserActivity.create({
                user_id: req.user.id,
                action_type: 'update',
                target_type: 'user',
                target_id: id,
                old_value: { is_active: oldStatus },
                new_value: { is_active },
                ip_address: req.ip
            });

            res.json({ message: 'User status updated successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    // Delete user
    async deleteUser(req, res) {
        try {
            const { id } = req.params;
            const currentUserId = req.user.id;

            // Prevent self-deletion
            if (parseInt(id) === currentUserId) {
                return res.status(400).json({ message: 'Cannot delete your own account' });
            }

            // Get user details before deletion for activity logging
            const [users] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
            if (users.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            const userToDelete = users[0];

            // Check if user is a manager and is the last manager
            if (userToDelete.role === 'manager') {
                const [managers] = await db.query(
                    'SELECT COUNT(*) as count FROM users WHERE role = "manager" AND is_active = 1'
                );
                if (managers[0].count <= 1) {
                    return res.status(400).json({ 
                        message: 'Cannot delete the last active manager account' 
                    });
                }
            }

            // Start transaction
            await db.query('START TRANSACTION');

            try {
                // Delete user sessions
                await db.query('DELETE FROM user_sessions WHERE user_id = ?', [id]);

                // Delete user activities
                await db.query('DELETE FROM user_activities WHERE user_id = ?', [id]);

                // Delete the user
                const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);

                if (result.affectedRows === 0) {
                    await db.query('ROLLBACK');
                    return res.status(404).json({ message: 'User not found' });
                }

                // Log the activity
                try {
                    await UserActivity.create({
                        user_id: currentUserId,
                        action_type: 'delete',
                        target_type: 'user',
                        target_id: id,
                        old_value: {
                            username: userToDelete.username,
                            email: userToDelete.email,
                            role: userToDelete.role
                        },
                        new_value: null,
                        ip_address: req.ip
                    });
                } catch (activityError) {
                    // Don't fail the request if activity logging fails
                }

                // Commit transaction
                await db.query('COMMIT');

                res.json({ message: 'User deleted successfully' });
            } catch (error) {
                // Rollback transaction on error
                await db.query('ROLLBACK');
                throw error;
            }
        } catch (error) {
            res.status(500).json({ 
                message: 'Failed to delete user',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};

module.exports = userController; 