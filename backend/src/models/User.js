const db = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class User {
    static async findByUsername(username) {
        const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        return rows[0];
    }

    static async createUser(userData) {
        const { username, email, password, role } = userData;
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const [result] = await db.query(
            'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [username, email, password_hash, role]
        );

        return result.insertId;
    }

    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    static async createSession(userId, token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const expires_at = new Date(decoded.exp * 1000); // Convert JWT exp to Date

        await db.query(
            'INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
            [userId, token, expires_at]
        );

        return token;
    }

    static async verifySession(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const [sessions] = await db.query(
                'SELECT * FROM user_sessions WHERE user_id = ? AND token = ? AND expires_at > NOW()',
                [decoded.id, token]
            );

            if (sessions.length === 0) {
                return null;
            }

            const [users] = await db.query(
                'SELECT id, username, email, role, is_active FROM users WHERE id = ?',
                [decoded.id]
            );

            return users[0];
        } catch (error) {
            return null;
        }
    }

    static async invalidateSession(token) {
        await db.query('DELETE FROM user_sessions WHERE token = ?', [token]);
    }

    static async updateLastLogin(userId) {
        await db.query(
            'UPDATE users SET last_login = NOW() WHERE id = ?',
            [userId]
        );
    }
}

module.exports = User; 