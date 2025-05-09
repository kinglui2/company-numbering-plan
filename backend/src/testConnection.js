const pool = require('./config/database');
const PhoneNumber = require('./models/PhoneNumber');

async function testConnection() {
    try {
        // Test database connection
        console.log('Testing database connection...');
        const connection = await pool.getConnection();
        console.log('✅ Database connection successful!');
        connection.release();

        // Test getting phone numbers
        console.log('\nTesting phone numbers retrieval...');
        const result = await PhoneNumber.getAll(1, 5);
        console.log('✅ Phone numbers retrieved successfully!');
        console.log('Sample data:', {
            count: result.numbers.length,
            totalPages: result.pagination.totalPages,
            firstNumber: result.numbers[0]
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        // Close the pool
        await pool.end();
    }
}

// Run the test
testConnection(); 