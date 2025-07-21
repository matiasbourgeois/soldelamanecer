import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Clock } from "lucide-react";
import { apiSistema } from "../../utils/api";

import "../../styles/titulosSistema.css";
import "../../styles/estadosSistema.css";
import "../../styles/botonesSistema.css";
import "../../styles/seguimientoSistema.css";
import "../../styles/estadosSistema.css";


const ResultadoSeguimiento = () => {
    const { codigo } = useParams();
    const [envio, setEnvio] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const buscarEnvio = async () => {
            try {
                const { data } = await axios.get(apiSistema(`/api/seguimiento/${codigo}`));
                setEnvio(data);
                setError("");
            } catch (err) {
                console.error("❌ Error al buscar envío:", err);
                setError("No se encontró ningún envío con ese número.");
            }
        };

        buscarEnvio();
    }, [codigo]);

    if (error) {
        return (
            <div className="container mt-5 seguimiento-container text-center">
                <h4 className="text-danger">{error}</h4>
            </div>
        );
    }

    if (!envio) {
        return (
            <div className="container mt-5 text-center">
                <p>Cargando datos del envío...</p>
            </div>
        );
    }

    return (
        <div className="container mt-5">
            <h2 className="titulo-seccion text-center mb-4">
                Estado del Envío <span className="text-warning">{codigo}</span>
            </h2>

            <div className="card-seguimiento mb-4 fade-in-up">
                <div className="card-body">
                    <p><strong>Estado actual:</strong>{" "}
                        {envio.estadoActual && (
                            <span className={`estado-chip estado-${envio.estadoActual.toLowerCase().replace(/\s/g, "-")}`}>
                                {envio.estadoActual}
                            </span>
                        )}
                    </p>
                    <p><strong>Remitente:</strong> {envio.remitente?.nombre} – {envio.remitente?.email}</p>
                    <p><strong>Destinatario:</strong> {envio.destinatario?.nombre} – {envio.destinatario?.direccion}</p>
                    <p><strong>Localidad de destino:</strong> {envio.localidadDestino?.nombre}</p>
                    <p><strong>Sucursal origen:</strong> {envio.sucursal}</p>
                    <p><strong>Fecha de creación:</strong> {new Date(envio.fecha).toLocaleString()}</p>

                    <h6 className="mt-4 text-muted">Historial de estados:</h6>
                    <div className="timeline position-relative ps-3 border-start border-2 border-warning">
                        {envio.historial.map((h, index) => (
                            <div key={index} className="timeline-item fade-in-up">

                                <div className="d-flex align-items-center">
                                    <Clock size={16} className="me-2 text-warning" />
                                    <strong className="me-2">{h.estado.toUpperCase()}</strong>
                                    <span className="text-muted small">
                                        {new Date(h.fecha).toLocaleDateString()} –
                                        {new Date(h.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="ms-4 text-muted small">
                                    Sucursal: {h.sucursal}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResultadoSeguimiento;
