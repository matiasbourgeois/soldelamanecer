import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Group,
  Button,
  Box,
  Text,
  Burger,
  Drawer,
  Stack,
  Transition,
  rem,
  useMantineTheme,
  Divider
} from '@mantine/core';
import { useDisclosure, useWindowScroll } from '@mantine/hooks';
import { LogIn, UserPlus, Home, Info, Calculator, Package, Phone } from 'lucide-react';
import AuthContext from "@core/context/AuthProvider";

const Navbar = () => {
  const { auth } = useContext(AuthContext);
  const theme = useMantineTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [opened, { toggle, close }] = useDisclosure(false);
  const [scroll] = useWindowScroll();

  // Si está logueado, no mostramos esta navbar pública porque ya existe AppLayout
  if (auth?._id && auth?.token) return null;

  const scrolled = scroll.y > 20;

  const navLinks = [
    { label: "Home", path: "/", icon: <Home size={18} /> },
    { label: "Servicios", path: "/servicios", icon: <Info size={18} /> },
    { label: "Cotizador Online", path: "/cotizador-online", icon: <Calculator size={18} /> },
    { label: "Seguimiento", path: "/seguimiento", icon: <Package size={18} /> },
    { label: "Contacto", path: "/contacto", icon: <Phone size={18} /> },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <Box
      component="nav"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: (location.pathname !== '/' || scrolled) ? 'white' : 'transparent',
        backdropFilter: (location.pathname !== '/' || scrolled) ? 'blur(12px)' : 'none',
        borderBottom: (location.pathname !== '/' || scrolled) ? `1px solid ${theme.colors.gray[2]}` : 'none',
        transition: 'all 0.3s ease',
        height: rem(70),
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <Container size="xl" style={{ width: '100%' }}>
        <Group justify="space-between">
          {/* Logo */}
          <Group
            gap="xs"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            <Text
              fw={900}
              size="lg"
              ls={-0.5}
              c="dark.4"
              style={{
                fontFamily: 'Inter, sans-serif',
                textTransform: 'uppercase'
              }}
            >
              Sol del Amanecer
            </Text>
          </Group>

          {/* Desktop Menu */}
          <Group gap="md" visibleFrom="md">
            {navLinks.map((link) => (
              <Button
                key={link.path}
                variant="subtle"
                color={isActive(link.path) ? "cyan" : "gray"}
                onClick={() => navigate(link.path)}
                styles={{
                  root: {
                    fontWeight: isActive(link.path) ? 700 : 500,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: theme.colors.cyan[0],
                      color: theme.colors.cyan[7]
                    }
                  }
                }}
              >
                {link.label}
              </Button>
            ))}

            <Box style={{ width: 1, height: 24, backgroundColor: theme.colors.gray[3], margin: '0 10px' }} />

            <Button
              variant="filled"
              color="cyan"
              radius="md"
              leftSection={<LogIn size={16} />}
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
            <Button
              variant="outline"
              color="cyan"
              radius="md"
              leftSection={<UserPlus size={16} />}
              onClick={() => navigate('/registro')}
            >
              Registro
            </Button>
          </Group>

          {/* Mobile Burger */}
          <Burger opened={opened} onClick={toggle} hiddenFrom="md" size="sm" />
        </Group>
      </Container>

      {/* Mobile Menu Drawer */}
      <Drawer
        opened={opened}
        onClose={close}
        size="100%"
        padding="md"
        title={
          <Group gap="xs">
            <Text fw={800}>MENÚ PRINCIPAL</Text>
          </Group>
        }
        hiddenFrom="md"
      >
        <Stack gap="md" mt="xl">
          {navLinks.map((link) => (
            <Button
              key={link.path}
              variant={isActive(link.path) ? "light" : "subtle"}
              color="cyan"
              size="lg"
              fullWidth
              justify="flex-start"
              leftSection={link.icon}
              onClick={() => {
                navigate(link.path);
                close();
              }}
            >
              {link.label}
            </Button>
          ))}

          <Divider my="md" label="Cuenta" labelPosition="center" />

          <Button
            variant="filled"
            color="cyan"
            size="lg"
            fullWidth
            onClick={() => { navigate('/login'); close(); }}
          >
            Iniciar Sesión
          </Button>
          <Button
            variant="outline"
            color="cyan"
            size="lg"
            fullWidth
            onClick={() => { navigate('/registro'); close(); }}
          >
            Crear Cuenta
          </Button>
        </Stack>
      </Drawer>
    </Box>
  );
};

export default Navbar;
