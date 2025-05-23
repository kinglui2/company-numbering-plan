import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const authService = {
    async login(username, password) {
        const response = await axios.post(`${API_URL}/auth/login`, {
            username,
            password
        });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            this.setAuthHeader(response.data.token);
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

    setAuthHeader(token) {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    async getCurrentUserInfo() {
        const token = this.getToken();
        if (!token) return null;

        try {
            this.setAuthHeader(token);
            const response = await axios.get(`${API_URL}/auth/me`);
            return response.data;
        } catch (error) {
            this.logout();
            return null;
        }
    }
};

export default authService; 