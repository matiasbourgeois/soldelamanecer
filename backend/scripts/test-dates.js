const moment = require('moment-timezone');

const testDates = (fechaInicio, fechaFin) => {
    console.log(`Original Strings: Inicio='${fechaInicio}', Fin='${fechaFin}'`);

    const fnInicio = moment(fechaInicio).tz('America/Argentina/Buenos_Aires').startOf('day').toDate();
    const fnFin = moment(fechaFin).tz('America/Argentina/Buenos_Aires').endOf('day').toDate();

    console.log(`Parsed Inicio (UTC): ${fnInicio.toISOString()}`);
    console.log(`Parsed Fin (UTC): ${fnFin.toISOString()}`);
};

testDates("2026-03-05", "2026-03-05");
// testDates("2026-03-05T00:00:00", "2026-03-05T23:59:59");
