import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, StatusBar } from 'react-native';
import { Text, Appbar, TextInput, Button, HelperText, ActivityIndicator, useTheme, Surface, IconButton, Snackbar, Portal, Modal } from 'react-native-paper';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';

const CargaKilometrajeScreen = ({ navigation }: any) => {
    const theme = useTheme();
    const { user } = useAuth();

    // Estados de carga e info
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Configuración Traída del Backend
    const [vehiculoAsignado, setVehiculoAsignado] = useState<any>(null);
    const [rutaAsignada, setRutaAsignado] = useState<any>(null);

    // Formulario
    const [fecha, setFecha] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [kmInput, setKmInput] = useState('');
    const [litrosInput, setLitrosInput] = useState('');
    // Listas para selectores
    const [listaVehiculos, setListaVehiculos] = useState<any[]>([]);
    const [listaRutas, setListaRutas] = useState<any[]>([]);

    // Modal Selector
    const [modalVisible, setModalVisible] = useState(false);
    const [selectorTipo, setSelectorTipo] = useState<'vehiculo' | 'ruta'>('vehiculo');
    const [searchQuery, setSearchQuery] = useState('');

    // State for Snackbar (Errors)
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    // const [snackbarColor, setSnackbarColor] = useState(theme.colors.primary); // Deprecated for success

    // State for Success Modal
    const [successModalVisible, setSuccessModalVisible] = useState(false);

    // Obtener configuración inicial y listas
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                // 1. Configuración asignada (Defaults)
                const resConfig = await api.get('/choferes/configuracion');
                if (resConfig.data.vehiculo) setVehiculoAsignado(resConfig.data.vehiculo);
                if (resConfig.data.ruta) setRutaAsignado(resConfig.data.ruta);

                // 2. Listas completas para selectores
                const resSelectores = await api.get('/choferes/selectores-reporte');
                if (resSelectores.data.vehiculos) setListaVehiculos(resSelectores.data.vehiculos);
                if (resSelectores.data.rutas) setListaRutas(resSelectores.data.rutas);

            } catch (error) {
                console.log('Error config:', error);
                Alert.alert('Aviso', 'Error al cargar datos iniciales.');
            } finally {
                setLoadingConfig(false);
            }
        };

        fetchConfig();
    }, []);

    const onChangeDate = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || fecha;
        setShowDatePicker(Platform.OS === 'ios');
        setFecha(currentDate);
    };

    const abrirSelector = (tipo: 'vehiculo' | 'ruta') => {
        setSelectorTipo(tipo);
        setSearchQuery(''); // Resetear búsqueda
        setModalVisible(true);
    };

    const seleccionarItem = (item: any) => {
        if (selectorTipo === 'vehiculo') {
            setVehiculoAsignado(item);
            setKmInput(''); // Limpiar input para evitar confusión con el placeholder nuevo
        } else {
            setRutaAsignado(item);
        }
        setModalVisible(false);
    };

    const handleSubmit = async () => {
        if (!vehiculoAsignado) {
            Alert.alert('Error', 'Debes seleccionar un vehículo.');
            return;
        }
        if (!kmInput) {
            Alert.alert('Falta Odómetro', 'Por favor ingresá el kilometraje actual.');
            return;
        }

        const kmNuevo = parseInt(kmInput);
        const kmAnterior = vehiculoAsignado.kilometrajeActual || 0;

        if (kmNuevo < kmAnterior) {
            Alert.alert('Error', `El KM no puede ser menor al anterior (${kmAnterior} km).`);
            return;
        }

        if (kmNuevo - kmAnterior > 1500) {
            Alert.alert('Advertencia', 'Estás cargando más de 1500km. ¿Es correcto?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sí, Confirmar', onPress: () => enviarDatos() }
            ]);
            return;
        }

        enviarDatos();
    };

    const enviarDatos = async () => {
        setSubmitting(true);
        try {
            const payload = {
                kilometraje: parseInt(kmInput),
                litros: litrosInput ? parseFloat(litrosInput) : 0,
                rutaId: rutaAsignada?._id || null,
                fecha: fecha.toISOString()
            };

            await api.post(`/vehiculos/${vehiculoAsignado._id}/reporte-chofer`, payload);

            // ÉXITO: MOSTRAR MODAL GRANDE
            setSuccessModalVisible(true);

            // No hacemos goBack automático, dejamos que el usuario toque "Continuar"

        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.error || "Error al guardar el reporte.";
            // ERROR: USAMOS SNACKBAR ROJO
            setSnackbarMessage(msg);
            setSnackbarVisible(true);
        } finally {
            setSubmitting(false);
        }
    };

    const kmRecorridos = kmInput ? (parseInt(kmInput) - (vehiculoAsignado?.kilometrajeActual || 0)) : 0;
    const isKmValid = kmRecorridos >= 0;

    if (loadingConfig) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={{ marginTop: 10, color: '#868e96' }}>Cargando datos...</Text>
            </View>
        );
    }

    // ... logic remains identical until return ...

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

            {/* GOD TIER HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <IconButton icon="arrow-left" iconColor="#495057" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Reporte Diario</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* 1. FECHA (Redesigned) */}
                <Text style={styles.sectionLabel}>FECHA DEL REPORTE</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
                    <Surface style={styles.dateCard} elevation={0}>
                        <View style={styles.dateIconContainer}>
                            <IconButton icon="calendar-month" iconColor="#228be6" size={24} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.dateValue}>
                                {fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </Text>
                            <Text style={styles.dateYear}>{fecha.getFullYear()}</Text>
                        </View>
                        <IconButton icon="chevron-down" size={20} iconColor="#adb5bd" />
                    </Surface>
                </TouchableOpacity>

                {/* 2. SELECTORES DE VEHÍCULO & RUTA (Redesigned) */}
                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.sectionLabel}>VEHÍCULO</Text>
                        <TouchableOpacity onPress={() => abrirSelector('vehiculo')} activeOpacity={0.9}>
                            <Surface style={styles.selectorCard} elevation={0}>
                                <View style={[styles.iconCircle, { backgroundColor: '#e7f5ff' }]}>
                                    <IconButton icon="truck" iconColor="#1c7ed6" size={20} />
                                </View>
                                <Text style={styles.selectorValue} numberOfLines={1}>
                                    {vehiculoAsignado?.patente?.toUpperCase() || '---'}
                                </Text>
                                <Text style={styles.selectorSubtitle} numberOfLines={1}>
                                    {vehiculoAsignado?.modelo?.toUpperCase() || 'Seleccionar'}
                                </Text>
                            </Surface>
                        </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.sectionLabel}>RUTA</Text>
                        <TouchableOpacity onPress={() => abrirSelector('ruta')} activeOpacity={0.9}>
                            <Surface style={styles.selectorCard} elevation={0}>
                                <View style={[styles.iconCircle, { backgroundColor: '#e6fcf5' }]}>
                                    <IconButton icon="map-marker-path" iconColor="#0ca678" size={20} />
                                </View>
                                <Text style={styles.selectorValue} numberOfLines={1}>
                                    {rutaAsignada?.codigo?.toUpperCase() || '---'}
                                </Text>
                                <Text style={styles.selectorSubtitle} numberOfLines={1}>
                                    {rutaAsignada?.horaSalida || 'Seleccionar'}
                                </Text>
                            </Surface>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 3. ODÓMETRO (Hero Element) */}
                <Text style={styles.sectionLabel}>KILOMETRAJE ACTUAL</Text>

                <Surface style={styles.odometerHero} elevation={2}>
                    <View style={styles.lastKmBadge}>
                        <Text style={styles.lastKmText}>ANTERIOR: {vehiculoAsignado?.kilometrajeActual?.toLocaleString('es-AR') || '0'} KM</Text>
                    </View>

                    <View style={styles.inputWrapper}>
                        <TextInput
                            key={vehiculoAsignado?._id}
                            mode="flat"
                            value={kmInput}
                            onChangeText={setKmInput}
                            keyboardType="numeric"
                            placeholder={vehiculoAsignado?.kilometrajeActual?.toString() || "0"}
                            placeholderTextColor="#ced4da"
                            style={styles.heroInput}
                            underlineColor="transparent"
                            activeUnderlineColor="transparent"
                            textColor="#212529"
                            selectionColor="#228be6"
                        />
                        <Text style={styles.unitText}>KM</Text>
                    </View>

                    {kmInput !== '' && (
                        <View style={[styles.validationBadge, { backgroundColor: isKmValid ? '#e6fcf5' : '#fff5f5' }]}>
                            <IconButton icon={isKmValid ? "check-circle" : "alert-circle"} size={16} iconColor={isKmValid ? "#0ca678" : "#fa5252"} style={{ margin: 0, marginRight: 4 }} />
                            <Text style={{ color: isKmValid ? '#0ca678' : '#fa5252', fontWeight: 'bold', fontSize: 13 }}>
                                {isKmValid ? `+ ${kmRecorridos.toLocaleString()} km hoy` : 'Menor al anterior'}
                            </Text>
                        </View>
                    )}
                </Surface>


                {/* 4. COMBUSTIBLE (Opcional) */}
                <Text style={styles.sectionLabel}>COMBUSTIBLE (OPCIONAL)</Text>
                <Surface style={styles.fuelCard} elevation={0}>
                    <View style={styles.fuelIcon}>
                        <IconButton icon="gas-station" iconColor="#fd7e14" size={24} />
                    </View>
                    <TextInput
                        mode="flat"
                        value={litrosInput}
                        onChangeText={setLitrosInput}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor="#dee2e6"
                        style={styles.fuelInput}
                        underlineColor="transparent"
                        activeUnderlineColor="transparent"
                        textColor="#495057"
                    />
                    <Text style={styles.fuelUnit}>LITROS</Text>
                </Surface>

                <View style={{ height: 30 }} />

                {/* SUBMIT BUTTON */}
                <TouchableOpacity
                    onPress={handleSubmit}
                    activeOpacity={0.9}
                    disabled={submitting || !kmInput || !isKmValid}
                >
                    <LinearGradient
                        colors={(!kmInput || !isKmValid) ? ['#e9ecef', '#e9ecef'] : ['#1098ad', '#0b7285']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.submitButton}
                    >
                        {submitting ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={[styles.submitText, (!kmInput || !isKmValid) && { color: '#adb5bd' }]}>CONFIRMAR REPORTE</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                <View style={{ height: 50 }} />

            </ScrollView>

            {/* MODAL PARA SELECCIÓN (Estilo minimalista) */}
            {modalVisible && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>
                            Seleccionar {selectorTipo === 'vehiculo' ? 'Vehículo' : 'Ruta'}
                        </Text>
                        <TextInput
                            mode="outlined"
                            placeholder="Buscar..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            style={styles.searchInput}
                            outlineStyle={{ borderRadius: 12, borderColor: '#dee2e6' }}
                            left={<TextInput.Icon icon="magnify" color="#adb5bd" />}
                        />
                        <ScrollView style={{ maxHeight: 300 }}>
                            {(selectorTipo === 'vehiculo' ? listaVehiculos : listaRutas)
                                .filter(item => {
                                    if (!searchQuery) return true;
                                    const texto = searchQuery.toLowerCase();
                                    if (selectorTipo === 'vehiculo') {
                                        return item.patente.toLowerCase().includes(texto) || item.modelo.toLowerCase().includes(texto);
                                    } else {
                                        return item.codigo.toLowerCase().includes(texto) || item.descripcion.toLowerCase().includes(texto);
                                    }
                                })
                                .map((item) => (
                                    <TouchableOpacity
                                        key={item._id}
                                        style={styles.modalItem}
                                        onPress={() => seleccionarItem(item)}
                                    >
                                        <View style={[styles.modalItemIcon, { backgroundColor: selectorTipo === 'vehiculo' ? '#e7f5ff' : '#e6fcf5' }]}>
                                            <IconButton icon={selectorTipo === 'vehiculo' ? "truck" : "map-marker"} size={20} iconColor={selectorTipo === 'vehiculo' ? "#1c7ed6" : "#0ca678"} />
                                        </View>
                                        <View>
                                            <Text style={styles.modalItemTitle}>
                                                {selectorTipo === 'vehiculo' ? item.patente : item.codigo}
                                            </Text>
                                            <Text style={styles.modalItemSubtitle}>
                                                {selectorTipo === 'vehiculo' ? item.modelo : item.descripcion}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                        </ScrollView>
                        <Button mode="text" onPress={() => setModalVisible(false)} textColor="#fa5252" style={{ marginTop: 10 }}>
                            CANCELAR
                        </Button>
                    </View>
                </View>
            )}

            {/* MODAL DE ÉXITO */}
            <Portal>
                <Modal visible={successModalVisible} onDismiss={() => { }} contentContainerStyle={styles.successModal}>
                    <View style={styles.successContent}>
                        <Surface style={styles.successIconContainer} elevation={0}>
                            <IconButton icon="check-bold" size={40} iconColor="white" />
                        </Surface>
                        <Text style={styles.successTitle}>¡Registro Exitoso!</Text>
                        <Text style={styles.successSubtitle}>Los kilómetros se guardaron correctamente en el sistema.</Text>

                        <Button
                            mode="contained"
                            onPress={() => {
                                setSuccessModalVisible(false);
                                navigation.goBack();
                            }}
                            style={styles.successButton}
                            labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
                            contentStyle={{ height: 50 }}
                            buttonColor="#40c057"
                        >
                            CONTINUAR
                        </Button>
                    </View>
                </Modal>
            </Portal>

            {/* Error Snackbar */}
            <Portal>
                <Snackbar
                    visible={snackbarVisible}
                    onDismiss={() => setSnackbarVisible(false)}
                    duration={3000}
                    style={{ backgroundColor: theme.colors.error, borderRadius: 12, marginBottom: 20, marginHorizontal: 16 }}
                >
                    <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>{snackbarMessage}</Text>
                </Snackbar>
            </Portal>

            {/* SELECTOR DE FECHA (3 DÍAS) - REFACTORIZADO A ESTILO CUSTOm */}
            {showDatePicker && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Fecha del Reporte</Text>
                        <View style={styles.dateGrid}>
                            {Array.from({ length: 4 }).map((_, i) => {
                                const offset = 3 - i;
                                const d = new Date();
                                d.setDate(d.getDate() - offset);
                                const isSelected = d.toDateString() === fecha.toDateString();
                                const dayName = d.toLocaleDateString('es-AR', { weekday: 'short' }).toUpperCase().replace('.', '');
                                const dayNumber = d.getDate();

                                return (
                                    <TouchableOpacity
                                        key={i}
                                        style={[styles.miniDateCard, isSelected && styles.miniDateCardSelected]}
                                        onPress={() => {
                                            setFecha(d);
                                            setShowDatePicker(false);
                                        }}
                                    >
                                        <Text style={[styles.miniDateDay, isSelected && { color: '#1098ad' }]}>{dayName}</Text>
                                        <Text style={[styles.miniDateNumber, isSelected && { color: '#212529' }]}>{dayNumber}</Text>
                                        {isSelected && <View style={styles.miniDateIndicator} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        <Button mode="text" onPress={() => setShowDatePicker(false)} textColor="#fa5252" style={{ marginTop: 10 }}>
                            CANCELAR
                        </Button>
                    </View>
                </View>
            )}

        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
        backgroundColor: '#f8f9fa',
    },
    backButton: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center',
        elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#212529' },

    content: { padding: 20, paddingTop: 8 },
    sectionLabel: { fontSize: 14, fontWeight: 'bold', color: '#adb5bd', marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase' },

    // Date Card
    dateCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 24,
        borderWidth: 1, borderColor: '#f1f3f5',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1
    },
    dateIconContainer: {
        width: 44, height: 44, borderRadius: 12, backgroundColor: '#e7f5ff', justifyContent: 'center', alignItems: 'center', marginRight: 16
    },
    dateValue: { fontSize: 18, fontWeight: 'bold', color: '#495057', textTransform: 'capitalize' },
    dateYear: { fontSize: 14, color: '#adb5bd' },

    // Selectors
    row: { flexDirection: 'row', marginBottom: 24 },
    selectorCard: {
        backgroundColor: 'white', borderRadius: 16, padding: 16,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: '#f1f3f5', height: 140,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2
    },
    iconCircle: {
        width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginBottom: 12
    },
    selectorValue: { fontSize: 20, fontWeight: 'bold', color: '#212529', marginBottom: 4 },
    selectorSubtitle: { fontSize: 15, color: '#868e96', fontWeight: '500' },

    // Odometer Hero
    odometerHero: {
        backgroundColor: 'white', borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 24,
        shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 6
    },
    lastKmBadge: { backgroundColor: '#f8f9fa', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 16 },
    lastKmText: { fontSize: 14, fontWeight: 'bold', color: '#adb5bd', letterSpacing: 0.5 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: '#f1f3f5', paddingBottom: 8, width: '100%' },
    heroInput: {
        fontSize: 46, fontWeight: 'bold', textAlign: 'center', backgroundColor: 'transparent', flex: 1, height: 60, padding: 0
    },
    unitText: { fontSize: 22, fontWeight: 'bold', color: '#ced4da', marginLeft: 8, alignSelf: 'center' },
    validationBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },

    // Fuel
    fuelCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 16, paddingHorizontal: 20, height: 72,
        borderWidth: 1, borderColor: '#f1f3f5'
    },
    fuelIcon: { marginRight: 12 },
    fuelInput: { flex: 1, backgroundColor: 'transparent', fontSize: 24, fontWeight: '700' },
    fuelUnit: { fontSize: 16, fontWeight: 'bold', color: '#adb5bd' },

    // Submit
    submitButton: {
        height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center',
        shadowColor: '#1098ad', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8
    },
    submitText: { fontSize: 20, fontWeight: 'bold', color: 'white', letterSpacing: 1 },

    // Modal
    modalOverlay: {
        position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', zIndex: 999
    },
    modalContainer: {
        width: '85%', backgroundColor: 'white', borderRadius: 24, padding: 24, elevation: 10
    },
    modalTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 16, color: '#212529' },
    searchInput: { backgroundColor: 'white', marginBottom: 16, height: 50 },
    modalItem: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f8f9fa'
    },
    modalItemIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    modalItemTitle: { fontSize: 18, fontWeight: 'bold', color: '#212529' },
    modalItemSubtitle: { fontSize: 15, color: '#868e96' },

    // Success Modal
    successModal: { backgroundColor: 'white', margin: 24, borderRadius: 32, padding: 40, alignItems: 'center' },
    successContent: { width: '100%', alignItems: 'center' },
    successIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#40c057', justifyContent: 'center', alignItems: 'center', marginBottom: 24, elevation: 10, shadowColor: '#40c057', shadowOpacity: 0.4, shadowRadius: 20 },
    successTitle: { fontSize: 24, fontWeight: 'bold', color: '#212529', marginBottom: 8 },
    successSubtitle: { fontSize: 16, color: '#868e96', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
    successButton: { width: '100%', borderRadius: 16 },

    // Date Modal
    dateModalContent: { backgroundColor: 'white', margin: 20, borderRadius: 24, padding: 24, elevation: 0, width: '85%', alignSelf: 'center' },
    dateGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 12 },
    miniDateCard: { width: '45%', aspectRatio: 1, backgroundColor: '#f8f9fa', borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
    miniDateCardSelected: { backgroundColor: '#e3fafc', borderColor: '#1098ad' },
    miniDateDay: { fontSize: 16, fontWeight: 'bold', color: '#adb5bd', marginBottom: 4 },
    miniDateNumber: { fontSize: 36, fontWeight: 'bold', color: '#343a40', textAlign: 'center', includeFontPadding: false, textAlignVertical: 'center' },
    miniDateIndicator: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: '#1098ad' }

});

export default CargaKilometrajeScreen;
