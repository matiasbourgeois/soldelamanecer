const HojaReparto = require("../../models/HojaReparto");
const logger = require("../../utils/logger");
const Envio = require('../../models/Envio');
const Remito = require('../../models/Remito');
const Ruta = require("../../models/Ruta");
const { enviarNotificacionEstado } = require("../../utils/emailService");
const Chofer = require("../../models/Chofer"); // Agregar arriba si no está



// Generador de número de hoja al confirmar
const generarNumeroHoja = async () => {
    const ultima = await HojaReparto.find({ numeroHoja: { $ne: null } })
        .sort({ createdAt: -1 })
        .limit(1);

    let numero = 1;
    if (ultima.length && ultima[0].numeroHoja) {
        const partes = ultima[0].numeroHoja.split("-");
        const num = parseInt(partes[2]);
        if (!isNaN(num)) {
            numero = num + 1;
        }
    }

    return `HR-SDA-${String(numero).padStart(5, "0")}`;
};

const extraerNumero = (numeroHoja) => {
    const partes = numeroHoja.split("-");
    return parseInt(partes[2], 10);
};

// Crear hoja preliminar (solo devuelve datos, no guarda en la base)
const crearHojaPreliminar = async (req, res) => {
    try {
        const { rutaId, choferId, vehiculoId, observaciones, usuarioId, localidadesRuta } = req.body;

        // Buscar la ruta para obtener el chofer asignado si no se manda uno
        const ruta = await Ruta.findById(rutaId).populate("choferAsignado");

        // Si no me mandaron choferId desde el frontend, uso el chofer asignado a la ruta
        let choferSeleccionado = choferId;

        if (!choferSeleccionado && ruta?.choferAsignado?._id) {
            choferSeleccionado = ruta.choferAsignado._id;
        }

        // --- VALIDACIÓN DE UNICIDAD (Fase 1 God Level) ---
        const hoy = new Date();
        const inicioDia = new Date(hoy).setHours(0, 0, 0, 0);
        const finDia = new Date(hoy).setHours(23, 59, 59, 999);

        const existe = await HojaReparto.findOne({
            ruta: rutaId,
            fecha: { $gte: inicioDia, $lte: finDia }
        });

        if (existe) {
            return res.status(400).json({
                error: `Ya existe una hoja de reparto para esta ruta hoy (${existe.numeroHoja || 'En Planificación'}). Use el Control Operativo para editarla.`
            });
        }



        // Extraer IDs de localidades
        const idsLocalidades = localidadesRuta.map(loc => loc._id);

        // Buscar envíos pendientes en esas localidades y con populate correcto
        const enviosPendientes = await Envio.find({
            localidadDestino: { $in: idsLocalidades },
            estado: { $in: ['pendiente', 'reagendado'] },
        })
            .populate([
                { path: "localidadDestino", select: "nombre" },
                { path: "clienteRemitente", select: "nombre" },
                { path: "destinatario", select: "nombre direccion" },
                { path: "encomienda" }
            ])

            .lean(); // Para poder modificar los objetos fácilmente

        // Obtener los IDs de esos envíos
        const idsEnvios = enviosPendientes.map(e => e._id);

        // Traer los remitos vinculados a esos envíos
        const remitos = await Remito.find({ envio: { $in: idsEnvios } });

        // Asociar remito a cada envío
        const enviosConRemito = enviosPendientes.map(envio => {
            const remito = remitos.find(r => r.envio.toString() === envio._id.toString());
            return {
                ...envio,
                remitoNumero: remito ? remito.numeroRemito : null,
            };
        });

        // Crear hoja de reparto en estado pendiente
        const hoja = new HojaReparto({
            numeroHoja: null, // Se asignará al confirmar
            ruta: rutaId,
            chofer: choferSeleccionado,
            vehiculo: vehiculoId,
            envios: idsEnvios,
            estado: 'pendiente',
            observaciones,
            // Snapshot de precios y KMs (Fase 1 Plan Maestro)
            kilometrosEstimados: ruta.kilometrosEstimados || 0,
            precioKm: ruta.precioKm || 0,
            proveedor: ruta.proveedorAsignado || null,
            historialMovimientos: [
                {
                    usuario: usuarioId,
                    accion: 'creación de hoja pendiente',
                }
            ]
        });

        await hoja.save();



        // Respuesta
        res.status(201).json({
            hoja,
            envios: enviosConRemito,
        });

    } catch (error) {
        logger.error('❌ Error en hoja preliminar:', error);
        res.status(500).json({ error: 'Error al crear hoja preliminar' });
    }
};



