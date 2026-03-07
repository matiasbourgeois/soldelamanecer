const moment = require('moment-timezone');

const AR_TZ = 'America/Argentina/Buenos_Aires';

/**
 * Retorna un objeto Date nativo que representa el UTC exacto correspondiente a las 00:00:00 
 * de la fecha especificada en la zona horaria de Argentina.
 * Ejemplo: Si fecha es "2026-03-07", retorna Date("2026-03-07T03:00:00Z")
 */
exports.getInicioDiaArg = (fecha = new Date()) => {
    return moment(fecha).tz(AR_TZ).startOf('day').toDate();
};

/**
 * Retorna un objeto Date nativo que representa el UTC exacto correspondiente a las 23:59:59.999 
 * de la fecha especificada en la zona horaria de Argentina.
 */
exports.getFinDiaArg = (fecha = new Date()) => {
    return moment(fecha).tz(AR_TZ).endOf('day').toDate();
};

/**
 * Retorna un objeto Date nativo que representa el UTC exacto correspondiente al día 1 a las 00:00:00 
 * del mes en el que cae la fecha especificada, visto desde Argentina.
 */
exports.getInicioMesArg = (fecha = new Date()) => {
    return moment(fecha).tz(AR_TZ).startOf('month').toDate();
};

/**
 * Retorna string YYYY-MM-DD en formato estricto de Argentina
 */
exports.getStrYYYYMMDDArg = (fecha = new Date()) => {
    return moment(fecha).tz(AR_TZ).format('YYYY-MM-DD');
};

/**
 * Extrae de forma segura el Número (1 a 12) del Mes de una fecha tal como cae en Argentina.
 */
exports.getMesActualArg = (fecha = new Date()) => {
    // moment().month() devuelve 0-11, le sumamos 1 para estandarizar 1-12
    return moment(fecha).tz(AR_TZ).month() + 1;
};

/**
 * Extrae de forma segura el Año (YYYY) de una fecha tal como cae en Argentina.
 */
exports.getAnioActualArg = (fecha = new Date()) => {
    return moment(fecha).tz(AR_TZ).year();
};

/**
 * Ajusta una fecha para que se fije a las 12:00:00 (Mediodía UTC) del día percibido por un string, 
 * útil para evitar saltos de día por -3/+3 de offset al guardar fechas ingresadas manualmente (Ej: Service de Vehículos)
 */
exports.getMediodiaSeguroUTC = (fechaStr) => {
    const d = new Date(fechaStr);
    if (!isNaN(d.getTime())) {
        d.setUTCHours(12, 0, 0, 0);
        return d;
    }
    return new Date();
};
