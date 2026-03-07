const timeUtil = require("../../utils/timeUtil");
const Envio = require("../../models/Envio");
const Ruta = require("../../models/Ruta");
const Remito = require("../../models/Remito");
const HojaReparto = require("../../models/HojaReparto");
const logger = require("../../utils/logger");

// Buscar hoja existente por ruta y fecha (Fase 5)
const buscarHojaPorRutaFecha = async (req, res) => {
    try {
        const { rutaId, fecha } = req.query;

        if (!rutaId || !fecha) {
            return res.status(400).json({ error: 'rutaId y fecha son requeridos' });
        }

        // Parsear fecha
        const fechaBusqueda = new Date(fecha);
        const inicioDia = timeUtil.getInicioDiaArg(fechaBusqueda);
        const finDia = timeUtil.getFinDiaArg(fechaBusqueda);

        // Buscar hoja
        const hoja = await HojaReparto.findOne({
            ruta: rutaId,
            fecha: { $gte: inicioDia, $lte: finDia }
        })
            .populate('ruta')
            .populate('chofer')
            .populate('vehiculo')
            .populate({
                path: 'envios',
                populate: [
                    { path: 'localidadDestino', select: 'nombre' },
                    { path: 'clienteRemitente', select: 'nombre' },
                    { path: 'destinatario', select: 'nombre direccion' }
                ]
            });

        if (!hoja) {
            return res.status(404).json({
                error: 'No existe hoja de reparto para esta ruta y fecha',
                sugerencia: 'Las hojas se generan automáticamente a las 00:01. Verifica que la fecha seleccionada tenga una hoja creada.'
            });
        }

        // Buscar envíos disponibles (pendientes, sin hoja, en localidades de la ruta)
        const ruta = await Ruta.findById(rutaId).populate('localidades');
        const idsLocalidades = ruta.localidades.map(l => l._id);

        const enviosDisponibles = await Envio.find({
            localidadDestino: { $in: idsLocalidades },
            estado: { $in: ['pendiente', 'reagendado'] },
            hojaReparto: null // Solo envíos sin asignar
        })
            .populate([
                { path: 'localidadDestino', select: 'nombre' },
                { path: 'clienteRemitente', select: 'nombre' },
                { path: 'destinatario', select: 'nombre direccion' },
                { path: 'encomienda' }
            ])
            .lean();

        // Obtener remitos
        const idsEnviosDisponibles = enviosDisponibles.map(e => e._id);
        const remitos = await Remito.find({ envio: { $in: idsEnviosDisponibles } });

        const enviosConRemito = enviosDisponibles.map(envio => {
            const remito = remitos.find(r => r.envio.toString() === envio._id.toString());
            return {
                ...envio,
                remitoNumero: remito ? remito.numeroRemito : null
            };
        });

        res.json({
            hoja,
            enviosDisponibles: enviosConRemito,
            ruta
        });

    } catch (error) {
        logger.error('❌ Error buscando hoja por ruta/fecha:', error);
        res.status(500).json({ error: 'Error al buscar hoja de reparto' });
    }
};
