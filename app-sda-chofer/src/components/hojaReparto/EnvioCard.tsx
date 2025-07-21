// components/hojaReparto/EnvioCard.tsx

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { crearHojaRepartoStyles } from '../../styles/hojaRepartoStyles';

interface EnvioCardProps {
  envio: any;
  onPress: (envio: any) => void;
}

// 🎨 Colores personalizados por estado (rayita y chip)
const coloresEstadoEnvio: Record<string, { rayita: string; chipFondo: string; chipTexto: string }> = {
    pendiente:       { rayita: '#ffc107', chipFondo: '#fff3cd', chipTexto: '#856404' },
    'en reparto':    { rayita: '#17a2b8', chipFondo: '#d1ecf1', chipTexto: '#0c5460' },
    entregado:       { rayita: '#28a745', chipFondo: '#d4edda', chipTexto: '#155724' },
    devuelto:        { rayita: '#dc3545', chipFondo: '#f8d7da', chipTexto: '#721c24' },
    rechazado:       { rayita: '#dc3545', chipFondo: '#f5c6cb', chipTexto: '#721c24' },
    'no entregado':  { rayita: '#6c757d', chipFondo: '#e2e3e5', chipTexto: '#383d41' },
    reagendado:      { rayita: '#17a2b8', chipFondo: '#e2e3e5', chipTexto: '#0c5460' },
    cancelado:       { rayita: '#6c757d', chipFondo: '#d6d8db', chipTexto: '#1b1e21' },
  };
  

const EnvioCard: React.FC<EnvioCardProps> = ({ envio, onPress }) => {
  const hojaRepartoStyles = crearHojaRepartoStyles(false); // 🔵 Agregar dark mode si se desea

  const estado = envio.estado?.toLowerCase();
  const colores = coloresEstadoEnvio[estado] || {
    rayita: '#ccc',
    chipFondo: '#e2e3e5',
    chipTexto: '#333'
  };

  return (
    <TouchableOpacity
      style={[
        hojaRepartoStyles.envioCard, // fondo base neutro
      ]}
      onPress={() => onPress(envio)}
    >

      {/* RAYITA DE COLOR */}
      <View
        style={[
          hojaRepartoStyles.statusBar,
          { backgroundColor: colores.rayita }
        ]}
      />

      {/* CONTENIDO PRINCIPAL */}
      <View style={hojaRepartoStyles.contenidoEnvio}>
        <View style={hojaRepartoStyles.remitoRow}>
          <Text style={hojaRepartoStyles.envioTitulo}>
            Remito: {envio.remitoNumero || "-"}
          </Text>

          <View
            style={[
              hojaRepartoStyles.estadoChip,
              {
                backgroundColor: colores.chipFondo,
                borderColor: colores.rayita
              }
            ]}
          >
            <Text
              style={[
                hojaRepartoStyles.estadoChipTexto,
                { color: colores.chipTexto }
              ]}
            >
              {estado.charAt(0).toUpperCase() + estado.slice(1)}
            </Text>
          </View>
        </View>

        <Text style={hojaRepartoStyles.envioInfoText}>
          Destinatario: {envio.destinatario?.nombre || "-"}
        </Text>
        <Text style={hojaRepartoStyles.envioInfoText}>
          Dirección: {envio.destinatario?.direccion || "-"}
        </Text>
        <Text style={hojaRepartoStyles.envioInfoText}>
          Localidad: {envio.localidadDestino?.nombre || "-"}
        </Text>
        <Text style={hojaRepartoStyles.envioInfoText}>
          Bultos: {envio.encomienda?.cantidad || "-"}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default EnvioCard;
