import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

/**
 * Confirmación visual adaptada al tipo de acción con estilos propios.
 * @param {string} titulo
 * @param {string} texto
 * @param {string} tipo - "success" | "warning" | "danger"
 * @param {object} opciones - { textoConfirmar?, textoCancelar? }
 * @returns {Promise<boolean>}
 */
export const confirmarAccion = async (
  titulo = "¿Estás seguro?",
  texto = "Esta acción no se puede deshacer",
  tipo = "warning",
  opciones = {}
) => {
  const iconMap = {
    success: "success",
    warning: "warning",
    danger: "error",
  };

  const textoConfirmarDefault = {
    success: "Sí, confirmar",
    warning: "Sí, continuar",
    danger: "Sí, eliminar",
  };

  // Clases de botón según el tipo
  const claseConfirmacion = {
    success: "btn-soft-confirmar",
    warning: "btn-soft-warning",
    danger: "btn-soft-eliminar",
  };

  const textoConfirmar =
    opciones.textoConfirmar || textoConfirmarDefault[tipo] || "Confirmar";
  const textoCancelar = opciones.textoCancelar || "Cancelar";

  const resultado = await Swal.fire({
    title: titulo,
    text: texto,
    icon: iconMap[tipo] || "question",
    showCancelButton: true,
    confirmButtonText: textoConfirmar,
    cancelButtonText: textoCancelar,
    reverseButtons: true,
    customClass: {
      confirmButton: claseConfirmacion[tipo] || "btn-soft-confirmar",
      cancelButton: "btn-soft-cancelar",
      popup: "swal2-border-radius",
    },
    buttonsStyling: false, // ¡IMPORTANTE! Para que use nuestras clases CSS
  });

  return resultado.isConfirmed;
};
