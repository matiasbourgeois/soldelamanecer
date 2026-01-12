import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

export const theme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        primary: '#1098ad',       // Cyan Corporativo
        primaryContainer: '#c5f6fa',
        secondary: '#0b7285',     // Teal Oscuro
        secondaryContainer: '#e3fafc',
        tertiary: '#fab005',      // Amarillo Sol (Highlights)
        background: '#f8f9fa',
        surface: '#ffffff',
        error: '#fa5252',
        outline: '#dee2e6',
    },
};