// Confirmar hoja de reparto
const confirmarHoja = async (req, res) => {
    try {
        const { hojaId, usuarioId, envios, choferId, vehiculoId } = req.body;



        const hoja = await HojaReparto.findById(hojaId);
        if (!hoja) {
            logger.warn("❌ Hoja no encontrada con ID:", { hojaId });
            return res.status(404).json({ error: 'Hoja no encontrada' });
        }

        if (choferId) hoja.chofer = choferId;
        if (vehiculoId) hoja.vehiculo = vehiculoId;

        // Validar si los envíos "en reparto" ya están asignados a otra hoja "en reparto"
        for (const envioId of envios) {
            const envio = await Envio.findById(envioId);
            if (!envio) {
                logger.warn("⚠️ Envío no encontrado con ID:", { envioId });
                continue;
            }

            if (envio.estado === "en reparto") {
                const yaAsignado = await HojaReparto.findOne({
                    _id: { $ne: hojaId },
                    estado: 'en reparto',
                    envios: envioId,
                });

                if (yaAsignado) {
                    logger.warn(`❌ El envío ${envioId} ya está asignado a otra hoja en reparto`, { yaAsignadoId: yaAsignado._id });
                    return res.status(400).json({
                        error: `El envío ${envioId} ya está asignado a otra hoja confirmada.`,
                    });
                }
            }
        }

        // Asignar número único
        const hojasConNumero = await HojaReparto.find({ numeroHoja: { $ne: null } });
        let ultimoNumero = 0;
        hojasConNumero.forEach(h => {
            const num = parseInt(h.numeroHoja?.split("-")[2], 10);
            if (!isNaN(num) && num > ultimoNumero) ultimoNumero = num;
        });

        const nuevoNumero = ultimoNumero + 1;
        hoja.numeroHoja = `HR-SDA-${String(nuevoNumero).padStart(5, "0")}`;
        hoja.estado = 'en reparto';
        hoja.envios = envios;

        // Actualizar estado de envíos y asignar a hoja
        for (const envioId of envios) {
            const envio = await Envio.findById(envioId).populate("clienteRemitente", "nombre email");
            if (!envio) {
                console.log("⚠️ Envío no encontrado con ID:", envioId);
                continue;
            }

            // 🆕 CRÍTICO: Asignar el envío a esta hoja
            envio.hojaReparto = hojaId;
            envio.estado = "en reparto";
            envio.historialEstados.push({
                estado: "en reparto",
                sucursal: "Casa Central – Córdoba"
            });

            await envio.save();
            logger.info("✅ Envío actualizado a 'en reparto':", { id: envio._id });

            // Notificación
            enviarNotificacionEstado(envio, "en_reparto").catch((err) => {
                logger.error("❌ Error al enviar notificación de estado:", err);
            });
        }

        hoja.historialMovimientos.push({
            usuario: usuarioId,
            accion: 'confirmación de hoja',
        });

        await hoja.save();

        const hojaFinal = await HojaReparto.findById(hoja._id)
            .populate('ruta chofer vehiculo envios');

        logger.info("✅ Hoja confirmada correctamente:", { numeroHoja: hojaFinal.numeroHoja });

        res.status(200).json(hojaFinal);
    } catch (error) {
        console.error("❌ Error al confirmar hoja:", error);
        res.status(500).json({ error: 'Error al confirmar la hoja' });
    }
};




