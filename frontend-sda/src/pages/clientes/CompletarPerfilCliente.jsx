import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AuthContext from "../../context/AuthProvider";
import "../../styles/formularioSistema.css";
import "../../styles/botonesSistema.css";
import { apiUsuariosApi } from "../../utils/api"; // usa el helper correcto

const CompletarPerfilCliente = () => {
  const { auth, setAuth } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    dni: auth?.dni || "",
    telefono: auth?.telefono || "",
    direccion: auth?.direccion || "",
    localidad: auth?.localidad || "",
    provincia: auth?.provincia || "",
  });

  const [mensaje, setMensaje] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje(null);

    if (!auth?.token) {
      setMensaje("❌ No hay token disponible. Por favor, iniciá sesión nuevamente.");
      return;
    }

    try {
      const response = await axios.put(
        apiUsuariosApi("/perfil-completo"), 
        { ...formData, perfilCompleto: true },
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );

      // Actualizamos el contexto auth con los datos nuevos
      const datosActualizados = response.data.usuario;

      setAuth((prev) => ({
        ...prev,
        ...datosActualizados,
        token: prev.token, // preservamos el token
      }));
      

      setMensaje("✅ Perfil actualizado correctamente.");
      setTimeout(() => navigate("/perfil"), 1500);
    } catch (error) {
      console.error("❌ Error al actualizar perfil:", error?.response?.data || error.message);
      if (error.response?.status === 403) {
        setMensaje("❌ Sesión expirada. Por favor, iniciá sesión nuevamente.");
        setTimeout(() => navigate("/login"), 2000);
        return;
      }
      setMensaje("❌ Error al actualizar el perfil.");
    }
    
  };

  if (!auth || !auth.token) {
    return <p className="text-center text-danger mt-5">⏳ Cargando sesión...</p>;
  }

  return (
    <div className="container mt-5" style={{ maxWidth: "600px" }}>
      <h2 className="text-center text-warning mb-4">Completar Perfil</h2>

      {mensaje && <div className="alert alert-info text-center">{mensaje}</div>}

      <form onSubmit={handleSubmit} className="p-4 border rounded bg-light shadow-sm">
        {[ "dni", "telefono", "direccion", "localidad", "provincia" ].map((campo) => (
          <div className="mb-3" key={campo}>
            <label className="form-label text-capitalize">{campo}</label>
            <input
              type="text"
              name={campo}
              value={formData[campo]}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>
        ))}

        <button type="submit" className="btn btn-warning w-100">
          Guardar Perfil
        </button>
      </form>
    </div>
  );
};

export default CompletarPerfilCliente;
