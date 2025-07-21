import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { crearHojaRepartoStyles } from '../../styles/hojaRepartoStyles';

interface SelectorHojasScreenProps {
    hojas: any[];
    onSeleccionarHoja: (hojaSeleccionada: any) => void;
}

const SelectorHojasScreen: React.FC<SelectorHojasScreenProps> = ({ hojas, onSeleccionarHoja }) => {
    const hojaRepartoStyles = crearHojaRepartoStyles(false);

    const renderItem = ({ item }: { item: any }) => {
        const fecha = new Date(item.fecha).toLocaleDateString();
      
        return (
          <TouchableOpacity
            style={hojaRepartoStyles.hojaSelectorCard}
            onPress={() => onSeleccionarHoja(item)}
          >
            <View style={hojaRepartoStyles.hojaSelectorLine} />
      
            <View style={hojaRepartoStyles.hojaSelectorContenido}>
              <Text style={hojaRepartoStyles.hojaSelectorTitulo}>
                {item.numeroHoja || item._id.slice(-4)}
              </Text>
      
              <Text style={hojaRepartoStyles.hojaSelectorRuta}>
                Ruta: {item.ruta?.codigo || "-"}
              </Text>
      
              <Text style={hojaRepartoStyles.hojaSelectorRuta}>
                Fecha: {fecha}
              </Text>
      
              <Text style={hojaRepartoStyles.hojaSelectorEstado}>
                Estado HR: {item.estado || "-"}
              </Text>
            </View>
          </TouchableOpacity>
        );
      };
      
      


    return (
        <View style={hojaRepartoStyles.containerSelector}>
            <Text style={hojaRepartoStyles.tituloPrincipal}>Seleccioná tu hoja de reparto</Text>
            <FlatList
                data={hojas}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={hojaRepartoStyles.flatListContainer}
            />
        </View>
    );
};

export default SelectorHojasScreen;
