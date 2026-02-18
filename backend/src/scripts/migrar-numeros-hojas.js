
require('dotenv').config();
const mongoose = require('mongoose');
const HojaReparto = require('../models/HojaReparto'); // Ajustar ruta según ubicación del script

// Conexión a DB
const conectarDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado a MongoDB');
    } catch (error) {
        console.error('❌ Error de conexión:', error);
        process.exit(1);
    }
};

const migrarNumeros = async () => {
    await conectarDB();

    try {
        console.log("🚀 Iniciando migración de números de Hoja de Reparto...");

        // 1. Obtener todas las hojas ordenadas por fecha de creación (ascendente)
        const hojas = await HojaReparto.find().sort({ createdAt: 1 });

        console.log(`📊 Total de hojas encontradas: ${hojas.length}`);

        const contadoresPorDia = {}; // Mapa para llevar la cuenta diaria: { "2026-02-17": 5 }
        let actualizadas = 0;

        for (const hoja of hojas) {
            const fecha = new Date(hoja.fecha); // Usar fecha de la hoja, no createdAt, para ser consistentes con la lógica de negocio
            const anio = fecha.getFullYear();
            const mes = String(fecha.getMonth() + 1).padStart(2, '0');
            const dia = String(fecha.getDate()).padStart(2, '0');

            // Obtener código de ruta
            let codigoRuta = 'X';
            if (hoja.ruta) {
                // Si es un objeto populado, usarlo. Si es ID, buscarlo.
                const Ruta = require('../models/Ruta');
                // Intentar obtener del objeto si ya vino populado (aunque en el find() linea 24 no populamos)
                // O buscar en DB
                const rutaDoc = await Ruta.findById(hoja.ruta);
                if (rutaDoc) codigoRuta = rutaDoc.codigo;
            }

            // Limpiar código de ruta (Quitar prefijo L-)
            const codigoLimpio = codigoRuta.replace(/^L-/, '');

            // Formato solicitado: [CODIGO_RUTA_LIMPIO]-YYYYMMDD
            const nuevoNumero = `${codigoLimpio}-${anio}${mes}${dia}`;

            // Solo actualizar si es diferente (para poder re-correr el script si falla)
            if (hoja.numeroHoja !== nuevoNumero) {
                console.log(`📝 Actualizando: ${hoja.numeroHoja || 'SIN_NUMERO'} -> ${nuevoNumero}`);

                hoja.numeroHoja = nuevoNumero;

                // Agregar registro al historial si no existe
                hoja.historialMovimientos.push({
                    usuario: null, // Sistema
                    accion: `Migración de formato: ${nuevoNumero}`,
                    fechaHora: new Date()
                });

                await hoja.save();
                actualizadas++;
            }
        }

        console.log("---------------------------------------------------");
        console.log(`✅ Migración completada.`);
        console.log(`📦 Hojas procesadas: ${hojas.length}`);
        console.log(`📝 Hojas actualizadas: ${actualizadas}`);
        console.log("---------------------------------------------------");

    } catch (error) {
        console.error("❌ Error durante la migración:", error);
    } finally {
        mongoose.disconnect();
        process.exit();
    }
};

migrarNumeros();
