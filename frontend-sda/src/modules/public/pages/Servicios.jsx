import React, { useState } from "react";
import {
  Container,
  Grid,
  Text,
  Title,
  Card,
  Stack,
  Group,
  ThemeIcon,
  Box,
  rem,
  Badge,
  Divider,
  SimpleGrid,
  Overlay,
  Button,
  Modal,
  ScrollArea,
  Paper,
  TextInput
} from '@mantine/core';
import {
  Truck,
  ShieldCheck,
  Clock,
  Package,
  MapPin,
  Building2,
  Zap,
  CalendarDays,
  Map,
  ListOrdered,
  Search
} from 'lucide-react';

import { useLocalidades } from "@core/hooks/useLocalidades";

const mainServices = [
  {
    title: "Logística E-commerce",
    description: "Soluciones de última milla diseñadas para las exigencias del comercio digital contemporáneo.",
    icon: <Package size={28} />,
    color: "cyan",
    features: ["Integración API", "Control de Stock", "Picking & Packing"]
  },
  {
    title: "Distribución Urbana",
    description: "Operaciones capilares eficientes para centros urbanos, garantizando entregas precisas.",
    icon: <Truck size={28} />,
    color: "indigo",
    features: ["Rutas Optimizadas", "Zonificación Inteligente", "Prueba de Entrega"]
  },
  {
    title: "Gestión de Depósito",
    description: "Infraestructura de almacenamiento estratégico con sistemas avanzados de inventario.",
    icon: <Building2 size={28} />,
    color: "teal",
    features: ["Cross-docking", "Seguridad 24/7", "WMS Integrado"]
  }
];

const branches = [
  { name: "Córdoba Capital", location: "Centro de Operaciones Principal", icon: <MapPin size={18} /> },
  { name: "Villa María", location: "Nexo Estratégico Regional", icon: <MapPin size={18} /> },
  { name: "Río Cuarto", location: "Cobertura Sur Provincial", icon: <MapPin size={18} /> },
  { name: "Mina Clavero", location: "Conectividad Traslasierra", icon: <MapPin size={18} /> }
];