const consultarHojas = async (req, res) => {
    try {
        const { numeroHoja, fecha, estado } = req.query;
        const filtro = {};

        if (numeroHoja) filtro.numeroHoja = numeroHoja;
        if (estado) filtro.estado = estado;
        if (fecha) {
            const fechaDesde = new Date(fecha);
            const fechaHasta = new Date(fecha);
            fechaHasta.setDate(fechaHasta.getDate() + 1);
            filtro.fecha = { $gte: fechaDesde, $lt: fechaHasta };
        }

        const hojas = await HojaReparto.find(filtro)
            .populate("ruta vehiculo")
            .populate({
                path: "chofer",
                populate: {
                    path: "usuario",
                    select: "nombre dni"
                }
            })

            .populate({
                path: "envios",
                populate: [
                    { path: "localidadDestino", select: "nombre" },
                    { path: "destinatario", select: "nombre direccion" },
                    { path: "encomienda" }
                    // Note: 'remito' field is not populated as it is not directly ref'd in Envio model schema in this context
                ]
            })
            .sort({ fecha: -1 });

        // 🔄 Traer remitos asociados a los envíos
        const todosLosEnvios = hojas.flatMap(h => h.envios);
        const idsEnvios = todosLosEnvios.map(e => e._id);
        const remitos = await Remito.find({ envio: { $in: idsEnvios } });

        // Asociar remitoNumero manualmente
        const hojasConRemito = hojas.map(hoja => {
            const hojaObj = hoja.toObject();
            hojaObj.envios = hojaObj.envios.map(envio => {
                const remitoEncontrado = remitos.find(r => r.envio.toString() === envio._id.toString());
                return {
                    ...envio,
                    remitoNumero: remitoEncontrado?.numeroRemito || null,
                };
            });
            return hojaObj;
        });

        res.status(200).json(hojasConRemito);
    } catch (error) {
        console.error("❌ Error en consulta de hojas:", error);
        res.status(500).json({ error: "Error al consultar hojas de reparto" });
    }
};


const mongoose = require("mongoose");

const obtenerHojaPorId = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "ID inválido" });
        }

        const hoja = await HojaReparto.findById(id)
            .populate("ruta vehiculo")
            .populate({
                path: "chofer",
                populate: {
                    path: "usuario",
                    select: "nombre dni"
                }
            })

            .populate({
                path: "envios",
                populate: [
                    { path: "localidadDestino", select: "nombre" },
                    { path: "encomienda" },
                    { path: "destinatario", select: "nombre direccion" }
                ]
            });

        if (!hoja) return res.status(404).json({ error: "Hoja no encontrada" });

        const idsEnvios = hoja.envios.map(e => e._id);
        const remitos = await Remito.find({ envio: { $in: idsEnvios } });

        const hojaConRemitos = hoja.toObject();
        hojaConRemitos.envios = hojaConRemitos.envios.map(envio => {
            const remito = remitos.find(r => r.envio.toString() === envio._id.toString());
            return {
                ...envio,
                remitoNumero: remito?.numeroRemito || null
            };
        });

        res.status(200).json(hojaConRemitos);
    } catch (error) {
        console.error("❌ Error al obtener hoja por ID:", error);
        res.status(500).json({ error: "Error al obtener hoja" });
    }
};


const { generatePDF } = require("../../utils/pdfService");
const fs = require("fs");
const path = require("path");

