import React from 'react';
import { Box, Stack, Text, Loader, rem, Title } from '@mantine/core';

const TransitionScreen = ({ message = "Iniciando sesión..." }) => {
    return (
        <Box
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 9999,
                background: 'linear-gradient(135deg, #0b7285 0%, #1098ad 50%, #22b8cf 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)',
            }}
        >
            {/* Luces de fondo animadas */}
            <Box
                style={{
                    position: 'absolute',
                    top: '20%',
                    left: '20%',
                    width: rem(400),
                    height: rem(400),
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                    filter: 'blur(50px)',
                    animation: 'float-slow 10s infinite ease-in-out',
                }}
            />
            <Box
                style={{
                    position: 'absolute',
                    bottom: '10%',
                    right: '10%',
                    width: rem(500),
                    height: rem(500),
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
                    filter: 'blur(60px)',
                    animation: 'float-slow 12s infinite ease-in-out reverse',
                }}
            />

            <Stack align="center" gap="xl" style={{ zIndex: 1, textAlign: 'center' }}>
                <Box style={{ position: 'relative' }}>
                    <Loader color="cyan.0" size={80} type="bars" />
                    <Box
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: rem(100),
                            height: rem(100),
                            border: '2px solid rgba(255,255,255,0.1)',
                            borderRadius: '50%',
                            animation: 'pulse-glow 2s infinite ease-in-out',
                        }}
                    />
                </Box>

                <Stack gap={5}>
                    <Title order={2} c="white" style={{ fontWeight: 900, fontSize: rem(28), letterSpacing: '-0.5px' }}>
                        SOL DEL AMANECER
                    </Title>
                    <Text c="cyan.0" fw={600} size="lg" style={{ opacity: 0.9 }}>
                        {message}
                    </Text>
                </Stack>
            </Stack>

            <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -30px) scale(1.1); }
        }
        @keyframes pulse-glow {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.3; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.3; }
        }
      `}</style>
        </Box>
    );
};

export default TransitionScreen;
