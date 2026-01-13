const Vehiculo = require("../../models/Vehiculo");
const MantenimientoLog = require("../../models/MantenimientoLog");

// Crear vehículo
const crearVehiculo = async (req, res) => {
  try {
    const nuevoVehiculo = new Vehiculo(req.body);
    await nuevoVehiculo.save();
    res.status(201).json(nuevoVehiculo);
  } catch (error) {
    console.error("Error al crear vehículo:", error);
    if (error.code === 11000 || error.code === '11000' || (error.keyPattern && error.keyPattern.patente) || (error.message && /duplicate/i.test(error.message))) {
      return res.status(400).json({ error: "La patente ya está registrada." });
    }
    res.status(500).json({ error: "Error al crear vehículo" });
  }
}


// Obtener todos los vehículos
const obtenerVehiculos = async (req, res) => {
  try {
    const vehiculos = await Vehiculo.find();
    res.json(vehiculos);
  } catch (error) {
    console.error("Error al obtener vehículos:", error);
    res.status(500).json({ error: "Error al obtener vehículos" });
  }
};

// Modificar datos del vehículo
const actualizarVehiculo = async (req, res) => {
  try {
    const { id } = req.params;
    const vehiculoActualizado = await Vehiculo.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!vehiculoActualizado) {
      return res.status(404).json({ error: "Vehículo no encontrado" });
    }

    res.json(vehiculoActualizado);
  } catch (error) {
    console.error("Error al actualizar vehículo:", error);
    if (error.code === 11000 || error.code === '11000' || (error.message && /duplicate/i.test(error.message)) || (error.message && /E11000/i.test(error.message))) {
      return res.status(400).json({ error: "La patente ya está registrada." });
    }
    res.status(500).json({ error: "Error al actualizar vehículo" });
  }
};

// Baja lógica (activo: false)
const cambiarEstadoActivo = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    const vehiculo = await Vehiculo.findById(id);
    if (!vehiculo) {
      return res.status(404).json({ error: "Vehículo no encontrado" });
    }

    vehiculo.activo = activo;
    await vehiculo.save();

    res.json({ mensaje: `Vehículo ${activo ? "activado" : "desactivado"}`, vehiculo });
  } catch (error) {
    console.error("Error al cambiar estado activo:", error);
    res.status(500).json({ error: "Error al cambiar estado" });
  }
};
const obtenerVehiculosPaginado = async (req, res) => {
  try {
    const pagina = parseInt(req.query.pagina) || 0;
    const limite = parseInt(req.query.limite) || 10;
    const busqueda = req.query.busqueda?.toLowerCase() || "";

    const filtro = {
      $or: [
        { patente: { $regex: busqueda, $options: "i" } },
        { marca: { $regex: busqueda, $options: "i" } },
        { modelo: { $regex: busqueda, $options: "i" } },
      ],
    };

    const total = await Vehiculo.countDocuments(filtro);

    const resultados = await Vehiculo.find(filtro)
      .sort({ createdAt: -1 })
      .skip(pagina * limite)
      .limit(limite);

    res.json({ total, resultados });
  } catch (error) {
    console.error("Error al obtener vehículos paginados:", error);
    res.status(500).json({ error: "Error al obtener vehículos paginados" });
  }
};



