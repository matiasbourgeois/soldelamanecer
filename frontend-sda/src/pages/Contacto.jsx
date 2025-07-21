import {
  FaPhone,
  FaEnvelope,
  FaWhatsapp,
  FaInstagram,
  FaFacebook,
  FaLinkedin,
  FaMapMarkerAlt,
} from "react-icons/fa";
import AOS from "aos";
import "aos/dist/aos.css";
import { useEffect } from "react";

const Contacto = () => {
  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  return (
    <section className="py-5" style={{ backgroundColor: "#fff" }}>
      <div className="container">
        <div className="text-center mb-5">
          <h2 className="display-5 fw-bold text-dark" data-aos="fade-up">
            Contáctanos
          </h2>
          <p
            className="lead text-secondary"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            Estamos aquí para ayudarte. Ponete en contacto con nosotros a través de los siguientes medios.
          </p>
        </div>

        <div className="row align-items-center">
          <div className="col-lg-6 mb-4 mb-lg-0" data-aos="fade-right">
            <h4 className="fw-semibold text-warning mb-3">
              <FaPhone className="me-2" />
              Teléfono
            </h4>
            <p className="text-secondary">+54 351 2569550</p>

            <h4 className="fw-semibold text-warning mt-4 mb-3">
              <FaEnvelope className="me-2" />
              Email
            </h4>
            <p className="text-secondary">logistica@soldelamanecersrl.ar</p>

            <h4 className="fw-semibold text-warning mt-4 mb-3">
              <FaMapMarkerAlt className="me-2" />
              Dirección
            </h4>
            <p className="text-secondary">
              Estados Unidos 2657, Córdoba, Argentina
            </p>

            <a
              href="https://wa.me/543512569550"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-success fw-bold px-4 py-2 mt-4 shadow-sm"
            >
              <FaWhatsapp size={22} className="me-2" />
              Contactar por WhatsApp
            </a>
          </div>

          <div className="col-lg-6 text-center" data-aos="fade-left">
            <h4 className="fw-semibold text-warning mb-4">
              Síguenos en nuestras redes
            </h4>
            <div className="d-flex justify-content-center gap-4">
              <a
                href="https://www.instagram.com/soldelamanecersrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaInstagram size={30} className="text-warning" />
              </a>
              <a
                href="https://www.facebook.com/soldelamanecersrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaFacebook size={30} className="text-warning" />
              </a>
              <a
                href="https://www.linkedin.com/company/soldelamanecersrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaLinkedin size={30} className="text-warning" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contacto;
