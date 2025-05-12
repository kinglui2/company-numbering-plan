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
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 100;
            
            console.log('Fetching cooloff numbers with params:', { page, limit });
            
            const result = await PhoneNumber.getCooloffNumbers(page, limit);
            console.log('Cooloff numbers result:', { 
                total: result.pagination.total,
                page: result.pagination.page,
                count: result.numbers.length 
            });
            
            res.json(result);
        } catch (error) {
            console.error('Error in getCooloffNumbers:', error);
            res.status(500).json({ 
                error: 'Failed to fetch cooloff numbers',
                details: error.message
            });
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
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 100;
            const offset = (page - 1) * limit;

            // Get total count of available numbers
            const countQuery = `
                SELECT COUNT(*) as total 
                FROM phone_numbers 
                WHERE status = 'unassigned' 
                AND (
                    unassignment_date IS NULL 
                    OR unassignment_date <= DATE_SUB(NOW(), INTERVAL 90 DAY)
                )
            `;

            const [countResult] = await pool.query(countQuery);
            const total = countResult[0].total;

            // Get paginated available numbers with formatted full_number
            const numbersQuery = `
                SELECT 
                    id,
                    CONCAT(
                        national_code,
                        area_code,
                        network_code,
                        LPAD(subscriber_number, 4, '0')
                    ) as full_number,
                    status,
                    is_golden,
                    gateway,
                    assignment_date,
                    unassignment_date,
                    CASE 
                        WHEN unassignment_date IS NULL THEN 'Never Assigned'
                        ELSE CONCAT(DATEDIFF(NOW(), unassignment_date), ' days since unassignment')
                    END as assignment_status
                FROM phone_numbers 
                WHERE status = 'unassigned' 
                AND (
                    unassignment_date IS NULL 
                    OR unassignment_date <= DATE_SUB(NOW(), INTERVAL 90 DAY)
                )
                ORDER BY 
                    CASE 
                        WHEN unassignment_date IS NULL THEN 0 
                        ELSE 1 
                    END,
                    full_number
                LIMIT ? OFFSET ?
            `;

            const [numbers] = await pool.query(numbersQuery, [limit, offset]);

            res.json({
                numbers,
                total_count: total,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Error fetching available numbers:', error);
            res.status(500).json({ 
                error: 'Failed to fetch available numbers',
                details: error.message
            });
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
    },

    // Get dashboard stats
    async getDashboardStats(req, res) {
        try {
            const [stats] = await pool.query(`
                SELECT 
                    COUNT(*) as totalNumbers,
                    SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END) as assignedNumbers,
                    SUM(CASE WHEN status = 'unassigned' THEN 1 ELSE 0 END) as availableNumbers,
                    SUM(CASE WHEN status = 'cooloff' THEN 1 ELSE 0 END) as cooloffNumbers
                FROM phone_numbers
            `);

            res.json(stats[0]);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            res.status(500).json({ error: 'Failed to fetch dashboard stats' });
        }
    },

    // Get numbers by status (assigned/unassigned)
    async getNumbersByStatus(req, res) {
        try {
            const { status } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            console.log('Fetching numbers by status:', { status, page, limit, offset });

            // Validate status
            if (!['assigned', 'unassigned'].includes(status)) {
                return res.status(400).json({ error: 'Invalid status. Must be either "assigned" or "unassigned"' });
            }

            // Get total count
            const [countResult] = await pool.query(
                'SELECT COUNT(*) as total FROM phone_numbers WHERE status = ?',
                [status]
            );
            const total = countResult[0].total;

            console.log('Total count:', total);

            // Get paginated data with all necessary fields
            const query = `
                SELECT 
                    id,
                    full_number,
                    status,
                    is_golden,
                    subscriber_name,
                    company_name,
                    assignment_date,
                    unassignment_date,
                    gateway,
                    gateway_username
                FROM phone_numbers 
                WHERE status = ?
                ORDER BY full_number
                LIMIT ? OFFSET ?
            `;

            const [numbers] = await pool.query(query, [status, limit, offset]);
            console.log('Fetched numbers:', numbers.length);

            const response = {
                numbers,
                total,
                page,
                totalPages: Math.ceil(total / limit)
            };

            console.log('Sending response:', {
                numberCount: numbers.length,
                total,
                page,
                totalPages: Math.ceil(total / limit)
            });

            res.json(response);
        } catch (error) {
            console.error(`Error fetching ${req.params.status} numbers:`, error);
            res.status(500).json({ 
                error: `Failed to fetch ${req.params.status} numbers`,
                details: error.message 
            });
        }
    }
};

module.exports = phoneNumberController; 