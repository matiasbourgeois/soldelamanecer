
const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Usuario = require('./src/models/Usuario');

dotenv.config();

const BASE_URL = 'http://localhost:5000/api/usuarios';
const EMAIL = 'matiasbourgeois@gmail.com';
const PASS_INITIAL = '123456';
const PASS_NEW = 'Hilary88+';

const runTest = async () => {
    try {
        console.log('--- 1. Resetting Password Manual ---');
        await mongoose.connect(process.env.MONGO_URI);
        const user = await Usuario.findOne({ email: EMAIL });
        if (!user) throw new Error('User not found');

        user.contrasena = PASS_INITIAL;
        await user.save(); // Should check if pre-save hashes it
        console.log('Reset complete. Checking hash...');
        console.log('Hash in DB starts with:', user.contrasena.substring(0, 10));

        // Disconnect mongoose to let server handle requests
        // But we need to keep process alive? No, just disconnect.
        // Actually, if we use axios, we talk to the RUNNING server.
        // We shouldn't connect mongoose while server is running? It's fine.

        console.log('\n--- 2. Login with Initial Password ---');
        let token;
        try {
            const resLogin = await axios.post(`${BASE_URL}/login`, {
                email: EMAIL,
                contrasena: PASS_INITIAL
            });
            token = resLogin.data.token;
            console.log('Login Initial: SUCCESS');
        } catch (e) {
            console.error('Login Initial FAILED:', e.response?.data || e.message);
            process.exit(1);
        }

        console.log('\n--- 3. Changing Password via API ---');
        try {
            await axios.put(`${BASE_URL}/cambiar-password`, {
                passwordActual: PASS_INITIAL,
                passwordNueva: PASS_NEW
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Change Password API: SUCCESS');
        } catch (e) {
            console.error('Change Password API FAILED:', e.response?.data || e.message);
            process.exit(1);
        }

        console.log('\n--- 4. Login with NEW Password ---');
        try {
            await axios.post(`${BASE_URL}/login`, {
                email: EMAIL,
                contrasena: PASS_NEW
            });
            console.log('Login New Password: SUCCESS! Flow is working.');
        } catch (e) {
            console.error('Login New Password FAILED:', e.response?.data || e.message);

            // Debug: Check DB Hash again
            const userDebug = await Usuario.findOne({ email: EMAIL });
            console.log('Debug DB Hash:', userDebug.contrasena);
        }

        process.exit(0);

    } catch (error) {
        console.error('Unexpected Error:', error);
        process.exit(1);
    }
};

runTest();
