const express = require("express");
const router = express.Router();
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
} = require("../controllers/hojaRepartoController");

// Crear hoja preliminar
router.post("/preliminar", crearHojaPreliminar);

// Confirmar hoja de reparto
router.post("/confirmar", confirmarHoja);

router.post('/forzar-cierre', cerrarHojaManualmente);

// Consultar todas las hojas (con filtros)
router.get("/", consultarHojas);

router.get("/paginado", consultarHojasPaginado);


router.get("/exportar/:hojaId", exportarHojaPDF);

// Obtener hoja por ID
router.get("/:id", obtenerHojaPorId);

router.get('/mi-hoja/:choferId', obtenerHojaRepartoDeHoy);

router.get('/por-chofer/:id', obtenerHojasPorChofer);





module.exports = router;
