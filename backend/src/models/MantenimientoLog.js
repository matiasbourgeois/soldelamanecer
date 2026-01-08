const mongoose = require("mongoose");

const MantenimientoLogSchema = new mongoose.Schema({
    vehiculo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vehiculo",
        required: true
    },
    tipo: {
        type: String, // Ej: "Aceite", "Frenos", "Custom"
        required: true
    },
    fecha: {
        type: Date,
        default: Date.now
    },
    ruta: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ruta",
        default: null
    },
    litrosCargados: {
        type: Number,
        default: 0
    },
    kmAlMomento: {
        type: Number,
        required: true
    },
    costo: {
        type: Number,
        default: 0
    },
    observaciones: {
        type: String
    },
    registradoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Usuario", // Si tenemos usuario logueado
        required: false
    }
});

module.exports = mongoose.model("MantenimientoLog", MantenimientoLogSchema);
