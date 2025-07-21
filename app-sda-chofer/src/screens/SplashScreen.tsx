import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeSubTitle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(fadeSubTitle, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();

    const timeout = setTimeout(() => {
      onFinish();
    }, 3500); // Le doy 3.5 segundos para que disfrutes bien la animación

    return () => clearTimeout(timeout);
  }, []);

  return (
    <LinearGradient
      colors={['#f4f7f8', '#d4e4f7']} // 🔥 Fondo moderno (blanco arriba, celeste abajo)
      style={styles.container}
    >
      <Animated.Text
        style={[
          styles.logo,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        Sol del Amanecer SRL
      </Animated.Text>

      <Animated.Text
        style={[
          styles.subtitle,
          { opacity: fadeSubTitle },
        ]}
      >
        Seguimiento de Envíos App
      </Animated.Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 30,
    fontWeight: '900',
    color: '#f4c430', // Amarillo corporativo ⚡
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#555',
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default SplashScreen;
