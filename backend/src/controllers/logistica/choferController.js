const Chofer = require("../../models/Chofer");
const Vehiculo = require("../../models/Vehiculo");
const UsuarioSistema = require("../../models/Usuario");
const MantenimientoLog = require("../../models/MantenimientoLog");
const excelJS = require("exceljs");
const timeUtil = require("../../utils/timeUtil");


// Crear nuevo chofer
const crearChofer = async (req, res) => {
  try {
    const { usuario, telefono, tipoVinculo } = req.body;

    if (!usuario || !telefono || !tipoVinculo) {
      return res.status(400).json({ msg: "Faltan campos obligatorios." });
    }

    const UsuarioExterno = UsuarioSistema;
    const usuarioDB = await UsuarioExterno.findById(usuario);


    if (!usuarioDB) {
      return res.status(404).json({ msg: "Usuario no encontrado." });
    }

    // Always ensure role is 'chofer'
    if (usuarioDB.rol !== "chofer") {
      usuarioDB.rol = "chofer";
      await usuarioDB.save();
    }

    // Check if user is inactive/unverified if needed?
    // if (!usuarioDB.verificado || !usuarioDB.activo) { ... }

    const existeChofer = await Chofer.findOne({ usuario });

    if (existeChofer) {
      // UPSERT LOGIC: Update existing record
      existeChofer.telefono = telefono;
      existeChofer.tipoVinculo = tipoVinculo;
      existeChofer.activo = true; // Ensure it's active
      await existeChofer.save();
      return res.status(200).json({ msg: "Chofer actualizado/reactivado correctamente.", chofer: existeChofer });
    }

    const nuevoChofer = new Chofer({
      usuario,
      telefono,
      tipoVinculo,
    });


    await nuevoChofer.save();
    res.status(201).json(nuevoChofer);
  } catch (error) {
    console.error("Error al crear chofer:", error);
    res.status(500).json({ msg: "Error interno del servidor." });
  }
};

// Obtener todos los choferes
const obtenerChoferes = async (req, res) => {
  try {
    const pagina = parseInt(req.query.pagina) || 0;
    const limite = 10;
    const busqueda = req.query.busqueda?.trim() || "";

    const UsuarioExterno = UsuarioSistema;

    // Paso 1: Buscar usuarios que matcheen con la búsqueda
    const regex = new RegExp(busqueda, "i");

    const usuariosFiltrados = await UsuarioExterno.find(
      busqueda
        ? {
          $or: [
            { nombre: regex },
            { email: regex },
            { dni: regex },
            { telefono: regex },
          ],
        }
        : {}
    )
      .select("_id nombre email dni telefono")
      .lean();

    const idsUsuarios = usuariosFiltrados.map((u) => u._id);

    // Paso 2: Buscar choferes cuyo usuario esté en los resultados (si hay búsqueda)
    const queryChofer = busqueda
      ? { usuario: { $in: idsUsuarios } }
      : {};

    const total = await Chofer.countDocuments(queryChofer);

    const choferes = await Chofer.find(queryChofer)
      .skip(pagina * limite)
      .limit(limite)
      .lean();

    // Paso 3: Combinar choferes con sus datos de usuario filtrados
    const resultados = choferes.map((chofer) => {
      const usuario = usuariosFiltrados.find(
        (u) => u._id.toString() === chofer.usuario.toString()
      );
      return { ...chofer, usuario };
    });

    res.status(200).json({
      total,
      resultados,
    });
  } catch (error) {
    console.error("Error al obtener choferes:", error);
    res.status(500).json({ msg: "Error interno al obtener choferes." });
  }
};





// Obtener un chofer por ID
const obtenerChofer = async (req, res) => {
  try {
    const chofer = await Chofer.findById(req.params.id).populate({
      path: "usuario",
      select: "nombre email rol activo verificado",
    });

    if (!chofer) {
      return res.status(404).json({ msg: "Chofer no encontrado." });
    }

    res.json(chofer);
  } catch (error) {
    console.error("Error al obtener chofer:", error);
    res.status(500).json({ msg: "Error al obtener chofer." });
  }
};


