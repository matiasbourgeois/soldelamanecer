import React, { useState, useMemo } from "react";
import {
  Container,
  Grid,
  SimpleGrid,
  Text,
  Title,
  Paper,
  Stack,
  Group,
  ThemeIcon,
  ActionIcon,
  Box,
  rem,
  Divider,
  Button,
  Badge,
  Modal,
  ScrollArea,
  TextInput,
  useMantineTheme
} from '@mantine/core';
import {
  Phone,
  Mail,
  MapPin,
  Instagram,
  Facebook,
  Linkedin,
  MessageCircle,
  Clock,
  ShieldCheck,
  TrendingUp,
  Map,
  ChevronRight,
  Building2,
  Search
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

import { useLocalidades } from "@core/hooks/useLocalidades";

const directChannels = [
  {
    icon: <Phone size={22} />,
    title: "Atención Telefónica",
    value: "+54 351 2569550",
    description: "Lunes a Viernes de 08:30 a 18:30 hs",
    color: "cyan",
    link: "tel:543512569550"
  },
  {
    icon: <Mail size={22} />,
    title: "Correo Corporativo",
    value: "logistica@soldelamanecer.ar",
    description: "Consultas comerciales y cotizaciones",
    color: "indigo",
    link: "mailto:logistica@soldelamanecer.ar"
  },
  {
    icon: <FaWhatsapp size={22} />,
    title: "Ventas WhatsApp",
    value: "Centro de Atención",
    description: "Respuesta inmediata para su logística",
    color: "green",
    link: "https://wa.me/543512569550",
    animate: true
  }
];

const normalizeText = (text) =>
  text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const Contacto = () => {
  const [opened, setOpened] = useState(false);
  const [search, setSearch] = useState("");
  const theme = useMantineTheme();
  const { localidades, loading } = useLocalidades();

  // Filtrar y ordenar localidades
  const filteredLocalities = useMemo(() => {
    const sorted = [...localidades].sort((a, b) => a.name.localeCompare(b.name));
    if (!search) return sorted;
    const term = normalizeText(search);
    return sorted.filter(loc => normalizeText(loc.name).includes(term) || loc.cp.includes(term));
  }, [search, localidades]);

  return (
    <Box style={{ flex: 1, backgroundColor: '#fcfcfd', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* SECTION 1: HERO (COMPACT) */}
      <Box
        style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #f1f3f5',
          paddingTop: rem(40),
          paddingBottom: rem(20)
        }}
      >
        <Container size="xl">
          <Stack align="center" gap={5}>
            <Badge variant="dot" color="cyan" size="md" radius="sm">CANALES CORPORATIVOS</Badge>
            <Title order={1} fw={900} size={rem(36)} style={{ letterSpacing: '-1.5px', textAlign: 'center', lineHeight: 1.1 }}>
              Conecte con nuestra <Text component="span" variant="gradient" gradient={{ from: 'cyan', to: 'indigo' }} inherit>Red Logística</Text>
            </Title>
            <Text c="dimmed" size="md" ta="center" style={{ maxWidth: 600, fontWeight: 500 }}>
              Atención personalizada para optimizar su cadena de suministros en toda la provincia.
            </Text>
          </Stack>
        </Container>
      </Box>

      {/* MAIN CONTENT AREA */}
      <Box style={{ flex: 1, overflowY: 'auto' }}>
        <Container size="xl" py={rem(30)}>
          <Grid gutter={30}>
            {/* LEFT: DIRECT CONTACT CHANNELS */}
            <Grid.Col span={{ base: 12, lg: 7 }}>
              <Stack gap="lg">
                <SimpleGrid cols={{ base: 1, sm: 2 }} gap="sm">
                  {directChannels.map((channel, i) => (
                    <Paper
                      key={i}
                      component="a"
                      href={channel.link}
                      target={channel.link.startsWith('http') ? "_blank" : "_self"}
                      p="lg"
                      radius="lg"
                      withBorder
                      shadow="0 2px 10px rgba(0,0,0,0.02)"
                      style={{
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        textDecoration: 'none',
                        color: 'inherit'
                      }}
                    >
                      <Stack gap="sm">
                        <Box className={channel.animate ? "animate-pulse-whatsapp" : ""}>
                          <ThemeIcon
                            size={40}
                            radius="md"
                            color={channel.color}
                            variant="filled"
                          >
                            {channel.icon}
                          </ThemeIcon>
                        </Box>
                        <div>
                          <Text size="xs" fw={700} c="dimmed" tt="uppercase">{channel.title}</Text>
                          <Text fw={800} size="md" c={channel.color + ".9"}>{channel.value}</Text>
                          <Text size="11px" c="dimmed" mt={2}>{channel.description}</Text>
                        </div>
                      </Stack>
                    </Paper>
                  ))}

                  <Paper
                    p="lg"
                    radius="lg"
                    withBorder
                    style={{
                      backgroundColor: '#111827',
                      color: 'white'
                    }}
                  >
                    <Stack gap="xs">
                      <Text fw={800} size="sm">Presencia Digital</Text>
                      <Text size="11px" c="gray.5">Conecte con nuestra comunidad operativa.</Text>
                      <Group gap="xs" mt={4}>
                        <ActionIcon size={36} radius="md" variant="light" color="cyan" component="a" href="https://www.instagram.com/soldelamanecersrl" target="_blank">
                          <Instagram size={18} />
                        </ActionIcon>
                        <ActionIcon size={36} radius="md" variant="light" color="blue" component="a" href="https://www.facebook.com/soldelamanecersrl" target="_blank">
                          <Facebook size={18} />
                        </ActionIcon>
                        <ActionIcon size={36} radius="md" variant="light" color="indigo" component="a" href="https://www.linkedin.com/company/soldelamanecersrl" target="_blank">
                          <Linkedin size={18} />
                        </ActionIcon>
                      </Group>
                    </Stack>
                  </Paper>
                </SimpleGrid>

                {/* COBERTURA TRIGGER */}
                <Paper
                  p="md"
                  radius="lg"
                  withBorder
                  style={{ cursor: 'pointer', backgroundColor: 'white' }}
                  onClick={() => setOpened(true)}
                >
                  <Group justify="space-between">
                    <Group gap="md">
                      <ThemeIcon size={40} radius="md" color="indigo" variant="light">
                        <Map size={20} />
                      </ThemeIcon>
                      <div>
                        <Text fw={700} size="sm">Localidades Cubiertas</Text>
                        <Text size="xs" c="dimmed">Vea el listado completo de destinos en Córdoba</Text>
                      </div>
                    </Group>
                    <ChevronRight size={18} color="lightgray" />
                  </Group>
                </Paper>
              </Stack>
            </Grid.Col>

            {/* RIGHT: HEADQUARTERS */}
            <Grid.Col span={{ base: 12, lg: 5 }}>
              <Paper
                p="xl"
                radius="24px"
                withBorder
                shadow="xs"
                style={{
                  background: 'white',
                  height: '100%',
                  borderTop: `${rem(4)} solid var(--mantine-color-indigo-6)`
                }}
              >
                <Stack gap="lg">
                  <Group justify="space-between" align="flex-start">
                    <Stack gap={2}>
                      <Text fw={700} tt="uppercase" size="xs" c="dimmed">Casa Central</Text>
                      <Title order={2} fw={800} size="h3">Córdoba Capital</Title>
                    </Stack>
                    <Building2 size={24} color="var(--mantine-color-indigo-6)" />
                  </Group>

                  <Box p="md" radius="lg" style={{ backgroundColor: '#f8fafc', border: '1px solid #e9ecef' }}>
                    <Stack gap="xs">
                      <Group wrap="nowrap" align="flex-start" gap="sm">
                        <MapPin size={16} color="var(--mantine-color-indigo-6)" style={{ marginTop: 4 }} />
                        <Text size="sm" fw={600}>Estados Unidos 2657, Barrio San Vicente, Córdoba Capital</Text>
                      </Group>
                      <Group wrap="nowrap" align="center" gap="sm">
                        <Clock size={16} color="var(--mantine-color-cyan-6)" />
                        <Text size="xs" c="dimmed">Atención: Lunes a Viernes 08:30 - 18:30 hs</Text>
                      </Group>
                    </Stack>
                  </Box>

                  <Stack gap="xs">
                    <Text size="xs" fw={700} c="dimmed" tt="uppercase">Presencia Estratégica</Text>
                    <Group gap="xs">
                      <Badge variant="light" color="gray" radius="sm">Río Cuarto / Sur</Badge>
                      <Badge variant="light" color="gray" radius="sm">Villa María / Centro</Badge>
                      <Badge variant="light" color="gray" radius="sm">Mina Clavero / Traslasierra</Badge>
                    </Group>
                  </Stack>

                  <Paper radius="lg" p="sm" bg="blue.0" withBorder style={{ borderColor: theme.colors.blue[1] }}>
                    <Group wrap="nowrap" gap="sm">
                      <ShieldCheck size={14} color={theme.colors.blue[6]} />
                      <Text size="xs" c="blue.8" fw={600}>
                        Operaciones con monitoreo constante y seguro de carga integrado.
                      </Text>
                    </Group>
                  </Paper>
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>

      {/* FOOTER BADGES (COMPACT) */}
      <Box p={rem(20)} style={{ borderTop: '1px solid #f1f3f5', backgroundColor: 'white' }}>
        <Container size="xl">
          <SimpleGrid cols={{ base: 1, md: 3 }} gap="xl">
            <Group gap="sm" wrap="nowrap">
              <ThemeIcon size={32} radius="xl" color="gray.1" c="gray.6">
                <ShieldCheck size={18} />
              </ThemeIcon>
              <Text fw={700} size="xs">Seguridad Certificada</Text>
            </Group>
            <Group gap="sm" wrap="nowrap" justify="center">
              <ThemeIcon size={32} radius="xl" color="gray.1" c="gray.6">
                <TrendingUp size={18} />
              </ThemeIcon>
              <Text fw={700} size="xs">Escalabilidad Real</Text>
            </Group>
            <Group gap="sm" wrap="nowrap" justify="flex-end">
              <ThemeIcon size={32} radius="xl" color="gray.1" c="gray.6">
                <Clock size={18} />
              </ThemeIcon>
              <Text fw={700} size="xs">Compromiso 24/48hs</Text>
            </Group>
          </SimpleGrid>
        </Container>
      </Box>

      {/* MODAL LOCALIDADES */}
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={<Text fw={800} size="lg">Localidades y Frecuencias</Text>}
        size="lg"
        radius="xl"
        centered
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        <ScrollArea h={400} offsetScrollbars>
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
              {loading ? "Actualizando red de distribución..." : "Contamos con una amplia red de distribución en la provincia de Córdoba."}
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

export default Contacto;
