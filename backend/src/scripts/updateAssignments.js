const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const db = require('../config/db');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function updateAssignments() {
    try {
        await db.query('USE numbering_plan_db');
        console.log('Using numbering_plan_db database');

        // Read the CSV file
        const csvData = [];
        const csvFilePath = path.join(__dirname, '../../sheets/New Numbering Plan (PGM) - assigned.csv');

        await new Promise((resolve, reject) => {
            fs.createReadStream(csvFilePath)
                .pipe(csv({
                    skipLines: 3
                }))
                .on('data', (data) => {
                    if (data.NumberAssigned?.toLowerCase() === 'yes') {
                        csvData.push(data);
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        console.log(`Read ${csvData.length} assigned records from CSV`);

        // Update records in batches
        const batchSize = 100;
        let updatedCount = 0;
        let skippedCount = 0;

        for (let i = 0; i < csvData.length; i += batchSize) {
            const batch = csvData.slice(i, i + batchSize);
            
            for (const record of batch) {
                let number = record.Number?.toString().trim();
                if (!number) {
                    skippedCount++;
                    continue;
                }

                const isGolden = record.Golden?.toLowerCase() === 'yes';
                const subscriberName = record.SubscriberName?.trim() || null;
                const gateway = record.GW?.trim() || null;

                try {
                    await db.query(
                        `UPDATE phone_numbers 
                         SET status = ?,
                             subscriber_name = ?,
                             is_golden = ?,
                             gateway = ?,
                             assignment_date = CURRENT_TIMESTAMP
                         WHERE full_number = ?`,
                        ['assigned', subscriberName, isGolden, gateway, number]
                    );
                    updatedCount++;
                } catch (err) {
                    console.error(`Error updating number ${number}:`, err.message);
                    skippedCount++;
                }
            }
            
            console.log(`Processed batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(csvData.length / batchSize)}`);
        }

        console.log(`\nUpdate Summary:`);
        console.log(`--------------`);
        console.log(`Total records in CSV: ${csvData.length}`);
        console.log(`Successfully updated: ${updatedCount}`);
        console.log(`Skipped: ${skippedCount}`);

        process.exit(0);
    } catch (error) {
        console.error('Error updating assignments:', error);
        process.exit(1);
    }
}

// Run the update
updateAssignments(); 