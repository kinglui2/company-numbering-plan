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
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Get current number data for history
            const [currentData] = await connection.query(
                'SELECT * FROM phone_numbers WHERE id = ?',
                [id]
            );

            if (!currentData[0]) {
                throw new Error('Phone number not found');
            }

            // Prepare update query
            const fields = Object.keys(updateData)
                .map(key => `${key} = ?`)
                .join(', ');
            
            const values = [...Object.values(updateData), id];

            // Update phone_numbers table
            const [result] = await connection.query(
                `UPDATE phone_numbers SET ${fields} WHERE id = ?`,
                values
            );

            // Add to history if it's an assignment
            if (updateData.status === 'assigned') {
                await connection.query(
                    `INSERT INTO number_history 
                    (number_id, previous_status, new_status, 
                     previous_subscriber, new_subscriber,
                     previous_company, new_company,
                     previous_gateway, new_gateway,
                     previous_gateway_username, new_gateway_username,
                     changed_by, change_date)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                    [
                        id,
                        currentData[0].status,
                        updateData.status,
                        currentData[0].subscriber_name,
                        updateData.subscriber_name,
                        currentData[0].company_name,
                        updateData.company_name,
                        currentData[0].gateway,
                        updateData.gateway,
                        currentData[0].gateway_username,
                        updateData.gateway_username,
                        updateData.assigned_by || null
                    ]
                );
            }

            await connection.commit();
            return result.affectedRows > 0;
        } catch (error) {
            await connection.rollback();
            console.error('Error in update:', {
                error: error.message,
                stack: error.stack,
                sqlMessage: error.sqlMessage,
                data: { id, updateData }
            });
            throw error;
        } finally {
            connection.release();
        }
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
            console.log('Starting unassign transaction for number:', id);
            await connection.beginTransaction();

            // Get current number data
            console.log('Fetching current number data');
            const [number] = await connection.query(
                'SELECT * FROM phone_numbers WHERE id = ?',
                [id]
            );

            if (!number[0]) {
                console.log('Number not found:', id);
                throw new Error('Phone number not found');
            }

            console.log('Current number data:', number[0]);

            // Insert into cooloff_numbers
            console.log('Inserting into cooloff_numbers');
            await connection.query(
                `INSERT INTO cooloff_numbers 
                (number_id, unassigned_date, previous_subscriber, previous_company, previous_gateway)
                VALUES (?, NOW(), ?, ?, ?)`,
                [id, number[0].subscriber_name, number[0].company_name, number[0].gateway]
            );

            // Update phone_numbers status
            console.log('Updating phone_numbers status');
            await connection.query(
                `UPDATE phone_numbers 
                SET status = 'cooloff',
                    subscriber_name = NULL,
                    company_name = NULL,
                    gateway = NULL,
                    gateway_username = NULL,
                    assignment_date = NULL,
                    unassignment_date = NOW()
                WHERE id = ?`,
                [id]
            );

            // Add to history
            console.log('Adding to number_history');
            await connection.query(
                `INSERT INTO number_history 
                (number_id, previous_status, new_status, 
                previous_subscriber, previous_company, previous_gateway, previous_gateway_username,
                new_subscriber, new_company, new_gateway, new_gateway_username,
                changed_by)
                VALUES (?, 'assigned', 'cooloff', 
                ?, ?, ?, ?,
                NULL, NULL, NULL, NULL,
                ?)`,
                [
                    id, 
                    number[0].subscriber_name, 
                    number[0].company_name, 
                    number[0].gateway,
                    number[0].gateway_username,
                    data.changed_by || null
                ]
            );

            console.log('Committing transaction');
            await connection.commit();
            return true;
        } catch (error) {
            console.error('Error in unassign:', {
                id,
                message: error.message,
                code: error.code,
                errno: error.errno,
                sqlMessage: error.sqlMessage,
                sqlState: error.sqlState
            });
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
                    p.unassignment_date as cooloff_start_date,
                    c.previous_company,
                    c.previous_subscriber,
                    c.previous_gateway,
                    90 as days_remaining
                FROM phone_numbers p
                LEFT JOIN cooloff_numbers c ON p.id = c.number_id
                WHERE p.status = 'cooloff'
                AND p.unassignment_date IS NOT NULL
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