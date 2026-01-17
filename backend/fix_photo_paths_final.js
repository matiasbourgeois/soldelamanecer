const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const url = "mongodb://127.0.0.1:27017/";
const UPLOADS_DIR = path.join(__dirname, 'uploads', 'perfiles');

async function fixPhotoPaths() {
    const client = new MongoClient(url);
    try {
        await client.connect();
        console.log("🛠️ Iniciando corrección de rutas de fotos...");

        const db = client.db('soldelamanecer');
        const users = await db.collection('usuarios').find({ fotoPerfil: { $exists: true, $ne: "" } }).toArray();

        let updatedCount = 0;

        for (const u of users) {
            // Extraer el nombre del archivo (ignorando paths viejos)
            const oldPath = u.fotoPerfil;
            const filename = path.basename(oldPath);

            // Verificar si el archivo existe en disco
            if (fs.existsSync(path.join(UPLOADS_DIR, filename))) {
                const newPath = `/uploads/perfiles/${filename}`;

                if (oldPath !== newPath) {
                    await db.collection('usuarios').updateOne({ _id: u._id }, { $set: { fotoPerfil: newPath } });
                    console.log(`✅ Fixed: ${u.email} -> ${newPath}`);
                    updatedCount++;
                }
            } else {
                console.log(`⚠️ Archivo no encontrado para ${u.email} (${filename}). No se toca.`);
                // Opcional: ¿Resetear a null? Mejor no, el usuario dijo que las imagenes ESTÁN.
            }
        }

        console.log(`🏁 Fin. ${updatedCount} paths corregidos.`);

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.close();
    }
}
fixPhotoPaths();
