import { modals } from '@mantine/modals';
import { Text } from '@mantine/core';
import React from 'react';

// Promise wrapper to make it identical API to SweetAlert
export const confirmarAccion = (
  titulo = "¿Estás seguro?",
  texto = "Esta acción no se puede deshacer",
  tipo = "warning",
  opciones = {}
) => {
  return new Promise((resolve) => {

    // Config colors based on type
    // Config colors based on type
    let confirmColor = 'cyan';
    if (tipo === 'danger') confirmColor = 'red';
    if (tipo === 'success') confirmColor = 'green';

    modals.openConfirmModal({
      title: titulo,
      children: (
        <Text size="sm">
          {texto}
        </Text>
      ),
      labels: {
        confirm: optionsConfirmLabel(tipo, opciones.textoConfirmar),
        cancel: opciones.textoCancelar || 'Cancelar'
      },
      confirmProps: { color: confirmColor },
      onCancel: () => resolve(false),
      onConfirm: () => resolve(true),
      centered: true
    });
  });
};

function optionsConfirmLabel(tipo, custom) {
  if (custom) return custom;
  if (tipo === 'danger') return 'Sí, eliminar';
  return 'Confirmar';
}