const normalizeText = (text) =>
  text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const Servicios = () => {
  const [opened, setOpened] = useState(false);
  const [search, setSearch] = useState("");
  const { localidades, loading } = useLocalidades();

  // Filtrar y ordenar localidades
  const filteredLocalities = React.useMemo(() => {
    const sorted = [...localidades].sort((a, b) => a.name.localeCompare(b.name));
    if (!search) return sorted;
    const term = normalizeText(search);
    return sorted.filter(loc => normalizeText(loc.name).includes(term) || loc.cp.includes(term));
  }, [search, localidades]);

  return (
    <Box
      style={{
        flex: 1,
        backgroundColor: 'white',
        paddingTop: rem(100),
        paddingBottom: rem(60),
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Container size="xl">
        {/* HERO SECTION */}
        <Stack align="center" gap="sm" mb={60}>
          <Badge variant="light" color="cyan" size="lg" radius="sm">
            RED LOGÍSTICA CÓRDOBA
          </Badge>
          <Title order={1} fw={900} style={{ fontSize: rem(48), letterSpacing: '-2px', textAlign: 'center', lineHeight: 1.1 }}>
            Gestión Integral en toda la <Text component="span" variant="gradient" gradient={{ from: 'cyan', to: 'indigo' }} inherit>Provincia</Text>
          </Title>
          <Text c="dimmed" size="lg" ta="center" style={{ maxWidth: 700, fontWeight: 500 }}>
            Conectamos cada localidad del interior de Córdoba con una infraestructura robusta y tecnología de vanguardia.
          </Text>
        </Stack>

        {/* TIME SERVICES (SAME DAY / NEXT DAY) */}
        <SimpleGrid cols={{ base: 1, sm: 2 }} gap="xl" mb={80}>
          <Card padding="xl" radius="md" withBorder style={{ backgroundColor: '#f8fafc', borderLeft: `${rem(6)} solid var(--mantine-color-cyan-6)` }}>
            <Group align="flex-start" wrap="nowrap">
              <ThemeIcon size={54} radius="md" color="cyan" variant="light">
                <Zap size={30} />
              </ThemeIcon>
              <Stack gap={5}>
                <Title order={3} fw={800} size="xl">Same Day Delivery</Title>
                <Text size="sm" c="dimmed" fw={500}>
                  Entregas en el mismo día para Córdoba Capital y alrededores. Velocidad crítica para operaciones de alta exigencia.
                </Text>
                <Badge variant="dot" color="cyan" mt="xs">Frecuencia Diaria</Badge>
              </Stack>
            </Group>
          </Card>

          <Card padding="xl" radius="md" withBorder style={{ backgroundColor: '#f8fafc', borderLeft: `${rem(6)} solid var(--mantine-color-indigo-6)` }}>
            <Group align="flex-start" wrap="nowrap">
              <ThemeIcon size={54} radius="md" color="indigo" variant="light">
                <CalendarDays size={30} />
              </ThemeIcon>
              <Stack gap={5}>
                <Title order={3} fw={800} size="xl">Next Day Business</Title>
                <Text size="sm" c="dimmed" fw={500}>
                  Distribución garantizada en 24 horas a las principales ciudades del interior provincial. Confiabilidad absoluta.
                </Text>
                <Badge variant="dot" color="indigo" mt="xs">Frecuencia Garantizada</Badge>
              </Stack>
            </Group>
          </Card>
        </SimpleGrid>

        <Divider mb={60} label={<Text fw={700} c="dimmed">SOLUCIONES CORPORATIVAS</Text>} labelPosition="center" />

        {/* CORE SERVICES */}
        <Grid gutter={40} mb={80}>
          {mainServices.map((svc, index) => (
            <Grid.Col key={index} span={{ base: 12, md: 4 }}>
              <Stack gap="md">
                <ThemeIcon size={50} radius="lg" color={svc.color} variant="filled">
                  {svc.icon}
                </ThemeIcon>
                <Title order={4} fw={800} size="lg">{svc.title}</Title>
                <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
                  {svc.description}
                </Text>
                <Group gap="xs">
                  {svc.features.map((feat, i) => (
                    <Badge key={i} variant="outline" color="gray" size="xs">{feat}</Badge>
                  ))}
                </Group>
              </Stack>
            </Grid.Col>
          ))}
        </Grid>

        {/* BRANCHES / COBERTURA */}
        <Box p={rem(40)} radius="md" style={{ backgroundColor: '#111827', borderRadius: rem(24), position: 'relative', overflow: 'hidden' }}>
          <Box style={{ position: 'absolute', right: '-5%', top: '-10%', opacity: 0.1, color: 'white' }}>
            <Map size={300} strokeWidth={0.5} />
          </Box>
          <Stack gap="xl" style={{ position: 'relative', zIndex: 1 }}>
            <Group justify="space-between" align="center">
              <Stack gap={5}>
                <Title order={2} c="white" fw={900} size={rem(32)}>Presencia Estratégica</Title>
                <Text c="gray.4" size="md">Nuestra red de sucursales asegura control total en los puntos clave de la provincia.</Text>
              </Stack>
              <Group>
                <Button
                  variant="white"
                  color="dark"
                  radius="md"
                  leftSection={<ListOrdered size={18} />}
                  onClick={() => setOpened(true)}
                >
                  Listado de Cobertura
                </Button>
                <ShieldCheck size={48} color="var(--mantine-color-cyan-5)" />
              </Group>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} gap="lg">
              {branches.map((branch, i) => (
                <Card key={i} padding="md" radius="sm" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Group gap="sm" wrap="nowrap">
                    <ThemeIcon color="cyan" variant="light" size="sm">
                      {branch.icon}
                    </ThemeIcon>
                    <Stack gap={0}>
                      <Text c="white" fw={700} size="sm">{branch.name}</Text>
                      <Text c="gray.5" size="xs">{branch.location}</Text>
                    </Stack>
                  </Group>
                </Card>
              ))}
            </SimpleGrid>
          </Stack>
        </Box>
      </Container>

      {/* MODAL LOCALIDADES */}
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={<Text fw={800} size="lg">Cobertura en Provincia de Córdoba</Text>}
        size="lg"
        radius="xl"
        centered
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        <ScrollArea h={500} offsetScrollbars>
          <Stack gap="xs" p="sm">
            <TextInput
              placeholder="Escriba una localidad o CP..."
              leftSection={<Search size={14} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              mb="md"
              radius="md"
            />
            <Text size="xs" c="dimmed" mb="xs">
              {loading ? "Sincronizando con la red operativa..." : "Detalle de destinos, códigos postales y frecuencias operativas."}
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }} gap="xs">
              {filteredLocalities.map((loc, idx) => (
                <Paper
                  key={idx}
                  p="xs"
                  withBorder
                  radius="md"
                  style={{
                    backgroundColor: '#fafbfc',
                    height: rem(70),
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Group justify="space-between" style={{ width: '100%' }} wrap="nowrap">
                    <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                      <Text fw={700} size="xs" truncate>{loc.name}</Text>
                      <Text size="10px" c="dimmed">CP: {loc.cp}</Text>
                    </Stack>
                    <Badge
                      size="xs"
                      variant="outline"
                      color={loc.frecuencia.includes("LUNES A SABADOS") ? "blue" : "gray"}
                      style={{ flexShrink: 0 }}
                    >
                      {loc.frecuencia}
                    </Badge>
                  </Group>
                </Paper>
              ))}
            </SimpleGrid>
          </Stack>
        </ScrollArea>
      </Modal>
    </Box>
  );
};

export default Servicios;