const exportarHojaPDF = async (req, res) => {
    try {
        const { hojaId } = req.params;

        const hoja = await HojaReparto.findById(hojaId)
            .populate("ruta chofer vehiculo")
            .populate({
                path: "envios",
                populate: [
                    { path: "localidadDestino", select: "nombre" },
                    { path: "clienteRemitente", select: "nombre" },
                    { path: "destinatario", select: "nombre direccion" },
                    { path: "encomienda" }
                ]
            });

        if (!hoja) {
            logger.warn("⚠️ Hoja de reparto no encontrada para exportar:", { hojaId });
            return res.status(404).json({ error: "Hoja de reparto no encontrada" });
        }

        const remitos = await Remito.find({ envio: { $in: hoja.envios.map(e => e._id) } });

        // Imagen de fondo en base64
        const fondoPath = path.join(process.cwd(), "templates", "Copia de HOJADEREPARTO.png");
        const fondoBase64 = fs.readFileSync(fondoPath, "base64");

        // Preparar datos para Handlebars
        const data = {
            imagen_fondo: `data:image/png;base64,${fondoBase64}`,
            nro: hoja.numeroHoja || "-",
            fecha: new Date(hoja.fecha).toLocaleDateString("es-AR"),
            chofer: hoja.chofer?.nombre || "-",
            dniChofer: hoja.chofer?.dni || "-",
            vehiculo: hoja.vehiculo?.patente || "-",
            marcaVehiculo: hoja.vehiculo?.marca || "-",
            modeloVehiculo: hoja.vehiculo?.modelo || "-",
            ruta: hoja.ruta?.codigo || "-",
            remitos: hoja.envios.map(envio => {
                const remito = remitos.find(r => r.envio.toString() === envio._id.toString());
                return {
                    numeroRemito: remito?.numeroRemito || "-",
                    nombreRemitente: envio.clienteRemitente?.nombre || "-",
                    nombreDestinatario: envio.destinatario?.nombre || "-",
                    localidad: envio.localidadDestino?.nombre || "-",
                    direccion: envio.destinatario?.direccion || "-",
                    cantidad: envio.encomienda?.cantidad || "-"
                };
            })
        };

        const fileName = `Hoja de Reparto - ${hoja.numeroHoja || "sin-numero"}.pdf`;
        const outputPath = path.join(process.cwd(), "pdfs", "hojasReparto", fileName);

        await generatePDF("template.html", data, outputPath);

        return res.download(outputPath, fileName);

    } catch (error) {
        logger.error("❌ Error al generar PDF de hoja de reparto:", error);
        res.status(500).json({ error: "Error al generar el PDF" });
    }
};





const obtenerHojaRepartoDeHoy = async (req, res) => {
    try {
        const { choferId } = req.params;


        // Buscar el chofer asociado a este usuario
        const chofer = await Chofer.findOne({ usuario: choferId });

        if (!chofer) {
            return res.status(404).json({ msg: "Chofer no encontrado para este usuario." });
        }


        // Definir rango de hoy
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const manana = new Date();
        manana.setHours(23, 59, 59, 999);

        // Buscar hoja de reparto para ese chofer en el día de hoy
        const hoja = await HojaReparto.findOne({
            chofer: chofer._id,
            fecha: { $gte: hoy, $lte: manana },
        })
            .populate({
                path: "envios",
                populate: [
                    { path: "destinatario" },
                    { path: "localidadDestino" },
                    { path: "encomienda" }
                ]
            })
            .lean();

        if (!hoja) {
            console.log("⚠️ Hoja de reparto NO encontrada para hoy");
            return res.status(404).json({ msg: "No hay hoja de reparto asignada para hoy." });
        }

        console.log("✅ Hoja de reparto encontrada:", hoja.numeroHoja);

        res.status(200).json(hoja);
    } catch (error) {
        console.error("❌ Error al obtener hoja de reparto:", error);
        res.status(500).json({ msg: "Error al obtener la hoja de reparto." });
    }
};

