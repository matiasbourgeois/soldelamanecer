// utils/api.js

const API_BASE = import.meta.env.VITE_API_BASE;

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
