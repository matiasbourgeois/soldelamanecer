import React from "react";
import {
  Container,
  Grid,
  Title,
  Text,
  Box,
  AspectRatio,
  Stack,
  Button,
  Group
} from '@mantine/core';
import { ChevronRight, Truck } from 'lucide-react';
import { useNavigate } from "react-router-dom";

const Inicio = () => {
  const navigate = useNavigate();

  return (
    <Box
      component="main"
      style={{
        minHeight: 'calc(100vh - 60px)',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <Container size="xl" py={50}>
        <Grid align="center" gutter={50}>
          {/* Left Content */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="xl">
              <Box>
                <Group gap="xs" mb="md">
                  <Truck size={20} color="var(--mantine-color-cyan-6)" />
                  <Text fw={700} tt="uppercase" ls={1.5} size="sm" c="cyan.6">
                    Logística de Confianza
                  </Text>
                </Group>
                <Title
                  order={1}
                  style={{
                    fontSize: 'clamp(2.5rem, 5vw, 3.8rem)',
                    lineHeight: 1.1,
                    color: '#1e293b',
                    fontWeight: 900,
                    letterSpacing: '-1.5px'
                  }}
                >
                  Soluciones logísticas <br />
                  <Text
                    component="span"
                    variant="gradient"
                    gradient={{ from: 'cyan', to: 'blue', deg: 45 }}
                    inherit
                  >
                    integrales
                  </Text> para su negocio.
                </Title>
              </Box>

              <Text size="lg" c="dimmed" style={{ maxWidth: 500 }}>
                Optimizamos su cadena de suministro con tecnología de vanguardia y una flota comprometida con la excelencia en cada entrega.
              </Text>

              <Group gap="md">
                <Button
                  size="xl"
                  radius="md"
                  color="cyan"
                  rightSection={<ChevronRight size={20} />}
                  onClick={() => navigate('/servicios')}
                  style={{ transition: 'transform 0.2s ease' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0px)'}
                >
                  Nuestros Servicios
                </Button>
                <Button
                  size="xl"
                  radius="md"
                  variant="outline"
                  color="gray"
                  onClick={() => navigate('/seguimiento')}
                >
                  Seguir Envío
                </Button>
              </Group>
            </Stack>
          </Grid.Col>

          {/* Right Media */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Box
              style={{
                position: 'relative',
                borderRadius: '32px',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                border: '8px solid white'
              }}
            >
              <AspectRatio ratio={16 / 9}>
                <video autoPlay loop muted style={{ width: '100%', height: '100%', objectFit: 'cover' }}>
                  <source src="/images/camionetaVideo.mp4" type="video/mp4" />
                  Tu navegador no soporta la reproducción de videos.
                </video>
              </AspectRatio>

              {/* Floating Badge Example */}
              <Box
                style={{
                  position: 'absolute',
                  bottom: 20,
                  left: 20,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  padding: '12px 20px',
                  borderRadius: '16px',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}
              >
                <Box
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: '#10b981'
                  }}
                />
                <Text fw={700} size="sm" c="dark.4">Flota Activa 24/7</Text>
              </Box>
            </Box>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
};

export default Inicio;
