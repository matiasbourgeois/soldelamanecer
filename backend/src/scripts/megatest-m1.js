const axios = require('axios');

async function simularRegistroPublico() {
    try {
        console.log("------------------------------------------");
        console.log("🚀 SIMULANDO POST /api/auth/registro (Paso M1)");
        console.log("------------------------------------------");

        // Simular que llenamos el formulario en la web pública
        const payload = {
            nombre: "TESTCHOFER MEGATESTER",
            email: "megatest@soldelamanecer.com",
            contrasena: "TestChofer123!",
            telefono: "5551234567",
            dni: "99999999" // Ahora el DNI va AL USUARIO desde el min 1
        };

        const response = await axios.post("http://localhost:5000/api/usuarios/register", payload);

        console.log("✅ OK - Respuesta del Servidor:");
        console.log(`Mensaje: ${response.data.msg}`);

        process.exit(0);
    } catch (e) {
        console.error("❌ FAILED - Error en registro HTTP:");
        if (e.response) {
            console.error(e.response.data);
        } else {
            console.error(e.message);
        }
        process.exit(1);
    }
}

simularRegistroPublico();
