const express = require("express");
const router = express.Router();
const reportesController = require("../controllers/logistica/reportesController");
const verificarToken = require("../middlewares/verificarToken");
const verificarGestion = require("../middlewares/verificarGestion");

// Endpoint: GET /api/reportes/dashboard
// Protegido: Admin y Administrativo
router.get("/dashboard", [verificarToken, verificarGestion], reportesController.getDashboardStats);

module.exports = router;
