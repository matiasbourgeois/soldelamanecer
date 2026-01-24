import axios from 'axios';

// 🌐 DYNAMIC URL: Use local IP for dev (Expo) and production domain for builds.
const PROD_URL = 'https://api-choferes.cotizadorlogistico.site/api';
const DEV_URL = 'http://192.168.0.131:5000/api'; // ⚠️ Check your local IP if it changes

const BASE_URL = __DEV__ ? DEV_URL : PROD_URL;

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
