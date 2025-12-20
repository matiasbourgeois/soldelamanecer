const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UsuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contrasena: { type: String, required: true },
  rol: {
    type: String,
    enum: ["admin", "administrativo", "chofer", "cliente"],
    default: "cliente"
  },
  fechaRegistro: { type: Date, default: Date.now },
  verificado: { type: Boolean, default: false },
  tokenVerificacion: { type: String },
  activo: { type: Boolean, default: true },

  // ✅ CAMPOS FALTANTES PARA PERFIL
  dni: { type: String },
  telefono: { type: String },
  direccion: { type: String },
  localidad: { type: String },
  provincia: { type: String },
  perfilCompleto: { type: Boolean, default: false },

  datosVinculados: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "rol"
  },
  fotoPerfil: {
    type: String,
    default: ""
  },
  
});

// 🔐 Encriptar contraseña antes de guardar
UsuarioSchema.pre("save", async function (next) {
  if (!this.isModified("contrasena")) return next();
  const salt = await bcrypt.genSalt(10);
  this.contrasena = await bcrypt.hash(this.contrasena, salt);
  next();
});

const Usuario = mongoose.model("Usuario", UsuarioSchema);
module.exports = Usuario;
