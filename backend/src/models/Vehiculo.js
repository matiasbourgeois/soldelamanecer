const mongoose = require("mongoose");

const VehiculoSchema = new mongoose.Schema({
  patente: { type: String, required: true, unique: true },
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
