const db = require('../config/db');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function updateNumberFormat() {
    try {
        await db.query('USE numbering_plan_db');
        console.log('Using numbering_plan_db database');

        // Get all numbers from the database
        const [rows] = await db.query('SELECT id, full_number FROM phone_numbers');
        console.log(`Found ${rows.length} numbers to update`);

        // Update numbers in batches
        const batchSize = 100;
        let updatedCount = 0;

        for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            
            for (const row of batch) {
                // Convert number from 020790XXXX to 254207900XXX format
                const oldNumber = row.full_number;
                const subscriberNumber = oldNumber.slice(-4); // Last 4 digits
                const newNumber = `254207900${subscriberNumber}`;

                await db.query('UPDATE phone_numbers SET full_number = ? WHERE id = ?', [newNumber, row.id]);
                updatedCount++;
            }
            
            console.log(`Updated batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(rows.length / batchSize)}`);
        }

        console.log(`Successfully updated ${updatedCount} numbers to include country code!`);
        process.exit(0);
    } catch (error) {
        console.error('Error updating number format:', error);
        process.exit(1);
    }
}

// Run the update
updateNumberFormat(); 