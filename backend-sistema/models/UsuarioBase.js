// models/UsuarioBase.js
const mongoose = require("mongoose");

const usuarioSchema = new mongoose.Schema(
  {
    nombre: String,
    email: String,
    rol: String,
    verificado: Boolean,
    activo: Boolean,
    dni: String,
  },
  {
    collection: "usuarios", // importante: conecta con la colección real en la base
    timestamps: true,
  }
);

module.exports = mongoose.model("Usuario", usuarioSchema);
