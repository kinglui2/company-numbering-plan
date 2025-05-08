const express = require('express');
const cors = require('cors');
require('dotenv').config();

const phoneNumberRoutes = require('./src/routes/phoneNumbers');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/phone-numbers', phoneNumberRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Numbering Plan Management System API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 