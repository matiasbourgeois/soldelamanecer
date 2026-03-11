
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, StatusBar, TextInput as NativeInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, Appbar, Button, HelperText, ActivityIndicator, useTheme, Surface, IconButton, Snackbar, Portal, Modal, TextInput as PaperInput } from 'react-native-paper';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';
import { AppTheme } from '../theme/theme';

const CargaKilometrajeScreen = ({ navigation }: any) => {
    const theme = useTheme<AppTheme>();
    const isDark = theme.dark;
    const { user } = useAuth();

    // Estados de carga e info
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Configuración Traída del Backend
    const [vehiculoAsignado, setVehiculoAsignado] = useState<any>(null);
    const [rutaAsignada, setRutaAsignado] = useState<any>(null);
    const [hojaRepartoId, setHojaRepartoId] = useState<string | null>(null);
    const [esPlanificada, setEsPlanificada] = useState(false);

    // Formulario
    const [fecha, setFecha] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [kmInput, setKmInput] = useState('');
    const [litrosInput, setLitrosInput] = useState('');

    // State for Snackbar (Errors)
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");

    // State for Success Modal
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    // State for Confirmation Modal
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    // State for Mileage Input Modal
    const [kmModalVisible, setKmModalVisible] = useState(false);
    const [tempKmInput, setTempKmInput] = useState('');

    // State for Error Modal
    const [errorModalVisible, setErrorModalVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // State for Observations
    const [observacionesModalVisible, setObservacionesModalVisible] = useState(false);
    const [observaciones, setObservaciones] = useState('');

    // --- ESTILOS DINÁMICOS ---
    const bgGradientColors = isDark ? ['#020617', '#0f172a'] : ['#f8fafc', '#f1f5f9'];
    const textPrimary = theme.colors.textPrimary;
    const textSecondary = theme.colors.textSecondary;
    const textInverse = isDark ? '#000' : '#fff'; // For filled buttons sometimes

    // Glass Cards
    const glassBg = isDark ? 'rgba(255,255,255,0.06)' : '#ffffff';
    const glassBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
    const cardShadow = isDark ? 'transparent' : '#cbd5e1';
    const cardElevation = isDark ? 0 : 2;

    // Secondary Accents
    const accentColor = isDark ? '#22d3ee' : '#0891b2'; // Cyan 400 vs 600
    const accentBg = isDark ? 'rgba(34, 211, 238, 0.15)' : 'rgba(8, 145, 178, 0.1)';

    const actionText = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
    const placeholderText = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';

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
                const resConfig = await api.get('/choferes/configuracion');
                if (resConfig.data.vehiculo) setVehiculoAsignado(resConfig.data.vehiculo);
                if (resConfig.data.ruta) setRutaAsignado(resConfig.data.ruta);
                if (resConfig.data.hojaRepartoId) setHojaRepartoId(resConfig.data.hojaRepartoId);
                if (resConfig.data.esPlanificada) setEsPlanificada(true);
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

        setConfirmModalVisible(true);
    };

    const handleConfirmSubmission = () => {
        setConfirmModalVisible(false);
        const kmNuevo = parseInt(kmInput);
        const kmAnterior = vehiculoAsignado.kilometrajeActual || 0;
        const kmRecorridosFinal = kmNuevo - kmAnterior;

        if (kmRecorridosFinal > 1500) {
            setErrorMessage(`Estás cargando un recorrido inusual (+ ${kmRecorridosFinal} KM). ¿Es correcto?`);
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
                observaciones: observaciones,
                hojaRepartoId: hojaRepartoId
            };

            await api.post(`/vehiculos/${vehiculoAsignado._id}/reporte-chofer`, payload);

            const key = `observaciones_draft_${user?.id}_${vehiculoAsignado?._id || 'default'}`;
            await AsyncStorage.removeItem(key);
            setObservaciones('');

            setSubmitting(false);
            setSuccessModalVisible(true);

        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.error || "Error al guardar el reporte.";
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
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={{ marginTop: 10, color: textSecondary }}>Cargando configuración...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />

            {/* GLOBAL BACKGROUND GRADIENT */}
            <LinearGradient
                colors={bgGradientColors as [string, string]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>

                {/* HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                        <IconButton icon="arrow-left" iconColor={textPrimary} size={24} />
                    </TouchableOpacity>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={[styles.headerTitle, { color: textPrimary }]}>Reporte Diario</Text>
                        {esPlanificada && (
                            <View style={[styles.badgePlanned, { backgroundColor: accentBg, borderColor: isDark ? 'rgba(34, 211, 238, 0.4)' : 'transparent' }]}>
                                <Text style={[styles.badgePlannedText, { color: accentColor }]}>RUTA PLANIFICADA</Text>
                            </View>
                        )}
                    </View>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                    {/* 1. FECHA (Glass Style) */}
                    <Text style={[styles.sectionLabel, { color: accentColor }]}>FECHA DEL REPORTE</Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
                        <View style={[
                            styles.glassCardRow,
                            {
                                backgroundColor: glassBg,
                                borderColor: glassBorder,
                                shadowColor: cardShadow,
                                elevation: cardElevation
                            }
                        ]}>
                            <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.1)' }]}>
                                <IconButton icon="calendar-month" iconColor={isDark ? "#38bdf8" : "#0284c7"} size={24} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.cardValue, { color: textPrimary }]}>
                                    {fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </Text>
                                <Text style={[styles.cardSubtitle, { color: textSecondary }]}>{fecha.getFullYear()}</Text>
                            </View>
                            <IconButton icon="chevron-down" size={20} iconColor={textSecondary} />
                        </View>
                    </TouchableOpacity>

                    {/* 2. VEHÍCULO ASIGNADO */}
                    <Text style={[styles.sectionLabel, { color: accentColor }]}>VEHÍCULO ASIGNADO</Text>
                    <View style={[
                        styles.glassCardRow,
                        {
                            backgroundColor: glassBg,
                            borderColor: glassBorder,
                            shadowColor: cardShadow,
                            elevation: cardElevation
                        }
                    ]}>
                        <View style={[styles.iconCircle, { backgroundColor: accentBg }]}>
                            <IconButton icon="truck" iconColor={accentColor} size={24} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.cardValue, { color: textPrimary }]}>
                                {vehiculoAsignado?.patente?.toUpperCase() || 'NO ASIGNADO'}
                            </Text>
                            <Text style={[styles.cardSubtitle, { color: textSecondary }]}>
                                {vehiculoAsignado?.marca} {vehiculoAsignado?.modelo}
                            </Text>
                        </View>
                    </View>

                    {/* 3. ODÓMETRO (God Tier Redesign) */}
                    <Text style={[styles.sectionLabel, { color: accentColor }]}>KILOMETRAJE ACTUAL</Text>

                    <TouchableOpacity
                        style={[
                            styles.heroCardContainer,
                            {
                                shadowColor: isDark ? '#000' : '#bae6fd',
                                shadowOpacity: isDark ? 0 : 0.5,
                                elevation: isDark ? 0 : 5
                            }
                        ]}
                        onPress={handleOpenKmModal}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={isDark ? ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.04)'] : ['#ffffff', '#f8fafc']}
                            style={[styles.heroCardGradient, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0', borderWidth: 1 }]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                        >
                            <View style={[styles.lastKmBadge, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.6)' }]}>
                                <Text style={[styles.lastKmText, { color: isDark ? '#94a3b8' : '#64748b' }]}>ANTERIOR: {vehiculoAsignado?.kilometrajeActual?.toLocaleString('es-AR') || '0'} KM</Text>
                            </View>

                            <View style={styles.heroValueWrapper}>
                                <Text style={[styles.heroValueText, { color: isDark ? 'white' : '#1e293b' }]}>
                                    {kmInput || vehiculoAsignado?.kilometrajeActual?.toLocaleString('es-AR') || '0'}
                                </Text>
                                <Text style={[styles.heroUnitTag, { color: isDark ? 'rgba(255,255,255,0.5)' : '#94a3b8' }]}>KM</Text>
                            </View>

                            {kmInput !== '' && (
                                <View style={[styles.validationBadge, { backgroundColor: isKmValid ? (isDark ? 'rgba(34, 197, 94, 0.15)' : '#dcfce7') : (isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2') }]}>
                                    <IconButton icon={isKmValid ? "check-circle" : "alert-circle"} size={16} iconColor={isKmValid ? "#4ade80" : "#ef4444"} style={{ margin: 0, marginRight: 4 }} />
                                    <Text style={{ color: isKmValid ? (isDark ? '#4ade80' : '#15803d') : (isDark ? '#ef4444' : '#b91c1c'), fontWeight: 'bold', fontSize: 13 }}>
                                        {isKmValid ? `+ ${kmRecorridos.toLocaleString()} km hoy` : 'Menor al anterior'}
                                    </Text>
                                </View>
                            )}

                            <View style={styles.editHint}>
                                <IconButton icon="pencil" size={12} iconColor={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)"} />
                                <Text style={[styles.editHintText, { color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)" }]}>Toca para editar</Text>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>


                    {/* 4. COMBUSTIBLE */}
                    <Text style={[styles.sectionLabel, { color: accentColor }]}>COMBUSTIBLE (OPCIONAL)</Text>
                    <View style={[
                        styles.glassCardRow,
                        {
                            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : theme.colors.surface,
                            borderColor: isDark ? 'rgba(251, 146, 60, 0.2)' : '#e2e8f0',
                            borderWidth: 1,
                            elevation: isDark ? 0 : 2
                        }
                    ]}>
                        <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(251, 146, 60, 0.2)' : '#fafafa' }]}>
                            <IconButton
                                icon={vehiculoAsignado?.tipoCombustible === 'GNC' ? 'gas-cylinder' : 'gas-station'}
                                iconColor={isDark ? "#fb923c" : "#f97316"}
                                size={24}
                            />
                        </View>
                        <NativeInput
                            value={litrosInput}
                            onChangeText={setLitrosInput}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor={placeholderText}
                            style={[styles.fuelInput, { color: textPrimary }]}
                            selectionColor="#fb923c"
                            underlineColorAndroid="transparent"
                        />
                        <Text style={[styles.fuelUnit, { color: textSecondary }]}>
                            {vehiculoAsignado?.tipoCombustible === 'GNC' ? 'M³' : 'LITROS'}
                        </Text>
                    </View>

                    {/* 5. OBSERVACIONES */}
                    <Text style={[styles.sectionLabel, { color: accentColor }]}>OBSERVACIONES / NOVEDADES</Text>
                    <TouchableOpacity
                        onPress={() => setObservacionesModalVisible(true)}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.glassCardRow, {
                            backgroundColor: observaciones
                                ? (isDark ? 'rgba(34, 211, 238, 0.12)' : '#ecfeff')
                                : glassBg,
                            borderColor: observaciones
                                ? (isDark ? 'rgba(34, 211, 238, 0.5)' : '#a5f3fc')
                                : glassBorder,
                            elevation: cardElevation,
                            borderWidth: observaciones ? 1.5 : 1,
                            minHeight: 95,
                            paddingVertical: observaciones ? 18 : 16
                        }]}>
                            <View style={[styles.iconCircle, {
                                backgroundColor: observaciones
                                    ? (isDark ? 'rgba(34, 211, 238, 0.2)' : '#cffafe')
                                    : (isDark ? 'rgba(255,255,255,0.1)' : '#f1f5f9'),
                                borderColor: observaciones ? (isDark ? 'rgba(34, 211, 238, 0.3)' : 'transparent') : 'transparent',
                                borderWidth: observaciones ? 1 : 0
                            }]}>
                                <IconButton
                                    icon={observaciones ? "chat-processing" : "chat-processing-outline"}
                                    iconColor={observaciones ? (isDark ? "#22d3ee" : "#06b6d4") : textSecondary}
                                    size={24}
                                />
                            </View>
                            <View style={{ flex: 1, justifyContent: 'center' }}>
                                <Text
                                    numberOfLines={2}
                                    style={[styles.cardValueSmall, {
                                        color: observaciones ? textPrimary : textSecondary,
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
                                <Text style={[styles.cardSubtitle, { color: textSecondary }]}>
                                    {observaciones ? "Toca para editar tu comentario" : "Toca para informar ruidos, fallas, etc."}
                                </Text>
                            </View>
                            <IconButton icon="chevron-right" size={20} iconColor={textSecondary} />
                        </View>
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />

                    {/* SUBMIT BUTTON */}
                    <TouchableOpacity
                        onPress={handleSubmit}
                        activeOpacity={0.9}
                        disabled={submitting || !kmInput || !isKmValid}
                        style={[styles.submitButtonContainer, (!kmInput || !isKmValid) && { opacity: 0.8 }]}
                    >
                        <LinearGradient
                            colors={(!kmInput || !isKmValid)
                                ? (isDark ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'] : ['#e2e8f0', '#cbd5e1'])
                                : ['#06b6d4', '#3b82f6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.submitButtonGradient}
                        >
                            {submitting ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={[styles.submitText, (!kmInput || !isKmValid) && { color: isDark ? 'rgba(255,255,255,0.3)' : '#94a3b8' }]}>CONFIRMAR REPORTE</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={{ height: 50 }} />

                </ScrollView>

                {/* MODALES REFACTORIZADOS CON LÓGICA DE TEMA */}

                {/* 1. UPDATE KM MODAL */}
                <Portal>
                    <Modal visible={kmModalVisible} onDismiss={() => setKmModalVisible(false)} contentContainerStyle={[styles.confirmModal, { backgroundColor: 'transparent' }]}>
                        <LinearGradient colors={isDark ? ['#0f172a', '#020617'] : ['#ffffff', '#f8fafc']} style={styles.confirmModalGradient}>
                            <View style={[styles.confirmIconRing, { borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : '#bae6fd', backgroundColor: isDark ? 'rgba(56, 189, 248, 0.05)' : '#e0f2fe' }]}>
                                <IconButton icon="counter" size={32} iconColor={isDark ? "#38bdf8" : "#0284c7"} />
                            </View>
                            <Text style={[styles.confirmTitle, { color: textPrimary }]}>Actualizar Odómetro</Text>
                            <Text style={[styles.confirmSubtitle, { color: textSecondary }]}>Ingresá el kilometraje actual del vehículo {vehiculoAsignado?.patente?.toUpperCase()}.</Text>

                            <View style={[styles.summaryContainer, { marginTop: 20, backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#f1f5f9' }]}>
                                <View style={styles.kmInputWrapper}>
                                    <NativeInput
                                        value={tempKmInput}
                                        onChangeText={setTempKmInput}
                                        keyboardType="numeric"
                                        style={[styles.kmInputBig, { color: textPrimary }]}
                                        autoFocus
                                        selectionColor="#38bdf8"
                                        placeholder="0"
                                        placeholderTextColor={placeholderText}
                                    />
                                    <Text style={[styles.kmUnitBig, { color: textSecondary }]}>KM</Text>
                                </View>
                            </View>

                            {tempKmInput !== '' && (() => {
                                const diff = parseInt(tempKmInput) - (vehiculoAsignado?.kilometrajeActual || 0);
                                const isValid = diff >= 0;
                                return (
                                    <View style={[styles.validationBadge, { marginTop: 0, marginBottom: 20, backgroundColor: isValid ? (isDark ? 'rgba(34, 197, 94, 0.1)' : '#dcfce7') : (isDark ? 'rgba(239, 68, 68, 0.1)' : '#fee2e2') }]}>
                                        <IconButton icon={isValid ? "check-circle" : "alert-circle"} size={16} iconColor={isValid ? (isDark ? "#4ade80" : "#16a34a") : "#ef4444"} style={{ margin: 0, marginRight: 4 }} />
                                        <Text style={{ color: isValid ? (isDark ? '#4ade80' : '#16a34a') : '#ef4444', fontWeight: 'bold', fontSize: 13 }}>
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

                            <Button mode="text" onPress={() => setKmModalVisible(false)} textColor={textSecondary}>
                                CANCELAR
                            </Button>
                        </LinearGradient>
                    </Modal>
                </Portal>

                {/* 2. OBSERVACIONES MODAL */}
                <Portal>
                    <Modal
                        visible={observacionesModalVisible}
                        onDismiss={() => setObservacionesModalVisible(false)}
                        contentContainerStyle={styles.observationsModal}
                    >
                        <LinearGradient colors={isDark ? ['#0f172a', '#020617'] : ['#ffffff', '#f8fafc']} style={styles.confirmModalGradient}>
                            <ScrollView
                                contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }}
                                showsVerticalScrollIndicator={false}
                                style={{ width: '100%' }}
                            >
                                <View style={[styles.confirmIconRing, { borderColor: isDark ? 'rgba(34, 211, 238, 0.3)' : '#a5f3fc', backgroundColor: isDark ? 'rgba(34, 211, 238, 0.05)' : '#ecfeff', marginTop: 10 }]}>
                                    <IconButton icon="chat-processing" size={32} iconColor={isDark ? "#22d3ee" : "#0891b2"} />
                                </View>
                                <Text style={[styles.confirmTitle, { color: textPrimary }]}>Novedades de la Jornada</Text>
                                <Text style={[styles.confirmSubtitle, { color: textSecondary }]}>Reportá cualquier inconveniente con el vehículo o la ruta.</Text>

                                <View style={[styles.summaryContainer, {
                                    marginTop: 24,
                                    backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : '#f1f5f9',
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
                                        placeholderTextColor={placeholderText}
                                        style={{
                                            color: textPrimary,
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
                                    textColor={textSecondary}
                                    labelStyle={{ fontWeight: 'bold' }}
                                >
                                    CERRAR
                                </Button>
                            </ScrollView>
                        </LinearGradient>
                    </Modal>
                </Portal>

                {/* 3. ERROR MODAL */}
                <Portal>
                    <Modal visible={errorModalVisible} onDismiss={() => setErrorModalVisible(false)} contentContainerStyle={[styles.confirmModal, { backgroundColor: 'transparent' }]}>
                        <LinearGradient colors={isDark ? ['#1e1b4b', '#020617'] : ['#fef2f2', '#fff1f2']} style={styles.confirmModalGradient}>
                            <View style={[styles.confirmIconRing, { borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#fecaca', backgroundColor: isDark ? 'rgba(239, 68, 68, 0.05)' : '#fef2f2' }]}>
                                <IconButton icon="alert-octagon" size={32} iconColor="#ef4444" />
                            </View>
                            <Text style={[styles.confirmTitle, { color: '#ef4444' }]}>¡Atención!</Text>
                            <Text style={[styles.confirmSubtitle, { color: textSecondary }]}>{errorMessage}</Text>

                            <TouchableOpacity onPress={() => setErrorModalVisible(false)} activeOpacity={0.9} style={{ width: '100%', marginTop: 20 }}>
                                <LinearGradient colors={['#ef4444', '#b91c1c']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.confirmButtonPrim}>
                                    <Text style={styles.confirmButtonText}>ENTENDIDO</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </LinearGradient>
                    </Modal>
                </Portal>

                {/* 4. CONFIRM MODAL */}
                <Portal>
                    <Modal visible={confirmModalVisible} onDismiss={() => setConfirmModalVisible(false)} contentContainerStyle={[styles.confirmModal, { backgroundColor: 'transparent' }]}>
                        <LinearGradient
                            colors={isDark ? ['#0c4a6e', '#082f49'] : ['#f0f9ff', '#e0f2fe']}
                            style={styles.confirmModalGradient}
                        >
                            <View style={styles.confirmHeader}>
                                <View style={styles.confirmIconRing}>
                                    <IconButton icon="file-document-check" size={32} iconColor={isDark ? "#22d3ee" : "#0284c7"} />
                                </View>
                                <Text style={[styles.confirmTitle, { color: textPrimary }]}>Verificar Datos</Text>
                                <Text style={[styles.confirmSubtitle, { color: textSecondary }]}>Asegurará de que la información coincida con tu jornada actual.</Text>
                            </View>

                            <View style={[styles.summaryContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.6)', borderColor: isDark ? 'rgba(34, 211, 238, 0.2)' : '#bae6fd' }]}>
                                <View style={styles.summaryRow}>
                                    <View style={styles.summaryIconBox}>
                                        <IconButton icon="truck" size={18} iconColor="#22d3ee" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.summaryLabel, { color: textSecondary }]}>VEHÍCULO</Text>
                                        <Text style={[styles.summaryValue, { color: textPrimary }]}>{vehiculoAsignado?.patente?.toUpperCase()}</Text>
                                    </View>
                                </View>

                                <View style={styles.summaryRow}>
                                    <View style={styles.summaryIconBox}>
                                        <IconButton icon="counter" size={18} iconColor="#22d3ee" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.summaryLabel, { color: textSecondary }]}>KM RECORRIDOS</Text>
                                        <Text style={[styles.summaryValue, { color: textPrimary }]}>+ {kmRecorridos.toLocaleString('es-AR')} KM</Text>
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
                                textColor={textSecondary}
                                labelStyle={{ fontWeight: '800', letterSpacing: 1 }}
                            >
                                REVISAR DATOS
                            </Button>
                        </LinearGradient>
                    </Modal>
                </Portal>

                {/* 5. SUCCESS MODAL */}
                <Portal>
                    <Modal visible={successModalVisible} onDismiss={() => { }} contentContainerStyle={[styles.successModal, { backgroundColor: theme.colors.surface }]}>
                        <View style={styles.successContent}>
                            <View style={styles.successIconContainer}>
                                <IconButton icon="check-bold" size={40} iconColor="white" />
                            </View>
                            <Text style={[styles.successTitle, { color: textPrimary }]}>¡Registro Exitoso!</Text>
                            <Text style={[styles.successSubtitle, { color: textSecondary }]}>Los kilómetros se guardaron correctamente en el sistema.</Text>

                            <Button
                                mode="contained"
                                onPress={() => {
                                    setSuccessModalVisible(false);
                                    navigation.goBack();
                                }}
                                style={styles.successButton}
                                labelStyle={{ fontSize: 16, fontWeight: 'bold', color: 'white' }}
                                contentStyle={{ height: 50 }}
                                buttonColor="#10b981"
                            >
                                CONTINUAR
                            </Button>
                        </View>
                    </Modal>
                </Portal>

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

                {/* SELECTOR DE FECHA */}
                {showDatePicker && (
                    <View style={styles.modalOverlay}>
                        <LinearGradient
                            colors={isDark ? ['#0c4a6e', '#082f49'] : ['#f0f9ff', '#e0f2fe']}
                            style={styles.modalContainerGlass}
                        >
                            <Text style={[styles.modalTitleLight, { color: textPrimary }]}>Fecha del Reporte</Text>
                            <View style={styles.dateGrid}>
                                {Array.from({ length: 4 }).map((_, i) => {
                                    // ... Date logic ...
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
                                                colors={isSelected
                                                    ? ['#06b6d4', '#0891b2']
                                                    : (isDark ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.03)'] : ['#ffffff', '#f8fafc'])}
                                                style={[
                                                    styles.miniDateCardBase,
                                                    isSelected && styles.miniDateCardSelectedBorder,
                                                    !isSelected && { borderWidth: 1, borderColor: isDark ? 'transparent' : '#e2e8f0' }
                                                ]}
                                            >
                                                <Text style={[styles.miniDateDayText, isSelected ? { color: 'rgba(255,255,255,0.8)' } : { color: '#22d3ee' }]}>{dayName}</Text>
                                                <Text style={[styles.miniDateNumberText, !isSelected && !isDark && { color: '#1e293b' }]}>{dayNumber}</Text>
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
                                <Text style={[styles.modalCloseButtonText, { color: textSecondary }]}>CANCELAR</Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                )}

            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 20,
    },
    backButton: {
        width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
    badgePlanned: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        marginTop: 4,
        borderWidth: 1,
    },
    badgePlannedText: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1
    },

    content: { padding: 20 },
    sectionLabel: { fontSize: 13, fontWeight: '800', marginBottom: 12, letterSpacing: 1.5, textTransform: 'uppercase' },

    glassCardRow: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 24, padding: 16, marginBottom: 28,
        borderWidth: 1,
    },
    iconCircle: {
        width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16, overflow: 'hidden'
    },
    cardValue: {
        fontSize: 18, fontWeight: '800', letterSpacing: 0.5, marginBottom: 2,
    },
    cardValueSmall: {
        fontSize: 16, fontWeight: '700', marginBottom: 2,
    },
    cardSubtitle: {
        fontSize: 13, fontWeight: '500',
    },

    // HERO CARD
    heroCardContainer: {
        borderRadius: 32, marginBottom: 32,
    },
    heroCardGradient: {
        padding: 24, borderRadius: 32, alignItems: 'center', justifyContent: 'center', minHeight: 180,
    },
    lastKmBadge: {
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 12,
    },
    lastKmText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
    heroValueWrapper: { flexDirection: 'row', alignItems: 'baseline' },
    heroValueText: { fontSize: 42, fontWeight: '900', letterSpacing: -1 },
    heroUnitTag: { fontSize: 16, fontWeight: '900', marginLeft: 4 },
    validationBadge: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginTop: 12,
    },
    editHint: {
        marginTop: 16, flexDirection: 'row', alignItems: 'center', opacity: 0.8
    },
    editHintText: { fontSize: 12, fontWeight: '600' },

    fuelInput: {
        flex: 1, fontSize: 24, fontWeight: 'bold', height: 50, textAlign: 'right', marginRight: 8, paddingHorizontal: 10
    },
    fuelUnit: { fontSize: 14, fontWeight: '900', },

    submitButtonContainer: {
        borderRadius: 20,
        height: 56,
        width: '100%',
        shadowColor: '#06b6d4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
        backgroundColor: 'transparent', // Ensure no background color conflict
    },
    submitButtonGradient: {
        flex: 1,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitText: { color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 1 },

    // Modals
    confirmModal: {
        width: '90%', alignSelf: 'center', borderRadius: 28, overflow: 'hidden', elevation: 10,
    },
    confirmModalGradient: { padding: 24, alignItems: 'center' },
    confirmHeader: { width: '100%', alignItems: 'center', marginBottom: 20 },
    confirmIconRing: { width: 64, height: 64, borderRadius: 32, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    confirmTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
    confirmSubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, paddingHorizontal: 10 },
    summaryContainer: { width: '100%', borderRadius: 20, borderWidth: 1, padding: 20, marginTop: 24, marginBottom: 24 },
    kmInputWrapper: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', paddingVertical: 10 },
    kmInputBig: { fontSize: 48, fontWeight: '900', color: 'white', width: 150, textAlign: 'center' },
    kmUnitBig: { fontSize: 20, fontWeight: '900', color: '#64748b' },
    confirmButtonPrim: { width: '100%', height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    confirmButtonText: { color: 'white', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
    observationsModal: {
        width: '90%', alignSelf: 'center', borderRadius: 28, overflow: 'hidden', elevation: 10, maxHeight: '80%'
    },
    successModal: {
        width: '85%', alignSelf: 'center', borderRadius: 28, overflow: 'hidden', backgroundColor: 'white', elevation: 20,
    },
    successContent: { padding: 30, alignItems: 'center' },
    successIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', marginBottom: 20, elevation: 5 },
    successTitle: { fontSize: 24, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
    successSubtitle: { fontSize: 16, textAlign: 'center', marginBottom: 30, lineHeight: 24 },
    successButton: { width: '100%', borderRadius: 12 },

    // Date Picker Modal (Mini)
    modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20, zIndex: 999 },
    modalContainerGlass: { width: '100%', borderRadius: 24, padding: 20, alignItems: 'center' },
    modalTitleLight: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
    dateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', width: '100%', marginBottom: 20 },
    miniDateWrapper: { width: '47%', aspectRatio: 1.5 },
    miniDateCardBase: { flex: 1, borderRadius: 12, justifyContent: 'center', alignItems: 'center', padding: 4 },
    miniDateCardSelectedBorder: { borderColor: '#22d3ee', borderWidth: 1 },
    miniDateDayText: { fontSize: 10, fontWeight: '900', marginBottom: 4 },
    miniDateNumberText: { fontSize: 20, fontWeight: 'bold', color: 'white' },
    miniDateIndicatorWhite: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'white', marginTop: 6 },
    modalCloseButton: { width: '100%', paddingVertical: 14, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
    modalCloseButtonText: { fontWeight: 'bold', fontSize: 14 },
    summaryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    summaryIconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(34, 211, 238, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    summaryLabel: { fontSize: 10, fontWeight: '900', marginBottom: 2, letterSpacing: 0.5 },
    summaryValue: { fontSize: 16, fontWeight: 'bold' }

});

export default CargaKilometrajeScreen;
