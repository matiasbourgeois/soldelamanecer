const Usuario = require("../models/UsuarioSistema");
const jwt = require("jsonwebtoken");

module.exports = async function verificarToken(req, res, next) {

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "Token no proporcionado o inválido" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const usuario = await Usuario.findById(decoded.id || decoded._id);

    if (!usuario) {
      return res.status(401).json({ msg: "Usuario no encontrado" });
    }

    req.usuario = {
      id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    };

    next();
  } catch (error) {
    console.error("❌ Error al verificar token:", error);
    return res.status(401).json({ msg: "Token inválido o expirado" });
  }
};
