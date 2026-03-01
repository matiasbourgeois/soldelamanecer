const mongoose = require('mongoose');
require('dotenv').config();
const HojaReparto = require('../src/models/HojaReparto');
const Ruta = require('../src/models/Ruta');

const updateAllNumeros = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Conectado a BD.");

        const hojas = await HojaReparto.find({}).populate('ruta').sort({ fecha: 1 });
        console.log(`🔎 Encontradas ${hojas.length} hojas para formatear.`);

        let modificadas = 0;
        let errores = 0;

        // Necesitamos saber qué secuencia toca por día y por ruta
        // Usamos un mapa: "CEJE-20260226" -> 1 (siguiente disponible)
        const sequenceMap = new Map();

        for (const hoja of hojas) {
            try {
                const moment = require('moment-timezone');
                const fechaObj = moment(hoja.fecha).tz('America/Argentina/Buenos_Aires');

                const anio = fechaObj.format('YYYY');
                const mes = fechaObj.format('MM');
                const dia = fechaObj.format('DD');
                const fechaKey = `${anio}${mes}${dia}`;

                let prefixRuta = (hoja.ruta && hoja.ruta.codigo) ? hoja.ruta.codigo : "SDA";

                if (prefixRuta.toUpperCase().startsWith('L-') || prefixRuta.toUpperCase().startsWith('R-') || prefixRuta.toUpperCase().startsWith('M-')) {
                    prefixRuta = prefixRuta.substring(2);
                }

                // Nuevo formato: CEJE-1-20260226
                const nuevoNumero = `${prefixRuta}-${fechaKey}`;

                if (hoja.numeroHoja !== nuevoNumero) {
                    hoja.numeroHoja = nuevoNumero;
                    await hoja.save({ validateBeforeSave: false }); // skip validators just in case
                    modificadas++;
                }

            } catch (innerErr) {
                console.error(`\n❌ Error en hoja ${hoja._id}:`, innerErr.message);
                errores++;
            }
        }

        console.log(`\n🎉 Script Finalizado. Total modificadas: ${modificadas} | Errores: ${errores}`);
        process.exit(0);

    } catch (err) {
        console.error("Error Global:", err);
        process.exit(1);
    }
};

updateAllNumeros();
