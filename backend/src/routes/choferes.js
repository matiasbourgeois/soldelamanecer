const express = require("express");
const router = express.Router();

const auth = require("../middlewares/verificarToken");
const uploadVehiculo = require("../middlewares/uploadVehiculo");


const {
  crearChofer,
  obtenerChoferes,
  obtenerChofer,
  editarChofer,
  obtenerChoferesMinimos,
  eliminarChofer,
  obtenerMiConfiguracion,
  obtenerSelectoresReporte,
  actualizarAsignacion,
  obtenerHojaPorFecha,
  // Contratados
  obtenerContratados,
  editarContratado,
  subirDocumentoContratado,
  reporteExcelChoferes
} = require("../controllers/logistica/choferController");

// Ruta base: /api/choferes

// Reporte de Choferes a Excel (Protegida)
router.get("/excel", auth, reporteExcelChoferes);

// Crear chofer
router.post("/", crearChofer);

// Ruta para que el chofer obtenga sus defaults (app móvil)
router.get("/configuracion", auth, obtenerMiConfiguracion);
router.get("/selectores-reporte", auth, obtenerSelectoresReporte);
router.get("/hoja-por-fecha", auth, obtenerHojaPorFecha);

// Actualizar asignación de ruta/vehículo desde app móvil
router.post("/actualizar-asignacion", auth, actualizarAsignacion);

// ─── RUTAS DE CONTRATADOS ─────────────────────────────────────────────────────
// GET  /api/choferes/contratados              → lista filtrada de contratados
// PATCH /api/choferes/:id/contratado          → editar legajo del contratado
// POST  /api/choferes/:id/documentos-contratado → subir documento al legajo
router.get("/contratados", obtenerContratados);
router.patch("/:id/contratado", editarContratado);
router.post("/:id/documentos-contratado", uploadVehiculo.single("archivo"), subirDocumentoContratado);
// ─────────────────────────────────────────────────────────────────────────────

// Obtener todos los choferes (empleados + contratados)
router.get("/", obtenerChoferes);
router.get("/solo-nombres", obtenerChoferesMinimos);

// CRUD individual
router.get("/:id", obtenerChofer);
router.put("/:id", editarChofer);
router.delete("/:id", eliminarChofer);

module.exports = router;
