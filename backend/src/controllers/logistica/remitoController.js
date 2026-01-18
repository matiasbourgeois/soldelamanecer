const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const Envio = require("../../models/Envio");
const Remito = require("../../models/Remito");
const Usuario = require("../../models/Usuario");
const logger = require("../../utils/logger");
const { generatePDF } = require("../../utils/pdfService");




const crearRemito = async (req, res) => {
  try {
    const { envioId } = req.body;

    const envio = await Envio.findById(envioId)
      .populate({ path: "clienteRemitente", model: Usuario })
      .populate("destinatario")
      .populate("localidadDestino");

    if (!envio) {
      return res.status(404).json({ error: "Envío no encontrado" });
    }

    // 🔢 Buscar el último remito existente
    const ultimoRemito = await Remito.findOne({}).sort({ createdAt: -1 });
    let numeroRemito = "SDA-000001";

    if (ultimoRemito && ultimoRemito.numeroRemito) {
      const ultimoNumero = parseInt(ultimoRemito.numeroRemito.split("-")[1], 10);
      const nuevoNumero = ultimoNumero + 1;
      numeroRemito = `SDA-${String(nuevoNumero).padStart(6, "0")}`;
    }

    // 🧾 Crear remito con número autogenerado
    const nuevoRemito = new Remito({
      envio: envio._id,
      clienteRemitente: envio.clienteRemitente._id,
      destinatario: envio.destinatario._id,
      localidadDestino: envio.localidadDestino._id,
      encomienda: envio.encomienda,
      numeroRemito, // 👈 lo nuevo
      fechaEmision: new Date(),
    });

    await nuevoRemito.save();

    // 🔄 Asociar remito al envío
    envio.remito = nuevoRemito._id;
    await envio.save();

    res.status(201).json(nuevoRemito);
  } catch (error) {
    logger.error("Error al crear remito:", error);
    res.status(500).json({ error: "Error al crear remito" });
  }
};


const obtenerRemitoPorEnvio = async (req, res) => {
  try {
    const { envioId } = req.params;

    const remito = await Remito.findOne({ envio: envioId.toString() })
      .populate("clienteRemitente")
      .populate("destinatario")
      .populate("localidadDestino");

    if (!remito) {
      console.warn("⚠️ Remito no encontrado");
      return res.status(404).json({ error: "Remito no encontrado" });
    }

    res.json(remito);
  } catch (error) {
    logger.error("❌ Error al obtener remito:", error);
    res.status(500).json({ error: "Error al obtener remito" });
  }
};

const generarRemitoPDF = async (req, res) => {
  try {
    let envioId = req.params.envioId;

    // Normalización del envioId
    if (envioId && typeof envioId === "object" && envioId._id) {
      envioId = envioId._id.toString();
    }

    if (!mongoose.Types.ObjectId.isValid(envioId)) {
      logger.error("❌ ID de envío inválido:", { envioId });
      if (res?.status) return res.status(400).json({ error: "ID de envío inválido" });
      return;
    }

    const remito = await Remito.findOne({ envio: envioId })
      .populate("clienteRemitente destinatario localidadDestino envio");

    if (!remito) {
      logger.warn("⚠️ Remito no encontrado para el envío:", { envioId });
      if (res?.status) return res.status(404).json({ error: "Remito no encontrado" });
      return;
    }

    // Preparar datos para Handlebars
    const fondoPath = path.join(process.cwd(), "templates", "remito-fondo.png");
    const fondoBase64 = fs.readFileSync(fondoPath, "base64");

    const data = {
      imagen_fondo: `data:image/png;base64,${fondoBase64}`,
      numeroRemito: remito.numeroRemito || "-",
      numeroSeguimiento: remito.envio?.numeroSeguimiento || "-",
      fecha: new Date(remito.fechaEmision).toLocaleDateString("es-AR"),
      nombreRemitente: remito.clienteRemitente?.nombre || "-",
      emailRemitente: remito.clienteRemitente?.email || "-",
      nombreDestinatario: remito.destinatario?.nombre || "-",
      dniDestinatario: remito.destinatario?.dni || "-",
      direccionDestinatario: remito.destinatario?.direccion || "-",
      telefonoDestinatario: remito.destinatario?.telefono || "-",
      emailDestinatario: remito.destinatario?.email || "-",
      localidadDestinatario: `${remito.localidadDestino?.nombre || "-"} (${remito.destinatario?.provincia || "-"})`,
      tipo: remito.encomienda?.tipoPaquete || "-",
      peso: `${remito.encomienda?.peso || 0} kg`,
      dimensiones: `${remito.encomienda?.dimensiones?.largo || 0}x${remito.encomienda?.dimensiones?.ancho || 0}x${remito.encomienda?.dimensiones?.alto || 0} cm`,
      cantidad: remito.encomienda?.cantidad || "-"
    };

    const fileName = `remito-${remito.numeroRemito}.pdf`;
    const outputPath = path.join(process.cwd(), "pdfs", fileName);

    await generatePDF("template-remito.html", data, outputPath);

    if (res?.status) {
      res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
      res.setHeader("Content-Type", "application/pdf");
      return res.sendFile(outputPath);
    }

    return outputPath;

  } catch (error) {
    logger.error("❌ Error al generar remito PDF:", error);
    if (res?.status) return res.status(500).json({ error: "Error al generar remito PDF" });
  }
};


const obtenerRemitosConFiltros = async (req, res) => {
  try {
    const pagina = parseInt(req.query.pagina) || 0;
    const limite = parseInt(req.query.limite) || 10;
    const numero = req.query.numero?.trim() || "";

    let desde = req.query.desde ? new Date(req.query.desde) : null;
    let hasta = req.query.hasta ? new Date(req.query.hasta) : null;

    // Validation: Ensure dates are valid
    if (desde && isNaN(desde.getTime())) desde = null;
    if (hasta && isNaN(hasta.getTime())) hasta = null;

    const filtro = {};

    if (numero) {
      filtro.numeroRemito = { $regex: numero, $options: "i" };
    }

    if (desde || hasta) {
      filtro.fechaEmision = {};
      if (desde) filtro.fechaEmision.$gte = desde;
      if (hasta) filtro.fechaEmision.$lte = hasta;
    }

    const total = await Remito.countDocuments(filtro);

    const remitos = await Remito.find(filtro)
      .skip(pagina * limite)
      .limit(limite)
      .sort({ fechaEmision: -1 })
      .populate("clienteRemitente")
      .populate("destinatario")
      .populate("localidadDestino")
      .populate("envio");

    res.json({
      total,
      resultados: remitos,
    });
  } catch (error) {
    logger.error("❌ Error al obtener remitos:", error);
    res.status(500).json({ error: "Error al obtener remitos" });
  }
};



module.exports = {
  crearRemito,
  obtenerRemitoPorEnvio,
  generarRemitoPDF,
  obtenerRemitosConFiltros
};
