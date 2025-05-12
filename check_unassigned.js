const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend/.env') });

async function checkUnassignedNumbers() {
    // Create the connection using environment variables
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        // Query to check numbers with unassignment dates
        const [rows] = await connection.execute(`
            SELECT 
                id,
                full_number,
                status,
                unassignment_date,
                assignment_date,
                company_name
            FROM phone_numbers 
            WHERE status = 'unassigned'
            ORDER BY unassignment_date DESC
            LIMIT 10
        `);

        console.log('\nChecking first 10 unassigned numbers:');
        console.log('----------------------------------------');
        rows.forEach(row => {
            console.log(`
Number ID: ${row.id}
Full Number: ${row.full_number}
Status: ${row.status}
Unassignment Date: ${row.unassignment_date || 'NULL'}
Assignment Date: ${row.assignment_date || 'NULL'}
Company: ${row.company_name || 'NULL'}
----------------------------------------`);
        });

        // Get counts for different scenarios
        const [counts] = await connection.execute(`
            SELECT 
                COUNT(*) as total_unassigned,
                SUM(CASE WHEN unassignment_date IS NOT NULL THEN 1 ELSE 0 END) as with_unassignment_date,
                SUM(CASE WHEN unassignment_date IS NULL THEN 1 ELSE 0 END) as without_unassignment_date
            FROM phone_numbers 
            WHERE status = 'unassigned'
        `);

        console.log('\nSummary:');
        console.log('----------------------------------------');
        console.log(`Total unassigned numbers: ${counts[0].total_unassigned}`);
        console.log(`Numbers with unassignment date: ${counts[0].with_unassignment_date}`);
        console.log(`Numbers without unassignment date: ${counts[0].without_unassignment_date}`);

    } catch (error) {
        console.error('Error querying database:', error);
    } finally {
        await connection.end();
    }
}

checkUnassignedNumbers(); 