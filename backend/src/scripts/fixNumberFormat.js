const path = require('path');
const db = require('../config/db');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function fixNumberFormat() {
    try {
        await db.query('USE numbering_plan_db');
        console.log('Using numbering_plan_db database');

        // Get all numbers from the database
        const [records] = await db.query('SELECT id, full_number FROM phone_numbers');
        console.log(`Found ${records.length} numbers to fix`);

        let updatedCount = 0;
        let skippedCount = 0;

        // Update each number
        for (const record of records) {
            const oldNumber = record.full_number;
            // Remove the extra '0' after '79'
            const newNumber = oldNumber.replace('79000', '790');
            
            try {
                await db.query(
                    'UPDATE phone_numbers SET full_number = ? WHERE id = ?',
                    [newNumber, record.id]
                );
                updatedCount++;
                
                if (updatedCount % 1000 === 0) {
                    console.log(`Updated ${updatedCount} numbers...`);
                }
            } catch (err) {
                console.error(`Error updating number ${oldNumber}:`, err.message);
                skippedCount++;
            }
        }

        console.log(`\nUpdate Summary:`);
        console.log(`--------------`);
        console.log(`Successfully updated: ${updatedCount}`);
        console.log(`Skipped: ${skippedCount}`);

        process.exit(0);
    } catch (error) {
        console.error('Error fixing number format:', error);
        process.exit(1);
    }
}

// Run the fix
fixNumberFormat(); 