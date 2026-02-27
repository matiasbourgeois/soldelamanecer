require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const col = mongoose.connection.db.collection('usuarios');
    const f = await col.find({ nombre: { $regex: /fermanelli/i } }).toArray();
    console.log(f.map(u => u.nombre + ' -> ' + u.dni + ' -> ' + u._id));
    process.exit();
});
