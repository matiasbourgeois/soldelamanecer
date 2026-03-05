const mongoose = require('mongoose');
const HojaReparto = require('./src/models/HojaReparto');

const run = async () => {
    await mongoose.connect("mongodb://127.0.0.1:27017/soldelamanecer");

    const choferId = "6799071cae7960d783aa8739"; // Aldeco

    const hojas = await HojaReparto.find({ chofer: choferId }).populate('ruta').sort({ fecha: -1 }).limit(10);
    console.log(`Últimas 10 hojas TOTALES donde Aldeco es CHOFER:`);
    hojas.forEach(h => {
        console.log(`- ${h.numeroHoja} (Ruta: ${h.ruta ? h.ruta.codigo : 'N/A'}): ${h.fecha.toISOString()} Estado: ${h.estado}`);
    });
    process.exit(0);
}
run();
