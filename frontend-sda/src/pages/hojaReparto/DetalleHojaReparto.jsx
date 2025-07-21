import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { apiSistema } from "../../utils/api";
import "../../styles/cardsSistema.css";
import "../../styles/titulosSistema.css";
import MapaEntregas from "./MapaEntregas";


const DetalleHojaReparto = () => {
    const { id } = useParams();
    const [hoja, setHoja] = useState(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const obtenerDetalle = async () => {
            try {
                const res = await axios.get(apiSistema(`/api/hojas-reparto/${id}`));
                setHoja(res.data);
            } catch (error) {
                console.error("Error al obtener hoja:", error);
            } finally {
                setCargando(false);
            }
        };
        obtenerDetalle();
    }, [id]);

    if (cargando) return <p className="text-center mt-4">Cargando hoja...</p>;
    if (!hoja) return <p className="text-center mt-4">No se encontró la hoja.</p>;

    return (
        <div className="container mt-4">
            <div className="card-sda">
                <h3 className="titulo-seccion mb-4">Detalle de {hoja.numeroHoja}</h3>

                <div className="mb-3">
                    <p className="mb-1">
                        <span className="fw-semibold">Fecha:</span>{" "}
                        {new Date(hoja.fecha).toLocaleDateString()}
                    </p>
                    <p className="mb-1">
                        <p className="mb-1">
                            <span className="fw-semibold">Chofer:</span> {hoja.chofer?.usuario?.nombre || "Sin datos"}
                        </p>

                    </p>
                    <p className="mb-1">
                        <span className="fw-semibold">Vehículo:</span> {hoja.vehiculo?.patente}
                    </p>
                    <p className="mb-1">
                        <span className="fw-semibold">Observaciones:</span>{" "}
                        {hoja.observaciones || "Sin observaciones"}
                    </p>
                </div>

                <hr className="my-4" />

                <h5 className="mb-3 fw-bold">Envíos incluidos:</h5>
                <MapaEntregas envios={hoja.envios} />

                <div className="table-responsive mt-3">
                    <table className="table tabla-montserrat text-center align-middle">
                        <thead className="encabezado-moderno">

                            <tr>
                                <th></th>
                                <th>Remito</th>
                                <th>Localidad</th>
                                <th>Destinatario</th>
                                <th>Dirección</th>
                                <th>Bultos</th>
                                <th>Dimensiones</th>
                                <th>Tipo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {hoja?.envios?.length > 0 ? (
                                hoja.envios.map((envio) => (
                                    <tr className="tabla-moderna-fila" key={envio._id}>
                                        <td className="text-muted" style={{ fontSize: "1.2rem" }}>⋮⋮</td>
                                        <td>{envio.remitoNumero || "-"}</td>
                                        <td>{envio.localidadDestino?.nombre || "-"}</td>
                                        <td>{envio.destinatario?.nombre || "-"}</td>
                                        <td>{envio.destinatario?.direccion || "-"}</td>
                                        <td>{envio.encomienda?.cantidad || "-"}</td>
                                        <td>
                                            {envio.encomienda?.dimensiones
                                                ? `${envio.encomienda.dimensiones.largo}x${envio.encomienda.dimensiones.ancho}x${envio.encomienda.dimensiones.alto} cm`
                                                : "-"}
                                        </td>
                                        <td>{envio.encomienda?.tipoPaquete || "-"}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="text-center">No hay envíos para esta hoja.</td>
                                </tr>
                            )}
                        </tbody>

                    </table>
                </div>
            </div>
        </div>
    );
};

export default DetalleHojaReparto;
