const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const db = require('../config/db');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

function convertDate(dateStr) {
    if (!dateStr) return null;
    // Convert from DD.MM.YYYY to YYYY-MM-DD
    const [day, month, year] = dateStr.split('.');
    if (!day || !month || !year) return null;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

async function updateFromPlan() {
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
                            assignmentDate: convertDate(data['Assignment date'])
                        });
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        console.log(`Read ${csvData.length} records from PLAN.csv`);

        // Get current database records
        console.log('Getting current database records...');
        const [dbRecords] = await db.query('SELECT * FROM phone_numbers');
        console.log(`Current database records: ${dbRecords.length}`);

        // Create maps for easy lookup
        const csvMap = new Map(csvData.map(record => [record.number, record]));
        const dbMap = new Map(dbRecords.map(record => [record.full_number, record]));

        // Find numbers to update
        const numbersToUpdate = [];
        const numbersToAdd = [];
        const numbersToRemove = [];

        console.log('Analyzing differences...');
        // Check each number in the CSV
        for (const [number, csvRecord] of csvMap) {
            const dbRecord = dbMap.get(number);
            if (dbRecord) {
                // Number exists in DB, check if it needs updating
                if (dbRecord.status !== (csvRecord.isAssigned ? 'assigned' : 'unassigned') ||
                    dbRecord.is_golden !== csvRecord.isGolden ||
                    dbRecord.subscriber_name !== csvRecord.subscriberName ||
                    dbRecord.gateway !== csvRecord.gateway ||
                    dbRecord.company_name !== csvRecord.company) {
                    numbersToUpdate.push(csvRecord);
                }
            } else {
                // Number doesn't exist in DB, needs to be added
                numbersToAdd.push(csvRecord);
            }
        }

        // Find numbers in DB that aren't in CSV
        for (const [number, dbRecord] of dbMap) {
            if (!csvMap.has(number)) {
                numbersToRemove.push(number);
            }
        }

        console.log('\nUpdate Summary:');
        console.log('--------------');
        console.log(`Numbers to update: ${numbersToUpdate.length}`);
        console.log(`Numbers to add: ${numbersToAdd.length}`);
        console.log(`Numbers to remove: ${numbersToRemove.length}`);

        // Update existing records in batches
        console.log('\nUpdating records...');
        let updatedCount = 0;
        const batchSize = 100;
        for (let i = 0; i < numbersToUpdate.length; i += batchSize) {
            const batch = numbersToUpdate.slice(i, i + batchSize);
            const promises = batch.map(record => 
                db.query(
                    `UPDATE phone_numbers 
                     SET status = ?,
                         is_golden = ?,
                         subscriber_name = ?,
                         gateway = ?,
                         company_name = ?,
                         assignment_date = ?
                     WHERE full_number = ?`,
                    [
                        record.isAssigned ? 'assigned' : 'unassigned',
                        record.isGolden,
                        record.subscriberName,
                        record.gateway,
                        record.company,
                        record.assignmentDate,
                        record.number
                    ]
                ).catch(err => {
                    console.error(`Error updating number ${record.number}:`, err.message);
                    return null;
                })
            );
            
            await Promise.all(promises);
            updatedCount += batch.length;
            console.log(`Updated ${updatedCount}/${numbersToUpdate.length} records...`);
        }

        // Add new records in batches
        console.log('\nAdding new records...');
        let addedCount = 0;
        for (let i = 0; i < numbersToAdd.length; i += batchSize) {
            const batch = numbersToAdd.slice(i, i + batchSize);
            const promises = batch.map(record =>
                db.query(
                    `INSERT INTO phone_numbers 
                     (full_number, status, is_golden, subscriber_name, gateway, company_name, assignment_date)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        record.number,
                        record.isAssigned ? 'assigned' : 'unassigned',
                        record.isGolden,
                        record.subscriberName,
                        record.gateway,
                        record.company,
                        record.assignmentDate
                    ]
                ).catch(err => {
                    console.error(`Error adding number ${record.number}:`, err.message);
                    return null;
                })
            );
            
            await Promise.all(promises);
            addedCount += batch.length;
            console.log(`Added ${addedCount}/${numbersToAdd.length} records...`);
        }

        // Remove extra records in batches
        console.log('\nRemoving extra records...');
        let removedCount = 0;
        for (let i = 0; i < numbersToRemove.length; i += batchSize) {
            const batch = numbersToRemove.slice(i, i + batchSize);
            const promises = batch.map(number =>
                db.query('DELETE FROM phone_numbers WHERE full_number = ?', [number])
                .catch(err => {
                    console.error(`Error removing number ${number}:`, err.message);
                    return null;
                })
            );
            
            await Promise.all(promises);
            removedCount += batch.length;
            console.log(`Removed ${removedCount}/${numbersToRemove.length} records...`);
        }

        // Verify final counts
        console.log('\nVerifying final state...');
        const [finalCount] = await db.query('SELECT COUNT(*) as total FROM phone_numbers');
        const [assignedCount] = await db.query('SELECT COUNT(*) as assigned FROM phone_numbers WHERE status = "assigned"');
        const [unassignedCount] = await db.query('SELECT COUNT(*) as unassigned FROM phone_numbers WHERE status = "unassigned"');

        console.log('\nFinal Results:');
        console.log('-------------');
        console.log(`Records updated: ${updatedCount}`);
        console.log(`Records added: ${addedCount}`);
        console.log(`Records removed: ${removedCount}`);
        console.log(`\nFinal Database State:`);
        console.log(`Total numbers: ${finalCount[0].total}`);
        console.log(`Assigned numbers: ${assignedCount[0].assigned}`);
        console.log(`Unassigned numbers: ${unassignedCount[0].unassigned}`);

        process.exit(0);
    } catch (error) {
        console.error('Error updating from PLAN:', error);
        process.exit(1);
    }
}

// Run the update
updateFromPlan(); 