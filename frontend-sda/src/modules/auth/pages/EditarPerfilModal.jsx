import React, { useState, useEffect, useContext } from "react";
import { Modal, TextInput, Button, Group, FileButton, Image, Text, Stack, Alert } from "@mantine/core";
import { IconUpload, IconDeviceFloppy, IconX, IconAlertTriangle } from "@tabler/icons-react";
import axios from "axios";
import AuthContext from "@core/context/AuthProvider";
import { apiUsuarios } from "@core/api/apiSistema";
import { mostrarAlerta } from "@core/utils/alertaGlobal";

const EditarPerfilModal = ({ show, handleClose, datosUsuario, onPerfilActualizado }) => {
  const { auth, setAuth } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    nombre: datosUsuario?.nombre || "",
    dni: datosUsuario?.dni || "",
    telefono: datosUsuario?.telefono || "",
    direccion: datosUsuario?.direccion || "",
    localidad: datosUsuario?.localidad || "",
    provincia: datosUsuario?.provincia || "",
  });

  const [foto, setFoto] = useState(null);
  const [archivoOriginal, setArchivoOriginal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (datosUsuario) {
      setFormData({
        nombre: datosUsuario.nombre || "",
        dni: datosUsuario.dni || "",
        telefono: datosUsuario.telefono || "",
        direccion: datosUsuario.direccion || "",
        localidad: datosUsuario.localidad || "",
        provincia: datosUsuario.provincia || "",
      });

      if (datosUsuario.fotoPerfil) {
        // Ensure correct URL construction
        setFoto(apiUsuarios(datosUsuario.fotoPerfil));
      } else {
        setFoto(null);
      }
    }
  }, [datosUsuario]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (file) => {
    if (file) {
      setArchivoOriginal(file);
      setFoto(URL.createObjectURL(file));
      setErrorMsg(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      let rutaFotoSubida = datosUsuario.fotoPerfil;
      const baseUrl = import.meta.env.VITE_API_USUARIOS; // Use explicit ENV for safety

      // 1. Upload photo if exists
      if (archivoOriginal) {
        const formDataFoto = new FormData();
        formDataFoto.append("foto", archivoOriginal);

        // Use direct URL construction to avoid helper ambiguity during complex uploads
        const uploadUrl = `${baseUrl}/api/usuarios/subir-foto`;

        const respuesta = await axios.post(
          uploadUrl,
          formDataFoto,
          {
            headers: {
              Authorization: `Bearer ${auth.token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (respuesta.data && respuesta.data.fotoPerfil) {
          rutaFotoSubida = respuesta.data.fotoPerfil;
        } else {
          throw new Error("El servidor no devolvió la ruta de la imagen.");
        }
      }

      // 2. Update Profile Data
      const datosCompletos = {
        ...formData,
        fotoPerfil: rutaFotoSubida,
      };

      const updateUrl = `${baseUrl}/api/usuarios/perfil-completo`;

      await axios.put(
        updateUrl,
        datosCompletos,
        {
          headers: { Authorization: `Bearer ${auth.token}` },
        }
      );

      // 3. Sync & Finish
      await onPerfilActualizado();

      // Context Update (Preserving Logic)
      if (setAuth) {
        setAuth((prevAuth) => ({
          ...prevAuth,
          fotoPerfil: rutaFotoSubida,
          nombre: formData.nombre
        }));
      }

      mostrarAlerta("Perfil actualizado con éxito", "success");
      handleClose();

    } catch (error) {
      console.error("❌ Error al actualizar perfil:", error);
      const msg = error.response?.data?.mensaje || error.message || "Error desconocido";
      setErrorMsg(`No se pudo actualizar: ${msg}`);
      mostrarAlerta("Error al actualizar perfil", "error");
    }
    setLoading(false);
  };

  return (
    <Modal
      opened={show}
      onClose={handleClose}
      centered
      title={<Text fw={700} size="lg" c="yellow.8">Editar Perfil</Text>}
      size="md"
      radius="md"
    >
      <form onSubmit={handleSubmit}>
        <Stack>
          {errorMsg && (
            <Alert icon={<IconAlertTriangle size={16} />} title="Error" color="red" radius="md">
              {errorMsg}
            </Alert>
          )}

          {/* Photo Upload Section */}
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <Image
                src={foto}
                w={100}
                h={100}
                radius={100}
                fallbackSrc="https://cdn-icons-png.flaticon.com/512/149/149071.png"
                style={{ border: '3px solid var(--mantine-color-yellow-4)', objectFit: 'cover' }}
              />
            </div>
            <div style={{ marginTop: 8 }}>
              <FileButton onChange={handleFileChange} accept="image/png,image/jpeg">
                {(props) => (
                  <Button
                    {...props}
                    variant="subtle"
                    color="yellow"
                    size="xs"
                    leftSection={<IconUpload size={14} />}
                  >
                    Cambiar Foto
                  </Button>
                )}
              </FileButton>
            </div>
          </div>

          {/* Form Fields - Grid Layout */}
          <Stack gap="sm">
            <TextInput
              label="Nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              radius="md"
              color="yellow"
            />
            <Group grow>
              <TextInput
                label="DNI"
                name="dni"
                value={formData.dni}
                onChange={handleChange}
                radius="md"
              />
              <TextInput
                label="Teléfono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                radius="md"
              />
            </Group>
            <TextInput
              label="Dirección"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              radius="md"
            />
            <Group grow>
              <TextInput
                label="Localidad"
                name="localidad"
                value={formData.localidad}
                onChange={handleChange}
                radius="md"
              />
              <TextInput
                label="Provincia"
                name="provincia"
                value={formData.provincia}
                onChange={handleChange}
                radius="md"
              />
            </Group>
          </Stack>

          <Group justify="flex-end" mt={25}>
            <Button variant="default" onClick={handleClose} disabled={loading} leftSection={<IconX size={16} />}>
              Cancelar
            </Button>
            <Button
              type="submit"
              color="yellow"
              c="white"
              loading={loading}
              leftSection={<IconDeviceFloppy size={18} />}
            >
              Guardar
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default EditarPerfilModal;
