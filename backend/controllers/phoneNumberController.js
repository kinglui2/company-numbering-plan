const PhoneNumber = require('../models/phoneNumber');

// Get all phone numbers
exports.getAllNumbers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const availableOnly = req.query.availableOnly === 'true';

        // Extract filters from query parameters
        const filters = {};
        const allowedFilters = ['full_number', 'status', 'subscriber_name', 'company_name', 'gateway', 'is_golden'];
        
        allowedFilters.forEach(filter => {
            if (req.query[filter] !== undefined) {
                filters[filter] = req.query[filter];
            }
        });

        // Get filtered numbers with pagination
        const numbers = await PhoneNumber.getAll(page, limit, filters, availableOnly);
        const total = await PhoneNumber.getCount(availableOnly, filters);

        res.json({
            numbers,
            pagination: {
                page,
                limit,
                total
            }
        });
    } catch (error) {
        console.error('Error in getAllNumbers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get number by ID
exports.getNumberById = async (req, res) => {
    try {
        const number = await PhoneNumber.getById(req.params.id);
        if (!number) {
            return res.status(404).json({ message: 'Phone number not found' });
        }
        res.json(number);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get number by full number
exports.getNumberByNumber = async (req, res) => {
    try {
        const number = await PhoneNumber.getByNumber(req.params.number);
        if (!number) {
            return res.status(404).json({ message: 'Phone number not found' });
        }
        res.json(number);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create new number
exports.createNumber = async (req, res) => {
    try {
        const numberId = await PhoneNumber.create(req.body);
        res.status(201).json({ id: numberId, message: 'Phone number created successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update number
exports.updateNumber = async (req, res) => {
    try {
        const success = await PhoneNumber.update(req.params.id, req.body);
        if (!success) {
            return res.status(404).json({ message: 'Phone number not found' });
        }
        res.json({ message: 'Phone number updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get numbers by status
exports.getNumbersByStatus = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const status = req.params.status;

        const result = await PhoneNumber.getByStatus(status, page, limit);
        
        // Always return a JSON response, even if numbers array is empty
        res.json({
            numbers: result.numbers,
            total: result.total,
            page: result.page,
            totalPages: result.totalPages
        });
    } catch (error) {
        console.error('Error fetching numbers by status:', error);
        res.status(500).json({ 
            message: error.message,
            error: 'Failed to fetch numbers'
        });
    }
};

// Get golden numbers
exports.getGoldenNumbers = async (req, res) => {
    try {
        const numbers = await PhoneNumber.getGoldenNumbers();
        res.json(numbers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get available numbers
exports.getAvailableNumbers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const filters = {
            status: 'unassigned'
        };

        // Handle golden numbers filter
        if (req.query.is_golden === 'true') {
            filters.is_golden = true;
        }

        // Handle range filter
        if (req.query.range_start || req.query.range_end) {
            filters.number_range = {
                start: req.query.range_start,
                end: req.query.range_end
            };
        }

        // Handle subscriber search
        if (req.query.subscriber_search) {
            filters.subscriber_search = req.query.subscriber_search;
        }

        // Get filtered numbers with pagination
        const numbers = await PhoneNumber.getAvailableNumbers(page, limit, filters);
        const total = await PhoneNumber.getAvailableCount(filters);

        res.json({
            numbers,
            total_count: total,
            page
        });
    } catch (error) {
        console.error('Error in getAvailableNumbers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}; 