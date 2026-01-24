import React, { useState, useEffect } from "react";
import { Modal, Button, TextInput, Select, NumberInput, Stack, Group, SimpleGrid, Text, Tabs, ActionIcon, Tooltip, Badge, Paper, Divider, Box, ThemeIcon } from "@mantine/core";
import { YearPickerInput } from "@mantine/dates";
import { Dropzone, PDF_MIME_TYPE, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { apiSistema, apiEstaticos } from "../../../../core/api/apiSistema";
import { mostrarAlerta } from "../../../../core/utils/alertaGlobal.jsx";
import { IconUpload, IconTrash, IconCheck, IconX } from "@tabler/icons-react";
import dayjs from "dayjs";
import axios from "axios";

const FormularioVehiculo = ({ onClose, vehiculo, recargar }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [formData, setFormData] = useState({
    patente: "",
    marca: "",
    modelo: "",
    capacidadKg: "",
    estado: "disponible",
    tipoPropiedad: "externo",
    añoModelo: null,
    numeroChasis: "",
    tipoCombustible: "Diesel",
    documentos: []
  });

  useEffect(() => {
    if (vehiculo) {
      setFormData({
        ...vehiculo,
        añoModelo: vehiculo.añoModelo ? new Date(vehiculo.añoModelo, 0, 1) : null,
        documentos: vehiculo.documentos || []
      });
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

    // Preparar data para enviar (convertir Date de año a Number)
    const dataToSend = {
      ...formData,
      añoModelo: formData.añoModelo ? dayjs(formData.añoModelo).year() : undefined
    };

    const url = vehiculo
      ? apiSistema(`/vehiculos/${vehiculo._id}`)
      : apiSistema("/vehiculos");

    const method = vehiculo ? "PATCH" : "POST";

    try {
      const res = await axios({
        url,
        method,
        data: dataToSend
      });

      if (res.status === 200 || res.status === 201) {
        mostrarAlerta(vehiculo ? "✅ Vehículo actualizado" : "✅ Vehículo creado", "success");
        recargar();
        onClose();
      }
    } catch (error) {
      console.error("Error al guardar vehículo:", error);
      const msg = error.response?.data?.error || "Error al guardar vehículo";
      mostrarAlerta(`❌ ${msg}`, "danger");
    }
  };

  const handleUploadDoc = async (files) => {
    if (!vehiculo) {
      mostrarAlerta("Debe crear el vehículo antes de subir documentos", "info");
      return;
    }

    setLoadingDoc(true);
    const file = files[0];
    const data = new FormData();
    data.append("archivo", file);
    data.append("nombreDocumento", file.name);

    try {
      const res = await axios.post(apiSistema(`/vehiculos/${vehiculo._id}/documentos`), data, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setFormData(prev => ({
        ...prev,
        documentos: res.data.vehiculo.documentos
      }));
      recargar(); // Actualizar la lista en el padre para que persista al cerrar/abrir
      mostrarAlerta("Documento subido con éxito", "success");
    } catch (error) {
      mostrarAlerta("Error al subir documento", "danger");
    } finally {
      setLoadingDoc(false);
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm("¿Seguro que desea eliminar este documento?")) return;

    try {
      const res = await axios.delete(apiSistema(`/vehiculos/${vehiculo._id}/documentos/${docId}`));
      setFormData(prev => ({
        ...prev,
        documentos: res.data.vehiculo.documentos
      }));
      recargar(); // Actualizar la lista en el padre
      mostrarAlerta("Documento eliminado", "success");
    } catch (error) {
      mostrarAlerta("Error al eliminar documento", "danger");
    }
  };

  // Helper para construir URL de archivos
  const getFileUrl = (path) => {
    if (path.startsWith('http')) return path;
    return apiEstaticos(`/${path}`);
  };

  return (
    <Modal
      opened={true}
      onClose={onClose}
      title={
        <Group gap="xs">
          <Text fw={800} size="xl" style={{ letterSpacing: '-0.5px' }}>
            {vehiculo ? "Gestionar Vehículo" : "Registrar Nuevo Vehículo"}
          </Text>
        </Group>
      }
      centered
      size="xl"
      radius="lg"
      overlayProps={{ blur: 6, backgroundOpacity: 0.3 }}
      styles={{
        header: { borderBottom: '1px solid var(--mantine-color-gray-2)', paddingBottom: '15px' },
        content: { overflow: 'hidden' }
      }}
    >
      <Tabs value={activeTab} onChange={setActiveTab} color="cyan" variant="pills" radius="md">
        <Tabs.List mb="lg" grow>
          <Tabs.Tab value="general">Datos Generales</Tabs.Tab>
          <Tabs.Tab value="docs" disabled={!vehiculo}>Documentación</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="general">
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <Paper withBorder p="md" radius="md" bg="gray.0">
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  <TextInput
                    label="Patente"
                    name="patente"
                    value={formData.patente}
                    onChange={handleInputChange}
                    required
                    placeholder="Ej: AA123BB"
                    variant="filled"
                    fw={700}
                  />
                  <YearPickerInput
                    label="Año del Modelo"
                    placeholder="Seleccionar año"
                    value={formData.añoModelo}
                    onChange={(val) => handleChange("añoModelo", val)}
                    variant="filled"
                    clearable
                    maxDate={new Date()}
                  />
                  <TextInput
                    label="Marca"
                    name="marca"
                    value={formData.marca}
                    onChange={handleInputChange}
                    required
                    placeholder="Ej: Toyota"
                  />
                  <TextInput
                    label="Modelo"
                    name="modelo"
                    value={formData.modelo}
                    onChange={handleInputChange}
                    required
                    placeholder="Ej: Hilux"
                  />
                  <TextInput
                    label="Número de Chasis"
                    name="numeroChasis"
                    value={formData.numeroChasis}
                    onChange={handleInputChange}
                    placeholder="Ej: 9BWCB42P..."
                  />
                  <NumberInput
                    label="Capacidad de Carga"
                    value={formData.capacidadKg}
                    onChange={(val) => handleChange("capacidadKg", val)}
                    min={0}
                    step={100}
                    required
                    suffix=" kg"
                  />
                  <Select
                    label="Tipo de Combustible"
                    placeholder="Seleccionar..."
                    value={formData.tipoCombustible}
                    onChange={(val) => handleChange("tipoCombustible", val)}
                    data={[
                      { value: "Diesel", label: "Diesel" },
                      { value: "Nafta", label: "Nafta" },
                      { value: "GNC", label: "GNC" }
                    ]}
                    required
                  />
                </SimpleGrid>
              </Paper>

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <Select
                  label="Estado Operativo"
                  value={formData.estado}
                  onChange={(val) => handleChange("estado", val)}
                  data={[
                    { value: "disponible", label: "Disponible" },
                    { value: "en mantenimiento", label: "En Mantenimiento" },
                    { value: "fuera de servicio", label: "Fuera de Servicio" }
                  ]}
                  allowDeselect={false}
                />
                <Select
                  label="Propiedad"
                  value={formData.tipoPropiedad}
                  onChange={(val) => handleChange("tipoPropiedad", val)}
                  data={[
                    { value: "propio", label: "Propio (SDA)" },
                    { value: "externo", label: "Tercero / Externo" }
                  ]}
                  allowDeselect={false}
                />
              </SimpleGrid>

              <Group justify="flex-end" mt="xl">
                <Button variant="subtle" color="gray" onClick={onClose}>Cancelar</Button>
                <Button
                  type="submit"
                  size="md"
                  px="xl"
                  variant="gradient"
                  gradient={{ from: 'cyan', to: 'blue' }}
                  radius="md"
                  leftSection={<IconCheck size={20} />}
                >
                  {vehiculo ? "Actualizar Datos" : "Crear Vehículo"}
                </Button>
              </Group>
            </Stack>
          </form>
        </Tabs.Panel>

        <Tabs.Panel value="docs">
          <Stack gap="md">
            <Paper withBorder radius="lg" p="xl" bg="cyan.0" style={{ borderStyle: 'dashed', borderWidth: 2, borderColor: 'var(--mantine-color-cyan-3)' }}>
              <Dropzone
                onDrop={handleUploadDoc}
                loading={loadingDoc}
                maxSize={5 * 1024 ** 2}
                accept={[...PDF_MIME_TYPE, ...IMAGE_MIME_TYPE]}
                radius="md"
                styles={{ inner: { padding: '20px' } }}
              >
                <Stack align="center" gap="sm">
                  <div style={{ textAlign: 'center' }}>
                    <Text size="lg" fw={800} c="cyan.9">
                      Subir Documentación del Vehículo
                    </Text>
                    <Text size="sm" c="dimmed" mt={4} maw={400} mx="auto">
                      Arrastrá la <b>Tarjeta Verde</b>, Título o póliza de seguro.
                      Aceptamos PDF e imágenes (máx 5MB).
                    </Text>
                  </div>

                  <Button variant="light" color="cyan" size="sm" mt="sm">
                    Seleccionar Archivo
                  </Button>
                </Stack>
              </Dropzone>
            </Paper>

            <Divider label={<Text fw={700} size="xs" c="dimmed">DOCUMENTOS ADJUNTOS</Text>} labelPosition="center" />

            <Box mih={200}>
              {formData.documentos?.length > 0 ? (
                <Stack gap="xs">
                  {formData.documentos.map((doc, idx) => (
                    <Paper key={idx} withBorder p="xs" radius="sm">
                      <Group justify="space-between" wrap="nowrap">
                        <Group wrap="nowrap">
                          <div style={{ overflow: 'hidden' }}>
                            <Text size="sm" fw={600} truncate>{doc.nombre}</Text>
                            <Text size="xs" c="dimmed">{dayjs(doc.fechaSubida).format('DD/MM/YYYY HH:mm')}</Text>
                          </div>
                        </Group>
                        <Group gap={5}>
                          <Button
                            variant="light"
                            size="compact-xs"
                            component="a"
                            href={getFileUrl(doc.path)}
                            target="_blank"
                          >
                            Ver
                          </Button>
                          <ActionIcon variant="subtle" color="red" onClick={() => handleDeleteDoc(doc._id)}>
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <Text ta="center" c="dimmed" size="sm" mt="xl">
                  No hay documentos adjuntos todavía.
                </Text>
              )}
            </Box>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
};

export default FormularioVehiculo;
