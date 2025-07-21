import React from "react";
import {
  Pencil,
  Eye,
  EyeOff,
  Trash2,
  GripVertical
} from "lucide-react";

// ✅ Importar los estilos externos
import '../../styles/tablasSistema.css';
import '../../styles/botonesSistema.css';
import '../../styles/estadosSistema.css';

const TablaLocalidades = ({ localidades, onEdit, onToggleEstado, onDelete }) => {
  return (
    <div className="table-responsive">
      <table className="table align-middle text-center shadow-sm rounded tabla-montserrat">
        <thead className="encabezado-moderno">
          <tr>
            <th></th>
            <th>Nombre</th>
            <th>Frecuencia</th>
            <th>Horarios</th>
            <th>Código Postal</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {localidades.length === 0 ? (
            <tr>
              <td colSpan="7" className="text-muted py-4">
                No hay localidades registradas.
              </td>
            </tr>
          ) : (
            localidades.map((loc) => (
              <tr key={loc._id} className="tabla-moderna-fila">
                <td>
                  <GripVertical size={20} className="text-muted" />
                </td>
                <td>{loc.nombre}</td>
                <td>{loc.frecuencia}</td>
                <td>{loc.horarios}</td>
                <td>{loc.codigoPostal}</td>
                <td>
                  <span className={loc.activa ? "estado-activo" : "estado-inactivo"}>
                    {loc.activa ? "Activa" : "Inactiva"}
                  </span>
                </td>
                <td>
                  <div className="d-flex justify-content-center gap-2">
                    <button
                      className="btn-icono btn-editar"
                      title="Editar"
                      onClick={() => onEdit(loc)}
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      className={`btn-icono ${
                        loc.activa ? "btn-desactivar" : "btn-activar"
                      }`}
                      title={loc.activa ? "Desactivar" : "Activar"}
                      onClick={() => onToggleEstado(loc._id)}
                    >
                      {loc.activa ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <button
                      className="btn-icono btn-eliminar"
                      title="Eliminar"
                      onClick={() => onDelete(loc._id)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TablaLocalidades;
