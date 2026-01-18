// utils/api.js

const API_USUARIOS = import.meta.env.VITE_API_USUARIOS;
const API_COTIZADOR = import.meta.env.VITE_API_COTIZADOR;
const API_SISTEMA = import.meta.env.VITE_API_SISTEMA;
const API_LOCALIDADES = import.meta.env.VITE_API_LOCALIDADES;
const API_CLIENTES = import.meta.env.VITE_API_CLIENTES;

export const apiUsuarios = (ruta) => `${API_USUARIOS}${ruta}`;
export const apiCotizador = (ruta) => `${API_COTIZADOR}${ruta}`;
export const apiSistema = (ruta) => `${API_SISTEMA}${ruta}`;
export const apiClientes = (ruta) => `${API_CLIENTES}${ruta}`;
export const apiLocalidades = (ruta) => `${API_LOCALIDADES}${ruta}`;

// 🧩 Helper para simplificar rutas de usuarios
export const apiUsuariosApi = (ruta) => `${API_USUARIOS}${ruta}`;
