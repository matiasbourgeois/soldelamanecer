const Chofer = require("../../models/Chofer");
const Vehiculo = require("../../models/Vehiculo");
const UsuarioSistema = require("../../models/Usuario");


// Crear nuevo chofer
const crearChofer = async (req, res) => {
  try {
    const { usuario, dni, telefono, tipoVinculo } = req.body;

    if (!usuario || !dni || !telefono || !tipoVinculo) {
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
      existeChofer.dni = dni;
      existeChofer.telefono = telefono;
      existeChofer.tipoVinculo = tipoVinculo;
      existeChofer.activo = true; // Ensure it's active
      await existeChofer.save();
      return res.status(200).json({ msg: "Chofer actualizado/reactivado correctamente.", chofer: existeChofer });
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

    // Buscar si tiene alguna ruta asignada
    // Importante: Model Ruta debe ser requerido arriba si no lo está
    const Ruta = require("../../models/Ruta");
    // Buscar la ruta asignada al chofer y popular su vehículo
    const rutaAsignada = await Ruta.findOne({ choferAsignado: chofer._id }).populate("vehiculoAsignado");

    // LÓGICA DE NEGOCIO CORREGIDA:
    // El vehículo viene de la RUTA, no del chofer directamenete.
    // Si la ruta tiene vehículo, ese es el que vale.
    // Solo si no hay ruta, miramos si el chofer tiene uno "por defecto" (legacy).
    const vehiculoFinal = (rutaAsignada && rutaAsignada.vehiculoAsignado)
      ? rutaAsignada.vehiculoAsignado
      : chofer.vehiculoAsignado;

    res.json({
      vehiculo: vehiculoFinal,
      ruta: rutaAsignada
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
      .select("patente marca modelo kilometrajeActual tipoPropiedad tipoCombustible")
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

module.exports = {
  crearChofer,
  obtenerChoferes,
  obtenerChofer,
  editarChofer,
  eliminarChofer,
  obtenerChoferesMinimos,
  obtenerMiConfiguracion,
  obtenerSelectoresReporte
};
