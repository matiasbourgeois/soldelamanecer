const express = require("express");
const {
  obtenerLocalidades,
  obtenerLocalidadesPaginadas,
  crearLocalidad,
  actualizarLocalidad,
  cambiarEstadoLocalidad,
  eliminarLocalidad
} = require("../controllers/localidadController");

const router = express.Router();

// Obtener todas las localidades
router.get("/", obtenerLocalidades);

// Nueva ruta con paginación y búsqueda
router.get("/paginadas", obtenerLocalidadesPaginadas);

// Crear una nueva localidad
router.post("/", crearLocalidad);

// Actualizar una localidad existente
router.put("/:id", actualizarLocalidad);

// Eliminar una localidad (✅ esta ruta debe ir antes del PATCH)
router.delete("/:id", eliminarLocalidad);

// Cambiar estado (activa/inactiva)
router.patch("/estado/:id", cambiarEstadoLocalidad);

module.exports = router;
