const SolicitudAprobacion = require("../models/SolicitudAprobacion");
const Ruta = require("../models/Ruta");

// 1. OBTENER TODAS LAS APROBACIONES PENDIENTES (Solo Admin)
const obtenerAprobacionesPendientes = async (req, res) => {
    try {
        if (req.usuario.rol !== "admin") {
            return res.status(403).json({ error: "Acceso denegado. Solo administradores pueden ver esto." });
        }

        // Buscamos todas las pendientes
        const aprobaciones = await SolicitudAprobacion.find({ estado: "PENDIENTE" })
            .populate("solicitante", "nombre apellido email")
            .populate("entidadId") // Poblamos la entidad original (por ej, los datos de la ruta actual) si existe
            .sort({ createdAt: -1 });

        res.json(aprobaciones);
    } catch (error) {
        console.error("Error al obtener aprobaciones pendientes:", error);
        res.status(500).json({ error: "Error interno al obtener aprobaciones." });
    }
};

// 2. OBTENER EL ESTADO DE UNA RUTA EN PARTICULAR (Para el listado general del Administrativo)
const consultarEstadoEntidad = async (req, res) => {
    try {
        const { entidad, id } = req.params;

        // Busca si hay una solicitud PENDIENTE para esta entidad y este ID
        const solicitud = await SolicitudAprobacion.findOne({
            entidad: entidad,
            entidadId: id,
            estado: "PENDIENTE"
        });

        if (solicitud) {
            return res.json({ pendiente: true, accion: solicitud.accion });
        }

        res.json({ pendiente: false });
    } catch (error) {
        res.status(500).json({ error: "Error al consultar estado de la entidad." });
    }
};

// 3. RESOLVER UNA APROBACIÓN (Aprobar o Rechazar)
const resolverAprobacion = async (req, res) => {
    try {
        if (req.usuario.rol !== "admin") {
            return res.status(403).json({ error: "Acceso denegado. Solo administradores pueden resolver esto." });
        }

        const { id } = req.params;
        const { resolucion, motivoRechazo } = req.body; // resolucion = "APROBAR" o "RECHAZAR"

        const solicitud = await SolicitudAprobacion.findById(id);
        if (!solicitud) {
            return res.status(404).json({ error: "Solicitud no encontrada." });
        }

        if (solicitud.estado !== "PENDIENTE") {
            return res.status(400).json({ error: "Esta solicitud ya fue resuelta." });
        }

        if (resolucion === "RECHAZAR") {
            solicitud.estado = "RECHAZADA";
            solicitud.motivoRechazo = motivoRechazo || "Sin motivo especificado.";
            solicitud.aprobador = req.usuario.id;
            await solicitud.save();
            return res.json({ mensaje: "Solicitud rechazada correctamente.", solicitud });
        }

        if (resolucion === "APROBAR") {
            // Aplicar el cambio real según el tipo de entidad y acción
            if (solicitud.entidad === "Ruta") {
                if (solicitud.accion === "CREACION") {
                    const nuevaRuta = new Ruta(solicitud.datosPropuestos);
                    await nuevaRuta.save();
                }
                else if (solicitud.accion === "EDICION") {
                    const ruta = await Ruta.findById(solicitud.entidadId);
                    if (!ruta) return res.status(404).json({ error: "La ruta original ya no existe." });

                    Object.assign(ruta, solicitud.datosPropuestos);
                    await ruta.save();
                }
                else if (solicitud.accion === "ELIMINACION") {
                    await Ruta.findByIdAndDelete(solicitud.entidadId);
                }
            }

            // Marcar solicitud como aprobada
            solicitud.estado = "APROBADA";
            solicitud.aprobador = req.usuario.id;
            await solicitud.save();

            return res.json({ mensaje: "Solicitud aprobada y aplicada correctamente.", solicitud });
        }

        res.status(400).json({ error: "Resolución no válida." });

    } catch (error) {
        console.error("Error al resolver aprobación:", error);
        res.status(500).json({ error: "Error interno al resolver la aprobación." });
    }
};

module.exports = {
    obtenerAprobacionesPendientes,
    consultarEstadoEntidad,
    resolverAprobacion
};
