import React, { useState } from 'react';
import { Container, Title, Text, Stack, Group, ThemeIcon, Paper, Button, SimpleGrid, Card, Image, Badge, Box, Divider, ScrollArea } from '@mantine/core';
import { Gamepad2, Info, ArrowLeft, PlayCircle, Keyboard, Trophy, MousePointer2 } from 'lucide-react';
import GameBridge from '../components/GameBridge';

const GAMES = [
    {
        id: 'doom',
        title: 'DOOM',
        description: 'FPS legendario (1993).',
        image: 'https://upload.wikimedia.org/wikipedia/en/5/57/Doom_cover_art.jpg',
        url: '/games/doom/index.html',
        ratio: 16 / 10,
        color: 'red',
        category: 'FPS / Clásico',
        instructions: [
            { icon: <Keyboard size={16} />, text: 'Flechas para moverte' },
            { icon: <Keyboard size={16} />, text: 'Control: Disparar, Espacio: Puertas' }
        ]
    },
    {
        id: 'descent',
        title: 'Descent',
        description: 'Combate espacial 360° (1995).',
        url: '/games/descent/index.html',
        image: 'https://archive.org/services/img/msdos_Descent_1995',
        color: 'blue',
        category: 'Simulación / 3D',
        instructions: [
            { icon: <Keyboard size={16} />, text: 'A/Z: Acelerar/Frenar' },
            { icon: <Keyboard size={16} />, text: 'Flechas: Girar nave' }
        ]
    },
    {
        id: 'heretic',
        title: 'Heretic',
        description: 'FPS de fantasía oscura con el motor de DOOM.',
        url: '/games/heretic/index.html',
        image: 'https://archive.org/services/img/msdos_Heretic_1994',
        color: 'grape',
        category: 'FPS / Fantasía',
        instructions: [
            { icon: <Keyboard size={16} />, text: 'Flechas: Mover, Ctrl: Disparar' }
        ]
    },
    {
        id: 'rampage',
        title: 'Alien Rampage',
        description: 'Brutal shooter de desplazamiento lateral.',
        url: '/games/rampage/index.html',
        image: 'https://archive.org/services/img/msdos_Alien_Rampage_1996',
        color: 'green',
        category: 'Acción / Shooter',
        instructions: [
            { icon: <Keyboard size={16} />, text: 'Ctrl: Disparar, Alt: Saltar' }
        ]
    },
    {
        id: 'lemmings',
        title: 'Lemmings',
        description: 'Salva a las criaturas antes de que caigan.',
        url: '/games/lemmings/index.html',
        image: 'https://archive.org/services/img/msdos_Lemmings_1991',
        color: 'blue',
        category: 'Puzzle',
        instructions: [
            { icon: <MousePointer2 size={16} />, text: 'Clic para asignar tareas' }
        ]
    },
    {
        id: 'wolf3d',
        title: 'Wolfenstein 3D',
        description: 'El clásico que inició todo.',
        url: '/games/wolf3d/index.html',
        image: 'https://archive.org/services/img/msdos_Wolfenstein_3D_1992',
        color: 'gray',
        category: 'FPS / Retro',
        instructions: [
            { icon: <Keyboard size={16} />, text: 'Flechas para moverte' },
            { icon: <Keyboard size={16} />, text: 'Ctrl para disparar' }
        ]
    },
    {
        id: 'prince',
        title: 'Prince of Persia',
        description: 'Animaciones fluidas y trampas mortales.',
        url: '/games/prince/index.html',
        image: 'https://archive.org/services/img/msdos_Prince_of_Persia_1990',
        color: 'orange',
        category: 'Plataformas',
        instructions: [
            { icon: <Keyboard size={16} />, text: 'Shift/Espacio para acción' }
        ]
    },
    {
        id: 'tetris',
        title: 'Tetris Classic',
        description: 'El puzzle soviético original y adictivo.',
        url: '/games/tetris/index.html',
        image: 'https://archive.org/services/img/msdos_Tetris_Classic_1992',
        color: 'blue',
        category: 'Puzzle',
        instructions: [
            { icon: <Keyboard size={16} />, text: 'Flechas: Mover/Rotar' }
        ]
    },
    {
        id: 'bubble',
        title: 'Bubble Bobble',
        description: 'El clásico original del dinosaurio (Sapo) que tira burbujas.',
        url: '/games/bubble/index.html',
        image: 'https://archive.org/services/img/msdos_Bubble_Bobble_1988',
        color: 'green',
        category: 'Plataformas / Bubble',
        instructions: [
            { icon: <Keyboard size={16} />, text: 'Flechas: Mover, Ctrl: Burbuja' }
        ]
    },
    {
        id: 'sf2',
        title: 'Super Street Fighter II',
        description: 'La versión definitiva Turbo (DOS).',
        url: '/games/sf2/index.html',
        image: 'https://archive.org/services/img/msdos_Super_Street_Fighter_II_Turbo_1995',
        color: 'red',
        category: 'Lucha / Arcade',
        instructions: [
            { icon: <Keyboard size={16} />, text: 'Teclado para golpes' }
        ]
    },
    {
        id: 'mk',
        title: 'Mortal Kombat',
        description: 'Combate brutal. Fatality.',
        url: '/games/mk/index.html',
        image: 'https://archive.org/services/img/msdos_Mortal_Kombat_1993',
        color: 'red',
        category: 'Lucha',
        instructions: [
            { icon: <Keyboard size={16} />, text: 'Bloqueo y Golpes' }
        ]
    },
    {
        id: 'aladdin',
        title: 'Aladdin (Disney)',
        description: 'Una joya de la animación y la música.',
        url: '/games/aladdin/index.html',
        image: 'https://archive.org/services/img/msdos_Disneys_Aladdin_1994',
        color: 'yellow',
        category: 'Plataformas',
        instructions: [
            { icon: <Keyboard size={16} />, text: 'Ctrl: Espada, Alt: Manzanas' }
        ]
    }
];

