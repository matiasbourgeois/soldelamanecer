const mongoose = require("mongoose");

const ZonaSchema = new mongoose.Schema({
  nombreZona: { type: String, required: true, unique: true }
});

const Zona = mongoose.model("Zona", ZonaSchema);
module.exports = Zona;
