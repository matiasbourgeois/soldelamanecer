const mongoose = require("mongoose");

const DimensionesSchema = new mongoose.Schema({
  largo: { type: Number, required: true },
  ancho: { type: Number, required: true },
  alto: { type: Number, required: true }
}, { _id: false }); // No genera ID interno

module.exports = DimensionesSchema;
