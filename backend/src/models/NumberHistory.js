const db = require('../config/database');

class NumberHistory {
    static async create(historyData) {
        const {
            number_id,
            change_type,
            previous_status,
            new_status,
            previous_company,
            new_company,
            previous_gateway,
            new_gateway,
            notes
        } = historyData;

        const [result] = await db.query(
            `INSERT INTO number_history (
                number_id, change_type, previous_status, new_status,
                previous_company, new_company, previous_gateway, new_gateway,
                notes, change_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                number_id, change_type, previous_status, new_status,
                previous_company, new_company, previous_gateway, new_gateway,
                notes
            ]
        );

        return result.insertId;
    }

    static async findByNumberId(numberId) {
        const [rows] = await db.query(
            `SELECT nh.*, p.full_number 
            FROM number_history nh
            JOIN phone_numbers p ON nh.number_id = p.id
            WHERE nh.number_id = ?
            ORDER BY nh.change_date DESC`,
            [numberId]
        );
        return rows;
    }

    static async findAll() {
        const [rows] = await db.query(
            `SELECT nh.*, p.full_number 
            FROM number_history nh
            JOIN phone_numbers p ON nh.number_id = p.id
            ORDER BY nh.change_date DESC`
        );
        return rows;
    }
}

module.exports = NumberHistory; 