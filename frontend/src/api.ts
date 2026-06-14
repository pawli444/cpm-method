import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
});

// Automatyczne dodawanie tokena sesji, jeśli użytkownik jest zalogowany
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('cpm_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;