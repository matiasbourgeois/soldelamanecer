import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import AuthContext from "../context/AuthProvider";
import {
  Home,
  User,
  ClipboardList,
  Truck,
  Users,
  Mail,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "../styles/Sidebar.css";

import { apiUsuarios } from "../utils/api";



const Sidebar = ({ handleLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // ✅ Obtener perfil actualizado al montar
  const { auth, cargando } = useContext(AuthContext);

  if (cargando || !auth?._id) return null;

  return (
    <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      {/* 🔶 Logo */}
      {!isCollapsed && (
        <div className="sidebar-logo">
          <span className="navbar-brand">Sol del Amanecer SRL</span>
        </div>
      )}

      <div className="sidebar-toggle-bottom">
        <button
          className="toggle-icon"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          data-tooltip={isCollapsed ? "Expandir" : "Colapsar"}
        >
          {isCollapsed ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
        </button>
      </div>

      {/* 🔹 Usuario */}
      {!isCollapsed && (
        <div className="sidebar-user">
          <img
            src={
              auth.fotoPerfil
                ? `${apiUsuarios(auth.fotoPerfil)}?t=${new Date().getTime()}`
                : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
            }

            alt="Foto de perfil"
            className="sidebar-avatar"
          />

          <h2>{auth?.nombre?.toUpperCase()}</h2>
          <p>{auth?.email}</p>
        </div>

      )}

      {/* 🔗 Navegación */}
      <div className="sidebar-scrollable">
        <ul className="sidebar-links">
          <li><Link to="/perfil"><User size={18} /> <span>Perfil</span></Link></li>
          <li><Link to="/cotizacion-viajes"><ClipboardList size={18} /> <span>Cotizar Viajes</span></Link></li>
          <li><Link to="/cotizacion-encomiendas"><Truck size={18} /> <span>Cotizar Encomiendas</span></Link></li>
          <li><Link to="/seguimiento"><ClipboardList size={18} /> <span>Seguimiento de Envios</span></Link></li>

          {auth?.rol === "cliente" && (
            <li><Link to="/mis-envios"><Truck size={18} /> <span>Mis Envíos</span></Link></li>
          )}

          {["admin", "administrativo"].includes(auth?.rol) && (
            <>
              <li><Link to="/admin/rutas"><Truck size={18} /> <span>Gestionar Rutas</span></Link></li>
              <li><Link to="/admin/choferes"><Users size={18} /> <span>Gestionar Choferes</span></Link></li>
              <li><Link to="/admin/vehiculos"><Truck size={18} /> <span>Gestionar Vehículos</span></Link></li>
              <li><Link to="/admin/reportes"><ClipboardList size={18} /> <span>Reportes</span></Link></li>
              <li><Link to="/envios/gestion"><Truck size={18} /> <span>Gestionar Envíos</span></Link></li>
              <li><Link to="/hojas-reparto"><ClipboardList size={18} /> <span>Gestionar Hojas de Reparto</span></Link></li>
            </>
          )}

          {auth?.rol === "admin" && (
            <li><Link to="/admin/usuarios"><Users size={18} /> <span>Gestión de Usuarios</span></Link></li>
          )}
        </ul>
      </div>

      {/* 🔒 Logout */}
      <div className="logout-link">
        <button onClick={handleLogout}>
          <LogOut size={18} /> <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;