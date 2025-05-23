import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const phoneNumberService = {
    getAllNumbers: async (page = 1, limit = 100, filters = {}) => {
        try {
            // Create params object
            const params = {
                page,
                limit,
                ...filters
            };

            const response = await axios.get(`${API_URL}/phone-numbers`, { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getNumberById: async (id) => {
        const response = await axios.get(`${API_URL}/phone-numbers/${id}`);
        return response.data;
    },

    getCooloffNumbers: async (page = 1, limit = 10) => {
        try {
            const response = await axios.get(`${API_URL}/phone-numbers/cooloff`, {
                params: {
                    page,
                    limit,
                    include_previous: true // Include previous assignment details
                }
            });

            // Transform the response to include calculated fields
            if (response.data.numbers) {
                response.data.numbers = response.data.numbers.map(number => ({
                    ...number,
                    full_number: String(number.full_number),
                    cooloff_start_date: number.unassignment_date || number.cooloff_start_date,
                    previous_company: number.previous_company || number.last_company,
                    previous_subscriber: number.previous_subscriber || number.last_subscriber,
                    days_remaining: calculateDaysRemaining(number.unassignment_date || number.cooloff_start_date)
                }));
            }

            return {
                numbers: response.data.numbers || [],
                total: response.data.total || 0,
                page: response.data.page || 1,
                totalPages: response.data.totalPages || 1
            };
        } catch (error) {
            console.error('Error fetching cooloff numbers:', error);
            throw new Error('Failed to fetch cooloff numbers. Please try again later.');
        }
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
            throw error;
        }
    },

    getAvailableNumbers: async (page = 1, limit = 100, options = {}) => {
        try {
            let url = `${API_URL}/phone-numbers/available?page=${page}&limit=${limit}`;
            
            if (options.fetchAll) {
                url += '&fetchAll=true';
            }
            
            if (options.items && options.items.length > 0) {
                options.items.forEach(filter => {
                    url += `&${filter.columnField}=${filter.value}`;
                });
            }

            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getNumbersByStatus: async (status, page = 1, limit = 100) => {
        try {
            const response = await axios.get(`${API_URL}/phone-numbers/status/${status}`, {
                params: {
                    page,
                    limit
                }
            });
            
            if (response.data.numbers) {
                response.data.numbers = response.data.numbers.map(number => ({
                    ...number,
                    id: number.id || number.full_number,
                    full_number: String(number.full_number)
                }));
            }

            return {
                numbers: response.data.numbers || [],
                total: response.data.total || 0,
                page: response.data.page || page,
                totalPages: response.data.totalPages || Math.ceil((response.data.total || 0) / limit)
            };
        } catch (error) {
            throw new Error(`Failed to fetch ${status} numbers. ${error.response?.data?.error || error.message}`);
        }
    },

    getMissingDataNumbers: async (page = 1, limit = 100, missingType = 'all') => {
        try {
            const response = await axios.get(`${API_URL}/phone-numbers/missing`, {
                params: {
                    page,
                    limit,
                    type: missingType
                }
            });
            
            const numbers = response.data.numbers?.map(number => ({
                ...number,
                id: number.id || number.full_number,
                full_number: String(number.full_number)
            })) || [];

            return {
                numbers,
                total: response.data.total || 0,
                page: response.data.page || page,
                limit: response.data.limit || limit,
                totalPages: response.data.totalPages || Math.ceil((response.data.total || 0) / limit),
                stats: response.data.stats || {}
            };
        } catch (error) {
            throw new Error(`Failed to fetch numbers with missing data. ${error.response?.data?.error || error.message}`);
        }
    },

    updateNumber: async (id, data) => {
        try {
            const response = await axios.put(`${API_URL}/phone-numbers/${id}`, data);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to update number. ${error.response?.data?.error || error.message}`);
        }
    }
};

// Helper function to calculate remaining cooloff days
function calculateDaysRemaining(startDate) {
    if (!startDate) return 90; // Default to full cooloff period if no date
    const start = new Date(startDate);
    const today = new Date();
    const cooloffDays = 90; // Cooloff period in days
    const daysElapsed = Math.floor((today - start) / (1000 * 60 * 60 * 24));
    return Math.max(0, cooloffDays - daysElapsed);
} 