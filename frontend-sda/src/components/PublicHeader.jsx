// src/components/PublicHeader.jsx

import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Container, Group, Button, Burger, Drawer, Menu, Text, Stack, Collapse } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconChevronDown, IconShip, IconRoad, IconLogin, IconUserPlus } from '@tabler/icons-react';
import AuthContext from '../context/AuthProvider';
import classes from './PublicHeader.module.css';

const links = [
  { type: 'link', link: '/', label: 'Home' },
  { type: 'link', link: '/servicios', label: 'Servicios' },
  {
    type: 'menu',
    label: 'Cotizador Online',
    menuItems: [
      { link: '/cotizacion-viajes', label: 'Cotización de Viajes', icon: <IconRoad size={16} /> },
      { link: '/cotizacion-encomiendas', label: 'Cotización de Encomiendas', icon: <IconShip size={16} /> },
    ],
  },
  { type: 'link', link: '/seguimiento', label: 'Seguimiento' },
  { type: 'link', link: '/contacto', label: 'Contacto' },
];

export function PublicHeader() {
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const [cotizadorMobileOpened, { toggle: toggleCotizadorMobile }] = useDisclosure(false);

  if (auth?._id && auth?.token) return null;

  const items = links.map((link) => {
    if (link.type === 'menu') {
      return (
        <Menu key={link.label} trigger="hover" transitionProps={{ exitDuration: 0 }} withinPortal>
          <Menu.Target>
            <span className={classes.link}>
              <Text component="span" inherit className={classes.linkLabel}>{link.label}</Text>
              <IconChevronDown size="0.9rem" stroke={1.5} />
            </span>
          </Menu.Target>
          <Menu.Dropdown>
            {link.menuItems.map((item) => (
              <Menu.Item key={item.link} leftSection={item.icon} onClick={() => navigate(item.link)}>
                {item.label}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      );
    }
    return (
      <NavLink
        to={link.link}
        key={link.label}
        className={({ isActive }) => `${classes.link} ${isActive ? classes.linkActive : ''}`}
      >
        <span className={classes.linkLabel}>{link.label}</span>
      </NavLink>
    );
  });

  return (
    <header className={classes.header}>
      <Container size="xl" className={classes.inner}>
        <Text component={NavLink} to="/" className={classes.logo}>
          Sol del Amanecer
        </Text>
        <Group gap={5} className={classes.links}>
          {items}
        </Group>
        <Group className={classes.authButtons} gap="xs">
          <Button variant="default" radius="xl" onClick={() => navigate('/login')}>
            Iniciar Sesión
          </Button>
          <Button radius="xl" className={classes.registerButton} onClick={() => navigate('/registro')}>
            Registrarse
          </Button>
        </Group>
        <Burger opened={drawerOpened} onClick={toggleDrawer} className={classes.burger} size="sm" color="gray" />
      </Container>

      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        size="100%"
        padding="md"
        title="Navegación"
        zIndex={1000}
      >
         <Stack align="center" gap="xl" mt="xl">
            {links.map((link) => {
                if (link.type === 'link') {
                    return <NavLink to={link.link} key={link.label} className={classes.mobileLink} onClick={closeDrawer}>{link.label}</NavLink>
                }
                if (link.type === 'menu') {
                    return (
                        <div key={link.label}>
                            <span className={classes.mobileLink} onClick={toggleCotizadorMobile}>{link.label} <IconChevronDown size={16}/></span>
                            <Collapse in={cotizadorMobileOpened}>
                                {link.menuItems.map(item => (
                                    <NavLink to={item.link} key={item.link} className={classes.mobileSubLink} onClick={closeDrawer}>{item.label}</NavLink>
                                ))}
                            </Collapse>
                        </div>
                    )
                }
            })}
         </Stack>
      </Drawer>
    </header>
  );
}

export default PublicHeader;