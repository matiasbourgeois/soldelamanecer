import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import {
  Container,
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
  rem
} from "@mantine/core";
import {
  IconMail,
  IconId,
  IconPhone,
  IconMapPin,
  IconBuildingSkyscraper,
  IconMap,
  IconEdit,
  IconUser
} from "@tabler/icons-react";
import EditarPerfilModal from "../pages/EditarPerfilModal";
import AuthContext from "../../../core/context/AuthProvider";
import { apiUsuarios } from "../../../core/api/apiSistema";

const Perfil = () => {
  const { auth } = useContext(AuthContext);
  const [perfil, setPerfil] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPerfil = async () => {
    setLoading(true);
    try {
      const response = await axios.get(apiUsuarios("/api/usuarios/perfil"), {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
      setPerfil(response.data.usuario);
    } catch (error) {
      console.error("❌ Error al obtener el perfil:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (auth?.token) {
      fetchPerfil();
    }
  }, [auth]);

  const cerrarModalConActualizacion = async () => {
    await fetchPerfil();
    setModalVisible(false);
  };

  if (!perfil && loading) {
    return (
      <Container size="xs" py="md" style={{ position: 'relative', minHeight: 300 }}>
        <LoadingOverlay visible={true} overlayProps={{ radius: "sm", blur: 2 }} />
      </Container>
    );
  }

  if (!perfil) return null;

  // Ensure photo URL is correct. Assuming apiUsuarios handles the base path.
  const fotoUrl = perfil.fotoPerfil
    ? `${apiUsuarios(perfil.fotoPerfil)}?t=${new Date().getTime()}`
    : null;

  return (
    <Container size="sm" py="xl" style={{ maxWidth: 600 }}> {/* Compact Container */}
      <Card shadow="lg" padding="lg" radius="lg" withBorder style={{ overflow: 'visible', marginTop: 30 }}>
        {/* Header with Background/Avatar - Reduced Height */}
        <Box
          h={90}
          style={{
            backgroundImage: 'linear-gradient(135deg, var(--mantine-color-yellow-5) 0%, var(--mantine-color-orange-6) 100%)',
            borderRadius: 'var(--mantine-radius-lg) var(--mantine-radius-lg) 0 0',
            margin: 'calc(var(--mantine-spacing-lg) * -1)',
            marginBottom: 40,
          }}
        />

        <Box style={{ marginTop: -80, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar
            src={fotoUrl}
            size={120}
            radius={120}
            mx="auto"
            style={{
              border: '4px solid white',
              boxShadow: '0 3px 10px rgba(0,0,0,0.15)',
              backgroundColor: 'var(--mantine-color-gray-1)'
            }}
          >
            {!fotoUrl && <IconUser size={60} color="gray" />}
          </Avatar>

          <Text ta="center" fz={26} fw={800} mt="xs" style={{ letterSpacing: '-0.5px', lineHeight: 1.2 }}>
            {perfil.nombre?.toUpperCase()}
          </Text>

          <Badge
            size="md"
            variant="gradient"
            gradient={{ from: 'yellow', to: 'orange' }}
            mt={4}
            tt="uppercase"
            px="md"
          >
            {perfil.rol}
          </Badge>
        </Box>

        <SimpleGrid cols={2} spacing="md" mt={30} verticalSpacing="xs">
          <InfoItem icon={IconMail} label="Email" value={perfil.email} />
          <InfoItem icon={IconId} label="DNI" value={perfil.dni || "-"} />
          <InfoItem icon={IconPhone} label="Teléfono" value={perfil.telefono || "-"} />
          <InfoItem icon={IconMapPin} label="Dirección" value={perfil.direccion || "-"} />
          <InfoItem icon={IconBuildingSkyscraper} label="Localidad" value={perfil.localidad || "-"} />
          <InfoItem icon={IconMap} label="Provincia" value={perfil.provincia || "-"} />
        </SimpleGrid>

        <Group justify="center" mt={30} mb="xs">
          <Button
            leftSection={<IconEdit size={18} />}
            size="md"
            radius="md"
            color="yellow"
            c="white"
            onClick={() => setModalVisible(true)}
            style={{ boxShadow: '0 4px 12px rgba(250, 176, 5, 0.4)' }}
          >
            Editar Perfil
          </Button>
        </Group>
      </Card>

      <EditarPerfilModal
        show={modalVisible}
        handleClose={cerrarModalConActualizacion}
        datosUsuario={perfil}
        onPerfilActualizado={fetchPerfil}
      />
    </Container>
  );
};

const InfoItem = ({ icon: Icon, label, value }) => (
  <Group wrap="nowrap" gap="sm">
    <ThemeIcon size={36} radius="md" variant="light" color="orange">
      <Icon style={{ width: rem(18), height: rem(18) }} />
    </ThemeIcon>
    <div style={{ overflow: 'hidden' }}>
      <Text size="10px" tt="uppercase" fw={700} c="dimmed" lh={1.1}>
        {label}
      </Text>
      <Text fw={600} size="sm" truncate lh={1.2}>
        {value}
      </Text>
    </div>
  </Group>
);

export default Perfil;
