const Vehiculo = require("../models/Vehiculo");

// 🟢 Crear vehículo
const crearVehiculo = async (req, res) => {
  try {
    const nuevoVehiculo = new Vehiculo(req.body);
    await nuevoVehiculo.save();
    res.status(201).json(nuevoVehiculo);
  } catch (error) {
    console.error("Error al crear vehículo:", error);
    res.status(500).json({ error: "Error al crear vehículo" });
  }
};

// 🔍 Obtener todos los vehículos
const obtenerVehiculos = async (req, res) => {
  try {
    const vehiculos = await Vehiculo.find();
    res.json(vehiculos);
  } catch (error) {
    console.error("Error al obtener vehículos:", error);
    res.status(500).json({ error: "Error al obtener vehículos" });
  }
};

// ✏️ Modificar datos del vehículo
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
    res.status(500).json({ error: "Error al actualizar vehículo" });
  }
};

// 🚫 Baja lógica (activo: false)
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


module.exports = {
  crearVehiculo,
  obtenerVehiculos,
  actualizarVehiculo,
  cambiarEstadoActivo,
  obtenerVehiculosPaginado,

};
