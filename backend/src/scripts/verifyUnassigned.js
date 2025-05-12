const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const db = require('../config/db');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function verifyUnassigned() {
    try {
        await db.query('USE numbering_plan_db');
        console.log('Using numbering_plan_db database');

        // Read the CSV file
        const csvData = [];
        const csvFilePath = path.join(__dirname, '../../sheets/New Numbering Plan (PGM) - PLAN.csv');

        await new Promise((resolve, reject) => {
            fs.createReadStream(csvFilePath)
                .pipe(csv())
                .on('data', (data) => {
                    if (data.Allocation?.toLowerCase() === 'no') {
                        const number = data.Number?.toString().trim();
                        if (number) {
                            csvData.push(data);
                        }
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        console.log(`\nCSV File Summary:`);
        console.log(`----------------`);
        console.log(`Total unassigned records in CSV: ${csvData.length}`);

        // Get database records
        const [dbRecords] = await db.query('SELECT * FROM phone_numbers WHERE status = "unassigned"');
        console.log(`\nDatabase Summary:`);
        console.log(`----------------`);
        console.log(`Total unassigned records in DB: ${dbRecords.length}`);

        // Create maps for easy lookup
        const csvMap = new Map(csvData.map(record => [record.Number?.toString().trim(), record]));
        const dbMap = new Map(dbRecords.map(record => [record.full_number, record]));

        // Find numbers in CSV but not in DB
        const missingInDB = [];
        for (const [number, record] of csvMap) {
            if (!dbMap.has(number)) {
                missingInDB.push(number);
            }
        }

        // Find numbers in DB but not in CSV
        const extraInDB = [];
        for (const [number, record] of dbMap) {
            if (!csvMap.has(number)) {
                extraInDB.push(number);
            }
        }

        // Print detailed report
        console.log('\nVerification Results:');
        console.log('-------------------');
        console.log(`Numbers in CSV but missing from DB: ${missingInDB.length}`);
        if (missingInDB.length > 0) {
            console.log('First 5 missing numbers:', missingInDB.slice(0, 5));
        }

        console.log(`\nNumbers in DB but not in CSV: ${extraInDB.length}`);
        if (extraInDB.length > 0) {
            console.log('First 5 extra numbers:', extraInDB.slice(0, 5));
        }

        // Print sample records
        console.log('\nSample Unassigned Records:');
        console.log('-------------------------');
        const sampleRecords = dbRecords.slice(0, 5);
        sampleRecords.forEach(record => {
            console.log('\nNumber:', record.full_number);
            console.log('Status:', record.status);
            console.log('Is Golden:', record.is_golden);
            console.log('Subscriber Name:', record.subscriber_name);
            console.log('Gateway:', record.gateway);
            console.log('-------------------');
        });

        // Print summary
        console.log('\nSummary:');
        console.log('--------');
        console.log(`Total unassigned in CSV: ${csvData.length}`);
        console.log(`Total unassigned in DB: ${dbRecords.length}`);
        console.log(`Missing in DB: ${missingInDB.length}`);
        console.log(`Extra in DB: ${extraInDB.length}`);

        process.exit(0);
    } catch (error) {
        console.error('Error verifying unassigned numbers:', error);
        process.exit(1);
    }
}

// Run the verification
verifyUnassigned(); 