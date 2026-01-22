import { createContext, useEffect, useState } from "react";
import clienteAxios from "../api/clienteAxios";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({});
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const autenticarUsuario = async () => {
      const token = localStorage.getItem("token");
      const usuarioGuardado = localStorage.getItem("usuario");
      if (usuarioGuardado) {
        setAuth(JSON.parse(usuarioGuardado));
      }

      if (!token) {
        setAuth({});
        setCargando(false);
        return;
      }

      try {
        const res = await clienteAxios.get("/usuarios/perfil");

        const usuario = res.data.usuario;

        // Aseguramos que tenga token y _id (compatibilidad completa)
        const usuarioConToken = {
          ...usuario,
          _id: usuario._id || usuario.id,
          token,
        };

        setAuth(usuarioConToken);
        localStorage.setItem("usuario", JSON.stringify(usuarioConToken));
      } catch (error) {
        console.error("❌ Error al autenticar usuario:", error);

        // ✅ Verificamos si el error es porque el token expiró
        if (error.response?.data?.msg === "jwt expired") {
          console.warn("⚠️ Token expirado, limpiando sesión automáticamente.");
        }

        setAuth({});
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
      }

      finally {
        setCargando(false);
      }
    };

    autenticarUsuario();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        auth,
        setAuth,
        cargando,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider };
export default AuthContext;
