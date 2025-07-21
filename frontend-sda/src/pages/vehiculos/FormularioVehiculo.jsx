import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { apiSistema } from "../../utils/api";
import { mostrarAlerta } from "../../utils/alertaGlobal";


const FormularioVehiculo = ({ onClose, vehiculo, recargar }) => {
  const [formData, setFormData] = useState({
    patente: "",
    marca: "",
    modelo: "",
    capacidadKg: "",
    estado: "disponible",
    tipoPropiedad: "propio",
  });

  useEffect(() => {
    if (vehiculo) {
      setFormData(vehiculo);
    }
  }, [vehiculo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = vehiculo
      ? apiSistema(`/api/vehiculos/${vehiculo._id}`)
      : apiSistema("/api/vehiculos");

    const method = vehiculo ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        mostrarAlerta(vehiculo ? "Vehículo actualizado" : "Vehículo creado", "success");
        onClose();
        recargar();
      } else {
        const data = await res.json();
        mostrarAlerta(data.error || "Error al guardar vehículo", "danger");
      }
    } catch (error) {
      console.error("Error al guardar vehículo:", error);
      mostrarAlerta("Error de conexión", "danger");
    }
  };

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
          <Modal.Title className="modal-title-sda">
            {vehiculo ? "Editar Vehículo" : "Agregar Vehículo"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="patente" className="mb-3">
              <Form.Label>Patente</Form.Label>
              <Form.Control
                type="text"
                name="patente"
                value={formData.patente}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group controlId="marca" className="mb-3">
              <Form.Label>Marca</Form.Label>
              <Form.Control
                type="text"
                name="marca"
                value={formData.marca}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group controlId="modelo" className="mb-3">
              <Form.Label>Modelo</Form.Label>
              <Form.Control
                type="text"
                name="modelo"
                value={formData.modelo}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group controlId="capacidadKg" className="mb-3">
              <Form.Label>Capacidad (kg)</Form.Label>
              <Form.Control
                type="number"
                name="capacidadKg"
                value={formData.capacidadKg}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group controlId="estado" className="mb-3">
              <Form.Label>Estado</Form.Label>
              <Form.Select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
              >
                <option value="disponible">Disponible</option>
                <option value="en mantenimiento">En Mantenimiento</option>
                <option value="fuera de servicio">Fuera de Servicio</option>
              </Form.Select>
            </Form.Group>

            <Form.Group controlId="tipoPropiedad" className="mb-4">
              <Form.Label>Tipo de Propiedad</Form.Label>
              <Form.Select
                name="tipoPropiedad"
                value={formData.tipoPropiedad}
                onChange={handleChange}
              >
                <option value="propio">Propio</option>
                <option value="externo">Externo</option>
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
                {vehiculo ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default FormularioVehiculo;
