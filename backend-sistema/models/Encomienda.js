const mongoose = require("mongoose");
const DimensionesSchema = require("./Dimensiones");

const EncomiendaSchema = new mongoose.Schema({
  cantidadBultos: { type: Number, required: true },
  pesoKg: { type: Number, required: true },
  dimensiones: { type: DimensionesSchema, required: true },
  tipo: { type: String, required: true },
  observaciones: { type: String }
});

module.exports = EncomiendaSchema;
