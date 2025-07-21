const Localidad = require("../models/Localidad");

// GET - Obtener todas
const obtenerLocalidades = async (req, res) => {
  try {
    const localidades = await Localidad.find().sort({ nombre: 1 });
    res.json(localidades);
  } catch (error) {
    console.error("Error al obtener localidades:", error);
    res.status(500).json({ msg: "Error al obtener localidades" });
  }
};

// POST - Crear nueva
const crearLocalidad = async (req, res) => {
  try {
    const { nombre } = req.body;

    const existe = await Localidad.findOne({ nombre: nombre.trim().toUpperCase() });
    if (existe) {
      return res.status(400).json({ msg: "Ya existe una localidad con ese nombre" });
    }

    const nueva = new Localidad({
      ...req.body,
      nombre: nombre.trim().toUpperCase(),
    });

    const guardada = await nueva.save();
    res.status(201).json(guardada);
  } catch (error) {
    console.error("Error al crear localidad:", error);
    res.status(500).json({ msg: "Error al crear localidad" });
  }
};

// PUT - Actualizar
const actualizarLocalidad = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;

    const localidad = await Localidad.findById(id);
    if (!localidad) return res.status(404).json({ msg: "No encontrada" });

    const duplicada = await Localidad.findOne({ nombre: nombre.trim().toUpperCase() });
    if (duplicada && String(duplicada._id) !== id) {
      return res.status(400).json({ msg: "Ya existe otra localidad con ese nombre" });
    }

    localidad.nombre = nombre.trim().toUpperCase();
    localidad.frecuencia = req.body.frecuencia || "";
    localidad.horarios = req.body.horarios || "";
    localidad.codigoPostal = req.body.codigoPostal || "";
    localidad.activa = req.body.activa !== undefined ? req.body.activa : localidad.activa;

    const actualizada = await localidad.save();
    res.json(actualizada);
  } catch (error) {
    console.error("Error al actualizar localidad:", error);
    res.status(500).json({ msg: "Error al actualizar localidad" });
  }
};

// PATCH - Cambiar estado (activa/inactiva)
const cambiarEstadoLocalidad = async (req, res) => {
  try {
    const { id } = req.params;

    const localidad = await Localidad.findById(id);
    if (!localidad) return res.status(404).json({ msg: "No encontrada" });

    localidad.activa = !localidad.activa;
    const actualizada = await localidad.save();
    res.json(actualizada);
  } catch (error) {
    console.error("Error al cambiar estado:", error);
    res.status(500).json({ msg: "Error al cambiar estado de localidad" });
  }
};

const eliminarLocalidad = async (req, res) => {
    try {
      const { id } = req.params;
      const localidad = await Localidad.findByIdAndDelete(id);
      if (!localidad) {
        return res.status(404).json({ msg: "Localidad no encontrada" });
      }
      res.json({ msg: "Localidad eliminada correctamente" });
    } catch (error) {
      console.error("❌ Error al eliminar localidad:", error);
      res.status(500).json({ msg: "Error interno del servidor" });
    }
  };
  const obtenerLocalidadesPaginadas = async (req, res) => {
    try {
      const pagina = parseInt(req.query.pagina) || 0;
      const limite = parseInt(req.query.limite) || 10;
      const busqueda = req.query.busqueda?.trim().toLowerCase() || "";
  
      const filtro = {};
  
      if (busqueda) {
        filtro.$or = [
          { nombre: { $regex: busqueda, $options: "i" } },
          { cp: { $regex: busqueda, $options: "i" } }
        ];
      }      
  
      const total = await Localidad.countDocuments(filtro);
  
      const localidades = await Localidad.find(filtro)
        .skip(pagina * limite)
        .limit(limite)
        .sort({ nombre: 1 });
  
      res.json({
        total,
        resultados: localidades,
      });
    } catch (error) {
      console.error("❌ Error al obtener localidades paginadas:", error);
      res.status(500).json({ msg: "Error al obtener localidades" });
    }
  };
  

module.exports = {
    obtenerLocalidades,
    obtenerLocalidadesPaginadas,
    crearLocalidad,
    actualizarLocalidad,
    cambiarEstadoLocalidad,
    eliminarLocalidad,
  };
  