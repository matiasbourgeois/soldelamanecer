const Usuario = require("../../models/Usuario");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { enviarEmailVerificacion } = require("../../utils/emailService");
const logger = require("../../utils/logger");
const handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");

const JWT_SECRET = process.env.JWT_SECRET || "secreto_super_seguro";

// 🔹 Registro
const register = async (req, res) => {
  try {
    const { nombre, email, contrasena } = req.body;

    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    const tokenVerificacion = crypto.randomBytes(32).toString("hex");

    const nuevoUsuario = new Usuario({
      nombre,
      email,
      contrasena,
      rol: "cliente",
      verificado: false,
      tokenVerificacion,
    });

    await nuevoUsuario.save();

    const apiBaseUrl = process.env.API_URL || "https://api-choferes.cotizadorlogistico.site";
    const enlaceVerificacion = `${apiBaseUrl}/api/usuarios/verify/${tokenVerificacion}`;

    // 📧 Intentar enviar email, pero no bloquear registro si falla (Soft Fail)
    try {
      await enviarEmailVerificacion(email, nombre, enlaceVerificacion);
    } catch (emailError) {
      logger.warn("⚠️ Advertencia: No se pudo enviar el email de verificación:", { error: emailError.message });
      // No retornamos error 500 para dejar que el usuario se registre igual
    }

    res.status(201).json({
      mensaje: "Usuario registrado con éxito. " + (process.env.EMAIL_USER ? "Verifica tu correo electrónico." : "(Simulado)"),
    });
  } catch (error) {
    logger.error("🚨 Error en registro:", error);
    res.status(500).json({ error: "Error en el servidor al registrar usuario" });
  }
};

// 🔹 Verificación por token
const verificarCuenta = async (req, res) => {
  try {
    const usuario = await Usuario.findOne({
      tokenVerificacion: req.params.token,
    });

    if (!usuario) {
      return res.status(400).json({ error: "Token inválido o expirado" });
    }

    usuario.verificado = true;
    usuario.tokenVerificacion = null;
    await usuario.save();

    // 📄 Cargar y compilar plantilla
    const templatePath = path.join(process.cwd(), "templates", "template-verificacion.html");
    const htmlContent = fs.readFileSync(templatePath, "utf8");
    const template = handlebars.compile(htmlContent);

    const loginUrl = `${process.env.FRONTEND_URL || 'https://www.soldelamanecer.ar'}/login`;
    const finalHtml = template({ loginUrl });

    res.send(finalHtml);
  } catch (error) {
    logger.error("🚨 Error en verificación:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// 🔹 Login
const login = async (req, res) => {
  try {
    const { email, contrasena } = req.body;

    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(400).json({ error: "Credenciales inválidas" });
    }

    if (!usuario.verificado) {
      return res.status(400).json({ error: "Cuenta no verificada. Revisa tu correo." });
    }

    const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!contrasenaValida) {
      return res.status(400).json({ error: "Credenciales inválidas" });
    }

    // 🕒 Lógica de Expiración del Token
    // Si es chofer (Mobile App), el token es "eterno" (10 años).
    // Si es otro rol (Web App), el token dura 24 horas.
    const expiresIn = usuario.rol === 'chofer' ? '3650d' : '24h';

    const token = jwt.sign(
      { id: usuario._id, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn }
    );

    // Si es chofer, buscamos su perfil para obtener datos extra
    let datosChofer = {};
    if (usuario.rol === 'chofer') {
      const Chofer = require("../../models/Chofer");
      const choferPerfil = await Chofer.findOne({ usuario: usuario._id });
      if (choferPerfil) {
        // 🔒 Bloqueo temporal: los contratados aún no tienen acceso a la app móvil
        if (choferPerfil.tipoVinculo === 'contratado') {
          return res.status(403).json({
            error: "Su acceso a la app móvil no está habilitado aún. Comuníquese con la administración."
          });
        }
        datosChofer = {
          tipoContrato: choferPerfil.tipoVinculo, // Mapeamos tipoVinculo a tipoContrato para el frontend
          vehiculoAsignado: choferPerfil.vehiculoAsignado
        };
      }
    }

    res.json({
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        perfilCompleto: usuario.perfilCompleto || false,
        ...datosChofer // Fusionamos datos del chofer
      },
    });
  } catch (error) {
    logger.error("🚨 Error en login:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

module.exports = {
  register,
  verificarCuenta,
  login,
};
