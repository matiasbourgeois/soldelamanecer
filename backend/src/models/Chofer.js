const mongoose = require("mongoose");

const ChoferSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true,
    unique: true
  },
  telefono: { type: String, required: true },
  tipoVinculo: {
    type: String,
    enum: ["contratado", "relacionDependencia"],
    required: true
  },
  vehiculoAsignado: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehiculo",
    default: null
  },
  activo: { type: Boolean, default: true },

  // ─── Datos exclusivos para choferes contratados ────────────────────────────
  // Solo se usa cuando tipoVinculo === 'contratado'
  datosContratado: {
    razonSocial: { type: String, default: "" },           // "Juan Pérez / Transportes SA"
    cuit: { type: String, default: "" },           // "20-12345678-9"
    email: { type: String, default: "" },           // email de contacto / facturación
    fechaIngreso: { type: Date, default: null },
    fechaEgreso: { type: Date, default: null },

    // Vehículo y ruta por defecto para el contratado
    vehiculoDefault: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehiculo",
      default: null
    },
    rutaDefault: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ruta",
      default: null
    },

    montoChoferDia: { type: Number, default: 0 }, // Tarifa por día cuando usa vehículo SDA

    // Legajo digital — documentos escaneados
    documentos: {
      dni: {
        path: { type: String, default: null },
        fechaSubida: { type: Date, default: null }
      },
      carnetConducir: {
        path: { type: String, default: null },
        fechaSubida: { type: Date, default: null }
      },
      constanciaARCA: {
        path: { type: String, default: null },
        fechaSubida: { type: Date, default: null }
      },
      contrato: {
        path: { type: String, default: null },
        fechaSubida: { type: Date, default: null }
      },
      antecedentesPenales: {
        path: { type: String, default: null },
        fechaSubida: { type: Date, default: null }
      }
    }
  }
}, { timestamps: true });

module.exports = mongoose.model("Chofer", ChoferSchema);
