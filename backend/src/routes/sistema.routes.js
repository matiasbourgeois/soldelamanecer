const express = require('express');
const router = express.Router();
const verificarToken = require('../middlewares/authMiddleware');
const verificarAdmin = require('../middlewares/verificarAdmin');
const recoveryController = require('../controllers/sistema/recoveryController');

// Ruta exclusiva para Administradores (Time Machine)
router.post('/recuperar-dias-caidos',
    verificarToken,
    verificarAdmin,
    recoveryController.recuperarDiasCaidos
);

module.exports = router;
