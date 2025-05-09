const PhoneNumber = require('../models/PhoneNumber');
const NumberHistory = require('../models/NumberHistory');
const pool = require('../config/database');

const phoneNumberController = {
    // Get all numbers with pagination
    async getAllNumbers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 100;
            const offset = (page - 1) * limit;

            // Build the WHERE clause based on filters
            let whereClause = '';
            const params = [];
            
            // Handle status filter
            if (req.query.status) {
                whereClause += ' AND status = ?';
                params.push(req.query.status);
            }

            // Handle gateway filter
            if (req.query.gateway) {
                whereClause += ' AND gateway = ?';
                params.push(req.query.gateway);
            }

            // Handle full number search
            if (req.query.full_number) {
                whereClause += ' AND full_number LIKE ?';
                params.push(`%${req.query.full_number}%`);
            }

            // Get total count
            const [countResult] = await pool.query(
                `SELECT COUNT(*) as total FROM phone_numbers WHERE 1=1 ${whereClause}`,
                params
            );
            const total = countResult[0].total;

            // Get paginated data
            const [numbers] = await pool.query(
                `SELECT * FROM phone_numbers 
                WHERE 1=1 ${whereClause}
                ORDER BY full_number
                LIMIT ? OFFSET ?`,
                [...params, limit, offset]
            );

            res.json({
                numbers,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Error fetching numbers:', error);
            res.status(500).json({ error: 'Failed to fetch numbers' });
        }
    },

    // Get cooloff numbers
    async getCooloffNumbers(req, res) {
        try {
            const numbers = await PhoneNumber.getCooloffNumbers();
            res.json({
                numbers,
                pagination: {
                    total: numbers.length,
                    page: 1,
                    limit: numbers.length,
                    totalPages: 1
                }
            });
        } catch (error) {
            console.error('Error fetching cooloff numbers:', error);
            res.status(500).json({ error: 'Failed to fetch cooloff numbers' });
        }
    },

    // Get a single phone number by ID
    async getNumberById(req, res) {
        try {
            const number = await PhoneNumber.findById(req.params.id);
            if (!number) {
                return res.status(404).json({ error: 'Phone number not found' });
            }
            res.json(number);
        } catch (error) {
            console.error('Error fetching phone number:', error);
            res.status(500).json({ error: 'Failed to fetch phone number' });
        }
    },

    // Get available numbers (unassigned or out of cooloff)
    async getAvailableNumbers(req, res) {
        try {
            const numbers = await PhoneNumber.findAvailable();
            res.json(numbers);
        } catch (error) {
            console.error('Error fetching available numbers:', error);
            res.status(500).json({ error: 'Failed to fetch available numbers' });
        }
    },

    // Assign a number
    async assignNumber(req, res) {
        try {
            const { id } = req.params;
            const updateData = {
                ...req.body,
                status: 'assigned',
                assignment_date: new Date()
            };

            const success = await PhoneNumber.update(id, updateData);
            if (!success) {
                return res.status(404).json({ error: 'Phone number not found' });
            }

            const updatedNumber = await PhoneNumber.findById(id);
            res.json(updatedNumber);
        } catch (error) {
            console.error('Error assigning number:', error);
            res.status(500).json({ error: 'Failed to assign number' });
        }
    },

    // Unassign a number
    async unassignNumber(req, res) {
        try {
            const { id } = req.params;
            const success = await PhoneNumber.unassign(id, req.body);
            if (!success) {
                return res.status(404).json({ error: 'Phone number not found' });
            }

            const updatedNumber = await PhoneNumber.findById(id);
            res.json(updatedNumber);
        } catch (error) {
            console.error('Error unassigning number:', error);
            res.status(500).json({ error: 'Failed to unassign number' });
        }
    }
};

module.exports = phoneNumberController; 