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

// Debug middleware
app.use((req, res, next) => {
    console.log('Server: Incoming request:', {
        method: req.method,
        path: req.path,
        body: req.body,
        params: req.params,
        query: req.query
    });
    next();
});

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

// 404 handler
app.use((req, res, next) => {
    console.log('Server: 404 - Route not found:', {
        method: req.method,
        path: req.path
    });
    res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server: Error:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });
    res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
