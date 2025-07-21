const mongoose = require("mongoose");
const usuariosDB = require("../config/dbUsuarios");

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
    collection: "usuarios",
    timestamps: true,
  }
);

// ✅ No registramos "Usuario" otra vez — solo el alias
const UsuarioSistema = usuariosDB.model("UsuarioSistema", usuarioSchema);

mongoose.model("UsuarioSistema", usuarioSchema);

module.exports = UsuarioSistema;
