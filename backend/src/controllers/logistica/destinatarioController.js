const Destinatario = require("../../models/Destinatario");

// Crear nuevo destinatario
const crearDestinatario = async (req, res) => {
  try {
    const { nombre, dni, telefono, email, direccion, localidad, provincia } = req.body;

    if (!localidad) {
      return res.status(400).json({ error: "La localidad es obligatoria" });
    }

    // Evitar duplicados por DNI
    const yaExiste = await Destinatario.findOne({ dni });

    if (yaExiste) {
      return res.status(400).json({ error: "Ya existe un destinatario con ese DNI" });
    }

    const nuevoDestinatario = new Destinatario({
      nombre,
      dni,
      telefono,
      email,
      direccion,
      localidad,
      provincia,
    });

    const guardado = await nuevoDestinatario.save();
    res.status(201).json(guardado);
  } catch (error) {
    console.error("Error al crear destinatario:", error);
    res.status(500).json({ error: "Error al crear el destinatario" });
  }
};


// Obtener todos los destinatarios
const obtenerDestinatarios = async (req, res) => {
  try {
    const destinatarios = await Destinatario.find().populate("localidad");
    res.json(destinatarios);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los destinatarios" });
  }
};

// Obtener destinatario por ID
const obtenerDestinatarioPorId = async (req, res) => {
  try {
    const destinatario = await Destinatario.findById(req.params.id).populate("localidad");
    if (!destinatario) {
      return res.status(404).json({ error: "Destinatario no encontrado" });
    }
    res.json(destinatario);
  } catch (error) {
    res.status(500).json({ error: "Error al buscar destinatario" });
  }
};

const buscarDestinatarios = async (req, res) => {
  try {
    const busqueda = req.query.busqueda || "";
    const pagina = parseInt(req.query.pagina) || 0;
    const limite = parseInt(req.query.limite) || 10;

    const filtro = {
      $or: [
        { nombre: { $regex: busqueda, $options: "i" } },
        { dni: { $regex: busqueda, $options: "i" } },
        { email: { $regex: busqueda, $options: "i" } },
      ]
    };


    const total = await Destinatario.countDocuments(filtro);

    const resultados = await Destinatario.find(filtro)
      .populate("localidad")
      .sort({ nombre: 1 })
      .skip(pagina * limite)
      .limit(limite);

    res.json({ total, resultados });
  } catch (error) {
    console.error("Error en búsqueda de destinatarios:", error);
    res.status(500).json({ error: "Error al buscar destinatarios" });
  }
};


module.exports = {
  crearDestinatario,
  obtenerDestinatarios,
  obtenerDestinatarioPorId,
  buscarDestinatarios,
};
