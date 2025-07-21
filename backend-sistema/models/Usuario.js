// Importamos mongoose para definir el esquema del modelo
const mongoose = require("mongoose");

// Importamos la conexión a la base de datos de usuarios
const usuariosDB = require("../config/dbUsuarios");

// Definición del esquema del modelo Usuario
const usuarioSchema = new mongoose.Schema({
  // Nombre del usuario
  nombre: {
    type: String,
    required: true, // El nombre es obligatorio
  },

  // Correo electrónico del usuario
  email: {
    type: String,
    required: true,  // El email es obligatorio
    unique: true,    // El email debe ser único
  },

  // Contraseña del usuario
  contrasena: {
    type: String,
    required: true,  // La contraseña es obligatoria
  },

  // Rol del usuario (admin, chofer, cliente, administrativo)
  rol: {
    type: String,
    enum: ["admin", "chofer", "cliente", "administrativo"], // Los roles posibles
    default: "cliente",  // El valor por defecto es "cliente"
  },

  // Estado de verificación del usuario
  verificado: {
    type: Boolean,
    default: false,  // El usuario no está verificado por defecto
  },

  // Token de verificación del usuario
  tokenVerificacion: {
    type: String,
    default: null,  // El token de verificación es null por defecto
  },

  // Fecha de registro del usuario
  fechaRegistro: {
    type: Date,
    default: Date.now,  // La fecha de registro se asigna automáticamente al momento de la creación
  },

  // Estado de activación del usuario
  activo: {
    type: Boolean,
    default: true,  // El usuario está activo por defecto
  },

  // Estado de si el perfil del usuario está completo
  perfilCompleto: {
    type: Boolean,
    default: false,  // El perfil no está completo por defecto
  },
});

// Registro del modelo Usuario usando la conexión correcta
module.exports = usuariosDB.model("Usuario", usuarioSchema);
