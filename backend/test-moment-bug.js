const moment = require('moment-timezone');

const test = () => {
    const fechaInicio = "2026-03-05T00:00:00";

    const d1 = moment(fechaInicio);
    console.log("moment(string) IS:", d1.toISOString());

    const d2 = moment(fechaInicio).tz('America/Argentina/Buenos_Aires');
    console.log("moment(string).tz(AR) IS:", d2.toISOString());

    // In my previous code:
    const fnInicio = moment(fechaInicio).tz('America/Argentina/Buenos_Aires').startOf('day').toDate();
    console.log("moment(...).tz(AR).startOf('day') IS:", fnInicio.toISOString());

    // Without T00:00:00
    const fnInicioOrig = moment("2026-03-05").tz('America/Argentina/Buenos_Aires').startOf('day').toDate();
    console.log("Without T00:00:00:", fnInicioOrig.toISOString());
}
test();
