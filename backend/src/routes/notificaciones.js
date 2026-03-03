const express = require("express");
const router = express.Router();
const verificarToken = require("../middlewares/authMiddleware");
const verificarGestion = require("../middlewares/verificarGestion");
const { obtenerNotificaciones } = require("../controllers/notificacionesController");

// GET /api/notificaciones — Consolidado de todas las alertas del sistema
// Accesible para admin y administrativo
router.get("/", verificarToken, verificarGestion, obtenerNotificaciones);

module.exports = router;
