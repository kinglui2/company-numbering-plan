const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function updateDatabase() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        // Read the complete CSV file
        console.log('\nReading complete CSV file...');
        const csvData = [];
        await new Promise((resolve, reject) => {
            fs.createReadStream(path.join(__dirname, '../../sheets/New Numbering Plan (PGM) - PLAN_complete.csv'))
                .pipe(csv())
                .on('data', (row) => {
                    const number = row.Number.trim();
                    csvData.push({
                        full_number: number,
                        national_code: number.substring(0, 3),
                        area_code: number.substring(3, 5),
                        network_code: number.substring(5, 8),
                        subscriber_number: number.substring(8),
                        is_golden: row.Golden === 'Yes' ? 1 : 0,
                        status: row.Allocation === 'Yes' ? 'assigned' : 'unassigned',
                        subscriber_name: row['Subscriber Name'] || null,
                        company_name: row.Company || null,
                        assignment_date: row['Assignment date'] ? new Date(row['Assignment date']) : null,
                        gateway: row.Gateway || null
                    });
                })
                .on('end', resolve)
                .on('error', reject);
        });

        console.log(`Found ${csvData.length} records in CSV file`);

        // Begin transaction
        await connection.beginTransaction();

        // Clear existing data
        console.log('\nClearing existing data...');
        await connection.query('DELETE FROM number_history');
        await connection.query('DELETE FROM phone_numbers');

        // Insert new data
        console.log('Inserting new data...');
        for (const record of csvData) {
            // Insert into phone_numbers
            const [result] = await connection.query(
                `INSERT INTO phone_numbers (
                    full_number, national_code, area_code, network_code, subscriber_number,
                    is_golden, status, subscriber_name, company_name, assignment_date, gateway
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    record.full_number,
                    record.national_code,
                    record.area_code,
                    record.network_code,
                    record.subscriber_number,
                    record.is_golden,
                    record.status,
                    record.subscriber_name,
                    record.company_name,
                    record.assignment_date,
                    record.gateway
                ]
            );

            // If number is assigned, create history record
            if (record.status === 'assigned') {
                await connection.query(
                    `INSERT INTO number_history (
                        number_id, previous_status, new_status,
                        new_subscriber, new_company, new_gateway,
                        change_date
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        result.insertId,
                        'unassigned',
                        'assigned',
                        record.subscriber_name,
                        record.company_name,
                        record.gateway,
                        record.assignment_date || new Date()
                    ]
                );
            }
        }

        // Commit transaction
        await connection.commit();
        console.log('\n✅ Database update completed successfully!');

        // Verify the update
        console.log('\nVerifying database records...');
        const [phoneCount] = await connection.query('SELECT COUNT(*) as count FROM phone_numbers');
        const [historyCount] = await connection.query('SELECT COUNT(*) as count FROM number_history');
        
        console.log(`Total phone numbers in database: ${phoneCount[0].count}`);
        console.log(`Total history records in database: ${historyCount[0].count}`);

        // Verify specific numbers
        console.log('\nVerifying specific numbers:');
        const targetNumbers = [
            '254207900000',  // Assigned
            '254207900543',  // Assigned
            '254207900615',  // Unassigned
            '254207900776',  // Unassigned
            '254207900948',  // Unassigned
            '254207902169',  // Unassigned
            '254207903082',  // Unassigned
            '254207903089'   // Unassigned
        ];

        for (const number of targetNumbers) {
            const [rows] = await connection.query(
                'SELECT * FROM phone_numbers WHERE full_number = ?',
                [number]
            );
            
            if (rows.length > 0) {
                const record = rows[0];
                console.log(`\nNumber: ${record.full_number}`);
                console.log(`Status: ${record.status}`);
                console.log(`Subscriber: ${record.subscriber_name || 'N/A'}`);
                console.log(`Gateway: ${record.gateway || 'N/A'}`);
                console.log(`Company: ${record.company_name || 'N/A'}`);
                console.log(`Assignment Date: ${record.assignment_date ? record.assignment_date.toISOString().split('T')[0] : 'N/A'}`);
            } else {
                console.error(`❌ Number ${number} not found in database!`);
            }
        }

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error updating database:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the update
updateDatabase(); 