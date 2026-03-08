const Envio = require("../../models/Envio");
const Remito = require("../../models/Remito");
const Usuario = require("../../models/Usuario");
const logger = require("../../utils/logger");
const { crearRemito } = require("./remitoController");
const { generarRemitoPDF } = require("./remitoController");
const { enviarNotificacionEstado } = require("../../utils/emailService");

const intentarAutoCerrarHoja = async (hojaId) => {
  if (!hojaId) return;
  try {
    const HojaReparto = require("../../models/HojaReparto");

    // Cargar hoja con envíos populateados
    const hoja = await HojaReparto.findById(hojaId).populate('envios');

    if (hoja && hoja.estado === "en reparto") {
      // Verificar si queda ALGÚN envío "en reparto"
      const quedanPendientes = hoja.envios.some(e => e.estado === "en reparto");

      if (!quedanPendientes) {
        hoja.estado = "cerrada";
        hoja.cerradaAutomaticamente = true;
        hoja.historialMovimientos.push({
          usuario: null,
          accion: "Cierre Automático Reactivo: El chofer completó todos los envíos de la hoja."
        });
        await hoja.save();
        logger.info(`✅ Hoja ${hoja.numeroHoja} auto-cerrada exitosamente tras procesar el último paquete.`);
      }
    }
  } catch (error) {
    logger.error("❌ Error al intentar auto-cerrar hoja:", error);
  }
};

// 📦 POST: Crear Envío y Remito
const crearEnvio = async (req, res) => {
  try {
    const {
      clienteRemitente,
      destinatario,
      encomienda,
      localidadDestino,
      usuarioCreador,
      sucursalOrigen,
    } = req.body;

    const numeroSeguimiento = await generarNumeroSeguimiento();

    const nuevoEnvio = new Envio({
      clienteRemitente,
      destinatario,
      encomienda,
      localidadDestino,
      usuarioCreador,
      sucursalOrigen,
      fechaCreacion: new Date(),
      estado: "pendiente",
      numeroSeguimiento,
      historialEstados: [
        {
          estado: "pendiente",
          sucursal: "Casa Central – Córdoba"
        }
      ]

    });

    const envioGuardado = await nuevoEnvio.save();

    // ✅ Popular datos necesarios para el mail (como el email del cliente)
    const envioConDatos = await Envio.findById(envioGuardado._id)
      .populate("clienteRemitente");

    // ✅ Enviar notificación de estado "pendiente" en segundo plano
    enviarNotificacionEstado(envioConDatos, "pendiente").catch((err) => {
      logger.error("❌ Error al enviar notificación de nuevo envío:", err);
    });
    // 🔥 CREAR REMITO EN SEGUNDO PLANO + ACTUALIZAR remitoNumero
    crearRemito(
      { body: { envioId: envioGuardado._id } },
      {
        status: () => ({
          json: () => { },
        }),
      }
    )
      .then(async () => {
        // 🔥 Cuando termina de crear el remito, buscarlo y actualizar el Envío
        const remitoDelEnvio = await Remito.findOne({ envio: envioGuardado._id });

        if (remitoDelEnvio) {
          await Envio.findByIdAndUpdate(envioGuardado._id, {
            remito: remitoDelEnvio._id,
            remitoNumero: remitoDelEnvio.numeroRemito,
          });
          logger.info("✅ remitoNumero actualizado para el envío:", { id: envioGuardado._id });
        }
      })
      .catch((err) => {
        logger.error("❌ Error al crear o actualizar remito:", err);
      });

    // ✅ Generar PDF del remito (también en segundo plano)
    generarRemitoPDF({ params: { envioId: envioGuardado._id } }, {
      download: () => { },
    }).catch((err) => {
      logger.error("❌ Error al generar PDF de remito:", err);
    });

    // ✅ Respondemos rápido al frontend sin esperar nada más
    res.status(201).json(envioGuardado);

  } catch (error) {
    console.error("❌ Error al crear envío:", error);
    res.status(500).json({ error: "Error al crear el envío" });
  }
};


