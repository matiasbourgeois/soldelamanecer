const express = require("express");
const router = express.Router();
const verificarToken = require("../middlewares/authMiddleware");
const {
  crearRuta,
  obtenerRutas,
  actualizarRuta,
  cambiarEstadoRuta,
  obtenerTodasLasRutas,
  eliminarRuta,
  actualizarTarifasMasivas,
} = require("../controllers/logistica/rutaController");

router.get("/", obtenerRutas);
router.get("/todas", obtenerTodasLasRutas);
router.post("/", crearRuta);
router.patch("/tarifas-masivas", verificarToken, actualizarTarifasMasivas);
router.patch("/:id", actualizarRuta);
router.patch("/:id/estado", cambiarEstadoRuta);
router.delete("/:id", eliminarRuta); // nueva ruta
module.exports = router;

