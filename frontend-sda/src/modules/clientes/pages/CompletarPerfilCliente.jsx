import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AuthContext from "@core/context/AuthProvider";
import { apiUsuariosApi } from "@core/api/apiSistema";
import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  Button,
  Stack,
  Alert,
  LoadingOverlay,
  Box,
  rem,
  Badge,
  Center,
  ThemeIcon
} from "@mantine/core";
import {
  IconDeviceFloppy,
  IconAlertCircle,
  IconCheck,
  IconId,
  IconPhone,
  IconMapPin,
  IconBuildingCommunity,
  IconMap
} from "@tabler/icons-react";

/**
 * Pantalla "Nivel Dios" para Completar Perfil
 * Estilo premium con Glassmorphism y degradados dinámicos.
 */
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

      const datosActualizados = response.data.usuario;

      setAuth((prev) => ({
        ...prev,
        ...datosActualizados,
        token: prev.token,
      }));

      setMensaje("✅ Perfil actualizado correctamente. Redirigiendo...");
      setTipoMensaje("success");

      setTimeout(() => navigate("/perfil"), 1500);
    } catch (error) {
      console.error("❌ Error al actualizar perfil:", error?.response?.data || error.message);
      setMensaje(error.response?.data?.error || "Error al actualizar el perfil. Verificá los datos.");
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
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 0% 0%, #f1f3f5 0%, #e9ecef 100%)',
      position: 'relative',
      overflow: 'hidden',
      padding: rem(20)
    }}>
      {/* Decoraciones de fondo "Nivel Dios" */}
      <Box style={{
        position: 'absolute',
        top: '15%',
        left: '10%',
        width: rem(350),
        height: rem(350),
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34, 184, 209, 0.2) 0%, transparent 70%)',
        filter: 'blur(60px)',
        zIndex: 0,
        animation: 'floating 10s infinite ease-in-out'
      }} />
      <Box style={{
        position: 'absolute',
        bottom: '10%',
        right: '5%',
        width: rem(450),
        height: rem(450),
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16, 152, 173, 0.15) 0%, transparent 70%)',
        filter: 'blur(80px)',
        zIndex: 0,
        animation: 'floating 15s infinite ease-in-out reverse'
      }} />

      <style>{`
        @keyframes floating {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -20px); }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      <Container size={500} px={0} style={{ zIndex: 1, animation: 'fadeInScale 0.6s ease-out forwards' }}>
        <Paper
          shadow="xl"
          radius="24px"
          p={rem(40)}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)'
          }}
        >
          <LoadingOverlay visible={loading} overlayProps={{ radius: "24px", blur: 4 }} />

          <Stack gap="xs" mb={40} align="center">
            <Badge
              variant="gradient"
              gradient={{ from: 'cyan', to: 'indigo' }}
              size="lg"
              radius="sm"
              px="md"
              style={{ fontWeight: 800, letterSpacing: '0.5px' }}
            >
              NUEVO USUARIO
            </Badge>
            <Title
              order={1}
              ta="center"
              style={{
                fontSize: rem(36),
                fontWeight: 900,
                letterSpacing: '-1.5px',
                lineHeight: 1.1
              }}
            >
              Completar <Text span inherit variant="gradient" gradient={{ from: 'cyan', to: 'indigo' }}>perfil</Text>
            </Title>
            <Text ta="center" c="dimmed" size="md" px="xl" style={{ opacity: 0.8 }}>
              Para brindarte un mejor servicio, necesitamos estos datos adicionales.
            </Text>
          </Stack>

          {mensaje && (
            <Alert
              color={tipoMensaje === 'error' ? 'red' : 'cyan'}
              variant="light"
              icon={tipoMensaje === 'error' ? <IconAlertCircle size={18} /> : <IconCheck size={18} />}
              mb="xl"
              radius="lg"
            >
              {mensaje}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack gap="lg">
              <TextInput
                label="DNI / CUIT"
                placeholder="Número de documento"
                name="dni"
                value={formData.dni}
                onChange={handleChange}
                required
                radius="md"
                size="md"
                leftSection={<IconId size={18} stroke={1.5} color="var(--mantine-color-cyan-6)" />}
                styles={{
                  label: { fontWeight: 600, marginBottom: 5 },
                  input: { height: rem(52), fontSize: rem(15), border: '1px solid rgba(0,0,0,0.06)' }
                }}
              />

              <TextInput
                label="Teléfono Móvil"
                placeholder="Ej: +54 9..."
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                required
                radius="md"
                size="md"
                leftSection={<IconPhone size={18} stroke={1.5} color="var(--mantine-color-cyan-6)" />}
                styles={{
                  label: { fontWeight: 600, marginBottom: 5 },
                  input: { height: rem(52), fontSize: rem(15), border: '1px solid rgba(0,0,0,0.06)' }
                }}
              />

              <TextInput
                label="Dirección de Facturación/Retiro"
                placeholder="Calle, número, departamento"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                required
                radius="md"
                size="md"
                leftSection={<IconMapPin size={18} stroke={1.5} color="var(--mantine-color-cyan-6)" />}
                styles={{
                  label: { fontWeight: 600, marginBottom: 5 },
                  input: { height: rem(52), fontSize: rem(15), border: '1px solid rgba(0,0,0,0.06)' }
                }}
              />

              <Group grow gap="md">
                <TextInput
                  label="Localidad"
                  placeholder="Ciudad"
                  name="localidad"
                  value={formData.localidad}
                  onChange={handleChange}
                  required
                  radius="md"
                  size="md"
                  leftSection={<IconBuildingCommunity size={18} stroke={1.5} color="var(--mantine-color-cyan-6)" />}
                  styles={{
                    label: { fontWeight: 600, marginBottom: 5 },
                    input: { height: rem(52), fontSize: rem(15), border: '1px solid rgba(0,0,0,0.06)' }
                  }}
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
                  leftSection={<IconMap size={18} stroke={1.5} color="var(--mantine-color-cyan-6)" />}
                  styles={{
                    label: { fontWeight: 600, marginBottom: 5 },
                    input: { height: rem(52), fontSize: rem(15), border: '1px solid rgba(0,0,0,0.06)' }
                  }}
                />
              </Group>

              <Button
                type="submit"
                fullWidth
                size="lg"
                mt={20}
                radius="md"
                variant="gradient"
                gradient={{ from: 'cyan', to: 'indigo' }}
                leftSection={<IconCheck size={20} />}
                style={{
                  height: rem(56),
                  fontSize: rem(16),
                  fontWeight: 800,
                  boxShadow: '0 10px 25px rgba(34, 184, 209, 0.3)',
                }}
              >
                GUARDAR Y CONTINUAR
              </Button>
            </Stack>
          </form>
        </Paper>

        <Center mt="xl">
          <Text size="sm" c="dimmed" fw={500}>
            © 2026 Sol del Amanecer - Logística Profesional
          </Text>
        </Center>
      </Container>
    </div>
  );
};

export default CompletarPerfilCliente;
