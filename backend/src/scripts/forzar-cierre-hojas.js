
require('dotenv').config();
const mongoose = require('mongoose');
const HojaReparto = require('../models/HojaReparto');
const Envio = require('../models/Envio');

const conectarDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado a MongoDB');
    } catch (error) {
        console.error('❌ Error de conexión:', error);
        process.exit(1);
    }
};

const forzarCierreHojasVencidas = async () => {
    await conectarDB();

    try {
        console.log("🚀 Iniciando cierre forzado de hojas vencidas...");

        // Definir "ayer" o cualquier fecha anterior a HOY (00:00)
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        console.log(`📅 Buscando hojas 'en reparto' con fecha anterior a: ${hoy.toISOString()}`);

        const hojas = await HojaReparto.find({
            estado: "en reparto",
            fecha: { $lt: hoy }
        }).populate("envios");

        console.log(`📊 Total de hojas vencidas encontradas: ${hojas.length}`);

        for (const hoja of hojas) {
            console.log(`\n📄 Procesando Hoja: ${hoja.numeroHoja} (${hoja._id}) - Fecha: ${hoja.fecha.toISOString()}`);
            let enviosActualizados = 0;

            for (const envio of hoja.envios) {
                if (envio.estado === "en reparto") {
                    console.log(`   📦 Envío ${envio._id} (${envio.destinatario?.nombre || '?'}) sigue 'en reparto' -> REAGENDANDO`);

                    envio.estado = "reagendado";
                    // IMPORTANTE: Liberar el envío de la hoja actual para que pueda ser re-asignado
                    envio.hojaReparto = null;
                    envio.historialEstados.push({
                        estado: "reagendado",
                        sucursal: "Casa Central – Córdoba",
                        fecha: new Date(),
                        observacion: "Cierre automático de hoja vencida"
                    });

                    // IMPORTANTE: Desvincular de la hoja para que aparezca disponible de nuevo?
                    // Según la lógica actual, si está 'reagendado' aparece en el listado de pendientes/reagendados.
                    // Pero envio.hojaReparto sigue apuntando a la hoja vieja.
                    // Si el filtro de "disponibles" excluye los que tienen hojaReparto, hay que limpiarlo.
                    // Revisando `_buscarHojaPorRutaFecha.js` (no lo tengo abierto ahora, pero asumo lógica estándar).
                    // Generalmente, 'reagendado' implica que vuelve a base.
                    // Voy a limpiar `hojaReparto` para asegurar que se vea disponible.
                    envio.hojaReparto = null;

                    await envio.save();
                    enviosActualizados++;
                } else {
                    console.log(`   ✅ Envío ${envio._id} ya tiene estado final: ${envio.estado}`);
                }
            }

            hoja.estado = "cerrada";
            hoja.cerradaAutomaticamente = true;
            hoja.historialMovimientos.push({
                usuario: null,
                accion: "cierre forzado por script manual",
                fechaHora: new Date()
            });
            await hoja.save();
            console.log(`✅ Hoja cerrada. Envíos reagendados: ${enviosActualizados}`);
        }

        console.log("\n---------------------------------------------------");
        console.log(`✅ Proceso completado.`);
        console.log("---------------------------------------------------");

    } catch (error) {
        console.error("❌ Error durante el proceso:", error);
    } finally {
        mongoose.disconnect();
        process.exit();
    }
};

forzarCierreHojasVencidas();
