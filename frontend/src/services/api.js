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
    }
}; 