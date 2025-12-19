import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Container, Title, SimpleGrid, Card, Text, Group, ThemeIcon, Paper, UnstyledButton, rem, Box
} from "@mantine/core";
import { ClipboardList, FilePlus, Search, ArrowRight, Truck } from "lucide-react";

const GestionHojasReparto = () => {
  const navigate = useNavigate();

  const acciones = [
    {
      titulo: "Crear Hoja de Reparto",
      descripcion: "Seleccioná ruta, chofer y envíos para iniciar el reparto.",
      icono: <FilePlus size={32} />,
      ruta: "/hojas-reparto/crear",
      color: "cyan",
      bgPattern: "linear-gradient(135deg, rgba(21, 170, 191, 0.05) 0%, rgba(21, 170, 191, 0.1) 100%)"
    },
    {
      titulo: "Consultar Hojas de Reparto",
      descripcion: "Buscá hojas por número, estado, fecha o chofer asignado.",
      icono: <Search size={32} />,
      ruta: "/hojas-reparto/consultar",
      color: "blue",
      bgPattern: "linear-gradient(135deg, rgba(34, 139, 230, 0.05) 0%, rgba(34, 139, 230, 0.1) 100%)"
    },
  ];

  return (
    <Container size="xl" py={50}>
      {/* Minimalist Header */}
      <Group justify="space-between" align="flex-end" mb={50}>
        <Box>
          <Group align="center" gap="xs" mb={5}>
            <ThemeIcon variant="light" color="cyan" size="md" radius="md">
              <Truck size={16} />
            </ThemeIcon>
            <Text tt="uppercase" c="cyan" fw={800} fz="xs" ls={1.5}>
              Logística & Distribución
            </Text>
          </Group>
          <Title order={1} style={{ fontSize: rem(42), fontWeight: 900, letterSpacing: '-1.5px', color: 'var(--mantine-color-dark-8)' }}>
            Panel de Hojas de Reparto
          </Title>
          <Text c="dimmed" size="lg" mt={5} maw={600} lh={1.4}>
            Organiza las rutas de distribución. Asigna choferes, vehículos y envíos para garantizar un despacho eficiente y controlado.
          </Text>
        </Box>
      </Group>

      {/* Premium Actions Grid */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing={30}>
        {acciones.map((accion, index) => (
          <Card
            key={index}
            shadow="none" // Custom shadow via style
            padding={30}
            radius={20}
            component={UnstyledButton}
            onClick={() => navigate(accion.ruta)}
            style={{
              border: '1px solid var(--mantine-color-gray-2)',
              background: 'var(--mantine-color-white)',
              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Bouncy premium feel
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-10px)';
              e.currentTarget.style.boxShadow = `0 20px 40px -10px var(--mantine-color-${accion.color}-2)`;
              e.currentTarget.style.borderColor = `var(--mantine-color-${accion.color}-3)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = 'var(--mantine-color-gray-2)';
            }}
          >
            {/* Decorative Background */}
            <div style={{
              position: 'absolute',
              top: 0, right: 0, bottom: 0, left: 0,
              background: accion.bgPattern,
              opacity: 0, // Hidden by default, fade in on hover could be cool, or keep it subtle
              transition: 'opacity 0.3s ease'
            }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
              onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
            />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <Group justify="space-between" align="start" mb={30}>
                <ThemeIcon
                  size={70}
                  radius={20}
                  variant="light"
                  color={accion.color}
                  style={{ transition: 'all 0.3s ease' }}
                >
                  {accion.icono}
                </ThemeIcon>

                <ThemeIcon
                  size="lg"
                  radius="xl"
                  variant="subtle"
                  color={accion.color}
                  className="arrow-icon"
                >
                  <ArrowRight size={22} />
                </ThemeIcon>
              </Group>

              <Title order={3} fw={800} mb={10} style={{ fontSize: rem(24) }}>
                {accion.titulo}
              </Title>

              <Text size="md" c="dimmed" lh={1.5} mb={20}>
                {accion.descripcion}
              </Text>
            </div>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
};

export default GestionHojasReparto;