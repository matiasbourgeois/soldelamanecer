const mongoose = require("mongoose");

const ConfiguracionSchema = new mongoose.Schema({
    tarifaGlobalSDA: {
        type: Number,
        default: 0,
        description: "Monto universal por día para contratados que usan vehículo propio de SDA"
    },
    // Añadiremos más variables globales aquí en el futuro según las directivas del negocio
    ultimaActualizacion: { type: Date, default: Date.now },
    actualizadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }
});

const Configuracion = mongoose.model("Configuracion", ConfiguracionSchema);
module.exports = Configuracion;
