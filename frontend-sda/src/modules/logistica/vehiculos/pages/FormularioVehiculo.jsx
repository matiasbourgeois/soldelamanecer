import React, { useState, useEffect } from "react";
import { Modal, Button, TextInput, Select, NumberInput, Stack, Group, SimpleGrid, Text } from "@mantine/core";
import { apiSistema } from "../../../../core/api/apiSistema";
import { mostrarAlerta } from "../../../../core/utils/alertaGlobal.jsx";

const FormularioVehiculo = ({ onClose, vehiculo, recargar }) => {
  const [formData, setFormData] = useState({
    patente: "",
    marca: "",
    modelo: "",
    capacidadKg: "",
    estado: "disponible",
    tipoPropiedad: "externo",
  });

  useEffect(() => {
    if (vehiculo) {
      setFormData(vehiculo);
    }
  }, [vehiculo]);

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleInputChange = (e) => {
    let { name, value } = e.target;
    if (name === "patente") value = value.toUpperCase();
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = vehiculo
      ? apiSistema(`/vehiculos/${vehiculo._id}`)
      : apiSistema("/vehiculos");

    const method = vehiculo ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        mostrarAlerta(vehiculo ? "✅ Vehículo actualizado" : "✅ Vehículo creado", "success");
        recargar();
        onClose();
      } else {
        const data = await res.json();
        mostrarAlerta(data.error || "❌ Error al guardar vehículo", "danger");
      }
    } catch (error) {
      console.error("Error al guardar vehículo:", error);
      mostrarAlerta("❌ Error de conexión", "danger");
    }
  };

  return (
    <Modal
      opened={true}
      onClose={onClose}
      title={
        <Text fw={700} size="lg" c="dark.4">
          {vehiculo ? "Editar Vehículo" : "Nuevo Vehículo"}
        </Text>
      }
      centered
      size="lg"
      radius="md"
      overlayProps={{ blur: 3, backgroundOpacity: 0.55 }}
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <TextInput
              label="Patente"
              name="patente"
              value={formData.patente}
              onChange={handleInputChange}
              required
              placeholder="Ej: AA123BB"
              variant="filled"
            />
            <TextInput
              label="Marca"
              name="marca"
              value={formData.marca}
              onChange={handleInputChange}
              required
              placeholder="Ej: Toyota"
              variant="filled"
            />
            <TextInput
              label="Modelo"
              name="modelo"
              value={formData.modelo}
              onChange={handleInputChange}
              required
              placeholder="Ej: Hilux"
              variant="filled"
            />
            <NumberInput
              label="Capacidad (kg)"
              value={formData.capacidadKg}
              onChange={(val) => handleChange("capacidadKg", val)}
              min={0}
              step={100}
              required
              variant="filled"
            />
            <Select
              label="Estado"
              value={formData.estado}
              onChange={(val) => handleChange("estado", val)}
              data={[
                { value: "disponible", label: "Disponible" },
                { value: "en mantenimiento", label: "En Mantenimiento" },
                { value: "fuera de servicio", label: "Fuera de Servicio" }
              ]}
              allowDeselect={false}
              variant="filled"
            />
            <Select
              label="Tipo de Propiedad"
              value={formData.tipoPropiedad}
              onChange={(val) => handleChange("tipoPropiedad", val)}
              data={[
                { value: "propio", label: "Propio" },
                { value: "externo", label: "Tercero" }
              ]}
              allowDeselect={false}
              variant="filled"
            />
          </SimpleGrid>

          <Group justify="flex-end" mt="lg">
            <Button variant="subtle" color="gray" onClick={onClose}>Cancelar</Button>
            <Button
              type="submit"
              variant="filled"
              color="cyan"
            >
              {vehiculo ? "Actualizar Vehículo" : "Crear Vehículo"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default FormularioVehiculo;
