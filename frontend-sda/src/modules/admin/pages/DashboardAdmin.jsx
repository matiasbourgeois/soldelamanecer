import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  SimpleGrid,
  Card,
  Text,
  Title,
  Group,
  rem,
  ThemeIcon,
  Stack,
  Box
} from "@mantine/core";
import {
  IconUsers,
  IconChartBar,
  IconSettings,
  IconChevronRight
} from "@tabler/icons-react";

/**
 * Panel de Administración (Refactorizado a Mantine)
 * Acceso centralizado a la gestión de la plataforma.
 */
const DashboardAdmin = () => {
  const navigate = useNavigate();

  const items = [
    {
      title: "Gestión de Usuarios",
      description: "Ver, editar y administrar roles de los usuarios del sistema.",
      icon: IconUsers,
      color: "cyan",
      path: "/admin/usuarios"
    },
    {
      title: "Reportes",
      description: "Visualizar estadísticas de envíos, métricas y actividad general.",
      icon: IconChartBar,
      color: "indigo",
      path: "/admin/reportes"
    },
    {
      title: "Configuración",
      description: "Ajustes de la plataforma y parámetros operacionales.",
      icon: IconSettings,
      color: "gray",
      path: null // Próximamente
    },
  ];

  return (
    <Container size="lg" py={rem(60)}>
      <Box mb={rem(40)}>
        <Title order={1} fw={900} style={{ letterSpacing: '-1.5px', fontSize: rem(36) }}>
          Panel de <Text span inherit variant="gradient" gradient={{ from: 'cyan', to: 'indigo' }}>Administración</Text>
        </Title>
        <Text c="dimmed" size="lg" fw={500} mt="xs">
          Gestioná los recursos y visualizá el rendimiento de Sol del Amanecer.
        </Text>
      </Box>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl">
        {items.map((item) => (
          <Card
            key={item.title}
            p="xl"
            radius="lg"
            withBorder
            style={{
              cursor: item.path ? 'pointer' : 'default',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              opacity: item.path ? 1 : 0.7
            }}
            onClick={() => item.path && navigate(item.path)}
            onMouseEnter={(e) => {
              if (item.path) {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.08)';
              }
            }}
            onMouseLeave={(e) => {
              if (item.path) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            <Stack gap="xl">
              <Group justify="space-between" align="flex-start">
                <ThemeIcon
                  size={54}
                  radius="md"
                  variant="light"
                  color={item.color}
                >
                  <item.icon size={28} stroke={1.5} />
                </ThemeIcon>
                {item.path && (
                  <IconChevronRight size={18} color="var(--mantine-color-gray-4)" />
                )}
              </Group>

              <div>
                <Text fw={800} size="lg" mb={4}>
                  {item.title}
                </Text>
                <Text size="sm" c="dimmed" style={{ lineHeight: 1.5 }}>
                  {item.description}
                </Text>
              </div>

              {!item.path && (
                <Text size="xs" fw={700} c="gray.5" tt="uppercase">
                  Próximamente
                </Text>
              )}
            </Stack>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
};

export default DashboardAdmin;
