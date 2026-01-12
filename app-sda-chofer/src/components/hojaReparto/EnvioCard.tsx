
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme, Divider } from 'react-native-paper';

interface EnvioCardProps {
  envio: any;
  onPress: (envio: any) => void;
}

const EnvioCard: React.FC<EnvioCardProps> = ({ envio, onPress }) => {
  const theme = useTheme();
  const estado = envio.estado?.toLowerCase() || 'pendiente';

  // Dynamic Color based on status
  let statusColor = '#868e96'; // Default gray
  let statusBg = '#f1f3f5';

  switch (estado) {
    case 'entregado':
      statusColor = '#20c997'; // Teal/Green
      statusBg = '#e6fcf5';
      break;
    case 'en reparto':
      statusColor = '#3bc9db'; // Cyan
      statusBg = '#e3fafc';
      break;
    case 'pendiente':
      statusColor = '#fab005'; // Orange
      statusBg = '#fff9db';
      break;
    case 'rechazado':
      statusColor = '#fa5252'; // Red
      statusBg = '#fff5f5';
      break;
  }

  return (
    <View style={styles.cardOuterShadow}>
      <View style={styles.cardInnerClip}>
        <TouchableOpacity
          style={styles.touchableArea}
          onPress={() => onPress(envio)}
          activeOpacity={0.9}
        >
          {/* Colored Strip */}
          <View style={[styles.cardStrip, { backgroundColor: statusColor }]} />

          <View style={styles.cardContent}>

            {/* Header: Status Badge & Remito */}
            <View style={styles.headerRow}>
              <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {estado.toUpperCase().replace('_', ' ')}
                </Text>
              </View>
              <Text style={styles.remitoText}>
                #{envio.remitoNumero?.slice(-6) || '---'}
              </Text>
            </View>

            {/* Main Address - Hero Text */}
            <Text style={styles.addressText} numberOfLines={2}>
              {envio.destinatario?.direccion || "Dirección desconocida"}
            </Text>
            <Text style={styles.localityText}>
              {envio.localidadDestino?.nombre || "Localidad no especificada"}
            </Text>

            {/* Footer Divider */}
            <Divider style={styles.divider} />

            {/* Footer Info (Minimal) */}
            <View style={styles.footerRow}>
              <View style={styles.footerItem}>
                <Text style={styles.footerLabel}>DESTINATARIO</Text>
                <Text style={styles.footerValue} numberOfLines={1}>
                  {envio.destinatario?.nombre || "N/A"}
                </Text>
              </View>
              <View style={styles.footerItemRight}>
                <Text style={styles.footerLabel}>BULTOS</Text>
                <Text style={styles.footerValue}>
                  {envio.encomienda?.cantidad || 1}
                </Text>
              </View>
            </View>

          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Double Container Pattern for Perfect Shadows
  cardOuterShadow: {
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    marginHorizontal: 4, // Allow shadow blooming
  },
  cardInnerClip: {
    borderRadius: 20,
    overflow: 'hidden', // Clips the strip
    backgroundColor: 'white',
  },
  touchableArea: {
    flexDirection: 'row',
  },
  cardStrip: {
    width: 6,
    height: '100%',
  },
  cardContent: {
    flex: 1,
    padding: 18,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  remitoText: {
    fontSize: 13,
    color: '#adb5bd',
    fontWeight: '500',
  },

  // Address
  addressText: {
    fontSize: 18,
    fontWeight: '800', // Bold/Black
    color: '#212529',
    marginBottom: 4,
    lineHeight: 24,
  },
  localityText: {
    fontSize: 15,
    color: '#868e96',
    fontWeight: '500',
    marginBottom: 16,
  },

  // Divider
  divider: {
    backgroundColor: '#f1f3f5',
    height: 1,
    marginBottom: 14,
  },

  // Footer
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerItem: {
    flex: 1,
    paddingRight: 10,
  },
  footerItemRight: {
    alignItems: 'flex-end',
    minWidth: 50,
  },
  footerLabel: {
    fontSize: 11,
    color: '#adb5bd',
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  footerValue: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '700',
  },
});

export default EnvioCard;
