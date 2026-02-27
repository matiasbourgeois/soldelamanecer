const Configuracion = require("../models/Configuracion");
const logger = require("../utils/logger");

// Obtener la configuración general (Si no existe, la crea con valores por defecto 0)
const obtenerConfiguracion = async (req, res) => {
    try {
        let config = await Configuracion.findOne();
        if (!config) {
            config = new Configuracion({ tarifaGlobalSDA: 0 });
            await config.save();
        }
        res.json(config);
    } catch (error) {
        logger.error("Error al obtener la configuración global:", error);
        res.status(500).json({ error: "No se pudo obtener la configuración del sistema." });
    }
};

// Actualizar la configuración general (Solo ADMIN)
const actualizarConfiguracion = async (req, res) => {
    try {
        const { tarifaGlobalSDA } = req.body;

        let config = await Configuracion.findOne();
        if (!config) {
            config = new Configuracion();
        }

        if (tarifaGlobalSDA !== undefined) {
            config.tarifaGlobalSDA = tarifaGlobalSDA;
        }

        config.ultimaActualizacion = Date.now();
        config.actualizadoPor = req.usuario.id;

        await config.save();

        logger.info(`✅ Configuración Global actualizada por ${req.usuario.id}: Tarifa SDA = $${config.tarifaGlobalSDA}`);
        res.json({ msg: "Configuraciones globales actualizadas exitosamente.", configuracion: config });
    } catch (error) {
        logger.error("Error al actualizar configuración global:", error);
        res.status(500).json({ error: "Error al intentar guardar las configuraciones." });
    }
};

module.exports = {
    obtenerConfiguracion,
    actualizarConfiguracion
};