// Eliminar vehículo
const eliminarVehiculo = async (req, res) => {
  try {
    const { id } = req.params;
    const vehiculoEliminado = await Vehiculo.findByIdAndDelete(id);

    if (!vehiculoEliminado) {
      return res.status(404).json({ error: "Vehículo no encontrado" });
    }

    res.json({ message: "Vehículo eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar vehículo:", error);
    res.status(500).json({ error: "Error al eliminar vehículo" });
  }
};

// ==========================================
// LÓGICA DE MANTENIMIENTO
// ==========================================

// 1. Actualizar Kilometraje (Chofer o Admin)
// PATCH /api/vehiculos/:id/km
const actualizarKilometraje = async (req, res) => {
  try {
    const { id } = req.params;
    const { kilometraje } = req.body;

    const vehiculo = await Vehiculo.findById(id);
    if (!vehiculo) return res.status(404).json({ error: "Vehículo no encontrado" });

    // Validar logicalmente (opcional: alertar si es menor, pero permitir correcciones)
    vehiculo.kilometrajeActual = kilometraje;
    await vehiculo.save();

    res.json({ mensaje: "Kilometraje actualizado", vehiculo });
  } catch (error) {
    console.error("Error al actualizar KM:", error);
    res.status(500).json({ error: "Error al actualizar KM" });
  }
};

// 2. Registrar un Service Realizado
// POST /api/vehiculos/:id/mantenimiento/registro
const registrarMantenimiento = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombreTipo, costo, observaciones, fecha, kmAlMomento } = req.body;
    // nombreTipo debe coincidir con uno de 'configuracionMantenimiento'

    const vehiculo = await Vehiculo.findById(id);
    if (!vehiculo) return res.status(404).json({ error: "Vehículo no encontrado" });

    // Buscar el tipo en la config del vehículo
    const configIndex = vehiculo.configuracionMantenimiento.findIndex(c => c.nombre === nombreTipo);

    if (configIndex === -1) {
      return res.status(400).json({ error: `El tipo de mantenimiento '${nombreTipo}' no está configurado en este vehículo.` });
    }

    // Actualizar ultimoKm al kilometraje del service (manual o actual)
    const kmRegistro = kmAlMomento ? Number(kmAlMomento) : vehiculo.kilometrajeActual;
    const fechaRegistro = fecha ? new Date(fecha) : new Date();

    // Actualizamos el ultimoKm del mantenimiento
    vehiculo.configuracionMantenimiento[configIndex].ultimoKm = kmRegistro;

    // Guardar Log Histórico
    const log = new MantenimientoLog({
      vehiculo: vehiculo._id,
      tipo: nombreTipo,
      kmAlMomento: kmRegistro, // Usamos el valor registrado
      fecha: fechaRegistro, // Usamos fecha manual o actual
      costo: costo || 0,
      observaciones: observaciones || "",
      registradoPor: req.usuario ? req.usuario.id : null // Si hay middleware de auth
    });

    await log.save();

    // Si el kilometraje del service es MAYOR al actual del vehículo (raro pero posible si se olvidaron de actualizar), 
    // podríamos actualizar el vehículo también, pero por seguridad, solo actualizamos el config del mantenimiento.

    await vehiculo.save();

    res.json({ mensaje: "Mantenimiento registrado con éxito", vehiculo, log });
  } catch (error) {
    console.error("Error al registrar mantenimiento:", error);
    res.status(500).json({ error: "Error interno al registrar service" });
  }
};

// 3. Agregar Nuevo Tipo de Mantenimiento (Configuración)
// POST /api/vehiculos/:id/mantenimiento/config
const agregarTipoMantenimiento = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, frecuenciaKm } = req.body;

    const vehiculo = await Vehiculo.findById(id);
    if (!vehiculo) return res.status(404).json({ error: "Vehículo no encontrado" });

    const finalUltimoKm = req.body.ultimoKm !== undefined ? req.body.ultimoKm : vehiculo.kilometrajeActual;

    // Validación: No puede ser mayor al actual
    if (finalUltimoKm > vehiculo.kilometrajeActual) {
      return res.status(400).json({ error: `El kilometraje base (${finalUltimoKm}) no puede ser mayor al kilometraje actual (${vehiculo.kilometrajeActual})` });
    }

    vehiculo.configuracionMantenimiento.push({
      nombre,
      frecuenciaKm,
      ultimoKm: finalUltimoKm
    });

    await vehiculo.save();
    res.json(vehiculo);
  } catch (error) {
    console.error("Error config mantenimiento:", error);
    res.status(500).json({ error: "Error al configurar mantenimiento" });
  }
};

