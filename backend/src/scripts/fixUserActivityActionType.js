const db = require('../config/database');

async function fixActionTypeColumn() {
    try {
        console.log('Altering action_type column in user_activity table...');
        await db.query(`
            ALTER TABLE user_activity 
            MODIFY COLUMN action_type VARCHAR(32) NOT NULL
        `);
        console.log('Successfully altered action_type column to VARCHAR(32)');
    } catch (error) {
        console.error('Error altering action_type column:', error);
        throw error;
    }
}

fixActionTypeColumn()
    .then(() => {
        console.log('Migration completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    }); 