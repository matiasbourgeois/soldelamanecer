// components/rutas/ModalLocalidadesRuta.jsx
import React from "react";
import { Modal, List, ThemeIcon, Text, Button, Group } from "@mantine/core";
import { MapPin } from "lucide-react";

const ModalLocalidadesRuta = ({ mostrar, onClose, localidades }) => {
  return (
    <Modal
      opened={mostrar}
      onClose={onClose}
      title={<Text fw={700}>Localidades de la Ruta</Text>}
      centered
    >
      {localidades?.length > 0 ? (
        <List spacing="sm" icon={
          <ThemeIcon color="cyan" size={20} radius="xl">
            <MapPin size={12} />
          </ThemeIcon>
        }>
          {localidades.map((loc) => (
            <List.Item key={loc._id}>
              {loc.nombre}
            </List.Item>
          ))}
        </List>
      ) : (
        <Text c="dimmed" size="sm" ta="center">No hay localidades asociadas a esta ruta.</Text>
      )}

      <Group justify="flex-end" mt="md">
        <Button variant="outline" color="gray" onClick={onClose}>
          Cerrar
        </Button>
      </Group>
    </Modal>
  );
};

export default ModalLocalidadesRuta;
