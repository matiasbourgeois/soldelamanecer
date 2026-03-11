import React, { useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { IconButton } from 'react-native-paper';

export interface AlertaMantenimiento {
    nombre: string;
    restante: number;
    status: 'red' | 'yellow';
}

interface Props {
    vehiculo: any;
    isDark: boolean;
    onPress: () => void;
}

export function calcularAlertasMantenimiento(vehiculo: any): AlertaMantenimiento[] {
    if (!vehiculo?.configuracionMantenimiento?.length) return [];
    const kmActual = vehiculo.kilometrajeActual || 0;

    return vehiculo.configuracionMantenimiento
        .map((c: any) => {
            const kmRecorrido = kmActual - (c.ultimoKm || 0);
            const restante = c.frecuenciaKm - kmRecorrido;

            let status: 'red' | 'yellow' | 'green' = 'green';
            if (restante <= 0) status = 'red';
            else if (restante <= 1000) status = 'yellow';

            return { nombre: c.nombre, restante, status };
        })
        .filter((a: any) => a.status !== 'green') as AlertaMantenimiento[];
}

const MantenimientoAlertBanner: React.FC<Props> = ({ vehiculo, isDark, onPress }) => {
    const alertas = useMemo(() => calcularAlertasMantenimiento(vehiculo), [vehiculo]);

    if (alertas.length === 0) return null;

    const tieneVencidos = alertas.some(a => a.status === 'red');
    const borderColor = tieneVencidos ? '#ef4444' : '#eab308';
    const bgColor = tieneVencidos
        ? isDark ? 'rgba(239,68,68,0.10)' : 'rgba(239,68,68,0.07)'
        : isDark ? 'rgba(234,179,8,0.10)' : 'rgba(234,179,8,0.07)';
    const textColor = tieneVencidos ? '#ef4444' : '#eab308';
    const icono = tieneVencidos ? 'alert-octagon' : 'alert';
    const plural = alertas.length > 1 ? 'alertas' : 'alerta';
    const patente = vehiculo?.patente ? vehiculo.patente.toUpperCase() : 'vehículo';

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={[
                styles.banner,
                {
                    backgroundColor: bgColor,
                    borderColor: borderColor,
                },
            ]}
        >
            <View style={[styles.leftBorder, { backgroundColor: borderColor }]} />
            <View style={styles.iconWrap}>
                <IconButton icon={icono} iconColor={textColor} size={20} style={styles.icon0} />
            </View>
            <View style={styles.textWrap}>
                <Text style={[styles.bannerTitle, { color: textColor }]}>
                    {patente} — {alertas.length} {plural} de mantenimiento
                </Text>
                <Text style={[styles.bannerSub, { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)' }]}>
                    {tieneVencidos ? 'Hay servicios vencidos · ' : 'Próximos a vencer · '}
                    Tocá para ver el detalle
                </Text>
            </View>
            <IconButton icon="chevron-right" iconColor={textColor} size={18} style={styles.icon0} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        marginBottom: 14,
        minHeight: 52,
    },
    leftBorder: {
        width: 4,
        alignSelf: 'stretch',
    },
    iconWrap: {
        paddingLeft: 8,
    },
    textWrap: {
        flex: 1,
        paddingVertical: 10,
    },
    bannerTitle: {
        fontSize: 13,
        fontWeight: '700',
    },
    bannerSub: {
        fontSize: 11,
        marginTop: 1,
    },
    icon0: { margin: 0, padding: 0 },
});

export default MantenimientoAlertBanner;
