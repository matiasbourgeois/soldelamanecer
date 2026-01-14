const express = require("express");
const router = express.Router();
const controller = require("../controllers/logistica/tipoMantenimientoController");
const verificarToken = require("../middlewares/verificarToken");

router.get("/", verificarToken, controller.obtenerTodos);
router.post("/", verificarToken, controller.crear);
router.put("/:id", verificarToken, controller.actualizar);
router.delete("/:id", verificarToken, controller.eliminar);

module.exports = router;
