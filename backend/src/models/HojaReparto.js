const mongoose = require('mongoose');

const historialMovimientoSchema = new mongoose.Schema({
  fechaHora: { type: Date, default: Date.now },
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }, // quien hizo el cambio
  accion: { type: String, required: true }, // ej: 'creación', 'confirmación', 'modificación'
});

const hojaRepartoSchema = new mongoose.Schema({
  numeroHoja: {
    type: String,
    default: null, // ✅ ahora puede ser null al principio
  },
  fecha: {
    type: Date,
    required: true,
    default: Date.now,
  },
  ruta: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ruta',
    required: true,
  },
  chofer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chofer',
    default: null, // ✅ Opcional para hojas generadas automáticamente
  },
  vehiculo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehiculo',
    default: null, // ✅ Opcional para hojas generadas automáticamente
  },
  envios: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Envio',
    required: true,
  }],
  estado: {
    type: String,
    enum: ['pendiente', 'en reparto', 'cerrada'],
    default: 'pendiente',
  },
  cerradaAutomaticamente: {
    type: Boolean,
    default: false,
  },
  observaciones: {
    type: String,
    default: '',
  },
  // --- SNAPSHOTS (Fase 1 Plan Maestro) ---
  kilometrosEstimados: { type: Number, default: 0 },
  precioKm: { type: Number, default: 0 },
  proveedor: { type: mongoose.Schema.Types.ObjectId, ref: 'Proveedor', default: null },

  historialMovimientos: [historialMovimientoSchema],
}, { timestamps: true });

module.exports = mongoose.model('HojaReparto', hojaRepartoSchema);
