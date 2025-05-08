import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const phoneNumberService = {
    getAllNumbers: async (page = 1, limit = 10, availableOnly = false) => {
        const response = await axios.get(`${API_URL}/phone-numbers`, {
            params: { page, limit, available: availableOnly }
        });
        return response.data;
    },

    getNumberById: async (id) => {
        const response = await axios.get(`${API_URL}/phone-numbers/${id}`);
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