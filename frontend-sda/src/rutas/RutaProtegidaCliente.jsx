import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const RutaProtegidaCliente = ({ children }) => {
  const { usuario, cargando } = useAuth();

  if (cargando) return null;

  if (!usuario || usuario.rol !== "cliente") {
    return <Navigate to="/login" />;
  }

  return children;
};

export default RutaProtegidaCliente;
