const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const db = require('../config/db');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function verifyPlanData() {
    try {
        await db.query('USE numbering_plan_db');
        console.log('Using numbering_plan_db database');

        // Read the PLAN.csv file
        const csvData = [];
        const csvFilePath = path.join(__dirname, '../../sheets/New Numbering Plan (PGM) - PLAN.csv');

        console.log('Reading PLAN.csv file...');
        await new Promise((resolve, reject) => {
            fs.createReadStream(csvFilePath)
                .pipe(csv())
                .on('data', (data) => {
                    const number = data.Number?.toString().trim();
                    if (number) {
                        csvData.push({
                            number,
                            isAssigned: data.Allocation?.toLowerCase() === 'yes',
                            isGolden: data.Golden?.toLowerCase() === 'yes',
                            subscriberName: data['Subscriber Name']?.trim() || null,
                            gateway: data.Gateway?.trim() || null,
                            company: data.Company?.trim() || null,
                            assignmentDate: data['Assignment date']?.trim() || null
                        });
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        console.log(`\nPLAN.csv Summary:`);
        console.log(`----------------`);
        console.log(`Total records in PLAN.csv: ${csvData.length}`);

        // Get database records
        const [dbRecords] = await db.query('SELECT * FROM phone_numbers');
        console.log(`\nDatabase Summary:`);
        console.log(`----------------`);
        console.log(`Total records in DB: ${dbRecords.length}`);

        // Create maps for easy lookup
        const csvMap = new Map(csvData.map(record => [record.number, record]));
        const dbMap = new Map(dbRecords.map(record => [record.full_number, record]));

        // Find numbers in PLAN.csv but not in DB
        const missingInDB = [];
        for (const [number, record] of csvMap) {
            if (!dbMap.has(number)) {
                missingInDB.push(number);
            }
        }

        // Find numbers in DB but not in PLAN.csv
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
                const isAssigned = csvRecord.isAssigned;
                const isGolden = csvRecord.isGolden;
                const subscriberName = csvRecord.subscriberName;
                const gateway = csvRecord.gateway;

                // Convert DB values to match CSV format for comparison
                const dbIsAssigned = dbRecord.status === 'assigned';
                const dbIsGolden = dbRecord.is_golden === 1;

                if (dbIsAssigned !== isAssigned ||
                    dbIsGolden !== isGolden ||
                    dbRecord.subscriber_name !== subscriberName ||
                    dbRecord.gateway !== gateway) {
                    mismatches.push({
                        number,
                        csv: {
                            isAssigned,
                            isGolden,
                            subscriberName,
                            gateway
                        },
                        db: {
                            isAssigned: dbIsAssigned,
                            isGolden: dbIsGolden,
                            subscriberName: dbRecord.subscriber_name,
                            gateway: dbRecord.gateway
                        }
                    });
                }
            }
        }

        // Print detailed report
        console.log('\nVerification Results:');
        console.log('-------------------');
        console.log(`Numbers in PLAN.csv but missing from DB: ${missingInDB.length}`);
        if (missingInDB.length > 0) {
            console.log('First 5 missing numbers:', missingInDB.slice(0, 5));
        }

        console.log(`\nNumbers in DB but not in PLAN.csv: ${extraInDB.length}`);
        if (extraInDB.length > 0) {
            console.log('First 5 extra numbers:', extraInDB.slice(0, 5));
        }

        console.log(`\nMismatched records: ${mismatches.length}`);
        if (mismatches.length > 0) {
            console.log('First 5 mismatches:');
            mismatches.slice(0, 5).forEach(mismatch => {
                console.log(`\nNumber: ${mismatch.number}`);
                console.log('PLAN.csv:', mismatch.csv);
                console.log('DB:', mismatch.db);
            });
        }

        // Print summary
        console.log('\nSummary:');
        console.log('--------');
        console.log(`Total in PLAN.csv: ${csvData.length}`);
        console.log(`Total in DB: ${dbRecords.length}`);
        console.log(`Missing in DB: ${missingInDB.length}`);
        console.log(`Extra in DB: ${extraInDB.length}`);
        console.log(`Mismatched records: ${mismatches.length}`);

        process.exit(0);
    } catch (error) {
        console.error('Error verifying PLAN data:', error);
        process.exit(1);
    }
}

// Run the verification
verifyPlanData(); 