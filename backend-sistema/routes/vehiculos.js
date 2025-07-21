const express = require("express");
const router = express.Router();
const {
  obtenerVehiculosPaginado,
  crearVehiculo,
  obtenerVehiculos,
  actualizarVehiculo,
  cambiarEstadoActivo,
} = require("../controllers/vehiculoController");

router.get("/paginado", obtenerVehiculosPaginado);

// Listar todos los vehículos
router.get("/", obtenerVehiculos);

// Crear vehículo
router.post("/", crearVehiculo);

// Modificar vehículo
router.patch("/:id", actualizarVehiculo);

// Activar/desactivar vehículo
router.patch("/:id/estado", cambiarEstadoActivo);

module.exports = router;
