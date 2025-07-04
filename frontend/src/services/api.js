import axios from 'axios';

export const phoneNumberService = {
    getAllNumbers: async (page = 1, limit = 100, filters = {}) => {
        try {
            // Create params object
            const params = {
                page,
                limit,
                ...filters
            };

            const response = await axios.get('/api/phone-numbers', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getNumberById: async (id) => {
        const response = await axios.get('/api/phone-numbers/' + id);
        return response.data;
    },

    getCooloffNumbers: async (page = 1, limit = 10) => {
        try {
            const response = await axios.get('/api/phone-numbers/cooloff', {
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
                    previous_subscriber: number.previous_subscriber || number.last_subscriber
                }));
            }
  
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    assignNumber: async (id, data) => {
        try {
            console.log('Attempting to assign number:', { id, data });
            const response = await axios.post('/api/phone-numbers/' + id + '/assign', data);
            return response.data;
        } catch (error) {
            console.error('Error in assignNumber:', {
                id,
                data,
                status: error.response?.status,
                statusText: error.response?.statusText,
                errorMessage: error.response?.data?.error,
                errorDetails: error.response?.data?.details,
                sqlError: error.response?.data?.sqlError
            });
            
            // Throw a more informative error
            throw new Error(
                error.response?.data?.details || 
                error.response?.data?.error || 
                'Failed to assign number. Please try again.'
            );
        }
    },

    unassignNumber: async (id, data) => {
        try {
            console.log('Attempting to unassign number:', { id, data });
            const response = await axios.post('/api/phone-numbers/' + id + '/unassign', data);
            return response.data;
        } catch (error) {
            console.error('Error in unassignNumber:', {
                id,
                data,
                status: error.response?.status,
                statusText: error.response?.statusText,
                errorMessage: error.response?.data?.error,
                errorDetails: error.response?.data?.details,
                sqlError: error.response?.data?.sqlError
            });
            
            throw new Error(
                error.response?.data?.details || 
                error.response?.data?.error || 
                'Failed to unassign number. Please try again.'
            );
        }
    },

    getDashboardStats: async () => {
        try {
            const response = await axios.get('/api/phone-numbers/stats');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getAvailableNumbers: async (page = 1, limit = 100, options = {}) => {
        try {
            const params = {
                page,
                limit,
                ...(options.fetchAll && { fetchAll: true }),
                ...(options.is_golden && { is_golden: true }),
                ...(options.range_start && { range_start: options.range_start }),
                ...(options.range_end && { range_end: options.range_end }),
                ...(options.subscriber_search && { subscriber_search: options.subscriber_search })
            };

            // Clean up undefined values
            Object.keys(params).forEach(key => 
                params[key] === undefined && delete params[key]
            );

            const response = await axios.get('/api/phone-numbers/available', { params });
            
            // Transform the response data
            const transformedData = {
                numbers: response.data.numbers.map(number => ({
                    ...number,
                    id: number.id || number.full_number // Ensure each row has a unique id
                })),
                total_count: response.data.total_count,
                page: response.data.page
            };

            return transformedData;
        } catch (error) {
            console.error('Error fetching available numbers:', error);
            throw error;
        }
    },

    getNumbersByStatus: async (status, page = 1, limit = 100, filters = {}) => {
        try {
            // Clean up filters by removing undefined/empty values
            const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
                if (value !== undefined && value !== '' && value !== null) {
                    acc[key] = value;
                }
                return acc;
            }, {});

            const response = await axios.get('/api/phone-numbers/status/' + status, {
                params: {
                    page,
                    limit,
                    ...cleanFilters
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
            const response = await axios.get('/api/phone-numbers/missing', {
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
            console.log('Frontend: Attempting to update number:', { id, data });
            console.log('Frontend: API URL:', '/api/phone-numbers/' + id);
            const response = await axios.put('/api/phone-numbers/' + id, data);
            console.log('Frontend: Update response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Frontend: Update error:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                config: {
                    url: error.config?.url,
                    method: error.config?.method,
                    data: error.config?.data
                }
            });
            throw error;
        }
    },

    // Publish a number
    publishNumber: async (id) => {
        try {
            const response = await axios.post('/api/phone-numbers/' + id + '/publish');
            return response.data;
        } catch (error) {
            throw new Error(
                error.response?.data?.details || 
                error.response?.data?.error || 
                'Failed to publish number. Please try again.'
            );
        }
    },

    // Unpublish a number
    unpublishNumber: async (id) => {
        try {
            const response = await axios.post('/api/phone-numbers/' + id + '/unpublish');
            return response.data;
        } catch (error) {
            throw new Error(
                error.response?.data?.details || 
                error.response?.data?.error || 
                'Failed to unpublish number. Please try again.'
            );
        }
    },

    // Bulk publish numbers
    bulkPublishNumbers: async (data) => {
        try {
            const response = await axios.post('/api/phone-numbers/bulk-publish', data);
            return response.data;
        } catch (error) {
            throw new Error(
                error.response?.data?.details || 
                error.response?.data?.error || 
                'Failed to bulk publish numbers. Please try again.'
            );
        }
    },

    // Get published numbers for management page
    getPublishedNumbers: async (page = 1, limit = 100) => {
        try {
            const response = await axios.get('/api/phone-numbers/published', {
                params: { page, limit }
            });
            return response.data;
        } catch (error) {
            throw new Error(
                error.response?.data?.details || 
                error.response?.data?.error || 
                'Failed to fetch published numbers. Please try again.'
            );
        }
    },

    // Get published numbers for iframe (public endpoint)
    getPublicPublishedNumbers: async () => {
        try {
            const response = await axios.get('/api/phone-numbers/public/published');
            return response.data;
        } catch (error) {
            throw new Error(
                error.response?.data?.details || 
                error.response?.data?.error || 
                'Failed to fetch published numbers. Please try again.'
            );
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