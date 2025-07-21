const express = require("express");
const Cotizacion = require("../models/Cotizacion.js");

const router = express.Router(); 

// Definimos tarifas para Córdoba Ciudad y por km en Córdoba Interior
const tarifas = {
    Chico: { ciudad: 29800, km: 319.69 },
    Mediano: { ciudad: 37200, km: 562.82 },
    Grande: { ciudad: 46300, km: 587.14 },
    Camión: { ciudad: 56600, km: 688 }
};

// Crear una nueva cotización con cálculo automático del precio
router.post("/", async (req, res) => {
    try {
        console.log("📌 Datos recibidos en el backend:", req.body);

        const { tipoVehiculo, zona, kilometros } = req.body;

        if (!tipoVehiculo || !zona) {
            console.warn("⚠️ Error: Faltan campos obligatorios.");
            return res.status(400).json({ error: "Todos los campos son obligatorios" });
        }

        let precio = 0;

        // 🔹 Convertir a UTF-8 y normalizar la zona
        const zonaUTF8 = zona.normalize("NFC").trim().toLowerCase();
        console.log("📌 Tipo Vehículo:", tipoVehiculo);
        console.log("📌 Zona recibida después de normalización:", zonaUTF8);
        console.log("📌 Kilómetros:", kilometros);

        console.log("📌 Zona recibida en bytes:", Buffer.from(zonaUTF8));


        // 🔹 Si la zona es "Córdoba Ciudad", no se necesita kilometraje
        if (zonaUTF8 === "córdoba ciudad") {
            precio = tarifas[tipoVehiculo].ciudad;
        } 
        // 🔹 Si la zona es "Córdoba Interior", el kilometraje sí es necesario
        else if (zonaUTF8 === "córdoba interior") {
            const km = Number(kilometros);
            if (isNaN(km) || km <= 0) {
                console.warn("⚠️ Error: Kilómetros inválidos.");
                return res.status(400).json({ error: "Los kilómetros deben ser un número válido mayor a 0" });
            }
            precio = Math.round((tarifas[tipoVehiculo].km * km) * 100) / 100; 
        } 
        else {
            console.warn("⚠️ Error: Zona inválida.");
            return res.status(400).json({ error: "Zona inválida" });
        }

        const nuevaCotizacion = new Cotizacion({ 
            tipoVehiculo, 
            zona: zonaUTF8, 
            kilometros: zonaUTF8 === "córdoba ciudad" ? 0 : kilometros, // 🔹 Guardar 0 si no hay kilómetros
            precio, 
            fechaHora: new Date() 
        });

        console.log("⏳ Guardando cotización en MongoDB...");
        await nuevaCotizacion.save();
        console.log("✅ Cotización guardada correctamente:", nuevaCotizacion);

        res.status(201).json(nuevaCotizacion);
    } catch (error) {
        console.error("🚨 Error al crear la cotización:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

module.exports = router;

router.get("/", (req, res) => {
    res.json({ mensaje: "Ruta de cotizaciones funcionando correctamente" });
});
