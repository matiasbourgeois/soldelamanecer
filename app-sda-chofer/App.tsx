import React, { useState } from 'react';
import Navigation from './src/navigation/Navigation';
import SplashScreen from './src/screens/SplashScreen'; // 🔥 Acordate de crear este archivo

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return <Navigation />;
}
