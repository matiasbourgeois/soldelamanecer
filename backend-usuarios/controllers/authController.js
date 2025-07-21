const Usuario = require("../models/Usuario");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const enviarEmailVerificacion = require("../utils/emailService");

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

    const enlaceVerificacion = `https://api.soldelamanecer.ar/api/auth/verify/${tokenVerificacion}`;
    await enviarEmailVerificacion(email, nombre, enlaceVerificacion);

    res.status(201).json({
      mensaje: "Usuario registrado con éxito. Verifica tu correo electrónico.",
    });
  } catch (error) {
    console.error("🚨 Error en registro:", error);
    res.status(500).json({ error: "Error en el servidor" });
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

    res.send(`
      <html>
        <head>
          <title>Cuenta verificada</title>
          <style>
            body { font-family: Arial; background-color: #fff; color: #000; text-align: center; padding: 50px; }
            .container { max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; padding: 40px; }
            .check { font-size: 50px; color: #28a745; }
            .btn { margin-top: 20px; padding: 10px 20px; background-color: #ffc107; color: black; border-radius: 4px; text-decoration: none; font-weight: bold; }
            .btn:hover { background-color: #e0a800; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="check">✅</div>
            <h2>¡Cuenta verificada con éxito!</h2>
            <p>Ahora podés iniciar sesión en la plataforma.</p>
            <a class="btn" href="https://www.soldelamanecer.ar/login">Ir a Iniciar Sesión</a>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("🚨 Error en verificación:", error);
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

    const token = jwt.sign(
      { id: usuario._id, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      token,
      usuario: {
        id: usuario._id, // 👈 necesario para completar perfil
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        perfilCompleto: usuario.perfilCompleto || false,
      },
    });
  } catch (error) {
    console.error("🚨 Error en login:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

module.exports = {
  register,
  verificarCuenta,
  login,
};