// Editar chofer
const editarChofer = async (req, res) => {
  try {
    const chofer = await Chofer.findById(req.params.id);
    if (!chofer) {
      return res.status(404).json({ msg: "Chofer no encontrado." });
    }

    const { telefono, tipoVinculo } = req.body;

    if (telefono) chofer.telefono = telefono;
    if (tipoVinculo) chofer.tipoVinculo = tipoVinculo;

    await chofer.save();
    res.json(chofer);
  } catch (error) {
    console.error("Error al editar chofer:", error);
    res.status(500).json({ msg: "Error al editar chofer." });
  }
};

// Eliminar chofer
const eliminarChofer = async (req, res) => {
  try {
    const chofer = await Chofer.findById(req.params.id);
    if (!chofer) {
      return res.status(404).json({ msg: "Chofer no encontrado." });
    }

    // Buscar usuario y cambiarle el rol a "cliente"
    const usuario = await UsuarioSistema.findById(chofer.usuario);
    if (usuario) {
      usuario.rol = "cliente";
      await usuario.save();
    }

    await chofer.deleteOne();
    res.json({ msg: "Chofer eliminado correctamente y usuario actualizado." });
  } catch (error) {
    console.error("Error al eliminar chofer:", error);
    res.status(500).json({ msg: "Error al eliminar chofer." });
  }
};

const obtenerChoferesMinimos = async (req, res) => {
  try {
    const choferes = await Chofer.find()
      .populate("usuario", "nombre dni")
      .select("usuario")
      .lean();

    res.json(choferes);
  } catch (error) {
    console.error("Error al obtener choferes mínimos:", error);
    res.status(500).json({ msg: "Error al obtener choferes." });
  }
};





// Obtener configuración del chofer logueado (Vehículo y Ruta asignada)
const obtenerMiConfiguracion = async (req, res) => {
  try {
    // req.usuario.id viene del middleware auth
    const usuarioId = req.usuario.id;

    const chofer = await Chofer.findOne({ usuario: usuarioId }).populate("vehiculoAsignado");

    if (!chofer) {
      return res.status(404).json({ msg: "Perfil de chofer no encontrado." });
    }

    // 1. Buscar si existe una Hoja de Reparto para hoy para este chofer
    const HojaReparto = require("../../models/HojaReparto");
    const hoy = new Date();
    const inicioDia = timeUtil.getInicioDiaArg(hoy);
    const finDia = timeUtil.getFinDiaArg(hoy);

    const hojasActivas = await HojaReparto.find({
      chofer: chofer._id,
      fecha: { $gte: inicioDia, $lte: finDia },
      estado: { $ne: "cerrada" }
    }).populate("vehiculo ruta");

    if (hojasActivas.length > 0) {
      // Detectar si ya se registró el reporte de km hoy para el vehículo asignado
      const vehiculoIdHoy = hojasActivas[0].vehiculo?._id || hojasActivas[0].vehiculo;
      let reporteKmHoy = false;
      let resumenReporteHoy = null;

      if (vehiculoIdHoy) {
        const logHoy = await MantenimientoLog.findOne({
          vehiculo: vehiculoIdHoy,
          tipo: "Reporte Diario",
          fecha: { $gte: inicioDia, $lte: finDia }
        }).sort({ fecha: -1 });

        if (logHoy) {
          reporteKmHoy = true;
          resumenReporteHoy = {
            km: logHoy.kmAlMomento,
            litros: logHoy.litrosCargados || 0,
            observaciones: logHoy.observaciones || null,
            fecha: logHoy.fecha
          };
        }
      }

      return res.json({
        vehiculo: hojasActivas[0].vehiculo,
        ruta: hojasActivas[0].ruta,
        hojaRepartoId: hojasActivas[0]._id,
        hojaRepartoCodigo: hojasActivas[0].numeroHoja || `${hojasActivas[0].ruta?.codigo?.replace(/^L-/, '')}-${timeUtil.getStrYYYYMMDDArg(hoy).replace(/-/g, '')}`,
        esPlanificada: true,
        reporteKmHoy,
        resumenReporteHoy,
        hojasActivas: hojasActivas.map(hoja => ({
          vehiculo: hoja.vehiculo,
          ruta: hoja.ruta,
          hojaRepartoId: hoja._id,
          hojaRepartoCodigo: hoja.numeroHoja || `${hoja.ruta?.codigo?.replace(/^L-/, '')}-${timeUtil.getStrYYYYMMDDArg(hoy).replace(/-/g, '')}`,
        }))
      });
    }

    // 2. Si no hay hoja directamente asignada al chofer:
    //    Verificar si el admin lo removió de la hoja de su ruta base hoy (Admin Supremacy)
    const Ruta = require("../../models/Ruta");
    const rutaAsignada = await Ruta.findOne({ choferAsignado: chofer._id }).populate("vehiculoAsignado");

    if (rutaAsignada) {
      // Buscar la hoja de esta ruta para hoy
      const hojaDeRutaHoy = await HojaReparto.findOne({
        ruta: rutaAsignada._id,
        fecha: { $gte: inicioDia, $lte: finDia },
        estado: { $ne: "cerrada" }
      });

      // Si existe una hoja para la ruta pero este chofer NO es el asignado →
      // el admin lo removió → supremacía admin → no mostrar nada en la app
      if (hojaDeRutaHoy && hojaDeRutaHoy.chofer?.toString() !== chofer._id.toString()) {
        return res.json({
          vehiculo: null,
          ruta: null,
          hojaRepartoId: null,
          esPlanificada: false,
          hojasActivas: [],
          removidoPorAdmin: true  // flag para que la app pueda mostrar un mensaje claro
        });
      }
    }

    // 3. Fallback legacy: no hay hoja del día activa para su ruta → mostrar config de la ruta
    const vehiculoFinal = (rutaAsignada && rutaAsignada.vehiculoAsignado)
      ? rutaAsignada.vehiculoAsignado
      : chofer.vehiculoAsignado;

    res.json({
      vehiculo: vehiculoFinal,
      ruta: rutaAsignada,
      hojaRepartoId: null,
      esPlanificada: false,
      hojasActivas: []
    });

  } catch (error) {
    console.error("Error al obtener mi configuración:", error);
    res.status(500).json({ msg: "Error al obtener configuración." });
  }
};