const obtenerHojasPorChofer = async (req, res) => {
    try {
        const { id } = req.params;

        // Buscar el chofer relacionado al usuario
        const chofer = await Chofer.findOne({ usuario: id });

        if (!chofer) {
            return res.status(404).json({ msg: "Chofer no encontrado para este usuario." });
        }

        // Definir rango del día de hoy
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const manana = new Date();
        manana.setHours(23, 59, 59, 999);

        // Buscar hojas de reparto asignadas al chofer para hoy
        const hojas = await HojaReparto.find({
            chofer: chofer._id,
            fecha: { $gte: hoy, $lte: manana },
            estado: { $ne: "pendiente" }
        })
            .populate("ruta chofer vehiculo")
            .populate({
                path: "envios",
                populate: [
                    { path: "destinatario", select: "nombre direccion" },
                    { path: "localidadDestino", select: "nombre" },
                    { path: "encomienda" }
                ]
            })
            .lean();

        if (!hojas.length) {
            return res.status(404).json({ msg: "No hay hojas de reparto asignadas para hoy." });
        }

        res.status(200).json({ hojas });
    } catch (error) {
        console.error("❌ Error al obtener hojas de reparto del chofer:", error);
        res.status(500).json({ msg: "Error al obtener hojas de reparto." });
    }
};
const cerrarHojasVencidas = async (fechaReferencia) => {
    try {
        // Definir rango desde 00:00 hasta 23:59 hora ARGENTINA (GMT-3), expresado en UTC
        const inicio = new Date(fechaReferencia);
        inicio.setUTCHours(3, 0, 0, 0); // 00:00 AR = 03:00 UTC

        const fin = new Date(fechaReferencia);
        fin.setUTCHours(26, 59, 59, 999); // 23:59 AR = 02:59 del día siguiente UTC

        console.log("🔁 Buscando hojas vencidas entre:", inicio.toISOString(), "y", fin.toISOString());

        const hojas = await HojaReparto.find({
            estado: "en reparto",
            fecha: { $gte: inicio, $lte: fin },
        }).populate("envios");

        for (const hoja of hojas) {
            for (const envio of hoja.envios) {
                if (envio.estado === "en reparto") {
                    console.log(`📦 Envío ${envio._id} sigue en reparto → reagendando`);
                    envio.estado = "reagendado";
                    envio.historialEstados.push({
                        estado: "reagendado",
                        sucursal: "Casa Central – Córdoba",
                    });
                    await envio.save();
                }
            }

            hoja.estado = "cerrada";
            hoja.cerradaAutomaticamente = true;
            hoja.historialMovimientos.push({
                usuario: null,
                accion: "cerrado automático por vencimiento de fecha",
            });
            await hoja.save();
            console.log(`✅ Hoja ${hoja.numeroHoja} cerrada automáticamente`);
        }
    } catch (error) {
        console.error("❌ Error al cerrar hojas vencidas:", error);
    }
};



const cerrarHojaManualmente = async (req, res) => {
    try {
        const { hojaId } = req.body;

        const hoja = await HojaReparto.findById(hojaId).populate("envios");

        if (!hoja) {
            return res.status(404).json({ error: "Hoja no encontrada" });
        }

        if (hoja.estado !== "en reparto") {
            return res.status(400).json({ error: "La hoja no está en estado 'en reparto'" });
        }

        for (const envio of hoja.envios) {
            if (envio.estado === "en reparto") {
                envio.estado = "reagendado";
                envio.historialEstados.push({
                    estado: "reagendado",
                    sucursal: "Casa Central – Córdoba",
                });
                await envio.save();
            }
        }

        hoja.estado = "cerrada";
        hoja.cerradaAutomaticamente = true;

        // Capturar información del usuario que fuerza el cierre
        const Usuario = require("../../models/Usuario");
        const usuario = req.usuario?.id ? await Usuario.findById(req.usuario.id) : null;

        hoja.historialMovimientos.push({
            usuario: req.usuario?.id || null,
            accion: `Cierre forzado de hoja por ${usuario?.nombre || 'sistema'}`,
        });

        await hoja.save();

        res.status(200).json({ mensaje: "Hoja cerrada correctamente", hoja });
    } catch (error) {
        console.error("❌ Error al cerrar hoja manualmente:", error);
        res.status(500).json({ error: "Error al cerrar hoja manualmente" });
    }
};

