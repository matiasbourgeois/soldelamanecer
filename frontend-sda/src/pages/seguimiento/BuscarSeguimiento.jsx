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
        <div style={{ height: '100%', minHeight: '600px', display: 'flex', backgroundColor: '#f8f9fa', flex: 1 }}>

            {/* LEFT SIDE: FORM */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '600px', padding: '40px', backgroundColor: 'white', zIndex: 1 }}>
                <Container size={400} my={30} px={0} style={{ width: '100%' }}>

                    <ThemeIcon
                        size={50}
                        radius={50}
                        variant="light"
                        color="cyan"
                        style={{ marginBottom: rem(20) }}
                    >
                        <IconPackage size={28} stroke={1.5} />
                    </ThemeIcon>

                    <Title order={2} style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: rem(26), lineHeight: 1.2, color: '#212529' }}>
                        Rastrear Envío
                    </Title>
                    <Text c="dimmed" size="sm" mt="xs" mb={30}>
                        Ingresá tu código de seguimiento para ver el estado en tiempo real.
                    </Text>

                    <form onSubmit={handleBuscar}>
                        <Stack gap="sm">
                            <TextInput
                                size="lg"
                                radius="md"
                                placeholder="Ej: SDA-2025-XXXXXX"
                                value={codigo}
                                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                                leftSection={<IconSearch size={20} stroke={1.5} color="var(--mantine-color-gray-5)" />}
                                styles={{
                                    input: {
                                        backgroundColor: '#f8f9fa',
                                        border: '1px solid #e9ecef',
                                        fontSize: rem(16),
                                        fontWeight: 600,
                                        '&:focus': { borderColor: 'var(--mantine-color-cyan-6)' }
                                    }
                                }}
                            />

                            <Button
                                type="submit"
                                size="lg"
                                radius="md"
                                color="cyan"
                                fullWidth
                                rightSection={<IconArrowRight size={18} />}
                                style={{
                                    fontSize: rem(16),
                                    marginTop: rem(5),
                                    transition: 'transform 0.2s ease',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                Consultar Estado
                            </Button>
                        </Stack>
                    </form>

                    <Group justify="space-between" mt={40}>
                        <UnstyledButton onClick={() => navigate('/contacto')} style={{ fontSize: rem(13), color: 'var(--mantine-color-dimmed)', fontWeight: 500 }}>
                            ¿Problemas para rastrear?
                        </UnstyledButton>
                        <UnstyledButton onClick={() => navigate('/contacto')} style={{ fontSize: rem(13), color: 'var(--mantine-color-cyan-7)', fontWeight: 600 }}>
                            Contactar Soporte
                        </UnstyledButton>
                    </Group>

                </Container>
            </div>

            {/* RIGHT SIDE: HERO IMAGE */}
            <div style={{
                flex: 1,
                background: 'linear-gradient(135deg, #1098ad 0%, #0b7285 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Abstract Pattern Overlay */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.15) 0%, transparent 40%)',
                    zIndex: 0
                }} />

                <Box style={{ position: 'relative', zIndex: 1, textAlign: 'center', color: 'white', padding: '40px' }}>
                    <Title order={1} style={{ fontSize: rem(36), fontWeight: 900, letterSpacing: '-1px', whiteSpace: 'nowrap' }}>
                        Seguimiento
                    </Title>
                    <Text size="xl" mt="xl" style={{ opacity: 0.9, maxWidth: 500, marginInline: 'auto' }}>
                        Monitorizá cada paso de tu envío con la tecnología de Sol del Amanecer.
                    </Text>
                </Box>
            </div>

            {/* Mobile Breakpoint Hiding */}
            <style>{`
                @media (max-width: 900px) {
                    div[style*="linear-gradient"] { display: none !important; }
                    div[style*="maxWidth: '600px'"] { maxWidth: '100%' !important; flex: 1; }
                }
            `}</style>
        </div>
    );
};

export default BuscarSeguimiento;