// 4. Editar Frecuencia de Mantenimiento
// PUT /api/vehiculos/:id/mantenimiento/config
const editarTipoMantenimiento = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, nuevaFrecuenciaKm } = req.body;

    const vehiculo = await Vehiculo.findById(id);
    if (!vehiculo) return res.status(404).json({ error: "Vehículo no encontrado" });

    const item = vehiculo.configuracionMantenimiento.find(c => c.nombre === nombre);
    if (!item) return res.status(404).json({ error: "Tipo de mantenimiento no encontrado" });

    if (nuevaFrecuenciaKm !== undefined) item.frecuenciaKm = nuevaFrecuenciaKm;

    if (req.body.ultimoKm !== undefined) {
      // Validación: No puede ser mayor al actual
      if (req.body.ultimoKm > vehiculo.kilometrajeActual) {
        return res.status(400).json({ error: `El kilometraje base (${req.body.ultimoKm}) no puede ser mayor al kilometraje actual (${vehiculo.kilometrajeActual})` });
      }
      item.ultimoKm = req.body.ultimoKm;
    }

    await vehiculo.save();

    res.json(vehiculo);
  } catch (error) {
    console.error("Error edit config:", error);
    res.status(500).json({ error: "Error al editar configuración" });
  }
};

// 5. Eliminar Tipo de Mantenimiento
// DELETE /api/vehiculos/:id/mantenimiento/config/:nombre
const eliminarTipoMantenimiento = async (req, res) => {
  try {
    const { id, nombre } = req.params;

    const vehiculo = await Vehiculo.findById(id);
    if (!vehiculo) return res.status(404).json({ error: "Vehículo no encontrado" });

    vehiculo.configuracionMantenimiento = vehiculo.configuracionMantenimiento.filter(
      (c) => c.nombre !== nombre
    );

    await vehiculo.save();
    res.json(vehiculo);
  } catch (error) {
    console.error("Error al eliminar mantenimiento:", error);
    res.status(500).json({ error: "Error al eliminar configuración" });
  }
};



// 5. Obtener Historial de Mantenimiento
// GET /api/vehiculos/:id/mantenimiento/historial
const obtenerLogMantenimiento = async (req, res) => {
  try {
    const { id } = req.params;
    const pagina = parseInt(req.query.pagina) || 0;
    const limite = parseInt(req.query.limite) || 20;

    const total = await MantenimientoLog.countDocuments({ vehiculo: id });
    const logs = await MantenimientoLog.find({ vehiculo: id })
      .sort({ fecha: -1 })
      .skip(pagina * limite)
      .limit(limite)
      .populate('registradoPor', 'nombre email')
      .populate('ruta', 'codigo descripcion');

    res.json({ total, logs });
  } catch (error) {
    console.error("Error al obtener historial:", error);
    res.status(500).json({ error: "Error al obtener historial" });
  }
};


