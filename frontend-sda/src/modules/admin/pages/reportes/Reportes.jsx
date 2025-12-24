
import React, { useEffect, useState } from "react";
import {
  Grid,
  Paper,
  Text,
  Group,
  RingProgress,
  Stack,
  Loader,
  Badge,
  ThemeIcon,
  Progress,
  Title,
  SimpleGrid,
  Card,
  rem,
  Box
} from "@mantine/core";
import {
  IconPackage,
  IconTrendingUp,
  IconTrendingDown,
  IconTruckDelivery,
  IconUsers,
  IconAlertTriangle,
  IconCheck,
  IconClock,
  IconTruck
} from "@tabler/icons-react";
import { apiSistema } from "@core/api/apiSistema";
import { useContext } from "react";
import AuthContext from "@core/context/AuthProvider";
import { notifications } from "@mantine/notifications";

const Reportes = () => {
  const { auth } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Quick Auth fix if hook unavailable
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(apiSistema("/api/reportes/dashboard"), {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setStats(data);
      } else {
        throw new Error(data.msg || "Error al cargar reporte");
      }
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Error",
        message: "No se pudieron cargar las métricas. ¿Reiniciaste el backend?",
        color: "red"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Group justify="center" h={400}><Loader size="xl" type="bars" color="cyan" /></Group>;
  if (!stats) return <Text c="dimmed" ta="center" mt="xl">No hay datos disponibles.</Text>;

  // Data helpers
  const { kpis, flota, choferes, graficos } = stats;

  return (
    <Stack gap="lg" pb="xl">
      {/* HEADER */}
      <Box>
        <Title order={2} style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, letterSpacing: '-0.5px' }}>
          Centro de Inteligencia
        </Title>
        <Text c="dimmed" size="sm">Visión global de la operación logística en tiempo real.</Text>
      </Box>

      {/* 1. TOP KPI CARDS */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        <StatCard
          title="Envíos del Mes"
          value={kpis.enviosMes}
          icon={IconPackage}
          color="cyan"
          trend={kpis.porcentajeTendencia}
          trendLabel="vs mes anterior"
        />
        <StatCard
          title="Efectividad Entrega"
          value={`${kpis.efectividad}%`}
          icon={IconCheck}
          color="teal"
          subtitle={`${kpis.enviosEnCalle} en reparto activo`}
        />
        <StatCard
          title="Fuerza Laboral"
          value={`${choferes.activos}/${choferes.total}`}
          icon={IconUsers}
          color="indigo"
          subtitle="Choferes Activos"
        />
        <StatCard
          title="Salud de Flota"
          value={`${flota.disponible}/${flota.total}`}
          icon={IconTruck}
          color="blue"
          subtitle={`${flota.mantenimiento} en mantenimiento`}
          isAlert={flota.mantenimiento > 0}
        />
      </SimpleGrid>

      {/* 2. MAIN CHARTS AREA */}
      <Grid gutter="md">
        {/* LEFT: STATUS DISTRIBUTION */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card shadow="sm" radius="md" padding="lg" withBorder>
            <Title order={4} mb="lg">Distribución de Envíos</Title>
            <Group align="flex-start" gap="xl">
              {/* Donut Chart */}
              <RingProgress
                size={220}
                thickness={26}
                roundCaps
                sections={graficos.estados.map(s => ({ value: (s.value / kpis.enviosMes) * 100 || 0, color: s.color, tooltip: s.name }))}
                label={
                  <Stack gap={0} align="center">
                    <Text fw={900} size="xl" style={{ fontSize: 32, lineHeight: 1 }}>{kpis.enviosMes}</Text>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Total</Text>
                  </Stack>
                }
              />

              {/* Legend */}
              <Stack gap="xs" flex={1}>
                {graficos.estados.map((item, idx) => (
                  <Group key={idx} justify="space-between">
                    <Group gap="xs">
                      <Box bg={item.color} w={12} h={12} style={{ borderRadius: 4 }} />
                      <Text size="sm" fw={500}>{item.name}</Text>
                    </Group>
                    <Badge variant="light" color={item.color} size="lg">{item.value}</Badge>
                  </Group>
                ))}
              </Stack>
            </Group>
          </Card>
        </Grid.Col>

        {/* RIGHT: FLEET STATUS */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card shadow="sm" radius="md" padding="lg" withBorder h="100%">
            <Title order={4} mb="md">Composición de Flota</Title>
            <Stack justify="center" h="80%">
              <FleetBar label="Propia" value={flota.propio} total={flota.total} color="cyan" />
              <FleetBar label="Externa" value={flota.externo} total={flota.total} color="grape" />
              <Divider labelPosition="center" label={<IconAlertTriangle size={12} />} my="sm" />
              <FleetBar label="En Mantenimiento" value={flota.mantenimiento} total={flota.total} color="red" />
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {/* 3. TOP DRIVERS */}
      <Card shadow="sm" radius="md" padding="lg" withBorder>
        <Title order={4} mb="md">Top Choferes (MVP)</Title>
        <SimpleGrid cols={{ base: 1, sm: 3, md: 5 }}>
          {graficos.topChoferes.length > 0 ? graficos.topChoferes.map((driver, idx) => (
            <Paper key={idx} withBorder p="md" radius="md" bg="gray.0">
              <Group justify="space-between" mb="xs">
                <Text fw={700} size="sm" lineClamp={1}>{driver.name}</Text>
                {idx === 0 && <IconTrophy size={16} color="gold" />}
              </Group>
              <Text size="xs" c="dimmed">Viajes Completados</Text>
              <Text fw={900} size="xl" c="cyan">{driver.value}</Text>
            </Paper>
          )) : (
            <Text c="dimmed" size="sm">No hay datos de choferes aún.</Text>
          )}
        </SimpleGrid>
      </Card>

    </Stack>
  );
};

// --- SUBCOMPONENTS ---

const StatCard = ({ title, value, icon: Icon, color, trend, trendLabel, subtitle, isAlert }) => (
  <Paper withBorder p="md" radius="md" shadow="sm">
    <Group justify="space-between">
      <Text size="xs" c="dimmed" fw={700} tt="uppercase">{title}</Text>
      <ThemeIcon color={isAlert ? 'red' : color} variant="light" radius="md">
        <Icon size={18} />
      </ThemeIcon>
    </Group>

    <Group align="flex-end" gap="xs" mt={25}>
      <Text fw={900} style={{ fontSize: rem(28), lineHeight: 1 }}>{value}</Text>
      {trend && (
        <Badge
          color={trend > 0 ? 'teal' : 'red'}
          variant="light"
          leftSection={trend > 0 ? <IconTrendingUp size={12} /> : <IconTrendingDown size={12} />}
        >
          {trend}%
        </Badge>
      )}
    </Group>

    {(trendLabel || subtitle) && (
      <Text size="xs" c="dimmed" mt={7}>
        {trendLabel || subtitle}
      </Text>
    )}
  </Paper>
);

const FleetBar = ({ label, value, total, color }) => (
  <Box>
    <Group justify="space-between" mb={5}>
      <Text size="sm" fw={500}>{label}</Text>
      <Text size="sm" c="dimmed">{value} / {total}</Text>
    </Group>
    <Progress value={(value / total) * 100} color={color} size="lg" radius="xl" animated={label === "En Mantenimiento" && value > 0} />
  </Box>
);

import { Divider } from "@mantine/core";
import { IconTrophy } from "@tabler/icons-react";

export default Reportes;
