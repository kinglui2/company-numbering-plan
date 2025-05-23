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
            national_code = '254',
            area_code = '20',
            network_code = '790',
            subscriber_number,
            is_golden = false,
            status = 'unassigned',
            subscriber_name,
            company_name,
            gateway,
            gateway_username,
            assignment_date,
            assigned_by
        } = numberData;

        const [result] = await db.query(
            `INSERT INTO phone_numbers (
                full_number, national_code, area_code, network_code, 
                subscriber_number, is_golden, status, subscriber_name,
                company_name, gateway, gateway_username, assignment_date,
                assigned_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                full_number, national_code, area_code, network_code,
                subscriber_number, is_golden, status, subscriber_name,
                company_name, gateway, gateway_username, assignment_date,
                assigned_by
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
                'unassignment_date = ?',
                'previous_company = ?',
                'previous_assignment_notes = ?'
            );
            values.unshift(
                unassignmentData.unassignment_date,
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
            OR (status = 'cooloff' AND unassignment_date < DATE_SUB(NOW(), INTERVAL 90 DAY))`
        );
        return rows;
    }

    // Get all phone numbers with pagination
    static async getAll(page = 1, limit = 10, availableOnly = false) {
        try {
            const offset = (page - 1) * limit;
            let query = `
                SELECT * FROM phone_numbers
            `;
            let countQuery = `
                SELECT COUNT(*) as total FROM phone_numbers
            `;
            let params = [];

            if (availableOnly) {
                query += ` WHERE status = 'unassigned' OR 
                    (status = 'cooloff' AND unassignment_date < DATE_SUB(NOW(), INTERVAL 90 DAY))`;
                countQuery += ` WHERE status = 'unassigned' OR 
                    (status = 'cooloff' AND unassignment_date < DATE_SUB(NOW(), INTERVAL 90 DAY))`;
            }

            query += ' ORDER BY full_number LIMIT ? OFFSET ?';
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
            console.error('Error in getAll:', error);
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
                (number_id, unassignment_date, previous_subscriber, previous_company, previous_gateway)
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
                    assignment_date = NULL,
                    unassignment_date = NOW()
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

    // Get cooloff numbers with pagination
    static async getCooloffNumbers(page = 1, limit = 100) {
        try {
            const offset = (page - 1) * limit;
            console.log('Starting getCooloffNumbers with params:', { page, limit, offset });

            // Get total count
            const countQuery = `
                SELECT COUNT(*) as total 
                FROM phone_numbers p
                WHERE p.status = 'cooloff'
                AND p.unassignment_date IS NOT NULL
                AND DATE_ADD(p.unassignment_date, INTERVAL 90 DAY) >= NOW()
            `;
            console.log('Executing count query:', countQuery);
            
            const [countResult] = await db.query(countQuery);
            console.log('Count result:', countResult);
            
            const total = countResult[0].total;

            // If no results, return empty array with pagination
            if (total === 0) {
                console.log('No cooloff numbers found, returning empty result');
                return {
                    numbers: [],
                    pagination: {
                        total: 0,
                        page,
                        limit,
                        totalPages: 0
                    }
                };
            }

            // Get paginated cooloff numbers
            const numbersQuery = `
                SELECT 
                    p.id,
                    CONCAT(
                        p.national_code,
                        p.area_code,
                        p.network_code,
                        LPAD(p.subscriber_number, 4, '0')
                    ) as full_number,
                    p.status,
                    p.is_golden,
                    p.gateway,
                    p.unassignment_date,
                    c.previous_company,
                    c.previous_subscriber,
                    c.previous_gateway,
                    CASE 
                        WHEN p.unassignment_date IS NULL THEN 'Never Assigned'
                        ELSE CONCAT(
                            DATEDIFF(
                                DATE_ADD(p.unassignment_date, INTERVAL 90 DAY),
                                NOW()
                            ),
                            ' days remaining'
                        )
                    END as assignment_status,
                    DATEDIFF(
                        DATE_ADD(p.unassignment_date, INTERVAL 90 DAY),
                        NOW()
                    ) as days_remaining
                FROM phone_numbers p
                LEFT JOIN cooloff_numbers c ON p.id = c.number_id
                WHERE p.status = 'cooloff'
                AND p.unassignment_date IS NOT NULL
                AND DATE_ADD(p.unassignment_date, INTERVAL 90 DAY) >= NOW()
                ORDER BY p.unassignment_date DESC
                LIMIT ? OFFSET ?
            `;
            console.log('Executing numbers query with params:', [limit, offset]);
            
            const [rows] = await db.query(numbersQuery, [limit, offset]);
            console.log('Query returned rows:', rows.length);

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
            console.error('Detailed error in getCooloffNumbers:', {
                message: error.message,
                stack: error.stack,
                code: error.code,
                errno: error.errno,
                sqlMessage: error.sqlMessage,
                sqlState: error.sqlState
            });
            throw error;
        }
    }

    // Check and update cooloff numbers
    static async updateCooloffStatus() {
        try {
            const [rows] = await db.query(`
                UPDATE phone_numbers
                SET status = 'unassigned'
                WHERE status = 'cooloff'
                AND unassignment_date < DATE_SUB(NOW(), INTERVAL 90 DAY)
            `);
            return rows.affectedRows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = PhoneNumber; 