const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const db = require('../config/db');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function insertMissingNumbers() {
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

        console.log(`Read ${csvData.length} records from CSV`);

        // Get existing numbers from database
        const [existingNumbers] = await db.query('SELECT full_number FROM phone_numbers');
        const existingSet = new Set(existingNumbers.map(record => record.full_number));

        // Find numbers that need to be inserted
        const numbersToInsert = csvData
            .map(record => record.Number?.toString().trim())
            .filter(number => number && !existingSet.has(number));

        console.log(`Found ${numbersToInsert.length} numbers to insert`);

        // Insert numbers in batches
        const batchSize = 100;
        let insertedCount = 0;

        for (let i = 0; i < numbersToInsert.length; i += batchSize) {
            const batch = numbersToInsert.slice(i, i + batchSize);
            const values = batch.map(number => [number, 'available', null, false, null, null]);
            
            await db.query(
                'INSERT INTO phone_numbers (full_number, status, subscriber_name, is_golden, gateway, assignment_date) VALUES ?',
                [values]
            );
            
            insertedCount += batch.length;
            console.log(`Inserted batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(numbersToInsert.length / batchSize)}`);
        }

        console.log(`Successfully inserted ${insertedCount} numbers!`);
        process.exit(0);
    } catch (error) {
        console.error('Error inserting numbers:', error);
        process.exit(1);
    }
}

// Run the insertion
insertMissingNumbers(); 