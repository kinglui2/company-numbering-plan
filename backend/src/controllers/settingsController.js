const db = require('../config/database');
const UserActivity = require('../models/UserActivity');

const settingsController = {
    // Get system settings
    async getSystemSettings(req, res) {
        console.log('getSystemSettings called');
        try {
            const [settings] = await db.query(
                'SELECT * FROM system_settings WHERE category = ?',
                ['system']
            );
            console.log('System settings retrieved:', settings);

            // Convert settings array to object
            const systemSettings = settings.reduce((acc, setting) => {
                acc[setting.setting_key] = setting.setting_value;
                return acc;
            }, {});

            res.json(systemSettings);
        } catch (error) {
            console.error('Error in getSystemSettings:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    // Update system settings
    async updateSystemSettings(req, res) {
        try {
            const settings = req.body;
            const userId = req.user.id;

            // Get current settings for comparison
            const [currentSettings] = await db.query(
                'SELECT * FROM system_settings WHERE category = ?',
                ['system']
            );

            const currentSettingsMap = currentSettings.reduce((acc, setting) => {
                acc[setting.setting_key] = setting.setting_value;
                return acc;
            }, {});

            // Update each setting
            for (const [key, value] of Object.entries(settings)) {
                await db.query(
                    'INSERT INTO system_settings (category, setting_key, setting_value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
                    ['system', key, value, value]
                );

                // Log the change if the value is different
                if (currentSettingsMap[key] !== value) {
                    await UserActivity.create({
                        user_id: userId,
                        action_type: 'update',
                        target_type: 'system_setting',
                        target_id: key,
                        old_value: currentSettingsMap[key],
                        new_value: value,
                        ip_address: req.ip
                    });
                }
            }

            res.json({ message: 'System settings updated successfully' });
        } catch (error) {
            console.error('Error in updateSystemSettings:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    // Get security settings
    async getSecuritySettings(req, res) {
        console.log('getSecuritySettings called');
        try {
            const [settings] = await db.query(
                'SELECT * FROM system_settings WHERE category = ?',
                ['security']
            );
            console.log('Security settings retrieved:', settings);

            // Convert settings array to object
            const securitySettings = settings.reduce((acc, setting) => {
                // Convert string values to appropriate types
                let value = setting.setting_value;
                if (value === 'true') value = true;
                else if (value === 'false') value = false;
                else if (!isNaN(value)) value = Number(value);

                acc[setting.setting_key] = value;
                return acc;
            }, {});

            res.json(securitySettings);
        } catch (error) {
            console.error('Error in getSecuritySettings:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    // Update security settings
    async updateSecuritySettings(req, res) {
        try {
            const settings = req.body;
            const userId = req.user.id;

            // Get current settings for comparison
            const [currentSettings] = await db.query(
                'SELECT * FROM system_settings WHERE category = ?',
                ['security']
            );

            const currentSettingsMap = currentSettings.reduce((acc, setting) => {
                // Convert string values to appropriate types
                let value = setting.setting_value;
                if (value === 'true') value = true;
                else if (value === 'false') value = false;
                else if (!isNaN(value)) value = Number(value);

                acc[setting.setting_key] = value;
                return acc;
            }, {});

            // Update each setting
            for (const [key, value] of Object.entries(settings)) {
                // Convert boolean and number values to strings for storage
                const stringValue = String(value);

                await db.query(
                    'INSERT INTO system_settings (category, setting_key, setting_value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
                    ['security', key, stringValue, stringValue]
                );

                // Log the change if the value is different
                if (currentSettingsMap[key] !== value) {
                    await UserActivity.create({
                        user_id: userId,
                        action_type: 'update',
                        target_type: 'security_setting',
                        target_id: key,
                        old_value: currentSettingsMap[key],
                        new_value: value,
                        ip_address: req.ip
                    });
                }
            }

            res.json({ message: 'Security settings updated successfully' });
        } catch (error) {
            console.error('Error in updateSecuritySettings:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
};

module.exports = settingsController; 