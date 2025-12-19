import React, { useEffect, useState } from "react";
import { Modal, TextInput, Button, Group, Stack } from "@mantine/core";
import { mostrarAlerta } from "../../../../core/utils/alertaGlobal.jsx";

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
      mostrarAlerta("⚠️ Por favor, completá todos los campos.", "warning");
      return;
    }

    const datos = {
      ...formData,
      _id: localidad?._id || undefined,
    };

    guardar(datos);
    // Note: Parent component handles closing, but we can reset form here if needed.
  };


  return (
    <Modal opened={show} onClose={handleClose} title={localidad ? "Editar Localidad" : "Nueva Localidad"} centered>
      <form onSubmit={handleSubmit}>
        <Stack>
          <TextInput
            label="Nombre"
            placeholder="Ej: Buenos Aires"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
          />
          <TextInput
            label="Frecuencia"
            placeholder="Ej: Lunes y Jueves"
            name="frecuencia"
            value={formData.frecuencia}
            onChange={handleChange}
            required
          />
          <TextInput
            label="Horarios"
            placeholder="Ej: 08:00 - 18:00"
            name="horarios"
            value={formData.horarios}
            onChange={handleChange}
            required
          />
          <TextInput
            label="Código Postal"
            placeholder="Ej: 1425"
            name="codigoPostal"
            type="number"
            value={formData.codigoPostal}
            onChange={handleChange}
            required
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleClose}>Cancelar</Button>
            <Button type="submit" color="cyan">Guardar</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default FormularioLocalidad;
