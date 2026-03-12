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
  obtenerUsuariosPaginados,
  obtenerClientesPaginados,
  buscarClientesParaPromocion,
  cambiarPassword
} = require("../controllers/auth/usuariosController");

const { login, register, verificarCuenta, googleLogin, crearClienteRapido, solicitarRecuperacionPassword, restablecerPassword } = require("../controllers/auth/authController");
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
router.get("/verify/:token", verificarCuenta);
router.post("/login-google", googleLogin);
router.post("/recuperar-password", solicitarRecuperacionPassword);
router.post("/reset-password/:token", restablecerPassword);

// ✨ FASE 11: Altas Administrativas
router.post("/rapido", verificarToken, crearClienteRapido);

// 🔐 Rutas protegidas
router.put("/perfil-completo", verificarToken, completarPerfilUsuario); // ✅ ESTA PRIMERO
router.put("/cambiar-password", verificarToken, cambiarPassword);
router.get("/perfil", verificarToken, obtenerPerfil);
router.get("/", verificarToken, obtenerUsuarios);

router.patch("/:id/rol", verificarToken, cambiarRolUsuario);
router.put("/verificar/:id", verificarToken, cambiarVerificacionUsuario);
router.put("/:id", verificarToken, actualizarUsuarioDesdeAdmin);
router.delete("/:id", verificarToken, eliminarUsuario);
router.get("/paginados", verificarToken, obtenerUsuariosPaginados);
router.get("/clientes", verificarToken, obtenerClientesPaginados); // ✅ FASE 15
router.get("/buscar-promocion", verificarToken, buscarClientesParaPromocion);
router.get("/:id", verificarToken, obtenerUsuarioPorId); // ✅ ESTA VA ÚLTIMA


module.exports = router;
