const express = require("express");
const router = express.Router();
const verificarToken = require("../middlewares/authMiddleware");
const verificarGestion = require("../middlewares/verificarGestion");
const {
  crearHojaPreliminar,
  confirmarHoja,
  consultarHojas,
  consultarHojasPaginado,
  exportarHojaPDF,
  obtenerHojaPorId,
  obtenerHojaRepartoDeHoy,
  obtenerHojasPorChofer,
  cerrarHojaManualmente,
  generarHojasAutomaticas,
  actualizarHoja,
  buscarHojaPorRutaFecha,  // 🆕 FASE 5
  reporteDiscrepancias,  // 🆕 FASE 7
  crearHojaEspecial,
  reporteEspeciales
} = require("../controllers/logistica/hojaRepartoController");

// 🆕 FASE 5: Buscar hoja existente por ruta y fecha (para asignación de envíos)
router.get("/buscar-por-ruta-fecha", verificarToken, buscarHojaPorRutaFecha);

// 🆕 FASE 7: Reporte mensual de discrepancias (chofer/vehículo plan vs real)
router.get("/reporte-discrepancias", verificarToken, reporteDiscrepancias);

// 🆕 FASE 8: Hoja Especial y Reportes
router.post("/especial", verificarToken, crearHojaEspecial);
router.get("/reporte-especiales", verificarToken, reporteEspeciales);

// Crear hoja preliminar
router.post("/preliminar", crearHojaPreliminar);

// Confirmar hoja de reparto
router.post("/confirmar", confirmarHoja);

router.post('/forzar-cierre', verificarToken, cerrarHojaManualmente);

// Consultar todas las hojas (con filtros)
router.get("/", consultarHojas);

router.get("/paginado", consultarHojasPaginado);


router.get("/exportar/:hojaId", exportarHojaPDF);

// Obtener hoja por ID
router.get("/:id", obtenerHojaPorId);

// Actualizar hoja (Quick Edit) - PROTEGIDO CON VERIFICACIÓN DE ROL
router.put("/:id", verificarToken, verificarGestion, actualizarHoja);

router.get('/mi-hoja/:choferId', obtenerHojaRepartoDeHoy);

router.get('/por-chofer/:id', obtenerHojasPorChofer);





module.exports = router;
