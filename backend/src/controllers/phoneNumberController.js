const PhoneNumber = require('../models/PhoneNumber');
const NumberHistory = require('../models/NumberHistory');
const pool = require('../config/database');

const phoneNumberController = {
    // Get all numbers with pagination
    getAllNumbers: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 15;
            const availableOnly = req.query.available === 'true';

            // First, update any numbers that have completed their cooloff period
            await PhoneNumber.updateCooloffStatus();

            const result = await PhoneNumber.getAll(page, limit, availableOnly);
            res.json(result);
        } catch (error) {
            console.error('Error fetching numbers:', error);
            res.status(500).json({ error: 'Failed to fetch phone numbers' });
        }
    },

    // Get cooloff numbers
    getCooloffNumbers: async (req, res) => {
        try {
            const numbers = await PhoneNumber.getCooloffNumbers();
            res.json(numbers);
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

            // Check if number is available for assignment
            if (number.status !== 'available' && 
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
                old_value: JSON.stringify(number),
                new_value: JSON.stringify(updateData)
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

            const success = await PhoneNumber.unassign(id, { notes });
            if (!success) {
                return res.status(500).json({ error: 'Failed to unassign number' });
            }

            res.json({ message: 'Number unassigned successfully' });
        } catch (error) {
            console.error('Error unassigning number:', error);
            res.status(500).json({ error: 'Failed to unassign number' });
        }
    }
};

module.exports = phoneNumberController; 