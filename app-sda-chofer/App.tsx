import React, { useState } from 'react';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/context/AuthContext';
import Navigation from './src/navigation/Navigation';
import SplashScreen from './src/screens/SplashScreen';
import { theme } from './src/theme/theme';
import { enGB, registerTranslation } from 'react-native-paper-dates';

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

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <AuthProvider>
      <PaperProvider theme={theme}>
        {showSplash ? (
          <SplashScreen onFinish={() => setShowSplash(false)} />
        ) : (
          <Navigation />
        )}
      </PaperProvider>
    </AuthProvider>
  );
}
