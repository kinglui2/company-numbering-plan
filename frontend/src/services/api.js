import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const phoneNumberService = {
    getAllNumbers: async (page = 1, limit = 100, filters = {}) => {
        try {
            let url = `${API_URL}/phone-numbers?page=${page}&limit=${limit}`;
            
            // Add filters if they exist
            if (filters.items && filters.items.length > 0) {
                filters.items.forEach(filter => {
                    url += `&${filter.columnField}=${filter.value}`;
                });
            }

            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            console.error('Error fetching numbers:', error);
            throw error;
        }
    },

    getNumberById: async (id) => {
        const response = await axios.get(`${API_URL}/phone-numbers/${id}`);
        return response.data;
    },

    getCooloffNumbers: async () => {
        const response = await axios.get(`${API_URL}/phone-numbers/cooloff`);
        return response.data;
    },

    assignNumber: async (id, data) => {
        const response = await axios.post(`${API_URL}/phone-numbers/${id}/assign`, data);
        return response.data;
    },

    unassignNumber: async (id, data) => {
        const response = await axios.post(`${API_URL}/phone-numbers/${id}/unassign`, data);
        return response.data;
    },

    getDashboardStats: async () => {
        try {
            const response = await axios.get(`${API_URL}/phone-numbers/stats`);
            return response.data;
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            throw error;
        }
    },

    getAvailableNumbers: async (page = 1, limit = 100, filters = {}) => {
        try {
            let url = `${API_URL}/phone-numbers/available?page=${page}&limit=${limit}`;
            
            // Add filters if they exist
            if (filters.items && filters.items.length > 0) {
                filters.items.forEach(filter => {
                    url += `&${filter.columnField}=${filter.value}`;
                });
            }

            const response = await axios.get(url);
            
            // Ensure numbers are treated as strings
            if (response.data.numbers) {
                response.data.numbers = response.data.numbers.map(number => ({
                    ...number,
                    full_number: String(number.full_number)
                }));
            }
            
            // Debug logging to check response data
            if (response.data.numbers && response.data.numbers.length > 0) {
                console.log('API Response - First number type:', typeof response.data.numbers[0].full_number);
                console.log('API Response - First number value:', response.data.numbers[0].full_number);
                console.log('API Response - Raw data:', JSON.stringify(response.data.numbers[0]));
            }
            
            return response.data;
        } catch (error) {
            console.error('Error fetching available numbers:', error);
            throw error;
        }
    }
}; 