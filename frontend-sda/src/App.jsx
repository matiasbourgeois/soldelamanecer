import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthContext from "./context/AuthProvider";
import { useContext } from "react";
import 'leaflet/dist/leaflet.css';
import { useState, useEffect } from "react";
import AlertaSistema from "./components/AlertaSistema";
import { setMostrarAlertaCustom } from "./utils/alertaGlobal.jsx";
import "./styles/botonesSistema.css";

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
// import Sidebar from "./components/Sidebar"; // ❌ Deprecado por Mantine Login
import { AppLayout } from "./components/AppLayout"; // ✅ Nuevo Layout Mantine
import ProtectedByRole from "./components/protected/ProtectedByRole";

// Pages
import Inicio from "./pages/Inicio";
import Servicios from "./pages/Servicios";
import Contacto from "./pages/Contacto";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Perfil from "./pages/Perfil";
import UsuariosAdmin from "./pages/admin/UsuariosAdmin";
import RutasAdmin from "./pages/rutas/RutasAdmin";
import MisEnvios from "./pages/clientes/MisEnvios";
import Reportes from "./pages/admin/reportes/Reportes";
import ChoferesAdmin from "./pages/admin/ChoferesAdmin";
import VehiculosAdmin from "./pages/vehiculos/VehiculosAdmin";
import DashboardAdmin from "./pages/admin/DashboardAdmin";
import CompletarPerfilCliente from "./pages/clientes/CompletarPerfilCliente";
import RutaProtegidaCliente from "./rutas/RutaProtegidaCliente";
import LocalidadesAdmin from "./pages/localidades/LocalidadesAdmin";
import GestionEnvios from "./pages/envios/GestionEnvios";
import NuevoEnvio from "./pages/envios/NuevoEnvio";
import ConsultarEnvios from "./pages/envios/ConsultarEnvios";
import ConsultarRemitos from "./pages/envios/ConsultarRemitos";
import GestionHojasReparto from "./pages/hojaReparto/GestionHojasReparto";
import CrearHojaReparto from "./pages/hojaReparto/CrearHojaReparto";
import ConsultarHojasReparto from "./pages/hojaReparto/ConsultarHojasReparto";
import DetalleHojaReparto from "./pages/hojaReparto/DetalleHojaReparto";
import BuscarSeguimiento from "./pages/seguimiento/BuscarSeguimiento";
import ResultadoSeguimiento from "./pages/seguimiento/ResultadoSeguimiento";

// Cotizador
import CotizacionViajes from "./components/cotizador/CotizacionViajes";
import CotizacionEncomiendas from "./components/cotizador/CotizacionEncomiendas";
import Historial from "./components/cotizador/Historial";
import HistorialEncomiendas from "./pages/admin/reportes/HistorialEncomiendas";
import HistorialViajes from "./pages/admin/reportes/HistorialViajes";
import ResultadoEncomienda from "./components/cotizador/ResultadoEncomienda";
import ResultadoViaje from "./components/cotizador/ResultadoViaje";
import CotizadorCordobaPage from "./pages/CotizadorCordoba";

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

  if (cargando) return null; // ⛔ No renderices nada hasta que auth esté listo

  return (
    <Router>
      {auth?._id ? (
        // ✅ Si está logueado, usar el AppLayout de Mantine
        <AppLayout auth={auth} handleLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<Inicio />} /> {/* Podríamos redirigir a Perfil */}
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/cotizacion-viajes" element={<CotizacionViajes />} />
            <Route path="/cotizacion-encomiendas" element={<CotizacionEncomiendas />} />
            <Route path="/historial" element={<Historial />} />
            <Route path="/resultado-encomienda" element={<ResultadoEncomienda />} />
            <Route path="/resultado-viaje" element={<ResultadoViaje />} />
            <Route path="/seguimiento" element={<BuscarSeguimiento />} />
            <Route path="/seguimiento/resultado/:codigo" element={<ResultadoSeguimiento />} />
            <Route path="/admin/vehiculos" element={<VehiculosAdmin />} />
            <Route path="/completar-perfil" element={<CompletarPerfilCliente />} />
            <Route path="/cotizador-online" element={<CotizadorCordobaPage />} />
            <Route path="/servicios" element={<Servicios />} />

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
              path="/admin/choferes"
              element={
                <ProtectedByRole allowedRoles={["admin", "administrativo"]}>
                  <ChoferesAdmin />
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
              path="/mis-envios"
              element={
                <ProtectedByRole allowedRoles="cliente">
                  <MisEnvios />
                </ProtectedByRole>
              }
            />
            <Route
              path="/admin/reportes/historial-encomiendas"
              element={
                <ProtectedByRole allowedRoles={["admin", "administrativo"]}>
                  <HistorialEncomiendas />
                </ProtectedByRole>
              }
            />
            <Route
              path="/admin/reportes/historial-viajes"
              element={
                <ProtectedByRole allowedRoles={["admin", "administrativo"]}>
                  <HistorialViajes />
                </ProtectedByRole>
              }
            />
            <Route
              path="/cliente/perfil"
              element={
                <RutaProtegidaCliente>
                  <CompletarPerfilCliente />
                </RutaProtegidaCliente>
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
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <main style={{ flex: 1, paddingTop: 'calc(60px + 1rem)' }}>
            <Routes>
              <Route path="/" element={<Inicio />} />
              <Route path="/servicios" element={<Servicios />} />
              <Route path="/contacto" element={<Contacto />} />
              <Route path="/cotizacion-viajes" element={<CotizacionViajes />} />
              <Route path="/cotizacion-encomiendas" element={<CotizacionEncomiendas />} />
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