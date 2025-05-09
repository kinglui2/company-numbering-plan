const db = require('../config/database');

class PhoneNumber {
    static async findAll() {
        const [rows] = await db.query('SELECT * FROM phone_numbers');
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM phone_numbers WHERE id = ?', [id]);
        return rows[0];
    }

    static async findByNumber(fullNumber) {
        const [rows] = await db.query('SELECT * FROM phone_numbers WHERE full_number = ?', [fullNumber]);
        return rows[0];
    }

    static async create(numberData) {
        const {
            full_number,
            national_code,
            area_code,
            network_code,
            subscriber_number,
            is_golden,
            status,
            subscriber_name,
            company_name,
            gateway,
            gateway_username,
            assignment_date
        } = numberData;

        const [result] = await db.query(
            `INSERT INTO phone_numbers (
                full_number, national_code, area_code, network_code, 
                subscriber_number, is_golden, status, subscriber_name,
                company_name, gateway, gateway_username, assignment_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                full_number, national_code, area_code, network_code,
                subscriber_number, is_golden, status, subscriber_name,
                company_name, gateway, gateway_username, assignment_date
            ]
        );

        return result.insertId;
    }

    static async update(id, updateData) {
        const fields = Object.keys(updateData)
            .map(key => `${key} = ?`)
            .join(', ');
        
        const values = [...Object.values(updateData), id];

        const [result] = await db.query(
            `UPDATE phone_numbers SET ${fields} WHERE id = ?`,
            values
        );

        return result.affectedRows > 0;
    }

    static async updateStatus(id, status, unassignmentData = null) {
        const updateFields = ['status = ?'];
        const values = [status, id];

        if (unassignmentData) {
            updateFields.push(
                'unassigned_date = ?',
                'previous_company = ?',
                'previous_assignment_notes = ?'
            );
            values.unshift(
                unassignmentData.unassigned_date,
                unassignmentData.previous_company,
                unassignmentData.previous_assignment_notes
            );
        }

        const [result] = await db.query(
            `UPDATE phone_numbers SET ${updateFields.join(', ')} WHERE id = ?`,
            values
        );

        return result.affectedRows > 0;
    }

    static async findAvailable() {
        const [rows] = await db.query(
            `SELECT * FROM phone_numbers 
            WHERE status = 'unassigned' 
            OR (status = 'cooloff' AND unassigned_date < DATE_SUB(NOW(), INTERVAL 90 DAY))`
        );
        return rows;
    }

    // Get all phone numbers with pagination
    static async getAll(page = 1, limit = 10, availableOnly = false) {
        try {
            const offset = (page - 1) * limit;
            let query = `
                SELECT p.*, 
                    CASE 
                        WHEN c.unassigned_date IS NOT NULL 
                        AND c.unassigned_date < DATE_SUB(NOW(), INTERVAL 90 DAY) 
                        THEN 'available'
                        ELSE p.status 
                    END as effective_status
                FROM phone_numbers p
                LEFT JOIN cooloff_numbers c ON p.id = c.phone_number_id
            `;
            let countQuery = `
                SELECT COUNT(*) as total 
                FROM phone_numbers p
                LEFT JOIN cooloff_numbers c ON p.id = c.phone_number_id
            `;
            let params = [];

            if (availableOnly) {
                query += ` WHERE (p.status = 'available' OR 
                    (p.status = 'cooloff' AND c.unassigned_date < DATE_SUB(NOW(), INTERVAL 90 DAY)))`;
                countQuery += ` WHERE (p.status = 'available' OR 
                    (p.status = 'cooloff' AND c.unassigned_date < DATE_SUB(NOW(), INTERVAL 90 DAY)))`;
            }

            query += ' ORDER BY p.full_number LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const [rows] = await db.query(query, params);
            const [countResult] = await db.query(countQuery);
            const total = countResult[0].total;

            return {
                numbers: rows,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            throw error;
        }
    }

    // Unassign a number
    static async unassign(id, data) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Get current number data
            const [number] = await connection.query(
                'SELECT * FROM phone_numbers WHERE id = ?',
                [id]
            );

            if (!number[0]) {
                throw new Error('Phone number not found');
            }

            // Insert into cooloff_numbers
            await connection.query(
                `INSERT INTO cooloff_numbers 
                (phone_number_id, unassigned_date, previous_subscriber, previous_company, previous_gateway)
                VALUES (?, NOW(), ?, ?, ?)`,
                [id, number[0].subscriber_name, number[0].company_name, number[0].gateway]
            );

            // Update phone_numbers status
            await connection.query(
                `UPDATE phone_numbers 
                SET status = 'cooloff',
                    subscriber_name = NULL,
                    company_name = NULL,
                    gateway = NULL,
                    assignment_date = NULL
                WHERE id = ?`,
                [id]
            );

            // Add to history
            await connection.query(
                `INSERT INTO number_history 
                (number_id, change_type, old_value, new_value)
                VALUES (?, 'unassignment', ?, ?)`,
                [id, JSON.stringify(number[0]), JSON.stringify({ status: 'cooloff' })]
            );

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // Check and update cooloff numbers
    static async updateCooloffStatus() {
        try {
            const [rows] = await db.query(`
                UPDATE phone_numbers p
                JOIN cooloff_numbers c ON p.id = c.phone_number_id
                SET p.status = 'available'
                WHERE p.status = 'cooloff'
                AND c.unassigned_date < DATE_SUB(NOW(), INTERVAL 90 DAY)
            `);
            return rows.affectedRows;
        } catch (error) {
            throw error;
        }
    }

    // Get cooloff numbers
    static async getCooloffNumbers() {
        try {
            const [rows] = await db.query(`
                SELECT p.*, c.unassigned_date, c.previous_subscriber, c.previous_company, c.previous_gateway
                FROM phone_numbers p
                JOIN cooloff_numbers c ON p.id = c.phone_number_id
                WHERE p.status = 'cooloff'
                ORDER BY c.unassigned_date DESC
            `);
            return rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = PhoneNumber; 