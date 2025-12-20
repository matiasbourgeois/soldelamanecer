const {
  crearEnvio,
  obtenerEnvios,
  obtenerEnvioPorId,
  actualizarEnvio,
  eliminarEnvio,
  obtenerMisEnvios,
  marcarEnvioEntregado,
  marcarEnvioDevuelto,
  marcarIntentoFallido 
} = require("../controllers/logistica/envioController");

const verificarToken = require("../middlewares/verificarToken");

const express = require("express");
const router = express.Router();

router.get("/mis-envios", verificarToken, obtenerMisEnvios);
// 🔸 GET: Todos los envíos
router.get("/", obtenerEnvios);

// 🔸 GET: Envío por ID
router.get("/:id", obtenerEnvioPorId);

// 🔸 POST: Crear nuevo envío
router.post("/", crearEnvio);

router.put("/marcar-entregado/:id", verificarToken, marcarEnvioEntregado);

router.put("/marcar-devuelto/:id", verificarToken, marcarEnvioDevuelto);

router.patch("/fallo-entrega/:id", verificarToken, marcarIntentoFallido);

// 🔸 PATCH: Actualizar envío
router.patch("/:id", actualizarEnvio);

// 🔸 DELETE: Eliminar envío
router.delete("/:id", verificarToken, eliminarEnvio);





module.exports = router;
