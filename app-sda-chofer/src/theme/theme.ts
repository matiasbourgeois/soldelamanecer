import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// Paleta Común
const commonColors = {
    primary: '#0891b2',       // Cyan 600 (Base)
    primaryContainer: '#c5f6fa',
    secondary: '#0b7285',
    tertiary: '#f59f00',      // Orange-Yellow
    error: '#ef4444',
};

export const LightTheme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        ...commonColors,
        primary: '#0891b2',       // Cyan 600
        background: '#f8fafc',    // Slate 50 (Casi blanco)
        surface: '#ffffff',
        surfaceVariant: '#e2e8f0', // Slate 200
        textPrimary: '#0f172a',   // Slate 900
        textSecondary: '#64748b', // Slate 500
        outline: '#cbd5e1',

        // Custom Gradients (Light)
        gradientStart: '#e0f2fe', // Sky 100
        gradientEnd: '#f0f9ff',   // Sky 50
    },
};

export const DarkTheme = {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        ...commonColors,
        primary: '#06b6d4',       // Cyan 500 (Más brillante para dark)
        background: '#020617',    // Slate 950
        surface: '#0f172a',       // Slate 900
        surfaceVariant: 'rgba(30, 41, 59, 0.6)',
        textPrimary: '#f8fafc',   // Slate 50
        textSecondary: '#94a3b8', // Slate 400
        outline: 'rgba(255,255,255,0.1)',

        // Custom Gradients (Dark)
        gradientStart: '#1e1b4b', // Indigo 950
        gradientEnd: '#020617',   // Slate 950
    },
};

// Helper para TypeScript si se necesita
export type AppTheme = typeof LightTheme;

