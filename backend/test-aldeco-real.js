const mongoose = require('mongoose');
const Chofer = require('./src/models/Chofer');
const Usuario = require('./src/models/Usuario');
const HojaReparto = require('./src/models/HojaReparto');
const Ruta = require('./src/models/Ruta');
const fs = require('fs');

const run = async () => {
    await mongoose.connect("mongodb://127.0.0.1:27017/soldelamanecer");

    const usuario = await Usuario.findOne({ dni: '35065087' });
    const chofer = await Chofer.findOne({ usuario: usuario._id });

    const hojas = await HojaReparto.find({ chofer: chofer._id }).populate('ruta').sort({ fecha: -1 }).limit(10);
    let output = `Aldeco Chofer ID: ${chofer._id}\n`;
    hojas.forEach(h => {
        output += (`- ${h.numeroHoja} (Ruta: ${h.ruta ? h.ruta.codigo : '-'}): DB:${h.fecha.toISOString()} Estado: ${h.estado}\n`);
    });
    fs.writeFileSync('aldeco-hojas.txt', output);
    process.exit(0);
}
run();
