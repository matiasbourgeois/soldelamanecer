import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Dimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Text, Chip } from 'react-native-paper';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();

    const timeout = setTimeout(() => {
      onFinish();
    }, 2500);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <LinearGradient
      colors={['#1098ad', '#0b7285']} // Cyan/Teal Corporativo
      style={styles.container}
    >
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          alignItems: 'center',
        }}
      >
        <Text variant="displaySmall" style={styles.logo}>
          Sol del Amanecer
        </Text>

        <Chip
          mode="outlined"
          textStyle={{ color: 'white', fontWeight: 'bold' }}
          style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 0 }}
        >
          MOBILE APP
        </Chip>

        <View style={{ marginTop: 40 }}>
          <ActivityIndicator animating={true} color="white" size="large" />
          <Text style={styles.loadingText}>Iniciando sistema...</Text>
        </View>
      </Animated.View>
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
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 5,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 2,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: 'white',
    opacity: 0.8,
    fontSize: 12
  }
});

export default SplashScreen;
