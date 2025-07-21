import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, BarChart3 } from "lucide-react";
import { useContext } from "react";
import AuthContext from "../../../context/AuthProvider";
import "../../../styles/DashboardAdmin.css";

function Reportes() {
  const navigate = useNavigate();
  const { auth, cargando } = useContext(AuthContext);

  useEffect(() => {
    if (!cargando && !auth?._id) {
      navigate("/");
    }
  }, [auth, cargando, navigate]);

  const ReporteCard = ({ title, description, path, icon: Icon }) => (
    <div className="dashboard-card" onClick={() => navigate(path)}>
      <Icon size={36} className="dashboard-icon" />
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );

  if (cargando || !auth?._id) return null;

  return (
    <div className="dashboard-admin">
      <h1 className="dashboard-title">Reportes del Sistema</h1>

      <div className="dashboard-cards">
        {["admin", "administrativo"].includes(auth.rol) && (
          <>
            <ReporteCard
              title="Historial de Encomiendas"
              description="Todas las cotizaciones de encomiendas."
              path="/admin/reportes/historial-encomiendas"
              icon={FileText}
            />
            <ReporteCard
              title="Historial de Viajes"
              description="Listado completo de cotizaciones de viajes."
              path="/admin/reportes/historial-viajes"
              icon={FileText}
            />
          </>
        )}

        {auth.rol === "admin" && (
          <ReporteCard
            title="Ranking de Ciudades"
            description="Análisis de destinos más frecuentes."
            path="/admin/reportes/ranking-ciudades"
            icon={BarChart3}
          />
        )}
      </div>
    </div>
  );
}

export default Reportes;
