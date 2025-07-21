const HojaReparto = require('../models/HojaReparto');
const Envio = require('../models/Envio');
const Remito = require('../models/Remito');
const Ruta = require("../models/Ruta");
const { enviarNotificacionEstado } = require("../utils/emailService");
const Chofer = require("../models/Chofer"); // Agregar arriba si no está



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

        // Mostrar los datos en consola por seguridad
        console.dir(enviosConRemito[0], { depth: null });

        // Respuesta
        res.status(201).json({
            hoja,
            envios: enviosConRemito,
        });

    } catch (error) {
        console.error('❌ Error en hoja preliminar:', error);
        res.status(500).json({ error: 'Error al crear hoja preliminar' });
    }
};



// Confirmar hoja de reparto
const confirmarHoja = async (req, res) => {
    try {
        const { hojaId, usuarioId, envios, choferId, vehiculoId } = req.body;

        console.log("🟡 Confirmando hoja con datos recibidos:", {
            hojaId, usuarioId, envios, choferId, vehiculoId
        });

        const hoja = await HojaReparto.findById(hojaId);
        if (!hoja) {
            console.log("❌ Hoja no encontrada con ID:", hojaId);
            return res.status(404).json({ error: 'Hoja no encontrada' });
        }

        if (choferId) hoja.chofer = choferId;
        if (vehiculoId) hoja.vehiculo = vehiculoId;

        // Validar si los envíos "en reparto" ya están asignados a otra hoja "en reparto"
        for (const envioId of envios) {
            const envio = await Envio.findById(envioId);
            if (!envio) {
                console.log("⚠️ Envío no encontrado con ID:", envioId);
                continue;
            }

            if (envio.estado === "en reparto") {
                const yaAsignado = await HojaReparto.findOne({
                    _id: { $ne: hojaId },
                    estado: 'en reparto',
                    envios: envioId,
                });

                if (yaAsignado) {
                    console.log(`❌ El envío ${envioId} ya está asignado a otra hoja en reparto (${yaAsignado._id})`);
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
            console.log("✅ Envío actualizado:", envio._id);

            // Notificación
            enviarNotificacionEstado(envio, "en_reparto").catch((err) => {
                console.error("❌ Error al enviar notificación de estado:", err);
            });
        }

        hoja.historialMovimientos.push({
            usuario: usuarioId,
            accion: 'confirmación de hoja',
        });

        await hoja.save();

        const hojaFinal = await HojaReparto.findById(hoja._id)
            .populate('ruta chofer vehiculo envios');

        console.log("✅ Hoja confirmada correctamente:", hojaFinal.numeroHoja);

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
                    // ❌ remito no se puede hacer populate porque no está en el modelo
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


const puppeteer = require("puppeteer");
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
            return res.status(404).json({ error: "Hoja de reparto no encontrada" });
        }

        const remitos = await Remito.find({ envio: { $in: hoja.envios.map(e => e._id) } });

        // Leer HTML
        const templatePath = path.join(__dirname, "../templates/template.html");
        let html = fs.readFileSync(templatePath, "utf8");

        // Imagen de fondo en base64
        const fondoPath = path.join(__dirname, "../templates/Copia de HOJADEREPARTO.png");
        const fondoBase64 = fs.readFileSync(fondoPath, "base64");
        const fondoDataUrl = `data:image/png;base64,${fondoBase64}`;

        // Armar tabla con encabezados
        const tablaRemitos = `
        <thead></thead>
        <tbody>
          ${hoja.envios.map((envio, idx) => {
            const remito = remitos.find(r => r.envio.toString() === envio._id.toString());
            return `
              <tr>
                <td>${remito?.numeroRemito || "-"}</td>
                <td>${envio.clienteRemitente?.nombre || "-"}</td>
                <td>${envio.destinatario?.nombre || "-"}</td>
                <td>${envio.localidadDestino?.nombre || "-"}</td>
                <td>${envio.destinatario?.direccion || "-"}</td>
                <td>${envio.encomienda?.cantidad || "-"}</td>
              </tr>
            `;
        }).join("")}
        </tbody>
      `;

        // Reemplazar datos en plantilla
        html = html
            .replace("{{imagen_fondo}}", fondoDataUrl)
            .replace("{{nro}}", hoja.numeroHoja || "-")
            .replace("{{fecha}}", new Date(hoja.fecha).toLocaleDateString("es-AR"))
            .replace("{{chofer}}", hoja.chofer?.nombre || "-")
            .replace("{{vehiculo}}", hoja.vehiculo?.patente || "-")
            .replace("{{ruta}}", hoja.ruta?.codigo || "-")
            .replace("{{tablaRemitos}}", tablaRemitos)
            .replace("{{dniChofer}}", hoja.chofer?.dni || "-")
            .replace("{{marcaVehiculo}}", hoja.vehiculo?.marca || "-")
            .replace("{{modeloVehiculo}}", hoja.vehiculo?.modelo || "-");


        // Generar PDF con Puppeteer
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });

        const fileName = `Hoja de Reparto - ${hoja.numeroHoja || "sin-numero"}.pdf`;
        const pdfPath = path.join(__dirname, "../pdfs/hojasReparto", fileName);

        await page.pdf({ path: pdfPath, format: "A4", printBackground: true });
        await browser.close();

        return res.download(pdfPath, fileName);

    } catch (error) {
        console.error("❌ Error al generar PDF:", error);
        res.status(500).json({ error: "Error al generar el PDF" });
    }
};



const testPDF = async (req, res) => {
    try {
        const templatePath = path.join(__dirname, "../templates/test-template.html");
        let html = fs.readFileSync(templatePath, "utf8");

        const nroHoja = "HR-SDA-TEST-00001";
        html = html.replace("{{nro}}", nroHoja);

        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const page = await browser.newPage();

        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfPath = path.join(__dirname, "../pdfs/test-hoja.pdf");
        await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });

        await browser.close();

        res.status(200).json({ message: "PDF generado", path: `/pdfs/test-hoja.pdf` });
    } catch (error) {
        console.error("❌ Error:", error);
        res.status(500).json({ error: "No se pudo generar el PDF" });
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

        // Filtrar SOLO hojas confirmadas o cerradas (no pendientes)
        const filtro = {
            estado: { $ne: "pendiente" }
        };

        if (busqueda) {
            filtro.numeroHoja = { $regex: busqueda, $options: "i" };
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
    testPDF,
    obtenerHojasPorChofer,
    cerrarHojasVencidas,
    cerrarHojaManualmente
};
