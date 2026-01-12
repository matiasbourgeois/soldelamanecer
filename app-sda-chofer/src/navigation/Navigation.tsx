import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';

import LoginScreen from '../screens/LoginScreen';
import HojaRepartoScreen from '../screens/HojaRepartoScreen';
import HomeScreen from '../screens/HomeScreen';
import CargaKilometrajeScreen from '../screens/CargaKilometrajeScreen';

const Stack = createNativeStackNavigator();

export default function Navigation() {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // 🔓 Usuario Logueado
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="CargaKilometraje" component={CargaKilometrajeScreen} />
            <Stack.Screen name="HojaReparto" component={HojaRepartoScreen} />
          </>
        ) : (
          // 🔒 Usuario No Logueado
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
