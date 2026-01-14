const fs = require("fs");
const path = require("path");
const Remito = require("../../models/Remito");
const Envio = require("../../models/Envio");
const Usuario = require("../../models/Usuario");
const mongoose = require("mongoose");




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
    console.error("Error al crear remito:", error);
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
    console.error("❌ Error al obtener remito:", error.message);
    res.status(500).json({ error: "Error al obtener remito" });
  }
};

const puppeteer = require("puppeteer");

const generarRemitoPDF = async (req, res) => {
  try {
    let envioId = req.params.envioId;

    // Normalización segura del envioId
    if (envioId && typeof envioId === "object") {
      if (envioId._id) {
        envioId = envioId._id.toString();
      } else if (envioId.toString) {
        envioId = envioId.toString();
      }
    }

    if (!mongoose.Types.ObjectId.isValid(envioId)) {
      console.error("❌ ID de envío inválido:", envioId);
      if (res && typeof res.status === "function") {
        return res.status(400).json({ error: "ID de envío inválido" });
      } else {
        return;
      }
    }

    const remito = await Remito.findOne({ envio: envioId })
      .populate("clienteRemitente")
      .populate("destinatario")
      .populate("localidadDestino")
      .populate("envio");

    if (!remito) {
      if (res && typeof res.status === "function") {
        return res.status(404).json({ error: "Remito no encontrado" });
      } else {
        console.error("❌ Remito no encontrado");
        return;
      }
    }

    const encomienda = remito.encomienda;
    const dimensiones = `${encomienda.dimensiones.largo}x${encomienda.dimensiones.ancho}x${encomienda.dimensiones.alto} cm`;

    const templatePath = path.join(process.cwd(), "templates", "template-remito.html");
    let html = fs.readFileSync(templatePath, "utf8");

    const fondoPath = path.join(process.cwd(), "templates", "remito-fondo.png");
    const fondoBase64 = fs.readFileSync(fondoPath, "base64");
    const fondoDataUrl = `data:image/png;base64,${fondoBase64}`;

    html = html
      .replace("{{imagen_fondo}}", fondoDataUrl)
      .replace("{{numeroRemito}}", remito.numeroRemito || "-")
      .replace("{{fecha}}", new Date(remito.fechaEmision).toLocaleDateString("es-AR"))
      .replace("{{nombreRemitente}}", remito.clienteRemitente?.nombre || "-")
      .replace("{{emailRemitente}}", remito.clienteRemitente?.email || "-")
      .replace("{{nombreDestinatario}}", remito.destinatario?.nombre || "-")
      .replace("{{dniDestinatario}}", remito.destinatario?.dni || "-")
      .replace("{{direccionDestinatario}}", remito.destinatario?.direccion || "-")
      .replace("{{telefonoDestinatario}}", remito.destinatario?.telefono || "-")
      .replace("{{emailDestinatario}}", remito.destinatario?.email || "-")
      .replace("{{localidadDestinatario}}", `${remito.localidadDestino?.nombre || "-"} (${remito.destinatario?.provincia || "-"})`)
      .replace("{{tipo}}", encomienda?.tipoPaquete || "-")
      .replace("{{peso}}", `${encomienda?.peso || 0} kg`)
      .replace("{{dimensiones}}", dimensiones)
      .replace("{{cantidad}}", encomienda?.cantidad || "-")
      .replace("{{numeroSeguimiento}}", remito.envio?.numeroSeguimiento || "-");

    const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const fileName = `remito-${remito.numeroRemito}.pdf`;
    const filePath = path.join(process.cwd(), "pdfs", fileName);

    await page.pdf({
      path: filePath,
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    // Si es una ruta HTTP, descargamos el archivo
    if (res && typeof res.status === "function") {
      res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
      res.setHeader("Content-Type", "application/pdf");
      return res.sendFile(filePath);
    }

    // Si es llamado internamente, solo logueamos
    console.log(`✅ Remito PDF generado correctamente: ${filePath}`);
    return filePath;

  } catch (error) {
    console.error("❌ Error al generar remito PDF:", error);
    if (res && typeof res.status === "function") {
      return res.status(500).json({ error: "Error al generar remito PDF" });
    }
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
    console.error("❌ Error al obtener remitos:", error.message);
    res.status(500).json({ error: "Error al obtener remitos" });
  }
};



module.exports = {
  crearRemito,
  obtenerRemitoPorEnvio,
  generarRemitoPDF,
  obtenerRemitosConFiltros
};
