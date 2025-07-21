import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

function ResultadoEncomienda() {
  const location = useLocation();
  const navigate = useNavigate();
  const cotizacion = location.state?.cotizacion;

  if (!cotizacion) {
    return (
      <div className="container mt-5 text-center">
        <h2 className="text-danger">❌ No hay cotización disponible</h2>
        <button className="btn btn-warning mt-3" onClick={() => navigate(-1)}>Volver</button>
      </div>
    );
  }

  return (
    <div className="container mt-5 d-flex justify-content-center">
      <div className="w-100" style={{ maxWidth: "700px" }}>
        <div className="p-4 border rounded bg-white" style={{ maxWidth: "500px", width: "100%" }}>
          <h2 className="text-center mb-4 text-warning">Resultado de la Cotización</h2>

          <p><strong>Localidad de Destino:</strong> {cotizacion.destino}</p>

          <div className="table-responsive">
            <table className="table table-bordered mt-3">
              <thead className="bg-warning text-dark">
                <tr>
                  <th>#</th>
                  <th>Peso (kg)</th>
                  <th>Dimensiones (cm)</th>
                  <th>Tipo</th>
                  <th>Precio Neto</th>
                  <th>IVA</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {cotizacion.bultos.map((bulto, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{bulto.peso}</td>
                    <td>{`${bulto.dimensiones.largo} x ${bulto.dimensiones.ancho} x ${bulto.dimensiones.profundidad}`}</td>
                    <td>{bulto.tipoPaquete}</td>
                    <td>${(bulto.precioBase + bulto.precioExtra).toFixed(2)}</td>
                    <td>${bulto.iva.toFixed(2)}</td>
                    <td>${bulto.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h4 className="text-end mt-3">
            <strong>Total con IVA:</strong> ${cotizacion.totalCotizacion.toFixed(2)}
          </h4>

          <button className="btn btn-warning w-100" onClick={() => navigate("/cotizacion-encomiendas")}>
            Volver a Cotizar
          </button>

        </div>
      </div>
    </div>
  );

}

export default ResultadoEncomienda;
