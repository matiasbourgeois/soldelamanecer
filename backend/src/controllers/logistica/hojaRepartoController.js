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

        // Actualizar estado de envíos
        for (const envioId of envios) {
            const envio = await Envio.findById(envioId).populate("clienteRemitente", "nombre email");
            if (!envio) {
                console.log("⚠️ Envío no encontrado con ID:", envioId);
                continue;
            }

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
        hoja.historialMovimientos.push({
            usuario: null, // si lo hacés desde admin, podés enviar un ID
            accion: "cierre forzado de hoja",
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
        const { desde, hasta, estado } = req.query; // New filters

        // Filtrar SOLO hojas confirmadas o cerradas (no pendientes) par defecto, pero permitir override
        const filtro = {
            estado: estado ? estado : { $ne: "pendiente" }
        };

        if (busqueda) {
            filtro.numeroHoja = { $regex: busqueda, $options: "i" };
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
            .populate("ruta vehiculo")
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

        res.status(200).json({
            total,
            hojas: hojasConRemitos
        });
    } catch (error) {
        console.error("❌ Error en consulta paginada de hojas:", error);
        res.status(500).json({ error: "Error al consultar hojas de reparto paginadas" });
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
    cerrarHojaManualmente
};
