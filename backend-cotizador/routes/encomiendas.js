const express = require("express");
const Encomienda = require("../models/Encomienda");

const router = express.Router();

// Definir precios base y costos extra
const tarifas = {
    "TIPO 0": { base: 5199, extra: 3399 },
    "TIPO 1": { base: 6799, extra: 3799 },
    "TIPO 2": { base: 8899, extra: 6099 },
    "TIPO 3": { base: 77800, extra: 53500 }
};

// Función para determinar el tipo de encomienda según peso y dimensiones
const determinarTipoEncomienda = (peso, largo, ancho, profundidad) => {
    if (peso > 300) return "ERROR";
    if (peso <= 5 && largo <= 20 && ancho <= 20 && profundidad <= 20) return "TIPO 0";
    if (peso <= 10 && largo <= 40 && ancho <= 40 && profundidad <= 40) return "TIPO 1";
    if (peso <= 30 && largo <= 60 && ancho <= 60 && profundidad <= 60) return "TIPO 2";
    if (peso <= 300 && largo <= 100 && ancho <= 100 && profundidad <= 100) return "TIPO 3";
    return "ERROR";
};

// Obtener todas las encomiendas
router.get("/", async (req, res) => {
    try {
        const encomiendas = await Encomienda.find().sort({ fechaHora: -1 });
        res.json(encomiendas);
    } catch (error) {
        console.error("🚨 Error al obtener encomiendas:", error);
        res.status(500).json({ error: "Error al obtener encomiendas" });
    }
});

// Crear una nueva cotización con múltiples bultos
router.post("/", async (req, res) => {
    try {
        console.log("📌 Datos recibidos en el backend:", JSON.stringify(req.body, null, 2));

        const { destino, bultos } = req.body;

        // Validaciones
        if (!destino || !bultos || !Array.isArray(bultos) || bultos.length === 0) {
            return res.status(400).json({ error: "Debe haber un destino y al menos un bulto en la cotización" });
        }

        // Procesar cada bulto y calcular sus costos
        let subtotal = 0;
        const cotizacionBultos = bultos.map((bulto, index) => {
            const pesoNum = Number(bulto.peso);
            const largo = Number(bulto.dimensiones.largo);
            const ancho = Number(bulto.dimensiones.ancho);
            const profundidad = Number(bulto.dimensiones.profundidad);

            if (pesoNum > 300) {
                throw new Error(`El bulto ${index + 1} supera el límite de 300kg.`);
            }

            const tipoPaquete = determinarTipoEncomienda(pesoNum, largo, ancho, profundidad);
            if (tipoPaquete === "ERROR") {
                throw new Error(`El bulto ${index + 1} con dimensiones ${largo}x${ancho}x${profundidad} cm y peso ${pesoNum}kg no cumple con las categorías establecidas.`);
            }

            const precioBase = tarifas[tipoPaquete].base;
            const precioExtra = tarifas[tipoPaquete].extra;
            const precioTotal = precioBase + precioExtra;
            const iva = precioTotal * 0.21;
            const total = precioTotal + iva;

            subtotal += precioTotal;

            return {
                peso: pesoNum,
                dimensiones: bulto.dimensiones,
                tipoPaquete,
                precioBase,
                precioExtra,
                iva: Number(iva.toFixed(2)),  // 🔹 Ahora cada bulto tiene IVA calculado
                total: Number(total.toFixed(2))  // 🔹 Ahora cada bulto tiene su total calculado
            };
        });

        // Calcular el total de toda la cotización
        let ivaTotal = subtotal * 0.21;
        let totalCotizacion = subtotal + ivaTotal;

        // Crear y guardar la cotización
        const nuevaCotizacion = new Encomienda({
            destino,
            bultos: cotizacionBultos,  // 🔹 Ahora cada bulto tiene IVA y total
            totalCotizacion: Number(totalCotizacion.toFixed(2)),
            fechaHora: new Date()
        });

        await nuevaCotizacion.save();
        console.log("✅ Cotización de encomienda guardada en MongoDB:", JSON.stringify(nuevaCotizacion, null, 2));

        res.status(201).json(nuevaCotizacion);
    } catch (error) {
        console.error("🚨 Error al crear la encomienda:", error);
        res.status(500).json({ error: error.message || "Error interno del servidor" });
    }
});

module.exports = router;
