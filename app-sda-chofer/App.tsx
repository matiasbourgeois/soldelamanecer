import React, { useState } from 'react';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/context/AuthContext';
import { PreferencesProvider, usePreferences } from './src/context/PreferencesContext';
import Navigation from './src/navigation/Navigation';
import SplashScreen from './src/screens/SplashScreen';
import { LightTheme, DarkTheme } from './src/theme/theme';
import { enGB, registerTranslation } from 'react-native-paper-dates';
import { StatusBar } from 'react-native';

registerTranslation('es', {
  save: 'Guardar',
  selectSingle: 'Seleccionar fecha',
  selectMultiple: 'Seleccionar fechas',
  selectRange: 'Seleccionar periodo',
  notAccordingToDateFormat: (inputFormat) =>
    `El formato debe ser ${inputFormat}`,
  mustBeHigherThan: (date) => `Debe ser posterior a ${date}`,
  mustBeLowerThan: (date) => `Debe ser anterior a ${date}`,
  mustBeBetween: (startDate, endDate) =>
    `Debe estar entre ${startDate} y ${endDate}`,
  dateIsDisabled: 'Día no permitido',
  previous: 'Anterior',
  next: 'Siguiente',
  typeInDate: 'Escribir fecha',
  pickDateFromCalendar: 'Seleccionar fecha del calendario',
  close: 'Cerrar',
  minute: 'Minuto',
  hour: 'Hora',
});

// Componente interno para consumir el contexto de preferencias
const AppContent = () => {
  const [showSplash, setShowSplash] = useState(true);
  const { theme: userTheme, isThemeDark } = usePreferences();

  const activeTheme = isThemeDark ? DarkTheme : LightTheme;

  return (
    <PaperProvider theme={activeTheme}>
      <StatusBar
        barStyle={isThemeDark ? 'light-content' : 'dark-content'}
        backgroundColor={activeTheme.colors.background}
      />
      {showSplash ? (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      ) : (
        <Navigation />
      )}
    </PaperProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <PreferencesProvider>
        <AppContent />
      </PreferencesProvider>
    </AuthProvider>
  );
}
