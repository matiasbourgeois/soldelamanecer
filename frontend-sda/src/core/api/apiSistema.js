// utils/api.js

const API_BASE = import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "https://api-choferes.cotizadorlogistico.site/api";
// Para archivos estáticos (uploads, pdfs, etc) que están fuera de /api
const SERVER_BASE = import.meta.env.DEV
    ? "http://localhost:5000"
    : "https://api-choferes.cotizadorlogistico.site";

/**
 * Los helpers ahora añaden el prefijo del módulo automáticamente.
 * Las llamadas en los componentes NO deben incluir /api/usuarios o /api/.
 * Ejemplo: apiUsuarios("/login") -> BASE + /usuarios/login
 */
export const apiUsuarios = (ruta) => `${API_BASE}/usuarios${ruta}`;
export const apiUsuariosApi = (ruta) => `${API_BASE}/usuarios${ruta}`;
export const apiSistema = (ruta) => `${API_BASE}${ruta}`;
export const apiClientes = (ruta) => `${API_BASE}/clientes${ruta}`;
export const apiLocalidades = (ruta) => `${API_BASE}/localidades${ruta}`;
export const apiCotizador = (ruta) => `${API_BASE}${ruta}`;
export const apiEstaticos = (ruta) => `${SERVER_BASE}${ruta}`;
