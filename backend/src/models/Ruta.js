const mongoose = require("mongoose");

const RutaSchema = new mongoose.Schema({
  codigo: { type: String, required: true, unique: true, uppercase: true, trim: true },      // Ej: L-ALCA-M1
  horaSalida: { type: String, required: true },                // Ej: 06:30
  frecuencia: { type: String, required: true },                // Ej: Lu a Vi
  descripcion: { type: String },                               // Breve texto explicativo

  zona: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Zona",
    default: null  // <- cambiado de 'required: true'
  },


  localidades: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Localidad"
  }],

  choferAsignado: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chofer",
    default: null
  },

  vehiculoAsignado: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehiculo",
    default: null
  },

  activa: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Ruta", RutaSchema);
