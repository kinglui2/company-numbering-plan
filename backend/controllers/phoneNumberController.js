const PhoneNumber = require('../models/phoneNumber');

// Get all phone numbers
exports.getAllNumbers = async (req, res) => {
    try {
        const numbers = await PhoneNumber.getAll();
        res.json(numbers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get number by ID
exports.getNumberById = async (req, res) => {
    try {
        const number = await PhoneNumber.getById(req.params.id);
        if (!number) {
            return res.status(404).json({ message: 'Phone number not found' });
        }
        res.json(number);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get number by full number
exports.getNumberByNumber = async (req, res) => {
    try {
        const number = await PhoneNumber.getByNumber(req.params.number);
        if (!number) {
            return res.status(404).json({ message: 'Phone number not found' });
        }
        res.json(number);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create new number
exports.createNumber = async (req, res) => {
    try {
        const numberId = await PhoneNumber.create(req.body);
        res.status(201).json({ id: numberId, message: 'Phone number created successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update number
exports.updateNumber = async (req, res) => {
    try {
        const success = await PhoneNumber.update(req.params.id, req.body);
        if (!success) {
            return res.status(404).json({ message: 'Phone number not found' });
        }
        res.json({ message: 'Phone number updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get numbers by status
exports.getNumbersByStatus = async (req, res) => {
    try {
        const numbers = await PhoneNumber.getByStatus(req.params.status);
        res.json(numbers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get golden numbers
exports.getGoldenNumbers = async (req, res) => {
    try {
        const numbers = await PhoneNumber.getGoldenNumbers();
        res.json(numbers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}; 