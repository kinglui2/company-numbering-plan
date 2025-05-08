const fs = require('fs-extra');
const csv = require('csv-parser');
const path = require('path');
const db = require('../config/db');

async function importData() {
    try {
        // First, create the database
        await db.query('CREATE DATABASE IF NOT EXISTS numbering_plan_db');
        await db.query('USE numbering_plan_db');
        console.log('Database created successfully');

        // Drop existing tables if they exist
        await db.query('DROP TABLE IF EXISTS phone_numbers');
        console.log('Old tables dropped successfully');

        // Create simplified phone_numbers table
        await db.query(`
            CREATE TABLE IF NOT EXISTS phone_numbers (
                id INT PRIMARY KEY AUTO_INCREMENT,
                full_number VARCHAR(15) NOT NULL UNIQUE,
                national_code VARCHAR(3) NOT NULL DEFAULT '254',
                area_code VARCHAR(3) NOT NULL DEFAULT '20',
                network_code VARCHAR(3) NOT NULL DEFAULT '790',
                subscriber_number VARCHAR(4) NOT NULL,
                status ENUM('assigned', 'unassigned', 'cooloff') NOT NULL DEFAULT 'unassigned',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_full_number (full_number),
                INDEX idx_status (status)
            )
        `);
        console.log('Phone numbers table created successfully');

        // Read the main plan file and import only numbers
        const results = new Set(); // Use Set to handle duplicates
        await new Promise((resolve, reject) => {
            fs.createReadStream(path.join(__dirname, '../../sheets/New Numbering Plan (PGM) - PLAN.csv'))
                .pipe(csv())
                .on('data', (row) => {
                    const fullNumber = row['Number'];
                    
                    // Skip if number is empty or undefined
                    if (!fullNumber) return;
                    
                    // Parse the full number into components
                    const subscriberNumber = fullNumber.substring(8); // last 4 digits
                    
                    // Add to Set to ensure uniqueness
                    results.add(JSON.stringify({
                        full_number: fullNumber,
                        subscriber_number: subscriberNumber
                    }));
                })
                .on('end', resolve)
                .on('error', reject);
        });

        // Convert Set to array
        const uniqueResults = Array.from(results).map(item => JSON.parse(item));
        console.log(`Found ${uniqueResults.length} unique numbers`);

        // Insert data in batches to avoid memory issues
        const batchSize = 1000;
        for (let i = 0; i < uniqueResults.length; i += batchSize) {
            const batch = uniqueResults.slice(i, i + batchSize);
            const values = batch.map(row => [
                row.full_number,
                row.subscriber_number
            ]);
            
            await db.query(`
                INSERT INTO phone_numbers 
                (full_number, subscriber_number)
                VALUES ?
            `, [values]);
            
            console.log(`Imported batch ${i / batchSize + 1} of ${Math.ceil(uniqueResults.length / batchSize)}`);
        }

        console.log('Data import completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error importing data:', error);
        process.exit(1);
    }
}

// Run the import
importData(); 