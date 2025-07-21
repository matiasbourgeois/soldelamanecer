const Chofer = require("../models/Chofer");
const Vehiculo = require("../models/Vehiculo");
const connUsuarios = require("../config/dbUsuarios");
const Usuario = require("../models/UsuarioSistema");


// Crear nuevo chofer
const crearChofer = async (req, res) => {
  try {
    const { usuario, dni, telefono, tipoVinculo } = req.body;

    if (!usuario || !dni || !telefono || !tipoVinculo) {
      return res.status(400).json({ msg: "Faltan campos obligatorios." });
    }

    const UsuarioExterno = connUsuarios.models.UsuarioSistema;
    const usuarioDB = await UsuarioExterno.findById(usuario);


    if (!usuarioDB) {
      return res.status(404).json({ msg: "Usuario no encontrado." });
    }

    if (usuarioDB.rol === "cliente") {
      usuarioDB.rol = "chofer";
      await usuarioDB.save();
    }

    if (!usuarioDB.verificado || !usuarioDB.activo) {
      return res.status(400).json({ msg: "El usuario no está verificado o activo." });
    }

    const existeChofer = await Chofer.findOne({ usuario });
    if (existeChofer) {
      return res.status(400).json({ msg: "Ya existe un chofer para este usuario." });
    }

    const nuevoChofer = new Chofer({
      usuario,
      dni,
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

    const UsuarioExterno = connUsuarios.models.UsuarioSistema;

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

    const { dni, telefono, tipoVinculo } = req.body;

    if (dni) chofer.dni = dni;
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
    const usuario = await Usuario.findById(chofer.usuario);
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





module.exports = {
  crearChofer,
  obtenerChoferes,
  obtenerChofer,
  editarChofer,
  eliminarChofer,
  obtenerChoferesMinimos,
};
