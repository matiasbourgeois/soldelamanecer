
import React, { useState, useEffect, useContext } from "react";
import { Modal, TextInput, Button, Group, FileButton, Image, Text, Stack, Alert, ThemeIcon } from "@mantine/core";
import {
  IconUpload,
  IconDeviceFloppy,
  IconX,
  IconAlertTriangle,
  IconId,
  IconPhone,
  IconMapPin,
  IconBuilding
} from "@tabler/icons-react";
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

      // 1. Upload photo if exists
      if (archivoOriginal) {
        const formDataFoto = new FormData();
        formDataFoto.append("foto", archivoOriginal);

        const uploadUrl = apiUsuarios("/subir-foto");

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

      const updateUrl = apiUsuarios("/perfil-completo");

      await axios.put(
        updateUrl,
        datosCompletos,
        {
          headers: { Authorization: `Bearer ${auth.token}` },
        }
      );

      // 3. Sync & Finish
      await onPerfilActualizado();

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
      title={<Text fw={700} size="lg" c="cyan.8">Editar Perfil</Text>}
      size="lg"
      radius="md"
      overlayProps={{ opacity: 0.5, blur: 3 }}
    >
      <form onSubmit={handleSubmit}>
        <Stack>
          {errorMsg && (
            <Alert icon={<IconAlertTriangle size={16} />} title="Error" color="red" radius="md">
              {errorMsg}
            </Alert>
          )}

          {/* Photo Upload Section */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <Image
                src={foto}
                w={100}
                h={100}
                radius={100}
                fallbackSrc="https://cdn-icons-png.flaticon.com/512/149/149071.png"
                style={{ border: '4px solid var(--mantine-color-blue-2)', objectFit: 'cover' }}
              />
            </div>
            <div style={{ marginTop: 8 }}>
              <FileButton onChange={handleFileChange} accept="image/png,image/jpeg">
                {(props) => (
                  <Button
                    {...props}
                    variant="light"
                    color="cyan"
                    size="xs"
                    radius="xl"
                    leftSection={<IconUpload size={14} />}
                  >
                    Cambiar Foto
                  </Button>
                )}
              </FileButton>
            </div>
          </div>

          {/* Form Fields - Grid Layout */}
          <Stack gap="md">
            <TextInput
              label="Nombre Completo"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              radius="md"
              leftSection={<ThemeIcon variant="transparent" color="gray"><IconId size={16} /></ThemeIcon>}
            />

            <Group grow>
              <TextInput
                label="DNI"
                name="dni"
                value={formData.dni}
                onChange={handleChange}
                radius="md"
                leftSection={<IconId size={16} color="gray" />}
              />
              <TextInput
                label="Teléfono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                radius="md"
                leftSection={<IconPhone size={16} color="gray" />}
              />
            </Group>

            <TextInput
              label="Dirección"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              radius="md"
              leftSection={<IconMapPin size={16} color="gray" />}
            />

            <Group grow>
              <TextInput
                label="Localidad"
                name="localidad"
                value={formData.localidad}
                onChange={handleChange}
                radius="md"
                leftSection={<IconBuilding size={16} color="gray" />}
              />
              <TextInput
                label="Provincia"
                name="provincia"
                value={formData.provincia}
                onChange={handleChange}
                radius="md"
                leftSection={<IconMapPin size={16} color="gray" />}
              />
            </Group>
          </Stack>

          <Group justify="flex-end" mt={30}>
            <Button variant="subtle" color="gray" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              color="cyan"
              loading={loading}
              leftSection={<IconDeviceFloppy size={18} />}
            >
              Guardar Cambios
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default EditarPerfilModal;
