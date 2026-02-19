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

  // --- DATOS DROGUERÍA (Ingreso Diario de Rutas) ---
  // Registrado por el administrativo al otro día con info de los contratados
  datosDrogueria: {
    horaSalidaReal: { type: String, default: '' },    // hora real de salida (puede diferir de ruta.horaSalida)
    horaEnlaces: { type: [String], default: [] },  // ["05:30", "08:45"] — puede ser múltiple
    horaInicioDistribucion: { type: String, default: '' },    // hora primera farmacia
    horaFinDistribucion: { type: String, default: '' },    // hora última farmacia
    cubetasSalida: { type: Number, default: 0 },
    cubetasRetorno: { type: Number, default: 0 },
    kmExtra: { type: Number, default: 0 },     // ⚠️ puede ser NEGATIVO (chofer reemplazado a mitad de camino)
  },
  // observaciones ya existe en root del schema — se reutiliza en el tab droguería

  historialMovimientos: [historialMovimientoSchema],
}, { timestamps: true });

module.exports = mongoose.model('HojaReparto', hojaRepartoSchema);
