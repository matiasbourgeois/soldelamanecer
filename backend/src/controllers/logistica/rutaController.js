const Ruta = require("../../models/Ruta");
require("../../models/Zona");
const Localidad = require("../../models/Localidad");  // Asegúrate de importar el modelo Localidad
const excelJS = require("exceljs");
// Crear ruta
const crearRuta = async (req, res) => {
  try {
    const {
      codigo,
      horaSalida,
      frecuencia,
      descripcion,
      zona,
      localidades = [],
      choferAsignado,
      vehiculoAsignado,
      contratistaTitular,
      kilometrosEstimados,
      precioKm,
      tipoPago,
      montoPorDistribucion,
      montoMensual
    } = req.body;

    const nuevaRuta = new Ruta({
      codigo,
      horaSalida,
      frecuencia,
      descripcion,
      zona: zona || null,
      localidades,
      choferAsignado: choferAsignado || null,
      vehiculoAsignado: vehiculoAsignado || null,
      contratistaTitular: contratistaTitular || null,
      kilometrosEstimados: kilometrosEstimados || 0,
      precioKm: precioKm || 0,
      tipoPago: tipoPago || 'por_km',
      montoPorDistribucion: montoPorDistribucion || 0,
      montoMensual: montoMensual || 0,
    });

    await nuevaRuta.save();
    res.status(201).json(nuevaRuta);
  } catch (error) {
    console.error("Error al crear ruta:", error);
    res.status(500).json({ error: "Error al crear ruta" });
  }
};


// Obtener todas las rutas
const obtenerRutas = async (req, res) => {
  try {
    const { busqueda = "", pagina = 0, limite = 10 } = req.query;

    const filtro = busqueda
      ? {
        $or: [
          { codigo: { $regex: busqueda, $options: "i" } },
          { horaSalida: { $regex: busqueda, $options: "i" } }
        ]
      }
      : {};

    const rutas = await Ruta.find(filtro)
      .skip(Number(pagina) * Number(limite))
      .limit(Number(limite))
      .populate("zona", "nombre")
      .populate("localidades", "nombre") // solo nombre si es lo que mostrás
      .populate({
        path: "choferAsignado",
        select: "usuario",
        populate: {
          path: "usuario",
          select: "nombre apellido"
        }
      })
      .populate("vehiculoAsignado", "patente marca modelo tipoPropiedad estado")
      .populate({
        path: "contratistaTitular",
        select: "usuario datosContratado",
        populate: { path: "usuario", select: "nombre" }
      })
      .lean();

    const total = await Ruta.countDocuments(filtro);

    res.json({
      rutas,
      total,
      pagina: Number(pagina),
      limite: Number(limite),
    });
  } catch (error) {
    console.error("Error al obtener rutas:", error);
    res.status(500).json({ error: "Error al obtener rutas" });
  }
};

const obtenerTodasLasRutas = async (req, res) => {
  try {
    const rutas = await Ruta.find()
      .populate({
        path: "choferAsignado",
        select: "usuario tipoVinculo",
        populate: {
          path: "usuario",
          select: "nombre dni"
        }
      })
      .populate("vehiculoAsignado", "patente marca modelo")
      .populate({
        path: "contratistaTitular",
        select: "usuario datosContratado",
        populate: { path: "usuario", select: "nombre" }
      })
      .populate("localidades", "nombre") // opcional si lo usás
      .lean();

    res.status(200).json({ rutas });
  } catch (error) {
    console.error("Error al obtener todas las rutas:", error);
    res.status(500).json({ msg: "Error interno al obtener rutas." });
  }
};

// Editar ruta
const actualizarRuta = async (req, res) => {
  try {
    const { id } = req.params;
    const rutaActualizada = await Ruta.findByIdAndUpdate(id, req.body, { new: true });
    if (!rutaActualizada) {
      return res.status(404).json({ error: "Ruta no encontrada" });
    }
    res.json(rutaActualizada);
  } catch (error) {
    console.error("Error al actualizar ruta:", error);
    res.status(500).json({ error: "Error al actualizar ruta" });
  }
};

