import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Container,
    Title,
    Text,
    TextInput,
    Button,
    UnstyledButton,
    Group,
    ThemeIcon,
    rem,
    Paper,
    Stack,
    Box,
    Badge
} from "@mantine/core";
import { IconPackage, IconSearch, IconArrowRight } from "@tabler/icons-react";

const BuscarSeguimiento = () => {
    const [codigo, setCodigo] = useState("");
    const navigate = useNavigate();

    const handleBuscar = (e) => {
        e.preventDefault();
        if (!codigo.trim()) return;
        navigate(`/seguimiento/resultado/${codigo}`);
    };
    return (
        <div style={{
            height: '100%',
            display: 'flex',
            backgroundColor: 'white',
            flex: 1,
            overflow: 'hidden'
        }}>
            {/* LADO IZQUIERDO: BUSCADOR */}
            <div style={{
                flex: '0 0 45%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: rem(60),
                backgroundColor: 'white',
                zIndex: 2,
                position: 'relative',
                boxShadow: '20px 0 50px rgba(0,0,0,0.02)'
            }}>
                <Container size={400} px={0} m={0} style={{ width: '100%' }}>
                    <Stack gap="xs" mb={35}>
                        <Badge variant="light" color="cyan" size="lg" radius="sm" style={{ alignSelf: 'flex-start' }}>
                            CONSULTA DE ENVÍOS
                        </Badge>
                        <Title order={1} style={{ fontSize: rem(42), fontWeight: 900, letterSpacing: '-1.5px' }}>
                            Seguimiento de <Text span inherit variant="gradient" gradient={{ from: 'cyan', to: 'indigo' }}>pedidos</Text>
                        </Title>
                        <Text c="dimmed" size="md">
                            Ingrese su número de guía para conocer el estado actual y la ubicación de su carga.
                        </Text>
                    </Stack>

                    <form onSubmit={handleBuscar}>
                        <Stack gap="lg">
                            <TextInput
                                size="lg"
                                radius="md"
                                label="Código de Seguimiento"
                                placeholder="SDA-2025-XXXXXX"
                                value={codigo}
                                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                                leftSection={<IconSearch size={22} stroke={1.5} color="var(--mantine-color-cyan-6)" />}
                                styles={{
                                    input: {
                                        height: rem(60),
                                        fontSize: rem(18),
                                        fontWeight: 600,
                                        letterSpacing: rem(1),
                                        backgroundColor: '#f8fafc',
                                        border: '1px solid #e9ecef',
                                        '&:focus': { borderColor: 'var(--mantine-color-cyan-6)' }
                                    },
                                    label: { marginBottom: rem(8), fontWeight: 700 }
                                }}
                            />

                            <Button
                                type="submit"
                                size="lg"
                                radius="md"
                                color="cyan"
                                fullWidth
                                rightSection={<IconArrowRight size={20} />}
                                style={{
                                    height: rem(60),
                                    fontSize: rem(17),
                                    fontWeight: 800,
                                    boxShadow: '0 10px 30px rgba(34, 184, 209, 0.3)',
                                }}
                            >
                                CONSULTAR ESTADO
                            </Button>
                        </Stack>
                    </form>

                    <Group justify="space-between" mt={45}>
                        <UnstyledButton onClick={() => navigate('/contacto')} style={{ fontSize: rem(14), color: 'var(--mantine-color-dimmed)', fontWeight: 600 }}>
                            ¿Problemas con el código?
                        </UnstyledButton>
                        <UnstyledButton onClick={() => navigate('/contacto')} style={{ fontSize: rem(14), color: 'var(--mantine-color-cyan-8)', fontWeight: 700 }}>
                            Soporte al Cliente
                        </UnstyledButton>
                    </Group>
                </Container>
            </div>

            {/* LADO DERECHO: VISUAL IMPACTANTE (MAPS/TRACKING THEME) */}
            <div style={{
                flex: 1,
                background: 'linear-gradient(135deg, #055160 0%, #0b7285 50%, #1098ad 100%)',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
            }}>
                {/* Decoraciones de Mapa/Rutas */}
                <Box style={{
                    position: 'absolute',
                    width: '120%',
                    height: '120%',
                    opacity: 0.1,
                    backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                    transform: 'rotate(15deg)'
                }} />

                <Stack align="center" gap="xl" style={{ p: rem(40), textAlign: 'center', color: 'white', zIndex: 1 }}>
                    <Box style={{
                        padding: rem(35),
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        borderRadius: rem(50),
                        backdropFilter: 'blur(25px)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        boxShadow: '0 50px 100px rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: 'float 6s infinite ease-in-out'
                    }}>
                        <IconPackage size={80} stroke={1} color="white" />
                    </Box>
                    <Box style={{ maxWidth: rem(500) }}>
                        <Title order={2} style={{ fontSize: rem(40), fontWeight: 900, lineHeight: 1.1 }}>
                            Información de Seguimiento
                        </Title>
                        <Text mt="lg" size="xl" c="cyan.0" style={{ opacity: 0.9, fontWeight: 500 }}>
                            Acceda a la trazabilidad detallada de su mercadería a través de nuestra red logística.
                        </Text>
                    </Box>
                </Stack>

                <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0); }
            50% { transform: translateY(-20px) rotate(5deg); }
          }
          @media (max-width: 900px) {
            div[style*="flex: '0 0 45%'"] { flex: 1 !important; padding: 30px !important; }
            div[style*="background: 'linear-gradient"] { display: none !important; }
          }
        `}</style>
            </div>
        </div>
    );
};

export default BuscarSeguimiento;
