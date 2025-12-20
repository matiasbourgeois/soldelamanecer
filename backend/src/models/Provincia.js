const mongoose = require("mongoose");

const ProvinciaSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true }
});

const Provincia = mongoose.model("Provincia", ProvinciaSchema);
module.exports = Provincia;
