const db = require('../config/database');
const UserActivity = require('../models/UserActivity');
const { validationResult } = require('express-validator');

const activityController = {
    // Get all activities with filtering and pagination
    async getActivities(req, res) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                actionType,
                targetType,
                userId,
                startDate,
                endDate,
                searchTerm 
            } = req.query;

            const offset = (page - 1) * limit;
            
            // Get activities with filters
            const activities = await UserActivity.findAll({
                actionType,
                targetType,
                userId,
                startDate,
                endDate,
                searchTerm,
                limit: parseInt(limit),
                offset: offset
            });

            // Get total count for pagination
            const total = await UserActivity.countAll({
                actionType,
                targetType,
                userId,
                startDate,
                endDate,
                searchTerm
            });

            const totalPages = Math.ceil(total / limit);

            res.json({
                activities,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages
                }
            });

        } catch (error) {
            console.error('Error in getActivities:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    // Get activity details by ID
    async getActivityById(req, res) {
        try {
            const { id } = req.params;
            const activity = await UserActivity.findById(id);

            if (!activity) {
                return res.status(404).json({ message: 'Activity not found' });
            }

            res.json(activity);
        } catch (error) {
            console.error('Error in getActivityById:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
};

module.exports = activityController; 