const PhoneNumber = require('../models/PhoneNumber');
const NumberHistory = require('../models/NumberHistory');
const pool = require('../config/database');

const phoneNumberController = {
    // Get all numbers with pagination
    async getAllNumbers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 15;
            const availableOnly = req.query.available === 'true';

            const result = await PhoneNumber.getAll(page, limit, availableOnly);
            res.json(result);
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