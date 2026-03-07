const express = require('express');
const router = express.Router();
const verifyToken = require('../../middlewares/authMiddleware');
const roleMiddleware = require('../../middlewares/roleMiddleware');
const recoveryController = require('../controllers/sistema/recoveryController');

// Ruta exclusiva para Administradores de Nivel Dios (Time Machine)
router.post('/recuperar-dias-caidos',
    verifyToken,
    roleMiddleware('admin'), // Aseguramos que solo los administradores puedan acceder
    recoveryController.recuperarDiasCaidos
);

module.exports = router;
