const express = require('express');
const cors = require('cors');
require('dotenv').config();
const phoneNumberRoutes = require('./routes/phoneNumbers');
const authRoutes = require('./routes/auth');
const activityRoutes = require('./routes/activity');
const usersRoutes = require('./routes/users');
const settingsRoutes = require('./routes/settings');
const pool = require('./config/database');
require('./cron/updateCooloff');

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
app.use('/api/users', usersRoutes);
app.use('/api/settings', settingsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
