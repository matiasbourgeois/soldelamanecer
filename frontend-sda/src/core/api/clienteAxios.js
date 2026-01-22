import axios from 'axios';

const API_BASE = import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "https://api-choferes.cotizadorlogistico.site/api";

const clienteAxios = axios.create({
    baseURL: API_BASE
});

// Interceptor de Solicitud (Añadir Token automáticamente)
clienteAxios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor de Respuesta (Vigilante de Sesión Expirada)
clienteAxios.interceptors.response.use(
    (response) => response,
    (error) => {
        // Si el servidor responde con 401 (Unauthorized), la sesión expiró o es inválida
        if (error.response?.status === 401) {
            console.warn("🔒 SESIÓN EXPIRADA: Redirigiendo al inicio público para seguridad.");

            // Limpiar memoria local
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');

            // Nuclear Reset: Redirige a la Home pública y recarga la página
            // Esto elimina cualquier rastro del panel admin en memoria de React
            window.location.href = "/";
        }
        return Promise.reject(error);
    }
);

export default clienteAxios;
