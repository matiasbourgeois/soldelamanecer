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
      type: String,
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
    collection: "localidadesSistema",
  }
);

module.exports = mongoose.model("Localidad", localidadSchema);
