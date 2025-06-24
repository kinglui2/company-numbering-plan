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
app.use(cors({
    origin: '*',  // Allow all origins during development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
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
const HOST = process.env.HOST || '0.0.0.0';  // Listen on all interfaces

app.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
    console.log('Server is listening on all network interfaces');
});

// Add a test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is running and accessible' });
});
