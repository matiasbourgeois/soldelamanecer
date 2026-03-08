const express = require('express');
const router = express.Router();
const verificarToken = require('../middlewares/authMiddleware');
const verificarAdmin = require('../middlewares/verificarAdmin');
const recoveryController = require('../controllers/sistema/recoveryController');
const backupController = require('../controllers/sistema/backupController');

// Ruta exclusiva para Administradores (Time Machine)
router.post('/recuperar-dias-caidos',
    verificarToken,
    verificarAdmin,
    recoveryController.recuperarDiasCaidos
);

// Ruta exclusiva para Administradores (Backup Total)
router.get('/backup',
    verificarToken,
    verificarAdmin,
    backupController.generarBackupCompleto
);

module.exports = router;
