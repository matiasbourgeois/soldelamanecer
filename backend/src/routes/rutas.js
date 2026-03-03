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
router.post("/", verificarToken, crearRuta);
router.patch("/tarifas-masivas", verificarToken, actualizarTarifasMasivas);
router.patch("/:id", verificarToken, actualizarRuta);
router.patch("/:id/estado", verificarToken, cambiarEstadoRuta);
router.delete("/:id", verificarToken, eliminarRuta);
router.post("/sincronizar-mes", verificarToken, sincronizarTarifasMesVencido);

module.exports = router;

