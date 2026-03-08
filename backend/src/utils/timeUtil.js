const moment = require('moment-timezone');

const AR_TZ = 'America/Argentina/Buenos_Aires';

/**
 * Retorna el inicio del día actual en Argentina como un objeto Date nativo.
 * Blindado contra la zona horaria del servidor.
 */
exports.getHoyArg = () => {
    return moment().tz(AR_TZ).startOf('day').toDate();
};

/**
 * Retorna un objeto Date nativo que representa el UTC exacto correspondiente a las 00:00:00 
 * de la fecha especificada en la zona horaria de Argentina.
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
 * Parsea un string en formato DDMMYYYY (ej: "07032026") a un objeto Date
 * fijado al inicio del día en Argentina (00:00:00 ART).
 */
exports.parseDDMMYYYYToDateArg = (str) => {
    if (!str || str.length !== 8) return null;
    return moment.tz(str, "DDMMYYYY", AR_TZ).startOf('day').toDate();
};

/**
 * Genera un objeto de rango para MongoDB { $gte, $lte } a partir de strings DDMMYYYY.
 * Maneja automáticamente si solo se provee uno de los dos.
 */
exports.getRangeFromDDMMYYYY = (desdeStr, hastaStr) => {
    const range = {};
    if (desdeStr) {
        range.$gte = moment.tz(desdeStr, "DDMMYYYY", AR_TZ).startOf('day').toDate();
    }
    if (hastaStr) {
        range.$lte = moment.tz(hastaStr, "DDMMYYYY", AR_TZ).endOf('day').toDate();
    } else if (desdeStr && !hastaStr) {
        // Si solo hay "desde", el rango es el día completo de "desde"
        range.$lte = moment.tz(desdeStr, "DDMMYYYY", AR_TZ).endOf('day').toDate();
    }
    return Object.keys(range).length > 0 ? range : null;
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
 * útil para evitar saltos de día por -3/+3 de offset al guardar fechas ingresadas manualmente.
 */
exports.getMediodiaSeguroUTC = (fechaStr) => {
    const d = new Date(fechaStr);
    if (!isNaN(d.getTime())) {
        d.setUTCHours(12, 0, 0, 0);
        return d;
    }
    return new Date();
};

/**
 * Retorna { start, end } correspondientes al día completo visto desde Argentina.
 */
exports.getDayRange = (fecha) => {
    return {
        start: exports.getInicioDiaArg(fecha),
        end: exports.getFinDiaArg(fecha)
    };
};
