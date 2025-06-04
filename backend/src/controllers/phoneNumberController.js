const PhoneNumber = require('../models/PhoneNumber');
const NumberHistory = require('../models/NumberHistory');
const UserActivity = require('../models/UserActivity');
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

            // Handle is_golden filter
            if (req.query.is_golden !== undefined) {
                whereClause += ' AND is_golden = ?';
                params.push(req.query.is_golden === 'true' ? 1 : 0);
            }

            // Get total count
            const countQuery = `SELECT COUNT(*) as total FROM phone_numbers WHERE 1=1 ${whereClause}`;
            const [countResult] = await pool.query(countQuery, params);
            const total = countResult[0].total;

            // Get paginated data
            const dataQuery = `SELECT * FROM phone_numbers WHERE 1=1 ${whereClause} ORDER BY full_number LIMIT ? OFFSET ?`;
            const dataParams = [...params, limit, offset];
            const [numbers] = await pool.query(dataQuery, dataParams);

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
            const fetchAll = req.query.fetchAll === 'true';

            console.log('Available Numbers Query Params:', req.query);

            // Build WHERE conditions
            const whereConditions = [
                "status = 'unassigned'",
                "(unassignment_date IS NULL OR unassignment_date <= DATE_SUB(NOW(), INTERVAL 90 DAY))"
            ];
            const params = [];

            // Add golden filter
            if (req.query.is_golden === 'true') {
                whereConditions.push('is_golden = 1');
            }

            // Add range filter
            if (req.query.range_start) {
                whereConditions.push('CAST(subscriber_number AS UNSIGNED) >= ?');
                params.push(parseInt(req.query.range_start, 10));
            }
            if (req.query.range_end) {
                whereConditions.push('CAST(subscriber_number AS UNSIGNED) <= ?');
                params.push(parseInt(req.query.range_end, 10));
            }

            // Add subscriber search
            if (req.query.subscriber_search) {
                whereConditions.push('subscriber_number LIKE ?');
                params.push(`%${req.query.subscriber_search}%`);
            }

            // Get total count of available numbers
            const countQuery = `
                SELECT COUNT(*) as total 
                FROM phone_numbers 
                WHERE ${whereConditions.join(' AND ')}
            `;

            console.log('Count Query:', countQuery);
            console.log('Count Params:', params);

            const [countResult] = await pool.query(countQuery, params);
            const total = countResult[0].total;

            // Get available numbers with properly formatted full_number
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
                    subscriber_number,
                    CASE 
                        WHEN unassignment_date IS NULL THEN 'Never Assigned'
                        ELSE CONCAT(DATEDIFF(NOW(), unassignment_date), ' days since unassignment')
                    END as assignment_status
                FROM phone_numbers 
                WHERE ${whereConditions.join(' AND ')}
                ORDER BY CAST(subscriber_number AS UNSIGNED)
                ${!fetchAll ? 'LIMIT ? OFFSET ?' : ''}
            `;

            console.log('Numbers Query:', numbersQuery);
            console.log('Numbers Params:', fetchAll ? params : [...params, limit, (page - 1) * limit]);

            const queryParams = fetchAll ? params : [...params, limit, (page - 1) * limit];
            const [numbers] = await pool.query(numbersQuery, queryParams);

            console.log(`Found ${numbers.length} numbers out of ${total} total`);

            res.json({
                numbers,
                total_count: total,
                pagination: {
                    total,
                    page: fetchAll ? 1 : page,
                    limit: fetchAll ? total : limit,
                    totalPages: fetchAll ? 1 : Math.ceil(total / limit)
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

            console.log('Attempting to assign number:', {
                numberId: id,
                updateData: JSON.stringify(updateData)
            });

            // First check if the number exists and is available
            const number = await PhoneNumber.findById(id);
            if (!number) {
                console.log('Number not found:', id);
                return res.status(404).json({ error: 'Phone number not found' });
            }

            if (number.status === 'assigned') {
                console.log('Number already assigned:', id);
                return res.status(400).json({ error: 'Number is already assigned' });
            }

            const success = await PhoneNumber.update(id, updateData);
            if (!success) {
                console.log('Update operation failed for number:', id);
                return res.status(500).json({ error: 'Failed to update number in database' });
            }

            const updatedNumber = await PhoneNumber.findById(id);
            
            // Log the assign activity
            await UserActivity.create({
                user_id: req.user.id,
                action_type: 'assign',
                target_type: 'phone_number',
                target_id: updatedNumber.full_number,
                old_value: {
                    status: number.status,
                    company_name: number.company_name,
                    subscriber_name: number.subscriber_name,
                    gateway: number.gateway,
                    gateway_username: number.gateway_username
                },
                new_value: {
                    status: updatedNumber.status,
                    company_name: updatedNumber.company_name,
                    subscriber_name: updatedNumber.subscriber_name,
                    gateway: updatedNumber.gateway,
                    gateway_username: updatedNumber.gateway_username
                },
                ip_address: req.ip
            });

            console.log('Successfully assigned number:', {
                numberId: id,
                newStatus: updatedNumber.status
            });
            
            res.json(updatedNumber);
        } catch (error) {
            console.error('Error assigning number:', {
                numberId: req.params.id,
                error: error.message,
                stack: error.stack,
                sqlMessage: error.sqlMessage,
                sqlState: error.sqlState
            });
            res.status(500).json({ 
                error: 'Failed to assign number',
                details: error.message,
                sqlError: error.sqlMessage
            });
        }
    },

    // Unassign a number
    async unassignNumber(req, res) {
        try {
            const { id } = req.params;
            console.log('Unassign request received for number:', { id, body: req.body });

            // Get the current number state before unassigning
            const currentNumber = await PhoneNumber.findById(id);
            if (!currentNumber) {
                console.log('Number not found for unassign:', id);
                return res.status(404).json({ error: 'Phone number not found' });
            }

            const success = await PhoneNumber.unassign(id, req.body);
            if (!success) {
                console.log('Failed to unassign number:', id);
                return res.status(500).json({ error: 'Failed to unassign number' });
            }

            const updatedNumber = await PhoneNumber.findById(id);
            
            // Log the unassign activity
            await UserActivity.create({
                user_id: req.user.id,
                action_type: 'unassign',
                target_type: 'phone_number',
                target_id: updatedNumber.full_number,
                old_value: {
                    status: currentNumber.status,
                    company_name: currentNumber.company_name,
                    subscriber_name: currentNumber.subscriber_name,
                    gateway: currentNumber.gateway,
                    gateway_username: currentNumber.gateway_username
                },
                new_value: {
                    status: updatedNumber.status,
                    unassignment_date: updatedNumber.unassignment_date,
                    previous_company: currentNumber.company_name,
                    previous_subscriber: currentNumber.subscriber_name
                },
                ip_address: req.ip
            });

            console.log('Successfully unassigned number:', { id, updatedNumber });
            res.json(updatedNumber);
        } catch (error) {
            console.error('Detailed error in unassignNumber:', {
                id: req.params.id,
                message: error.message,
                stack: error.stack,
                code: error.code,
                errno: error.errno,
                sqlMessage: error.sqlMessage,
                sqlState: error.sqlState
            });
            res.status(500).json({ 
                error: 'Failed to unassign number',
                details: error.message,
                sqlError: error.sqlMessage
            });
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

            console.log('Fetching numbers by status:', { status, page, limit, offset, filters: req.query });

            // Validate status
            if (!['assigned', 'unassigned'].includes(status)) {
                return res.status(400).json({ error: 'Invalid status. Must be either "assigned" or "unassigned"' });
            }

            // Build WHERE conditions
            let whereConditions = [`status = ?`];
            let params = [status];

            // Handle golden numbers filter
            if (req.query.is_golden === 'true') {
                whereConditions.push('is_golden = 1');
            }

            // Handle assigned numbers filters
            if (status === 'assigned') {
                if (req.query.company_name) {
                    whereConditions.push('LOWER(company_name) LIKE LOWER(?)');
                    params.push(`%${req.query.company_name}%`);
                }
                if (req.query.subscriber_name) {
                    whereConditions.push('LOWER(subscriber_name) LIKE LOWER(?)');
                    params.push(`%${req.query.subscriber_name}%`);
                }
                if (req.query.gateway) {
                    whereConditions.push('gateway = ?');
                    params.push(req.query.gateway);
                }
            } else if (status === 'unassigned') {
                // Handle unassigned numbers filters
                if (req.query.previous_company) {
                    whereConditions.push('LOWER(company_name) LIKE LOWER(?)');
                    params.push(`%${req.query.previous_company}%`);
                }
                if (req.query.previous_subscriber) {
                    whereConditions.push('LOWER(subscriber_name) LIKE LOWER(?)');
                    params.push(`%${req.query.previous_subscriber}%`);
                }
            }

            // Get total count
            const countQuery = `
                SELECT COUNT(*) as total 
                FROM phone_numbers 
                WHERE ${whereConditions.join(' AND ')}
            `;

            console.log('Count Query:', countQuery);
            console.log('Count Params:', params);

            const [countResult] = await pool.query(countQuery, params);
            const total = countResult[0].total;

            // Get paginated data with all necessary fields
            const dataQuery = `
                SELECT 
                    id,
                    full_number,
                    status,
                    is_golden,
                    company_name,
                    subscriber_name,
                    gateway,
                    gateway_username,
                    assignment_date,
                    unassignment_date,
                    CASE 
                        WHEN status = 'unassigned' THEN company_name
                        ELSE NULL 
                    END as previous_company,
                    CASE 
                        WHEN status = 'unassigned' THEN subscriber_name
                        ELSE NULL 
                    END as previous_subscriber
                FROM phone_numbers 
                WHERE ${whereConditions.join(' AND ')}
                ORDER BY full_number 
                LIMIT ? OFFSET ?
            `;

            const dataParams = [...params, limit, offset];
            console.log('Data Query:', dataQuery);
            console.log('Data Params:', dataParams);

            const [numbers] = await pool.query(dataQuery, dataParams);

            res.json({
                numbers,
                total,
                page,
                totalPages: Math.ceil(total / limit)
            });
        } catch (error) {
            console.error('Error in getNumbersByStatus:', error);
            res.status(500).json({ 
                error: 'Failed to fetch numbers by status',
                details: error.message 
            });
        }
    },

    // Get numbers with missing data
    async getMissingDataNumbers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 100;
            const type = req.query.type || 'all';
            const offset = (page - 1) * limit;

            console.log('Fetching missing data numbers:', { page, limit, type, offset });

            // Base condition for assigned numbers
            const baseCondition = "status = 'assigned'";

            // Build the WHERE clause based on missing data type
            let whereClause = '';
            switch (type) {
                case 'subscriber':
                    whereClause = `${baseCondition} AND (subscriber_name IS NULL OR subscriber_name = "")`;
                    break;
                case 'company':
                    whereClause = `${baseCondition} AND (company_name IS NULL OR company_name = "")`;
                    break;
                case 'gateway':
                    whereClause = `${baseCondition} AND (gateway IS NULL OR gateway = "")`;
                    break;
                case 'gateway_username':
                    whereClause = `${baseCondition} AND (gateway_username IS NULL OR gateway_username = "")`;
                    break;
                default: // 'all'
                    whereClause = `${baseCondition} AND (
                        (subscriber_name IS NULL OR subscriber_name = "") OR 
                        (company_name IS NULL OR company_name = "") OR 
                        (gateway IS NULL OR gateway = "") OR 
                        (gateway_username IS NULL OR gateway_username = "")
                    )`;
            }

            // Get total counts for stats
            const statsQuery = `
                SELECT 
                    COUNT(*) as totalMissing,
                    SUM(CASE WHEN subscriber_name IS NULL OR subscriber_name = "" THEN 1 ELSE 0 END) as missingSubscriber,
                    SUM(CASE WHEN company_name IS NULL OR company_name = "" THEN 1 ELSE 0 END) as missingCompany,
                    SUM(CASE WHEN gateway IS NULL OR gateway = "" THEN 1 ELSE 0 END) as missingGateway,
                    SUM(CASE WHEN gateway_username IS NULL OR gateway_username = "" THEN 1 ELSE 0 END) as missingGatewayUsername
                FROM phone_numbers
                WHERE ${whereClause}
            `;

            // Get paginated numbers with missing data
            const numbersQuery = `
                SELECT 
                    id,
                    CONCAT(
                        national_code,
                        area_code,
                        network_code,
                        LPAD(subscriber_number, 4, '0')
                    ) as full_number,
                    subscriber_name,
                    company_name,
                    gateway,
                    gateway_username,
                    status,
                    assignment_date
                FROM phone_numbers
                WHERE ${whereClause}
                ORDER BY full_number
                LIMIT ? OFFSET ?
            `;

            const [statsResult] = await pool.query(statsQuery);
            const [numbers] = await pool.query(numbersQuery, [limit, offset]);
            const stats = statsResult[0];

            console.log('Query results:', {
                totalRecords: stats.totalMissing,
                returnedRecords: numbers.length,
                page,
                limit,
                offset
            });

            res.json({
                numbers,
                total: stats.totalMissing,
                page,
                limit,
                totalPages: Math.ceil(stats.totalMissing / limit),
                stats
            });
        } catch (error) {
            console.error('Error fetching numbers with missing data:', error);
            res.status(500).json({ 
                error: 'Failed to fetch numbers with missing data',
                details: error.message
            });
        }
    }
};

module.exports = phoneNumberController; 
