require('dotenv').config();
const mongoose = require('mongoose');
const Usuario = require('./models/Usuario');

const MONGO_URI = "mongodb://localhost:27017/usuarios_db";

async function seedCliente() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Conectado a MongoDB');

        const existingUser = await Usuario.findOne({ email: 'chofer_test@test.com' });
        if (existingUser) {
            console.log('⚠️ El usuario de prueba ya existe:', existingUser.email);
        } else {
            const newUser = new Usuario({
                nombre: 'Chofer Test',
                email: 'chofer_test@test.com',
                contrasena: '123456', // Will be hashed by pre-save hook
                rol: 'cliente',
                dni: '12345678',
                telefono: '1122334455',
                verificado: true
            });
            await newUser.save();
            console.log('✅ Usuario de prueba creado exitosamente');
        }
    } catch (error) {
        console.error('❌ Error seeding usuario:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Desconectado');
    }
}

seedCliente();
