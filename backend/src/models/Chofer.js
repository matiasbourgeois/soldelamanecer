const mongoose = require("mongoose");

const ChoferSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true,
    unique: true
  },
  dni: { type: String, required: true },
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
  activo: { type: Boolean, default: true }
});

module.exports = mongoose.model("Chofer", ChoferSchema);
