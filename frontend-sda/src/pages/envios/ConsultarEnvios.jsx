import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Card, Form, InputGroup } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../styles/datepicker-custom.css"; // Asegurate de que la ruta sea correcta
import "../../styles/estadosSistema.css";
import "../../styles/titulosSistema.css";
import "../../styles/paginacion.css";
import { FiCalendar } from "react-icons/fi";
import { useContext } from "react";
import AuthContext from "../../context/AuthProvider"; // ajustá la ruta si es distinta
import { Trash2 } from "lucide-react";
import { apiSistema } from "../../utils/api";
import { mostrarAlerta } from "../../utils/alertaGlobal";
import { confirmarAccion } from "../../utils/confirmarAccion";


const ConsultarEnvios = () => {
    const [envios, setEnvios] = useState([]);
    const [filtroEstado, setFiltroEstado] = useState("");

    const hoy = new Date();
    const haceUnMes = new Date();
    haceUnMes.setMonth(hoy.getMonth() - 1);

    const [filtroFechaDesde, setFiltroFechaDesde] = useState(haceUnMes);
    const [filtroFechaHasta, setFiltroFechaHasta] = useState(hoy);
    const [renderListo, setRenderListo] = useState(false);
    const [enviosListos, setEnviosListos] = useState(false);
    const [paginaActual, setPaginaActual] = useState(0);
    const [totalEnvios, setTotalEnvios] = useState(0);
    const { auth } = useContext(AuthContext);
    const [busqueda, setBusqueda] = useState("");
    const datepickerDesdeRef = useRef(null);
    const datepickerHastaRef = useRef(null);



    const fetchEnvios = async () => {
        if (!auth?.token || !auth?.rol) return;

        try {
            const desde = filtroFechaDesde.toISOString();
            const hasta = filtroFechaHasta.toISOString();

            const res = await axios.get(apiSistema(
                `/api/envios?pagina=${paginaActual}&limite=10&estado=${filtroEstado}&fechaDesde=${desde}&fechaHasta=${hasta}&busqueda=${busqueda}`
            ), {
                headers: {
                    Authorization: `Bearer ${auth.token}`,
                },
            });

            const enviosConPermisos = res.data.resultados.map((envio) => ({
                ...envio,
                permisoEliminar:
                    auth.rol === "admin" ||
                    (auth.rol === "administrativo" && envio.estado === "pendiente"),
            }));

            setEnvios(enviosConPermisos);
            setTotalEnvios(res.data.total);
            setEnviosListos(true);
        } catch (error) {
            console.error("Error al obtener los envíos:", error);
        }
    };

    useEffect(() => {
        if (auth?.rol) {
            setRenderListo(true);
            fetchEnvios();
        }
    }, [auth.rol, paginaActual, filtroEstado, filtroFechaDesde, filtroFechaHasta, busqueda]);


    const aplicarFiltros = (envio) => {
        const fecha = new Date(envio.fechaCreacion);
        return (
            (!filtroEstado || envio.estado === filtroEstado) &&
            (!filtroFechaDesde || fecha >= filtroFechaDesde) &&
            (!filtroFechaHasta || fecha <= filtroFechaHasta)
        );
    };

    const handleEliminarEnvio = async (id) => {
        const confirmar = await confirmarAccion("¿Eliminar envío?", "Esta acción no se puede deshacer");
        if (!confirmar) return;

        try {
            await axios.delete(apiSistema(`/api/envios/${id}`), {
                headers: {
                    Authorization: `Bearer ${auth.token}`
                },
            });

            // Actualizar la tabla eliminando el envío eliminado
            setEnvios(envios.filter((e) => e._id !== id));
            mostrarAlerta("Envío eliminado correctamente.", "success");
        } catch (error) {
            console.error("❌ Error al eliminar el envío:", error);
            mostrarAlerta("No se pudo eliminar el envío.", "danger");
        }
    };

    if (!auth?.rol || !enviosListos) {
        return <div className="text-center mt-5">Cargando envíos...</div>;
    }



    return (
        <div className="container mt-4">
            <h2 className="mb-4 titulo-seccion">Consultar Envíos</h2>
            <div className="p-4 mb-4 border-0 rounded-4">
                <Form className="row align-items-center g-3">
                    <Form.Group className="col-md-12">
                        <Form.Control
                            type="text"
                            placeholder="Buscar por remito o seguimiento..."
                            className="input-sistema"
                            value={busqueda}
                            onChange={(e) => {
                                setBusqueda(e.target.value);
                                setPaginaActual(0); // Reinicia a la primera página
                            }}
                        />
                    </Form.Group>

                    {/* Filtro por estado */}
                    <Form.Group className="col-md-3 d-flex align-items-center">
                        <label className="label-sistema me-2 mb-0">Estado</label>
                        <Form.Select
                            value={filtroEstado}
                            onChange={(e) => {
                                setFiltroEstado(e.target.value);
                                setPaginaActual(0);
                            }}
                            className="input-sistema flex-grow-1"
                        >
                            <option value="">Todos</option>
                            <option value="pendiente">Pendiente</option>
                            <option value="en reparto">En reparto</option>
                            <option value="entregado">Entregado</option>
                            <option value="devuelto">Devuelto</option>
                            <option value="rechazado">Rechazado</option>
                            <option value="no entregado">No entregado</option>
                            <option value="reagendado">Reagendado</option>
                            <option value="cancelado">Cancelado</option>
                        </Form.Select>
                    </Form.Group>

                    {/* Fecha Desde */}
                    <Form.Group className="col-md-4 d-flex align-items-center">
                        <label className="label-sistema me-2 mb-0">Desde</label>
                        <InputGroup className="input-group-custom flex-grow-1">
                            <DatePicker
                                selected={filtroFechaDesde}
                                onChange={(date) => {
                                    setFiltroFechaDesde(date);
                                    setPaginaActual(0);
                                }}
                                dateFormat="dd/MM/yyyy"
                                placeholderText="Seleccionar fecha"
                                className="form-control input-sistema"
                                ref={datepickerDesdeRef}
                            />
                            <InputGroup.Text
                                className="icono-input-sistema"
                                onClick={() => datepickerDesdeRef.current?.setOpen(true)}
                                style={{ cursor: "pointer" }}
                            >
                                <FiCalendar />
                            </InputGroup.Text>
                        </InputGroup>
                    </Form.Group>


                    {/* Fecha Hasta */}
                    <Form.Group className="col-md-5 d-flex align-items-center">
                        <label className="label-sistema me-2 mb-0">Hasta</label>
                        <InputGroup className="input-group-custom flex-grow-1">
                            <DatePicker
                                selected={filtroFechaHasta}
                                onChange={(date) => {
                                    setFiltroFechaHasta(date);
                                    setPaginaActual(0);
                                }}
                                dateFormat="dd/MM/yyyy"
                                placeholderText="Seleccionar fecha"
                                className="form-control input-sistema"
                                ref={datepickerHastaRef}
                            />
                            <InputGroup.Text
                                className="icono-input-sistema"
                                onClick={() => datepickerHastaRef.current?.setOpen(true)}
                                style={{ cursor: "pointer" }}
                            >
                                <FiCalendar />
                            </InputGroup.Text>
                        </InputGroup>
                    </Form.Group>


                </Form>
            </div>


            <div className="table-responsive">
                <table className="table align-middle text-center shadow-sm rounded tabla-montserrat">

                    <thead className="encabezado-moderno">
                        <tr>
                            <th></th>
                            <th>Fecha</th>
                            <th>Remitente</th>
                            <th>Destinatario</th>
                            <th>Localidad</th>
                            <th>Remito</th>
                            <th>Seguimiento</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {envios.map((envio) => (
                            <tr key={`${envio._id}-${auth.rol}`} className="tabla-moderna-fila">
                                <td className="text-muted" style={{ fontSize: "1.2rem" }}>⋮⋮</td>
                                <td>{new Date(envio.fechaCreacion).toLocaleDateString()}</td>
                                <td>{envio.clienteRemitente?.nombre || "-"}</td>
                                <td>{envio.destinatario?.nombre || "-"}</td>
                                <td>{envio.localidadDestino?.nombre || "-"}</td>
                                <td>{envio.remitoNumero || "—"}</td>
                                <td>
                                    {envio.numeroSeguimiento ? (
                                        <span className="text-dark">{envio.numeroSeguimiento}</span>
                                    ) : (
                                        <span className="text-muted">—</span>
                                    )}
                                </td>
                                <td>
                                    <span className={`estado-chip estado-${envio.estado?.toLowerCase().replace(/\s+/g, "-")}`}>
                                        {envio.estado}
                                    </span>
                                </td>

                                {/* ✅ NUEVA COLUMNA: Acciones */}
                                <td>
                                    <button
                                        className="btn-icono btn-eliminar"
                                        title="Eliminar"
                                        onClick={() => handleEliminarEnvio(envio._id)}
                                    >
                                        <Trash2 size={18} />
                                    </button>


                                </td>

                            </tr>
                        ))}

                    </tbody>
                </table>
            </div>
            {totalEnvios > 10 && (
                <div className="paginacion-container mt-3">
                    <span className="paginacion-info">
                        Mostrando {envios.length} de {totalEnvios || 0} envíos
                    </span>

                    <div className="paginacion-botones">
                        {(() => {
                            const totalPaginas = Math.ceil(totalEnvios / 10);
                            const visiblePages = 5;
                            const totalGrupos = Math.ceil(totalPaginas / visiblePages);
                            const grupoActual = Math.floor(paginaActual / visiblePages);
                            const start = grupoActual * visiblePages;
                            const end = Math.min(start + visiblePages, totalPaginas);

                            return (
                                <>
                                    {/* ◀◀ Grupo anterior */}
                                    {grupoActual > 0 && (
                                        <button
                                            className="paginacion-btn"
                                            onClick={() => setPaginaActual(start - visiblePages)}
                                        >
                                            ◀◀
                                        </button>
                                    )}

                                    {/* ◀ Página anterior */}
                                    {paginaActual > 0 && (
                                        <button
                                            className="paginacion-btn"
                                            onClick={() => setPaginaActual(paginaActual - 1)}
                                        >
                                            ◀
                                        </button>
                                    )}

                                    {/* Botones de páginas */}
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

                                    {/* ▶ Página siguiente */}
                                    {paginaActual < totalPaginas - 1 && (
                                        <button
                                            className="paginacion-btn"
                                            onClick={() => setPaginaActual(paginaActual + 1)}
                                        >
                                            ▶
                                        </button>
                                    )}

                                    {/* ▶▶ Grupo siguiente */}
                                    {grupoActual < totalGrupos - 1 && (
                                        <button
                                            className="paginacion-btn"
                                            onClick={() => setPaginaActual(end)}
                                        >
                                            ▶▶
                                        </button>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}


        </div>


    );

};

export default ConsultarEnvios;
