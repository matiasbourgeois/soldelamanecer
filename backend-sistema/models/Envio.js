const mongoose = require("mongoose");

const encomiendaSchema = new mongoose.Schema({
  tipoPaquete: { type: String },
  peso: { type: Number, required: true },
  dimensiones: {
    largo: Number,
    ancho: Number,
    alto: Number, // ⬅ cambiamos "profundidad" por "alto" para unificar
  },
  cantidad: { type: Number, required: true },
}, { _id: false });

const envioSchema = new mongoose.Schema({
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
  encomienda: {
    type: encomiendaSchema,
    required: true,
  },
  localidadDestino: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Localidad",
    required: true,
  },
  sucursalOrigen: {
    type: String,
    default: "Sucursal Córdoba",
  },
  usuarioCreador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true,
  },
  remito: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Remito",
    default: null,
  },
  remitoNumero: {
    type: String,
    default: null,
  },
  estado: {
    type: String,
    enum: [
      "pendiente",      // aún no salió
      "en reparto",     // con hoja asignada
      "entregado",      // entregado al destinatario
      "reagendado",     // intento 1 fallido
      "no entregado",   // intento 2 fallido, queda en sucursal
      "rechazado",      // destinatario rechazó
      "devuelto",       // el remitente ya lo retiró
      "cancelado"       // cancelado manualmente
    ],    
    default: "pendiente",
  },

  nombreReceptor: {
    type: String,
    default: null,
  },
  dniReceptor: {
    type: String,
    default: null,
  },
  motivoDevolucion: { 
    type: String,
    default: null,
  },

  reintentosEntrega: {
    type: Number,
    default: 0,
  },
  motivoNoEntrega: {
    type: String,
    default: null,
  },
  fechaUltimoIntento: {
    type: Date,
    default: null,
  },

  
  historialEstados: [
    {
      estado: {
        type: String,
        required: true
      },
      fecha: {
        type: Date,
        default: Date.now
      },
      sucursal: {
        type: String,
        default: "Casa Central – Córdoba"
      },
      motivo: {
        type: String,
        default: null
      }
    }
  ],  
  
  fechaCreacion: {
    type: Date,
    default: Date.now,
  },
  hojaReparto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "HojaReparto",
    required: false,
  },
  numeroSeguimiento: {
    type: String,
    required: true,
    unique: true,
  },  
  ubicacionEntrega: {
    type: {
      type: String,
      enum: ["Point"],
      required: false,
    },
    coordinates: {
      type: [Number],
      required: false,
    }
  }  

}, {
  timestamps: true,
});

envioSchema.index({ ubicacionEntrega: "2dsphere" });

module.exports = mongoose.model("Envio", envioSchema);

