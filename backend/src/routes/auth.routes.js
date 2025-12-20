// routes/usuarios.js
const express = require("express");
const router = express.Router();
const {
  cambiarRolUsuario,
  obtenerUsuarios,
  cambiarVerificacionUsuario,
  obtenerPerfil,
  eliminarUsuario,
  completarPerfilUsuario,
  actualizarUsuarioDesdeAdmin,
  obtenerUsuarioPorId,
  obtenerUsuariosPaginados
} = require("../controllers/auth/usuariosController");

const { login, register } = require("../controllers/auth/authController");
const verificarToken = require("../middlewares/verificarToken");
const upload = require("../middlewares/upload");
const Usuario = require("../models/Usuario"); // modelo de usuarios

// 📷 Subida de foto de perfil
router.post(
  "/subir-foto",
  verificarToken,
  upload.single("foto"),
  async (req, res) => {
    try {
      const usuario = await Usuario.findById(req.usuario.id);
      if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

      usuario.fotoPerfil = `/uploads/perfiles/${req.file.filename}`;
      await usuario.save();

      res.json({ mensaje: "Foto actualizada", fotoPerfil: usuario.fotoPerfil });
    } catch (error) {
      console.error("❌ Error al subir foto:", error);
      res.status(500).json({ error: "Error al guardar foto" });
    }
  }
);

// 🔓 Rutas públicas
router.post("/login", login);
router.post("/register", register);

// 🔐 Rutas protegidas
router.put("/perfil-completo", verificarToken, completarPerfilUsuario); // ✅ ESTA PRIMERO
router.get("/perfil", verificarToken, obtenerPerfil);
router.get("/", verificarToken, obtenerUsuarios);

router.patch("/:id/rol", verificarToken, cambiarRolUsuario);
router.put("/verificar/:id", verificarToken, cambiarVerificacionUsuario);
router.put("/:id", verificarToken, actualizarUsuarioDesdeAdmin);
router.delete("/:id", verificarToken, eliminarUsuario);
router.get("/paginados", verificarToken, obtenerUsuariosPaginados);
router.get("/:id", verificarToken, obtenerUsuarioPorId); // ✅ ESTA VA ÚLTIMA


module.exports = router;
