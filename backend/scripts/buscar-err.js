require('dotenv').config();
const mongoose = require('mongoose');
const HojaReparto = require('../src/models/HojaReparto');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const hojasErr = await HojaReparto.find({ numeroHoja: /ERR/ });
    console.log(`Hojas con ERR encontradas: ${hojasErr.length}`);
    hojasErr.forEach(h => {
        console.log(`- ID Hoja: ${h._id} | Numero: ${h.numeroHoja} | Ruta ID: ${h.ruta}`);
    });
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