// Edición masiva de tarifas (Tarifario Maestro)
const actualizarTarifasMasivas = async (req, res) => {
  try {
    // Protección estricta: Solo administradores pueden hacer cambios masivos
    if (req.usuario.rol !== "admin") {
      return res.status(403).json({ error: "Acceso denegado. Se requiere nivel de Administrador." });
    }

    const { rutas } = req.body;

    if (!Array.isArray(rutas) || rutas.length === 0) {
      return res.status(400).json({ error: "No se proporcionaron rutas para actualizar." });
    }

    // Preparar las operaciones para bulkWrite
    const operaciones = rutas.map((ruta) => {
      // Validaciones básicas de seguridad
      const updateData = {};
      if (ruta.tipoPago) updateData.tipoPago = ruta.tipoPago;
      if (ruta.precioKm !== undefined) updateData.precioKm = Number(ruta.precioKm);
      if (ruta.kilometrosEstimados !== undefined) updateData.kilometrosEstimados = Number(ruta.kilometrosEstimados);
      if (ruta.montoPorDistribucion !== undefined) updateData.montoPorDistribucion = Number(ruta.montoPorDistribucion);
      if (ruta.montoMensual !== undefined) updateData.montoMensual = Number(ruta.montoMensual);

      return {
        updateOne: {
          filter: { _id: ruta.id },
          update: { $set: updateData },
        },
      };
    });

    const resultado = await Ruta.bulkWrite(operaciones);

    res.status(200).json({
      mensaje: "Tarifas actualizadas correctamente",
      modificados: resultado.modifiedCount,
    });
  } catch (error) {
    console.error("Error al actualizar tarifas masivas:", error);
    res.status(500).json({ error: "Error interno del servidor al procesar la actualización masiva." });
  }
};

// Baja lógica
const cambiarEstadoRuta = async (req, res) => {
  try {
    const { id } = req.params;
    const { activa } = req.body;

    const ruta = await Ruta.findById(id);
    if (!ruta) {
      return res.status(404).json({ error: "Ruta no encontrada" });
    }

    ruta.activa = activa;
    await ruta.save();

    res.json({ mensaje: `Ruta ${activa ? "activada" : "desactivada"}`, ruta });
  } catch (error) {
    console.error("Error al cambiar estado de ruta:", error);
    res.status(500).json({ error: "Error al cambiar estado" });
  }
};

// Agregar localidades a una ruta
const agregarLocalidadesARuta = async (req, res) => {
  const { idRuta, localidadesAAgregar } = req.body;

  try {
    // Buscar la ruta por su ID
    const ruta = await Ruta.findById(idRuta);

    if (!ruta) {
      return res.status(404).json({ msg: "Ruta no encontrada" });
    }

    // Verificar si las localidades existen
    const localidadesValidas = await Localidad.find({ '_id': { $in: localidadesAAgregar } });

    if (localidadesValidas.length !== localidadesAAgregar.length) {
      return res.status(400).json({ msg: "Algunas localidades no son válidas" });
    }

    // Agregar las localidades a la ruta
    ruta.localidades = [...new Set([...ruta.localidades, ...localidadesAAgregar])]; // Añadir sin duplicados

    await ruta.save();

    return res.status(200).json({ msg: "Localidades agregadas correctamente a la ruta", ruta });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Error al agregar localidades a la ruta" });
  }
};

// Eliminar localidad de una ruta
const eliminarLocalidadDeRuta = async (req, res) => {
  const { idRuta, idLocalidad } = req.body;

  try {
    // Buscar la ruta por su ID
    const ruta = await Ruta.findById(idRuta);

    if (!ruta) {
      return res.status(404).json({ msg: "Ruta no encontrada" });
    }

    // Eliminar la localidad de la ruta
    ruta.localidades = ruta.localidades.filter(id => id.toString() !== idLocalidad);

    await ruta.save();

    return res.status(200).json({ msg: "Localidad eliminada correctamente de la ruta", ruta });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Error al eliminar localidad de la ruta" });
  }
};

