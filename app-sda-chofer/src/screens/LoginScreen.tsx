import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Alert, Animated, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Text,
  TextInput,
  Button,
  Surface,
  useTheme,
  Title,
  HelperText,
  Snackbar,
  Portal
} from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';

const LoginScreen = ({ navigation }: any) => {
  const { login } = useAuth();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 🔴 Estados para manejo de errores visuales (God Tier)
  const [visible, setVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Animación de entrada
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !contrasena) {
      setErrorMsg('Por favor completá todos los campos.');
      setVisible(true);
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), contrasena);
      // Navegación automática
    } catch (error: any) {
      // Mensaje amigable pero claro
      setErrorMsg(error.message || 'Credenciales inválidas. Revisá tu email y contraseña.');
      setVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#1098ad', '#0b7285']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.innerContainer}
      >
        <Animated.View style={{ opacity: fadeAnim, width: '100%', alignItems: 'center' }}>

          {/* ☀️ Título / Logo */}
          <Text variant="headlineMedium" style={styles.brandTitle}>
            Sol del Amanecer
          </Text>

          {/* ⬜ Card Blanca de Login */}
          <Surface style={styles.card} elevation={4}>
            <Title style={styles.cardTitle}>Bienvenido</Title>
            <Text style={styles.cardSubtitle}>Ingresá tus credenciales para comenzar.</Text>

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.input, { backgroundColor: '#ffffff' }]}
              contentStyle={{ backgroundColor: '#ffffff' }}
              textColor="#212529"
              outlineColor="#dee2e6"
              activeOutlineColor="#1098ad"
              theme={{ colors: { background: '#ffffff', surface: '#ffffff' } }}
              left={<TextInput.Icon icon="email" />}
              // @ts-ignore
              autoComplete="off"
            />

            <TextInput
              label="Contraseña"
              value={contrasena}
              onChangeText={setContrasena}
              mode="outlined"
              secureTextEntry={!showPassword}
              style={[styles.input, { backgroundColor: '#ffffff' }]}
              contentStyle={{ backgroundColor: '#ffffff' }}
              textColor="#212529"
              outlineColor="#dee2e6"
              activeOutlineColor="#1098ad"
              theme={{ colors: { background: '#ffffff', surface: '#ffffff' } }}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? "eye-off" : "eye"}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              // @ts-ignore
              autoComplete="off"
            />

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              style={styles.button}
              contentStyle={{ height: 50 }}
              labelStyle={{ fontSize: 16, fontWeight: 'bold', color: 'white' }}
              buttonColor="#0b7285"
            >
              INGRESAR AL SISTEMA
            </Button>

            <HelperText type="info" style={{ marginTop: 20, textAlign: 'center' }}>
              Versión 2.0.1 (Redesign)
            </HelperText>
          </Surface>

        </Animated.View>
      </KeyboardAvoidingView>

      {/* 🔴 Snackbar de Error Estilizado */}
      <Portal>
        <Snackbar
          visible={visible}
          onDismiss={() => setVisible(false)}
          duration={3000}
          style={{
            backgroundColor: '#ff6b6b', // Rojo suave pero alerta
            borderRadius: 12,
            marginBottom: 40,
            marginHorizontal: 16
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
            {errorMsg}
          </Text>
        </Snackbar>
      </Portal>

    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  brandTitle: {
    color: 'white',
    fontWeight: '900',
    fontSize: 32,
    marginBottom: 5,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  brandSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 4,
    marginBottom: 40,
    fontWeight: 'bold',
  },
  card: {
    width: '100%',
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#343a40',
    marginBottom: 5,
  },
  cardSubtitle: {
    color: '#868e96',
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 14,
  },
  input: {
    width: '100%',
    marginBottom: 16,
    backgroundColor: 'white',
  },
  button: {
    width: '100%',
    borderRadius: 8,
    marginTop: 8,
  },
});

export default LoginScreen;