// Obtener listas para selectores (Vehículos y Rutas)
const obtenerSelectoresReporte = async (req, res) => {
  try {
    // 1. Vehículos Activos y PROPIOS
    const vehiculos = await Vehiculo.find({
      activo: true,
      estado: { $ne: "fuera de servicio" },
      tipoPropiedad: "propio" // Solo flota propia
    })
      .select("patente marca modelo kilometrajeActual tipoPropiedad tipoCombustible configuracionMantenimiento")
      .lean();

    // 2. Rutas Activas (Traemos todas por si el flag activo no está seteado)
    const Ruta = require("../../models/Ruta");
    const rutas = await Ruta.find({})
      .select("codigo descripcion horaSalida")
      .lean();

    res.json({
      vehiculos,
      rutas
    });

  } catch (error) {
    console.error("Error al obtener selectores:", error);
    res.status(500).json({ msg: "Error al obtener listas." });
  }
};

// Actualizar asignación de chofer (Ruta/Vehículo) desde App Móvil
const actualizarAsignacion = async (req, res) => {
  try {
    const { hojaRepartoId, rutaId, vehiculoId } = req.body;
    const usuarioId = req.usuario.id;

    // Buscar chofer
    const chofer = await Chofer.findOne({ usuario: usuarioId });
    if (!chofer) {
      return res.status(404).json({ error: 'Chofer no encontrado' });
    }

    // Buscar hoja
    const HojaReparto = require("../../models/HojaReparto");
    const hoja = await HojaReparto.findById(hojaRepartoId)
      .populate('ruta vehiculo chofer');

    if (!hoja) {
      return res.status(404).json({ error: 'Hoja de reparto no encontrada' });
    }

    // Guardar valores anteriores
    const rutaAnterior = hoja.ruta;
    const vehiculoAnterior = hoja.vehiculo;

    // Si cambia la ruta → buscar hoja de la nueva ruta y asignar chofer
    if (rutaId && rutaId !== hoja.ruta?._id.toString()) {
      // Dejar hoja anterior huérfana
      hoja.chofer = null;
      hoja.historialMovimientos.push({
        usuario: usuarioId,
        accion: `Chofer ${chofer.usuario?.nombre || chofer.usuario?.dni} dejó la ruta ${rutaAnterior?.codigo} desde app móvil`
      });
      await hoja.save();

      // Buscar hoja de la NUEVA ruta para HOY
      const hoy = new Date();
      const hoyInicio = timeUtil.getInicioDiaArg(hoy);
      const hoyFin = timeUtil.getFinDiaArg(hoy);

      let nuevaHoja = await HojaReparto.findOne({
        ruta: rutaId,
        fecha: { $gte: hoyInicio, $lte: hoyFin }
      });

      if (!nuevaHoja) {
        return res.status(404).json({ error: 'No hay hoja creada para esa ruta hoy' });
      }

      // Asignar chofer a la nueva hoja
      nuevaHoja.chofer = chofer._id;
      nuevaHoja.vehiculo = vehiculoId || vehiculoAnterior; // Mantener vehículo o cambiar
      nuevaHoja.historialMovimientos.push({
        usuario: usuarioId,
        accion: `Chofer reasignado desde app móvil. Vehículo: ${vehiculoId || 'sin cambios'}`
      });
      await nuevaHoja.save();

      return res.json({
        message: 'Ruta cambiada exitosamente',
        hojaRepartoId: nuevaHoja._id,
        envios: nuevaHoja.envios
      });
    }

    // Si solo cambia vehículo (misma ruta)
    if (vehiculoId && vehiculoId !== hoja.vehiculo?._id.toString()) {
      hoja.vehiculo = vehiculoId;
      hoja.historialMovimientos.push({
        usuario: usuarioId,
        accion: `Vehículo cambiado desde app móvil. Anterior: ${vehiculoAnterior?.patente}, Nuevo: ${vehiculoId}`
      });
      await hoja.save();
    }

    res.json({ message: 'Asignación actualizada', hojaRepartoId: hoja._id });
  } catch (error) {
    console.error('Error actualizando asignación:', error);
    res.status(500).json({ error: 'Error al actualizar asignación' });
  }
};

