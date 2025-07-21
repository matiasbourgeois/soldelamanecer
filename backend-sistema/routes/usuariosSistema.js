const express = require("express");
const router = express.Router();
const Usuario = require("../models/UsuarioSistema");

router.get("/clientes", async (req, res) => {
  try {
    const clientes = await Usuario.find({ rol: "cliente" }).select("nombre email dni");
    res.json(clientes);
  } catch (error) {
    console.error("❌ Error al obtener clientes:", error);
    res.status(500).json({ error: "Error al obtener clientes" });
  }
});

router.get("/buscar-clientes", async (req, res) => {
  try {
    const busqueda = req.query.busqueda || "";
    const pagina = parseInt(req.query.pagina) || 0;
    const limite = parseInt(req.query.limite) || 10;

    const filtro = {
      rol: "cliente",
      $or: [
        { nombre: { $regex: busqueda, $options: "i" } },
        { email: { $regex: busqueda, $options: "i" } },
        { dni: { $regex: busqueda, $options: "i" } }
      ]
    };

    const total = await Usuario.countDocuments(filtro);
    const resultados = await Usuario.find(filtro)
      .sort({ nombre: 1 })
      .skip(pagina * limite)
      .limit(limite)
      .select("nombre email dni direccion telefono localidad provincia");

    res.json({ total, resultados });
  } catch (error) {
    console.error("❌ Error en búsqueda de remitentes:", error);
    res.status(500).json({ error: "Error al buscar remitentes" });
  }
});



module.exports = router;
