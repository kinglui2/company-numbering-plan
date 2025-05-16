const db = require('../config/db');

class PhoneNumber {
    // Get all phone numbers with pagination
    static async getAll(page = 1, limit = 10, availableOnly = false) {
        try {
            const offset = (page - 1) * limit;
            let query = 'SELECT * FROM phone_numbers';
            let params = [];

            if (availableOnly) {
                query += ' WHERE status = "available"';
            }

            query += ' ORDER BY full_number LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const [rows] = await db.query(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Get total count of numbers
    static async getCount(availableOnly = false) {
        try {
            let query = 'SELECT COUNT(*) as total FROM phone_numbers';
            let params = [];

            if (availableOnly) {
                query += ' WHERE status = "available"';
            }

            const [rows] = await db.query(query, params);
            return rows[0].total;
        } catch (error) {
            throw error;
        }
    }

    // Get phone number by ID
    static async getById(id) {
        try {
            const [rows] = await db.query('SELECT * FROM phone_numbers WHERE id = ?', [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Get phone number by full number
    static async getByNumber(fullNumber) {
        try {
            const [rows] = await db.query('SELECT * FROM phone_numbers WHERE full_number = ?', [fullNumber]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Create new phone number
    static async create(phoneData) {
        try {
            const [result] = await db.query('INSERT INTO phone_numbers SET ?', [phoneData]);
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // Update phone number
    static async update(id, phoneData) {
        try {
            const [result] = await db.query('UPDATE phone_numbers SET ? WHERE id = ?', [phoneData, id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Get numbers by status
    static async getByStatus(status, page = 1, limit = 100) {
        try {
            const offset = (page - 1) * limit;
            
            // Get total count
            const [countResult] = await db.query(
                'SELECT COUNT(*) as total FROM phone_numbers WHERE status = ?',
                [status]
            );
            
            // Get paginated results
            const [rows] = await db.query(
                `SELECT 
                    id,
                    full_number,
                    status,
                    subscriber_name,
                    company_name,
                    gateway,
                    gateway_username,
                    assignment_date,
                    is_golden
                FROM phone_numbers 
                WHERE status = ?
                ORDER BY assignment_date DESC
                LIMIT ? OFFSET ?`,
                [status, limit, offset]
            );

            return {
                numbers: rows || [],
                total: countResult[0].total,
                page: page,
                totalPages: Math.ceil(countResult[0].total / limit)
            };
        } catch (error) {
            console.error('Error in getByStatus:', error);
            throw error;
        }
    }

    // Get golden numbers
    static async getGoldenNumbers() {
        try {
            const [rows] = await db.query('SELECT * FROM phone_numbers WHERE is_golden = 1');
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Get numbers by gateway
    static async getByGateway(gateway) {
        try {
            const [rows] = await db.query('SELECT * FROM phone_numbers WHERE gateway = ?', [gateway]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Get numbers by subscriber
    static async getBySubscriber(subscriberName) {
        try {
            const [rows] = await db.query('SELECT * FROM phone_numbers WHERE subscriber_name LIKE ?', [`%${subscriberName}%`]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Get numbers by company
    static async getByCompany(companyName) {
        try {
            const [rows] = await db.query('SELECT * FROM phone_numbers WHERE company_name LIKE ?', [`%${companyName}%`]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Get numbers eligible for reassignment (unassigned for 90+ days)
    static async getEligibleForReassignment() {
        try {
            const [rows] = await db.query(`
                SELECT * FROM phone_numbers 
                WHERE status = 'unassigned' 
                AND unassignment_date <= DATE_SUB(NOW(), INTERVAL 90 DAY)
            `);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Get number history
    static async getNumberHistory(numberId) {
        try {
            const [rows] = await db.query('SELECT * FROM number_history WHERE number_id = ? ORDER BY change_date DESC', [numberId]);
            return rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = PhoneNumber; 