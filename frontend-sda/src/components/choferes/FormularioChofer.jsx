import React from "react";
import { Modal, Button, TextInput, Select, Stack, Group, Title, Divider } from "@mantine/core";
import { Search } from "lucide-react";

const FormularioChofer = ({
  mostrar,
  onHide,
  busqueda,
  handleBuscarUsuario,
  usuariosFiltrados,
  usuarioSeleccionado,
  handleSeleccionUsuario,
  formulario,
  handleFormularioChange,
  handleCrearChofer,
  handleActualizarChofer,
  handleUsuarioChange, // nuevo handler para modificar datos base
  modoEdicion = false,
}) => {

  // Adapt handlers to Mantine signature (value, name) if needed, 
  // but ChoferesAdmin passed specific wrappers. Let's use them carefully.

  console.log("FormularioChofer rendered. Mostrar:", mostrar);
  return (
    <Modal
      opened={mostrar}
      onClose={onHide}
      title={modoEdicion ? "Editar Chofer" : "Agregar Chofer"}
      size="lg"
      centered
    >
      <Stack spacing="md">
        {!modoEdicion && (
          <>
            {!usuarioSeleccionado && (
              <TextInput
                label="Buscar usuario por nombre o email"
                placeholder="Buscar..."
                leftSection={<Search size={16} />}
                value={busqueda}
                onChange={handleBuscarUsuario}
              />
            )}

            <Select
              label="Seleccionar usuario"
              placeholder="-- Seleccione --"
              onChange={(val) => handleSeleccionUsuario(val)}
              value={usuarioSeleccionado?._id || null}
              data={usuariosFiltrados?.map((u) => ({
                value: u._id,
                label: `${u.nombre} (${u.email}) - Rol: ${u.rol}`
              })) || []}
              searchable
              nothingFoundMessage="No se encontraron usuarios"
              allowDeselect={false}
            />
          </>
        )}

        {(modoEdicion || usuarioSeleccionado) && (
          <>
            <Divider my="xs" label="Datos del Usuario" labelPosition="center" />

            <Group grow>
              <TextInput
                label="Nombre"
                name="nombre"
                value={usuarioSeleccionado?.nombre || ""}
                onChange={handleUsuarioChange}
              />
              <TextInput
                label="DNI"
                name="dni"
                value={usuarioSeleccionado?.dni || ""}
                onChange={handleUsuarioChange}
              />
            </Group>

            <Group grow>
              <TextInput
                label="Teléfono"
                name="telefono"
                value={usuarioSeleccionado?.telefono || ""}
                onChange={handleUsuarioChange}
              />
              <TextInput
                label="Email"
                value={usuarioSeleccionado?.email || ""}
                disabled
              />
            </Group>

            <TextInput
              label="Dirección"
              name="direccion"
              value={usuarioSeleccionado?.direccion || ""}
              onChange={handleUsuarioChange}
            />

            <Group grow>
              <TextInput
                label="Localidad"
                name="localidad"
                value={usuarioSeleccionado?.localidad || ""}
                onChange={handleUsuarioChange}
              />
              <TextInput
                label="Provincia"
                name="provincia"
                value={usuarioSeleccionado?.provincia || ""}
                onChange={handleUsuarioChange}
              />
            </Group>

            <Divider my="xs" label="Datos del Chofer" labelPosition="center" />

            <Select
              label="Tipo de contratación"
              name="tipoVinculo"
              value={formulario.tipoVinculo}
              onChange={(val) => handleFormularioChange("tipoVinculo", val)}
              data={[
                { value: "contratado", label: "Contratado" },
                { value: "relacionDependencia", label: "Relación de dependencia" }
              ]}
              allowDeselect={false}
            />
          </>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onHide}>Cancelar</Button>
          <Button
            color="cyan"
            onClick={modoEdicion ? handleActualizarChofer : handleCrearChofer}
            disabled={!formulario.tipoVinculo || (!usuarioSeleccionado)}
          >
            {modoEdicion ? "Guardar cambios" : "Crear chofer"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default FormularioChofer;
