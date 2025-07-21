const express = require("express");
const router = express.Router();

const { buscarPorNumeroSeguimiento } = require("../controllers/seguimientoController");

// Ruta pública sin token
router.get("/:numeroSeguimiento", buscarPorNumeroSeguimiento);

module.exports = router;
