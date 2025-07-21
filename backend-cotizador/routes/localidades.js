const express = require("express");
const Localidad = require("../models/Localidad");

const router = express.Router();

// Obtener todas las localidades
router.get("/", async (req, res) => {
    try {
        const localidades = await Localidad.find();
        console.log("📌 Localidades encontradas en la base de datos:", localidades);
        res.json(localidades);

    } catch (error) {
        console.error("🚨 Error al obtener localidades:", error);
        res.status(500).json({ error: "Error al obtener localidades" });
    }
});

module.exports = router;
