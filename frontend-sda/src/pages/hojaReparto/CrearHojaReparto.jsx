import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import { useContext } from "react";
import AuthContext from "../../context/AuthProvider";
import { apiSistema } from "../../utils/api";
import "../../styles/formularioSistema.css";
import "../../styles/botonesSistema.css";
import "../../styles/titulosSistema.css";
import { mostrarAlerta } from "../../utils/alertaGlobal";
import { confirmarAccion } from "../../utils/confirmarAccion";


const CrearHojaReparto = () => {
    const [rutas, setRutas] = useState([]);
    const [rutaSeleccionada, setRutaSeleccionada] = useState("");
    const [chofer, setChofer] = useState(null);
    const [vehiculo, setVehiculo] = useState(null);
    const [envios, setEnvios] = useState([]);
    const [hojaCreada, setHojaCreada] = useState(null);
    const [observaciones, setObservaciones] = useState("");
    const [cargandoEnvios, setCargandoEnvios] = useState(false);
    const [listaChoferes, setListaChoferes] = useState([]);
    const [listaVehiculos, setListaVehiculos] = useState([]);
    const { auth } = useContext(AuthContext);



    const navigate = useNavigate();
    const usuarioId = auth?._id;

    useEffect(() => {
        const obtenerRutas = async () => {
            try {
                const res = await axios.get(apiSistema("/api/rutas/todas"));
                setRutas(res.data.rutas || []);

            } catch (error) {
                console.error("Error al obtener rutas:", error);
            }
        };

        const obtenerChoferes = async () => {
            try {
                const res = await axios.get(apiSistema("/api/choferes/solo-nombres"));
                setListaChoferes(res.data || []);
            } catch (error) {
                console.error("Error al obtener choferes:", error);
            }
        };

        const obtenerVehiculos = async () => {
            try {
                const res = await axios.get(apiSistema("/api/vehiculos"));
                setListaVehiculos(res.data);
            } catch (error) {
                console.error("Error al obtener vehículos:", error);
            }
        };

        obtenerRutas();
        obtenerChoferes();
        obtenerVehiculos();
    }, []);

    const manejarSeleccionRuta = (rutaId) => {
        const ruta = rutas.find((r) => r._id === rutaId);
        setRutaSeleccionada(rutaId);

        const choferId = ruta?.choferAsignado?._id?.toString();
        const vehiculoId = ruta?.vehiculoAsignado?._id?.toString();

        const choferCompleto = listaChoferes.find((c) => c._id === choferId);
        const vehiculoCompleto = listaVehiculos.find((v) => v._id === vehiculoId);

        setChofer(choferCompleto || "");
        setVehiculo(vehiculoCompleto || "");
        setEnvios([]);
    };



    const buscarEnvios = async () => {
        setCargandoEnvios(true);
        try {
            const ruta = rutas.find((r) => r._id === rutaSeleccionada);
            const localidadesRuta = ruta?.localidades || [];

            const res = await axios.post(apiSistema("/api/hojas-reparto/preliminar"), {
                rutaId: ruta._id,
                choferId: typeof chofer === "object" ? chofer._id : chofer,
                vehiculoId: vehiculo?._id || vehiculo,
                observaciones,
                usuarioId,
                localidadesRuta,
            });

            setEnvios(res.data.envios);
            setHojaCreada(res.data.hoja);
        } catch (error) {
            console.error("Error al buscar envíos:", error);
        }
        setCargandoEnvios(false);
    };

    const confirmarHojaFinal = async () => {
        if (!hojaCreada?._id) {
            mostrarAlerta("No hay hoja para confirmar.", "warning");
            return;
        }

        try {
            const enviosSoloIds = envios.map(e => e?._id || e); // ← Asegura que sean solo IDs
            console.log("🟡 Enviando datos:", {
                hojaId: hojaCreada._id,
                envios: envios.map(e => e._id),
                choferId: typeof chofer === "object" ? chofer._id : chofer,
                vehiculoId: vehiculo?._id || vehiculo,
                usuarioId,
            });

            const res = await axios.post(apiSistema("/api/hojas-reparto/confirmar"), {
                hojaId: hojaCreada._id,
                envios: enviosSoloIds,
                choferId: typeof chofer === "object" ? chofer._id : chofer,
                vehiculoId: vehiculo?._id || vehiculo,
                usuarioId,
            });

            if (res.status === 200) {
                mostrarAlerta("✅ Hoja de Reparto confirmada con éxito", "success");
                navigate("/"); // Podés cambiarlo más adelante
            }
        } catch (error) {
            console.error("❌ Error al confirmar hoja:", error);
            mostrarAlerta("Error al confirmar hoja de reparto", "danger");
        }
    };


    const quitarEnvio = async (envioId) => {
        const confirmar = await confirmarAccion(
            "¿Quitar envío de la hoja?",
            "Este envío quedará fuera de la hoja de reparto actual"
          );
        if (!confirmar) return;

        const nuevosEnvios = envios.filter((e) => e._id !== envioId);
        setEnvios(nuevosEnvios);
    };


    return (
        <div
            className="container mt-4"
            style={{
                marginLeft: "280px", // más espacio a la derecha del sidebar
                maxWidth: "82vw", // ocupa más ancho de pantalla
                paddingRight: "30px",
            }}
        >

            <h2 className="titulo-seccion mb-4">Crear Hoja de Reparto</h2>

            <div className="mb-3">
                <label className="form-label">Ruta:</label>
                <select
                    className="form-select select-sistema"
                    value={rutaSeleccionada}
                    onChange={(e) => manejarSeleccionRuta(e.target.value)}
                >
                    <option value="">Seleccioná una ruta</option>
                    {Array.isArray(rutas) && rutas.map((ruta) => (
                        <option key={ruta._id} value={ruta._id}>
                            {ruta.codigo} - {ruta.descripcion}
                        </option>
                    ))}
                </select>
            </div>
            <div className="mb-3">
                <label className="form-label">Chofer:</label>
                <select
                    className="form-select select-sistema"
                    value={chofer?._id || ""}
                    onChange={(e) => {
                        const seleccionado = listaChoferes.find(c => c._id === e.target.value);
                        setChofer(seleccionado);
                    }}
                >
                    <option value="">Seleccionar Chofer</option>
                    {listaChoferes.map((c) => (
                        <option key={c._id} value={c._id}>
                            {c.usuario?.nombre} - {c.usuario?.dni}
                        </option>
                    ))}
                </select>

            </div>

            <div className="mb-3">
                <label className="form-label">Vehículo:</label>
                <select
                    className="form-select select-sistema"
                    value={vehiculo?._id || ""}
                    onChange={(e) => {
                        const seleccionado = listaVehiculos.find(v => v._id === e.target.value);
                        setVehiculo(seleccionado);
                    }}
                >
                    <option value="">Seleccioná un vehículo</option>
                    {listaVehiculos.map((v) => (
                        <option key={v._id} value={v._id}>
                            {v.patente} - {v.marca} {v.modelo}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mb-3">
                <label className="form-label">Observaciones:</label>
                <textarea
                    className="form-control textarea-sistema"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                ></textarea>
            </div>

            <button
                className="btn-sda-principal mb-5"
                onClick={buscarEnvios}
                disabled={!rutaSeleccionada}
            >
                Buscar Envíos de la Ruta
            </button>

            {cargandoEnvios ? (
                <div className="text-center">
                    <Spinner animation="border" variant="warning" />
                </div>
            ) : (
                envios.length > 0 && (
                    <div>
                        {/* 🔸 Puntitos decorativos */}
                        <div className="d-flex align-items-center mb-3">
                            <h5 className="card-title m-0 ms-2">
                                Envíos encontrados ({envios.length}):
                            </h5>
                        </div>

                        {/* 🔹 Tabla de envíos */}
                        <div className="table-responsive">
                            <table className="table tabla-montserrat">
                                <thead className="encabezado-moderno">
                                    <tr>
                                        <th>#</th>
                                        <th>Remito</th>
                                        <th>Localidad</th>
                                        <th>Remitente</th>
                                        <th>Destinatario</th>
                                        <th>Dirección</th>
                                        <th>Bultos</th>
                                        <th aria-label="Acciones" />

                                    </tr>
                                </thead>
                                <tbody>
                                    {envios.map((envio, index) => (
                                        <tr key={envio._id || index} className="tabla-moderna-fila">
                                            <td>{index + 1}</td>
                                            <td>{envio.remitoNumero || "-"}</td>
                                            <td>{envio.localidadDestino?.nombre || "-"}</td>
                                            <td>{envio.clienteRemitente?.nombre || "-"}</td>
                                            <td>{envio.destinatario?.nombre || "-"}</td>
                                            <td>{envio.destinatario?.direccion || "-"}</td>
                                            <td>{envio.encomienda?.cantidad || "-"}</td>
                                            <td>
                                                <button
                                                    className="btn-icono btn-eliminar"
                                                    onClick={() => quitarEnvio(envio._id)}
                                                    title="Quitar envío"
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )

            )}
            {hojaCreada && envios.length > 0 && (
                <div className="text-center mt-4">
                    <button
                        className="btn-sda-principal px-4 py-2"
                        onClick={confirmarHojaFinal}
                    >
                        Confirmar Hoja de Reparto
                    </button>
                </div>
            )}
        </div>

    );
};

export default CrearHojaReparto;
