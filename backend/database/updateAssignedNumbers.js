const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const db = require('../config/db');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function updateAssignedNumbers() {
    try {
        await db.query('USE numbering_plan_db');
        console.log('Using numbering_plan_db database');

        const results = [];
        const csvFilePath = path.join(__dirname, '../../sheets/New Numbering Plan (PGM) - assigned.csv');

        // Read the CSV file
        await new Promise((resolve, reject) => {
            fs.createReadStream(csvFilePath)
                .pipe(csv({
                    skipLines: 3 // Skip the first 3 empty lines
                }))
                .on('data', (data) => {
                    // Only process if it's assigned
                    if (data.NumberAssigned?.toLowerCase() === 'yes') {
                        results.push(data);
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        console.log(`Read ${results.length} assigned records from CSV`);

        // Update assigned numbers in batches
        const batchSize = 100;
        let updatedCount = 0;
        let skippedCount = 0;

        for (let i = 0; i < results.length; i += batchSize) {
            const batch = results.slice(i, i + batchSize);
            for (const record of batch) {
                // Get the full number from the record
                const fullNumber = record.Number?.toString().trim();
                const subscriberName = record.SubscriberName?.trim() || null;
                const isGolden = record.Golden?.toLowerCase() === 'yes';
                const gateway = record.GW?.trim() || null;

                if (fullNumber) {
                    try {
                        // Update the number in the database
                        await db.query(
                            'UPDATE phone_numbers SET status = ?, subscriber_name = ?, is_golden = ?, gateway = ?, assignment_date = ? WHERE full_number = ?',
                            ['assigned', subscriberName, isGolden, gateway, new Date().toISOString().slice(0, 19).replace('T', ' '), fullNumber]
                        );
                        updatedCount++;
                    } catch (err) {
                        console.error(`Error updating number ${fullNumber}:`, err.message);
                        skippedCount++;
                    }
                } else {
                    skippedCount++;
                }
            }
            console.log(`Updated batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(results.length / batchSize)}`);
        }

        console.log(`Successfully updated ${updatedCount} assigned numbers!`);
        console.log(`Skipped ${skippedCount} records`);
        process.exit(0);
    } catch (error) {
        console.error('Error updating assigned numbers:', error);
        process.exit(1);
    }
}

// Run the update
updateAssignedNumbers(); 