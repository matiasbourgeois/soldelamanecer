const express = require("express");
const router = express.Router();
const {
  obtenerVehiculosPaginado,
  crearVehiculo,
  obtenerVehiculos,
  actualizarVehiculo,
  cambiarEstadoActivo,
  eliminarVehiculo,
  actualizarKilometraje,
  registrarMantenimiento,
  agregarTipoMantenimiento,
  editarTipoMantenimiento,
  obtenerLogMantenimiento,
  registrarReporteChofer,
  obtenerEstadisticasVehiculo,
  eliminarTipoMantenimiento,
  subirDocumentosVehiculo,
  eliminarDocumentoVehiculo
} = require("../controllers/logistica/vehiculoController");
const verificarToken = require("../middlewares/verificarToken");
const uploadVehiculo = require("../middlewares/uploadVehiculo");

router.get("/paginado", obtenerVehiculosPaginado);
router.get("/", obtenerVehiculos);
router.post("/", crearVehiculo);
router.patch("/:id", actualizarVehiculo);
router.delete("/:id", eliminarVehiculo);
router.patch("/:id/estado", cambiarEstadoActivo);

// --- DOCUMENTACIÓN ---
router.post("/:id/documentos", uploadVehiculo.single("archivo"), subirDocumentosVehiculo);
router.delete("/:id/documentos/:docId", eliminarDocumentoVehiculo);

// --- RUTAS DE MANTENIMIENTO ---

// Actualizar Kilometraje (Chofer/Admin)
router.patch("/:id/km", actualizarKilometraje); // Podríamos agregar verificarToken aquí

// Registrar Service (Admin)
router.post("/:id/mantenimiento/registro", [verificarToken], registrarMantenimiento);

// Configuración (Agregar/Editar/Eliminar) - Admin
router.post("/:id/mantenimiento/config", [verificarToken], agregarTipoMantenimiento);
router.put("/:id/mantenimiento/config", [verificarToken], editarTipoMantenimiento);
router.delete("/:id/mantenimiento/config/:nombre", [verificarToken], eliminarTipoMantenimiento);

// Obtener Historial Completo
router.get("/:id/mantenimiento/historial", obtenerLogMantenimiento);

// Obtener Estadísticas (Diario/Mensual)
router.get("/:id/estadisticas", obtenerEstadisticasVehiculo);

// Registrar Reporte Chofer (App Móvil)
router.post("/:id/reporte-chofer", [verificarToken], registrarReporteChofer);

module.exports = router;
