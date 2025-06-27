const db = require('../config/database');

async function addPublishField() {
    try {
        console.log('Adding is_published field to phone_numbers table...');
        
        // Check if the column already exists
        const [columns] = await db.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'phone_numbers' 
            AND COLUMN_NAME = 'is_published'
        `);

        if (columns.length > 0) {
            console.log('is_published column already exists. Skipping...');
            return;
        }

        // Add the is_published column
        await db.query(`
            ALTER TABLE phone_numbers 
            ADD COLUMN is_published BOOLEAN DEFAULT FALSE,
            ADD COLUMN published_date DATETIME NULL,
            ADD COLUMN published_by INT NULL,
            ADD INDEX idx_is_published (is_published)
        `);

        console.log('Successfully added is_published field to phone_numbers table');
        
        // Add foreign key constraint for published_by
        try {
            await db.query(`
                ALTER TABLE phone_numbers 
                ADD CONSTRAINT fk_published_by 
                FOREIGN KEY (published_by) REFERENCES users(id) 
                ON DELETE SET NULL
            `);
            console.log('Successfully added foreign key constraint for published_by');
        } catch (fkError) {
            console.log('Foreign key constraint already exists or users table not found');
        }

    } catch (error) {
        console.error('Error adding is_published field:', error);
        throw error;
    }
}

// Run the migration
addPublishField()
    .then(() => {
        console.log('Migration completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    }); 