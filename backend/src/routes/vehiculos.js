const express = require("express");
const router = express.Router();
const {
  obtenerVehiculosPaginado,
  crearVehiculo,
  obtenerVehiculos,
  actualizarVehiculo,
  cambiarEstadoActivo,
  eliminarVehiculo
} = require("../controllers/logistica/vehiculoController");

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
router.patch("/:id/estado", cambiarEstadoActivo);

module.exports = router;
