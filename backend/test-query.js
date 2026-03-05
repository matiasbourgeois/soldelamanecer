const mongoose = require('mongoose');
const HojaReparto = require('./src/models/HojaReparto');
const Ruta = require('./src/models/Ruta');
const moment = require('moment-timezone');

const run = async () => {
    await mongoose.connect("mongodb://127.0.0.1:27017/soldelamanecer");

    // Simulate frontend dates
    const fechaInicio = "2026-03-05T00:00:00";
    const fechaFin = "2026-03-05T23:59:59";

    // Backend parsing logic
    const fnInicio = moment(fechaInicio).tz('America/Argentina/Buenos_Aires').startOf('day').toDate();
    const fnFin = moment(fechaFin).tz('America/Argentina/Buenos_Aires').endOf('day').toDate();

    console.log("fnInicio:", fnInicio.toISOString());
    console.log("fnFin:", fnFin.toISOString());

    // Aldeco Alejandro chofer ID ?
    // I don't know the exact ID, but let's just query any 'en reparto' / 'cerrada' for the 5th

    const queryHojas = {
        fecha: { $gte: fnInicio, $lte: fnFin },
        estado: { $in: ['cerrada', 'en reparto'] }
    };

    const hojas = await HojaReparto.find(queryHojas).select('numeroHoja estado fecha');
    console.log(`Encontradas para el 5: ${hojas.length}`);
    hojas.forEach(h => console.log(h.numeroHoja, h.estado, h.fecha.toISOString()));

    const queryHojas6 = {
        fecha: { $gte: fnInicio, $lte: moment("2026-03-06T23:59:59").tz('America/Argentina/Buenos_Aires').endOf('day').toDate() },
        estado: { $in: ['cerrada', 'en reparto'] }
    };

    const hojas6 = await HojaReparto.find(queryHojas6).select('numeroHoja estado fecha');
    console.log(`Encontradas para el 5 al 6: ${hojas6.length}`);

    process.exit(0);
}
run();
