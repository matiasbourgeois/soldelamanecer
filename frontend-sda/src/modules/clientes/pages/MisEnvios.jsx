import React, { useEffect, useState } from "react";
import axios from "axios";
import { Clock } from "lucide-react";
import "../../styles/seguimientoSistema.css";
import { useContext } from "react";
import AuthContext from "../../../core/context/AuthProvider";
import { apiSistema } from "../../../core/api/apiSistema";



const MisEnvios = () => {
  const [envios, setEnvios] = useState([]);
  const [codigo, setCodigo] = useState("");
  const [cargando, setCargando] = useState(true);
  const { auth } = useContext(AuthContext);

  useEffect(() => {
    const obtenerEnvios = async () => {
      try {
        const token = auth?.token;
        const { data } = await axios.get(apiSistema("/api/envios/mis-envios"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setEnvios(data);
      } catch (error) {
        console.error("❌ Error al obtener mis envíos:", error);
      } finally {
        setCargando(false);
      }
    };

    obtenerEnvios();
  }, []);

  const handleBuscar = (e) => {
    e.preventDefault();
    if (!codigo.trim()) return;
    window.location.href = `/seguimiento/resultado/${codigo}`;
  };

  return (
    <div className="container mt-5 seguimiento-container">
      <h2 className="titulo-seccion mb-5">Mis Envíos</h2>

      {cargando ? (
        <p className="p-4">Cargando envíos...</p>
      ) : envios.length === 0 ? (
        <p className="text-center">No tenés envíos registrados aún.</p>
      ) : (
        envios.map((envio) => (
          <div key={envio._id} className="card seguimiento-card mb-4 fade-in-up">
            <div className="card-body">
              <h5 className="mb-3">
                N° Seguimiento: <strong className="text-warning">{envio.numeroSeguimiento}</strong>
              </h5>

              <p>
                <strong>Estado actual:</strong>{" "}
                <span className={`estado-chip estado-${envio.estado?.toLowerCase().replace(/\s+/g, "-")}`}>
                  {envio.estado}
                </span>
              </p>

              <p>
                <strong>Remitente:</strong>{" "}
                {envio.clienteRemitente?.nombre && envio.clienteRemitente?.email
                  ? `${envio.clienteRemitente.nombre} – ${envio.clienteRemitente.email}`
                  : "No disponible"}
              </p>

              <p><strong>Destinatario:</strong> {envio.destinatario?.nombre || "-"} – {envio.destinatario?.direccion || "-"}</p>
              <p><strong>Localidad de destino:</strong> {envio.localidadDestino?.nombre || "-"}</p>
              <p><strong>Fecha de creación:</strong> {new Date(envio.fechaCreacion).toLocaleString()}</p>

              <div className="mt-4">
                <h6 className="text-muted">Historial de estados:</h6>
                <div className="timeline position-relative ps-3 border-start border-2 border-warning">
                  {envio.historialEstados?.map((estado, index) => (
                    <div key={index} className="mb-3 ms-2">
                      <div className="d-flex align-items-center">
                        <Clock size={16} className="me-2 text-warning" />
                        <strong className="me-2">{estado.estado.toUpperCase()}</strong>
                        <span className="text-muted small">
                          {new Date(estado.fecha).toLocaleDateString()} –{" "}
                          {new Date(estado.fecha).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="ms-4 text-muted small">
                        Sucursal: {estado.sucursal}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default MisEnvios;
