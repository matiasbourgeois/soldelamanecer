const express = require("express");
const Remito = require("../models/Remito");
const {
  crearRemito,
  obtenerRemitoPorEnvio,
  generarRemitoPDF,
  obtenerRemitosConFiltros
} = require("../controllers/remitoController");

const router = express.Router();

// 📌 Crear remito (se usa generalmente al generar un envío)
router.post("/", crearRemito);

router.get("/", obtenerRemitosConFiltros);

// 📌 Obtener remito por ID de envío
router.get("/:envioId", obtenerRemitoPorEnvio);

// 📌 Generar PDF del remito
router.get("/:envioId/pdf", generarRemitoPDF);

module.exports = router;
