const PhoneNumber = require('../models/PhoneNumber');
const NumberHistory = require('../models/NumberHistory');
const pool = require('../config/database');

const phoneNumberController = {
    // Get all numbers with pagination
    getAllNumbers: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;
            const availableOnly = req.query.available === 'true';

            let query = 'SELECT * FROM phone_numbers';
            let countQuery = 'SELECT COUNT(*) as total FROM phone_numbers';
            
            if (availableOnly) {
                query += ' WHERE status = "available"';
                countQuery += ' WHERE status = "available"';
            }
            
            query += ' ORDER BY full_number LIMIT ? OFFSET ?';

            const [rows] = await pool.query(query, [limit, offset]);
            const [countResult] = await pool.query(countQuery);
            const total = countResult[0].total;

            res.json({
                numbers: rows,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Error fetching numbers:', error);
            res.status(500).json({ error: 'Failed to fetch phone numbers' });
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
            const {
                subscriber_name,
                company_name,
                gateway,
                gateway_username
            } = req.body;

            const number = await PhoneNumber.findById(id);
            if (!number) {
                return res.status(404).json({ error: 'Phone number not found' });
            }

            if (number.status !== 'unassigned' && 
                !(number.status === 'cooloff' && 
                  new Date(number.unassigned_date) < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))) {
                return res.status(400).json({ error: 'Number is not available for assignment' });
            }

            const updateData = {
                status: 'assigned',
                subscriber_name,
                company_name,
                gateway,
                gateway_username,
                assignment_date: new Date()
            };

            await PhoneNumber.update(id, updateData);

            // Record in history
            await NumberHistory.create({
                number_id: id,
                change_type: 'assignment',
                previous_status: number.status,
                new_status: 'assigned',
                previous_company: number.company_name,
                new_company: company_name,
                previous_gateway: number.gateway,
                new_gateway: gateway,
                notes: `Assigned to ${company_name}`
            });

            res.json({ message: 'Number assigned successfully' });
        } catch (error) {
            console.error('Error assigning number:', error);
            res.status(500).json({ error: 'Failed to assign number' });
        }
    },

    // Unassign a number
    async unassignNumber(req, res) {
        try {
            const { id } = req.params;
            const { notes } = req.body;

            const number = await PhoneNumber.findById(id);
            if (!number) {
                return res.status(404).json({ error: 'Phone number not found' });
            }

            if (number.status !== 'assigned') {
                return res.status(400).json({ error: 'Number is not currently assigned' });
            }

            const unassignmentData = {
                unassigned_date: new Date(),
                previous_company: number.company_name,
                previous_assignment_notes: notes
            };

            await PhoneNumber.updateStatus(id, 'cooloff', unassignmentData);

            // Record in history
            await NumberHistory.create({
                number_id: id,
                change_type: 'unassignment',
                previous_status: 'assigned',
                new_status: 'cooloff',
                previous_company: number.company_name,
                new_company: null,
                previous_gateway: number.gateway,
                new_gateway: null,
                notes: notes || 'Number unassigned'
            });

            res.json({ message: 'Number unassigned successfully' });
        } catch (error) {
            console.error('Error unassigning number:', error);
            res.status(500).json({ error: 'Failed to unassign number' });
        }
    }
};

module.exports = phoneNumberController; 