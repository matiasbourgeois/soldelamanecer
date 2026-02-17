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
        logger.error(`❌ Error obteniendo feriados de ${anio}:`, error.message);
        // Devolver array vacío en caso de error para no bloquear el sistema
        return [];
    }
};

/**
 * Verifica si una fecha específica es feriado nacional
 * @param {Date} fecha - Fecha a verificar
 * @returns {Promise<boolean>} true si es feriado, false si no
 */
const esFeriado = async (fecha) => {
    const anio = fecha.getFullYear();
    const feriados = await obtenerFeriados(anio);

    // Convertir la fecha a formato 'YYYY-MM-DD'
    const fechaStr = fecha.toISOString().split('T')[0];

    const resultado = feriados.includes(fechaStr);

    if (resultado) {
        logger.info(`🏖️ ${fechaStr} es feriado nacional`);
    }

    return resultado;
};

module.exports = { obtenerFeriados, esFeriado };
