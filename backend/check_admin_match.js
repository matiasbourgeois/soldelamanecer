const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const url = "mongodb://127.0.0.1:27017/";
const UPLOADS_DIR = path.join(__dirname, 'uploads', 'perfiles');

async function checkAdminPhoto() {
    const client = new MongoClient(url);
    await client.connect();

    const admin = await client.db('soldelamanecer').collection('usuarios').findOne({ email: "matiasbourgeois@gmail.com" });

    if (admin) {
        console.log(`👤 Admin ID: ${admin._id}`);
        console.log(`🖼️ Foto en DB: ${admin.fotoPerfil}`);

        // Check fuzzy match in folder
        const files = fs.readdirSync(UPLOADS_DIR);
        const match = files.find(f => f.includes(admin._id.toString()));

        if (match) {
            console.log(`✅ MATCH ENCONTRADO en disco: ${match}`);
        } else {
            console.log("❌ No hay archivo que contenga ese ID en la carpeta perfiles.");
        }
    } else {
        console.log("❌ Admin no encontrado.");
    }

    await client.close();
}
checkAdminPhoto();
