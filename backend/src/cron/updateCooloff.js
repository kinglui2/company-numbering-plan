const cron = require('node-cron');
const PhoneNumber = require('../models/PhoneNumber');

// Run every day at midnight
cron.schedule('0 0 * * *', async () => {
    try {
        console.log('Running cooloff status update...');
        const updatedCount = await PhoneNumber.updateCooloffStatus();
        console.log(`Updated ${updatedCount} numbers from cooloff to available status`);
    } catch (error) {
        console.error('Error updating cooloff status:', error);
    }
}); 