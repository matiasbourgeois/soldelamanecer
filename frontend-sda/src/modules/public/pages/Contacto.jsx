import React from "react";
import {
  Container,
  Grid,
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
  Button
} from '@mantine/core';
import {
  Phone,
  Mail,
  MapPin,
  Instagram,
  Facebook,
  Linkedin,
  MessageCircle
} from 'lucide-react';

const Contacto = () => {
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
        <Grid gutter={80}>
          {/* Left: Contact Info */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="xl">
              <Box>
                <Text fw={700} tt="uppercase" ls={1.5} size="sm" c="cyan.6" mb="xs">
                  Atención Personalizada
                </Text>
                <Title order={1} fw={900} size={rem(48)} style={{ letterSpacing: '-1.5px', lineHeight: 1.1 }}>
                  Hablemos de su <br />
                  <Text component="span" variant="gradient" gradient={{ from: 'cyan', to: 'blue' }} inherit>próximo envío</Text>
                </Title>
              </Box>

              <Text size="lg" c="dimmed" style={{ maxWidth: 500 }}>
                Nuestro equipo comercial y operativo está disponible para resolver sus dudas y coordinar sus necesidades logísticas.
              </Text>

              <Stack gap="lg" mt="md">
                <Paper withBorder p="md" radius="md">
                  <Group wrap="nowrap">
                    <ThemeIcon size={44} radius="md" color="cyan" variant="light">
                      <Phone size={20} />
                    </ThemeIcon>
                    <div>
                      <Text size="xs" fw={700} c="dimmed" tt="uppercase">Teléfono Central</Text>
                      <Text fw={700}>+54 351 2569550</Text>
                    </div>
                  </Group>
                </Paper>

                <Paper withBorder p="md" radius="md">
                  <Group wrap="nowrap">
                    <ThemeIcon size={44} radius="md" color="cyan" variant="light">
                      <Mail size={20} />
                    </ThemeIcon>
                    <div>
                      <Text size="xs" fw={700} c="dimmed" tt="uppercase">Correo Electrónico</Text>
                      <Text fw={700}>logistica@soldelamanecersrl.ar</Text>
                    </div>
                  </Group>
                </Paper>

                <Paper withBorder p="md" radius="md">
                  <Group wrap="nowrap">
                    <ThemeIcon size={44} radius="md" color="cyan" variant="light">
                      <MapPin size={20} />
                    </ThemeIcon>
                    <div>
                      <Text size="xs" fw={700} c="dimmed" tt="uppercase">Oficina Central</Text>
                      <Text fw={700}>Estados Unidos 2657, Córdoba, Argentina</Text>
                    </div>
                  </Group>
                </Paper>
              </Stack>

              <Button
                size="xl"
                radius="md"
                color="green"
                leftSection={<MessageCircle size={24} />}
                component="a"
                href="https://wa.me/543512569550"
                target="_blank"
              >
                Contactar por WhatsApp
              </Button>
            </Stack>
          </Grid.Col>

          {/* Right: Social & Maps placeholder */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper
              shadow="xl"
              radius="32px"
              p={50}
              style={{
                backgroundColor: '#111827',
                backgroundImage: 'radial-gradient(circle at bottom left, #1e293b, transparent)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                color: 'white'
              }}
            >
              <Title order={2} mb="xl" fw={800}>Síganos en Redes</Title>
              <Text c="gray.4" mb={40} size="lg">Conozca nuestra flota y el día a día de nuestra operación logística a través de nuestros canales oficiales.</Text>

              <Group gap={30} justify="center">
                <ActionIcon
                  size={70}
                  radius="xl"
                  variant="light"
                  color="cyan"
                  component="a"
                  href="https://www.instagram.com/soldelamanecersrl"
                  target="_blank"
                  style={{ transition: 'all 0.2s ease' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <Instagram size={32} />
                </ActionIcon>

                <ActionIcon
                  size={70}
                  radius="xl"
                  variant="light"
                  color="blue"
                  component="a"
                  href="https://www.facebook.com/soldelamanecersrl"
                  target="_blank"
                  style={{ transition: 'all 0.2s ease' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <Facebook size={32} />
                </ActionIcon>

                <ActionIcon
                  size={70}
                  radius="xl"
                  variant="light"
                  color="indigo"
                  component="a"
                  href="https://www.linkedin.com/company/soldelamanecersrl"
                  target="_blank"
                  style={{ transition: 'all 0.2s ease' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <Linkedin size={32} />
                </ActionIcon>
              </Group>

              <Box mt={60} w="100%">
                <Divider mb="xl" label="Ubicación" labelPosition="center" color="gray.8" />
                <Paper radius="lg" overflow="hidden" style={{ height: 200, backgroundColor: '#1e293b' }}>
                  {/* Placeholder for Map or Visual image */}
                  <Group justify="center" h="100%" align="center">
                    <Stack gap={5} align="center">
                      <MapPin size={40} color="var(--mantine-color-cyan-6)" />
                      <Text size="xs" fw={700} c="gray.5">CÓRDOBA, ARGENTINA</Text>
                    </Stack>
                  </Group>
                </Paper>
              </Box>
            </Paper>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
};

export default Contacto;
