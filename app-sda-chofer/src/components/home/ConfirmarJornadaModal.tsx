import React, { useState, useEffect, useRef } from 'react';
import {
    View, StyleSheet, TouchableOpacity, TextInput, ScrollView,
    KeyboardAvoidingView, Platform, Animated, AppState
} from 'react-native';
import { Text, IconButton, ActivityIndicator, Portal, Modal } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../api/client';

interface ConfirmarJornadaModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    vehiculo: any;
    ruta: any;
    hojaRepartoId: string;
    isDark: boolean;
    textPrimary: string;
    textSecondary: string;
    userId?: string;
}

const ConfirmarJornadaModal: React.FC<ConfirmarJornadaModalProps> = ({
    visible, onClose, onSuccess,
    vehiculo, ruta, hojaRepartoId,
    isDark, textPrimary, textSecondary, userId
}) => {
    const [kmInput, setKmInput] = useState('');
    const [litrosInput, setLitrosInput] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [obsExpanded, setObsExpanded] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [showRetroactivo, setShowRetroactivo] = useState(false);
    const [fechaRetroactiva, setFechaRetroactiva] = useState('');
    const [vehiculoRetro, setVehiculoRetro] = useState<any>(null);
    const [loadingRetro, setLoadingRetro] = useState(false);
    const [errorRetro, setErrorRetro] = useState('');

    const kmAnterior = vehiculo?.kilometrajeActual || 0;
    const kmNuevo = parseInt(kmInput) || 0;
    const kmDiff = kmNuevo - kmAnterior;
    const kmValido = kmInput !== '' && kmDiff >= 0;

    const bg = isDark ? ['#0f172a', '#020617'] : ['#ffffff', '#f8fafc'];
    const accent = isDark ? '#22d3ee' : '#0891b2';
    const accentBg = isDark ? 'rgba(34,211,238,0.1)' : 'rgba(8,145,178,0.08)';
    const glassBg = isDark ? 'rgba(255,255,255,0.06)' : '#f8fafc';
    const glassBorder = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';

    // Draft persistencia observaciones
    const draftKey = `obs_jornada_${userId}_${vehiculo?._id || 'default'}`;
    useEffect(() => {
        if (!visible) return;
        AsyncStorage.getItem(draftKey).then(val => { if (val) setObservaciones(val); });
    }, [visible]);

    useEffect(() => {
        if (userId) AsyncStorage.setItem(draftKey, observaciones);
    }, [observaciones]);

    // Extracción segura de IDs (Mongoose ObjectId o string)
    const getVehiculoId = (v: any) => v?._id?.toString() || v?.id?.toString() || null;
    const getRutaId = (r: any) => r?._id?.toString() || r?.id?.toString() || null;
    const getHojaId = (h: any) => h?.toString() || null;

    const handleSubmit = async () => {
        if (!kmInput || kmInput.trim() === '') {
            setError('Ingresá el kilometraje actual del vehículo.');
            return;
        }
        if (kmDiff < 0) {
            setError(`El KM no puede ser menor al anterior (${kmAnterior.toLocaleString('es-AR')} km).`);
            return;
        }
        if (kmDiff > 800) {
            setError(`Estás cargando ${kmDiff.toLocaleString('es-AR')} km recorridos. ¿Es correcto? Tocá "SÍ, ES CORRECTO" para continuar.`);
            return;
        }
        const vid = getVehiculoId(vehiculo);
        if (!vid) { setError('No se encontró el ID del vehículo. Recargá la pantalla.'); return; }
        await enviar(vid, getHojaId(hojaRepartoId), null);
    };

    const handleConfirmAlta = async () => {
        setError('');
        const vid = getVehiculoId(vehiculo);
        if (!vid) { setError('No se encontró el ID del vehículo.'); return; }
        await enviar(vid, getHojaId(hojaRepartoId), null);
    };

    const enviar = async (vehiculoId: string, hojaId: string | null, fechaOverride: string | null) => {
        setSubmitting(true);
        setError('');
        try {
            const payload = {
                kilometraje: parseInt(kmInput),
                litros: litrosInput ? parseFloat(litrosInput) : 0,
                rutaId: getRutaId(ruta),
                hojaRepartoId: hojaId,
                fecha: fechaOverride || new Date().toISOString(),
                observaciones: observaciones?.trim() || 'Reporte diario desde App Móvil.'
            };
            console.log('[ConfirmarJornada] Enviando reporte:', { vehiculoId, payload });
            const res = await api.post(`/vehiculos/${vehiculoId}/reporte-chofer`, payload);
            console.log('[ConfirmarJornada] Respuesta OK:', res.data);
            await AsyncStorage.removeItem(draftKey);
            setObservaciones('');
            setKmInput('');
            setLitrosInput('');
            onSuccess();
        } catch (e: any) {
            console.error('[ConfirmarJornada] Error:', e?.response?.data || e?.message);
            setError(e?.response?.data?.error || `Error ${e?.response?.status || ''}: No se pudo registrar el reporte. Intentá nuevamente.`);
        } finally {
            setSubmitting(false);
        }
    };

    // Retroactivo
    const buscarHojaPorFecha = async () => {
        if (!fechaRetroactiva || !/^\d{4}-\d{2}-\d{2}$/.test(fechaRetroactiva)) {
            setErrorRetro('Ingresá la fecha en formato YYYY-MM-DD.');
            return;
        }
        setLoadingRetro(true); setErrorRetro(''); setVehiculoRetro(null);
        try {
            const res = await api.get(`/choferes/hoja-por-fecha?fecha=${fechaRetroactiva}`);
            setVehiculoRetro(res.data.vehiculo);
            if (res.data.reporteExistente) {
                setErrorRetro('Ya cargaste el km para ese día.');
            }
        } catch (e: any) {
            setErrorRetro(e.response?.data?.error || 'No se encontró actividad para esa fecha.');
        } finally {
            setLoadingRetro(false);
        }
    };

    const enviarRetroactivo = async () => {
        if (!vehiculoRetro) return;
        await enviar(vehiculoRetro._id, '', `${fechaRetroactiva}T12:00:00.000Z`);
    };

    const vehiculoActivo = showRetroactivo ? vehiculoRetro : vehiculo;
    const kmAnt = vehiculoActivo?.kilometrajeActual || 0;

    return (
        <Portal>
            <Modal visible={visible} onDismiss={onClose}
                contentContainerStyle={styles.modalWrapper}>
                <LinearGradient colors={bg as [string, string]} style={styles.container}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                        <ScrollView showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.scroll}>

                            {/* Header */}
                            <View style={styles.headerRow}>
                                <View style={[styles.iconRing, { borderColor: isDark ? 'rgba(34,211,238,0.3)' : '#a5f3fc', backgroundColor: accentBg }]}>
                                    <IconButton icon="clipboard-check" size={28} iconColor={accent} />
                                </View>
                                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                    <IconButton icon="close" size={20} iconColor={textSecondary} />
                                </TouchableOpacity>
                            </View>
                            <Text style={[styles.title, { color: textPrimary }]}>
                                {showRetroactivo ? 'Carga Retroactiva' : 'Confirmar Jornada'}
                            </Text>
                            <Text style={[styles.subtitle, { color: textSecondary }]}>
                                {showRetroactivo
                                    ? 'Cargá el km de un día anterior.'
                                    : 'Completá los datos de tu jornada de hoy.'}
                            </Text>

                            {/* Resumen (solo modo normal) */}
                            {!showRetroactivo && (
                                <View style={[styles.summaryCard, { backgroundColor: glassBg, borderColor: glassBorder }]}>
                                    <View style={styles.summaryRow}>
                                        <IconButton icon="truck-outline" size={18} iconColor={accent} style={styles.icon0} />
                                        <View>
                                            <Text style={[styles.summaryLabel, { color: textSecondary }]}>VEHÍCULO</Text>
                                            <Text style={[styles.summaryValue, { color: textPrimary }]}>
                                                {vehiculo?.patente?.toUpperCase() || '—'} · {vehiculo?.marca} {vehiculo?.modelo}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={[styles.divLine, { backgroundColor: glassBorder }]} />
                                    <View style={styles.summaryRow}>
                                        <IconButton icon="map-marker-distance" size={18} iconColor={accent} style={styles.icon0} />
                                        <View>
                                            <Text style={[styles.summaryLabel, { color: textSecondary }]}>RUTA</Text>
                                            <Text style={[styles.summaryValue, { color: textPrimary }]}>
                                                {ruta?.codigo?.toUpperCase() || '—'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            )}

                            {/* Retroactivo: selector de fecha */}
                            {showRetroactivo && (
                                <View style={{ marginBottom: 20 }}>
                                    <Text style={[styles.fieldLabel, { color: accent }]}>FECHA (YYYY-MM-DD)</Text>
                                    <View style={[styles.glassRow, { backgroundColor: glassBg, borderColor: glassBorder }]}>
                                        <IconButton icon="calendar" size={20} iconColor={accent} style={styles.icon0} />
                                        <TextInput
                                            value={fechaRetroactiva}
                                            onChangeText={setFechaRetroactiva}
                                            placeholder="2026-03-08"
                                            placeholderTextColor={textSecondary}
                                            style={[styles.retroInput, { color: textPrimary }]}
                                            keyboardType="numeric"
                                        />
                                        <TouchableOpacity onPress={buscarHojaPorFecha} style={[styles.buscarBtn, { backgroundColor: accent }]}>
                                            <Text style={styles.buscarText}>{loadingRetro ? '...' : 'BUSCAR'}</Text>
                                        </TouchableOpacity>
                                    </View>
                                    {errorRetro ? <Text style={styles.errorText}>{errorRetro}</Text> : null}
                                    {vehiculoRetro && (
                                        <View style={[styles.summaryCard, { backgroundColor: glassBg, borderColor: accent, borderWidth: 1.5, marginTop: 12 }]}>
                                            <Text style={[styles.summaryLabel, { color: accent }]}>VEHÍCULO ENCONTRADO</Text>
                                            <Text style={[styles.summaryValue, { color: textPrimary }]}>
                                                {vehiculoRetro.patente?.toUpperCase()} · {vehiculoRetro.marca} {vehiculoRetro.modelo}
                                            </Text>
                                            <Text style={[styles.summaryLabel, { color: textSecondary, marginTop: 4 }]}>
                                                KM anterior: {vehiculoRetro.kilometrajeActual?.toLocaleString('es-AR')} km
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}

                            {/* Campo KM (muestra cuando no es retroactivo, o cuando encontró vehículo retro) */}
                            {(!showRetroactivo || vehiculoRetro) && (
                                <>
                                    <Text style={[styles.fieldLabel, { color: accent }]}>KILOMETRAJE ACTUAL</Text>
                                    <View style={[styles.kmCard, { backgroundColor: glassBg, borderColor: kmInput ? (kmDiff >= 0 ? '#10b981' : '#ef4444') : glassBorder }]}>
                                        <Text style={[styles.kmPrev, { color: textSecondary }]}>
                                            ANTERIOR: {kmAnt.toLocaleString('es-AR')} KM
                                        </Text>
                                        <View style={styles.kmInputRow}>
                                            <TextInput
                                                value={kmInput}
                                                onChangeText={t => { setKmInput(t); setError(''); }}
                                                keyboardType="numeric"
                                                style={[styles.kmInputBig, { color: textPrimary }]}
                                                placeholder="0"
                                                placeholderTextColor={textSecondary}
                                                selectionColor={accent}
                                            />
                                            <Text style={[styles.kmUnit, { color: textSecondary }]}>KM</Text>
                                        </View>
                                        {kmInput !== '' && (
                                            <View style={[styles.diffBadge, {
                                                backgroundColor: kmDiff >= 0
                                                    ? (isDark ? 'rgba(16,185,129,0.15)' : '#d1fae5')
                                                    : (isDark ? 'rgba(239,68,68,0.15)' : '#fee2e2')
                                            }]}>
                                                <IconButton icon={kmDiff >= 0 ? 'check-circle' : 'alert-circle'}
                                                    size={14} iconColor={kmDiff >= 0 ? '#10b981' : '#ef4444'} style={styles.icon0} />
                                                <Text style={{ color: kmDiff >= 0 ? '#10b981' : '#ef4444', fontWeight: '700', fontSize: 13 }}>
                                                    {kmDiff >= 0 ? `+ ${kmDiff.toLocaleString('es-AR')} km hoy` : 'Menor al anterior'}
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* Litros */}
                                    <Text style={[styles.fieldLabel, { color: accent }]}>COMBUSTIBLE CARGADO (OPCIONAL)</Text>
                                    <View style={[styles.glassRow, { backgroundColor: glassBg, borderColor: glassBorder }]}>
                                        <IconButton
                                            icon={vehiculoActivo?.tipoCombustible === 'GNC' ? 'gas-cylinder' : 'gas-station'}
                                            size={22} iconColor={isDark ? '#fb923c' : '#f97316'} style={styles.icon0} />
                                        <TextInput
                                            value={litrosInput}
                                            onChangeText={setLitrosInput}
                                            keyboardType="numeric"
                                            placeholder="0"
                                            placeholderTextColor={textSecondary}
                                            style={[styles.litrosInput, { color: textPrimary }]}
                                            selectionColor={accent}
                                        />
                                        <Text style={[styles.litrosUnit, { color: textSecondary }]}>
                                            {vehiculoActivo?.tipoCombustible === 'GNC' ? 'M³' : 'LITROS'}
                                        </Text>
                                    </View>

                                    {/* Observaciones */}
                                    <Text style={[styles.fieldLabel, { color: accent }]}>NOVEDADES (OPCIONAL)</Text>
                                    <TouchableOpacity
                                        onPress={() => setObsExpanded(!obsExpanded)}
                                        activeOpacity={0.85}
                                        style={[styles.obsCard, {
                                            backgroundColor: observaciones ? accentBg : glassBg,
                                            borderColor: observaciones ? accent : glassBorder,
                                            borderWidth: observaciones ? 1.5 : 1
                                        }]}
                                    >
                                        <View style={styles.obsHeader}>
                                            <IconButton
                                                icon={obsExpanded ? 'chat-processing' : 'chat-processing-outline'}
                                                size={20} iconColor={observaciones ? accent : textSecondary} style={styles.icon0} />
                                            <Text style={[styles.obsPreview, { color: observaciones ? textPrimary : textSecondary }]}
                                                numberOfLines={obsExpanded ? undefined : 1}>
                                                {observaciones || 'Tocá para agregar comentarios...'}
                                            </Text>
                                            <IconButton icon={obsExpanded ? 'chevron-up' : 'chevron-down'}
                                                size={18} iconColor={textSecondary} style={styles.icon0} />
                                        </View>
                                        {obsExpanded && (
                                            <TextInput
                                                value={observaciones}
                                                onChangeText={setObservaciones}
                                                multiline
                                                numberOfLines={5}
                                                placeholder="Ruidos, fallas, incidentes, etc."
                                                placeholderTextColor={textSecondary}
                                                style={[styles.obsInput, { color: textPrimary }]}
                                                selectionColor={accent}
                                                autoFocus
                                            />
                                        )}
                                    </TouchableOpacity>
                                </>
                            )}

                            {/* Error */}
                            {error ? (
                                <View style={styles.errorCard}>
                                    <IconButton icon="alert-circle" size={16} iconColor="#ef4444" style={styles.icon0} />
                                    <Text style={styles.errorText}>{error}</Text>
                                    {/* Si es error de km>800, mostrar botón forzar */}
                                    {error.includes('recorridos') && (
                                        <TouchableOpacity onPress={handleConfirmAlta} style={styles.forceBtn}>
                                            <Text style={styles.forceBtnText}>SÍ, ES CORRECTO</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ) : null}

                            {/* Botón principal */}
                            {(!showRetroactivo || vehiculoRetro) && (
                                <TouchableOpacity
                                    onPress={showRetroactivo ? enviarRetroactivo : handleSubmit}
                                    disabled={submitting || !kmInput || kmDiff < 0}
                                    activeOpacity={0.9}
                                    style={[styles.submitWrap, (submitting || !kmInput || kmDiff < 0) && { opacity: 0.6 }]}
                                >
                                    <LinearGradient
                                        colors={(submitting || !kmInput || kmDiff < 0)
                                            ? ['#475569', '#334155']
                                            : ['#10b981', '#059669']}
                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                        style={styles.submitGrad}
                                    >
                                        {submitting
                                            ? <ActivityIndicator color="white" />
                                            : <Text style={styles.submitText}>
                                                {showRetroactivo ? 'CARGAR KM RETROACTIVO' : 'CONFIRMAR Y ENVIAR'}
                                            </Text>
                                        }
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}

                            {/* Link retroactivo */}
                            {!showRetroactivo ? (
                                <TouchableOpacity onPress={() => { setShowRetroactivo(true); setError(''); }}
                                    style={styles.retroLink}>
                                    <Text style={[styles.retroLinkText, { color: textSecondary }]}>
                                        ¿Olvidaste cargar un día anterior?
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity onPress={() => { setShowRetroactivo(false); setVehiculoRetro(null); setErrorRetro(''); setFechaRetroactiva(''); }}
                                    style={styles.retroLink}>
                                    <Text style={[styles.retroLinkText, { color: accent }]}>
                                        ← Volver a jornada de hoy
                                    </Text>
                                </TouchableOpacity>
                            )}

                            <View style={{ height: 30 }} />
                        </ScrollView>
                    </KeyboardAvoidingView>
                </LinearGradient>
            </Modal>
        </Portal>
    );
};

const styles = StyleSheet.create({
    modalWrapper: { margin: 16, borderRadius: 28, overflow: 'hidden' },
    container: { borderRadius: 28 },
    scroll: { padding: 24 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    iconRing: { width: 56, height: 56, borderRadius: 28, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
    closeBtn: { borderRadius: 20 },
    title: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5, marginBottom: 4 },
    subtitle: { fontSize: 14, marginBottom: 20 },
    summaryCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 20 },
    summaryRow: { flexDirection: 'row', alignItems: 'center' },
    summaryLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },
    summaryValue: { fontSize: 15, fontWeight: '700', marginTop: 2 },
    divLine: { height: 1, marginVertical: 12 },
    icon0: { margin: 0, padding: 0 },
    fieldLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8, marginLeft: 2 },
    kmCard: { borderRadius: 16, padding: 20, borderWidth: 1.5, marginBottom: 20 },
    kmPrev: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
    kmInputRow: { flexDirection: 'row', alignItems: 'baseline' },
    kmInputBig: { fontSize: 48, fontWeight: '900', flex: 1, padding: 0 },
    kmUnit: { fontSize: 18, fontWeight: '700', marginLeft: 8 },
    diffBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, padding: 8, marginTop: 12 },
    glassRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: 12, marginBottom: 20 },
    litrosInput: { flex: 1, fontSize: 24, fontWeight: '800', padding: 0, marginLeft: 4 },
    litrosUnit: { fontSize: 13, fontWeight: '700', marginLeft: 4 },
    retroInput: { flex: 1, fontSize: 16, fontWeight: '700', padding: 4 },
    buscarBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
    buscarText: { color: 'white', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
    obsCard: { borderRadius: 16, padding: 12, marginBottom: 20 },
    obsHeader: { flexDirection: 'row', alignItems: 'center' },
    obsPreview: { flex: 1, fontSize: 14, fontWeight: '600' },
    obsInput: { marginTop: 12, fontSize: 15, lineHeight: 22, textAlignVertical: 'top', minHeight: 100 },
    errorCard: { borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.1)', padding: 12, marginBottom: 16 },
    errorText: { color: '#ef4444', fontSize: 13, fontWeight: '600', flex: 1, flexShrink: 1 },
    forceBtn: { marginTop: 10, backgroundColor: '#ef4444', borderRadius: 8, padding: 10, alignItems: 'center' },
    forceBtnText: { color: 'white', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
    submitWrap: { borderRadius: 18, overflow: 'hidden', marginBottom: 16 },
    submitGrad: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
    submitText: { color: 'white', fontWeight: '900', fontSize: 17, letterSpacing: 1.5 },
    retroLink: { alignItems: 'center', padding: 8 },
    retroLinkText: { fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },
});

export default ConfirmarJornadaModal;
