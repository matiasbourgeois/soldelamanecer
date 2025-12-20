const mongoose = require("mongoose");

const remitoSchema = new mongoose.Schema({
  envio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Envio",
    required: true,
  },
  fechaEmision: {
    type: Date,
    default: Date.now,
  },
  clienteRemitente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true,
  },
  destinatario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Destinatario",
    required: true,
  },
  localidadDestino: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Localidad",
    required: true,
  },
  numeroRemito: {
    type: String,
    required: true,
    unique: true
  },  
  encomienda: {
    cantidad: { type: Number, required: true },
    peso: { type: Number, required: true },
    dimensiones: {
      largo: { type: Number, required: true },
      ancho: { type: Number, required: true },
      alto: { type: Number, required: true },
    },
    tipoPaquete: { type: String },
    precio: { type: Number }, // no calculado por ahora
  },
}, { timestamps: true });

module.exports = mongoose.model("Remito", remitoSchema);
