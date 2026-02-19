const mongoose = require("mongoose");

const RutaSchema = new mongoose.Schema({
  codigo: { type: String, required: true, unique: true, uppercase: true, trim: true },      // Ej: L-ALCA-M1
  horaSalida: { type: String, required: true },                // Ej: 06:30
  frecuencia: {
    tipo: {
      type: String,
      enum: ['dias-especificos', 'diaria', 'personalizada'],
      default: 'dias-especificos'
    },
    diasSemana: {
      type: [Boolean], // [Lun, Mar, Mié, Jue, Vie, Sáb, Dom]
      default: [false, false, false, false, false, false, false]
    },
    textoLegible: { type: String } // Auto-generado: "Lun, Mié, Vie"
  },
  descripcion: { type: String },                               // Breve texto explicativo
  horarioTipico: { type: String },                             // Ej: "08:00 - 14:00"

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

  // proveedorAsignado: DEPRECADO — reemplazado por choferAsignado (tipoVinculo: 'contratado')

  // --- STANDARD RATES & DISTANCE ---
  kilometrosEstimados: { type: Number, default: 0 },
  precioKm: { type: Number, default: 0 },

  activa: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Ruta", RutaSchema);
