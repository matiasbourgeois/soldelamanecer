const mongoose = require("mongoose");

const SucursalSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  direccion: { type: String, required: true },
  localidad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Localidad",
    required: true
  },
  provincia: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Provincia",
    required: true
  },
  telefono: { type: String }
});

const Sucursal = mongoose.model("Sucursal", SucursalSchema);
module.exports = Sucursal;
