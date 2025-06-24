import axios from 'axios';
import authService from './auth';

const activityService = {
    async getActivities(params = {}) {
        const token = authService.getToken();
        if (!token) {
            throw new Error('No authentication token found');
        }
        authService.setAuthHeader(token);
        const response = await axios.get('/api/activity', {
            params: {
                page: params.page || 1,
                limit: params.limit || 10,
                actionType: params.actionType,
                targetType: params.targetType,
                userId: params.userId,
                startDate: params.startDate,
                endDate: params.endDate,
                searchTerm: params.searchTerm
            }
        });
        return response.data;
    },

    async getActivityById(id, source) {
        const token = authService.getToken();
        if (!token) {
            throw new Error('No authentication token found');
        }
        authService.setAuthHeader(token);
        const response = await axios.get(`/api/activity/${id}`, {
            params: { source }
        });
        return response.data;
    }
};

export default activityService; 