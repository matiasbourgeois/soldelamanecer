const express = require("express");
const router = express.Router();
const {
    obtenerProveedores,
    crearProveedor,
    actualizarProveedor,
    eliminarProveedor,
    subirDocumentoProveedor
} = require("../controllers/logistica/proveedorController");
const verificarToken = require("../middlewares/verificarToken");
const uploadVehiculo = require("../middlewares/uploadVehiculo");

router.get("/", [verificarToken], obtenerProveedores);
router.post("/", [verificarToken], crearProveedor);
router.patch("/:id", [verificarToken], actualizarProveedor);
router.delete("/:id", [verificarToken], eliminarProveedor);

// Endpoint para documentos específicos
router.post("/:id/documentos", [verificarToken, uploadVehiculo.single("archivo")], subirDocumentoProveedor);

module.exports = router;
