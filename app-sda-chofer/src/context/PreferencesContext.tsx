
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

type ThemeType = 'dark' | 'light';

interface PreferencesContextType {
    theme: ThemeType;
    toggleTheme: () => void;
    isThemeDark: boolean;
}

const PreferencesContext = createContext<PreferencesContextType>({
    theme: 'dark',
    toggleTheme: () => { },
    isThemeDark: true,
});

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemScheme = useColorScheme();
    const [theme, setTheme] = useState<ThemeType>('dark'); // Default to dark (God Tier original)

    useEffect(() => {
        // Cargar preferencia guardada
        const loadPreference = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem('user_theme');
                if (savedTheme) {
                    setTheme(savedTheme as ThemeType);
                } else {
                    // Si no hay preferencia, usar dark por defecto o sistema? 
                    // El usuario pidió Explicitly un selector, así que mejor default manual o sistema.
                    // "God Tier" original era dark, así que default dark es seguro.
                    setTheme('dark');
                }
            } catch (error) {
                console.log('Error loading theme preference:', error);
            }
        };
        loadPreference();
    }, []);

    const toggleTheme = async () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        try {
            await AsyncStorage.setItem('user_theme', newTheme);
        } catch (error) {
            console.log('Error saving theme preference:', error);
        }
    };

    const isThemeDark = theme === 'dark';

    return (
        <PreferencesContext.Provider value={{ theme, toggleTheme, isThemeDark }}>
            {children}
        </PreferencesContext.Provider>
    );
};

export const usePreferences = () => useContext(PreferencesContext);
