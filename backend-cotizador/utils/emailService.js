const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: process.env.EMAIL_SECURE === "true", // true para SSL (puerto 465)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const enviarEmailVerificacion = async (email, nombre, enlaceVerificacion) => {
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
      <div style="max-width: 600px; margin: auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <h2 style="color: #000000; text-align: center;">Bienvenido a Sol del Amanecer SRL</h2>
        <p>Hola <strong>${nombre}</strong>,</p>
        <p>Gracias por registrarte. Para completar tu registro, por favor verifica tu cuenta haciendo clic en el siguiente botón:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${enlaceVerificacion}" style="background-color: #ffc107; color: black; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: bold;">
            Verificar Cuenta
          </a>
        </div>

        <p>Si no solicitaste esta cuenta, podés ignorar este correo.</p>
        <p style="font-size: 14px; color: #666;">Sol del Amanecer SRL</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Sol del Amanecer SRL" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verificá tu cuenta",
    html,
  });
};

module.exports = enviarEmailVerificacion;
