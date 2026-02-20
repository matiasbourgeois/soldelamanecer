const mongoose = require('mongoose');

const liquidacionContratadoSchema = new mongoose.Schema({
    chofer: { type: mongoose.Schema.Types.ObjectId, ref: 'Chofer', required: true },
    periodo: {
        inicio: { type: Date, required: true },
        fin: { type: Date, required: true }
    },
    hojasReparto: [{ type: mongoose.Schema.Types.ObjectId, ref: 'HojaReparto' }],

    totales: {
        diasTrabajados: { type: Number, default: 0 },
        kmBaseAcumulados: { type: Number, default: 0 },
        kmExtraAcumulados: { type: Number, default: 0 },
        montoTotalViajes: { type: Number, default: 0 }
    },

    estado: {
        type: String,
        enum: ['borrador', 'enviado', 'rechazado', 'aceptado_manual', 'aceptado_automatico', 'anulado', 'pagado'],
        default: 'borrador'
    },

    fechas: {
        creacion: { type: Date, default: Date.now },
        envio: { type: Date },
        aceptacion: { type: Date }
    },

    tokenAceptacion: { type: String },

    motivoRechazo: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model('LiquidacionContratado', liquidacionContratadoSchema);
