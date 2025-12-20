const mongoose = require("mongoose");

const HistorialEstadoSchema = new mongoose.Schema({
  envio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Envio",
    required: true
  },
  estado: {
    type: String,
    enum: ["pendiente", "en camino", "entregado", "cancelado"],
    required: true
  },
  fecha: { type: Date, default: Date.now },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true
  },
  nota: { type: String },
  dniReceptor: { type: String } // obligatorio si estado === "entregado"
});

const HistorialEstado = mongoose.model("HistorialEstado", HistorialEstadoSchema);
module.exports = HistorialEstado;
