
import React, { useEffect, useState, useContext, useRef } from "react";
import axios from "axios";
import {
  Container,
  Grid,
  Card,
  Avatar,
  Text,
  Group,
  Button,
  SimpleGrid,
  ThemeIcon,
  LoadingOverlay,
  Box,
  Badge,
  Paper,
  Stack,
  RingProgress,
  Title,
  Divider,
  ActionIcon,
  rem,
  Tooltip
} from "@mantine/core";
import {
  IconMail,
  IconId,
  IconPhone,
  IconMapPin,
  IconBuildingSkyscraper,
  IconMap,
  IconEdit,
  IconUser,
  IconLock,
  IconCheck,
  IconCamera,
  IconShieldLock
} from "@tabler/icons-react";
import { notifications } from '@mantine/notifications';
import EditarPerfilModal from "./EditarPerfilModal";
import CambiarPasswordModal from "./CambiarPasswordModal";
import AuthContext from "@core/context/AuthProvider";
import { apiUsuarios, apiEstaticos } from "@core/api/apiSistema";

const Perfil = () => {
  const { auth, setAuth } = useContext(AuthContext);
  const [perfil, setPerfil] = useState(null);
  const [modalEditVisible, setModalEditVisible] = useState(false);
  const [modalPassVisible, setModalPassVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);

  const fetchPerfil = async () => {
    setLoading(true);
    try {
      const response = await axios.get(apiUsuarios("/perfil"), {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
      setPerfil(response.data.usuario);
    } catch (error) {
      console.error("❌ Error al obtener el perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth?.token) {
      fetchPerfil();
    }
  }, [auth]);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("foto", file);

    setUploading(true);
    try {
      await axios.post(apiUsuarios("/subir-foto"), formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${auth.token}`,
        },
      });

      notifications.show({
        title: 'Foto Actualizada',
        message: 'Tu foto de perfil se ha guardado correctamente.',
        color: 'green',
        icon: <IconCheck size={18} />
      });

      await fetchPerfil();

    } catch (error) {
      console.error("Error upload:", error);
      notifications.show({
        title: 'Error',
        message: 'No se pudo subir la imagen. Intenta nuevamente.',
        color: 'red',
        icon: <IconCamera size={18} />
      });
    } finally {
      setUploading(false);
    }
  };

  const cerrarModalConActualizacion = async () => {
    await fetchPerfil();
    setModalEditVisible(false);
  };

  if (!perfil && loading) {
    return (
      <Container size="lg" py="xl" style={{ position: 'relative', minHeight: '80vh' }}>
        <LoadingOverlay visible={true} overlayProps={{ radius: "sm", blur: 2 }} />
      </Container>
    );
  }

  if (!perfil) return null;

  const fotoUrl = perfil.fotoPerfil
    ? `${apiEstaticos(perfil.fotoPerfil)}?t=${new Date().getTime()}`
    : null;

  // Calculate Profile Completeness
  const fields = ['nombre', 'email', 'dni', 'telefono', 'direccion', 'localidad'];
  const completed = fields.filter(f => perfil[f] && perfil[f].trim() !== '').length;
  const progress = Math.round((completed / fields.length) * 100);

  return (
    <Box bg="gray.0" style={{ minHeight: '100vh', paddingBottom: 60 }}>

      {/* 🌟 HERO BANNER */}
      <Box
        h={220}
        style={{
          backgroundImage: 'linear-gradient(135deg, #0b7285 0%, #1098ad 100%)', // OCEAN CYAN THEME (MATCHING TRACKING)
          borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30,
        }}
      />

      <Container size="lg" style={{ marginTop: -140 }}>
        <Grid gutter="xl">

          {/* 👤 LEFT SIDEBAR: IDENTITY */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper radius="lg" shadow="xl" p="xl" style={{ position: 'relative', overflow: 'visible' }}>
              <LoadingOverlay visible={uploading} />

              <Stack align="center" mt={-60}>
                <Box style={{ position: 'relative' }}>
                  <Avatar
                    src={fotoUrl}
                    size={160}
                    radius={160}
                    style={{
                      border: '6px solid white',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                      backgroundColor: 'var(--mantine-color-gray-1)'
                    }}
                  >
                    {!fotoUrl && <IconUser size={80} color="gray" />}
                  </Avatar>

                  {/* Camera Button */}
                  <Tooltip label="Cambiar foto de perfil" withArrow position="right">
                    <ActionIcon
                      variant="filled"
                      color="dark"
                      size="lg"
                      radius="xl"
                      style={{ position: 'absolute', bottom: 10, right: 10, border: '3px solid white', zIndex: 10 }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <IconCamera size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                </Box>

                <Stack align="center" gap={4}>
                  <Title order={2} ta="center" style={{ letterSpacing: -0.5 }}>
                    {perfil.nombre}
                  </Title>
                  <Badge
                    size="md"
                    variant="light"
                    color="cyan"
                    tt="uppercase"
                  >
                    {perfil.rol}
                  </Badge>
                </Stack>
              </Stack>

              <Divider my="lg" />

              {/* Completeness Ring */}
              <Group justify="center" mb="lg">
                <Stack gap={0} align="center">
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Nivel de Perfil</Text>
                  <RingProgress
                    size={140}
                    thickness={12}
                    roundCaps
                    sections={[{ value: progress, color: 'cyan' }]}
                    label={
                      <Stack gap={0} align="center">
                        <Text fw={900} size="xl" lh={1} c="cyan">
                          {progress}%
                        </Text>
                        <Text size="10px" c="dimmed" tt="uppercase" fw={600}>Completado</Text>
                      </Stack>
                    }
                  />
                </Stack>
              </Group>

              <Stack gap="sm">
                <Button
                  fullWidth
                  size="md"
                  radius="md"
                  color="dark"
                  variant="outline"
                  leftSection={<IconEdit size={18} />}
                  onClick={() => setModalEditVisible(true)}
                >
                  Editar Información
                </Button>

                <Button
                  fullWidth
                  size="md"
                  radius="md"
                  color="blue"
                  variant="light"
                  leftSection={<IconShieldLock size={18} />}
                  onClick={() => setModalPassVisible(true)}
                >
                  Cambiar Contraseña
                </Button>
              </Stack>

            </Paper>
          </Grid.Col>

          {/* 📄 RIGHT CONTENT: DETAILS */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="lg" mt={20}>

              {/* Section: Personal Info */}
              <Paper shadow="sm" radius="md" p="xl" withBorder>
                <Group align="center" mb="lg">
                  <Title order={4}>Información Personal</Title>
                </Group>

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl" verticalSpacing="lg">
                  <InfoItem icon={IconMail} label="Email" value={perfil.email} color="blue" />
                  <InfoItem icon={IconId} label="DNI / CUIT" value={perfil.dni} color="cyan" />
                  <InfoItem icon={IconPhone} label="Teléfono" value={perfil.telefono} color="indigo" />
                </SimpleGrid>
              </Paper>

              {/* Section: Location */}
              <Paper shadow="sm" radius="md" p="xl" withBorder>
                <Group align="center" mb="lg">
                  <Title order={4}>Ubicación</Title>
                </Group>

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
                  <InfoItem icon={IconMapPin} label="Dirección" value={perfil.direccion} color="blue" />
                  <InfoItem icon={IconBuildingSkyscraper} label="Localidad" value={perfil.localidad} color="cyan" />
                  <InfoItem icon={IconMap} label="Provincia" value={perfil.provincia} color="indigo" />
                </SimpleGrid>
              </Paper>

            </Stack>
          </Grid.Col>
        </Grid>
      </Container>

      <EditarPerfilModal
        show={modalEditVisible}
        handleClose={cerrarModalConActualizacion}
        datosUsuario={perfil}
        onPerfilActualizado={fetchPerfil}
      />

      <CambiarPasswordModal
        show={modalPassVisible}
        handleClose={() => setModalPassVisible(false)}
      />

    </Box>
  );
};

// ✨ Styled Info Item Component
const InfoItem = ({ icon: Icon, label, value, color = "gray" }) => (
  <Group wrap="nowrap" align="flex-start">
    <ThemeIcon size={42} radius="md" variant="light" color={color}>
      <Icon style={{ width: rem(22), height: rem(22) }} />
    </ThemeIcon>
    <div>
      <Text size="xs" tt="uppercase" fw={700} c="dimmed" mb={2}>
        {label}
      </Text>
      <Text fw={600} size="md" c="dark.4" style={{ lineHeight: 1.3 }}>
        {value || <Text span c="dimmed" fs="italic">No especificado</Text>}
      </Text>
    </div>
  </Group>
);

export default Perfil;
