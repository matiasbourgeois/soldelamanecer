const express = require("express");
const router = express.Router();
const reportesController = require("../controllers/logistica/reportesController");
const verificarToken = require("../middlewares/verificarToken");
const verificarAdmin = require("../middlewares/verificarAdmin");

// Endpoint: GET /api/reportes/dashboard
// Protegido: Solo Admin/Administrativo? Por ahora Admin para seguridad, o ambos.
// Usamos verificarAdmin para restringir acceso sensible.
router.get("/dashboard", [verificarToken, verificarAdmin], reportesController.getDashboardStats);

module.exports = router;
