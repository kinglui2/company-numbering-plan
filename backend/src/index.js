const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const phoneNumberRoutes = require('./routes/phoneNumbers');
const activityRoutes = require('./routes/activity');
const pool = require('./config/database');
require('./cron/updateCooloff');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test database connection
pool.getConnection()
    .then(connection => {
        console.log('Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('Error connecting to the database:', err);
        process.exit(1);
    });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/phone-numbers', phoneNumberRoutes);
app.use('/api/activity', activityRoutes);

// Health check route
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 