// Obtener la hoja de reparto del chofer para una fecha específica (para KM retroactivo)
// GET /api/choferes/hoja-por-fecha?fecha=YYYY-MM-DD
const obtenerHojaPorFecha = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { fecha } = req.query;

    if (!fecha) {
      return res.status(400).json({ error: "Se requiere el parámetro 'fecha' en formato YYYY-MM-DD." });
    }

    const fechaObj = new Date(fecha + 'T12:00:00.000Z'); // Mediodía UTC para evitar saltos de TZ
    const inicioDia = timeUtil.getInicioDiaArg(fechaObj);
    const finDia = timeUtil.getFinDiaArg(fechaObj);

    // No permitir fechas futuras
    const hoy = new Date();
    if (fechaObj > hoy) {
      return res.status(400).json({ error: "No se puede cargar kilometraje para fechas futuras." });
    }

    // Máximo 7 días hacia atrás
    const limite = new Date();
    limite.setDate(limite.getDate() - 7);
    if (fechaObj < limite) {
      return res.status(400).json({ error: "Solo se pueden cargar reportes de los últimos 7 días." });
    }

    const chofer = await Chofer.findOne({ usuario: usuarioId });
    if (!chofer) {
      return res.status(404).json({ error: "Perfil de chofer no encontrado." });
    }

    const HojaReparto = require("../../models/HojaReparto");
    const hoja = await HojaReparto.findOne({
      chofer: chofer._id,
      fecha: { $gte: inicioDia, $lte: finDia }
    }).populate("vehiculo ruta");

    if (!hoja) {
      return res.status(404).json({ error: "No tenés actividad registrada para esa fecha." });
    }

    // Verificar si ya se cargó el km para esa fecha y ese vehículo
    const vehiculoId = hoja.vehiculo?._id || hoja.vehiculo;
    let reporteExistente = null;
    if (vehiculoId) {
      const logExistente = await MantenimientoLog.findOne({
        vehiculo: vehiculoId,
        tipo: "Reporte Diario",
        fecha: { $gte: inicioDia, $lte: finDia }
      }).sort({ fecha: -1 });

      if (logExistente) {
        reporteExistente = {
          km: logExistente.kmAlMomento,
          litros: logExistente.litrosCargados || 0,
          observaciones: logExistente.observaciones || null
        };
      }
    }

    return res.json({
      hoja: {
        _id: hoja._id,
        numeroHoja: hoja.numeroHoja,
        fecha: hoja.fecha,
        estado: hoja.estado
      },
      vehiculo: hoja.vehiculo,
      ruta: hoja.ruta,
      reporteExistente
    });

  } catch (error) {
    console.error("Error al obtener hoja por fecha:", error);
    res.status(500).json({ error: "Error al obtener la información de la fecha seleccionada." });
  }
};

