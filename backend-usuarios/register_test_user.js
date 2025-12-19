const registerUser = async () => {
    try {
        const port = 5002;
        console.log(`Intentando conectar a http://127.0.0.1:${port}...`);
        const userData = {
            nombre: "Agente Test Final",
            email: "agente6@test.com",
            contrasena: "password123"
        };

        const response = await fetch(`http://127.0.0.1:${port}/api/usuarios/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.ok) {
            console.log(`✅ ÉXITO en puerto ${port}. Usuario registrado:`, data);
        } else {
            console.log(`❌ Puerto ${port} respondió con error ${response.status}:`, data);
        }
    } catch (error) {
        console.log(`⚠️ Error de red: ${error.cause?.code || error.message}`);
    }
};

registerUser();
