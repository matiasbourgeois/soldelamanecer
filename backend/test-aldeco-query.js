const mongoose = require('mongoose');
const LiquidacionContratado = require('./src/models/LiquidacionContratado');
const HojaReparto = require('./src/models/HojaReparto');
const Ruta = require('./src/models/Ruta');

const run = async () => {
    await mongoose.connect("mongodb://127.0.0.1:27017/soldelamanecer");

    // VERDADERO ALDECO
    const choferId = "699ce69ad3667d15ffe0c84a";
    const moment = require('moment-timezone');

    // Simulate what the backend receives
    const fechaInicio = "2026-03-05T00:00:00";
    const fechaFin = "2026-03-05T23:59:59";

    const fInitStr = fechaInicio.split('T')[0];
    const fFinStr = fechaFin.split('T')[0];

    const fnInicio = moment.tz(fInitStr, "YYYY-MM-DD", 'America/Argentina/Buenos_Aires').startOf('day').toDate();
    const fnFin = moment.tz(fFinStr, "YYYY-MM-DD", 'America/Argentina/Buenos_Aires').endOf('day').toDate();

    const rutasComoTitular = await Ruta.find({ contratistaTitular: choferId }).lean();
    const idsRutasComoTitular = rutasComoTitular.map(r => r._id);

    const rutasConOtroTitular = await Ruta.find({ contratistaTitular: { $nin: [null, choferId] } }).lean();
    const idsRutasConOtroTitular = rutasConOtroTitular.map(r => r._id);

    const queryHojas = {
        fecha: { $gte: fnInicio, $lte: fnFin },
        estado: { $in: ['cerrada', 'en reparto'] },
        $or: [
            { chofer: choferId, ruta: { $nin: idsRutasConOtroTitular } },
            { ruta: { $in: idsRutasComoTitular } }
        ]
    };

    const hojas = await HojaReparto.find(queryHojas).populate('ruta');
    console.log(`Hojas encontradas para DB (5 MARZO A 5 MARZO): ${hojas.length}`);
    hojas.forEach(h => {
        console.log(`Hoja: ${h.numeroHoja}, Fecha ISO: ${h.fecha.toISOString()}`);
    });
    process.exit(0);
}
run();
