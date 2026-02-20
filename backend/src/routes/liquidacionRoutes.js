const express = require('express');
const router = express.Router();
const verificarToken = require('../middlewares/authMiddleware');
const verificarGestion = require('../middlewares/verificarGestion');
const {
    generarReporteSimulado,
    guardarLiquidacion,
    obtenerLiquidaciones,
    enviarConformidad,
    obtenerLiquidacionPublica,
    aceptarLiquidacion,
    rechazarLiquidacion,
    anularLiquidacion,
    descargarPDFLiquidacion
} = require('../controllers/logistica/liquidacionController');

// Rutas Públicas (Sin Token JWT)
router.get('/publica/:token', obtenerLiquidacionPublica);
router.post('/publica/:token/aceptar', aceptarLiquidacion);
router.post('/publica/:token/rechazar', rechazarLiquidacion);

// Rutas Privadas (Con Token JWT)
router.post('/simular', verificarToken, verificarGestion, generarReporteSimulado);

// Guardar la liquidación oficialmente (Estado Borrador)
router.post('/', verificarToken, verificarGestion, guardarLiquidacion);

// Obtener liquidaciones (Historial)
router.get('/', verificarToken, verificarGestion, obtenerLiquidaciones);

// Enviar liquidación por email y generar PDF
router.post('/enviar/:id', verificarToken, verificarGestion, enviarConformidad);

// Descargar el PDF de una liquidación generada
router.get('/:id/pdf', verificarToken, verificarGestion, descargarPDFLiquidacion);

// Anular liquidación (Solo Admins)
router.post('/:id/anular', verificarToken, verificarGestion, anularLiquidacion);

module.exports = router;
