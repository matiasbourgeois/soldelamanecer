const mongoose = require('mongoose');
const HojaReparto = require('./src/models/HojaReparto');
const Ruta = require('./src/models/Ruta');

const run = async () => {
    await mongoose.connect("mongodb://127.0.0.1:27017/soldelamanecer");

    const choferId = "6799071cae7960d783aa8739"; // Aldeco

    const rutasComoTitular = await Ruta.find({ contratistaTitular: choferId }).lean();
    const idsRutasComoTitular = rutasComoTitular.map(r => r._id);

    const rutasConOtroTitular = await Ruta.find({ contratistaTitular: { $nin: [null, choferId] } }).lean();
    const idsRutasConOtroTitular = rutasConOtroTitular.map(r => r._id);

    const queryHojas = {
        estado: { $in: ['cerrada', 'en reparto'] },
        $or: [
            { chofer: choferId, ruta: { $nin: idsRutasConOtroTitular } },
            { ruta: { $in: idsRutasComoTitular } }
        ]
    };

    const hojas = await HojaReparto.find(queryHojas).populate('ruta').sort({ fecha: -1 }).limit(10);
    console.log(`Últimas 10 hojas de Aldeco:`);
    hojas.forEach(h => {
        console.log(`- ${h.numeroHoja} (Ruta: ${h.ruta ? h.ruta.codigo : 'N/A'}): ${h.fecha.toISOString()} Estado: ${h.estado}`);
    });
    process.exit(0);
}
run();
