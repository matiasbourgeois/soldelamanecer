import React, { useEffect, useState } from "react";
import { Modal, Form } from "react-bootstrap";
import "../../styles/formularioSistema.css";
import "../../styles/botonesSistema.css";
import { mostrarAlerta } from "../../utils/alertaGlobal";


const FormularioLocalidad = ({ show, handleClose, guardar, localidad }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    frecuencia: "",
    horarios: "",
    codigoPostal: "",
  });

  useEffect(() => {
    if (localidad) {
      setFormData({
        nombre: localidad.nombre || "",
        frecuencia: localidad.frecuencia || "",
        horarios: localidad.horarios || "",
        codigoPostal: localidad.codigoPostal || "",
      });
    } else {
      setFormData({
        nombre: "",
        frecuencia: "",
        horarios: "",
        codigoPostal: "",
      });
    }
  }, [localidad]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "codigoPostal" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.nombre || !formData.frecuencia || !formData.horarios || !formData.codigoPostal) {
      mostrarAlerta("Por favor, completá todos los campos.");
      return;
    }

    const datos = {
      ...formData,
      _id: localidad?._id || undefined,
    };

    guardar(datos);
    cerrarFormulario(); // Reinicia después de guardar
  };

  const cerrarFormulario = () => {
    setFormData({
      nombre: "",
      frecuencia: "",
      horarios: "",
      codigoPostal: "",
    });
    handleClose();
  };

  const esFormularioValido =
    formData.nombre && formData.frecuencia && formData.horarios && formData.codigoPostal;

  return (
    <Modal show={show} onHide={cerrarFormulario} centered>
      <Modal.Header closeButton className="modal-header-sda">
        <Modal.Title className="modal-title-sda">
          {localidad ? "Editar Localidad" : "Nueva Localidad"}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <label>Nombre</label>
            <input
              type="text"
              name="nombre"
              className="input-sistema"
              value={formData.nombre}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <label>Frecuencia</label>
            <input
              type="text"
              name="frecuencia"
              className="input-sistema"
              value={formData.frecuencia}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <label>Horarios</label>
            <input
              type="text"
              name="horarios"
              className="input-sistema"
              value={formData.horarios}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <label>Código Postal</label>
            <input
              type="number"
              name="codigoPostal"
              className="input-sistema"
              value={formData.codigoPostal}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <div className="d-flex justify-content-end">
            <button
              type="button"
              className="btn-soft-cancelar me-2"
              onClick={cerrarFormulario}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-soft-warning"
              disabled={!esFormularioValido}
            >
              Guardar
            </button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default FormularioLocalidad;