const consultarHojasPaginado = async (req, res) => {
    try {
        const pagina = parseInt(req.query.pagina) || 0;
        const limite = parseInt(req.query.limite) || 10;
        const busqueda = req.query.busqueda || "";
        const { desde, hasta, estado, proveedorId } = req.query; // New filters

        // Filtrar SOLO hojas confirmadas o cerradas (no pendientes) por defecto, pero permitir override
        const filtro = {};
        if (estado && estado !== "all") {
            filtro.estado = estado;
        } else if (!estado) {
            filtro.estado = { $ne: "pendiente" };
        }

        if (busqueda) {
            filtro.numeroHoja = { $regex: busqueda, $options: "i" };
        }

        // Filtro por Proveedor (Snapshot)
        if (proveedorId) {
            filtro.proveedor = proveedorId;
        }

        // Filtro de Fechas
        if (desde || hasta) {
            filtro.fecha = {};
            if (desde) filtro.fecha.$gte = new Date(desde);
            if (hasta) {
                const dateHasta = new Date(hasta);
                dateHasta.setHours(23, 59, 59, 999); // End of day
                filtro.fecha.$lte = dateHasta;
            }
        }

        const total = await HojaReparto.countDocuments(filtro);

        const hojas = await HojaReparto.find(filtro)
            .sort({ fecha: -1 })
            .skip(pagina * limite)
            .limit(limite)
            .populate({
                path: "ruta",
                populate: [
                    { path: "choferAsignado", populate: { path: "usuario", select: "nombre dni" } },
                    { path: "vehiculoAsignado" }
                ]
            })
            .populate("vehiculo")
            .populate("proveedor")
            .populate({
                path: "chofer",
                populate: { path: "usuario", select: "nombre dni" }
            })
            .populate({
                path: "envios",
                populate: [
                    { path: "localidadDestino", select: "nombre" },
                    { path: "destinatario", select: "nombre direccion" },
                    { path: "encomienda" }
                ]
            });

        const idsEnvios = hojas.flatMap(h => h.envios.map(e => e._id));
        const remitos = await Remito.find({ envio: { $in: idsEnvios } });

        const hojasConRemitos = hojas.map(hoja => {
            const hojaObj = hoja.toObject();
            hojaObj.envios = hojaObj.envios.map(envio => {
                const remitoEncontrado = remitos.find(r => r.envio.toString() === envio._id.toString());
                return {
                    ...envio,
                    remitoNumero: remitoEncontrado?.numeroRemito || null,
                };
            });
            return hojaObj;
        });

        // Detección de duplicados (misma ruta y fecha)
        const hojasConDuplicados = await Promise.all(hojasConRemitos.map(async (hoja) => {
            if (!hoja.ruta?._id) return { ...hoja, esDuplicada: false };

            const fechaInicio = new Date(hoja.fecha);
            fechaInicio.setHours(0, 0, 0, 0);
            const fechaFin = new Date(hoja.fecha);
            fechaFin.setHours(23, 59, 59, 999);

            const count = await HojaReparto.countDocuments({
                ruta: hoja.ruta._id,
                fecha: { $gte: fechaInicio, $lte: fechaFin },
                _id: { $ne: hoja._id }
            });

            return { ...hoja, esDuplicada: count > 0 };
        }));

        res.status(200).json({
            total,
            hojas: hojasConDuplicados
        });
    } catch (error) {
        console.error("❌ Error en consulta paginada de hojas:", error);
        res.status(500).json({ error: "Error al consultar hojas de reparto paginadas" });
    }
};