// 6. Registrar Reporte Diario de Chofer (KM + Combustible + Ruta)
// POST /api/vehiculos/:id/reporte-chofer
const registrarReporteChofer = async (req, res) => {
  try {
    const { id } = req.params;
    const { kilometraje, litros, rutaId, fecha } = req.body;

    const vehiculo = await Vehiculo.findById(id);
    if (!vehiculo) return res.status(404).json({ error: "Vehículo no encontrado" });

    // 1. Validar Límite de Reportes Diarios (Máx 2 por día: Salida y Llegada)
    const fechaReporte = fecha ? new Date(fecha) : new Date();
    const startOfDay = new Date(fechaReporte); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(fechaReporte); endOfDay.setHours(23, 59, 59, 999);

    const reportesHoy = await MantenimientoLog.countDocuments({
      vehiculo: id,
      tipo: "Reporte Diario",
      fecha: { $gte: startOfDay, $lte: endOfDay }
    });

    if (reportesHoy >= 10) { // Límite aumentado a 10 para pruebas
      return res.status(400).json({
        error: "Límite excedido: Ya se cargaron 10 reportes para este vehículo en la fecha seleccionada."
      });
    }

    // 2. Actualizar KM del vehículo si es mayor al actual
    // (Permitimos correcciones menores, pero idealmente debe subir)
    if (kilometraje > vehiculo.kilometrajeActual) {
      vehiculo.kilometrajeActual = kilometraje;
    }

    // 2. Crear Log
    const log = new MantenimientoLog({
      vehiculo: vehiculo._id,
      tipo: "Reporte Diario", // O "Carga Combustible"
      kmAlMomento: kilometraje,
      litrosCargados: litros || 0,
      ruta: rutaId || null,
      fecha: fecha ? new Date(fecha) : new Date(),
      registradoPor: req.usuario ? req.usuario.id : null,
      observaciones: `Reporte diario desde App Móvil.` // Opcional
    });

    await log.save();
    await vehiculo.save();

    res.json({ mensaje: "Reporte registrado correctamente", vehiculo });
  } catch (error) {
    console.error("Error al registrar reporte chofer:", error);
    res.status(500).json({ error: "Error al registrar reporte" });
  }
};

// 7. Obtener Estadísticas de Rendimiento (Diario y Mensual)
// GET /api/vehiculos/:id/estadisticas
const obtenerEstadisticasVehiculo = async (req, res) => {
  try {
    const { id } = req.params;
    const hoy = new Date();
    const startOfDay = new Date(hoy); startOfDay.setHours(0, 0, 0, 0);
    const hace30Dias = new Date(hoy); hace30Dias.setDate(hoy.getDate() - 30);

    // 1. Datos diarios
    const logsHoy = await MantenimientoLog.find({
      vehiculo: id,
      tipo: "Reporte Diario",
      fecha: { $gte: startOfDay }
    }).sort({ fecha: 1 });

    let rendimientoDiario = 0;
    let kmHoy = 0;
    let litrosHoy = 0;

    if (logsHoy.length > 1) {
      kmHoy = logsHoy[logsHoy.length - 1].kmAlMomento - logsHoy[0].kmAlMomento;
      litrosHoy = logsHoy.reduce((acc, curr) => acc + (curr.litrosCargados || 0), 0);
      if (litrosHoy > 0) rendimientoDiario = kmHoy / litrosHoy;
    }

    // 2. Datos mensuales
    const logsMes = await MantenimientoLog.find({
      vehiculo: id,
      tipo: "Reporte Diario",
      fecha: { $gte: hace30Dias }
    }).sort({ fecha: 1 });

    let rendimientoMensual = 0;
    let kmMes = 0;
    let litrosMes = 0;

    if (logsMes.length > 1) {
      kmMes = logsMes[logsMes.length - 1].kmAlMomento - logsMes[0].kmAlMomento;
      litrosMes = logsMes.reduce((acc, curr) => acc + (curr.litrosCargados || 0), 0);
      if (litrosMes > 0) rendimientoMensual = kmMes / litrosMes;
    }

    res.json({
      diario: {
        rendimiento: rendimientoDiario.toFixed(2),
        recorrido: kmHoy,
        litros: litrosHoy
      },
      mensual: {
        rendimiento: rendimientoMensual.toFixed(2),
        recorrido: kmMes,
        litros: litrosMes
      }
    });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
};

module.exports = {
  crearVehiculo,
  obtenerVehiculos,
  actualizarVehiculo,
  cambiarEstadoActivo,
  obtenerVehiculosPaginado,
  eliminarVehiculo,
  actualizarKilometraje,
  registrarMantenimiento,
  agregarTipoMantenimiento,
  editarTipoMantenimiento,
  obtenerLogMantenimiento,
  registrarReporteChofer,
  obtenerEstadisticasVehiculo,
  eliminarTipoMantenimiento
};
