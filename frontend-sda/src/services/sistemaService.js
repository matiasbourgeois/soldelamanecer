import axios from 'axios';
import { apiSistema } from '@core/api/apiSistema';

/**
 * Servicio para herramientas exclusivas de sistema (Nivel Dios).
 */
const sistemaService = {
    /**
     * Ejecuta el protocolo de recuperación de días caídos
     * @param {Object} data - Objeto contenedor
     * @param {string} data.fechaInicio - Formato YYYY-MM-DD
     * @param {string} data.fechaFin - Formato YYYY-MM-DD
     */
    recuperarDiasCaidos: async (data) => {
        const token = localStorage.getItem("token");
        const response = await axios.post(apiSistema('/sistema/recuperar-dias-caidos'), data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
};

export default sistemaService;
