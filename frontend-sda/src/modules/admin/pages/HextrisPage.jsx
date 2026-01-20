import React from 'react';
import { Container, Title, Text, Stack, Group, ThemeIcon, Paper, Button } from '@mantine/core';
import { Gamepad2, Info } from 'lucide-react';
import HextrisGame from '../components/HextrisGame';
import { useNavigate } from 'react-router-dom';

const HextrisPage = () => {
    const navigate = useNavigate();

    return (
        <Container size="xl" py="xl">
            <Stack gap="xl" align="center">
                {/* Header Section */}
                <Group justify="space-between" w="100%" wrap="nowrap">
                    <Group>
                        <ThemeIcon size={50} radius="md" variant="gradient" gradient={{ from: 'cyan', to: 'blue' }}>
                            <Gamepad2 size={32} />
                        </ThemeIcon>
                        <div>
                            <Title order={2} fw={900} style={{ letterSpacing: '-0.5px' }}>
                                Zona de Recreo: Hextris
                            </Title>
                            <Text size="sm" c="dimmed" fw={500}>
                                Un desafío hexagonal para agilizar la mente administrativa.
                            </Text>
                        </div>
                    </Group>
                    <Button variant="light" color="gray" onClick={() => navigate('/dashboard/admin')}>
                        Volver al Panel
                    </Button>
                </Group>

                {/* Game Container */}
                <HextrisGame />

                {/* Instructions / Footer */}
                <Paper p="lg" radius="md" withBorder bg="gray.0" w="100%" style={{ maxWidth: 900 }}>
                    <Group align="flex-start" wrap="nowrap">
                        <ThemeIcon variant="light" color="cyan" radius="xl">
                            <Info size={18} />
                        </ThemeIcon>
                        <div>
                            <Text fw={700} size="sm" mb={4}>Cómo Jugar:</Text>
                            <Text size="xs" c="dimmed">
                                Utiliza las <b>flechas izquierda y derecha</b> para rotar el hexágono.
                                Combina 3 o más bloques del mismo color para borrarlos.
                                ¡No dejes que los bloques salgan del borde del hexágono gris!
                            </Text>
                        </div>
                    </Group>
                </Paper>
            </Stack>
        </Container>
    );
};

export default HextrisPage;
