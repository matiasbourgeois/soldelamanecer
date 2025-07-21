import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUsuariosApi } from "../utils/api";


function Registro() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    contrasena: "",
  });
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    try {
      const response = await fetch(apiUsuariosApi("/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMensaje(data.mensaje || "Registro exitoso");
        setTimeout(() => navigate("/login"), 3000);
      } else {
        setError(data.error || "Error en el registro");
      }
    } catch (error) {
      console.error("❌ Error en el registro:", error);
      setError("Error de conexión con el servidor");
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "500px" }}>
      <h2 className="text-center text-warning mb-4">Registro de Usuario</h2>

      {mensaje && <div className="alert alert-success">{mensaje}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit} className="p-4 border rounded bg-light shadow-sm">
        <div className="mb-3">
          <label className="form-label">Nombre completo:</label>
          <input
            type="text"
            name="nombre"
            className="form-control"
            onChange={handleChange}
            required
          />
        </div>

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

        <button type="submit" className="btn btn-warning w-100">Registrarme</button>
      </form>
    </div>
  );
}

export default Registro;
