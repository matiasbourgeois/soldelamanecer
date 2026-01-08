const express = require("express");
const router = express.Router();

const auth = require("../middlewares/verificarToken");

const {
  crearChofer,
  obtenerChoferes,
  obtenerChofer,
  editarChofer,
  obtenerChoferesMinimos,
  eliminarChofer,
  obtenerMiConfiguracion,
  obtenerSelectoresReporte
} = require("../controllers/logistica/choferController");

// Ruta base: /api/choferes

// Crear chofer
router.post("/", crearChofer);

// Ruta para que el chofer obtenga sus defaults
router.get("/configuracion", auth, obtenerMiConfiguracion);
router.get("/selectores-reporte", auth, obtenerSelectoresReporte);

// Obtener todos los choferes
router.get("/", obtenerChoferes);

router.get("/solo-nombres", obtenerChoferesMinimos);

// Obtener un chofer
router.get("/:id", obtenerChofer);

// Editar chofer
router.put("/:id", editarChofer);

// Eliminar chofer
router.delete("/:id", eliminarChofer);

module.exports = router;
