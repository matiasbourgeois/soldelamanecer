import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AuthContext from "@core/context/AuthProvider";
import { useContext } from "react";
import 'leaflet/dist/leaflet.css';
import { useState, useEffect, Suspense, lazy } from "react";
import AlertaSistema from "@components/feedback/AlertaSistema";
import { setMostrarAlertaCustom } from "@core/utils/alertaGlobal.jsx";
import { Container, Box, rem } from '@mantine/core';
import Navbar from "@components/layout/Navbar";
import Footer from "@components/layout/Footer";
import { AppLayout } from "@components/layout/AppLayout"; // Layout Mantine
import ProtectedByRole from "@components/protected/ProtectedByRole";
import TransitionScreen from "@components/layout/TransitionScreen";

// Pages
// Pages - Auth
import Login from "./modules/auth/pages/Login";
import Registro from "./modules/auth/pages/Registro";

// Pages - Public
import Inicio from "./modules/public/pages/Inicio";
import Servicios from "./modules/public/pages/Servicios";
import Contacto from "./modules/public/pages/Contacto";
import CotizadorCordobaPage from "./modules/public/pages/CotizadorCordoba"; // Moved

// Pages - Admin & Users
import Perfil from "./modules/auth/pages/Perfil"; // Moved to Auth
import UsuariosAdmin from "./modules/admin/pages/UsuariosAdmin";
import DashboardAdmin from "./modules/admin/pages/DashboardAdmin";
const AdminArcade = lazy(() => import("./modules/admin/pages/AdminArcade"));
import ChoferesAdmin from "./modules/admin/pages/ChoferesAdmin";
import Reportes from "./modules/admin/pages/reportes/Reportes"; // Assuming subfolder moved
import ProveedoresAdmin from "./modules/admin/pages/proveedores/ProveedoresAdmin";

// Pages - Logistica (Envios)
import GestionEnvios from "./modules/logistica/envios/pages/GestionEnvios";
import NuevoEnvio from "./modules/logistica/envios/pages/NuevoEnvio";
import ConsultarEnvios from "./modules/logistica/envios/pages/ConsultarEnvios";
import ConsultarRemitos from "./modules/logistica/envios/pages/ConsultarRemitos";

// Pages - Logistica (Hojas Reparto)
import GestionHojasReparto from "./modules/logistica/hoja-reparto/pages/GestionHojasReparto";
import CrearHojaReparto from "./modules/logistica/hoja-reparto/pages/CrearHojaReparto";
import ConsultarHojasReparto from "./modules/logistica/hoja-reparto/pages/ConsultarHojasReparto";
import DetalleHojaReparto from "./modules/logistica/hoja-reparto/pages/DetalleHojaReparto";

// Pages - Logistica (Vehiculos & Rutas)
import VehiculosAdmin from "./modules/logistica/vehiculos/pages/VehiculosAdmin";
import MantenimientoAdmin from "./modules/admin/pages/mantenimiento/MantenimientoAdmin";
import MantenimientoMetricas from "./modules/admin/pages/mantenimiento/MantenimientoMetricas";
import MenuMantenimiento from "./modules/admin/pages/mantenimiento/MenuMantenimiento"; // NUEVO
import RutasAdmin from "./modules/logistica/rutas/pages/RutasAdmin";
import HistorialVehiculo from "./modules/admin/pages/mantenimiento/HistorialVehiculo";

// Pages - Clientes
import MisEnvios from "./modules/clientes/pages/MisEnvios";
import CompletarPerfilCliente from "./modules/clientes/pages/CompletarPerfilCliente";

// Pages - Seguimiento
import BuscarSeguimiento from "./modules/public/seguimiento/pages/BuscarSeguimiento";
import ResultadoSeguimiento from "./modules/public/seguimiento/pages/ResultadoSeguimiento";

// Pages - Localidades
import LocalidadesAdmin from "./modules/logistica/localidades/pages/LocalidadesAdmin";

// Cotizador Online



