const mongoose = require('mongoose');
const HojaReparto = require('./src/models/HojaReparto');
// We do not need populate, just raw string

const run = async () => {
    await mongoose.connect("mongodb://127.0.0.1:27017/soldelamanecer");

    const choferId = "6799071cae7960d783aa8739"; // Aldeco
    const moment = require('moment-timezone');

    const fInitStr = "2026-03-05";
    const fFinStr = "2026-03-05";

    const fnInicio = moment.tz(fInitStr, "YYYY-MM-DD", 'America/Argentina/Buenos_Aires').startOf('day').toDate();
    const fnFin = moment.tz(fFinStr, "YYYY-MM-DD", 'America/Argentina/Buenos_Aires').endOf('day').toDate();

    const hojasAldeco = await HojaReparto.find({
        fecha: { $gte: fnInicio, $lte: fnFin },
        chofer: choferId
    });

    console.log(`Hojas donde Aldeco ES EL CHOFER en el 5: ${hojasAldeco.length}`);
    hojasAldeco.forEach(h => console.log(h.numeroHoja));

    // Also let's see ALL sheets for the 5th, who is the chofer?
    const todas = await HojaReparto.find({
        fecha: { $gte: fnInicio, $lte: fnFin }
    }).limit(5);

    console.log(`\nMuestra de 5 hojas del 5 de Marzo:`);
    todas.forEach(h => console.log(`${h.numeroHoja} -> Chofer ID: ${h.chofer}, Estado: ${h.estado}`));

    process.exit(0);
}
run();
