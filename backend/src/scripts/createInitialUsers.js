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

        // Create support user
        const supportPassword = await bcrypt.hash('support123', 10);
        await db.query(
            'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
            ['support', 'support@example.com', supportPassword, 'support']
        );

        console.log('Initial users created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error creating initial users:', error);
        process.exit(1);
    }
}

createInitialUsers(); 