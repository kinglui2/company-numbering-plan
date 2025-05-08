const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function analyzeEmptyFields() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        // Get table structure
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'phone_numbers'
        `, [process.env.DB_NAME]);

        console.log('\nAnalyzing empty fields in phone_numbers table...');
        console.log('------------------------------------------------');

        // Check each column for empty values
        for (const column of columns) {
            if (column.COLUMN_NAME === 'id' || column.COLUMN_NAME === 'created_at' || column.COLUMN_NAME === 'updated_at') {
                continue; // Skip auto-generated fields
            }

            let query;
            if (column.DATA_TYPE === 'datetime') {
                query = `
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN ${column.COLUMN_NAME} IS NULL THEN 1 ELSE 0 END) as empty_count
                    FROM phone_numbers
                `;
            } else {
                query = `
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN ${column.COLUMN_NAME} IS NULL OR ${column.COLUMN_NAME} = '' THEN 1 ELSE 0 END) as empty_count
                    FROM phone_numbers
                `;
            }

            const [result] = await connection.query(query);
            const total = result[0].total;
            const empty = result[0].empty_count;
            const percentage = ((empty / total) * 100).toFixed(2);

            console.log(`\nField: ${column.COLUMN_NAME}`);
            console.log(`Type: ${column.DATA_TYPE}`);
            console.log(`Nullable: ${column.IS_NULLABLE}`);
            console.log(`Default: ${column.COLUMN_DEFAULT || 'None'}`);
            console.log(`Empty values: ${empty} out of ${total} (${percentage}%)`);

            // If there are empty values, show some examples
            if (empty > 0) {
                let exampleQuery;
                if (column.DATA_TYPE === 'datetime') {
                    exampleQuery = `
                        SELECT full_number, ${column.COLUMN_NAME}
                        FROM phone_numbers
                        WHERE ${column.COLUMN_NAME} IS NULL
                        LIMIT 5
                    `;
                } else {
                    exampleQuery = `
                        SELECT full_number, ${column.COLUMN_NAME}
                        FROM phone_numbers
                        WHERE ${column.COLUMN_NAME} IS NULL OR ${column.COLUMN_NAME} = ''
                        LIMIT 5
                    `;
                }

                const [examples] = await connection.query(exampleQuery);
                if (examples.length > 0) {
                    console.log('Example empty values:');
                    examples.forEach(ex => {
                        console.log(`  Number: ${ex.full_number}, Value: ${ex[column.COLUMN_NAME]}`);
                    });
                }
            }
        }

        // Check number_history table
        console.log('\nAnalyzing number_history table...');
        console.log('--------------------------------');

        const [historyColumns] = await connection.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'number_history'
        `, [process.env.DB_NAME]);

        for (const column of historyColumns) {
            if (column.COLUMN_NAME === 'id' || column.COLUMN_NAME === 'change_date') {
                continue; // Skip auto-generated fields
            }

            let query;
            if (column.DATA_TYPE === 'datetime') {
                query = `
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN ${column.COLUMN_NAME} IS NULL THEN 1 ELSE 0 END) as empty_count
                    FROM number_history
                `;
            } else {
                query = `
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN ${column.COLUMN_NAME} IS NULL OR ${column.COLUMN_NAME} = '' THEN 1 ELSE 0 END) as empty_count
                    FROM number_history
                `;
            }

            const [result] = await connection.query(query);
            const total = result[0].total;
            const empty = result[0].empty_count;
            const percentage = ((empty / total) * 100).toFixed(2);

            console.log(`\nField: ${column.COLUMN_NAME}`);
            console.log(`Type: ${column.DATA_TYPE}`);
            console.log(`Nullable: ${column.IS_NULLABLE}`);
            console.log(`Default: ${column.COLUMN_DEFAULT || 'None'}`);
            console.log(`Empty values: ${empty} out of ${total} (${percentage}%)`);

            // If there are empty values, show some examples
            if (empty > 0) {
                let exampleQuery;
                if (column.DATA_TYPE === 'datetime') {
                    exampleQuery = `
                        SELECT nh.number_id, p.full_number, nh.${column.COLUMN_NAME}
                        FROM number_history nh
                        JOIN phone_numbers p ON nh.number_id = p.id
                        WHERE nh.${column.COLUMN_NAME} IS NULL
                        LIMIT 5
                    `;
                } else {
                    exampleQuery = `
                        SELECT nh.number_id, p.full_number, nh.${column.COLUMN_NAME}
                        FROM number_history nh
                        JOIN phone_numbers p ON nh.number_id = p.id
                        WHERE nh.${column.COLUMN_NAME} IS NULL OR nh.${column.COLUMN_NAME} = ''
                        LIMIT 5
                    `;
                }

                const [examples] = await connection.query(exampleQuery);
                if (examples.length > 0) {
                    console.log('Example empty values:');
                    examples.forEach(ex => {
                        console.log(`  Number: ${ex.full_number}, Value: ${ex[column.COLUMN_NAME]}`);
                    });
                }
            }
        }

    } catch (error) {
        console.error('Error analyzing database:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the analysis
analyzeEmptyFields(); 