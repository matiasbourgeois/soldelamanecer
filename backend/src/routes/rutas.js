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
  reporteExcelRutas,
  reporteExcelConsolidado,
  sincronizarTarifasMesVencido
} = require("../controllers/logistica/rutaController");

router.get("/excel", verificarToken, reporteExcelRutas);
router.get("/excel-consolidado", verificarToken, reporteExcelConsolidado);
router.get("/", obtenerRutas);
router.get("/todas", obtenerTodasLasRutas);
router.post("/", crearRuta);
router.patch("/tarifas-masivas", verificarToken, actualizarTarifasMasivas);
router.patch("/:id", actualizarRuta);
router.patch("/:id/estado", cambiarEstadoRuta);
router.delete("/:id", eliminarRuta); // nueva ruta
router.post("/sincronizar-mes", verificarToken, sincronizarTarifasMesVencido);

module.exports = router;

