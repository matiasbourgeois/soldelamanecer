const router = require("express").Router();

// Auth & Users
router.use("/usuarios", require("./auth.routes"));
router.use("/clientes", require("./clientes.routes")); // renamed from duplicate usuarios

// Logistics System
router.use("/rutas", require("./rutas"));
router.use("/choferes", require("./choferes"));
router.use("/vehiculos", require("./vehiculos"));
router.use("/localidades", require("./localidades"));
router.use("/envios", require("./envios"));
router.use("/remitos", require("./remitos"));
router.use("/destinatarios", require("./destinatarios"));
router.use("/hojas-reparto", require("./hojaRepartoRoutes"));
router.use("/seguimiento", require("./seguimiento"));

// Rutas de Reportes
router.use("/reportes", require("./reportes.routes"));

module.exports = router;
