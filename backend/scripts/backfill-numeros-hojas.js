const mongoose = require('mongoose');
require('dotenv').config();
const HojaReparto = require('../src/models/HojaReparto');
const Ruta = require('../src/models/Ruta');

const backfillNumeros = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Conectado a BD.");

        const hojasHuerfanas = await HojaReparto.find({
            $or: [
                { numeroHoja: null },
                { numeroHoja: { $exists: false } },
                { numeroHoja: "" },
                { numeroHoja: /undefined/i }
            ]
        }).populate('ruta');

        console.log(`🔎 Encontradas ${hojasHuerfanas.length} hojas sin número válido.`);

        let modificadas = 0;
        let errores = 0;

        for (const hoja of hojasHuerfanas) {
            try {
                // Instanciar nueva fecha moment
                const moment = require('moment-timezone');
                const fechaObj = moment(hoja.fecha).tz('America/Argentina/Buenos_Aires');

                const anio = fechaObj.format('YYYY');
                const mes = fechaObj.format('MM');
                const dia = fechaObj.format('DD');

                const prefixRuta = (hoja.ruta && hoja.ruta.codigo) ? hoja.ruta.codigo : "SDA";
                const prefijoBase = `HR-${prefixRuta}-${anio}-${mes}-${dia}`;

                // Validar duplicados en las YA insertadas con este backfill
                let nuevoNumero = prefijoBase;
                let duplicados = await HojaReparto.countDocuments({
                    _id: { $ne: hoja._id },
                    numeroHoja: nuevoNumero
                });

                if (duplicados > 0) {
                    nuevoNumero = `${prefijoBase}-${duplicados + 1}`;
                }

                // Guardar db
                hoja.numeroHoja = nuevoNumero;
                await hoja.save();

                modificadas++;
                process.stdout.write(`✅ Reparada: ${hoja._id} -> ${nuevoNumero}\n`);

            } catch (innerErr) {
                console.error(`\n❌ Error en hoja ${hoja._id}:`, innerErr.message);
                errores++;
            }
        }

        console.log(`\n🎉 Script Finalizado. Total reparadas: ${modificadas} | Errores: ${errores}`);
        process.exit(0);

    } catch (err) {
        console.error("Error Global:", err);
        process.exit(1);
    }
};

backfillNumeros();
