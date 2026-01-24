const mongoose = require("mongoose");

const ProveedorSchema = new mongoose.Schema({
    razonSocial: { type: String, required: true },
    cuit: { type: String, required: true, unique: true },
    email: { type: String },
    telefono: { type: String },

    fechaIngreso: { type: Date, default: Date.now },
    fechaEgreso: { type: Date },

    vehiculoDefault: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vehiculo",
        default: null
    },

    rutaDefault: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ruta",
        default: null
    },

    activo: { type: Boolean, default: true },

    documentos: {
        dni: {
            path: { type: String },
            fechaSubida: { type: Date }
        },
        carnetConducir: {
            path: { type: String },
            fechaSubida: { type: Date }
        },
        constanciaARCA: {
            path: { type: String },
            fechaSubida: { type: Date }
        },
        contrato: {
            path: { type: String },
            fechaSubida: { type: Date }
        },
        antecedentesPenales: {
            path: { type: String },
            fechaSubida: { type: Date }
        }
    }
}, { timestamps: true });

module.exports = mongoose.model("Proveedor", ProveedorSchema);
