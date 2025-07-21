const mongoose = require("mongoose");

const LocalidadGeneralSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  provincia: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Provincia",
    required: true
  },
  codigoPostal: { type: String }
});

const LocalidadGeneral = mongoose.model("LocalidadGeneral", LocalidadGeneralSchema);
module.exports = LocalidadGeneral;
