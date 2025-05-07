const db = require('../config/db');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Debug: Log environment variables and .env path
console.log('.env path:', path.join(__dirname, '../.env'));
console.log('Database Configuration:', {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD ? '****' : 'not set',
    database: process.env.DB_NAME
});

async function generateNumbers() {
    try {
        // First, create the database
        await db.query('CREATE DATABASE IF NOT EXISTS numbering_plan_db');
        await db.query('USE numbering_plan_db');
        console.log('Database created successfully');

        // Drop number_history table first (because it has the foreign key)
        await db.query('DROP TABLE IF EXISTS number_history');
        console.log('Number history table dropped successfully');

        // Now we can safely drop the phone_numbers table
        await db.query('DROP TABLE IF EXISTS phone_numbers');
        console.log('Phone numbers table dropped successfully');

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

        // Generate numbers from 0000 to 9999
        const numbers = [];
        for (let i = 0; i <= 9999; i++) {
            const subscriberNumber = i.toString().padStart(4, '0');
            const fullNumber = `020790${subscriberNumber}`;
            numbers.push([fullNumber, subscriberNumber]);
        }

        // Insert in batches of 1000
        const batchSize = 1000;
        for (let i = 0; i < numbers.length; i += batchSize) {
            const batch = numbers.slice(i, i + batchSize);
            await db.query(`
                INSERT INTO phone_numbers 
                (full_number, subscriber_number)
                VALUES ?
            `, [batch]);
            
            console.log(`Imported batch ${i / batchSize + 1} of ${Math.ceil(numbers.length / batchSize)}`);
        }

        console.log('Number generation completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error generating numbers:', error);
        process.exit(1);
    }
}

// Run the generation
generateNumbers(); 