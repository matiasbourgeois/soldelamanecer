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
  Group,
  rem
} from '@mantine/core';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from "react-router-dom";

const Inicio = () => {
  const navigate = useNavigate();

  return (
    <Box
      component="main"
      style={{
        flex: 1,
        background: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        paddingTop: rem(70),
        paddingBottom: rem(80) // Equilibra el espacio del Navbar para un centrado óptico perfecto
      }}
    >
      <Container size="xl" py={50}>
        <Grid align="center" gutter={50}>
          {/* Left Content */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="xl">
              <Box>
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
                overflow: 'hidden',
              }}
            >
              <AspectRatio ratio={16 / 9}>
                <video autoPlay loop muted style={{ width: '100%', height: '100%', objectFit: 'cover' }}>
                  <source src="/images/camionetaVideo.mp4" type="video/mp4" />
                  Tu navegador no soporta la reproducción de videos.
                </video>
              </AspectRatio>
            </Box>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
};

export default Inicio;
