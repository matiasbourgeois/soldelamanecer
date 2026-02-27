const Usuario = require("../../models/Usuario");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
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

    // FASE 11: Lógica de Reclamo Transparente (Sobrescritura Segura de Cuenta "Placeholder")
    if (usuarioExistente) {
      if (usuarioExistente.creadoPorAdmin) {
        // RECLAMO MÁGICO: El admin lo dio de alta rápido, ahora el cliente real viene a buscar su imperio
        logger.info(`🔄 Reclamo de Cuenta Detectado: ${email}. Transfiriendo dominio al cliente.`);

        const tokenVerificacion = crypto.randomBytes(32).toString("hex");

        // Sobreescribimos datos clave del Placeholder de Management
        usuarioExistente.nombre = nombre; // El nombre que el usuario mismo se puso ahora al registrarse
        usuarioExistente.contrasena = await bcrypt.hash(contrasena, 10);
        usuarioExistente.creadoPorAdmin = false; // FLAG APAGADO (es suyo ahora)
        usuarioExistente.verificado = false; // Le forzamos a verificar el correo real
        usuarioExistente.tokenVerificacion = tokenVerificacion;

        await usuarioExistente.save();

        const apiBaseUrl = process.env.API_URL || "https://api-choferes.cotizadorlogistico.site";
        const enlaceVerificacion = `${apiBaseUrl}/api/usuarios/verify/${tokenVerificacion}`;

        try {
          await enviarEmailVerificacion(email, nombre, enlaceVerificacion);
        } catch (emailError) {
          logger.warn("⚠️ Advertencia: No se pudo enviar el email de Reclamo/Verificación:", { error: emailError.message });
        }

        return res.status(200).json({
          mensaje: "Cuenta recuperada exitosamente. " + (process.env.EMAIL_USER ? "Verifica tu correo electrónico." : "(Simulado)"),
        });

      } else {
        // Choque Normal: Ya se había registrado orgánicamente él mismo
        return res.status(400).json({ error: "El email ya está registrado y activo por el propietario" });
      }
    }

    // Lógica Original de Alta desde Cero
    const tokenVerificacion = crypto.randomBytes(32).toString("hex");

    const contrasenaHeasheada = await bcrypt.hash(contrasena, 10);

    const nuevoUsuario = new Usuario({
      nombre,
      email,
      contrasena: contrasenaHeasheada,
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
        // 🔒 Bloqueo temporal REMOVIDO: Ahora los contratados SÍ tienen acceso a la app móvil
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

// 🔹 Login con Google
const googleLogin = async (req, res) => {
  try {
    const { token: googleToken } = req.body;

    const ticket = await googleClient.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let usuario = await Usuario.findOne({ email });

    if (!usuario) {
      // Registrar nuevo usuario
      const dummyPassword = crypto.randomBytes(16).toString("hex");

      usuario = new Usuario({
        nombre: name,
        email,
        contrasena: dummyPassword,
        rol: "cliente",
        verificado: true,
        activo: true,
        authProvider: "google",
        fotoPerfil: picture || ""
      });
      await usuario.save();
    } else {
      // Asociar si es necesario
      if (usuario.authProvider !== 'google' || !usuario.verificado) {
        usuario.authProvider = 'google';
        usuario.verificado = true; // Si entró con Google, asimilamos su verificación
        if (!usuario.fotoPerfil && picture) {
          usuario.fotoPerfil = picture;
        }
        await usuario.save();
      }
    }

    // Lógica JWT igual al login clásico
    const expiresIn = usuario.rol === 'chofer' ? '3650d' : '24h';

    const token = jwt.sign(
      { id: usuario._id, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn }
    );

    let datosChofer = {};
    if (usuario.rol === 'chofer') {
      const Chofer = require("../../models/Chofer");
      const choferPerfil = await Chofer.findOne({ usuario: usuario._id });
      if (choferPerfil) {
        // Bloqueo removido también en Google Auth
        datosChofer = {
          tipoContrato: choferPerfil.tipoVinculo,
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
        fotoPerfil: usuario.fotoPerfil,
        ...datosChofer
      },
    });

  } catch (error) {
    logger.error("🚨 Error en login con Google:", error);
    res.status(500).json({ error: "Error de autenticación con Google" });
  }
};

// FASE 11: Alta Rápida de Clientes desde el BackOffice (Admin y Administrativos)
const crearClienteRapido = async (req, res) => {
  try {
    // 🛡️ CONTROL DE ACCESO
    if (!req.usuario || (req.usuario.rol !== 'admin' && req.usuario.rol !== 'administrativo' && req.usuario.rol !== 'gestion')) {
      return res.status(403).json({ error: "No tienes permiso para registrar clientes al vuelo." });
    }

    const { nombre, email, telefono, dni } = req.body;

    if (!nombre || !email) {
      return res.status(400).json({ error: "Nombre y Email son obligatorios para el crear el cliente" });
    }

    // Verificar si el email ya existe (hasta como admin chocado)
    const existe = await Usuario.findOne({ email });
    if (existe) {
      return res.status(400).json({ error: "El email ya se encuentra registrado en la base de datos." });
    }

    // Hash aleatorio infumable ya que el cliente no lo sabe
    const contrasenaRandom = crypto.randomBytes(16).toString("hex");

    const nuevoCliente = new Usuario({
      nombre,
      email,
      telefono,
      dni,
      contrasena: contrasenaRandom,
      rol: "cliente",
      verificado: true, // No lo obligamos a que se demore al enviar paquetes
      creadoPorAdmin: true, // ESTE FLAG ES ORO PARA QUE RECUPERE LA CUENTA LUEGO
      activo: true
    });

    await nuevoCliente.save();

    res.status(201).json({
      mensaje: "Cliente generado exitosamente al vuelo",
      cliente: { _id: nuevoCliente._id, nombre: nuevoCliente.nombre, email: nuevoCliente.email, dni: nuevoCliente.dni }
    });

  } catch (error) {
    logger.error("❌ Error en Alta Rápida de Cliente:", error);
    res.status(500).json({ error: "Error en el servidor al intentar registrar el cliente rápido" });
  }
};

module.exports = {
  register,
  verificarCuenta,
  login,
  googleLogin,
  crearClienteRapido
};