// GET: Todos los envíos
const obtenerEnvios = async (req, res) => {
  try {
    const pagina = parseInt(req.query.pagina) || 0;
    const limite = parseInt(req.query.limite) || 10;
    const estado = req.query.estado?.trim();
    const fechaDesde = req.query.fechaDesde ? new Date(req.query.fechaDesde) : null;
    const fechaHasta = req.query.fechaHasta ? new Date(req.query.fechaHasta) : null;

    // Armar filtro
    const busqueda = req.query.busqueda?.trim() || "";
    const regex = new RegExp(busqueda, "i");

    const filtro = {};

    if (estado) filtro.estado = estado;

    const timeUtil = require("../../utils/timeUtil");

    if (fechaDesde || fechaHasta) {
      const dateRange = timeUtil.getRangeFromDDMMYYYY(req.query.fechaDesde, req.query.fechaHasta);
      if (dateRange) {
        filtro.fechaCreacion = dateRange;
      }
    }

    if (busqueda) {
      filtro.$or = [
        { remitoNumero: regex },
        { numeroSeguimiento: regex }
      ];
    }

    const total = await Envio.countDocuments(filtro);

    const envios = await Envio.find(filtro)
      .skip(pagina * limite)
      .limit(limite)
      .sort({ fechaCreacion: -1 })
      .populate([
        { path: "clienteRemitente" },
        { path: "destinatario" },
        { path: "localidadDestino" },
        { path: "remito" },
      ]);

    res.json({
      total,
      resultados: envios,
    });
  } catch (error) {
    logger.error("❌ Error al obtener los envíos:", error);
    res.status(500).json({ error: "Error al obtener los envios" });
  }
};

// 🔍 GET: Envío por ID
const obtenerEnvioPorId = async (req, res) => {
  try {
    const envio = await Envio.findById(req.params.id).populate([
      { path: "clienteRemitente" },
      { path: "destinatario" },
      { path: "localidadDestino" },
      { path: "remito" },
    ]);
    if (!envio) return res.status(404).json({ error: "Envío no encontrado" });
    res.json(envio);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el envío" });
  }
};

// ✏️ PATCH: Actualizar envío
const actualizarEnvio = async (req, res) => {
  try {
    const envio = await Envio.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!envio) return res.status(404).json({ error: "Envío no encontrado" });
    res.json(envio);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar el envío" });
  }
};

const marcarEnvioEntregado = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombreReceptor, dniReceptor, ubicacionEntrega } = req.body;

    if (!dniReceptor) {
      return res.status(400).json({ error: "El DNI del receptor es obligatorio" });
    }

    if (
      typeof ubicacionEntrega !== "object" ||
      ubicacionEntrega.type !== "Point" ||
      !Array.isArray(ubicacionEntrega.coordinates) ||
      ubicacionEntrega.coordinates.length !== 2 ||
      typeof ubicacionEntrega.coordinates[0] !== "number" ||
      typeof ubicacionEntrega.coordinates[1] !== "number"
    ) {
      return res.status(400).json({
        error: "La ubicación de entrega es inválida o falta",
      });
    }
    // 👈 Capturamos lo que llega del frontend

    const envio = await Envio.findById(id);
    if (!envio) return res.status(404).json({ error: "Envío no encontrado" });

    // Cambiar estado
    envio.estado = "entregado";
    envio.nombreReceptor = nombreReceptor; // 👈 Guardamos el nombre
    envio.dniReceptor = dniReceptor;
    envio.ubicacionEntrega = ubicacionEntrega;
    envio.historialEstados.push({
      estado: "entregado",
      sucursal: "Casa Central – Córdoba" // o la que corresponda
    });

    await envio.save();

    // (Opcional) Enviar notificación por correo
    enviarNotificacionEstado(envio, "entregado").catch((err) => {
      console.error("❌ Error enviando notificación de entrega:", err);
    });

    // FASE 13: Auto-Cierre Reactivo
    await intentarAutoCerrarHoja(envio.hojaReparto);

    res.json({ mensaje: "Envío marcado como entregado correctamente", envio });
  } catch (error) {
    console.error("❌ Error al marcar envío como entregado:", error);
    res.status(500).json({ error: "Error al actualizar el estado del envío" });
  }
};



// DELETE: Eliminar envío
const eliminarEnvio = async (req, res) => {
  try {
    const envio = await Envio.findById(req.params.id).populate("remito");

    if (!envio) {
      return res.status(404).json({ error: "Envío no encontrado" });
    }

    // ✅ Obtener el usuario autenticado desde req.usuario
    const esAdmin = req.usuario.rol === "admin";
    const esAdministrativo = req.usuario.rol === "administrativo";

    if (envio.estado === "pendiente") {
      if (!esAdmin && !esAdministrativo) {
        return res.status(403).json({ error: "No tienes permiso para eliminar este envío" });
      }
    } else {
      if (!esAdmin) {
        return res.status(403).json({ error: "Solo un administrador puede eliminar envíos en este estado" });
      }
    }

    // ✅ Eliminar el remito asociado (si existe)
    if (envio.remito) {
      await Remito.findByIdAndDelete(envio.remito);
    }

    // ✅ Eliminar el envío
    // ✅ Eliminar el envío de la hoja de reparto (si pertenece a una)
    if (envio.hojaReparto) {
      const HojaReparto = require("../../models/HojaReparto");
      await HojaReparto.findByIdAndUpdate(envio.hojaReparto, {
        $pull: { envios: envio._id }
      });
    }

    await Envio.findByIdAndDelete(req.params.id);


    res.json({ mensaje: "Envío eliminado correctamente" });

  } catch (error) {
    console.error("❌ Error al eliminar el envío:", error);
    res.status(500).json({ error: "Error al eliminar el envío" });
  }
};

