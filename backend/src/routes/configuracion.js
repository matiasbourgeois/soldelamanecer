const express = require("express");
const router = express.Router();
const { obtenerConfiguracion, actualizarConfiguracion } = require("../controllers/configuracionController");
const auth = require("../middlewares/authMiddleware");
const verificarAdmin = require("../middlewares/verificarAdmin");
const verificarGestion = require("../middlewares/verificarGestion");

// GET: Puede ser leído por admin o administrativo para previsualizaciones (por si hace falta luego)
router.get("/", auth, verificarGestion, obtenerConfiguracion);

// PUT: EXCLUSIVO PARA ROL ADMIN (Gobernanza Total)
router.put("/", auth, verificarAdmin, actualizarConfiguracion);

module.exports = router;
