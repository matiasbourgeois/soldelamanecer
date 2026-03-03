const mongoose = require("mongoose");

const SolicitudAprobacionSchema = new mongoose.Schema(
    {
        entidad: {
            type: String,
            required: true,
            enum: ["Ruta", "Vehiculo", "Chofer", "Liquidacion"], // Preparado para ser escalable
            default: "Ruta"
        },
        entidadId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'entidad',
            default: null // Puede ser nulo en caso de CREACIÓN de una nueva entidad que todavía no existe
        },
        accion: {
            type: String,
            required: true,
            enum: ["CREACION", "EDICION", "ELIMINACION"]
        },
        datosPropuestos: {
            type: mongoose.Schema.Types.Mixed,
            default: null // Los datos nuevos si es creación/edición. Nulo si es eliminación.
        },
        solicitante: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Usuario",
            required: true
        },
        estado: {
            type: String,
            required: true,
            enum: ["PENDIENTE", "APROBADA", "RECHAZADA"],
            default: "PENDIENTE"
        },
        motivoRechazo: {
            type: String,
            default: null
        },
        aprobador: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Usuario",
            default: null
        }
    },
    {
        timestamps: true, // Crea createdAt y updatedAt
    }
);

module.exports = mongoose.model("SolicitudAprobacion", SolicitudAprobacionSchema);
