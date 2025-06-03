const db = require('../config/database');

class UserActivity {
    static async create(activityData) {
        const {
            user_id,
            action_type,
            target_type,
            target_id,
            old_value,
            new_value,
            ip_address
        } = activityData;

        const [result] = await db.query(
            `INSERT INTO user_activities (
                user_id, action_type, target_type, target_id,
                old_value, new_value, ip_address
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                user_id,
                action_type,
                target_type,
                target_id,
                JSON.stringify(old_value),
                JSON.stringify(new_value),
                ip_address
            ]
        );

        return result.insertId;
    }

    static async findAll(filters = {}) {
        let query = `
            SELECT 
                ua.*,
                u.username as user_name,
                DATE_FORMAT(ua.created_at, '%Y-%m-%d %H:%i:%s') as created_at
            FROM user_activities ua
            LEFT JOIN users u ON ua.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.actionType) {
            query += ' AND ua.action_type = ?';
            params.push(filters.actionType);
        }

        if (filters.targetType) {
            query += ' AND ua.target_type = ?';
            params.push(filters.targetType);
        }

        if (filters.userId) {
            query += ' AND ua.user_id = ?';
            params.push(filters.userId);
        }

        if (filters.startDate) {
            query += ' AND ua.created_at >= ?';
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            query += ' AND ua.created_at <= ?';
            params.push(filters.endDate);
        }

        if (filters.searchTerm) {
            query += ` AND (
                ua.target_id LIKE ? OR
                u.username LIKE ? OR
                ua.action_type LIKE ?
            )`;
            const searchPattern = `%${filters.searchTerm}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        query += ' ORDER BY ua.created_at DESC';

        if (filters.limit) {
            query += ' LIMIT ?';
            params.push(parseInt(filters.limit));

            if (filters.offset) {
                query += ' OFFSET ?';
                params.push(parseInt(filters.offset));
            }
        }

        console.log('Executing query:', query);
        console.log('With params:', params);
        const [rows] = await db.query(query, params);
        console.log('Query results:', rows);
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query(
            `SELECT 
                ua.*,
                u.username as user_name
            FROM user_activities ua
            LEFT JOIN users u ON ua.user_id = u.id
            WHERE ua.id = ?`,
            [id]
        );
        return rows[0];
    }

    static async countAll(filters = {}) {
        let query = 'SELECT COUNT(*) as total FROM user_activities ua WHERE 1=1';
        const params = [];

        if (filters.actionType) {
            query += ' AND ua.action_type = ?';
            params.push(filters.actionType);
        }

        if (filters.targetType) {
            query += ' AND ua.target_type = ?';
            params.push(filters.targetType);
        }

        if (filters.userId) {
            query += ' AND ua.user_id = ?';
            params.push(filters.userId);
        }

        if (filters.startDate) {
            query += ' AND ua.created_at >= ?';
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            query += ' AND ua.created_at <= ?';
            params.push(filters.endDate);
        }

        if (filters.searchTerm) {
            query += ' AND ua.target_id LIKE ?';
            params.push(`%${filters.searchTerm}%`);
        }

        const [result] = await db.query(query, params);
        return result[0].total;
    }
}

module.exports = UserActivity; 