const express = require("express");
const router = express.Router();

const {
  crearChofer,
  obtenerChoferes,
  obtenerChofer,
  editarChofer,
  obtenerChoferesMinimos,
  eliminarChofer
} = require("../controllers/choferController");

// Ruta base: /api/choferes

// Crear chofer
router.post("/", crearChofer);

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
