import { useState, useEffect } from 'react';
import axios from 'axios';
import { apiLocalidades } from '../api/apiSistema';

/**
 * Hook para obtener las localidades desde la base de datos del sistema.
 * Mapea los campos del backend a la estructura usada en el frontend público.
 */
export const useLocalidades = () => {
    const [localidades, setLocalidades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLocalidades = async () => {
            try {
                setLoading(true);
                // Llamamos al endpoint de la Web App
                const url = apiLocalidades('/');
                console.log('Fetching localidades from:', url);
                const response = await axios.get(url);

                // Mapeo de datos: Backend (nombre, codigoPostal) -> Frontend (name, cp)
                const mappedData = response.data
                    .filter(loc => loc.activa !== false) // Solo las activas
                    .map(loc => ({
                        id: loc._id,
                        name: loc.nombre,
                        cp: String(loc.codigoPostal),
                        frecuencia: loc.frecuencia,
                        horarios: loc.horarios
                    }));

                setLocalidades(mappedData);
                setError(null);
            } catch (err) {
                console.error('Error al cargar localidades desde la DB:', err);
                setError('No se pudo conectar con la base de datos de localidades.');
                // En caso de error, podríamos opcionalmente cargar un fallback, 
                // pero por ahora reportamos el error para visibilidad.
            } finally {
                setLoading(false);
            }
        };

        fetchLocalidades();
    }, []);

    return { localidades, loading, error };
};
