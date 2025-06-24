import axios from 'axios';

const authService = {
    async login(username, password) {
        const response = await axios.post('/api/auth/login', {
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
            const response = await axios.get('/api/auth/me');
            return response.data;
        } catch (error) {
            this.logout();
            return null;
        }
    }
};

export default authService; 