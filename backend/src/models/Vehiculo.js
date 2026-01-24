const mongoose = require("mongoose");

const VehiculoSchema = new mongoose.Schema({
  patente: { type: String, required: true, unique: true, uppercase: true, trim: true },
  marca: { type: String, required: true },
  modelo: { type: String, required: true },
  capacidadKg: { type: Number, required: true },
  estado: {
    type: String,
    enum: ["disponible", "en mantenimiento", "fuera de servicio"],
    default: "disponible"
  },
  tipoPropiedad: {
    type: String,
    enum: ["propio", "externo"],
    required: true
  },
  tipoCombustible: {
    type: String,
    enum: ["Diesel", "Nafta", "GNC"],
    default: "Diesel"
  },

  // --- INFORMACIÓN TÉCNICA EXTRA ---
  añoModelo: { type: Number },
  numeroChasis: { type: String, trim: true },
  documentos: [{
    nombre: { type: String, required: true },
    path: { type: String, required: true },
    fechaSubida: { type: Date, default: Date.now }
  }],

  // --- MANTENIMIENTO DINÁMICO ---
  kilometrajeActual: {
    type: Number,
    default: 0
  },
  configuracionMantenimiento: [{
    nombre: { type: String, required: true }, // Ej: "Aceite", "Frenos"
    frecuenciaKm: { type: Number, required: true }, // Ej: 10000
    ultimoKm: { type: Number, default: 0 } // Cuándo se hizo por última vez
  }],

  activo: { type: Boolean, default: true }
});

const Vehiculo = mongoose.model("Vehiculo", VehiculoSchema);
module.exports = Vehiculo;
