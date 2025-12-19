require('dotenv').config();
const mongoose = require('mongoose');
const Chofer = require('./models/Chofer'); // Assuming model exists in backend-sistema
// We need to connect to backend-sistema DB for Choferes
// But wait, the previous seed was in backend-usuarios.
// Choferes are in backend-sistema.

const MONGO_URI_SISTEMA = process.env.MONGO_URI || "mongodb://localhost:27017/sistema_db";
const MONGO_URI_USUARIOS = "mongodb://localhost:27017/usuarios_db";

// Simple Schema definition if not importing
const ChoferSchema = new mongoose.Schema({
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    dni: { type: String, required: true },
    telefono: { type: String, required: true },
    tipoVinculo: { type: String, enum: ["contratado", "relacionDependencia"], required: true },
    activo: { type: Boolean, default: true },
});

// We need to find the user ID first.
const UsuarioSchema = new mongoose.Schema({ email: String });

async function seedChofer() {
    let connSistema, connUsuarios;
    try {
        connUsuarios = await mongoose.createConnection(MONGO_URI_USUARIOS).asPromise();
        console.log('✅ Conectado a MongoDB Usuarios');

        const UsuarioModel = connUsuarios.model('Usuario', UsuarioSchema);
        const user = await UsuarioModel.findOne({ email: 'chofer_test@test.com' });

        if (!user) {
            console.error('❌ Usuario de prueba no encontrado. Ejecute seed_cliente.js primero.');
            return;
        }
        console.log('✅ Usuario encontrado:', user._id);

        connSistema = await mongoose.createConnection(MONGO_URI_SISTEMA).asPromise();
        console.log('✅ Conectado a MongoDB Sistema');

        const ChoferModel = connSistema.model('Chofer', ChoferSchema);

        // Check if exists
        const existing = await ChoferModel.findOne({ usuario: user._id });
        if (existing) {
            console.log('⚠️ El chofer ya existe.');
        } else {
            const newChofer = new ChoferModel({
                usuario: user._id,
                dni: '12345678', // Matching user DNI
                telefono: '1122334455',
                tipoVinculo: 'contratado'
            });
            await newChofer.save();
            console.log('✅ Chofer creado exitosamente');
        }

    } catch (error) {
        console.error('❌ Error seeding chofer:', error);
    } finally {
        if (connSistema) await connSistema.close();
        if (connUsuarios) await connUsuarios.close();
        console.log('👋 Desconectado');
    }
}

seedChofer();
