import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/formularioSistema.css";
import "../../styles/botonesSistema.css";
import "../../styles/titulosSistema.css";
import "../../styles/seguimientoSistema.css";


const BuscarSeguimiento = () => {
    const [codigo, setCodigo] = useState("");
    const navigate = useNavigate();

    const handleBuscar = (e) => {
        e.preventDefault();
        if (!codigo.trim()) return;
        navigate(`/seguimiento/resultado/${codigo}`);
    };

    return (
        <div className="container seguimiento-container mt-5">
            <h2 className="seguimiento-titulo fade-in-up">
                Seguimiento de Envío Online
            </h2>
            <form
                className="seguimiento-form"
                onSubmit={handleBuscar}
            >

                <div className="mb-4">
                    <label className="form-label fw-semibold">Ingresá tu número de seguimiento</label>
                    <input
                        type="text"
                        className="form-control input-sistema"
                        placeholder="Ej: SDA-2025-H2XKZ1"
                        value={codigo}
                        onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                    />
                </div>

                <div className="text-center">
                    <button type="submit" className="btn-sda-principal">
                        Consultar Envío
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BuscarSeguimiento;
