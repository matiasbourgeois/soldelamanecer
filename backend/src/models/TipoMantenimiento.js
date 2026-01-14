const mongoose = require("mongoose");

const TipoMantenimientoSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    frecuenciaKmDefault: {
        type: Number,
        default: 10000
    },
    descripcion: {
        type: String,
        trim: true
    }
}, { timestamps: true });

module.exports = mongoose.model("TipoMantenimiento", TipoMantenimientoSchema);
