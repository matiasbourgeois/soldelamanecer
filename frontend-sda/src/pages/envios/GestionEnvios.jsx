import React from "react";
import { useNavigate } from "react-router-dom";
import { PackagePlus, Search, FileText, Trash2 } from "lucide-react";
import "../../styles/accionesSistema.css"; // asegurate que el CSS global esté importado

const GestionEnvios = () => {
  const navigate = useNavigate();

  const acciones = [
    {
      titulo: "Realizar un Envío",
      descripcion: "Carga un nuevo envío con todos los datos necesarios.",
      icono: <PackagePlus size={20} />,
      ruta: "/envios/nuevo",
    },
    {
      titulo: "Consultar Envíos",
      descripcion: "Buscá envíos por remitente, destinatario o estado.",
      icono: <Search size={20} />,
      ruta: "/envios/consultar",
    },
    {
      titulo: "Consultar Remitos",
      descripcion: "Accedé a todos los remitos emitidos o buscá por número.",
      icono: <FileText size={20} />,
      ruta: "/remitos/consultar",
    },
  ];

  return (
    <div className="container mt-5">
      <h2 className="titulo-seccion mb-4">Gestión de Envíos</h2>

      <div className="d-flex flex-column gap-3">
        {acciones.map((accion, index) => (
          <div
            key={index}
            onClick={() => navigate(accion.ruta)}
            className="opcion-accion-link"
          >
            <div className="opcion-accion-card">
              <div className="d-flex align-items-center gap-3">
                <div className="icono-accion">{accion.icono}</div>
                <div>
                  <h6 className="mb-1 fw-semibold">{accion.titulo}</h6>
                  <p className="mb-0 text-muted">{accion.descripcion}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GestionEnvios;
