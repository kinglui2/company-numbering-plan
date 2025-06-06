const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Debug: Log the configuration
console.log('DB Config:', {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD ? '****' : 'not set',
    database: process.env.DB_NAME
});

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Convert pool to use promises
const promisePool = pool.promise();

module.exports = promisePool; 