const obtenerMisEnvios = async (req, res) => {
  try {
    const clienteId = req.usuario.id;

    const envios = await Envio.find({ clienteRemitente: clienteId })
      .populate("clienteRemitente", "nombre email")
      .populate("destinatario", "nombre email dni direccion telefono")
      .populate("localidadDestino", "nombre")
      .sort({ fechaCreacion: -1 }); // los más recientes primero

    res.json(envios);
  } catch (error) {
    console.error("❌ Error al obtener mis envíos:", error);
    res.status(500).json({ error: "Error al obtener tus envíos" });
  }
};

const generarNumeroSeguimiento = async () => {
  const prefijo = "SDA";
  const anio = new Date().getFullYear();
  let seguimiento;
  let existe = true;

  while (existe) {
    const aleatorio = Math.random().toString(36).substring(2, 8).toUpperCase();
    seguimiento = `${prefijo}-${anio}-${aleatorio}`;
    existe = await Envio.findOne({ numeroSeguimiento: seguimiento });
  }

  return seguimiento;
};

const marcarEnvioDevuelto = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivoDevolucion } = req.body;

    const envio = await Envio.findById(id);
    if (!envio) return res.status(404).json({ error: "Envío no encontrado" });

    envio.estado = "devuelto";
    envio.motivoDevolucion = motivoDevolucion;
    envio.historialEstados.push({
      estado: "devuelto",
      sucursal: "Casa Central – Córdoba"
    });

    await envio.save();

    // (Opcional) Podrías enviar una notificación por email
    enviarNotificacionEstado(envio, "devuelto").catch((err) => {
      console.error("❌ Error enviando notificación de devolución:", err);
    });

    // FASE 13: Auto-Cierre Reactivo
    await intentarAutoCerrarHoja(envio.hojaReparto);

    res.json({ mensaje: "Envío marcado como devuelto correctamente", envio });
  } catch (error) {
    console.error("❌ Error al marcar envío como devuelto:", error);
    res.status(500).json({ error: "Error al actualizar el estado del envío" });
  }
};

const marcarIntentoFallido = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const envio = await Envio.findById(id);
    if (!envio) {
      return res.status(404).json({ error: "Envío no encontrado" });
    }

    // Validar que no sea un estado final
    if (["entregado", "rechazado", "no entregado", "devuelto", "cancelado"].includes(envio.estado)) {
      return res.status(400).json({ error: `El envío ya está en estado final: ${envio.estado}` });
    }

    let nuevoEstado = "";

    // 🚫 Caso especial: destinatario rechazó
    if (motivo === "El destinatario rechazó la mercadería") {
      nuevoEstado = "rechazado";
    } else if (motivo === "Dirección Incorrecta / Inexistente") {
      // Si la dirección está mal, no tiene sentido reagendar automáticamente, pasa a no entregado (requiere gestión)
      nuevoEstado = "no entregado";
    } else {
      // Otros motivos: depende de la cantidad de intentos
      if (envio.reintentosEntrega >= 1) {
        nuevoEstado = "no entregado";
      } else {
        nuevoEstado = "reagendado";
      }
    }

    // Asignar nuevo estado y registrar intento
    envio.estado = nuevoEstado;
    envio.reintentosEntrega = (envio.reintentosEntrega || 0) + 1;
    envio.motivoNoEntrega = motivo;
    envio.fechaUltimoIntento = new Date();

    envio.historialEstados.push({
      estado: nuevoEstado,
      fecha: new Date(),
      motivo: motivo,
    });

    await envio.save();

    // Notificación opcional al cliente
    enviarNotificacionEstado(envio, nuevoEstado).catch((err) => {
      console.error("❌ Error enviando notificación de intento fallido:", err);
    });

    // FASE 13: Auto-Cierre Reactivo
    await intentarAutoCerrarHoja(envio.hojaReparto);

    res.json({ mensaje: `Intento fallido registrado: ${nuevoEstado}`, envio });

  } catch (error) {
    console.error("❌ Error al marcar intento fallido:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};







module.exports = {
  crearEnvio,
  obtenerEnvios,
  obtenerEnvioPorId,
  actualizarEnvio,
  eliminarEnvio,
  obtenerMisEnvios,
  generarNumeroSeguimiento,
  marcarEnvioEntregado,
  marcarEnvioDevuelto,
  marcarIntentoFallido,
};
