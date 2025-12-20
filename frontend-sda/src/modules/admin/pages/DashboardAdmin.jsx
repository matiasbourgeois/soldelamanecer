import React from "react";
import "@styles/DashboardAdmin.css";
import { useNavigate } from "react-router-dom";
import { Users, BarChart, Settings } from "lucide-react";

const DashboardAdmin = () => {
  const navigate = useNavigate();

  return (
    <div className="dashboard-admin">
      <h1 className="dashboard-title">Panel de Administración</h1>

      <div className="dashboard-cards">
        <div className="dashboard-card" onClick={() => navigate("/admin/usuarios")}>
          <Users size={36} className="dashboard-icon" />
          <h2>Gestión de Usuarios</h2>
          <p>Ver, editar y cambiar roles de usuarios.</p>
        </div>

        <div className="dashboard-card" onClick={() => navigate("/admin/reportes")}>
          <BarChart size={36} className="dashboard-icon" />
          <h2>Reportes</h2>
          <p>Visualizar estadísticas y actividad del sistema.</p>
        </div>

        <div className="dashboard-card">
          <Settings size={36} className="dashboard-icon" />
          <h2>Configuración</h2>
          <p>Ajustes generales del sistema (próximamente).</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardAdmin;
