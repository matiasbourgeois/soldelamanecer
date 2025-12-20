import React from "react";
import { Toast, ToastContainer } from "react-bootstrap";
import "@styles/alertaSistema.css";

const AlertaSistema = ({ show, mensaje, tipo = "warning", onClose }) => {
  return (
    <ToastContainer position="top-end" className="p-3 alerta-toast-container">
      <Toast bg={tipo} show={show} onClose={onClose} delay={4000} autohide>
        <Toast.Header closeButton={false}>
          <strong className="me-auto">Aviso del sistema</strong>
        </Toast.Header>
        <Toast.Body>{mensaje}</Toast.Body>
      </Toast>
    </ToastContainer>
  );
};

export default AlertaSistema;
