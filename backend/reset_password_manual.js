
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Usuario = require('./src/models/Usuario');

dotenv.config();

const resetPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado a MongoDB');

        const email = 'matiasbourgeois@gmail.com';
        const newPassword = '123456';

        const usuario = await Usuario.findOne({ email });

        if (!usuario) {
            console.log(`❌ Usuario no encontrado: ${email}`);
            process.exit(1);
        }

        console.log(`👤 Usuario encontrado: ${usuario.nombre} (${usuario.email})`);

        // Update password (triggers pre-save hook for hashing)
        usuario.contrasena = newPassword;
        await usuario.save();

        console.log(`✅ Contraseña reseteada exitosamente a: ${newPassword}`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

resetPassword();
