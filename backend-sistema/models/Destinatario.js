const mongoose = require("mongoose");

const destinatarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  dni: { type: String },
  telefono: { type: String },
  email: { type: String },
  direccion: { type: String, required: true },
  localidad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Localidad",
    required: true,
  },
  provincia: { type: String },
}, {
  timestamps: true,
});

module.exports = mongoose.model("Destinatario", destinatarioSchema);
