import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const authService = {
    async login(username, password) {
        const response = await axios.post(`${API_URL}/auth/login`, {
            username,
            password
        });
        if (response.data.token) {
            localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    logout() {
        localStorage.removeItem('user');
    },

    getCurrentUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    getToken() {
        const user = this.getCurrentUser();
        return user ? user.token : null;
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