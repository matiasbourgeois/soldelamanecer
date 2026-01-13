import axios from 'axios';

// ⚠️ HARDCODED URL: Change this if your local IP changes.
// Future improvement: Use environment variables (expo-constants).
const BASE_URL = 'https://api-choferes.cotizadorlogistico.site/api';

export const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const setAuthToken = (token: string | null) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common['Authorization'];
    }
};
