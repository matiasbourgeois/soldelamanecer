import React, { useEffect } from "react";
import { notifications } from "@mantine/notifications";

const AlertaSistema = ({ show, mensaje, tipo = "warning", onClose }) => {
  useEffect(() => {
    if (show && mensaje) {
      notifications.show({
        title: "Aviso del sistema",
        message: mensaje,
        color: tipo === "danger" || tipo === "error" ? "red" : (tipo === "warning" ? "yellow" : "cyan"),
        onClose: onClose,
        autoClose: 4000,
      });
    }
  }, [show, mensaje, tipo, onClose]);

  return null; // El componente ya no renderiza nada, solo dispara la acción
};

export default AlertaSistema;
