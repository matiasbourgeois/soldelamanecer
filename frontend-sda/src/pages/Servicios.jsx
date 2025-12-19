import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Title,
  Text,
  Grid,
  Button,
  ThemeIcon,
  List,
  Image,
  Group,
  Box
} from "@mantine/core";
import { IconTruckDelivery, IconShieldCheck, IconFriends } from "@tabler/icons-react";
import AOS from "aos";
import "aos/dist/aos.css";

// Revertir a la imagen original del sistema
const IMG_SOURCE = "/images/cajasLogistica.png";

const Servicios = () => {
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
        <Grid gutter={50} align="stretch" justify="center">

          {/* Lado Imagen */}
          <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 2, md: 2 }} data-aos="fade-left" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Image
              src={IMG_SOURCE}
              alt="Logística"
              h="100%"
              w="auto"
              fit="contain"
              style={{ maxHeight: '450px' }}
            />
          </Grid.Col>

          {/* Lado Texto */}
          <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 1, md: 1 }} data-aos="fade-right" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {/* Wrapper para limitar el ancho al Título ("LOGÍSTICA INTEGRADA") aprox 530px */}
            <Box style={{ width: '100%', maxWidth: '530px' }}>
              <Title
                order={1}
                fw={900}
                c="dark"
                mb="xs"
                style={{ fontFamily: 'sans-serif', lineHeight: 1.1 }}
                size={40}
              >
                LOGÍSTICA <span style={{ color: '#fab005' }}>INTEGRADA</span>
              </Title>
              <Text c="dimmed" size="lg" mb="lg" lh={1.3}>
                Conexiones estratégicas. Tu carga segura y a tiempo, fluyendo a través de nuestra red inteligente.
              </Text>

              <List
                spacing="sm"
                size="md"
                center
                mb="lg"
                icon={
                  <ThemeIcon color="yellow" size={24} radius="xl">
                    <IconTruckDelivery size={14} />
                  </ThemeIcon>
                }
              >
                <List.Item
                  icon={
                    <ThemeIcon color="yellow" size={26} radius="xl" variant="light">
                      <IconTruckDelivery size={16} />
                    </ThemeIcon>
                  }
                >
                  <Text fw={700}>Envíos Express Garantizados</Text>
                </List.Item>

                <List.Item
                  icon={
                    <ThemeIcon color="yellow" size={26} radius="xl" variant="light">
                      <IconShieldCheck size={16} />
                    </ThemeIcon>
                  }
                >
                  <Text fw={700}>Seguridad Punto a Punto</Text>
                </List.Item>

                <List.Item
                  icon={
                    <ThemeIcon color="yellow" size={26} radius="xl" variant="light">
                      <IconFriends size={16} />
                    </ThemeIcon>
                  }
                >
                  <Text fw={700}>Gestión Corporativa</Text>
                </List.Item>
              </List>

              {/* Botones: Mismo ancho (grow) y dentro del Box limitado */}
              <Group mt="xl" grow>
                <Button
                  component={Link}
                  to="/Contacto"
                  size="md"
                  color="dark"
                  radius="md"
                  variant="default"
                >
                  Contactanos
                </Button>

                <Button
                  component={Link}
                  to="/cotizador-online"
                  size="md"
                  color="yellow"
                  radius="md"
                  variant="filled"
                >
                  Cotizar Ahora Online
                </Button>
              </Group>
            </Box>
          </Grid.Col>
        </Grid>
      </Container>
    </div>
  );
};

export default Servicios;
