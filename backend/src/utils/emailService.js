const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 🧠 Plantillas por estado
const plantillasCorreo = {
  pendiente: (envio) => ({
    asunto: "Tu envío fue registrado correctamente",
    html: generarHtmlCorreo({
      titulo: "¡Tu envío fue registrado!",
      nombre: envio.clienteRemitente?.nombre || "Cliente",
      mensaje: `Te informamos que hemos registrado correctamente tu envío con número de seguimiento <strong>${envio.numeroSeguimiento}</strong>.`,
      numeroSeguimiento: envio.numeroSeguimiento,
    }),
  }),
  en_reparto: (envio) => ({
    asunto: "Tu envío está en camino",
    html: generarHtmlCorreo({
      titulo: "¡Tu envío está en camino!",
      nombre: envio.clienteRemitente?.nombre || "Cliente",
      mensaje: `Tu envío con número de seguimiento <strong>${envio.numeroSeguimiento}</strong> ha sido despachado y está en camino hacia su destino. Podés consultar el estado en tiempo real usando el botón debajo.`,
      buttonText: "Seguir mi envío",
      buttonUrl: `${process.env.FRONTEND_URL || 'https://soldelamanecer.ar'}/seguimiento/resultado/${envio.numeroSeguimiento}`,
    }),
  }),

};

// 🟡 Plantilla HTML General (God Tier - Cyan Theme)
const generarHtmlCorreo = ({ titulo, nombre, mensaje, buttonText, buttonUrl }) => {
  return `
    <div style="font-family: 'Montserrat', Helvetica, Arial, sans-serif; background-color: #f1f5f9; padding: 40px 20px; color: #1e293b;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
        
        <!-- Header / Hero -->
        <div style="background-color: #0891b2; padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.5px;">
            Sol del Amanecer
          </h1>
          <p style="color: rgba(255,255,255,0.8); margin-top: 5px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">
            Logística Inteligente
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 35px;">
          <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin-bottom: 20px;">
            ${titulo}
          </h2>
          
          <p style="font-size: 16px; margin-bottom: 10px;">
            Hola <strong style="color: #0891b2;">${nombre}</strong>,
          </p>

          <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 30px;">
            ${mensaje}
          </p>

          ${buttonUrl ? `
            <div style="text-align: center; margin: 35px 0;">
              <a href="${buttonUrl}"
                style="
                  background-color: #0891b2;
                  color: #ffffff;
                  text-decoration: none;
                  padding: 15px 35px;
                  border-radius: 12px;
                  font-weight: 700;
                  display: inline-block;
                  font-size: 16px;
                  box-shadow: 0 4px 15px rgba(8, 145, 178, 0.2);
                ">
                ${buttonText || 'Continuar'}
              </a>
            </div>
          ` : ''}

          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">

          <p style="font-size: 14px; color: #64748b; text-align: center;">
            Gracias por confiar en el sistema de logística líder en la región.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">
            © 2026 Sol del Amanecer SRL. Todos los derechos reservados.<br>
            Este es un correo automático, por favor no lo respondas.
          </p>
        </div>

      </div>
    </div>
  `;
};




// ✅ Función principal
const enviarNotificacionEstado = async (envio, nuevoEstado) => {
  try {
    // Validación básica
    if (!envio || !envio.clienteRemitente?.email) {
      console.warn("No se encontró el email del remitente.");
      return;
    }

    const plantilla = plantillasCorreo[nuevoEstado];
    if (!plantilla) {
      console.warn(`No hay plantilla definida para el estado: ${nuevoEstado}`);
      return;
    }

    const { asunto, html } = plantilla(envio);


    await transporter.sendMail({
      from: `"Sol del Amanecer SRL" <${process.env.EMAIL_USER}>`,
      to: envio.clienteRemitente.email,
      subject: asunto,
      html,
    });

  } catch (error) {
    console.error("❌ Error al enviar correo de cambio de estado:", error);
  }
};

const enviarEmailVerificacion = async (email, nombre, enlace) => {
  try {
    await transporter.sendMail({
      from: `"Sol del Amanecer" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verifica tu cuenta - Sol del Amanecer",
      html: generarHtmlCorreo({
        titulo: "¡Bienvenido a Sol del Amanecer!",
        nombre,
        mensaje: "Gracias por registrarte en nuestra plataforma de logística. Para comenzar a operar, por favor verifica tu cuenta haciendo clic en el siguiente botón:",
        buttonText: "Verificar mi cuenta",
        buttonUrl: enlace
      })
    });
    console.log(`📧 Email de verificación enviado a ${email}`);
  } catch (error) {
    console.error("❌ Error enviando email de verificación:", error);
  }
};

module.exports = { enviarNotificacionEstado, enviarEmailVerificacion };
