const mongoose = require('mongoose');
const HojaReparto = require('./src/models/HojaReparto');

const run = async () => {
    await mongoose.connect("mongodb://127.0.0.1:27017/soldelamanecer");
    const hojas = await HojaReparto.find({
        numeroHoja: /20260305$/
    }).select("numeroHoja fecha").limit(5);

    console.log(hojas.map(h => ({
        numero: h.numeroHoja,
        fechaOriginalIso: h.fecha ? h.fecha.toISOString() : null,
        fechaLocalStr: h.fecha ? h.fecha.toString() : null
    })));
    process.exit(0);
}
run();
