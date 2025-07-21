// src/utils/alertaGlobal.js

// Función que será redefinida en tiempo de ejecución por el frontend
export let mostrarAlerta = (mensaje = "", tipo) => {
  // Si no se pasa tipo, intentar detectarlo automáticamente
  if (!tipo) {
    const msg = mensaje.toLowerCase();

    if (
      msg.includes("error") ||
      msg.includes("falló") ||
      msg.includes("no se pudo") ||
      msg.includes("rechazado")
    ) {
      tipo = "danger";
    } else if (
      msg.includes("correctamente") ||
      msg.includes("exitosamente") ||
      msg.includes("guardado") ||
      msg.includes("creado") ||
      msg.includes("eliminado")
    ) {
      tipo = "success";
    } else {
      tipo = "warning"; // default si no detecta nada
    }
  }

  console.warn("⚠️ mostrarAlerta se llamó antes de estar listo:", mensaje);

};

// Esta función se usará para conectar el sistema visual desde App.jsx
export const setMostrarAlertaCustom = (fn) => {
  mostrarAlerta = fn;
};
