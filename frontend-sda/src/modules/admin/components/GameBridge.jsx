import React from 'react';
import { Box } from '@mantine/core';

/**
 * GameBridge Component
 * Totalmente fluido. El juego debe encargarse de su propio escalado.
 */
const GameBridge = ({ url, title = "Game" }) => {
    return (
        <Box
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'stretch',
                justifyContent: 'stretch',
                backgroundColor: 'white',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <iframe
                title={title}
                src={url}
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    display: 'block'
                }}
                sandbox="allow-scripts allow-same-origin allow-pointer-lock"
                allow="autoplay; fullscreen"
            />
        </Box>
    );
};

export default GameBridge;
