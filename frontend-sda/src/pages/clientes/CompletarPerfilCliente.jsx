import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AuthContext from "../../context/AuthProvider";
import { apiUsuariosApi } from "../../utils/api";
import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  Button,
  Stack,
  Alert,
  LoadingOverlay
} from "@mantine/core";
import { IconDeviceFloppy, IconInfoCircle, IconAlertCircle, IconCheck } from "@tabler/icons-react";

const CompletarPerfilCliente = () => {
  const { auth, setAuth } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    dni: auth?.dni || "",
    telefono: auth?.telefono || "",
    direccion: auth?.direccion || "",
    localidad: auth?.localidad || "",
    provincia: auth?.provincia || "",
  });

  const [mensaje, setMensaje] = useState(null);
  const [tipoMensaje, setTipoMensaje] = useState(null); // 'success' | 'error'
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje(null);
    setLoading(true);

    if (!auth?.token) {
      setMensaje("❌ No hay token disponible. Por favor, iniciá sesión nuevamente.");
      setTipoMensaje("error");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.put(
        apiUsuariosApi("/perfil-completo"),
        { ...formData, perfilCompleto: true },
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );

      // Actualizamos el contexto auth con los datos nuevos
      const datosActualizados = response.data.usuario;

      setAuth((prev) => ({
        ...prev,
        ...datosActualizados,
        token: prev.token, // preservamos el token actual
      }));

      setMensaje("✅ Perfil actualizado correctamente. Redirigiendo...");
      setTipoMensaje("success");

      setTimeout(() => navigate("/perfil"), 1500);
    } catch (error) {
      console.error("❌ Error al actualizar perfil:", error?.response?.data || error.message);

      if (error.response?.status === 403) {
        setMensaje("❌ Sesión expirada. Por favor, iniciá sesión nuevamente.");
        setTipoMensaje("error");
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      setMensaje("❌ Error al actualizar el perfil. Verificá los datos.");
      setTipoMensaje("error");
    }
    setLoading(false);
  };

  if (!auth || !auth.token) {
    return (
      <Container size="xs" mt={50}>
        <LoadingOverlay visible={true} overlayProps={{ radius: "sm", blur: 2 }} />
      </Container>
    );
  }

  return (
    <Container size="xs" py={60}>
      <Paper shadow="xl" radius="lg" p="xl" withBorder pos="relative">
        <LoadingOverlay visible={loading} overlayProps={{ radius: "lg", blur: 2 }} />

        <Stack gap="xs" mb="xl" align="center">
          <Title order={1} ta="center" fw={800} size="h2">Completar Perfil</Title>
          <Text ta="center" c="dimmed" size="sm">
            Necesitamos algunos datos extra para configurar tu cuenta
          </Text>
        </Stack>

        {mensaje && (
          <Alert
            color={tipoMensaje === 'error' ? 'red' : 'green'}
            icon={tipoMensaje === 'error' ? <IconAlertCircle size={16} /> : <IconCheck size={16} />}
            mb="lg"
            radius="md"
            title={tipoMensaje === 'error' ? "Error" : "Éxito"}
          >
            {mensaje}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="DNI"
              placeholder="Tu número de documento"
              name="dni"
              value={formData.dni}
              onChange={handleChange}
              required
              radius="md"
              size="md"
              withAsterisk
            />
            <TextInput
              label="Teléfono"
              placeholder="Tu número de contacto"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              required
              radius="md"
              size="md"
              withAsterisk
            />
            <TextInput
              label="Dirección"
              placeholder="Calle y altura"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              required
              radius="md"
              size="md"
              withAsterisk
            />
            <TextInput
              label="Localidad"
              placeholder="Ciudad"
              name="localidad"
              value={formData.localidad}
              onChange={handleChange}
              required
              radius="md"
              size="md"
              withAsterisk
            />
            <TextInput
              label="Provincia"
              placeholder="Provincia"
              name="provincia"
              value={formData.provincia}
              onChange={handleChange}
              required
              radius="md"
              size="md"
              withAsterisk
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              mt="lg"
              color="yellow"
              c="white"
              radius="md"
              leftSection={<IconDeviceFloppy size={20} />}
              style={{ boxShadow: '0 4px 12px rgba(250, 176, 5, 0.4)' }}
            >
              Guardar Perfil
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
};

export default CompletarPerfilCliente;
