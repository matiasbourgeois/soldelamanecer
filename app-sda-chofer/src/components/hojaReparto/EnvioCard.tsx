
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
  const estado = envio.estado?.toLowerCase() || 'pendiente';

  // Configuración de Colores "God Tier"
  let statusColor = '#94a3b8'; // Slate 400
  let gradientColors = ['#1e293b', '#0f172a']; // Slate 800 -> 900
  let iconName = 'package-variant-closed';
  let badgeBg = 'rgba(148, 163, 184, 0.1)';

  switch (estado) {
    case 'entregado':
      statusColor = '#34d399'; // Emerald 400 (Vibrante)
      gradientColors = ['rgba(6, 78, 59, 0.4)', 'rgba(2, 44, 34, 0.6)']; // Emerald dark transparent
      iconName = 'check-circle';
      badgeBg = 'rgba(52, 211, 153, 0.15)';
      break;
    case 'en reparto':
      statusColor = '#38bdf8'; // Sky 400
      gradientColors = ['rgba(12, 74, 110, 0.5)', 'rgba(8, 47, 73, 0.7)']; // Sky dark
      iconName = 'truck-fast';
      badgeBg = 'rgba(56, 189, 248, 0.15)';
      break;
    case 'pendiente':
      statusColor = '#fbbf24'; // Amber 400
      gradientColors = ['#1e293b', '#0f172a']; // Default Dark
      iconName = 'clock-outline';
      badgeBg = 'rgba(251, 191, 36, 0.15)';
      break;
    case 'rechazado':
    case 'no entregado':
      statusColor = '#f87171'; // Red 400
      gradientColors = ['rgba(127, 29, 29, 0.3)', 'rgba(69, 10, 10, 0.5)']; // Red dark
      iconName = 'alert-octagon';
      badgeBg = 'rgba(248, 113, 113, 0.15)';
      break;
  }

  // Estilo base general para tarjetas no-entregadas (Dark Glass)
  if (estado !== 'entregado' && estado !== 'rechazado' && estado !== 'en reparto') {
    gradientColors = ['#1e293b', '#020617'];
  }

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress(envio)}
      style={styles.cardContainer}
    >
      <LinearGradient
        colors={gradientColors as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        {/* Barra lateral de estado */}
        <View style={[styles.statusStrip, { backgroundColor: statusColor }]} />

        <View style={styles.contentContainer}>
          {/* Header: Estado y Remito */}
          <View style={styles.header}>
            <View style={[styles.statusBadge, { backgroundColor: badgeBg, borderColor: statusColor }]}>
              <IconButton icon={iconName} iconColor={statusColor} size={14} style={{ margin: 0, height: 14, width: 14, marginRight: 6 }} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {estado.toUpperCase().replace('_', ' ')}
              </Text>
            </View>
            <Text style={styles.remito}>#{envio.remitoNumero?.slice(-8) || '---'}</Text>
          </View>

          {/* Dirección Principal */}
          <View style={styles.addressSection}>
            <Text style={styles.labelV2}>DIRECCIÓN</Text>
            <Text style={styles.addressText} numberOfLines={2}>
              {envio.destinatario?.direccion || "Dirección desconocida"}
            </Text>

            <Text style={styles.labelV2}>LOCALIDAD</Text>
            <Text style={styles.localityText}>
              {envio.localidadDestino?.nombre || "Localidad no especificada"}
            </Text>
          </View>

          {/* Separador sutil */}
          <View style={styles.divider} />

          {/* Footer Info */}
          <View style={styles.footer}>
            <View style={styles.footerItem}>
              <View>
                <Text style={styles.labelV2}>CLIENTE</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <IconButton icon="account" iconColor="#94a3b8" size={14} style={styles.miniIcon} />
                  <Text style={styles.footerLabel} numberOfLines={1}>
                    {envio.destinatario?.nombre || "Sin Nombre"}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.footerItemRight}>
              <IconButton icon="package-variant" iconColor="#94a3b8" size={16} style={styles.miniIcon} />
              <Text style={styles.footerValue}>
                {envio.encomienda?.bultos || envio.encomienda?.cantidad || 1}
              </Text>
            </View>
          </View>
        </View>

        {/* Decoración de fondo (Brillo sutil) */}
        <View style={[styles.glowEffect, { shadowColor: statusColor }]} />

      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 4, // Sombra sutil en Android
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardGradient: {
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)', // Borde glassmorphism
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
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  remito: {
    color: '#64748b', // Slate 500
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  addressSection: {
    marginBottom: 16,
  },
  addressText: {
    color: '#f8fafc', // Slate 50
    fontSize: 17, // Ligeramente más grande
    fontWeight: '800',
    lineHeight: 24,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  localityText: {
    color: '#94a3b8', // Slate 400
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    color: '#cbd5e1', // Slate 300
    fontSize: 13,
    fontWeight: '600',
  },
  footerValue: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: 'bold',
  },
  labelV2: {
    color: '#64748b', // Slate 500
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
