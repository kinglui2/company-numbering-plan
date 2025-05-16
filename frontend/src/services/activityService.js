import axios from 'axios';
import authService from './auth';

const API_URL = 'http://localhost:5000/api/activity';

const activityService = {
    async getActivities(params = {}) {
        const token = authService.getToken();
        const response = await axios.get(API_URL, {
            headers: { Authorization: `Bearer ${token}` },
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
        const response = await axios.get(`${API_URL}/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { source }
        });
        return response.data;
    }
};

export default activityService; 