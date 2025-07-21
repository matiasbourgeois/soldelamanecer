import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Animated, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://192.168.0.132:5002/api/usuarios/login', {
        email,
        contrasena,
      });

      const { token, usuario } = response.data;

      if (usuario.rol !== 'chofer') {
        Alert.alert('Acceso denegado', 'Solo pueden ingresar choferes.');
        return;
      }

      navigation.navigate('HojaReparto', { token, usuario });
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', 'Credenciales incorrectas o servidor fuera de línea');
    }
  };

  return (
    <LinearGradient colors={['#f4f7f8', '#d4e4f7']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.innerContainer}
      >
        <Animated.View style={{ opacity: fadeAnim, width: '100%' }}>
          <Text style={styles.title}>Sol del Amanecer SRL</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor="#999"
            secureTextEntry
            value={contrasena}
            onChangeText={setContrasena}
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Ingresar</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f4c430', // Amarillo corporativo
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    backgroundColor: '#ffffffcc', // Blanco semi-transparente
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#f4c430',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 10,
  },
  buttonText: {
    color: '#333',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
});
