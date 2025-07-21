import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { apiSistema } from "../../utils/api";
import "../../styles/formularioSistema.css";
import "../../styles/botonesSistema.css";
import "../../styles/titulosSistema.css";
import "../../styles/cardsSistema.css";
import { mostrarAlerta } from "../../utils/alertaGlobal";




const NuevoEnvio = () => {
  const [clientes, setClientes] = useState([]);
  const [clienteRemitenteId, setClienteRemitenteId] = useState("");
  const [clienteRemitenteInfo, setClienteRemitenteInfo] = useState(null);

  const [destinatarios, setDestinatarios] = useState([]);
  const [destinatarioId, setDestinatarioId] = useState("");

  const [localidades, setLocalidades] = useState([]);
  const [localidadDestino, setLocalidadDestino] = useState("");

  const [peso, setPeso] = useState("");
  const [dimensiones, setDimensiones] = useState({ largo: "", ancho: "", alto: "" });
  const [cantidad, setCantidad] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [destinatarioInfo, setDestinatarioInfo] = useState(null);
  const [nuevoDestinatario, setNuevoDestinatario] = useState({
    nombre: "",
    dni: "",
    telefono: "",
    email: "",
    direccion: "",
    localidad: "",
    provincia: "Córdoba"

  });

  const [busquedaDestinatario, setBusquedaDestinatario] = useState("");
  const [sugerencias, setSugerencias] = useState([]);
  const [cargandoBusqueda, setCargandoBusqueda] = useState(false);

  const [busquedaRemitente, setBusquedaRemitente] = useState("");
  const [remitenteSugerencias, setRemitenteSugerencias] = useState([]);
  const [remitenteInfo, setRemitenteInfo] = useState(null);


  const navigate = useNavigate();

  useEffect(() => {
    const buscar = async () => {
      if (busquedaDestinatario.length < 2) {
        setSugerencias([]);
        return;
      }

      setCargandoBusqueda(true);
      try {
        const res = await axios.get(apiSistema(`/api/destinatarios/buscar`), {
          params: {
            busqueda: busquedaDestinatario,
            pagina: 0,
            limite: 10,
          },
        });
        setSugerencias(res.data.resultados);
      } catch (error) {
        console.error("Error al buscar destinatarios:", error);
      }
      setCargandoBusqueda(false);
    };

    const delay = setTimeout(buscar, 400); // debounce
    return () => clearTimeout(delay);
  }, [busquedaDestinatario]);


  useEffect(() => {
    const buscar = async () => {
      if (busquedaRemitente.length < 2) {
        setRemitenteSugerencias([]);
        return;
      }

      try {
        const res = await axios.get(apiSistema("/api/usuarios/buscar-clientes"), {
          params: {
            busqueda: busquedaRemitente,
            pagina: 0,
            limite: 10,
          },
        });
        setRemitenteSugerencias(res.data.resultados);
      } catch (error) {
        console.error("❌ Error al buscar remitentes:", error);
      }
    };

    const delay = setTimeout(buscar, 400); // debounce
    return () => clearTimeout(delay);
  }, [busquedaRemitente]);


  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        const clientesRes = await axios.get(apiSistema("/api/usuarios/clientes"));
        setClientes(clientesRes.data);

        const localidadesRes = await axios.get(apiSistema("/api/localidades"));
        setLocalidades(localidadesRes.data);
      } catch (error) {
        console.error("Error al obtener datos:", error);
      }
    };

    obtenerDatos();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!destinatarioId || !localidadDestino) {
      mostrarAlerta("Debes seleccionar o crear un destinatario con localidad.");
      return;
    }

    const envio = {
      clienteRemitente: clienteRemitenteId,
      destinatario: destinatarioId,
      localidadDestino: localidadDestino,
      sucursalOrigen: "Sucursal Córdoba",
      usuarioCreador: "67ee926c8eb4b19d4dd341a3", // Temporal
      encomienda: {
        peso: parseFloat(peso),
        dimensiones: {
          largo: parseFloat(dimensiones.largo),
          ancho: parseFloat(dimensiones.ancho),
          alto: parseFloat(dimensiones.alto)
        },
        cantidad: parseInt(cantidad),
        tipoPaquete: "Documentación"
      }
    };

    try {
      const res = await axios.post(apiSistema("/api/envios"), envio);
      mostrarAlerta("Envío creado con éxito","success");
      navigate("/perfil");
    } catch (error) {
      console.error("❌ Error al crear envío:", error);
    }
  };


  const handleGuardarDestinatario = async () => {
    if (!nuevoDestinatario.localidad) {
      mostrarAlerta("Por favor selecciona una localidad para el destinatario.");
      return;
    }

    try {
      const res = await axios.post(apiSistema("/api/destinatarios"), nuevoDestinatario);

      // 🟡 Hacer una segunda llamada con populate
      const resPopulado = await axios.get(apiSistema(`/api/destinatarios/${res.data._id}`));

      setDestinatarioId(resPopulado.data._id);
      setDestinatarioInfo(resPopulado.data);
      setLocalidadDestino(resPopulado.data.localidad._id || resPopulado.data.localidad);
      setShowModal(false);
    } catch (error) {
      if (error.response && error.response.data?.error) {
       mostrarAlerta(`Error: ${error.response.data.error}`);
      } else {
        mostrarAlerta("Error inesperado al crear destinatario.");
      }
    }
  };



  return (
    <div className="container d-flex justify-content-center align-items-center mt-5">
      <div className="w-100" style={{ maxWidth: "900px" }}>
        <h2 className="titulo-seccion mb-4">Realizar un Envío</h2>

        <form onSubmit={handleSubmit} className="p-4 shadow-sm rounded-4 border-0 bg-white">
          <div className="mb-4">
            <label className="label-sistema">Cliente Remitente</label>
            <div className="position-relative">
              <input
                type="text"
                className="input-sistema"
                placeholder="Buscar cliente por nombre, email o DNI..."
                value={busquedaRemitente}
                onChange={(e) => {
                  setBusquedaRemitente(e.target.value);
                  setClienteRemitenteId("");
                  setRemitenteInfo(null);
                }}
              />

              {remitenteSugerencias.length > 0 && (
                <div className="list-group position-absolute w-100 z-3" style={{ maxHeight: 200, overflowY: "auto" }}>
                  {remitenteSugerencias.map((usuario) => (
                    <button
                      key={usuario._id}
                      type="button"
                      className="list-group-item list-group-item-action"
                      onClick={() => {
                        setClienteRemitenteId(usuario._id);
                        setRemitenteInfo(usuario);
                        setBusquedaRemitente(`${usuario.nombre} (${usuario.email})`);
                        setRemitenteSugerencias([]);
                      }}
                    >
                      {usuario.nombre} – {usuario.email}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {remitenteInfo?.nombre && (
              <div className="bloque-datos">
                <p><strong>Nombre:</strong> {remitenteInfo.nombre}</p>
                <p><strong>Email:</strong> {remitenteInfo.email}</p>
                <p><strong>DNI:</strong> {remitenteInfo.dni}</p>
                <p><strong>Teléfono:</strong> {remitenteInfo.telefono}</p>
                <p><strong>Dirección:</strong> {remitenteInfo.direccion}</p>
                <p><strong>Localidad:</strong> {remitenteInfo.localidad}</p>
                <p><strong>Provincia:</strong> {remitenteInfo.provincia}</p>
              </div>
            )}

          </div>


          <div className="mb-4">
            <label className="label-sistema">Destinatario</label>
            <div className="d-flex gap-2">
              <div className="position-relative flex-grow-1">
                <input
                  type="text"
                  className="input-sistema w-100"
                  placeholder="Buscar destinatario por nombre, email o DNI..."
                  value={busquedaDestinatario}
                  onChange={(e) => {
                    setBusquedaDestinatario(e.target.value);
                    setDestinatarioId("");
                    setDestinatarioInfo(null);
                  }}
                />

                {sugerencias.length > 0 && (
                  <div className="list-group position-absolute w-100 z-3" style={{ maxHeight: 200, overflowY: "auto" }}>
                    {sugerencias.map((dest) => (
                      <button
                        key={dest._id}
                        type="button"
                        className="list-group-item list-group-item-action"
                        onClick={() => {
                          setDestinatarioId(dest._id);
                          setDestinatarioInfo(dest);
                          const localidadId = typeof dest.localidad === "object" ? dest.localidad._id : dest.localidad;
                          setLocalidadDestino(localidadId);
                          setBusquedaDestinatario(`${dest.nombre} (${dest.dni}) - ${dest.email} - ${dest.direccion}`);
                          setSugerencias([]);
                        }}
                      >
                        {dest.nombre} ({dest.dni}) - {dest.email} - {dest.direccion}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button type="button" className="btn-soft-warning" onClick={() => setShowModal(true)}>
                Nuevo
              </button>
            </div>

            {cargandoBusqueda && <p className="text-muted small mt-1">Buscando...</p>}

            {destinatarioInfo && (
              <div className="bloque-datos">
                <p><strong>Nombre:</strong> {destinatarioInfo.nombre}</p>
                <p><strong>DNI:</strong> {destinatarioInfo.dni}</p>
                <p><strong>Email:</strong> {destinatarioInfo.email}</p>
                <p><strong>Teléfono:</strong> {destinatarioInfo.telefono}</p>
                <p><strong>Dirección:</strong> {destinatarioInfo.direccion}</p>
                <p><strong>Localidad:</strong> {destinatarioInfo.localidad?.nombre || destinatarioInfo.localidad}</p>
                <p><strong>Provincia:</strong> {destinatarioInfo.provincia}</p>
              </div>
            )}

          </div>

          <div className="mb-3">
            <label className="label-sistema">Peso (kg)</label>
            <input
              type="number"
              className="input-sistema"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="label-sistema">Dimensiones (cm)</label>
            <div className="d-flex gap-2">
              <input
                type="number"
                placeholder="Largo"
                className="input-sistema"
                value={dimensiones.largo}
                onChange={(e) => setDimensiones({ ...dimensiones, largo: e.target.value })}
              />
              <input
                type="number"
                placeholder="Ancho"
                className="input-sistema"
                value={dimensiones.ancho}
                onChange={(e) => setDimensiones({ ...dimensiones, ancho: e.target.value })}
              />
              <input
                type="number"
                placeholder="Alto"
                className="input-sistema"
                value={dimensiones.alto}
                onChange={(e) => setDimensiones({ ...dimensiones, alto: e.target.value })}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="label-sistema">Cantidad de bultos</label>
            <input
              type="number"
              className="input-sistema"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
            />
          </div>

          <div className="text-center">
            <button type="submit" className="btn-soft-warning px-5 py-2">
              Guardar Envío
            </button>
          </div>
        </form>

        <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton className="modal-header-sda">
            <Modal.Title className="modal-title-sda">Nuevo Destinatario</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-2">
                <Form.Label>Nombre</Form.Label>
                <Form.Control type="text" className="input-sistema" value={nuevoDestinatario.nombre} onChange={(e) => setNuevoDestinatario({ ...nuevoDestinatario, nombre: e.target.value })} />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>DNI</Form.Label>
                <Form.Control type="text" className="input-sistema" value={nuevoDestinatario.dni} onChange={(e) => setNuevoDestinatario({ ...nuevoDestinatario, dni: e.target.value })} />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Teléfono</Form.Label>
                <Form.Control type="text" className="input-sistema" value={nuevoDestinatario.telefono} onChange={(e) => setNuevoDestinatario({ ...nuevoDestinatario, telefono: e.target.value })} />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" className="input-sistema" value={nuevoDestinatario.email} onChange={(e) => setNuevoDestinatario({ ...nuevoDestinatario, email: e.target.value })} />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Dirección</Form.Label>
                <Form.Control type="text" className="input-sistema" value={nuevoDestinatario.direccion} onChange={(e) => setNuevoDestinatario({ ...nuevoDestinatario, direccion: e.target.value })} />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Localidad</Form.Label>
                <select className="select-sistema" value={nuevoDestinatario.localidad} onChange={(e) => setNuevoDestinatario({ ...nuevoDestinatario, localidad: e.target.value })}>
                  <option value="">Seleccionar localidad...</option>
                  {localidades.map((loc) => (
                    <option key={loc._id} value={loc._id}>{loc.nombre}</option>
                  ))}
                </select>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="btn-soft-cancelar" onClick={() => setShowModal(false)}>Cancelar</button>
            <button type="button" className="btn-soft-warning" onClick={handleGuardarDestinatario}>Guardar</button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );

};

export default NuevoEnvio;
