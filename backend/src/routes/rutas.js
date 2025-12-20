const express = require("express");
const router = express.Router();
const {
  crearRuta,
  obtenerRutas,
  actualizarRuta,
  cambiarEstadoRuta,
  obtenerTodasLasRutas,
  eliminarRuta,
} = require("../controllers/logistica/rutaController");

router.get("/", obtenerRutas);
router.get("/todas", obtenerTodasLasRutas);
router.post("/", crearRuta);
router.patch("/:id", actualizarRuta);
router.patch("/:id/estado", cambiarEstadoRuta);
router.delete("/:id", eliminarRuta); // nueva ruta
module.exports = router;

