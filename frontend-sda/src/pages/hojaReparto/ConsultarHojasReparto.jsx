import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FilePdf } from "react-bootstrap-icons";
import { apiSistema } from "../../utils/api";
import "../../styles/titulosSistema.css";
import { mostrarAlerta } from "../../utils/alertaGlobal";



const ConsultarHojasReparto = () => {
    const [hojas, setHojas] = useState([]);
    const [filtro, setFiltro] = useState("");
    const [cargando, setCargando] = useState(true);
    const navigate = useNavigate();
    const [paginaActual, setPaginaActual] = useState(0);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [limite] = useState(10);
    const paginasPorGrupo = 5;
    const totalGrupos = Math.ceil(totalPaginas / paginasPorGrupo);
    const grupoActual = Math.floor(paginaActual / paginasPorGrupo);
    const start = grupoActual * paginasPorGrupo;
    const end = Math.min(start + paginasPorGrupo, totalPaginas);
    const [total, setTotal] = useState(0);




    const exportarHoja = async (hojaId, numeroHoja) => {
        try {

            const response = await axios.get(apiSistema(`/api/hojas-reparto/exportar/${hojaId}`), {
                responseType: "blob",
            });

            // Esperamos unos milisegundos antes de continuar (opcional pero útil)
            await new Promise((resolve) => setTimeout(resolve, 300)); // 300ms de espera

            const blob = new Blob([response.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `Hoja de Reparto - ${numeroHoja}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error("❌ Error al exportar hoja:", error);
            mostrarAlerta("Error al exportar la hoja de reparto", "danger");
        }
    };

    useEffect(() => {
        const obtenerHojas = async () => {
            setCargando(true);
            try {
                const res = await axios.get(apiSistema(`/api/hojas-reparto/paginado`), {
                    params: {
                        pagina: paginaActual,
                        limite,
                        busqueda: filtro
                    }
                });

                setHojas(res.data.hojas || []);
                setTotalPaginas(Math.ceil(res.data.total / limite));
                setTotal(res.data.total || 0);
            } catch (error) {
                console.error("Error al obtener hojas de reparto:", error);
            }
            setCargando(false);

        };
        obtenerHojas();
    }, [paginaActual, filtro]);


    const verDetalle = (idHoja) => {
        navigate(`/hojas-reparto/${idHoja}`);
    };

    const hojasFiltradas = hojas.filter((hoja) =>
        hoja.numeroHoja?.toLowerCase().includes(filtro.toLowerCase())
    );
    const mostrarCantidad = () => {
        const desde = paginaActual * limite + 1;
        const hasta = Math.min((paginaActual + 1) * limite, total);
        return `Mostrando ${desde} a ${hasta} de ${total} hojas de reparto`;
    };


    return (
        <div className="container mt-4">
            <h2 className="mb-4 titulo-seccion">Hojas de Reparto Confirmadas</h2>

            <div className="mb-3">
                <input
                    type="text"
                    className="form-control input-sistema"
                    placeholder="Buscar por número de hoja (ej: HR-SDA-00001)"
                    value={filtro}
                    onChange={(e) => {
                        setFiltro(e.target.value);
                        setPaginaActual(0); // reinicia la paginación cuando cambia la búsqueda
                    }}
                />

            </div>

            {cargando ? (
                <p>Cargando hojas...</p>
            ) : hojas.length === 0 ? (
                <p>No hay hojas de reparto encontradas.</p>
            ) : (

                <div className="table-responsive">
                    <table className="table tabla-montserrat text-center align-middle">
                        <thead className="encabezado-moderno">
                            <tr>
                                <th></th>
                                <th>Número de Hoja</th>
                                <th>Fecha</th>
                                <th>Chofer</th>
                                <th>Vehículo</th>
                                <th>Envíos</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {hojas.map((hoja) => (
                                <tr className="tabla-moderna-fila" key={hoja._id}>
                                    <td className="text-muted" style={{ fontSize: "1.2rem" }}>⋮⋮</td>
                                    <td>{hoja.numeroHoja || "-"}</td>
                                    <td>
                                        {hoja.fecha
                                            ? new Date(hoja.fecha).toLocaleString("es-AR", {
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                hour12: false,
                                            })
                                            : "-"}
                                    </td>

                                    <td>
                                        {hoja.chofer?.usuario?.nombre || "Sin datos"}
                                    </td>

                                    <td>{hoja.vehiculo?.patente || "-"}</td>
                                    <td className="text-center">
                                        {hoja.envios?.length || 0}
                                    </td>
                                    <td className="d-flex align-items-center gap-3">
                                        <button
                                            className="btn-pill-texto gap-2"
                                            onClick={() => verDetalle(hoja._id)}
                                            title="Ver detalles"
                                        >
                                            Ver Detalles
                                        </button>

                                        <button
                                            className="icono-pdf-solo gap-2"
                                            onClick={() => exportarHoja(hoja._id, hoja.numeroHoja)}
                                            title="Exportar como PDF"
                                        >
                                            <FilePdf size={22} />
                                        </button>

                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>


                </div>

            )}
            {totalPaginas > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap">
                    <div className="text-muted small">
                        {mostrarCantidad()}
                    </div>

                    <div className="d-flex gap-1 flex-wrap">
                        {grupoActual > 0 && (
                            <button className="paginacion-btn" onClick={() => setPaginaActual(start - paginasPorGrupo)}>
                                ◀◀
                            </button>
                        )}
                        {paginaActual > 0 && (
                            <button className="paginacion-btn" onClick={() => setPaginaActual(paginaActual - 1)}>
                                ◀
                            </button>
                        )}
                        {Array.from({ length: end - start }).map((_, i) => {
                            const pageIndex = start + i;
                            return (
                                <button
                                    key={pageIndex}
                                    className={`paginacion-btn ${paginaActual === pageIndex ? "activo" : ""}`}
                                    onClick={() => setPaginaActual(pageIndex)}
                                >
                                    {pageIndex + 1}
                                </button>
                            );
                        })}
                        {paginaActual < totalPaginas - 1 && (
                            <button className="paginacion-btn" onClick={() => setPaginaActual(paginaActual + 1)}>
                                ▶
                            </button>
                        )}
                        {grupoActual < totalGrupos - 1 && (
                            <button className="paginacion-btn" onClick={() => setPaginaActual(end)}>
                                ▶▶
                            </button>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};

export default ConsultarHojasReparto;