// ─── CONTRATADOS ─────────────────────────────────────────────────────────────

// Obtener solo choferes con tipoVinculo === 'contratado' (para la sección de Contratados)
const obtenerContratados = async (req, res) => {
  try {
    const busqueda = req.query.busqueda?.trim() || "";
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 10;
    const skip = (pagina - 1) * limite;
    const regex = new RegExp(busqueda, "i");

    // Buscar usuarios que matcheen la búsqueda para filtro por nombre
    let idsUsuarios = null;
    if (busqueda) {
      const usuariosFiltrados = await UsuarioSistema.find({
        $or: [{ nombre: regex }, { email: regex }]
      }).select("_id").lean();
      idsUsuarios = usuariosFiltrados.map((u) => u._id);
    }

    // Construir query: solo contratados
    let queryFinal;
    if (idsUsuarios) {
      queryFinal = {
        tipoVinculo: "contratado",
        $or: [
          { usuario: { $in: idsUsuarios } },
          { "datosContratado.razonSocial": regex },
          { "datosContratado.cuit": regex }
        ]
      };
    } else {
      queryFinal = { tipoVinculo: "contratado" };
    }

    const total = await Chofer.countDocuments(queryFinal);
    const contratados = await Chofer.find(queryFinal)
      .populate("usuario", "nombre email activo")
      .populate("datosContratado.vehiculoDefault", "patente marca modelo")
      .populate("datosContratado.rutaDefault", "codigo descripcion precioKm kilometrosEstimados")
      .skip(skip)
      .limit(limite)
      .lean();

    res.json({
      contratados,
      total,
      paginaActual: pagina,
      totalPaginas: Math.ceil(total / limite),
      limite
    });
  } catch (error) {
    console.error("Error al obtener contratados:", error);
    res.status(500).json({ msg: "Error al obtener contratados." });
  }
};

// Editar los datos de contratado (datosContratado) de un chofer
const editarContratado = async (req, res) => {
  try {
    const chofer = await Chofer.findById(req.params.id);
    if (!chofer) return res.status(404).json({ msg: "Chofer no encontrado." });
    if (chofer.tipoVinculo !== "contratado") {
      return res.status(400).json({ msg: "Este chofer no es de tipo contratado." });
    }

    const { razonSocial, cuit, email, fechaIngreso, fechaEgreso, vehiculoDefault, rutaDefault, activo, montoChoferDia } = req.body;

    // Actualizar campos de datosContratado
    if (razonSocial !== undefined) chofer.datosContratado.razonSocial = razonSocial;
    if (cuit !== undefined) chofer.datosContratado.cuit = cuit;
    if (email !== undefined) chofer.datosContratado.email = email;
    if (fechaIngreso !== undefined) chofer.datosContratado.fechaIngreso = fechaIngreso;
    if (fechaEgreso !== undefined) chofer.datosContratado.fechaEgreso = fechaEgreso;
    if (vehiculoDefault !== undefined) chofer.datosContratado.vehiculoDefault = vehiculoDefault || null;
    if (rutaDefault !== undefined) chofer.datosContratado.rutaDefault = rutaDefault || null;
    if (activo !== undefined) chofer.activo = activo;

    // 🛡️ BÓVEDA DE SEGURIDAD PARA TARIFA PRIVADA 🛡️
    if (montoChoferDia !== undefined) {
      if (req.usuario && req.usuario.roles && req.usuario.roles.includes('admin') || req.usuario?.rol === 'admin') {
        chofer.datosContratado.montoChoferDia = montoChoferDia;
      } else {
        console.warn(`[SEGURIDAD] Intento bloqueado: Usuario ${req.usuario?.id} intentó mutar la tarifa del chofer ${chofer._id} sin ser admin`);
      }
    }

    await chofer.save();

    const choferActualizado = await Chofer.findById(chofer._id)
      .populate("usuario", "nombre email activo")
      .populate("datosContratado.vehiculoDefault", "patente marca modelo")
      .populate("datosContratado.rutaDefault", "codigo descripcion precioKm kilometrosEstimados");

    res.json(choferActualizado);
  } catch (error) {
    console.error("Error al editar contratado:", error);
    res.status(500).json({ msg: "Error al editar contratado." });
  }
};

