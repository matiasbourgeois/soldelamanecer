import React, { useEffect } from "react";
import {
  Container,
  Title,
  Text,
  Grid,
  Button,
  ThemeIcon,
  Group,
  Stack,
  ActionIcon,
  Box,
  Paper
} from "@mantine/core";
import {
  IconPhone,
  IconMail,
  IconMapPin,
  IconBrandWhatsapp,
  IconBrandInstagram,
  IconBrandFacebook,
  IconBrandLinkedin
} from "@tabler/icons-react";
import AOS from "aos";
import "aos/dist/aos.css";

const Contacto = () => {
  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      <Container size="xl" w="100%">
        <Grid gutter={60} align="center">

          {/* Lado Izquierdo: Información de Contacto */}
          <Grid.Col span={{ base: 12, md: 6 }} data-aos="fade-right">
            <Box style={{ width: '100%', maxWidth: '550px' }}>
              <Title
                order={1}
                fw={900}
                c="dark"
                mb="xs"
                style={{ fontFamily: 'sans-serif', lineHeight: 1.1 }}
                size={42}
              >
                ESTAMOS <span style={{ color: '#fab005' }}>CONECTADOS</span>
              </Title>
              <Text c="dimmed" size="lg" mb="xl" lh={1.4}>
                Estamos aquí para ayudarte. Ponete en contacto con nosotros a través de los siguientes medios.
              </Text>

              <Stack spacing="xl" mb="xl">
                <Group align="center">
                  <ThemeIcon color="yellow" size={40} radius="xl" variant="light">
                    <IconPhone size={22} />
                  </ThemeIcon>
                  <div>
                    <Text fw={700} c="dark">Teléfono</Text>
                    <Text c="dimmed" size="sm">+54 351 2569550</Text>
                  </div>
                </Group>

                <Group align="center">
                  <ThemeIcon color="yellow" size={40} radius="xl" variant="light">
                    <IconMail size={22} />
                  </ThemeIcon>
                  <div>
                    <Text fw={700} c="dark">Email</Text>
                    <Text c="dimmed" size="sm">logistica@soldelamanecersrl.ar</Text>
                  </div>
                </Group>

                <Group align="center">
                  <ThemeIcon color="yellow" size={40} radius="xl" variant="light">
                    <IconMapPin size={22} />
                  </ThemeIcon>
                  <div>
                    <Text fw={700} c="dark">Dirección</Text>
                    <Text c="dimmed" size="sm">Estados Unidos 2657, Córdoba, Argentina</Text>
                  </div>
                </Group>
              </Stack>

              <Group mt="xl">
                <Button
                  component="a"
                  href="https://wa.me/543512569550"
                  target="_blank"
                  rel="noopener noreferrer"
                  size="md"
                  color="green"
                  radius="md"
                  leftSection={<IconBrandWhatsapp size={20} />}
                >
                  WhatsApp Directo
                </Button>
              </Group>
            </Box>
          </Grid.Col>

          {/* Lado Derecho: Redes y Mapa Visual (Opcional, o solo redes destacado) 
              Vamos a poner un Paper con las redes sociales bien grandes y elegante
          */}
          <Grid.Col span={{ base: 12, md: 6 }} data-aos="fade-left">
            <Paper
              shadow="xl"
              radius="lg"
              p={50}
              style={{
                backgroundColor: '#1A1B1E', // Dark card for contrast
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                minHeight: '350px'
              }}
            >
              <Title order={3} mb="lg" c="white" fw={700}>
                Síguenos en Redes
              </Title>
              <Text c="dimmed" mb="xl" size="sm">
                Descubre nuestras novedades y el día a día de nuestras operaciones.
              </Text>

              <Group gap={30} justify="center">
                <ActionIcon
                  component="a"
                  href="https://www.instagram.com/soldelamanecersrl"
                  target="_blank"
                  size={60}
                  radius="xl"
                  variant="filled"
                  color="yellow"
                  style={{ transition: 'transform 0.2s' }}
                >
                  <IconBrandInstagram size={34} stroke={1.5} />
                </ActionIcon>

                <ActionIcon
                  component="a"
                  href="https://www.facebook.com/soldelamanecersrl"
                  target="_blank"
                  size={60}
                  radius="xl"
                  variant="filled"
                  color="blue"
                >
                  <IconBrandFacebook size={34} stroke={1.5} />
                </ActionIcon>

                <ActionIcon
                  component="a"
                  href="https://www.linkedin.com/company/soldelamanecersrl"
                  target="_blank"
                  size={60}
                  radius="xl"
                  variant="filled"
                  color="indigo"
                >
                  <IconBrandLinkedin size={34} stroke={1.5} />
                </ActionIcon>
              </Group>
            </Paper>
          </Grid.Col>

        </Grid>
      </Container>
    </div>
  );
};

export default Contacto;
