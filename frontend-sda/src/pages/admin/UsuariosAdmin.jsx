import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FormControl } from "react-bootstrap";
import { apiUsuariosApi } from "../../utils/api";
import { Trash2 } from "lucide-react";
import { FiCheck } from "react-icons/fi";
import "../../styles/tablasSistema.css";
import "../../styles/botonesSistema.css";
import "../../styles/titulosSistema.css";
import AuthContext from "../../context/AuthProvider";
import { mostrarAlerta } from "../../utils/alertaGlobal";
import { confirmarAccion } from "../../utils/confirmarAccion";



const UsuariosAdmin = () => {
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);

  const [usuarios, setUsuarios] = useState([]);
  const [paginaActual, setPaginaActual] = useState(0);
  const [limite] = useState(10);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [busqueda, setBusqueda] = useState("");

  const [error, setError] = useState(null);

  useEffect(() => {
    if (!auth?._id || auth.rol !== "admin") {
      navigate("/");
    } else {
      fetchUsuarios();
    }
  }, [auth, paginaActual, busqueda]); // ✅ agregamos busqueda



  const fetchUsuarios = async () => {
    try {
      const query = new URLSearchParams();
      query.append("pagina", paginaActual);
      query.append("limite", limite);
      if (busqueda) query.append("busqueda", busqueda);

      const response = await fetch(
        apiUsuariosApi(`/paginados?${query.toString()}`),
        {
          headers: { Authorization: `Bearer ${auth.token}` },
        }
      );

      const data = await response.json();
      if (response.ok) {
        setUsuarios(data.resultados);
        setTotalUsuarios(data.total);
      } else {
        setError(data.error || "Error al obtener usuarios");
      }
    } catch (err) {
      console.error("Error al conectar con el backend:", err);
      setError("Error de conexión");
    }
  };


  const handleChangeRol = async (userId, nuevoRol) => {
    try {
      const response = await fetch(apiUsuariosApi(`/${userId}/rol`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ rol: nuevoRol }),
      });

      const data = await response.json();
      if (response.ok) {
        mostrarAlerta(`✅ Rol actualizado a ${nuevoRol}`, "success");
        fetchUsuarios();
      } else {
        mostrarAlerta(data.error || "❌ Error al actualizar rol", "danger");
      }
    } catch (error) {
      console.error("Error al cambiar rol:", error);
      mostrarAlerta("❌ Error de conexión", "danger");
    }
  };

  const handleVerificarUsuario = async (userId) => {
    try {
      const response = await fetch(apiUsuariosApi(`/verificar/${userId}`), {
        method: "PUT",
        headers: { Authorization: `Bearer ${auth.token}` },
      });

      if (response.ok) {
        mostrarAlerta("✅ Usuario verificado correctamente", "success");
        fetchUsuarios();
      } else {
        const data = await response.json();
        mostrarAlerta(data.error || "❌ Error al verificar usuario", "danger");
      }
    } catch (error) {
      console.error("Error al verificar usuario:", error);
      mostrarAlerta("❌ Error de conexión al verificar usuario", "danger");
    }
  };

  const handleEliminarUsuario = async (userId) => {
    const confirmar = await confirmarAccion("¿Eliminar usuario?", "Esta acción no se puede deshacer");
    if (!confirmar) return;

    try {
      const response = await fetch(apiUsuariosApi(`/${userId}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.token}` },
      });

      if (response.ok) {
        mostrarAlerta("✅ Usuario eliminado correctamente", "success");
        setUsuarios((prev) => prev.filter((u) => u._id !== userId));
      } else {
        const data = await response.json();
        mostrarAlerta(data.error || "❌ Error al eliminar usuario", "danger");
      }
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      mostrarAlerta("❌ Error de conexión", "danger");
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="titulo-seccion">Gestión de Usuarios</h2>

      {error && (
        <div className="alert alert-danger text-center" role="alert">
          {error}
        </div>
      )}

      <FormControl
        className="input-sistema mb-3"
        placeholder="Buscar por nombre o email"
        value={busqueda}
        onChange={(e) => {
          setBusqueda(e.target.value);
          setPaginaActual(0);
        }}
      />


      <div className="table-responsive">
        <table className="table tabla-montserrat align-middle text-center">
          <thead className="encabezado-moderno">
            <tr>
              <th></th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol actual</th>
              <th>Cambiar rol</th>
              <th>Verificado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(usuarios) && usuarios.length > 0 ? (

              usuarios.map((user) => (

                <tr key={user._id} className="tabla-moderna-fila">
                  <td className="text-muted" style={{ fontSize: "1.2rem" }}>⋮⋮</td>
                  <td>{user.nombre}</td>
                  <td>{user.email}</td>
                  <td className="text-capitalize">{user.rol}</td>
                  <td>
                    <select
                      defaultValue={user.rol}
                      onChange={(e) => handleChangeRol(user._id, e.target.value)}
                      className="form-select form-select-sm"
                    >
                      <option value="cliente">cliente</option>
                      <option value="chofer">chofer</option>
                      <option value="administrativo">administrativo</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td>
                    {user.verificado ? (
                      <span
                        className="btn-soft-confirmar d-inline-flex align-items-center justify-content-center"
                        style={{ padding: "6px 10px", fontSize: "0.9rem" }}
                        title="Usuario verificado"
                      >
                        <FiCheck size={18} />
                      </span>
                    ) : (
                      <button
                        className="btn-soft -confirmar"
                        onClick={() => handleVerificarUsuario(user._id)}
                      >
                        Verificar
                      </button>
                    )}
                  </td>

                  <td>
                    <button
                      className="btn-icono btn-eliminar"
                      title="Eliminar usuario"
                      onClick={() => handleEliminarUsuario(user._id)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center text-muted py-4">
                  No se encontraron usuarios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {totalUsuarios > limite && (
          <div className="paginacion-container mt-3">
            <span className="paginacion-info">
              Mostrando {usuarios.length} de {totalUsuarios} usuarios
            </span>

            <div className="paginacion-botones">
              {(() => {
                const totalPaginas = Math.ceil(totalUsuarios / limite);
                const visiblePages = 5;
                const totalGrupos = Math.ceil(totalPaginas / visiblePages);
                const grupoActual = Math.floor(paginaActual / visiblePages);
                const start = grupoActual * visiblePages;
                const end = Math.min(start + visiblePages, totalPaginas);

                return (
                  <>
                    {grupoActual > 0 && (
                      <button
                        className="paginacion-btn"
                        onClick={() => setPaginaActual(start - visiblePages)}
                      >
                        ◀◀
                      </button>
                    )}
                    {paginaActual > 0 && (
                      <button
                        className="paginacion-btn"
                        onClick={() => setPaginaActual(paginaActual - 1)}
                      >
                        ◀
                      </button>
                    )}
                    {Array.from({ length: end - start }).map((_, i) => {
                      const pageIndex = start + i;
                      return (
                        <button
                          key={pageIndex}
                          className={`paginacion-btn ${paginaActual === pageIndex ? "activo" : ""}`}
                          onClick={() => setPaginaActual(pageIndex)}
                        >
                          {pageIndex + 1}
                        </button>
                      );
                    })}
                    {paginaActual < totalPaginas - 1 && (
                      <button
                        className="paginacion-btn"
                        onClick={() => setPaginaActual(paginaActual + 1)}
                      >
                        ▶
                      </button>
                    )}
                    {grupoActual < totalGrupos - 1 && (
                      <button
                        className="paginacion-btn"
                        onClick={() => setPaginaActual(end)}
                      >
                        ▶▶
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default UsuariosAdmin;
