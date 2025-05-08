const path = require('path');
const db = require('../config/db');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function readDBContent() {
    try {
        await db.query('USE numbering_plan_db');
        console.log('Using numbering_plan_db database');

        // Get all records from the database
        const [records] = await db.query('SELECT * FROM phone_numbers');
        
        console.log('\nDatabase Content Summary:');
        console.log('------------------------');
        console.log(`Total records: ${records.length}`);
        
        // Count by status
        const statusCount = records.reduce((acc, record) => {
            acc[record.status] = (acc[record.status] || 0) + 1;
            return acc;
        }, {});
        
        console.log('\nStatus Distribution:');
        Object.entries(statusCount).forEach(([status, count]) => {
            console.log(`${status}: ${count} numbers`);
        });

        // Count golden numbers
        const goldenCount = records.filter(record => record.is_golden).length;
        console.log(`\nGolden Numbers: ${goldenCount}`);

        // Show sample records
        console.log('\nSample Records (first 5):');
        records.slice(0, 5).forEach(record => {
            console.log({
                number: record.full_number,
                status: record.status,
                subscriber: record.subscriber_name,
                is_golden: record.is_golden,
                gateway: record.gateway,
                assignment_date: record.assignment_date
            });
        });

        process.exit(0);
    } catch (error) {
        console.error('Error reading database:', error);
        process.exit(1);
    }
}

// Run the read operation
readDBContent(); 