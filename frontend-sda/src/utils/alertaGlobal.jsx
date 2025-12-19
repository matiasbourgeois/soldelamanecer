import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconAlertTriangle } from '@tabler/icons-react'; // Or 'lucide-react' if tabler missing
// We know Tabler is an issue, so using Lucide to be safe
import { Check, X, AlertTriangle } from 'lucide-react';
import React from 'react';

// Map types to Notification props
const getNotificationProps = (tipo) => {
  switch (tipo) {
    case 'success':
      return { color: 'green', icon: <Check size={18} /> };
    case 'danger':
    case 'error':
      return { color: 'red', icon: <X size={18} /> };
    case 'warning':
    default:
      return { color: 'yellow', icon: <AlertTriangle size={18} /> };
  }
};

export let mostrarAlerta = (mensaje = "", tipo) => {
  // Auto-detect type if missing
  if (!tipo) {
    const msg = mensaje.toLowerCase();
    if (msg.includes("error") || msg.includes("falló") || msg.includes("rechazado")) {
      tipo = "danger";
    } else if (msg.includes("correctamente") || msg.includes("exito") || msg.includes("guardado") || msg.includes("eliminado")) {
      tipo = "success";
    } else {
      tipo = "warning";
    }
  }

  const props = getNotificationProps(tipo);

  notifications.show({
    title: tipo === 'danger' ? 'Error' : tipo === 'success' ? 'Éxito' : 'Atención',
    message: mensaje,
    color: props.color,
    icon: props.icon,
    autoClose: 4000,
    withBorder: true,
    style: { borderRadius: '8px' } // Rounded style
  });
};

// Compatibility for existing code
export const setMostrarAlertaCustom = (fn) => {
  // No-op or override if needed, but we are enforcing Mantine now.
  // We can leave this empty or redirect.
  // Since we are replacing the system, we don't need the old hook injection.
  console.log("Mantine Notifications system active.");
};
