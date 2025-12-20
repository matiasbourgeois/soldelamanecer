import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiCotizador } from "@core/api/apiSistema";
import { mostrarAlerta } from "@core/utils/alertaGlobal.jsx";



function CotizacionViajes() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    tipoVehiculo: "",
    zona: "",
    kilometros: "",
  });

  const [isKilometrosEnabled, setIsKilometrosEnabled] = useState(false);
  const [infoVehiculo, setInfoVehiculo] = useState(null);

  // Datos reales de los vehículos
  const vehiculos = {
    Chico: "Utilitario tipo Fiorino, Partner. Capacidad 3 mts cúbicos.",
    Mediano: "Utilitario tipo Master, Transit, Ducato. Capacidad 8 mts cúbicos.",
    Grande: "Utilitario tipo Iveco Daily. Capacidad 15 mts cúbicos.",
    Camión: "Utilitario tipo Iveco TECTOR. Capacidad 20 mts cúbicos.",
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Mostrar información del vehículo seleccionado
    if (name === "tipoVehiculo") {
      setInfoVehiculo(vehiculos[value] || "Seleccione un tipo de vehículo para ver la información.");
    }

    // Habilitar/deshabilitar el campo de kilómetros según la zona
    if (name === "zona") {
      setIsKilometrosEnabled(value === "Córdoba Interior");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(apiCotizador("/api/cotizaciones"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        navigate("/resultado-viaje", { state: { cotizacion: data } }); // 🔹 Asegurar que la ruta coincide con App.js
      } else {
        mostrarAlerta(data.error || "Error al enviar la cotización", "danger");
      }
    } catch (error) {
      console.error("❌ Error:", error);
      mostrarAlerta("Error de conexión con el servidor", "danger");
    }
  };

  return (
    <div className="container mt-5 d-flex justify-content-center">
      <div className="p-4 border rounded bg-white" style={{ maxWidth: "700px", width: "100%" }}>
        <h2 className="text-center mb-4 text-warning">Cotización de Viajes</h2>
        <form onSubmit={handleSubmit}>

          {/* Tipo de Vehículo */}
          <div className="mb-3">
            <label className="form-label">Tipo de Vehículo:</label>
            <select name="tipoVehiculo" className="form-control" onChange={handleChange} required>
              <option value="">Seleccionar...</option>
              <option value="Chico">Chico</option>
              <option value="Mediano">Mediano</option>
              <option value="Grande">Grande</option>
              <option value="Camión">Camión</option>
            </select>
          </div>

          {/* Mostrar información del vehículo */}
          {infoVehiculo && (
            <div className="p-3 bg-light text-dark border rounded mb-3 text-center" style={{ fontSize: "16px", fontWeight: "normal" }}>
              {infoVehiculo}
            </div>
          )}

          {/* Zona */}
          <div className="mb-3">
            <label className="form-label">Zona:</label>
            <select name="zona" className="form-control" onChange={handleChange} required>
              <option value="">Seleccionar...</option>
              <option value="Córdoba Ciudad">Córdoba Ciudad</option>
              <option value="Córdoba Interior">Córdoba Interior</option>
            </select>
          </div>

          {/* Kilómetros (solo si es Córdoba Interior) */}
          {isKilometrosEnabled && (
            <div className="mb-3">
              <label className="form-label">Kilómetros:</label>
              <input
                type="number"
                name="kilometros"
                className="form-control"
                onChange={handleChange}
                required
                min="1"
              />
            </div>
          )}

          <button type="submit" className="btn btn-warning w-100">Cotizar Viaje</button>
        </form>
      </div>
    </div>

  );

}

export default CotizacionViajes;