// Motor de Generación Silenciosa (Job Nocturno 00:01 AR)
const generarHojasAutomaticas = async (fechaReferencia, esFeriadoNacional = false) => {
    try {
        const logger = require("../../utils/logger");

        // 1. Buscar todas las rutas activas
        const rutas = await Ruta.find({ activa: true });

        logger.info(`🗺️ Iniciando generación automática para ${rutas.length} rutas activas.`);

        const resultados = { creadas: 0, saltadas: 0, errores: 0 };

        // Calcular día de la semana (0=Domingo en JS, convertimos a 0=Lunes)
        const diaSemanaJS = fechaReferencia.getDay();
        const diaIndex = diaSemanaJS === 0 ? 6 : diaSemanaJS - 1; // 0=Lun, 1=Mar, ..., 6=Dom
        const diasNombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        logger.info(`📅 Día de la semana: ${diasNombres[diaIndex]} (índice ${diaIndex})`);

        for (const ruta of rutas) {
            try {
                // 2. Definir "Hoy" en formato Date (00:00:00) para la comparación
                const inicioDia = new Date(fechaReferencia);
                inicioDia.setHours(0, 0, 0, 0);
                const finDia = new Date(fechaReferencia);
                finDia.setHours(23, 59, 59, 999);

                // 3. Verificar si ya existe una hoja para esta ruta y esta fecha
                const existe = await HojaReparto.findOne({
                    ruta: ruta._id,
                    fecha: { $gte: inicioDia, $lte: finDia }
                });

                if (existe) {
                    logger.info(`⏭️ Saltando ruta ${ruta.codigo}: Ya existe una hoja para hoy.`);
                    resultados.saltadas++;
                    continue;
                }

                // 4. VALIDAR FRECUENCIA - Verificar si la ruta sale hoy
                if (ruta.frecuencia?.diasSemana && Array.isArray(ruta.frecuencia.diasSemana)) {
                    const debeGenerarHoy = ruta.frecuencia.diasSemana[diaIndex];

                    if (!debeGenerarHoy) {
                        logger.info(`📅 Saltando ruta ${ruta.codigo}: No corresponde hoy (frecuencia: ${ruta.frecuencia.textoLegible || 'Sin configurar'})`);
                        resultados.saltadas++;
                        continue;
                    }
                }

                // 5. Crear la Hoja de Reparto (Solo Estructura, sin envíos automáticos)
                const nuevaHoja = new HojaReparto({
                    numeroHoja: null, // Se asigna al confirmar manualmente
                    fecha: inicioDia,
                    ruta: ruta._id,
                    chofer: ruta.choferAsignado,
                    vehiculo: ruta.vehiculoAsignado,
                    envios: [], // ⚠️ Orden: Sin confirmación automática de encomiendas
                    estado: 'pendiente',
                    observaciones: `Generada automáticamente por el sistema (Motor Silencioso).`,
                    // Snapshot de precios y KMs (Fase 1 Plan Maestro)
                    kilometrosEstimados: ruta.kilometrosEstimados || 0,
                    precioKm: ruta.precioKm || 0,
                    proveedor: ruta.proveedorAsignado || null,
                    historialMovimientos: [{
                        usuario: null, // Sistema
                        accion: 'generación automática silenciosa'
                    }]
                });

                await nuevaHoja.save();
                logger.info(`✅ Hoja generada para ruta ${ruta.codigo}.`);
                resultados.creadas++;

            } catch (err) {
                logger.error(`❌ Error generando hoja para ruta ${ruta.codigo}: ${err.message}`);
                resultados.errores++;
            }
        }

        return resultados;
    } catch (error) {
        console.error("❌ Error crítico en generarHojasAutomaticas:", error);
    }
};

