const Usuario = require("../../models/Usuario");
const bcrypt = require("bcryptjs");
const { generarJWT } = require("../../helpers/jwt");


// Cambiar el rol de un usuario (solo admin)
const cambiarRolUsuario = async (req, res) => {
  try {
    const idUsuario = req.params.id;
    const nuevoRol = req.body.rol;

    const rolesValidos = ["cliente", "chofer", "administrativo", "admin"];
    if (!rolesValidos.includes(nuevoRol)) {
      return res.status(400).json({ error: "Rol inválido" });
    }

    if (req.usuario.rol !== "admin") {
      return res.status(403).json({ error: "Acceso denegado. Se requiere rol admin." });
    }

    const usuario = await Usuario.findById(idUsuario);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    usuario.rol = nuevoRol;
    await usuario.save();

    res.json({ mensaje: "Rol actualizado correctamente", usuario });
  } catch (error) {
    console.error("Error al cambiar rol:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};
const loginUsuario = async (req, res) => {
  const { email, contrasena } = req.body;

  try {
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    const passwordCorrecta = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!passwordCorrecta) {
      return res.status(401).json({ msg: "Contraseña incorrecta" });
    }

    const token = generarJWT(usuario._id, usuario.rol);

    const { _id, nombre, rol, perfilCompleto, verificado, dni, telefono, direccion, localidad, provincia } = usuario;

    res.json({
      token,
      usuario: {
        id: _id,
        nombre,
        email: usuario.email,
        rol,
        perfilCompleto,
        verificado,
        dni,
        telefono,
        direccion,
        localidad,
        provincia,
        fotoPerfil: usuario.fotoPerfil
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ msg: "Error al iniciar sesión" });
  }
};
// Verificar usuario (solo admin)
const cambiarVerificacionUsuario = async (req, res) => {
  try {
    const idUsuario = req.params.id;

    if (req.usuario.rol !== "admin") {
      return res.status(403).json({ error: "Acceso denegado. Se requiere rol admin." });
    }

    const usuario = await Usuario.findById(idUsuario);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    usuario.verificado = true;

    await usuario.save();

    res.json({ mensaje: "Verificación actualizada", usuario });
  } catch (error) {
    console.error("Error al cambiar verificación:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// Obtener todos los usuarios (solo admin)
const obtenerUsuarios = async (req, res) => {
  try {
    if (req.usuario.rol !== "admin") {
      return res.status(403).json({ error: "Acceso denegado" });
    }

    const usuarios = await Usuario.find().select("-contrasena");
    res.json(usuarios);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error al obtener los usuarios" });
  }
};

// Obtener perfil del usuario autenticado
const obtenerPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id).select("-contrasena");

    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    res.status(200).json({ usuario });
  } catch (error) {
    console.error("Error al obtener el perfil:", error);
    res.status(500).json({ msg: "Error en el servidor" });
  }
};


// Eliminar usuario (solo admin)
const eliminarUsuario = async (req, res) => {
  try {
    const idUsuario = req.params.id;

    if (req.usuario.rol !== "admin") {
      return res.status(403).json({ error: "Acceso denegado. Se requiere rol admin." });
    }

    const usuarioEliminado = await Usuario.findByIdAndDelete(idUsuario);

    if (!usuarioEliminado) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ mensaje: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// Completar perfil
const completarPerfilUsuario = async (req, res) => {

  if (!req.usuario) {
    return res.status(403).json({ msg: "Token válido pero req.usuario está ausente" });
  }

  if (!req.usuario.id) {
    return res.status(403).json({ msg: "Token válido pero no se pudo identificar al usuario" });
  }

  try {
    const { dni, telefono, direccion, localidad, provincia } = req.body;

    const idUsuario = req.usuario.id;

    const usuario = await Usuario.findById(idUsuario);
    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    usuario.dni = dni;
    usuario.telefono = telefono;
    usuario.direccion = direccion;
    usuario.localidad = localidad;
    usuario.provincia = provincia;
    usuario.perfilCompleto = true;

    const usuarioActualizado = await usuario.save();

    res.json({ msg: "Perfil actualizado", usuario: usuarioActualizado });
  } catch (error) {
    console.error("Error al completar perfil:", error);
    res.status(500).json({ msg: "Error en el servidor" });
  }
};



const actualizarUsuarioDesdeAdmin = async (req, res) => {
  try {
    if (req.usuario.rol !== "admin" && req.usuario.rol !== "administrativo") {
      return res.status(403).json({ error: "Acceso denegado." });
    }

    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" });

    const { nombre, dni, telefono, direccion, localidad, provincia } = req.body;

    if (nombre) usuario.nombre = nombre;
    if (dni) usuario.dni = dni;
    if (telefono) usuario.telefono = telefono;
    if (direccion) usuario.direccion = direccion;
    if (localidad) usuario.localidad = localidad;
    if (provincia) usuario.provincia = provincia;

    const actualizado = await usuario.save();
    res.json({ msg: "Usuario actualizado", usuario: actualizado });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({ msg: "Error al actualizar usuario" });
  }
};

const obtenerUsuarioPorId = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select("-contrasena");
    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    res.json({ usuario });
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({ msg: "Error al obtener usuario" });
  }
};
const obtenerUsuariosPaginados = async (req, res) => {
  try {
    if (req.usuario.rol !== "admin") {
      return res.status(403).json({ error: "Acceso denegado" });
    }

    const pagina = parseInt(req.query.pagina) || 0;
    const limite = parseInt(req.query.limite) || 10;
    const busqueda = req.query.busqueda?.trim().toLowerCase() || "";

    const filtro = {};

    if (busqueda) {
      filtro.$or = [
        { nombre: { $regex: busqueda, $options: "i" } },
        { email: { $regex: busqueda, $options: "i" } },
      ];
    }

    const total = await Usuario.countDocuments(filtro);

    const usuarios = await Usuario.find(filtro)
      .select("-contrasena")
      .skip(pagina * limite)
      .limit(limite)
      .sort({ nombre: 1 });

    res.json({
      total,
      resultados: usuarios,
    });
  } catch (error) {
    console.error("Error al obtener usuarios paginados:", error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};




// Cambiar contraseña
const cambiarPassword = async (req, res) => {
  try {
    const { passwordActual, passwordNueva } = req.body;
    const usuario = await Usuario.findById(req.usuario.id);

    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    // Verificar contraseña actual
    const passwordCorrecta = await bcrypt.compare(passwordActual, usuario.contrasena);
    if (!passwordCorrecta) {
      return res.status(400).json({ msg: "La contraseña actual es incorrecta" });
    }

    // Guardar nueva contraseña (el modelo se encarga de hashear)
    usuario.contrasena = passwordNueva;
    await usuario.save();




    res.json({ msg: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    res.status(500).json({ msg: "Error al cambiar la contraseña" });
  }
};


module.exports = {
  cambiarRolUsuario,
  obtenerUsuarios,
  cambiarVerificacionUsuario,
  obtenerPerfil,
  eliminarUsuario,
  completarPerfilUsuario,
  loginUsuario,
  actualizarUsuarioDesdeAdmin,
  obtenerUsuarioPorId,
  obtenerUsuariosPaginados,
  cambiarPassword
};
