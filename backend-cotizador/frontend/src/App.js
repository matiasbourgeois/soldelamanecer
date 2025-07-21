import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import CotizacionViajes from "./pages/CotizacionViajes";
import CotizacionEncomiendas from "./pages/CotizacionEncomiendas";
import ResultadoEncomienda from "./pages/ResultadoEncomienda";
import ResultadoViaje from "./pages/ResultadoViaje";
import HistorialViajes from "./pages/HistorialViajes"; 
import HistorialEncomiendas from "./pages/HistorialEncomiendas";
import Login from "./pages/Login";
import Registro from "./pages/Registro"; // 🔹 Importamos la nueva página de Registro

function App() {
  const [usuario, setUsuario] = useState(null);
  const navigate = useNavigate();

  // Verificar si hay un usuario en localStorage al cargar la página
  useEffect(() => {
    const usuarioGuardado = localStorage.getItem("usuario");
    if (usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setUsuario(null);
    navigate("/");
  };

  return (
    <div className="container-fluid bg-black text-light min-vh-100 p-4">
      {/* 🔹 Barra de navegación minimalista */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="text-warning fs-3">Cotizador de Viajes y Encomiendas</h1>

        <div className="d-flex gap-2">
          {!usuario ? (
            <>
              <Link to="/login" className="btn btn-outline-light btn-sm px-3">Iniciar Sesión</Link>
              <Link to="/registro" className="btn btn-outline-light btn-sm px-3">Crear Cuenta</Link> {/* 🔹 Nuevo botón */}
            </>
          ) : (
            <>
              <Link to="/historial-viajes" className="btn btn-outline-light btn-sm px-3">Historial de Viajes</Link>
              <Link to="/historial-encomiendas" className="btn btn-outline-light btn-sm px-3">Historial de Encomiendas</Link>
              <button onClick={handleLogout} className="btn btn-outline-light btn-sm px-3">Cerrar Sesión</button>
            </>
          )}
        </div>
      </div>

      {/* 🔹 Botones principales con diseño elegante */}
      <div className="d-flex justify-content-center gap-3 mt-4">
        <Link to="/cotizar-viaje" className="btn btn-outline-warning px-4 py-2">Cotización de Viajes</Link>
        <Link to="/cotizar-encomienda" className="btn btn-outline-warning px-4 py-2">Cotización de Encomiendas</Link>
      </div>

      {/* 🔹 Definimos las rutas */}
      <div className="mt-5">
        <Routes>
          <Route path="/cotizar-viaje" element={<CotizacionViajes />} />
          <Route path="/cotizar-encomienda" element={<CotizacionEncomiendas />} />
          <Route path="/resultado-encomienda" element={<ResultadoEncomienda />} />
          <Route path="/resultado-viaje" element={<ResultadoViaje />} />
          <Route path="/login" element={<Login setUsuario={setUsuario} />} />
          <Route path="/registro" element={<Registro />} /> {/* 🔹 Nueva ruta de registro */}

          {/* 🔹 Rutas para los historiales separados */}
          <Route path="/historial-viajes" element={<HistorialViajes />} />
          <Route path="/historial-encomiendas" element={<HistorialEncomiendas />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
