import React, { useEffect, useState } from "react";
import { Modal, Button, TextInput, Select, MultiSelect, Group, Stack, LoadingOverlay } from "@mantine/core";
import { apiSistema } from "../../../../core/api/apiSistema";
import { mostrarAlerta } from "../../../../core/utils/alertaGlobal.jsx";

const FormularioRuta = ({ onClose, ruta, recargar }) => {
  // Mantine MultiSelect works with string arrays for values.
  const [formData, setFormData] = useState({
    codigo: "",
    horaSalida: "",
    frecuencia: "",
    descripcion: "",
    localidades: [], // IDs array
    choferAsignado: "",
    vehiculoAsignado: "",
  });

  const [localidadesDisponibles, setLocalidadesDisponibles] = useState([]);
  const [choferes, setChoferes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const [lRes, cRes, vRes] = await Promise.all([
          fetch(apiSistema("/api/localidades")),
          fetch(apiSistema("/api/choferes/solo-nombres")),
          fetch(apiSistema("/api/vehiculos")),
        ]);

        const localidadesData = await lRes.json();
        setLocalidadesDisponibles(localidadesData);

        setChoferes(await cRes.json());
        setVehiculos(await vRes.json());
      } catch (error) {
        console.error("Error al cargar datos relacionados:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDatos();
  }, []);

  useEffect(() => {
    if (ruta) {
      // Map existing localities to just IDs for Mantine MultiSelect
      const localidadesIDs = ruta.localidades.map((loc) => {
        if (typeof loc === 'string') return loc;
        if (loc._id) return loc._id;
        return loc.value || ""; // Fallback
      });

      setFormData({
        ...ruta,
        localidades: localidadesIDs,
        choferAsignado:
          ruta.choferAsignado &&
            typeof ruta.choferAsignado === "object" &&
            ruta.choferAsignado._id
            ? ruta.choferAsignado._id
            : typeof ruta.choferAsignado === "string"
              ? ruta.choferAsignado
              : "",

        vehiculoAsignado:
          ruta.vehiculoAsignado && typeof ruta.vehiculoAsignado === "object"
            ? ruta.vehiculoAsignado._id
            : ruta.vehiculoAsignado || "",
      });
    }
  }, [ruta, localidadesDisponibles]);


  const handleChange = (e) => {
    // For standard inputs
    let { name, value } = e.target;
    if (name === "codigo") value = value.toUpperCase();
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handlers for Mantine custom inputs (Select/MultiSelect) returns value directly
  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const url = ruta ? apiSistema(`/api/rutas/${ruta._id}`) : apiSistema("/api/rutas");
    const method = ruta ? "PATCH" : "POST";

    const body = {
      ...formData,
      choferAsignado: formData.choferAsignado || null,
      vehiculoAsignado: formData.vehiculoAsignado || null,
      // localidades is already an array of IDs
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });


      if (res.ok) {
        mostrarAlerta(ruta ? "✅ Ruta actualizada" : "✅ Ruta creada", "success");
        onClose();
        recargar();
      } else {
        const data = await res.json();
        mostrarAlerta(data.error || "❌ Error al guardar la ruta", "danger");
      }
    } catch (error) {
      console.error("Error al guardar ruta:", error);
      mostrarAlerta("❌ Error de conexión", "danger");
    }
  };

  // Prepare data for Mantine Selects
  const opcionesLocalidades = localidadesDisponibles
    .filter((l) => l.activa || (ruta && ruta.localidades.some(rLoc => {
      // Handle potential different formats of ruta.localidades items (string ID or object)
      const rId = typeof rLoc === 'string' ? rLoc : rLoc._id;
      return rId === l._id;
    })))
    .map((l) => ({
      value: l._id,
      label: l.nombre,
    }));

  const opcionesChoferes = Array.isArray(choferes) ? choferes.map((c) => ({
    value: c._id,
    label: c.usuario?.nombre ? `${c.usuario.nombre} ${c.usuario.apellido || ""}` : "Sin nombre"
  })) : [];

  const opcionesVehiculos = vehiculos.map((v) => ({
    value: v._id,
    label: `${v.patente} - ${v.modelo}`
  }));

  return (
    <Modal opened={true} onClose={onClose} title={ruta ? "Editar Ruta" : "Agregar Ruta"} size="lg" centered>
      <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
      <form onSubmit={handleSubmit}>
        <Stack>
          <TextInput
            label="Código de Ruta"
            placeholder="Ej: R-001"
            name="codigo"
            value={formData.codigo}
            onChange={handleChange}
            required
          />

          <Group grow>
            <TextInput
              label="Hora de Salida"
              placeholder="Ej: 08:30"
              name="horaSalida"
              value={formData.horaSalida}
              onChange={handleChange}
              required
            />
            <TextInput
              label="Frecuencia"
              placeholder="Ej: Lunes a Viernes"
              name="frecuencia"
              value={formData.frecuencia}
              onChange={handleChange}
              required
            />
          </Group>

          <TextInput
            label="Descripción"
            placeholder="Descripción breve del recorrido..."
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
          />

          <MultiSelect
            label="Localidades"
            placeholder="Seleccionar localidades..."
            data={opcionesLocalidades}
            value={formData.localidades}
            onChange={(val) => handleSelectChange("localidades", val)}
            searchable
            clearable
            maxDropdownHeight={200}
          />

          <Group grow>
            <Select
              label="Chofer Asignado"
              placeholder="Seleccionar chofer (opcional)"
              data={opcionesChoferes}
              value={formData.choferAsignado}
              onChange={(val) => handleSelectChange("choferAsignado", val)}
              searchable
              clearable
            />
            <Select
              label="Vehículo Asignado"
              placeholder="Seleccionar vehículo (opcional)"
              data={opcionesVehiculos}
              value={formData.vehiculoAsignado}
              onChange={(val) => handleSelectChange("vehiculoAsignado", val)}
              searchable
              clearable
            />
          </Group>

          <Group justify="flex-end" mt="lg">
            <Button variant="default" onClick={onClose}>Cancelar</Button>
            <Button type="submit" color="cyan">
              {ruta ? "Actualizar" : "Crear"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default FormularioRuta;
