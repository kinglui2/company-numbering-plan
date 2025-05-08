const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const db = require('../config/db');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function verifyData() {
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

        // Get database records
        const [dbRecords] = await db.query('SELECT * FROM phone_numbers WHERE status = "assigned"');
        console.log(`Found ${dbRecords.length} assigned records in database`);

        // Create a map of database records for easy lookup
        const dbMap = new Map(dbRecords.map(record => [record.full_number, record]));

        // Verify each CSV record against database
        let matches = 0;
        let mismatches = 0;
        let missingInDB = 0;

        for (const csvRecord of csvData) {
            const fullNumber = csvRecord.Number?.toString().trim();
            if (!fullNumber) continue;

            const dbRecord = dbMap.get(fullNumber);
            
            if (!dbRecord) {
                console.log(`Number ${fullNumber} exists in CSV but not in database`);
                missingInDB++;
                continue;
            }

            // Check if all fields match
            const isGolden = csvRecord.Golden?.toLowerCase() === 'yes';
            const subscriberName = csvRecord.SubscriberName?.trim() || null;
            const gateway = csvRecord.GW?.trim() || null;

            if (dbRecord.is_golden !== isGolden ||
                dbRecord.subscriber_name !== subscriberName ||
                dbRecord.gateway !== gateway ||
                dbRecord.status !== 'assigned') {
                console.log(`Mismatch for number ${fullNumber}:`);
                console.log('CSV:', { isGolden, subscriberName, gateway, status: 'assigned' });
                console.log('DB:', {
                    is_golden: dbRecord.is_golden,
                    subscriber_name: dbRecord.subscriber_name,
                    gateway: dbRecord.gateway,
                    status: dbRecord.status
                });
                mismatches++;
            } else {
                matches++;
            }
        }

        // Check for records in DB but not in CSV
        const csvNumbers = new Set(csvData.map(record => record.Number?.toString().trim()));
        const extraInDB = dbRecords.filter(record => !csvNumbers.has(record.full_number)).length;

        console.log('\nVerification Summary:');
        console.log('-------------------');
        console.log(`Total CSV records: ${csvData.length}`);
        console.log(`Total DB records: ${dbRecords.length}`);
        console.log(`Matching records: ${matches}`);
        console.log(`Mismatched records: ${mismatches}`);
        console.log(`Records in CSV but missing in DB: ${missingInDB}`);
        console.log(`Records in DB but not in CSV: ${extraInDB}`);

        if (mismatches === 0 && missingInDB === 0 && extraInDB === 0) {
            console.log('\n✅ All data matches perfectly!');
        } else {
            console.log('\n⚠️ Some discrepancies found. Please review the mismatches above.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error verifying data:', error);
        process.exit(1);
    }
}

// Run the verification
verifyData(); 