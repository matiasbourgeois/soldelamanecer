
const mongoose = require('mongoose');
const Usuario = require('./src/models/Usuario');
require('dotenv').config({ path: './config/.env' }); // Adjust if needed

// Hardcode connection string if dotenv fails or just use the one from db.js
// Assuming standard local mongo:
const MONGO_URI = 'mongodb://127.0.0.1:27017/soldelamanecer';

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('Connected to DB');
        const chofer = await Usuario.findOne({ rol: 'chofer' });
        if (chofer) {
            console.log('CHOFER_FOUND:', chofer.email);
            // We can't see the password hash, but maybe it's '123456' or similar dev password
        } else {
            console.log('NO_CHOFER_FOUND');
        }
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
