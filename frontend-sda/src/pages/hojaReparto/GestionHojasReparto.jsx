import { Link } from "react-router-dom";
import { PlusCircle, Search } from "react-feather";
import "../../styles/accionesSistema.css";
import '../../styles/titulosSistema.css';

const GestionHojasReparto = () => {
  return (
    <div className="container mt-5">
      <h2 className="titulo-seccion mb-4">
        Gestión de Hojas de Reparto
      </h2>

      <div className="d-flex flex-column gap-3">
        <Link to="/hojas-reparto/crear" className="opcion-accion-link">
          <div className="opcion-accion-card">
            <div className="d-flex align-items-center gap-3">
              <div className="icono-accion">
                <PlusCircle size={20} />
              </div>
              <div>
                <h6 className="mb-1 fw-semibold">Crear Hoja de Reparto</h6>
                <p className="mb-0 text-muted">Seleccioná ruta, chofer y envíos para el reparto.</p>
              </div>
            </div>
          </div>
        </Link>

        <Link to="/hojas-reparto/consultar" className="opcion-accion-link">
          <div className="opcion-accion-card">
            <div className="d-flex align-items-center gap-3">
              <div className="icono-accion">
                <Search size={20} />
              </div>
              <div>
                <h6 className="mb-1 fw-semibold">Consultar Hojas de Reparto</h6>
                <p className="mb-0 text-muted">Buscá hojas por número, estado o fecha.</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default GestionHojasReparto;