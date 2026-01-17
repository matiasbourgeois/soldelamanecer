const { MongoClient } = require('mongodb');
const url = "mongodb://127.0.0.1:27017/";

async function checkPhotoPaths() {
    const client = new MongoClient(url);
    await client.connect();
    const db = client.db('soldelamanecer');

    // Buscar usuarios con fotoPerfil
    const users = await db.collection('usuarios').find({ fotoPerfil: { $exists: true, $ne: "" } }).limit(5).toArray();

    console.log("📸 Rutas de fotos en DB:");
    users.forEach(u => {
        console.log(`- User: ${u.nombre} (${u.email}) -> Foto: ${u.fotoPerfil}`);
    });

    await client.close();
}
checkPhotoPaths();
