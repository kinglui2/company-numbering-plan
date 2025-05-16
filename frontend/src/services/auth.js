import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const authService = {
    async login(username, password) {
        const response = await axios.post(`${API_URL}/auth/login`, {
            username,
            password
        });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        }
        return response.data;
    },

    logout() {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
    },

    getCurrentUser() {
        const token = localStorage.getItem('token');
        return token ? { token } : null;
    },

    getToken() {
        return localStorage.getItem('token');
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    async getCurrentUserInfo() {
        const token = this.getToken();
        if (!token) return null;

        try {
            const response = await axios.get(`${API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            this.logout();
            return null;
        }
    }
};

export default authService; 