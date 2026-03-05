const moment = require('moment-timezone');

const test = () => {
    const fnInicio1 = moment("2026-03-05").tz('America/Argentina/Buenos_Aires').startOf('day').toDate();
    const fnFin1 = moment("2026-03-05").tz('America/Argentina/Buenos_Aires').endOf('day').toDate();
    console.log("FROM JUST YYYY-MM-DD:");
    console.log("Inicio:", fnInicio1.toISOString());
    console.log("Fin:", fnFin1.toISOString());

    const fnInicio2 = moment("2026-03-05T00:00:00").tz('America/Argentina/Buenos_Aires').startOf('day').toDate();
    const fnFin2 = moment("2026-03-05T23:59:59").tz('America/Argentina/Buenos_Aires').endOf('day').toDate();
    console.log("FROM T00:00:00 AND T23:59:59:");
    console.log("Inicio:", fnInicio2.toISOString());
    console.log("Fin:", fnFin2.toISOString());
}
test();
