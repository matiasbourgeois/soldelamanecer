
const mongoose = require('mongoose');
const Usuario = require('./src/models/Usuario');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb://127.0.0.1:27017/soldelamanecer';

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('Connected to DB');

        // Check if exists
        const existing = await Usuario.findOne({ email: 'chofer@test.com' });
        if (existing) {
            console.log('User already exists');
            process.exit();
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('123456', salt);

        const chofer = new Usuario({
            nombre: 'Chofer Test',
            email: 'chofer@test.com',
            contrasena: hash,
            rol: 'chofer'
        });

        await chofer.save();
        console.log('CREATED_CHOFER: chofer@test.com / 123456');
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
