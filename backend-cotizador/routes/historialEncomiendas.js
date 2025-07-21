const express = require("express");
const Encomienda = require("../models/Encomienda.js");
const authMiddleware = require("../middleware/authMiddleware.js");

const router = express.Router();

// 🔐 Solo usuarios autenticados pueden acceder al historial
router.get("/", authMiddleware, async (req, res) => {
    try {
        console.log("📌 Solicitando historial de encomiendas...");

        const cotizacionesEncomiendas = await Encomienda.find()
            .sort({ fechaHora: -1 })
            .select("destino bultos totalCotizacion fechaHora");

        if (!cotizacionesEncomiendas || cotizacionesEncomiendas.length === 0) {
            console.warn("⚠️ No hay cotizaciones de encomiendas registradas.");
            return res.status(404).json({ error: "No hay cotizaciones registradas" });
        }

        const encomiendasFormateadas = cotizacionesEncomiendas.map((encomienda) => ({
            id: encomienda._id,
            destino: encomienda.destino || "No disponible",
            total: typeof encomienda.totalCotizacion === "number" ? `$${encomienda.totalCotizacion.toFixed(2)}` : "No disponible",
            fecha: encomienda.fechaHora ? new Date(encomienda.fechaHora).toLocaleDateString("es-ES") : "Fecha no disponible",
            hora: encomienda.fechaHora ? new Date(encomienda.fechaHora).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false }) : "Hora no disponible",
            bultos: encomienda.bultos || []
        }));

        console.log(`✅ Historial de encomiendas obtenido: ${encomiendasFormateadas.length} registros.`);
        res.json(encomiendasFormateadas);
    } catch (error) {
        console.error("🚨 Error al obtener el historial de encomiendas:", error);
        res.status(500).json({ error: "Error al obtener historial de encomiendas" });
    }
});

module.exports = router;
