import React from "react";
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
  Divider
} from '@mantine/core';
import {
  Truck,
  ShieldCheck,
  Clock,
  Package,
  Users,
  MapPin,
  BarChart3
} from 'lucide-react';

const servicios = [
  {
    title: "Transporte Nacional",
    description: "Cobertura integral en todo el territorio argentino con flota propia de última generación.",
    icon: <Truck size={30} />,
    color: "blue",
    features: ["Seguimiento Satelital", "Seguro de Carga", "Puerta a Puerta"]
  },
  {
    title: "Logística E-commerce",
    description: "Soluciones ágiles para ventas online, integrando almacenamiento y distribución capilar.",
    icon: <Package size={30} />,
    color: "cyan",
    features: ["Control de Stock", "Picking & Packing", "Entregas 24hs"]
  },
  {
    title: "Distribución Urbana",
    description: "Optimización de rutas en grandes centros urbanos para garantizar tiempos de entrega mínimos.",
    icon: <MapPin size={30} />,
    color: "teal",
    features: ["Zonificación Inteligente", "Micro-distribución", "Prueba de Entrega"]
  },
  {
    title: "Gestión de Depósito",
    description: "Almacenaje seguro con sistemas de gestión de inventarios avanzados (WMS).",
    icon: <BarChart3 size={30} />,
    color: "indigo",
    features: ["Cross-docking", "Inventario Perpetuo", "Seguridad 24hs"]
  }
];

const Servicios = () => {
  return (
    <Box
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        paddingTop: '100px',
        paddingBottom: '80px'
      }}
    >
      <Container size="xl">
        <Stack align="center" gap="xs" mb={80}>
          <Badge size="lg" variant="light" color="cyan" radius="sm" style={{ letterSpacing: '1px' }}>
            EXCELENCIA LOGÍSTICA
          </Badge>
          <Title order={1} fw={900} size={rem(48)} style={{ letterSpacing: '-1.5px', textAlign: 'center' }}>
            Soluciones a la medida de <br />
            <Text component="span" variant="gradient" gradient={{ from: 'cyan', to: 'blue' }} inherit>su negocio</Text>
          </Title>
          <Text c="dimmed" size="lg" ta="center" style={{ maxWidth: 650 }}>
            Combinamos tecnología de vanguardia con décadas de experiencia para ofrecer un servicio
            logístico que supera las expectativas más exigentes.
          </Text>
        </Stack>

        <Grid gutter="xl">
          {servicios.map((svc, index) => (
            <Grid.Col key={index} span={{ base: 12, sm: 6, lg: 3 }}>
              <Card
                shadow="sm"
                padding="xl"
                radius="lg"
                withBorder
                style={{
                  height: '100%',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'default'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0px)';
                  e.currentTarget.style.boxShadow = 'var(--mantine-shadow-sm)';
                }}
              >
                <ThemeIcon
                  size={60}
                  radius="md"
                  variant="light"
                  color={svc.color}
                  mb="xl"
                >
                  {svc.icon}
                </ThemeIcon>

                <Title order={3} mb="sm" fw={800}>{svc.title}</Title>
                <Text size="sm" c="dimmed" mb="xl" style={{ lineHeight: 1.6 }}>
                  {svc.description}
                </Text>

                <Divider mb="lg" variant="dashed" />

                <Stack gap="xs">
                  {svc.features.map((f, i) => (
                    <Group key={i} gap="xs">
                      <Box
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: `var(--mantine-color-${svc.color}-6)`
                        }}
                      />
                      <Text size="xs" fw={600} c="dark.3">{f}</Text>
                    </Group>
                  ))}
                </Stack>
              </Card>
            </Grid.Col>
          ))}
        </Grid>

        {/* CTA Section */}
        <Box
          mt={100}
          p={60}
          style={{
            backgroundColor: '#111827',
            borderRadius: '32px',
            backgroundImage: 'radial-gradient(circle at top right, #1e293b, transparent)',
            color: 'white'
          }}
        >
          <Grid align="center">
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Stack gap="xs">
                <Title order={2} size={rem(32)} fw={800}>Seguridad y confianza en cada km</Title>
                <Text c="gray.4" size="lg">Operamos bajo los más altos estándares de calidad y seguridad para proteger su activos.</Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Group justify="flex-end">
                <ThemeIcon size={80} radius="xl" color="cyan" variant="filled">
                  <ShieldCheck size={40} />
                </ThemeIcon>
              </Group>
            </Grid.Col>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default Servicios;
