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
      numeroSeguimiento: envio.numeroSeguimiento,
    }),
  }),

};

// 🟡 Botón y plantilla HTML general
const generarHtmlCorreo = ({ titulo, nombre, mensaje, numeroSeguimiento }) => {
  return `
    <div style="font-family: 'Montserrat', Arial, sans-serif; background-color: #f8f9fa; padding: 30px;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">

        <h2 style="color: #000000; text-align: center; font-family: 'Montserrat', Arial, sans-serif;">
          ${titulo}
        </h2>

        <p style="font-size: 16px;">
          Hola <strong style="text-transform: uppercase;">${nombre}</strong>,
        </p>

        <p style="font-size: 15px;">
          ${mensaje}
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://soldelamanecer.ar/seguimiento/resultado/${numeroSeguimiento}"
            style="
              background-color: #ffc107;
              color: #000;
              text-decoration: none;
              padding: 12px 25px;
              border-radius: 6px;
              font-weight: bold;
              display: inline-block;
              font-size: 16px;
              font-family: 'Montserrat', Arial, sans-serif;
              box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
            ">
            Seguir mi envío
          </a>
        </div>

        <p style="font-size: 14px; color: #666;">
          Gracias por confiar en <strong>Sol del Amanecer SRL</strong>.
        </p>

        <p style="font-size: 13px; color: #999;">
          Este es un mensaje automático, por favor no responder.
        </p>

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

module.exports = { enviarNotificacionEstado };
