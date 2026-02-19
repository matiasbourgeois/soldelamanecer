
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme, IconButton, Divider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

interface EnvioCardProps {
  envio: any;
  onPress: (envio: any) => void;
}

const EnvioCard: React.FC<EnvioCardProps> = ({ envio, onPress }) => {
  const theme = useTheme();
  const isDark = theme.dark;
  const estado = envio.estado?.toLowerCase() || 'pendiente';

  // Configuración de Colores "God Tier" Adaptable

  // Default (Pendiente / Otros)
  let statusColor = isDark ? '#fbbf24' : '#d97706'; // Amber 400 (Dark) / Amber 600 (Light)
  let gradientColors = isDark ? ['#1e293b', '#0f172a'] : ['#ffffff', '#f8f9fa']; // Slate Dark / White Light
  let iconName = 'clock-outline';
  let badgeBg = isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(217, 119, 6, 0.1)';
  let borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';

  switch (estado) {
    case 'entregado':
      statusColor = isDark ? '#34d399' : '#059669'; // Emerald 400 / Emerald 600
      gradientColors = isDark
        ? ['rgba(6, 78, 59, 0.4)', 'rgba(2, 44, 34, 0.6)']
        : ['#ecfdf5', '#d1fae5']; // Emerald 50/100 for Light
      iconName = 'check-circle';
      badgeBg = isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(5, 150, 105, 0.1)';
      borderColor = isDark ? 'transparent' : 'rgba(5, 150, 105, 0.2)';
      break;
    case 'en reparto':
      statusColor = isDark ? '#38bdf8' : '#0284c7'; // Sky 400 / Sky 600
      gradientColors = isDark
        ? ['rgba(12, 74, 110, 0.5)', 'rgba(8, 47, 73, 0.7)']
        : ['#f0f9ff', '#e0f2fe']; // Sky 50/100
      iconName = 'truck-fast';
      badgeBg = isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.1)';
      borderColor = isDark ? 'transparent' : 'rgba(2, 132, 199, 0.2)';
      break;
    case 'pendiente':
      // Ya definido en defaults, pero podemos ajustar si es especifico
      break;
    case 'rechazado':
    case 'no entregado':
      statusColor = isDark ? '#f87171' : '#dc2626'; // Red 400 / Red 600
      gradientColors = isDark
        ? ['rgba(127, 29, 29, 0.3)', 'rgba(69, 10, 10, 0.5)']
        : ['#fef2f2', '#fee2e2']; // Red 50/100
      iconName = 'alert-octagon';
      badgeBg = isDark ? 'rgba(248, 113, 113, 0.15)' : 'rgba(220, 38, 38, 0.1)';
      borderColor = isDark ? 'transparent' : 'rgba(220, 38, 38, 0.2)';
      break;
  }

  // Estilo base general para tarjetas no-entregadas (Dark Glass) y su contraparte Light
  if (isDark && (estado !== 'entregado' && estado !== 'rechazado' && estado !== 'en reparto')) {
    gradientColors = ['#1e293b', '#020617'];
  }

  // Text Colors adaptables
  const textPrimary = isDark ? '#f8fafc' : '#1e293b'; // Slate 50 / Slate 800
  const textSecondary = isDark ? '#94a3b8' : '#64748b'; // Slate 400 / Slate 500
  const labelColor = isDark ? '#64748b' : '#94a3b8'; // Label stays subtle

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress(envio)}
      style={[styles.cardContainer, {
        shadowColor: isDark ? '#000' : '#64748b',
        shadowOpacity: isDark ? 0.3 : 0.1
      }]}
    >
      <LinearGradient
        colors={gradientColors as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.cardGradient, { borderColor: borderColor }]}
      >
        {/* Barra lateral de estado */}
        <View style={[styles.statusStrip, { backgroundColor: statusColor }]} />

        <View style={styles.contentContainer}>
          {/* Header: Estado y Remito */}
          <View style={styles.header}>
            <View style={[styles.statusBadge, { backgroundColor: badgeBg, borderColor: isDark ? statusColor : 'transparent' }]}>
              <IconButton icon={iconName} iconColor={statusColor} size={14} style={{ margin: 0, height: 14, width: 14, marginRight: 6 }} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {estado.toUpperCase().replace('_', ' ')}
              </Text>
            </View>
            <Text style={[styles.remito, { color: textSecondary }]}>#{envio.remitoNumero?.slice(-8) || '---'}</Text>
          </View>

          {/* Dirección Principal */}
          <View style={styles.addressSection}>
            <Text style={[styles.labelV2, { color: labelColor }]}>DIRECCIÓN</Text>
            <Text style={[styles.addressText, { color: textPrimary }]} numberOfLines={2}>
              {envio.destinatario?.direccion || "Dirección desconocida"}
            </Text>

            <Text style={[styles.labelV2, { color: labelColor }]}>LOCALIDAD</Text>
            <Text style={[styles.localityText, { color: textSecondary }]}>
              {envio.localidadDestino?.nombre || "Localidad no especificada"}
            </Text>
          </View>

          {/* Separador sutil */}
          <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]} />

          {/* Footer Info */}
          <View style={styles.footer}>
            <View style={styles.footerItem}>
              <View>
                <Text style={[styles.labelV2, { color: labelColor }]}>CLIENTE</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <IconButton icon="account" iconColor={textSecondary} size={14} style={styles.miniIcon} />
                  <Text style={[styles.footerLabel, { color: textSecondary }]} numberOfLines={1}>
                    {envio.destinatario?.nombre || "Sin Nombre"}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.footerItemRight}>
              <IconButton icon="package-variant" iconColor={textSecondary} size={16} style={styles.miniIcon} />
              <Text style={[styles.footerValue, { color: textPrimary }]}>
                {envio.encomienda?.bultos || envio.encomienda?.cantidad || 1}
              </Text>
            </View>
          </View>
        </View>

        {/* Decoración de fondo (Brillo sutil) solo en dark o statuses especiales */}
        {isDark && <View style={[styles.glowEffect, { shadowColor: statusColor }]} />}

      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 4, // Sombra sutil en Android
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  cardGradient: {
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
  },
  statusStrip: {
    width: 4,
    height: '100%',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1, // Optional border
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  remito: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  addressSection: {
    marginBottom: 16,
  },
  addressText: {
    fontSize: 17, // Ligeramente más grande
    fontWeight: '800',
    lineHeight: 24,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  localityText: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  footerItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniIcon: {
    margin: 0,
    marginRight: 4,
    width: 16,
    height: 16
  },
  footerLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  footerValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  labelV2: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 2,
    textTransform: 'uppercase'
  },
  glowEffect: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: -1,
  }
});

export default EnvioCard;
