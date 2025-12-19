// utils/api.js

// 🔁 Backend de usuarios (LOGIN, REGISTRO, ROLES): Puerto 5002
const API_USUARIOS = import.meta.env.VITE_API_USUARIOS;

// 🔁 Backend de cotizador (VIAJES, ENCOMIENDAS): Puerto 5001
const API_COTIZADOR = import.meta.env.VITE_API_COTIZADOR;

// 🔁 Backend del sistema (VEHICULOS, CHOFERES, CLIENTES): Puerto 5003
const API_SISTEMA = import.meta.env.VITE_API_SISTEMA;

// 🔁 Backend de localidades (nuevo módulo independiente, en tu VPS)
const API_LOCALIDADES = import.meta.env.VITE_API_LOCALIDADES;

export const apiUsuarios = (ruta) => `${API_USUARIOS}${ruta}`;
export const apiCotizador = (ruta) => `${API_COTIZADOR}${ruta}`;
export const apiSistema = (ruta) => `${API_SISTEMA}${ruta}`;
export const apiLocalidades = (ruta) => `${API_LOCALIDADES}${ruta}`; // ✅ agregado

// 🧩 Rutas internas del backend de usuarios (por ejemplo: /api/usuarios/perfil-completo)
export const apiUsuariosApi = (ruta) => `${API_USUARIOS}/api/usuarios${ruta}`;
