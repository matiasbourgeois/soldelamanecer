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
    required: true,
  },
  vehiculo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehiculo',
    required: true,
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
  historialMovimientos: [historialMovimientoSchema],
});

module.exports = mongoose.model('HojaReparto', hojaRepartoSchema);
