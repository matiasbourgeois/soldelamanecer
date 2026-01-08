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
  registrarReporteChofer
} = require("../controllers/logistica/vehiculoController");
const verificarToken = require("../middlewares/verificarToken");

router.get("/paginado", obtenerVehiculosPaginado);

// Listar todos los vehículos
router.get("/", obtenerVehiculos);

// Crear vehículo
router.post("/", crearVehiculo);

// Modificar vehículo
router.patch("/:id", actualizarVehiculo);

// Eliminar vehículo
router.delete("/:id", eliminarVehiculo);

// Activar/desactivar vehículo
// Activar/desactivar vehículo
router.patch("/:id/estado", cambiarEstadoActivo);

// --- RUTAS DE MANTENIMIENTO ---

// Actualizar Kilometraje (Chofer/Admin)
router.patch("/:id/km", actualizarKilometraje); // Podríamos agregar verificarToken aquí

// Registrar Service (Admin)
router.post("/:id/mantenimiento/registro", [verificarToken], registrarMantenimiento);

// Configuración (Agregar/Editar) - Admin
router.post("/:id/mantenimiento/config", [verificarToken], agregarTipoMantenimiento);
router.put("/:id/mantenimiento/config", [verificarToken], editarTipoMantenimiento);

// Obtener Historial Completo
router.get("/:id/mantenimiento/historial", obtenerLogMantenimiento);

// Registrar Reporte Chofer (App Móvil)
router.post("/:id/reporte-chofer", [verificarToken], registrarReporteChofer);

module.exports = router;
