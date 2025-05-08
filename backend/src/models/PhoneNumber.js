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
}

module.exports = PhoneNumber; 