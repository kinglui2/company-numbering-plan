const bcrypt = require('bcrypt');
const db = require('../config/database');

async function createInitialUsers() {
    try {
        // Create manager user
        const managerPassword = await bcrypt.hash('manager123', 10);
        await db.query(
            'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
            ['manager', 'manager@example.com', managerPassword, 'manager']
        );

        console.log('Manager user created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error creating manager user:', error);
        process.exit(1);
    }
}

createInitialUsers(); 