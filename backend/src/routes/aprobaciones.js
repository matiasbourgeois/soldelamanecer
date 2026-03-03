const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware"); // Middleware para extraer JWT

const aprobacionesController = require("../controllers/aprobacionesController");

// Proteger todas las rutas con autenticación
router.use(auth);

// Rutas de Aprobaciones
router.get("/pendientes", aprobacionesController.obtenerAprobacionesPendientes);
router.get("/estado/:entidad/:id", aprobacionesController.consultarEstadoEntidad);
router.post("/:id/resolver", aprobacionesController.resolverAprobacion);

module.exports = router;
