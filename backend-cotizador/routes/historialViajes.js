const express = require("express");
const Cotizacion = require("../models/Cotizacion.js");
const authMiddleware = require("../middleware/authMiddleware.js");

const router = express.Router();

// 🔐 Solo usuarios autenticados pueden acceder al historial
router.get("/", authMiddleware, async (req, res) => {
    try {
        console.log("📌 Solicitando historial de viajes...");

        const cotizacionesViajes = await Cotizacion.find()
            .sort({ fechaHora: -1 })
            .select("tipoVehiculo zona kilometros precio fechaHora");

        if (!cotizacionesViajes || cotizacionesViajes.length === 0) {
            console.warn("⚠️ No hay cotizaciones de viajes registradas.");
            return res.status(404).json({ error: "No hay cotizaciones registradas" });
        }

        const viajesFormateados = cotizacionesViajes.map((viaje) => ({
            id: viaje._id,
            tipoVehiculo: viaje.tipoVehiculo || "No disponible",
            zona: viaje.zona || "No disponible",
            kilometros: viaje.kilometros > 0 ? viaje.kilometros : "-",
            precio: typeof viaje.precio === "number" ? viaje.precio.toFixed(2) : "No disponible",
            fechaHora: viaje.fechaHora ? new Date(viaje.fechaHora).toISOString() : null
        }));

        console.log(`✅ Historial de viajes obtenido: ${viajesFormateados.length} registros.`);
        res.json(viajesFormateados);
    } catch (error) {
        console.error("🚨 Error al obtener el historial de viajes:", error);
        res.status(500).json({ error: "Error al obtener historial de viajes" });
    }
});

module.exports = router;
