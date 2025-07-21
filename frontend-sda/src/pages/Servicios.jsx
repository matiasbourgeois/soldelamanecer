import { FaShippingFast, FaShieldAlt, FaHandshake } from "react-icons/fa";
import AOS from "aos";
import "aos/dist/aos.css";
import { useEffect } from "react";
import { Link } from "react-router-dom";

const Servicios = () => {
  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  return (
    <section className="py-5" style={{ backgroundColor: "#fff" }}>
      <div className="container">
        <div className="text-center mb-5">
          <h2 className="display-5 fw-bold text-dark" data-aos="fade-up">
            Soluciones de Logística Inteligente
          </h2>
          <p className="lead text-secondary" data-aos="fade-up" data-aos-delay="200">
            Tecnología avanzada y eficiencia garantizada para optimizar tu logística.
          </p>
        </div>

        <div className="row align-items-center">
          <div className="col-lg-6 mb-4 mb-lg-0" data-aos="fade-right">
            <img
              src="/images/cajasLogistica.png"
              alt="Servicio logístico"
              className="img-fluid"
            />
          </div>

          <div className="col-lg-6" data-aos="fade-left">
            <h3 className="fw-bold text-warning mb-3">
              Gestión Integral de Transporte
            </h3>
            <p className="text-secondary">
              Optimizamos rutas, garantizamos seguridad y realizamos monitoreo en tiempo real.
            </p>

            <ul className="list-unstyled mt-4">
              <li className="d-flex align-items-center mb-3">
                <FaShippingFast className="me-3 fs-4 text-warning" />
                <span className="text-dark">Entregas express a nivel provincial</span>
              </li>
              <li className="d-flex align-items-center mb-3">
                <FaShieldAlt className="me-3 fs-4 text-warning" />
                <span className="text-dark">Seguridad y monitoreo 24/7</span>
              </li>
              <li className="d-flex align-items-center mb-3">
                <FaHandshake className="me-3 fs-4 text-warning" />
                <span className="text-dark">Atención personalizada a empresas</span>
              </li>
            </ul>

            <div className="mt-4">
              <Link
                to="/Contacto"
                className="btn btn-warning fw-semibold px-4 py-2 shadow-sm"
              >
                Solicitar Cotización
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Servicios;
