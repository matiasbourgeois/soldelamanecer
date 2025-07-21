// components/rutas/ModalLocalidadesRuta.jsx
import React from "react";
import { Modal, Button, ListGroup } from "react-bootstrap";
import "../../styles/botonesSistema.css";


const ModalLocalidadesRuta = ({ mostrar, onClose, localidades }) => {
  return (
    <Modal show={mostrar} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton className="modal-header-sda">
        <Modal.Title className="modal-title-sda">Localidades de la Ruta</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {localidades?.length > 0 ? (
          <ListGroup>
            {localidades.map((loc) => (
              <ListGroup.Item key={loc._id}>{loc.nombre}</ListGroup.Item>
            ))}
          </ListGroup>
        ) : (
          <p>No hay localidades asociadas a esta ruta.</p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <button className="btn-sda-principal" onClick={onClose}>
          Cerrar
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalLocalidadesRuta;
