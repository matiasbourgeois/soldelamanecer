import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, StatusBar, TextInput as NativeInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, Appbar, Button, HelperText, ActivityIndicator, useTheme, Surface, IconButton, Snackbar, Portal, Modal, TextInput as PaperInput } from 'react-native-paper';
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
    // State for Confirmation Modal (God Tier)
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    // State for Mileage Input Modal
    const [kmModalVisible, setKmModalVisible] = useState(false);
    const [tempKmInput, setTempKmInput] = useState('');

    // State for Error Modal (God Tier)
    const [errorModalVisible, setErrorModalVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // State for Observations
    const [observacionesModalVisible, setObservacionesModalVisible] = useState(false);
    const [observaciones, setObservaciones] = useState('');

    // Persistence: Load Observations Draft
    useEffect(() => {
        const loadDraft = async () => {
            try {
                const key = `observaciones_draft_${user?.id}_${vehiculoAsignado?._id || 'default'}`;
                const draft = await AsyncStorage.getItem(key);
                if (draft) setObservaciones(draft);
            } catch (e) {
                console.log('Error loading draft', e);
            }
        };
        if (user?.id) loadDraft();
    }, [user?.id, vehiculoAsignado?._id]);

    // Persistence: Save Observations Draft
    useEffect(() => {
        const saveDraft = async () => {
            try {
                const key = `observaciones_draft_${user?.id}_${vehiculoAsignado?._id || 'default'}`;
                await AsyncStorage.setItem(key, observaciones);
            } catch (e) {
                console.log('Error saving draft', e);
            }
        };
        if (user?.id) saveDraft();
    }, [observaciones, user?.id, vehiculoAsignado?._id]);

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
            setKmInput(''); // Limpiar input para evitar confusión
            setTempKmInput('');
        } else {
            setRutaAsignado(item);
        }
        setModalVisible(false);
    };

    const handleOpenKmModal = () => {
        setTempKmInput(kmInput || (vehiculoAsignado?.kilometrajeActual?.toString() || ''));
        setKmModalVisible(true);
    };

    const handleSaveKm = () => {
        const diff = parseInt(tempKmInput) - (vehiculoAsignado?.kilometrajeActual || 0);
        if (diff < 0) {
            setErrorMessage('El kilometraje no puede ser menor al anterior.');
            setErrorModalVisible(true);
            return;
        }
        setKmInput(tempKmInput);
        setKmModalVisible(false);
    };

    const handleSubmit = async () => {
        if (!vehiculoAsignado) {
            setErrorMessage('Debes seleccionar un vehículo.');
            setErrorModalVisible(true);
            return;
        }
        if (!kmInput) {
            setErrorMessage('Por favor ingresá el kilometraje actual.');
            setErrorModalVisible(true);
            return;
        }

        const kmNuevo = parseInt(kmInput);
        const kmAnterior = vehiculoAsignado.kilometrajeActual || 0;

        if (kmNuevo < kmAnterior) {
            Alert.alert('Error', `El KM no puede ser menor al anterior (${kmAnterior} km).`);
            return;
        }

        // --- NUEVA CONFIRMACIÓN PROFESIONAL (GOD TIER MODAL) ---
        setConfirmModalVisible(true);
    };

    const handleConfirmSubmission = () => {
        setConfirmModalVisible(false);
        const kmNuevo = parseInt(kmInput);
        const kmAnterior = vehiculoAsignado.kilometrajeActual || 0;
        const kmRecorridosFinal = kmNuevo - kmAnterior;

        // Validación extra de seguridad para saltos grandes de KM
        if (kmRecorridosFinal > 1500) {
            setErrorMessage(`Estás cargando un recorrido inusual (+ ${kmRecorridosFinal} KM). ¿Es correcto?`);
            // We keep Alert here just for the "Yes/No" choice as confirmation, 
            // or we could build a specialized confirm modal. For now, fixing the bug requested.
            Alert.alert('Advertencia', 'Estás cargando más de 1500km recorridos en un solo reporte. ¿Confirmás que es correcto?', [
                { text: 'CANCELAR', style: 'cancel' },
                { text: 'SÍ, ES CORRECTO', onPress: () => enviarDatos() }
            ]);
        } else {
            enviarDatos();
        }
    };

    const enviarDatos = async () => {
        setSubmitting(true);
        try {
            const payload = {
                kilometraje: parseInt(kmInput),
                litros: litrosInput ? parseFloat(litrosInput) : 0,
                rutaId: rutaAsignada?._id || null,
                fecha: fecha.toISOString(),
                observaciones: observaciones
            };

            await api.post(`/vehiculos/${vehiculoAsignado._id}/reporte-chofer`, payload);

            // Clear draft on success
            const key = `observaciones_draft_${user?.id}_${vehiculoAsignado?._id || 'default'}`;
            await AsyncStorage.removeItem(key);
            setObservaciones('');

            setSubmitting(false);
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
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#083344' }}>
                <ActivityIndicator size="large" color="#22d3ee" />
                <Text style={{ marginTop: 10, color: '#94a3b8' }}>Cargando configuración...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* GLOBAL BACKGROUND GRADIENT (Darker for contrast) */}
            <LinearGradient
                colors={['#020617', '#0f172a']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>

                {/* HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <IconButton icon="arrow-left" iconColor="white" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Reporte Diario</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                    {/* 1. FECHA (Glass Style - New Color) */}
                    <Text style={styles.sectionLabel}>FECHA DEL REPORTE</Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
                        <View style={styles.glassCardRow}>
                            <View style={[styles.iconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                                <IconButton icon="calendar-month" iconColor="#38bdf8" size={24} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.cardValue}>
                                    {fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </Text>
                                <Text style={styles.cardSubtitle}>{fecha.getFullYear()}</Text>
                            </View>
                            <IconButton icon="chevron-down" size={20} iconColor="rgba(255,255,255,0.5)" />
                        </View>
                    </TouchableOpacity>

                    {/* 2. SELECTORES (Glass Row) */}
                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={styles.sectionLabel}>VEHÍCULO</Text>
                            <TouchableOpacity onPress={() => abrirSelector('vehiculo')} activeOpacity={0.85}>
                                <View style={styles.glassCardColumn}>
                                    <View style={[styles.iconCircleSmall, { backgroundColor: 'rgba(34, 211, 238, 0.1)' }]}>
                                        <IconButton icon="truck" iconColor="#22d3ee" size={20} />
                                    </View>
                                    <Text style={styles.cardValueSmall} numberOfLines={1}>
                                        {vehiculoAsignado?.patente?.toUpperCase() || '---'}
                                    </Text>
                                    <Text style={styles.cardSubtitle} numberOfLines={1}>
                                        {vehiculoAsignado?.modelo?.toUpperCase() || 'Seleccionar'}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={styles.sectionLabel}>RUTA</Text>
                            <TouchableOpacity onPress={() => abrirSelector('ruta')} activeOpacity={0.85}>
                                <View style={styles.glassCardColumn}>
                                    <View style={[styles.iconCircleSmall, { backgroundColor: 'rgba(45, 212, 191, 0.1)' }]}>
                                        <IconButton icon="map-marker-path" iconColor="#2dd4bf" size={20} />
                                    </View>
                                    <Text style={styles.cardValueSmall} numberOfLines={1}>
                                        {rutaAsignada?.codigo?.toUpperCase() || '---'}
                                    </Text>
                                    <Text style={styles.cardSubtitle} numberOfLines={1}>
                                        {rutaAsignada?.horaSalida || 'Seleccionar'}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 3. ODÓMETRO (God Tier Redesign - Full Card Click) */}
                    <Text style={styles.sectionLabel}>KILOMETRAJE ACTUAL</Text>

                    <TouchableOpacity
                        style={styles.heroCardContainer}
                        onPress={handleOpenKmModal}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.04)']}
                            style={styles.heroCardGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                        >
                            <View style={styles.lastKmBadge}>
                                <Text style={styles.lastKmText}>ANTERIOR: {vehiculoAsignado?.kilometrajeActual?.toLocaleString('es-AR') || '0'} KM</Text>
                            </View>

                            <View style={styles.heroValueWrapper}>
                                <Text style={styles.heroValueText}>
                                    {kmInput || vehiculoAsignado?.kilometrajeActual?.toLocaleString('es-AR') || '0'}
                                </Text>
                                <Text style={styles.heroUnitTag}>KM</Text>
                            </View>

                            {kmInput !== '' && (
                                <View style={[styles.validationBadge, { backgroundColor: isKmValid ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}>
                                    <IconButton icon={isKmValid ? "check-circle" : "alert-circle"} size={16} iconColor={isKmValid ? "#4ade80" : "#ef4444"} style={{ margin: 0, marginRight: 4 }} />
                                    <Text style={{ color: isKmValid ? '#4ade80' : '#ef4444', fontWeight: 'bold', fontSize: 13 }}>
                                        {isKmValid ? `+ ${kmRecorridos.toLocaleString()} km hoy` : 'Menor al anterior'}
                                    </Text>
                                </View>
                            )}

                            <View style={styles.editHint}>
                                <IconButton icon="pencil" size={12} iconColor="rgba(255,255,255,0.4)" />
                                <Text style={styles.editHintText}>Toca para editar</Text>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>


                    {/* 4. COMBUSTIBLE (Glass Style - Dynamic Units) */}
                    <Text style={styles.sectionLabel}>COMBUSTIBLE (OPCIONAL)</Text>
                    <View style={[styles.glassCardRow, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(251, 146, 60, 0.2)' }]}>
                        <View style={[styles.iconCircle, { backgroundColor: 'rgba(251, 146, 60, 0.2)' }]}>
                            <IconButton
                                icon={vehiculoAsignado?.tipoCombustible === 'GNC' ? 'gas-cylinder' : 'gas-station'}
                                iconColor="#fb923c"
                                size={24}
                            />
                        </View>
                        <NativeInput
                            value={litrosInput}
                            onChangeText={setLitrosInput}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            style={styles.fuelInput}
                            selectionColor="#fb923c"
                            underlineColorAndroid="transparent"
                        />
                        <Text style={styles.fuelUnit}>
                            {vehiculoAsignado?.tipoCombustible === 'GNC' ? 'M³' : 'LITROS'}
                        </Text>
                    </View>

                    {/* 5. OBSERVACIONES (Glass Card Button - Nivel Dios) */}
                    <Text style={styles.sectionLabel}>OBSERVACIONES / NOVEDADES</Text>
                    <TouchableOpacity
                        onPress={() => setObservacionesModalVisible(true)}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.glassCardRow, {
                            backgroundColor: observaciones ? 'rgba(34, 211, 238, 0.12)' : 'rgba(255,255,255,0.05)',
                            borderColor: observaciones ? 'rgba(34, 211, 238, 0.5)' : 'rgba(255,255,255,0.1)',
                            borderWidth: observaciones ? 1.5 : 1,
                            minHeight: 95,
                            // Dynamic Padding for aesthetic balance
                            paddingVertical: observaciones ? 18 : 16
                        }]}>
                            <View style={[styles.iconCircle, {
                                backgroundColor: observaciones ? 'rgba(34, 211, 238, 0.2)' : 'rgba(255,255,255,0.1)',
                                borderColor: observaciones ? 'rgba(34, 211, 238, 0.3)' : 'transparent',
                                borderWidth: observaciones ? 1 : 0
                            }]}>
                                <IconButton
                                    icon={observaciones ? "chat-processing" : "chat-processing-outline"}
                                    iconColor={observaciones ? "#22d3ee" : "rgba(255,255,255,0.4)"}
                                    size={24}
                                />
                            </View>
                            <View style={{ flex: 1, justifyContent: 'center' }}>
                                <Text
                                    numberOfLines={2}
                                    style={[styles.cardValueSmall, {
                                        color: observaciones ? 'white' : 'rgba(255,255,255,0.4)',
                                        fontSize: observaciones ? 16 : 20,
                                        fontWeight: observaciones ? '700' : '600',
                                        lineHeight: observaciones ? 22 : 24,
                                        marginBottom: observaciones ? 2 : 4
                                    }]}
                                >
                                    {observaciones
                                        ? observaciones
                                        : "Sin novedades para reportar"
                                    }
                                </Text>
                                <Text style={styles.cardSubtitle}>
                                    {observaciones ? "Toca para editar tu comentario" : "Toca para informar ruidos, fallas, etc."}
                                </Text>
                            </View>
                            <IconButton icon="chevron-right" size={20} iconColor="rgba(255,255,255,0.3)" />
                        </View>
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />

                    {/* SUBMIT BUTTON */}
                    <TouchableOpacity
                        onPress={handleSubmit}
                        activeOpacity={0.9}
                        disabled={submitting || !kmInput || !isKmValid}
                    >
                        <LinearGradient
                            colors={(!kmInput || !isKmValid) ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'] : ['#06b6d4', '#3b82f6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.submitButton}
                        >
                            {submitting ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={[styles.submitText, (!kmInput || !isKmValid) && { color: 'rgba(255,255,255,0.3)' }]}>CONFIRMAR REPORTE</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={{ height: 50 }} />

                </ScrollView>

                {/* MODAL PARA SELECCIÓN (Theme Adjusted) */}
                {modalVisible && (
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContainer}>
                            <Text style={styles.modalTitle}>
                                Seleccionar {selectorTipo === 'vehiculo' ? 'Vehículo' : 'Ruta'}
                            </Text>
                            <PaperInput
                                mode="outlined"
                                placeholder="Buscar..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                style={styles.searchInput}
                                outlineStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }}
                                left={<PaperInput.Icon icon="magnify" color="#94a3b8" />}
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
                                            <View style={[styles.modalItemIcon, { backgroundColor: selectorTipo === 'vehiculo' ? '#ecfeff' : '#f0fdfa' }]}>
                                                <IconButton icon={selectorTipo === 'vehiculo' ? "truck" : "map-marker"} size={20} iconColor={selectorTipo === 'vehiculo' ? "#06b6d4" : "#14b8a6"} />
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
                            <Button mode="text" onPress={() => setModalVisible(false)} textColor="#ef4444" style={{ marginTop: 10 }}>
                                CANCELAR
                            </Button>
                        </View>
                    </View>
                )}

                {/* MODAL PARA ACTUALIZAR KM */}
                <Portal>
                    <Modal visible={kmModalVisible} onDismiss={() => setKmModalVisible(false)} contentContainerStyle={styles.confirmModal}>
                        <LinearGradient colors={['#0f172a', '#020617']} style={styles.confirmModalGradient}>
                            <View style={[styles.confirmIconRing, { borderColor: 'rgba(56, 189, 248, 0.3)', backgroundColor: 'rgba(56, 189, 248, 0.05)' }]}>
                                <IconButton icon="counter" size={32} iconColor="#38bdf8" />
                            </View>
                            <Text style={styles.confirmTitle}>Actualizar Odómetro</Text>
                            <Text style={styles.confirmSubtitle}>Ingresá el kilometraje actual del vehículo {vehiculoAsignado?.patente?.toUpperCase()}.</Text>

                            <View style={[styles.summaryContainer, { marginTop: 20, backgroundColor: 'rgba(0,0,0,0.2)' }]}>
                                <View style={styles.kmInputWrapper}>
                                    <NativeInput
                                        value={tempKmInput}
                                        onChangeText={setTempKmInput}
                                        keyboardType="numeric"
                                        style={styles.kmInputBig}
                                        autoFocus
                                        selectionColor="#38bdf8"
                                        placeholder="0"
                                        placeholderTextColor="rgba(255,255,255,0.2)"
                                    />
                                    <Text style={styles.kmUnitBig}>KM</Text>
                                </View>
                            </View>

                            {/* FEEDBACK EN TIEMPO REAL DENTRO DEL MODAL */}
                            {tempKmInput !== '' && (() => {
                                const diff = parseInt(tempKmInput) - (vehiculoAsignado?.kilometrajeActual || 0);
                                const isValid = diff >= 0;
                                return (
                                    <View style={[styles.validationBadge, { marginTop: 0, marginBottom: 20, backgroundColor: isValid ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
                                        <IconButton icon={isValid ? "check-circle" : "alert-circle"} size={16} iconColor={isValid ? "#4ade80" : "#ef4444"} style={{ margin: 0, marginRight: 4 }} />
                                        <Text style={{ color: isValid ? '#4ade80' : '#ef4444', fontWeight: 'bold', fontSize: 13 }}>
                                            {isValid ? `+ ${diff.toLocaleString()} km hoy` : 'KILOMETRAJE MENOR AL ANTERIOR'}
                                        </Text>
                                    </View>
                                );
                            })()}

                            <TouchableOpacity
                                onPress={() => {
                                    const diff = parseInt(tempKmInput) - (vehiculoAsignado?.kilometrajeActual || 0);
                                    if (diff < 0) {
                                        setErrorMessage('El kilometraje no puede ser menor al anterior.');
                                        setErrorModalVisible(true);
                                        return;
                                    }
                                    handleSaveKm();
                                }}
                                activeOpacity={0.9}
                                style={{ width: '100%', marginBottom: 12 }}
                            >
                                <LinearGradient
                                    colors={parseInt(tempKmInput) - (vehiculoAsignado?.kilometrajeActual || 0) < 0 ? ['#475569', '#334155'] : ['#38bdf8', '#0ea5e9']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.confirmButtonPrim}
                                >
                                    <Text style={styles.confirmButtonText}>GUARDAR KILOMETRAJE</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <Button mode="text" onPress={() => setKmModalVisible(false)} textColor="rgba(255,255,255,0.4)">
                                CANCELAR
                            </Button>
                        </LinearGradient>
                    </Modal>
                </Portal>

                {/* MODAL PARA OBSERVACIONES (GOD TIER) */}
                <Portal>
                    <Modal
                        visible={observacionesModalVisible}
                        onDismiss={() => setObservacionesModalVisible(false)}
                        contentContainerStyle={styles.observationsModal}
                    >
                        <LinearGradient colors={['#0f172a', '#020617']} style={styles.confirmModalGradient}>
                            <ScrollView
                                contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }}
                                showsVerticalScrollIndicator={false}
                                style={{ width: '100%' }}
                            >
                                <View style={[styles.confirmIconRing, { borderColor: 'rgba(34, 211, 238, 0.3)', backgroundColor: 'rgba(34, 211, 238, 0.05)', marginTop: 10 }]}>
                                    <IconButton icon="chat-processing" size={32} iconColor="#22d3ee" />
                                </View>
                                <Text style={styles.confirmTitle}>Novedades de la Jornada</Text>
                                <Text style={styles.confirmSubtitle}>Reportá cualquier inconveniente con el vehículo o la ruta.</Text>

                                <View style={[styles.summaryContainer, {
                                    marginTop: 24,
                                    backgroundColor: 'rgba(0,0,0,0.3)',
                                    height: 180,
                                    padding: 15,
                                    marginBottom: 24
                                }]}>
                                    <NativeInput
                                        value={observaciones}
                                        onChangeText={setObservaciones}
                                        multiline
                                        numberOfLines={8}
                                        placeholder="Escribí acá tus comentarios..."
                                        placeholderTextColor="rgba(255,255,255,0.2)"
                                        style={{
                                            color: 'white',
                                            fontSize: 16,
                                            textAlignVertical: 'top',
                                            height: '100%',
                                            paddingTop: 0
                                        }}
                                        selectionColor="#22d3ee"
                                        underlineColorAndroid="transparent"
                                    />
                                </View>

                                <TouchableOpacity
                                    onPress={() => setObservacionesModalVisible(false)}
                                    activeOpacity={0.9}
                                    style={{ width: '100%', marginBottom: 16 }}
                                >
                                    <LinearGradient
                                        colors={['#06b6d4', '#0891b2']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.confirmButtonPrim}
                                    >
                                        <Text style={styles.confirmButtonText}>GUARDAR NOVEDADES</Text>
                                    </LinearGradient>
                                </TouchableOpacity>

                                <Button
                                    mode="text"
                                    onPress={() => setObservacionesModalVisible(false)}
                                    textColor="rgba(255,255,255,0.5)"
                                    labelStyle={{ fontWeight: 'bold' }}
                                >
                                    CERRAR
                                </Button>
                            </ScrollView>
                        </LinearGradient>
                    </Modal>
                </Portal>

                {/* MODAL DE ERROR (GOD TIER) */}
                <Portal>
                    <Modal visible={errorModalVisible} onDismiss={() => setErrorModalVisible(false)} contentContainerStyle={styles.confirmModal}>
                        <LinearGradient colors={['#1e1b4b', '#020617']} style={styles.confirmModalGradient}>
                            <View style={[styles.confirmIconRing, { borderColor: 'rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }]}>
                                <IconButton icon="alert-octagon" size={32} iconColor="#ef4444" />
                            </View>
                            <Text style={[styles.confirmTitle, { color: '#ef4444' }]}>¡Atención!</Text>
                            <Text style={styles.confirmSubtitle}>{errorMessage}</Text>

                            <TouchableOpacity onPress={() => setErrorModalVisible(false)} activeOpacity={0.9} style={{ width: '100%', marginTop: 20 }}>
                                <LinearGradient colors={['#ef4444', '#b91c1c']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.confirmButtonPrim}>
                                    <Text style={styles.confirmButtonText}>ENTENDIDO</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </LinearGradient>
                    </Modal>
                </Portal>

                {/* MODAL DE CONFIRMACIÓN (GOD TIER) */}
                <Portal>
                    <Modal visible={confirmModalVisible} onDismiss={() => setConfirmModalVisible(false)} contentContainerStyle={styles.confirmModal}>
                        <LinearGradient
                            colors={['#0c4a6e', '#082f49']}
                            style={styles.confirmModalGradient}
                        >
                            <View style={styles.confirmHeader}>
                                <View style={styles.confirmIconRing}>
                                    <IconButton icon="file-document-check" size={32} iconColor="#22d3ee" />
                                </View>
                                <Text style={styles.confirmTitle}>Verificar Datos</Text>
                                <Text style={styles.confirmSubtitle}>Asegurará de que la información coincida con tu jornada actual.</Text>
                            </View>

                            <View style={[styles.summaryContainer, { backgroundColor: 'rgba(0,0,0,0.3)', borderColor: 'rgba(34, 211, 238, 0.2)' }]}>
                                <View style={styles.summaryRow}>
                                    <View style={styles.summaryIconBox}>
                                        <IconButton icon="truck" size={18} iconColor="#22d3ee" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.summaryLabel}>VEHÍCULO</Text>
                                        <Text style={styles.summaryValue}>{vehiculoAsignado?.patente?.toUpperCase()}</Text>
                                    </View>
                                </View>

                                <View style={styles.summaryDivider} />

                                <View style={styles.summaryRow}>
                                    <View style={styles.summaryIconBox}>
                                        <IconButton icon="map-marker-path" size={18} iconColor="#22d3ee" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.summaryLabel}>RUTA</Text>
                                        <Text style={styles.summaryValue}>{rutaAsignada?.codigo || 'GENERAL'}</Text>
                                    </View>
                                </View>

                                <View style={styles.summaryDivider} />

                                <View style={styles.summaryRow}>
                                    <View style={styles.summaryIconBox}>
                                        <IconButton icon="counter" size={18} iconColor="#22d3ee" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.summaryLabel}>KM RECORRIDOS</Text>
                                        <Text style={styles.summaryValue}>+ {kmRecorridos.toLocaleString('es-AR')} KM</Text>
                                    </View>
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={handleConfirmSubmission}
                                activeOpacity={0.9}
                                style={{ width: '100%', marginBottom: 12 }}
                            >
                                <LinearGradient
                                    colors={['#06b6d4', '#2563eb']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.confirmButtonPrim}
                                >
                                    <Text style={styles.confirmButtonText}>CONFIRMAR Y ENVIAR</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <Button
                                mode="text"
                                onPress={() => setConfirmModalVisible(false)}
                                textColor="rgba(255,255,255,0.4)"
                                labelStyle={{ fontWeight: '800', letterSpacing: 1 }}
                            >
                                REVISAR DATOS
                            </Button>
                        </LinearGradient>
                    </Modal>
                </Portal>

                {/* MODAL DE ÉXITO */}
                <Portal>
                    <Modal visible={successModalVisible} onDismiss={() => { }} contentContainerStyle={styles.successModal}>
                        <View style={styles.successContent}>
                            <View style={styles.successIconContainer}>
                                <IconButton icon="check-bold" size={40} iconColor="white" />
                            </View>
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
                                buttonColor="#10b981"
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
                        style={{ backgroundColor: '#ef4444', borderRadius: 12, marginBottom: 20, marginHorizontal: 16 }}
                    >
                        <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>{snackbarMessage}</Text>
                    </Snackbar>
                </Portal>

                {/* SELECTOR DE FECHA (3 DÍAS) */}
                {showDatePicker && (
                    <View style={styles.modalOverlay}>
                        <LinearGradient
                            colors={['#0c4a6e', '#082f49']}
                            style={styles.modalContainerGlass}
                        >
                            <Text style={styles.modalTitleLight}>Fecha del Reporte</Text>
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
                                            activeOpacity={0.8}
                                            style={styles.miniDateWrapper}
                                            onPress={() => {
                                                setFecha(d);
                                                setShowDatePicker(false);
                                            }}
                                        >
                                            <LinearGradient
                                                colors={isSelected ? ['#06b6d4', '#0891b2'] : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.03)']}
                                                style={[styles.miniDateCardBase, isSelected && styles.miniDateCardSelectedBorder]}
                                            >
                                                <Text style={[styles.miniDateDayText, isSelected ? { color: 'rgba(255,255,255,0.8)' } : { color: '#22d3ee' }]}>{dayName}</Text>
                                                <Text style={styles.miniDateNumberText}>{dayNumber}</Text>
                                                {isSelected && <View style={styles.miniDateIndicatorWhite} />}
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={() => setShowDatePicker(false)}
                            >
                                <Text style={styles.modalCloseButtonText}>CANCELAR</Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                )}

            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50, // More space for StatusBar
        paddingBottom: 20,
    },
    backButton: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: 'white', letterSpacing: 0.5 },

    content: { padding: 20 },
    sectionLabel: { fontSize: 13, fontWeight: '800', color: '#22d3ee', marginBottom: 12, letterSpacing: 1.5, textTransform: 'uppercase' },

    // Glass Card Styles
    glassCardRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 24, padding: 16, marginBottom: 28,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    },
    glassCardColumn: {
        backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 24, padding: 16,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', height: 160,
    },

    // Icons
    iconCircle: {
        width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(34, 211, 238, 0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 16, overflow: 'hidden'
    },
    iconCircleSmall: {
        width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12
    },

    // Typography
    cardValue: { fontSize: 18, fontWeight: '700', color: 'white', textTransform: 'capitalize' },
    cardValueSmall: { fontSize: 20, fontWeight: '700', color: 'white', marginBottom: 4 },
    cardSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.6)' },

    // Selectors Layout
    row: { flexDirection: 'row', marginBottom: 28 },

    // Hero Card Redesign (Stable Glass)
    heroCardContainer: {
        marginBottom: 28,
        borderRadius: 30,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    heroCardGradient: {
        padding: 24,
        alignItems: 'center',
    },
    lastKmBadge: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 16
    },
    lastKmText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.75)',
        letterSpacing: 0.5
    },
    heroUnitTag: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#22d3ee',
        marginLeft: 8,
        opacity: 0.9
    },
    heroValueWrapper: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'center',
    },
    heroValueText: {
        fontSize: 64,
        fontWeight: '900',
        color: 'white',
        letterSpacing: -2,
    },
    editHint: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        opacity: 0.6
    },
    editHintText: {
        fontSize: 11,
        color: 'white',
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase'
    },

    validationBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },

    // KM Modal Styles
    kmInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    kmInputBig: {
        fontSize: 48,
        fontWeight: '900',
        color: 'white',
        textAlign: 'center',
        minWidth: 150,
    },
    kmUnitBig: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#38bdf8',
        marginLeft: 8,
    },

    // Fuel
    fuelInput: { flex: 1, backgroundColor: 'transparent', fontSize: 24, fontWeight: '700', color: 'white' },
    fuelUnit: { fontSize: 16, fontWeight: 'bold', color: 'rgba(255,255,255,0.5)' },

    // Submit
    submitButton: {
        height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center',
        shadowColor: '#06b6d4', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8
    },
    submitText: { fontSize: 18, fontWeight: '900', color: 'white', letterSpacing: 1.5, textTransform: 'uppercase' },

    // Modal Generic
    modalOverlay: {
        position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 999
    },
    modalContainer: {
        width: '85%', backgroundColor: 'white', borderRadius: 24, padding: 24, elevation: 10
    },
    modalTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 16, color: '#1e293b' },
    searchInput: { backgroundColor: 'white', marginBottom: 16, height: 50 },
    modalItem: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9'
    },
    modalItemIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    modalItemTitle: { fontSize: 17, fontWeight: 'bold', color: '#334155' },
    modalItemSubtitle: { fontSize: 14, color: '#94a3b8' },

    // Success Modal
    successModal: { backgroundColor: 'white', margin: 24, borderRadius: 32, padding: 40, alignItems: 'center' },
    successContent: { width: '100%', alignItems: 'center' },
    successIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', marginBottom: 24, elevation: 10, shadowColor: '#10b981', shadowOpacity: 0.4, shadowRadius: 20 },
    successTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
    successSubtitle: { fontSize: 16, color: '#64748b', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
    successButton: { width: '100%', borderRadius: 16 },

    // Date Modal Redesign
    modalContainerGlass: {
        width: '90%',
        borderRadius: 32,
        padding: 24,
        elevation: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    // Confirm Modal (God Tier)
    confirmModal: {
        margin: 20,
        borderRadius: 32,
        overflow: 'hidden',
    },
    observationsModal: {
        margin: 20,
        borderRadius: 32,
        overflow: 'hidden',
        maxHeight: '85%', // Prevent overflow
    },
    confirmModalGradient: {
        padding: 32,
        alignItems: 'center',
    },
    confirmHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    confirmIconRing: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 2,
        borderColor: 'rgba(34, 211, 238, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: 'rgba(34, 211, 238, 0.05)',
    },
    confirmTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: 'white',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    confirmSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 20,
    },
    summaryContainer: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 24,
        padding: 20,
        marginBottom: 40,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    summaryIconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.04)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    summaryLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#22d3ee',
        letterSpacing: 1.5,
        marginBottom: 2,
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
    },
    summaryDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginVertical: 16,
        marginLeft: 52,
    },
    confirmButtonPrim: {
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    confirmButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
    },
    // Progress Bar Style
    modalTitleLight: {
        fontSize: 22,
        fontWeight: '900',
        color: 'white',
        textAlign: 'center',
        marginBottom: 24,
        letterSpacing: 0.5,
    },
    dateGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    miniDateWrapper: {
        width: '47%',
        aspectRatio: 1,
        marginBottom: 12,
    },
    miniDateCardBase: {
        flex: 1,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    miniDateCardSelectedBorder: {
        borderColor: '#22d3ee',
        borderWidth: 2,
    },
    miniDateDayText: {
        fontSize: 14,
        fontWeight: '800',
        marginBottom: 4,
        letterSpacing: 1,
    },
    miniDateNumberText: {
        fontSize: 42,
        fontWeight: '900',
    },
    miniDateIndicatorWhite: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'white',
    },
    modalCloseButton: {
        marginTop: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    modalCloseButtonText: {
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '800',
        fontSize: 14,
        letterSpacing: 1,
    }
});

export default CargaKilometrajeScreen;