const AdminArcade = () => {
    const [selectedGame, setSelectedGame] = useState(null);

    const activeGame = GAMES.find(g => g.id === selectedGame);

    return (
        <Box style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {!selectedGame ? (
                /* MENU VIEW */
                /* MENU VIEW */
                <Box p="xl" style={{ flex: 1, width: '100%', overflowY: 'auto', backgroundColor: 'var(--mantine-color-gray-0)' }}>
                    <Stack gap="xl" maw={1400} mx="auto">
                        <Group justify="center" mb="lg">
                            <ThemeIcon size={80} radius="xl" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }} style={{ boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
                                <Gamepad2 size={48} />
                            </ThemeIcon>
                            <Box>
                                <Title order={1} fw={900} size={42} style={{ letterSpacing: '-1px', color: '#2C2E33', lineHeight: 1 }}>
                                    ADMIN <span style={{ color: 'var(--mantine-color-blue-6)' }}>ARCADE</span>
                                </Title>
                                <Text c="dimmed" size="lg" ta="center" fw={500} style={{ letterSpacing: '0.5px' }}>Zona de Recreo • Oficial</Text>
                            </Box>
                        </Group>

                        <SimpleGrid cols={{ base: 1, xs: 2, md: 3, lg: 4 }} spacing={24} verticalSpacing={24} w="100%">
                            {GAMES.map((game) => (
                                <Card
                                    key={game.id}
                                    shadow="sm"
                                    padding="0"
                                    radius="lg"
                                    withBorder
                                    style={{
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        backgroundColor: 'white',
                                        overflow: 'hidden',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        '&:hover': {
                                            transform: 'translateY(-5px)',
                                            boxShadow: '0 20px 30px rgba(0,0,0,0.1)',
                                            borderColor: `var(--mantine-color-${game.color}-4)`
                                        }
                                    }}
                                    onClick={() => setSelectedGame(game.id)}
                                >
                                    <Box style={{ position: 'relative', overflow: 'hidden', height: 150 }}>
                                        <Image
                                            src={game.image}
                                            height={150}
                                            alt={game.title}
                                            fallbackSrc={`https://placehold.co/600x400/1a1a1b/white?text=${game.title}`}
                                            style={{ transition: 'transform 0.5s ease' }}
                                        />
                                        <Badge
                                            style={{ position: 'absolute', top: 10, right: 10, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                                            color={game.color}
                                            variant="filled"
                                            size="sm"
                                        >
                                            {game.category}
                                        </Badge>
                                    </Box>

                                    <Stack p="md" gap="xs" style={{ flex: 1 }}>
                                        <Title order={4} fw={700}>{game.title}</Title>
                                        <Text size="sm" c="dimmed" lineClamp={2} style={{ flex: 1 }}>
                                            {game.description}
                                        </Text>

                                        <Button
                                            fullWidth
                                            radius="md"
                                            color={game.color}
                                            variant="light"
                                            size="sm"
                                            className="play-button"
                                            leftSection={<PlayCircle size={18} />}
                                            style={{ transition: 'all 0.2s', fontWeight: 600 }}
                                        >
                                            Jugar Ahora
                                        </Button>
                                    </Stack>
                                </Card>
                            ))}
                        </SimpleGrid>
                    </Stack>
                </Box>
            ) : (
                /* GAME PLAY VIEW (SPLIT SCREEN) */
                <Box style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100%', backgroundColor: 'white' }}>
                    {/* Main Game Area */}
                    <Box style={{ flex: 1, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <GameBridge url={activeGame.url} title={activeGame.title} ratio={activeGame.ratio} />
                    </Box>

                    {/* Side Info Panel */}
                    <Paper
                        w={300}
                        radius={0}
                        style={{
                            borderLeft: '1px solid var(--mantine-color-gray-3)',
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: 'white',
                            zIndex: 10,
                            boxShadow: '-4px 0 12px rgba(0,0,0,0.05)'
                        }}
                    >
                        <ScrollArea style={{ flex: 1 }} p="xl">
                            <Stack gap="xl">
                                <Button
                                    leftSection={<ArrowLeft size={16} />}
                                    variant="subtle"
                                    color="gray"
                                    onClick={() => setSelectedGame(null)}
                                    w="fit-content"
                                >
                                    Volver al Menú
                                </Button>

                                <Box>
                                    <Badge color={activeGame.color} mb="xs">{activeGame.category}</Badge>
                                    <Title order={2}>{activeGame.title}</Title>
                                    <Text size="sm" c="dimmed" mt="xs">
                                        {activeGame.description}
                                    </Text>
                                </Box>

                                <Divider label="Controles" labelPosition="center" />

                                <Stack gap="md">
                                    {activeGame.instructions.map((inst, idx) => (
                                        <Group key={idx} wrap="nowrap" gap="sm">
                                            <ThemeIcon size="sm" variant="light" color={activeGame.color} radius="xl">
                                                {inst.icon ? inst.icon : <Keyboard size={16} />}
                                            </ThemeIcon>
                                            <Text size="sm" fw={500}>{inst.text}</Text>
                                        </Group>
                                    ))}
                                </Stack>

                                <Divider label="Recomendación" labelPosition="center" />

                                <Paper bg="blue.0" p="md" radius="md" withBorder style={{ borderColor: 'var(--mantine-color-blue-2)' }}>
                                    <Group wrap="nowrap" gap="sm" align="flex-start">
                                        <Info size={18} color="var(--mantine-color-blue-6)" style={{ marginTop: 2 }} />
                                        <Text size="xs" c="blue.9" fw={500}>
                                            Si el juego no reacciona al teclado, haz clic una vez sobre la pantalla del juego para activarlo.
                                        </Text>
                                    </Group>
                                </Paper>

                                <Box mt="auto" pt="xl" style={{ textAlign: 'center' }}>
                                    <ThemeIcon size={40} radius="md" variant="gradient" gradient={{ from: 'gray', to: 'dark' }}>
                                        <Trophy size={20} />
                                    </ThemeIcon>
                                    <Text size="xs" c="dimmed" mt="sm">
                                        SDA Arcade High Scores: <br /> No disponible en esta versión.
                                    </Text>
                                </Box>
                            </Stack>
                        </ScrollArea>
                    </Paper>
                </Box>
            )}
        </Box >
    );
};

export default AdminArcade;
