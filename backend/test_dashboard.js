const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';

// Use same credentials as other tests
const credentials = {
    email: 'matiasbourgeois@gmail.com',
    contrasena: '123456'
};

async function testDashboard() {
    try {
        // 1. Login
        console.log('🔑 Iniciando sesión...');
        const loginRes = await axios.post(`${API_URL}/usuarios/login`, credentials);
        const token = loginRes.data.token;
        console.log('✅ Login exitoso.');

        // 2. Get Metrics
        console.log('📊 Consultando Métricas Dashboard...');
        const res = await axios.get(`${API_URL}/reportes/dashboard`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Respuesta recibida (JSON):');
        console.log(JSON.stringify(res.data, null, 2));

        // Basic Assertions
        if (res.data.kpis && res.data.flota && res.data.graficos) {
            console.log('\n✨ TEST PASSED: Estructura correcta.');
        } else {
            console.error('\n❌ TEST FAILED: Falta estructura en la respuesta.');
        }

    } catch (error) {
        console.error('❌ Error en test:', error.response ? error.response.data : error.message);
    }
}

testDashboard();
