import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import {
  Container,
  Title,
  Text,
  Paper,
  Stack,
  Group,
  Badge,
  Timeline,
  Box,
  rem,
  LoadingOverlay,
  ActionIcon,
  Tooltip,
  Divider
} from "@mantine/core";
import {
  IconPackage,
  IconClock,
  IconTruckDelivery,
  IconArrowRight,
  IconMapPin,
  IconUser,
  IconSearch,
  IconRefresh
} from "@tabler/icons-react";
import AuthContext from "@core/context/AuthProvider";
import { apiSistema } from "@core/api/apiSistema";

/**
 * Pantalla Mis Envíos (Refactorizada a Mantine)
 * Muestra el historial de envíos de un cliente con seguimiento detallado.
 */
const MisEnvios = () => {
  const [envios, setEnvios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const { auth } = useContext(AuthContext);

  const obtenerEnvios = async () => {
    setCargando(true);
    try {
      const token = auth?.token;
      const { data } = await axios.get(apiSistema("/api/envios/mis-envios"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setEnvios(data);
    } catch (error) {
      console.error("❌ Error al obtener mis envíos:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    obtenerEnvios();
  }, [auth]);

  const handleBuscar = (codigo) => {
    if (!codigo?.trim()) return;
    window.location.href = `/seguimiento/resultado/${codigo}`;
  };

  const getStatusColor = (estado) => {
    const e = estado?.toLowerCase();
    if (e?.includes("entregado")) return "teal";
    if (e?.includes("camino") || e?.includes("reparto")) return "cyan";
    if (e?.includes("pendiente") || e?.includes("recibido")) return "yellow";
    if (e?.includes("cancelado")) return "red";
    return "gray";
  };

  return (
    <Container size="lg" py={rem(60)}>
      <Group justify="space-between" mb="xl">
        <Stack gap={0}>
          <Title order={1} fw={900} style={{ letterSpacing: '-1.5px', fontSize: rem(38) }}>
            Mis <Text span inherit variant="gradient" gradient={{ from: 'cyan', to: 'indigo' }}>Envíos</Text>
          </Title>
          <Text c="dimmed" size="sm" fw={500}>
            Gestioná y seguí tus cargas en tiempo real
          </Text>
        </Stack>

        <ActionIcon
          variant="light"
          color="cyan"
          size="lg"
          radius="md"
          onClick={obtenerEnvios}
          loading={cargando}
        >
          <IconRefresh size={20} />
        </ActionIcon>
      </Group>

      {cargando ? (
        <Box pos="relative" h={200}>
          <LoadingOverlay visible={true} overlayProps={{ radius: "sm", blur: 1 }} />
        </Box>
      ) : envios.length === 0 ? (
        <Paper p="xl" radius="lg" withBorder style={{ borderStyle: 'dashed' }}>
          <Stack align="center" gap="md">
            <IconPackage size={48} stroke={1} color="var(--mantine-color-gray-4)" />
            <Text c="dimmed" fw={500}>No tenés envíos registrados aún.</Text>
          </Stack>
        </Paper>
      ) : (
        <Stack gap="xl">
          {envios.map((envio) => (
            <Paper
              key={envio._id}
              p={rem(30)}
              radius="lg"
              withBorder
              style={{
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.03)';
              }}
              onClick={() => handleBuscar(envio.numeroSeguimiento)}
            >
              <Group justify="space-between" align="flex-start" mb="xl">
                <Stack gap={4}>
                  <Text size="xs" fw={700} c="dimmed" tt="uppercase">Número de Seguimiento</Text>
                  <Text fw={800} size="xl" color="cyan.9">{envio.numeroSeguimiento}</Text>
                </Stack>
                <Badge
                  size="xl"
                  radius="md"
                  variant="light"
                  color={getStatusColor(envio.estado)}
                  leftSection={<IconTruckDelivery size={16} />}
                  px="md"
                >
                  {envio.estado}
                </Badge>
              </Group>

              <Divider mb="xl" color="gray.1" />

              <Group grow align="flex-start" mb="xl" gap="xl">
                <Stack gap="sm">
                  <Group gap="xs">
                    <ThemeIcon size="sm" variant="light" color="cyan" radius="sm">
                      <IconUser size={14} />
                    </ThemeIcon>
                    <Text fw={700} size="sm">Remitente</Text>
                  </Group>
                  <Text size="sm" c="dimmed">
                    {envio.clienteRemitente?.nombre || "N/A"}
                  </Text>
                </Stack>

                <Group gap="xs" justify="center" c="gray.3">
                  <IconArrowRight size={24} />
                </Group>

                <Stack gap="sm">
                  <Group gap="xs">
                    <ThemeIcon size="sm" variant="light" color="indigo" radius="sm">
                      <IconMapPin size={14} />
                    </ThemeIcon>
                    <Text fw={700} size="sm">Destino</Text>
                  </Group>
                  <Text size="sm" c="dark.3" fw={500}>
                    {envio.destinatario?.nombre || "Sin nombre"}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {envio.destinatario?.direccion || "-"}, {envio.localidadDestino?.nombre || "-"}
                  </Text>
                </Stack>
              </Group>

              <Box
                p="md"
                radius="md"
                style={{
                  backgroundColor: 'var(--mantine-color-gray-0)',
                  border: '1px solid var(--mantine-color-gray-1)'
                }}
              >
                <Text fw={700} size="sm" mb="md" c="dark.2">HISTORIAL DEL ENVÍO</Text>
                <Timeline active={envio.historialEstados?.length - 1} bulletSize={20} lineWidth={2} color="cyan">
                  {envio.historialEstados?.map((estado, index) => (
                    <Timeline.Item
                      key={index}
                      bullet={<IconClock size={12} />}
                      title={
                        <Text fw={700} size="sm" tt="uppercase" color="dark.4">
                          {estado.estado}
                        </Text>
                      }
                    >
                      <Text c="dimmed" size="xs">
                        {new Date(estado.fecha).toLocaleString('es-AR', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </Text>
                      <Text size="xs" mt={4} fw={500} c="cyan.9">Sucursal: {estado.sucursal}</Text>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </Box>

              <Group justify="flex-end" mt="xl">
                <Tooltip label="Ver detalles completos">
                  <Button
                    variant="subtle"
                    color="cyan"
                    rightSection={<IconSearch size={16} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBuscar(envio.numeroSeguimiento);
                    }}
                  >
                    Ver detalles
                  </Button>
                </Tooltip>
              </Group>
            </Paper>
          ))}
        </Stack>
      )}
    </Container>
  );
};

export default MisEnvios;