// Actualizar datos de la hoja (Fase 1 - Quick Edit) con Auditoría
const actualizarHoja = async (req, res) => {
    try {
        const { id } = req.params;
        const { chofer, vehiculo } = req.body;

        // Obtener hoja original para comparar cambios
        const hojaOriginal = await HojaReparto.findById(id)
            .populate("chofer vehiculo")
            .populate({ path: "ruta", populate: { path: "choferAsignado vehiculoAsignado" } });

        if (!hojaOriginal) return res.status(404).json({ error: "Hoja no encontrada" });

        // Si la hoja está cerrada, registrar auditoría
        if (hojaOriginal.estado === 'cerrada') {
            const Usuario = require("../../models/Usuario");
            const Chofer = require("../../models/Chofer");
            const Vehiculo = require("../../models/Vehiculo");

            const usuario = await Usuario.findById(req.usuario.id);
            const cambios = [];

            // Detectar cambio de chofer
            if (chofer && chofer !== (hojaOriginal.chofer?._id?.toString() || hojaOriginal.chofer?.toString())) {
                const choferAnterior = hojaOriginal.chofer
                    ? await Chofer.findById(hojaOriginal.chofer).populate("usuario")
                    : null;
                const choferNuevo = await Chofer.findById(chofer).populate("usuario");

                const nombreAnterior = choferAnterior?.usuario?.nombre || "Sin asignar";
                const nombreNuevo = choferNuevo?.usuario?.nombre || "Desconocido";

                cambios.push(`chofer cambiado de "${nombreAnterior}" a "${nombreNuevo}"`);
            }

            // Detectar cambio de vehículo
            if (vehiculo && vehiculo !== (hojaOriginal.vehiculo?._id?.toString() || hojaOriginal.vehiculo?.toString())) {
                const vehiculoAnterior = hojaOriginal.vehiculo
                    ? await Vehiculo.findById(hojaOriginal.vehiculo)
                    : null;
                const vehiculoNuevo = await Vehiculo.findById(vehiculo);

                const patenteAnterior = vehiculoAnterior?.patente || "Sin asignar";
                const patenteNueva = vehiculoNuevo?.patente || "Desconocido";

                cambios.push(`vehículo cambiado de "${patenteAnterior}" a "${patenteNueva}"`);
            }

            // Registrar en historial si hubo cambios
            if (cambios.length > 0) {
                hojaOriginal.historialMovimientos.push({
                    usuario: req.usuario.id,
                    accion: `Edición post-cierre por ${usuario.nombre}: ${cambios.join(", ")}`
                });
            }
        }

        // Actualizar hoja
        Object.assign(hojaOriginal, req.body);
        await hojaOriginal.save();

        const hojaActualizada = await HojaReparto.findById(id)
            .populate("ruta chofer vehiculo");

        res.json(hojaActualizada);
    } catch (error) {
        console.error("❌ Error al actualizar hoja:", error);
        res.status(500).json({ error: "Error al actualizar la hoja" });
    }
};

// 🆕 FASE 5: Buscar hoja existente por ruta y fecha
const buscarHojaPorRutaFecha = async (req, res) => {
    try {
        const { rutaId, fecha } = req.query;

        if (!rutaId || !fecha) {
            return res.status(400).json({ error: 'rutaId y fecha son requeridos' });
        }

        // Parsear fecha
        const fechaBusqueda = new Date(fecha);
        const inicioDia = new Date(fechaBusqueda);
        inicioDia.setHours(0, 0, 0, 0);
        const finDia = new Date(fechaBusqueda);
        finDia.setHours(23, 59, 59, 999);

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

        logger.info(`✅ Hoja encontrada: ${hoja._id}, Envíos disponibles: ${enviosConRemito.length}`);

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

module.exports = {
    crearHojaPreliminar,
    confirmarHoja,
    consultarHojas,
    consultarHojasPaginado,
    obtenerHojaPorId,
    exportarHojaPDF,
    obtenerHojaRepartoDeHoy,

    obtenerHojasPorChofer,
    cerrarHojasVencidas,
    cerrarHojaManualmente,
    generarHojasAutomaticas,
    actualizarHoja,
    buscarHojaPorRutaFecha  // 🆕 FASE 5
};