// Subir un documento al legajo digital de un contratado
const subirDocumentoContratado = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipoDoc } = req.body; // dni | carnetConducir | constanciaARCA | contrato | antecedentesPenales

    if (!req.file) return res.status(400).json({ error: "No se subió ningún archivo." });

    const tiposValidos = ["dni", "carnetConducir", "constanciaARCA", "contrato", "antecedentesPenales"];
    if (!tiposValidos.includes(tipoDoc)) {
      return res.status(400).json({ error: "Tipo de documento inválido." });
    }

    const chofer = await Chofer.findById(id);
    if (!chofer) return res.status(404).json({ error: "Chofer no encontrado." });
    if (chofer.tipoVinculo !== "contratado") {
      return res.status(400).json({ error: "Este chofer no es de tipo contratado." });
    }

    const path = require("path");
    const fs = require("fs");

    // Eliminar archivo anterior si existe
    const pathAnterior = chofer.datosContratado?.documentos?.[tipoDoc]?.path;
    if (pathAnterior) {
      const oldPath = path.join(process.cwd(), pathAnterior);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    // Guardar nuevo archivo
    chofer.datosContratado.documentos[tipoDoc] = {
      path: `uploads/vehiculos/${req.file.filename}`,
      fechaSubida: new Date()
    };

    await chofer.save();
    res.json({ mensaje: "Documento subido con éxito.", chofer });
  } catch (error) {
    console.error("Error al subir documento de contratado:", error);
    res.status(500).json({ error: "Error interno al subir documento." });
  }
};

// Exportar a Excel (Reporte de Choferes)
const reporteExcelChoferes = async (req, res) => {
  try {
    const choferes = await Chofer.find()
      .populate("usuario", "nombre apellido dni email verificado activo")
      .lean();

    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("Padrón Choferes");

    worksheet.columns = [
      { header: "NOMBRE Y APELLIDO", key: "nombre", width: 35 },
      { header: "DNI", key: "dni", width: 15 },
      { header: "TELÉFONO", key: "telefono", width: 15 },
      { header: "VÍNCULO", key: "vinculo", width: 20 },
      { header: "CUIT", key: "cuit", width: 20 },
      { header: "INGRESO", key: "ingreso", width: 15 },
      { header: "ESTADO", key: "estado", width: 15 },
    ];

    // Style Header
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4C6EF5" } };
      cell.alignment = { horizontal: "center" };
    });

    choferes.forEach((chofer) => {
      let nombreTexto = "Sin Usuario Asignado";
      let dniTexto = "-";
      let estadoTexto = chofer.activo ? "ACTIVO" : "INACTIVO";

      if (chofer.usuario) {
        nombreTexto = `${chofer.usuario.nombre || ''} ${chofer.usuario.apellido || ''}`.trim();
        dniTexto = chofer.usuario.dni || "-";

        if (!chofer.usuario.activo) estadoTexto = "USUARIO BLOQUEADO";
      }

      let cuitTexto = "-";
      let ingresoTexto = "-";

      if (chofer.tipoVinculo === 'contratado' && chofer.datosContratado) {
        cuitTexto = chofer.datosContratado.cuit || "S/C";
        if (chofer.datosContratado.fechaIngreso) {
          const fStr = timeUtil.getStrYYYYMMDDArg(chofer.datosContratado.fechaIngreso);
          ingresoTexto = fStr.split('-').reverse().join('/');
        }
      }

      worksheet.addRow({
        nombre: nombreTexto,
        dni: dniTexto,
        telefono: chofer.telefono || "-",
        vinculo: chofer.tipoVinculo.toUpperCase(),
        cuit: cuitTexto,
        ingreso: ingresoTexto,
        estado: estadoTexto,
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Padron_Choferes.xlsx"
    );

    await workbook.xlsx.write(res);
    res.status(200).end();

  } catch (error) {
    console.error("Error al generar Excel de choferes:", error);
    res.status(500).json({ error: "Error al generar el reporte Excel" });
  }
};

module.exports = {
  crearChofer,
  obtenerChoferes,
  obtenerChofer,
  editarChofer,
  eliminarChofer,
  obtenerChoferesMinimos,
  obtenerMiConfiguracion,
  obtenerSelectoresReporte,
  actualizarAsignacion,
  obtenerHojaPorFecha,
  // Contratados
  obtenerContratados,
  editarContratado,
  subirDocumentoContratado,
  reporteExcelChoferes
};
