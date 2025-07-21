import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import AuthContext from "../../context/AuthProvider";

const ProtectedByRole = ({ children, allowedRoles }) => {
  const { auth, cargando } = useContext(AuthContext);

  if (cargando) return null;

  if (!auth?._id) {
    return <Navigate to="/login" replace />;
  }

  // Si allowedRoles es un string, lo convertimos a array
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(auth.rol)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedByRole;
