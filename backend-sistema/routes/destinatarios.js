const express = require("express");
const {
  crearDestinatario,
  obtenerDestinatarios,
  buscarDestinatarios,
  obtenerDestinatarioPorId,
} = require("../controllers/destinatarioController");

const router = express.Router();

router.post("/", crearDestinatario); // Crear nuevo destinatario
router.get("/", obtenerDestinatarios); // Listar todos
router.get("/buscar", buscarDestinatarios);
router.get("/:id", obtenerDestinatarioPorId); // Obtener por ID

module.exports = router;
