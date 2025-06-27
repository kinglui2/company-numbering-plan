const PhoneNumber = require('../models/PhoneNumber');
const NumberHistory = require('../models/NumberHistory');
const UserActivity = require('../models/UserActivity');
const pool = require('../config/database');

const phoneNumberController = {
    // Update a phone number
    async updateNumber(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            
            if (!req.user) {
                return res.status(401).json({ 
                    error: 'Authentication required',
                    message: 'Please log in to update phone numbers'
                });
            }
            
            // Validate if number exists
            let existingNumber;
            try {
                [existingNumber] = await pool.query('SELECT * FROM phone_numbers WHERE id = ?', [id]);
            } catch (dbError) {
                return res.status(500).json({ 
                    error: 'Database error',
                    message: 'Unable to verify phone number. Please try again.'
                });
            }

            if (!existingNumber || existingNumber.length === 0) {
                return res.status(404).json({ 
                    error: 'Not found',
                    message: 'The phone number you are trying to update does not exist.'
                });
            }

            // Build update query dynamically based on provided fields
            const allowedFields = ['subscriber_name', 'company_name', 'gateway', 'gateway_username'];
            const updates = [];
            const values = [];

            Object.keys(updateData).forEach(key => {
                if (allowedFields.includes(key)) {
                    updates.push(`${key} = ?`);
                    values.push(updateData[key]);
                }
            });

            if (updates.length === 0) {
                return res.status(400).json({ 
                    error: 'Invalid update',
                    message: 'No valid fields provided for update.'
                });
            }

            // Add ID to values array
            values.push(id);

            // Execute update query
            const updateQuery = `
                UPDATE phone_numbers 
                SET ${updates.join(', ')} 
                WHERE id = ?
            `;
            
            try {
                await pool.query(updateQuery, values);
            } catch (dbError) {
                return res.status(500).json({ 
                    error: 'Update failed',
                    message: 'Failed to update phone number. Please try again.'
                });
            }

            // Log the activity
            try {
                await UserActivity.create({
                    user_id: req.user.id,
                    activity_type: 'update',
                    number_id: id,
                    details: JSON.stringify({
                        previous: existingNumber[0],
                        updated: updateData
                    })
                });
            } catch (activityError) {
                // Don't fail the update if activity logging fails
            }

            res.json({ 
                success: true,
                message: 'Phone number updated successfully',
                data: {
                    id,
                    ...updateData
                }
            });
        } catch (error) {
            res.status(500).json({ 
                error: 'System error',
                message: 'An unexpected error occurred. Please try again.'
            });
        }
    },

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
            
            const result = await PhoneNumber.getCooloffNumbers(page, limit);
            
            res.json(result);
        } catch (error) {
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
                    is_published,
                    published_date,
                    CASE 
                        WHEN unassignment_date IS NULL THEN 'Never Assigned'
                        ELSE CONCAT(DATEDIFF(NOW(), unassignment_date), ' days since unassignment')
                    END as assignment_status
                FROM phone_numbers 
                WHERE ${whereConditions.join(' AND ')}
                ORDER BY CAST(subscriber_number AS UNSIGNED)
                ${!fetchAll ? 'LIMIT ? OFFSET ?' : ''}
            `;

            const queryParams = fetchAll ? params : [...params, limit, (page - 1) * limit];
            const [numbers] = await pool.query(numbersQuery, queryParams);

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

            // First check if the number exists and is available
            const number = await PhoneNumber.findById(id);
            if (!number) {
                return res.status(404).json({ error: 'Phone number not found' });
            }

            if (number.status === 'assigned') {
                return res.status(400).json({ error: 'Number is already assigned' });
            }

            const success = await PhoneNumber.update(id, updateData);
            if (!success) {
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
            
            res.json(updatedNumber);
        } catch (error) {
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

            // Get the current number state before unassigning
            const currentNumber = await PhoneNumber.findById(id);
            if (!currentNumber) {
                return res.status(404).json({ error: 'Phone number not found' });
            }

            const success = await PhoneNumber.unassign(id, req.body);
            if (!success) {
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

            res.json(updatedNumber);
        } catch (error) {
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
//             console.error('Error fetching dashboard stats:', error);
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

            const [numbers] = await pool.query(dataQuery, dataParams);

            res.json({
                numbers,
                total,
                page,
                totalPages: Math.ceil(total / limit)
            });
        } catch (error) {
            res.status(500).json({ 
                error: 'Failed to fetch numbers by status',
                details: error.message 
            });
        }
    },

    // Get missing data numbers
    async getMissingDataNumbers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 100;
            const offset = (page - 1) * limit;

            // Get total count
            const countQuery = `
                SELECT COUNT(*) as total 
                FROM phone_numbers 
                WHERE (subscriber_name IS NULL OR subscriber_name = '') 
                OR (company_name IS NULL OR company_name = '') 
                OR (gateway IS NULL OR gateway = '')
            `;
            const [countResult] = await pool.query(countQuery);
            const total = countResult[0].total;

            // Get numbers with missing data
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
                    subscriber_name,
                    company_name,
                    gateway,
                    gateway_username,
                    assignment_date
                FROM phone_numbers 
                WHERE (subscriber_name IS NULL OR subscriber_name = '') 
                OR (company_name IS NULL OR company_name = '') 
                OR (gateway IS NULL OR gateway = '')
                ORDER BY full_number
                LIMIT ? OFFSET ?
            `;
            const [numbers] = await pool.query(numbersQuery, [limit, offset]);

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
            res.status(500).json({ 
                error: 'Failed to fetch missing data numbers',
                details: error.message
            });
        }
    },

    // Publish a number
    async publishNumber(req, res) {
        try {
            const { id } = req.params;

            if (!req.user) {
                return res.status(401).json({ 
                    error: 'Authentication required',
                    message: 'Please log in to publish numbers'
                });
            }

            // Check if number exists and is available
            const number = await PhoneNumber.findById(id);
            if (!number) {
                return res.status(404).json({ error: 'Phone number not found' });
            }

            // Check if number is already published
            if (number.is_published) {
                return res.status(400).json({ error: 'Number is already published' });
            }

            const success = await PhoneNumber.publishNumber(id, req.user.id);
            if (!success) {
                return res.status(500).json({ error: 'Failed to publish number' });
            }

            // Log the publish activity
            await UserActivity.create({
                user_id: req.user.id,
                action_type: 'publish',
                target_type: 'phone_number',
                target_id: number.full_number,
                old_value: { is_published: false },
                new_value: { is_published: true },
                ip_address: req.ip
            });

            res.json({ 
                success: true,
                message: 'Number published successfully',
                data: { id, full_number: number.full_number }
            });
        } catch (error) {
            res.status(500).json({ 
                error: 'Failed to publish number',
                details: error.message
            });
        }
    },

    // Unpublish a number
    async unpublishNumber(req, res) {
        try {
            const { id } = req.params;

            if (!req.user) {
                return res.status(401).json({ 
                    error: 'Authentication required',
                    message: 'Please log in to unpublish numbers'
                });
            }

            // Check if number exists
            const number = await PhoneNumber.findById(id);
            if (!number) {
                return res.status(404).json({ error: 'Phone number not found' });
            }

            // Check if number is published
            if (!number.is_published) {
                return res.status(400).json({ error: 'Number is not published' });
            }

            const success = await PhoneNumber.unpublishNumber(id);
            if (!success) {
                return res.status(500).json({ error: 'Failed to unpublish number' });
            }

            // Log the unpublish activity
            await UserActivity.create({
                user_id: req.user.id,
                action_type: 'unpublish',
                target_type: 'phone_number',
                target_id: number.full_number,
                old_value: { is_published: true },
                new_value: { is_published: false },
                ip_address: req.ip
            });

            res.json({ 
                success: true,
                message: 'Number unpublished successfully',
                data: { id, full_number: number.full_number }
            });
        } catch (error) {
            res.status(500).json({ 
                error: 'Failed to unpublish number',
                details: error.message
            });
        }
    },

    // Bulk publish numbers
    async bulkPublishNumbers(req, res) {
        try {
            const { count, source, numberIds } = req.body;

            if (!req.user) {
                return res.status(401).json({ 
                    error: 'Authentication required',
                    message: 'Please log in to publish numbers'
                });
            }

            let numbersToPublish = [];

            if (source === 'random') {
                // Get random unpublished available numbers
                numbersToPublish = await PhoneNumber.getRandomUnpublishedNumbers(count);
            } else if (source === 'current_page' && numberIds) {
                // Use provided number IDs from current page
                const [rows] = await pool.query(`
                    SELECT 
                        id,
                        CONCAT(
                            national_code,
                            area_code,
                            network_code,
                            LPAD(subscriber_number, 4, '0')
                        ) as full_number,
                        is_golden,
                        gateway
                    FROM phone_numbers 
                    WHERE id IN (${numberIds.map(() => '?').join(',')})
                    AND is_published = FALSE
                `, numberIds);
                numbersToPublish = rows;
            } else {
                return res.status(400).json({ error: 'Invalid source or missing numberIds' });
            }

            if (numbersToPublish.length === 0) {
                return res.status(400).json({ error: 'No numbers available to publish' });
            }

            const numberIdsToPublish = numbersToPublish.map(n => n.id);
            const publishedCount = await PhoneNumber.bulkPublishNumbers(numberIdsToPublish, req.user.id);

            // Log the bulk publish activity
            await UserActivity.create({
                user_id: req.user.id,
                action_type: 'bulk_publish',
                target_type: 'phone_numbers',
                target_id: `bulk:${numberIdsToPublish.length}`,
                old_value: { is_published: false },
                new_value: { is_published: true, count: publishedCount, ids: numberIdsToPublish },
                ip_address: req.ip
            });

            res.json({ 
                success: true,
                message: `Successfully published ${publishedCount} numbers`,
                data: { 
                    published_count: publishedCount,
                    numbers: numbersToPublish
                }
            });
        } catch (error) {
            res.status(500).json({ 
                error: 'Failed to publish numbers',
                details: error.message
            });
        }
    },

    // Get published numbers for iframe (public endpoint)
    async getPublishedNumbers(req, res) {
        try {
            const numbers = await PhoneNumber.getPublishedNumbers();
            res.json({ numbers });
        } catch (error) {
            res.status(500).json({ 
                error: 'Failed to fetch published numbers',
                details: error.message
            });
        }
    },

    // Get published numbers for management page (paginated)
    async getPublishedNumbersPaginated(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 100;
            const result = await PhoneNumber.getPublishedNumbersPaginated(page, limit);
            res.json(result);
        } catch (error) {
            res.status(500).json({ 
                error: 'Failed to fetch published numbers',
                details: error.message
            });
        }
    },
};

module.exports = phoneNumberController;