// Eliminar ruta (definitivo)
const eliminarRuta = async (req, res) => {
  try {
    const { id } = req.params;
    const ruta = await Ruta.findByIdAndDelete(id);
    if (!ruta) {
      return res.status(404).json({ error: "Ruta no encontrada" });
    }
    res.json({ mensaje: "Ruta eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar ruta:", error);
    res.status(500).json({ error: "Error al eliminar ruta" });
  }
};

// Exportar a Excel (Reporte de Rutas)
const reporteExcelRutas = async (req, res) => {
  try {
    const rutas = await Ruta.find()
      .populate("zona", "nombre")
      .populate("choferAsignado", "usuario")
      .populate("vehiculoAsignado", "patente marca modelo")
      .lean();

    // Populate manual of users attached to chofer to avoid deep populate issues easily
    const Chofer = require("../../models/Chofer");
    for (const r of rutas) {
      if (r.choferAsignado) {
        const c = await Chofer.findById(r.choferAsignado._id).populate("usuario", "nombre apellido dni");
        r.choferAsignado = c;
      }
    }

    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("Rutas");

    worksheet.columns = [
      { header: "CÓDIGO", key: "codigo", width: 15 },
      { header: "SALIDA", key: "salida", width: 10 },
      { header: "FRECUENCIA", key: "frecuencia", width: 20 },
      { header: "DESCRIPCIÓN", key: "descripcion", width: 35 },
      { header: "CHOFER", key: "chofer", width: 30 },
      { header: "PATENTE", key: "patente", width: 15 },
      { header: "VEHÍCULO", key: "vehiculo", width: 25 },
    ];

    // Style Header
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4C6EF5" } };
      cell.alignment = { horizontal: "center" };
    });

    // Diccionario de letras para diasSemana posicional (Lunes a Domingo)
    const letrasDias = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

    rutas.forEach((ruta) => {
      let freqTexto = ruta.frecuencia?.tipo || "N/A";
      let dSemana = "";

      if (ruta.frecuencia?.diasSemana?.length === 7) {
        // Mapear el array de booleanos [true, false, true, ...] a 'L, X, ...'
        const diasActivos = ruta.frecuencia.diasSemana
          .map((activo, index) => activo ? letrasDias[index] : null)
          .filter(Boolean); // quita los null

        if (diasActivos.length > 0) {
          dSemana = diasActivos.join(", ");
        }
      }

      let choferTexto = "Sin Asignar";
      if (ruta.choferAsignado?.usuario) {
        choferTexto = `${ruta.choferAsignado.usuario.nombre || ''} ${ruta.choferAsignado.usuario.apellido || ''}`.trim();
      }

      let patenteTexto = "Sin Asignar";
      let vehiculoTexto = "-";
      if (ruta.vehiculoAsignado) {
        patenteTexto = ruta.vehiculoAsignado.patente || "S/P";
        vehiculoTexto = `${ruta.vehiculoAsignado.marca || ''} ${ruta.vehiculoAsignado.modelo || ''}`.trim();
      }

      worksheet.addRow({
        codigo: ruta.codigo || "-",
        salida: ruta.horaSalida || "-",
        frecuencia: dSemana || freqTexto,
        descripcion: ruta.descripcion || "-",
        chofer: choferTexto,
        patente: patenteTexto,
        vehiculo: vehiculoTexto,
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Reporte_Rutas.xlsx"
    );

    await workbook.xlsx.write(res);
    res.status(200).end();

  } catch (error) {
    console.error("Error al generar Excel de rutas:", error);
    res.status(500).json({ error: "Error al generar el reporte Excel" });
  }
};

// Exportar a Excel Consolidado (Rutas + Legajos de Choferes)
const reporteExcelConsolidado = async (req, res) => {
  try {
    const rutas = await Ruta.find()
      .populate("zona", "nombre")
      .populate("choferAsignado", "usuario")
      .populate("vehiculoAsignado", "patente marca modelo")
      .lean();

    const Chofer = require("../../models/Chofer");
    for (const r of rutas) {
      if (r.choferAsignado) {
        const c = await Chofer.findById(r.choferAsignado._id).populate("usuario", "nombre apellido dni email");
        r.choferAsignado = c;
      }
    }

    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("Consolidado");

    worksheet.columns = [
      { header: "CÓDIGO RUTA", key: "codigo", width: 15 },
      { header: "DESCRIPCIÓN RUTA", key: "descripcion", width: 35 },
      { header: "FRECUENCIA", key: "frecuencia", width: 20 },
      { header: "SALIDA", key: "salida", width: 10 },

      { header: "CHOFER ASIGNADO", key: "chofer", width: 35 },
      { header: "DNI CHOFER", key: "dni", width: 15 },
      { header: "VÍNCULO", key: "vinculo", width: 15 },
      { header: "EMAIL DE CONTACTO", key: "email", width: 25 },
      { header: "CUIT (CONTRATADO)", key: "cuit", width: 15 },
      { header: "INGRESO", key: "ingreso", width: 15 },

      { header: "PATENTE", key: "patente", width: 15 },
      { header: "VEHÍCULO", key: "vehiculo", width: 25 },
    ];

    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4C6EF5" } };
      cell.alignment = { horizontal: "center" };
    });

    const letrasDias = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

    rutas.forEach((ruta) => {
      // Formateo Rutas
      let freqTexto = ruta.frecuencia?.tipo || "N/A";
      let dSemana = "";
      if (ruta.frecuencia?.diasSemana?.length === 7) {
        const diasActivos = ruta.frecuencia.diasSemana
          .map((activo, index) => activo ? letrasDias[index] : null)
          .filter(Boolean);
        if (diasActivos.length > 0) dSemana = diasActivos.join(", ");
      }

      let patenteTexto = "Sin Asignar";
      let vehiculoTexto = "-";
      if (ruta.vehiculoAsignado) {
        patenteTexto = ruta.vehiculoAsignado.patente || "S/P";
        vehiculoTexto = `${ruta.vehiculoAsignado.marca || ''} ${ruta.vehiculoAsignado.modelo || ''}`.trim();
      }

      // Formateo Chofer
      let choferTexto = "Sin Asignar";
      let dniTexto = "-";
      let vinculoTexto = "-";
      let emailTexto = "-";
      let cuitTexto = "-";
      let ingresoTexto = "-";

      const c = ruta.choferAsignado;
      if (c) {
        if (c.usuario) {
          choferTexto = `${c.usuario.nombre || ''} ${c.usuario.apellido || ''}`.trim();
          dniTexto = c.usuario.dni || "-";
          emailTexto = c.usuario.email || "-";
        }
        vinculoTexto = c.tipoVinculo ? c.tipoVinculo.toUpperCase() : "-";

        if (c.tipoVinculo === 'contratado' && c.datosContratado) {
          // Si datosContratado tiene un email específico y no teníamos uno del usuario, usarlo.
          if (c.datosContratado.email && emailTexto === "-") {
            emailTexto = c.datosContratado.email;
          }
          cuitTexto = c.datosContratado.cuit || "S/C";
          if (c.datosContratado.fechaIngreso) {
            const f = new Date(c.datosContratado.fechaIngreso);
            ingresoTexto = `${f.getDate().toString().padStart(2, '0')}/${(f.getMonth() + 1).toString().padStart(2, '0')}/${f.getFullYear()}`;
          }
        }
      }

      worksheet.addRow({
        codigo: ruta.codigo || "-",
        descripcion: ruta.descripcion || "-",
        frecuencia: dSemana || freqTexto,
        salida: ruta.horaSalida || "-",

        chofer: choferTexto,
        dni: dniTexto,
        vinculo: vinculoTexto,
        email: emailTexto,
        cuit: cuitTexto,
        ingreso: ingresoTexto,

        patente: patenteTexto,
        vehiculo: vehiculoTexto,
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Reporte_Consolidado_RutasLegajos.xlsx"
    );

    await workbook.xlsx.write(res);
    res.status(200).end();

  } catch (error) {
    console.error("Error al generar Excel Consolidado:", error);
    res.status(500).json({ error: "Error al generar el reporte Excel Consolidado" });
  }
};

// ==========================================
// FASE 3: Sincronizador Retroactivo a Mes Vencido
// ==========================================
/**
 * Busca todas las hojas de reparto de un Mes y Año específicos.
 * Sobrescribe sus tarifas "tatuadas" o "congeladas" con la tarifa ACTUAL
 * que posea la Ruta asociada al momento de ejecutar este script.
 */
const sincronizarTarifasMesVencido = async (req, res) => {
  try {
    const { mes, anio } = req.body;

    if (!mes || !anio) {
      return res.status(400).json({ error: "El mes y año son obligatorios." });
    }

    // Parseo seguro para index 0 y limites del calendario
    const mesIndex = parseInt(mes, 10) - 1; // JS months are 0-11
    const anioParsed = parseInt(anio, 10);

    const inicioMes = new Date(anioParsed, mesIndex, 1);
    inicioMes.setHours(0, 0, 0, 0);

    const finMes = new Date(anioParsed, mesIndex + 1, 0); // Last day of month
    finMes.setHours(23, 59, 59, 999);

    // Requerimos HojaReparto localmente para no romper referencias cíclicas si las hay
    const HojaReparto = require("../../models/HojaReparto");

    // Buscamos todas las hojas de reparto NO especiales de la ventana temporal
    const hojas = await HojaReparto.find({
      fecha: { $gte: inicioMes, $lte: finMes },
      numeroHoja: { $not: /SDA-ESPECIAL/ } // Excluimos hojas especiales (ellas tienen precios manuales puros)
    }).populate("ruta");

    if (hojas.length === 0) {
      return res.status(404).json({
        mensaje: `No se encontraron hojas de reparto en ${mes}/${anio} para sincronizar.`
      });
    }

    let actualizadas = 0;
    let errores = 0;

    // Iteramos e inyectamos la inflación masiva
    for (const hoja of hojas) {
      if (!hoja.ruta) continue; // Si la hoja no tiene ruta (huérfana), saltamos

      try {
        const rutaActual = hoja.ruta; // Como usamos populate, ya tenemos el doc de la Ruta

        hoja.tipoPago = rutaActual.tipoPago || 'por_km';
        hoja.precioKm = rutaActual.precioKm || 0;
        hoja.montoMensual = rutaActual.montoMensual || 0;
        hoja.montoPorDistribucion = rutaActual.montoPorDistribucion || 0;

        // Grabamos una huella de la intervención
        const Usuario = require("../../models/Usuario");
        const usuarioAdmin = req.usuario?.id ? await Usuario.findById(req.usuario.id).lean() : null;
        const nombreAdmin = usuarioAdmin?.nombre || 'Administrador Sincronizador';

        hoja.historialMovimientos.push({
          usuario: req.usuario?.id || null,
          accion: `[SISTEMA] Sincronización a Mes Vencido por ${nombreAdmin}. Tarifas actualizadas a los valores vigentes de la ruta ${rutaActual.codigo}.`
        });

        await hoja.save();
        actualizadas++;
      } catch (e) {
        console.error(`Error al sincronizar hoja ${hoja._id}:`, e);
        errores++;
      }
    }

    res.status(200).json({
      mensaje: `Sincronización completada.`,
      estadisticas: {
        totalEncontradas: hojas.length,
        actualizadasExitosamente: actualizadas,
        erroresIgnorados: errores
      }
    });

  } catch (error) {
    console.error("❌ Error en sincronizarTarifasMesVencido:", error);
    res.status(500).json({ error: "Hubo un error interno al intentar sincronizar el mes." });
  }
};

module.exports = {
  crearRuta,
  obtenerRutas,
  actualizarRuta,
  cambiarEstadoRuta,
  obtenerTodasLasRutas,
  agregarLocalidadesARuta,
  eliminarLocalidadDeRuta,
  eliminarRuta,
  actualizarTarifasMasivas,
  reporteExcelRutas,
  reporteExcelConsolidado,
  sincronizarTarifasMesVencido,
};
