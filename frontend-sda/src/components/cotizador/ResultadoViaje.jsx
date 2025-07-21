import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

function ResultadoViaje() {
  const location = useLocation();
  const navigate = useNavigate();
  const cotizacion = location.state?.cotizacion;

  if (!cotizacion) {
    return (
      <div className="container mt-5 text-center">
        <h2 className="text-danger">❌ Error: No hay datos de cotización</h2>
        <button className="btn btn-warning w-100" onClick={() => navigate("/cotizacion-viajes")}>
          Volver a Cotizar
        </button>

      </div>
    );
  }

  // Información del vehículo
  const vehiculos = {
    Chico: "Utilitario tipo Fiorino, Partner. Capacidad 3 mts cúbicos.",
    Mediano: "Utilitario tipo Master, Transit, Ducato. Capacidad 8 mts cúbicos.",
    Grande: "Utilitario tipo Iveco Daily. Capacidad 15 mts cúbicos.",
    Camión: "Utilitario tipo Iveco TECTOR. Capacidad 20 mts cúbicos.",
  };

  return (
    <div className="container mt-5 d-flex justify-content-center">
      <div className="w-100" style={{ maxWidth: "600px" }}>
        <div className="p-4 border rounded bg-white text-dark">
          <h2 className="text-center mb-4 text-warning">Resultado de la Cotización</h2>

          <p><strong>Tipo de Vehículo:</strong> {cotizacion.tipoVehiculo}</p>

          <div className="p-3 bg-light text-dark border rounded mb-3 text-center" style={{ fontSize: "16px", fontWeight: "normal" }}>
            {vehiculos[cotizacion.tipoVehiculo]}
          </div>

          <p><strong>Zona:</strong> {cotizacion.zona}</p>

          {cotizacion.zona !== "Córdoba Ciudad" && (
            <p><strong>Kilómetros:</strong> {cotizacion.kilometros} km</p>
          )}

          <p className="fs-4 text-warning"><strong>Precio Final:</strong> ${cotizacion.precio.toFixed(2)}</p>

          <div className="text-center mt-4">
            <button className="btn btn-warning w-100" onClick={() => navigate("/cotizacion-viajes")}>
              Volver a Cotizar
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultadoViaje;
