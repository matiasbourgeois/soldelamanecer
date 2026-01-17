const mongoose = require("mongoose");

const localidadSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    frecuencia: {
      type: String,
      required: true,
      trim: true,
    },
    horarios: {
      type: [String], // CORRECTED: Array of strings
      required: true,
      trim: true,
    },
    codigoPostal: {
      type: Number,
      required: true,
    },
    activa: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "localidades", // CORRECTED: Standard name
  }
);

module.exports = mongoose.model("Localidad", localidadSchema);
