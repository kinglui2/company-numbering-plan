const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const db = require('../config/db');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function verifyAssignments() {
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
                        // Keep the number exactly as it is in the CSV
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
        console.log(`Total assigned records in CSV: ${csvData.length}`);

        // Get database records
        const [dbRecords] = await db.query('SELECT * FROM phone_numbers WHERE status = "assigned"');
        console.log(`\nDatabase Summary:`);
        console.log(`----------------`);
        console.log(`Total assigned records in DB: ${dbRecords.length}`);

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

        // Find mismatched records
        const mismatches = [];
        for (const [number, dbRecord] of dbMap) {
            const csvRecord = csvMap.get(number);
            if (csvRecord) {
                const isGolden = csvRecord.Golden?.toLowerCase() === 'yes';
                const subscriberName = csvRecord.SubscriberName?.trim() || null;
                const gateway = csvRecord.GW?.trim() || null;

                // Convert boolean to integer for comparison
                const dbIsGolden = dbRecord.is_golden ? 1 : 0;
                const csvIsGolden = isGolden ? 1 : 0;

                if (dbIsGolden !== csvIsGolden ||
                    dbRecord.subscriber_name !== subscriberName ||
                    dbRecord.gateway !== gateway) {
                    mismatches.push({
                        number,
                        csv: {
                            is_golden: isGolden,
                            subscriber_name: subscriberName,
                            gateway: gateway
                        },
                        db: {
                            is_golden: dbRecord.is_golden,
                            subscriber_name: dbRecord.subscriber_name,
                            gateway: dbRecord.gateway
                        }
                    });
                }
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

        console.log(`\nMismatched records: ${mismatches.length}`);
        if (mismatches.length > 0) {
            console.log('First 5 mismatches:');
            mismatches.slice(0, 5).forEach(mismatch => {
                console.log(`\nNumber: ${mismatch.number}`);
                console.log('CSV:', mismatch.csv);
                console.log('DB:', mismatch.db);
            });
        }

        // Print summary
        console.log('\nSummary:');
        console.log('--------');
        console.log(`Total assigned in CSV: ${csvData.length}`);
        console.log(`Total assigned in DB: ${dbRecords.length}`);
        console.log(`Missing in DB: ${missingInDB.length}`);
        console.log(`Extra in DB: ${extraInDB.length}`);
        console.log(`Mismatched records: ${mismatches.length}`);

        // Print sample records with details
        console.log('\nSample Records with Details:');
        console.log('-------------------------');
        const sampleRecords = dbRecords.slice(0, 5);
        sampleRecords.forEach(record => {
            console.log('\nNumber:', record.full_number);
            console.log('Subscriber Name:', record.subscriber_name);
            console.log('Gateway:', record.gateway);
            console.log('Is Golden:', record.is_golden);
            console.log('Assignment Date:', record.assignment_date);
            console.log('-------------------');
        });

        process.exit(0);
    } catch (error) {
        console.error('Error verifying assignments:', error);
        process.exit(1);
    }
}

// Run the verification
verifyAssignments(); 