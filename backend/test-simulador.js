const mongoose = require('mongoose');
const LiquidacionContratado = require('./src/models/LiquidacionContratado');
const HojaReparto = require('./src/models/HojaReparto');
const Ruta = require('./src/models/Ruta');
const Chofer = require('./src/models/Chofer');
const Vehiculo = require('./src/models/Vehiculo'); // Added

const moment = require('moment-timezone');

const calcularTotalesLiquidacion = async (choferId, fechaInicio, fechaFin) => {
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

    const hojas = await HojaReparto.find(queryHojas).populate('ruta vehiculo');
    if (hojas.length === 0) return { hojasValidas: [], totales: null };

    const idsHojas = hojas.map(h => h._id);
    const liquidacionesViejas = await LiquidacionContratado.find({
        hojasReparto: { $in: idsHojas },
        estado: { $nin: ['rechazado', 'anulado'] }
    });

    const idsLiquidados = new Set();
    liquidacionesViejas.forEach(l => {
        l.hojasReparto.forEach(id => idsLiquidados.add(id.toString()));
    });

    const hojasValidas = hojas.filter(h => !idsLiquidados.has(h._id.toString()));
    return { hojasValidas };
};

const run = async () => {
    await mongoose.connect("mongodb://127.0.0.1:27017/soldelamanecer");
    const choferId = "699ce69ad3667d15ffe0c84a";

    // Simulate what the frontend sends AFTER my fix
    const startStr = "2026-03-05T00:00:00";
    const endStr = "2026-03-05T23:59:59";

    const result = await calcularTotalesLiquidacion(choferId, startStr, endStr);

    console.log(`\n\nHojas del 5 que sobrevivieron al filtro de liquidación: ${result.hojasValidas.length}`);
    result.hojasValidas.forEach(h => console.log(`- ${h.numeroHoja} (Fecha ISO: ${h.fecha.toISOString()})`));

    // Let's also check if the 4th is returned when selecting the 4th
    const startStr4 = "2026-03-04T00:00:00";
    const endStr4 = "2026-03-04T23:59:59";
    const result4 = await calcularTotalesLiquidacion(choferId, startStr4, endStr4);

    console.log(`\n\nHojas del 4 que sobrevivieron al filtro de liquidación: ${result4.hojasValidas.length}`);
    result4.hojasValidas.forEach(h => console.log(`- ${h.numeroHoja} (Fecha ISO: ${h.fecha.toISOString()})`));

    process.exit(0);
}
run();
