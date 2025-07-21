import React, { useEffect, useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import Select from "react-select";
import { apiSistema } from "../../utils/api";
import { mostrarAlerta } from "../../utils/alertaGlobal";


const FormularioRuta = ({ onClose, ruta, recargar }) => {
  const [formData, setFormData] = useState({
    codigo: "",
    horaSalida: "",
    frecuencia: "",
    descripcion: "",
    localidades: [],
    choferAsignado: "",
    vehiculoAsignado: "",
  });

  const [localidadesDisponibles, setLocalidadesDisponibles] = useState([]);
  const [choferes, setChoferes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const [lRes, cRes, vRes] = await Promise.all([
          fetch(apiSistema("/api/localidades")),
          fetch(apiSistema("/api/choferes/solo-nombres")),
          fetch(apiSistema("/api/vehiculos")),
        ]);

        const localidadesData = await lRes.json();
        setLocalidadesDisponibles(localidadesData);

        setChoferes(await cRes.json());
        setVehiculos(await vRes.json());
      } catch (error) {
        console.error("Error al cargar datos relacionados:", error);
      }
    };
    fetchDatos();
  }, []);

  useEffect(() => {
    if (ruta) {
      const localidadesFormateadas = ruta.localidades.map((loc) => {
        if (typeof loc === "string") {
          const encontrada = localidadesDisponibles.find((l) => l._id === loc);
          return {
            value: loc,
            label: encontrada ? encontrada.nombre : loc,
          };
        } else if (loc._id && loc.nombre) {
          return { value: loc._id, label: loc.nombre };
        } else {
          return { value: loc.value, label: loc.label };
        }
      });

      setFormData({
        ...ruta,
        localidades: localidadesFormateadas,
        choferAsignado:
        ruta.choferAsignado &&
        typeof ruta.choferAsignado === "object" &&
        ruta.choferAsignado._id
          ? ruta.choferAsignado._id
          : typeof ruta.choferAsignado === "string"
          ? ruta.choferAsignado
          : "",
      
        vehiculoAsignado:
          ruta.vehiculoAsignado && typeof ruta.vehiculoAsignado === "object"
            ? ruta.vehiculoAsignado._id
            : ruta.vehiculoAsignado || "",
      });
    }
  }, [ruta, localidadesDisponibles]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleLocalidadesChange = (selected) => {
    setFormData({ ...formData, localidades: selected });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const localidadesSoloIDs = formData.localidades.map((loc) =>
      typeof loc === "string" ? loc : loc.value
    );

    const url = ruta ? apiSistema(`/api/rutas/${ruta._id}`) : apiSistema("/api/rutas");
    const method = ruta ? "PATCH" : "POST";

    const body = {
      ...formData,
      choferAsignado: formData.choferAsignado || null,
      vehiculoAsignado: formData.vehiculoAsignado || null,
      localidades: localidadesSoloIDs,
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });


      if (res.ok) {
        mostrarAlerta(ruta ? "Ruta actualizada" : "Ruta creada", "success");
        onClose();
        recargar();
      } else {
        const data = await res.json();
        mostrarAlerta(data.error || "Error al guardar la ruta", "danger");
      }
    } catch (error) {
      console.error("Error al guardar ruta:", error);
      mostrarAlerta("Error de conexión", "danger");
    }
  };

  const opcionesLocalidades = localidadesDisponibles.map((l) => ({
    value: l._id,
    label: l.nombre,
  }));

  return (
    <>
      <style>{`
        .modal-body {
          font-family: 'Montserrat', sans-serif;
        }

        .form-control,
        .form-select {
          border-radius: 10px;
          border: 1px solid #dee2e6;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
          transition: all 0.2s ease-in-out;
        }

        .form-control:focus,
        .form-select:focus {
          border-color: #f1c40f;
          box-shadow: 0 0 0 0.2rem rgba(241, 196, 15, 0.25);
        }

        .btn-soft {
          border: none;
          border-radius: 50px;
          padding: 8px 20px;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.2s ease;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
        }

        .btn-soft:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .btn-soft:focus,
        .btn-soft:active,
        .btn-soft:focus-visible {
          background-color: inherit !important;
          color: inherit !important;
          box-shadow: 0 0 0 0.2rem rgba(241, 196, 15, 0.3) !important;
          outline: none !important;
          border-color: transparent !important;
        }
      `}</style>

      <Modal show onHide={onClose} backdrop="static" centered>
      <Modal.Header closeButton className="modal-header-sda">
          <Modal.Title className="modal-title-sda">{ruta ? "Editar Ruta" : "Agregar Ruta"}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Código</Form.Label>
              <Form.Control
                name="codigo"
                value={formData.codigo}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Hora de Salida</Form.Label>
              <Form.Control
                name="horaSalida"
                value={formData.horaSalida}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Frecuencia</Form.Label>
              <Form.Control
                name="frecuencia"
                value={formData.frecuencia}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Localidades</Form.Label>
              <Select
                isMulti
                options={opcionesLocalidades}
                value={formData.localidades}
                onChange={handleLocalidadesChange}
                placeholder="Escribí para buscar localidades..."
                className="basic-multi-select"
                classNamePrefix="select"
              />
              <Form.Text className="text-muted">
                Podés escribir para buscar una localidad por nombre.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Chofer asignado (opcional)</Form.Label>
              <Form.Select
                name="choferAsignado"
                value={formData.choferAsignado || ""}
                onChange={handleChange}
              >
                <option value="">Sin asignar</option>
                {Array.isArray(choferes) &&
                  choferes.map((c) => {
                    const nombreChofer = c.usuario?.nombre || "Sin nombre";
                    return (
                      <option key={c._id} value={c._id}>
                        {nombreChofer}
                      </option>
                    );
                  })}

              </Form.Select>

            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Vehículo asignado (opcional)</Form.Label>
              <Form.Select
                name="vehiculoAsignado"
                value={formData.vehiculoAsignado || ""}
                onChange={handleChange}
              >
                <option value="">Sin asignar</option>
                {vehiculos.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.patente}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button
                className="btn-soft me-2"
                style={{ backgroundColor: "#f0f0f0", color: "#6b7280" }}
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="btn-soft"
                style={{ backgroundColor: "#fff8dc", color: "#8b6f00" }}
              >
                {ruta ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default FormularioRuta;
