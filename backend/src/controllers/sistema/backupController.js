const mongoose = require("mongoose");
const zlib = require("zlib");
const logger = require("../../utils/logger");

/**
 * Genera un backup completo de la base de datos en formato JSON comprimido (.gz)
 * Exporta Estructura (Nombres de colecciones) y Datos Reales.
 */
const generarBackupCompleto = async (req, res) => {
    try {
        logger.info(`💾 Iniciando solicitud de Backup Completo por usuario: ${req.usuario.id}`);

        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();

        const backupData = {
            metadata: {
                sistema: "Sol del Amanecer",
                version: "1.0.0",
                fechaGeneracion: new Date().toISOString(),
                generadoPor: req.usuario.id,
                totalColecciones: collections.length
            },
            colecciones: {}
        };

        // Iterar por cada colección y extraer datos
        for (const col of collections) {
            const collectionName = col.name;
            const data = await db.collection(collectionName).find({}).toArray();
            backupData.colecciones[collectionName] = data;
        }

        // Convertir a string JSON
        const jsonString = JSON.stringify(backupData);

        // Comprimir el JSON usando zlib
        zlib.gzip(jsonString, (err, buffer) => {
            if (err) {
                logger.error("❌ Error al comprimir el backup:", err);
                return res.status(500).json({ error: "Error al comprimir los datos del backup." });
            }

            const fechaStr = new Date().toISOString().split('T')[0];
            const fileName = `Backup_SDA_${fechaStr}.json.gz`;

            // Configurar headers para la descarga
            res.setHeader('Content-Type', 'application/gzip');
            res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
            res.setHeader('Content-Length', buffer.length);

            logger.info(`✅ Backup generado exitosamente: ${fileName} (${(buffer.length / 1024).toFixed(2)} KB)`);
            res.send(buffer);
        });

    } catch (error) {
        logger.error("❌ Error crítico durante la generación del backup:", error);
        res.status(500).json({ error: "Error interno al intentar generar el respaldo de la base de datos." });
    }
};

module.exports = {
    generarBackupCompleto
};
