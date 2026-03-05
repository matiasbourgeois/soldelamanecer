const mongoose = require('mongoose');
const HojaReparto = require('./src/models/HojaReparto');

const run = async () => {
    await mongoose.connect("mongodb://127.0.0.1:27017/soldelamanecer");
    const doc = await HojaReparto.findOne({ numeroHoja: /VMAR-2-20260305/ });
    console.log(doc ? {
        numero: doc.numeroHoja,
        estado: doc.estado,
        fecha: doc.fecha.toISOString()
    } : "No encontrada VMAR-2-20260305");

    process.exit(0);
}
run();
