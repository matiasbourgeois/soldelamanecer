const axios = require('axios');
const logger = require('../utils/logger');

// Cache en memoria para feriados nacionales
let cacheFeriados = null;
let cacheAnio = null;
let lastFetch = null;

const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 días en milisegundos

/**
 * Obtiene feriados nacionales de Argentina desde API pública
 * Se cachea por 30 días para optimizar consultas
 * @param {number} anio - Año a consultar (ej: 2026)
 * @returns {Promise<Array>} Array de fechas en formato 'YYYY-MM-DD'
 */
const obtenerFeriados = async (anio) => {
    const now = Date.now();

    // Cache válida si es mismo año y no pasaron 30 días
    if (cacheFeriados && cacheAnio === anio && lastFetch && (now - lastFetch) < CACHE_DURATION) {
        logger.info(`📦 Usando feriados cacheados de ${anio} (cache válido)`);
        return cacheFeriados;
    }

    try {
        const url = `https://argentinadatos.com/api/v1/feriados/${anio}`;
        logger.info(`🌐 Consultando API de feriados: ${url}`);

        const response = await axios.get(url, { timeout: 5000 });

        // Extraer solo las fechas en formato 'YYYY-MM-DD'
        const fechasFeriados = response.data.map(f => f.fecha);

        // Guardar en cache
        cacheFeriados = fechasFeriados;
        cacheAnio = anio;
        lastFetch = now;

        logger.info(`✅ Feriados de ${anio} cargados: ${fechasFeriados.length} feriados`);
        logger.info(`📅 Feriados: ${fechasFeriados.join(', ')}`);

        return fechasFeriados;
    } catch (error) {
        logger.error(`❌ Error obteniendo feriados de ${anio}: ${error.message}. Usando padrón fijo de respaldo.`);

        // Padrón fijo nivel Dios de feriados inamovibles argentinos
        const feriadosDuros = [
            `${anio}-01-01`, // Año Nuevo
            `${anio}-03-24`, // Día de la Memoria
            `${anio}-04-02`, // Malvinas
            `${anio}-05-01`, // Día del Trabajador
            `${anio}-05-25`, // Rev. Mayo
            `${anio}-06-20`, // Belgrano
            `${anio}-07-09`, // Independencia
            `${anio}-12-08`, // Inmaculada Concepción
            `${anio}-12-25`  // Navidad
        ];
        return feriadosDuros;
    }
};

/**
 * Verifica si una fecha específica es feriado nacional
 * @param {Date} fecha - Fecha a verificar
 * @returns {Promise<boolean>} true si es feriado, false si no
 */
const esFeriado = async (fecha) => {
    // Parche Nivel Dios: Si la fecha entra como `Date` (ej. 24 de Mayo a las 23hs) 
    // y aplicás toISOString(), la manda a UTC (que la tira a 25 de Mayo a las 02hs).
    // Rompería todo. Hay que sacar la fecha EXACTA en Argentina.

    // Obtener la fecha local forzando Argentina
    const fnLocal = new Date(fecha.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
    const anio = fnLocal.getFullYear();
    const mes = String(fnLocal.getMonth() + 1).padStart(2, '0');
    const dia = String(fnLocal.getDate()).padStart(2, '0');

    const fechaStr = `${anio}-${mes}-${dia}`;

    const feriados = await obtenerFeriados(anio);

    const resultado = feriados.includes(fechaStr);

    if (resultado) {
        logger.info(`🏖️ ${fechaStr} es feriado nacional`);
    }

    return resultado;
};

module.exports = { obtenerFeriados, esFeriado };
