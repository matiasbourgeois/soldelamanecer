import React, { useState, useContext } from "react";
import { apiUsuarios } from "../utils/api";
import AuthContext from "../context/AuthProvider";
import { useNavigate } from "react-router-dom";

function Login() {
  const { setAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", contrasena: "" });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch(apiUsuarios("/api/usuarios/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        const { token, usuario } = data;

        // ✅ Aseguramos que el usuario tenga _id para que coincida con el backend si hace falta
        const usuarioConToken = {
          ...usuario,
          _id: usuario._id || usuario.id,
          token,
        };

        // Guardamos en localStorage solo por compatibilidad
        localStorage.setItem("token", token);
        localStorage.setItem("usuario", JSON.stringify(usuarioConToken));

        // ✅ Guardamos el auth global correctamente
        // Obtener perfil actualizado para incluir la foto de perfil
        const perfilResponse = await fetch(apiUsuarios("/api/usuarios/perfil"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const perfilData = await perfilResponse.json();

        const usuarioActualizado = {
          ...perfilData.usuario,
          token,
          _id: perfilData.usuario._id || perfilData.usuario.id,
        };

        // Guardamos en localStorage solo por compatibilidad
        localStorage.setItem("token", token);
        localStorage.setItem("usuario", JSON.stringify(usuarioActualizado));

        // ✅ Actualizamos el contexto global con todos los datos (incluye fotoPerfil)
        setAuth(usuarioActualizado);


        console.log("🔐 Login exitoso. Auth cargado:", usuarioConToken);

        // Redirigir según el tipo de usuario
        setTimeout(() => {
          if (usuario.rol === "cliente" && !usuario.perfilCompleto) {
            navigate("/completar-perfil");
          } else {
            navigate("/perfil");
          }
        }, 0);
      } else {
        setError(data.error || "Error en el login");
      }
    } catch (error) {
      console.error("❌ Error en login:", error);
      setError("Error de conexión con el servidor");
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "500px" }}>
      <h2 className="text-center text-warning mb-4">Iniciar Sesión</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit} className="p-4 border rounded bg-light shadow-sm">
        <div className="mb-3">
          <label className="form-label">Correo electrónico:</label>
          <input
            type="email"
            name="email"
            className="form-control"
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Contraseña:</label>
          <input
            type="password"
            name="contrasena"
            className="form-control"
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="btn btn-warning w-100">Ingresar</button>
      </form>
    </div>
  );
}

export default Login;
