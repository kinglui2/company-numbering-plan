const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function initializeDatabase() {
    try {
        console.log('Initializing database...');
        
        // Read the SQL file
        const sqlFile = path.join(__dirname, 'init.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');
        
        // Split the SQL file into individual statements
        const statements = sql.split(';').filter(stmt => stmt.trim());
        
        // Execute each statement
        for (const statement of statements) {
            if (statement.trim()) {
                await pool.query(statement);
            }
        }
        
        console.log('✅ Database initialized successfully!');
    } catch (error) {
        console.error('❌ Error initializing database:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Run the initialization
initializeDatabase(); 