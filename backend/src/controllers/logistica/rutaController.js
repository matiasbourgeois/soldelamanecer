const Ruta = require("../../models/Ruta");
require("../../models/Zona");
const Localidad = require("../../models/Localidad");  // Asegúrate de importar el modelo Localidad

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
      vehiculoAsignado
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
      .populate("vehiculoAsignado", "patente") // solo patente si es lo que usás

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


module.exports = {
  crearRuta,
  obtenerRutas,
  actualizarRuta,
  cambiarEstadoRuta,
  obtenerTodasLasRutas,
  agregarLocalidadesARuta,
  eliminarLocalidadDeRuta,
  eliminarRuta,
};