function App() {
  const { auth, setAuth, cargando } = useContext(AuthContext);

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    localStorage.removeItem("token");
    setAuth({});
    window.location.href = "/";
  };
  const [showAlerta, setShowAlerta] = useState(false);
  const [mensajeAlerta, setMensajeAlerta] = useState("");
  const [tipoAlerta, setTipoAlerta] = useState("warning");

  useEffect(() => {
    setMostrarAlertaCustom((msg, tipo = "warning") => {
      setMensajeAlerta(msg);
      setTipoAlerta(tipo);
      setShowAlerta(true);
    });
  }, []);

  if (cargando) return <TransitionScreen message="Cargando sistema..." />;

  return (
    <Router>
      {auth?._id ? (
        // ✅ Si está logueado, usar el AppLayout de Mantine
        <AppLayout auth={auth} handleLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<Navigate to="/perfil" replace />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/seguimiento" element={<BuscarSeguimiento />} />
            <Route path="/seguimiento/resultado/:codigo" element={<ResultadoSeguimiento />} />
            <Route path="/admin/vehiculos" element={<VehiculosAdmin />} />
            <Route path="/completar-perfil" element={<CompletarPerfilCliente />} />
            <Route path="/cotizador-online" element={<CotizadorCordobaPage />} />
            <Route path="/servicios" element={<Servicios />} />
            <Route path="/login" element={<TransitionScreen message="Preparando su espacio..." />} />

            {/* Rutas Protegidas y Admin */}
            <Route
              path="/admin/usuarios"
              element={
                <ProtectedByRole allowedRoles="admin">
                  <UsuariosAdmin />
                </ProtectedByRole>
              }
            />
            <Route
              path="/admin/juegos"
              element={
                <ProtectedByRole allowedRoles="admin">
                  <Suspense fallback={<div style={{ padding: 20, textAlign: 'center', color: 'white' }}>Cargando Zona Arcade...</div>}>
                    <AdminArcade />
                  </Suspense>
                </ProtectedByRole>
              }
            />
            <Route
              path="/admin/choferes"
              element={
                <ProtectedByRole allowedRoles={["admin", "administrativo"]}>
                  <ChoferesAdmin />
                </ProtectedByRole>
              }
            />
            <Route
              path="/admin/proveedores"
              element={
                <ProtectedByRole allowedRoles={["admin", "administrativo"]}>
                  <ProveedoresAdmin />
                </ProtectedByRole>
              }
            />
            <Route
              path="/dashboard/admin"
              element={
                <ProtectedByRole allowedRoles="admin">
                  <DashboardAdmin />
                </ProtectedByRole>
              }
            />
            <Route
              path="/admin/rutas"
              element={
                <ProtectedByRole allowedRoles={["admin", "administrativo"]}>
                  <RutasAdmin />
                </ProtectedByRole>
              }
            />
            <Route
              path="/admin/reportes"
              element={
                <ProtectedByRole allowedRoles={["admin", "administrativo"]}>
                  <Reportes />
                </ProtectedByRole>
              }
            />

            <Route
              path="/admin/mantenimiento"
              element={
                <ProtectedByRole allowedRoles={["admin", "administrativo"]}>
                  <MenuMantenimiento />
                </ProtectedByRole>
              }
            />
            <Route
              path="/admin/mantenimiento/control"
              element={
                <ProtectedByRole allowedRoles={["admin", "administrativo"]}>
                  <MantenimientoAdmin />
                </ProtectedByRole>
              }
            />
            <Route
              path="/admin/mantenimiento/metricas"
              element={
                <ProtectedByRole allowedRoles={["admin", "administrativo"]}>
                  <MantenimientoMetricas />
                </ProtectedByRole>
              }
            />
            <Route
              path="/admin/mantenimiento/historial"
              element={
                <ProtectedByRole allowedRoles={["admin", "administrativo"]}>
                  <HistorialVehiculo />
                </ProtectedByRole>
              }
            />
            <Route
              path="/mis-envios"
              element={
                <ProtectedByRole allowedRoles="cliente">
                  <MisEnvios />
                </ProtectedByRole>
              }
            />


            <Route
              path="/cliente/perfil"
              element={
                <ProtectedByRole allowedRoles="cliente">
                  <CompletarPerfilCliente />
                </ProtectedByRole>
              }
            />
            <Route
              path="/admin/localidades"
              element={
                <ProtectedByRole allowedRoles={["admin", "administrativo"]}>
                  <LocalidadesAdmin />
                </ProtectedByRole>
              }
            />
            <Route
              path="/envios/gestion"
              element={
                <ProtectedByRole allowedRoles={["admin", "administrativo"]}>
                  <GestionEnvios />
                </ProtectedByRole>
              }
            />
            <Route
              path="/envios/nuevo"
              element={
                <ProtectedByRole allowedRoles={["admin", "administrativo"]}>
                  <NuevoEnvio />
                </ProtectedByRole>
              }
            />
            <Route
              path="/envios/consultar"
              element={
                <ProtectedByRole allowedRoles={["admin", "administrativo"]}>
                  <ConsultarEnvios />
                </ProtectedByRole>
              }
            />
            <Route
              path="/remitos/consultar"
              element={
                <ProtectedByRole allowedRoles={["admin", "administrativo"]}>
                  <ConsultarRemitos />
                </ProtectedByRole>
              }
            />
            <Route
              path="/hojas-reparto"
              element={
                <ProtectedByRole allowedRoles={["admin", "administrativo"]}>
                  <GestionHojasReparto />
                </ProtectedByRole>
              }
            />
            <Route
              path="/hojas-reparto/consultar"
              element={
                <ProtectedByRole allowedRoles={["admin", "administrativo"]}>
                  <ConsultarHojasReparto />
                </ProtectedByRole>
              }
            />
            <Route
              path="/hojas-reparto/crear"
              element={
                <ProtectedByRole allowedRoles={["admin", "administrativo"]}>
                  <CrearHojaReparto />
                </ProtectedByRole>
              }
            />
            <Route
              path="/hojas-reparto/:id"
              element={
                <ProtectedByRole allowedRoles={["admin", "administrativo"]}>
                  <DetalleHojaReparto />
                </ProtectedByRole>
              }
            />
          </Routes>
        </AppLayout>
      ) : (
        // 🔹 Si NO está logueado, mostrar Navbar pública + Content + Footer (Sticky Footer Fix)
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'white' }}>
          <Navbar />
          <main style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingTop: rem(70)
          }}>
            <Routes>
              <Route path="/" element={<Inicio />} />
              <Route path="/servicios" element={<Servicios />} />
              <Route path="/contacto" element={<Contacto />} />
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Registro />} />
              {/* Rutas públicas adicionales requeridas */}
              <Route path="/cotizador-online" element={<CotizadorCordobaPage />} />
              <Route path="/seguimiento" element={<BuscarSeguimiento />} />
              <Route path="/seguimiento/resultado/:codigo" element={<ResultadoSeguimiento />} />
            </Routes>
          </main>
          <Footer />
        </div>
      )
      }

      <AlertaSistema
        show={showAlerta}
        mensaje={mensajeAlerta}
        tipo={tipoAlerta}
        onClose={() => setShowAlerta(false)}
      />
    </Router >
  );
}

export default App;
