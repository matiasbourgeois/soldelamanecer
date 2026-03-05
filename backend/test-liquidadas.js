const mongoose = require('mongoose');
const LiquidacionContratado = require('./src/models/LiquidacionContratado');
const HojaReparto = require('./src/models/HojaReparto');

const run = async () => {
    await mongoose.connect("mongodb://127.0.0.1:27017/soldelamanecer");

    // Find the sheet of Aldeco for the 5th
    const hoja5 = await HojaReparto.findOne({ numeroHoja: 'VMAR-2-20260305' });

    if (!hoja5) {
        console.log("No se encontró la hoja VMAR-2-20260305");
        process.exit(0);
    }

    console.log(`Buscando liquidaciones asociadas a la hoja ID: ${hoja5._id}`);

    const liqs = await LiquidacionContratado.find({
        hojasReparto: hoja5._id
    });

    console.log(`Encontradas ${liqs.length} liquidaciones que contienen esta hoja.`);
    liqs.forEach(l => console.log(`- ID: ${l._id}, Estado: ${l.estado}, Periodo: ${l.periodo.inicio} a ${l.periodo.fin}`));

    process.exit(0);
}
run();
