import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import {
  FaEnvelope,
  FaIdCard,
  FaPhone,
  FaMapMarkerAlt,
  FaCity,
} from "react-icons/fa";
import EditarPerfilModal from "../pages/EditarPerfilModal";
import AuthContext from "../context/AuthProvider";

import "../styles/botonesSistema.css";
import "../styles/Perfil.css";
import { apiUsuarios } from "../utils/api";

const Perfil = () => {
  const { auth } = useContext(AuthContext);
  const [perfil, setPerfil] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchPerfil = async () => {
    try {
      const response = await axios.get(apiUsuarios("/api/usuarios/perfil"),
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );
      setPerfil(response.data.usuario);
    } catch (error) {
      console.error("❌ Error al obtener el perfil:", error);
    }
  };

  useEffect(() => {
    if (auth?.token) {
      fetchPerfil();
    }
  }, [auth]);

  const cerrarModalConActualizacion = async () => {
    await fetchPerfil();
    setModalVisible(false);
  };

  if (!perfil) {
    return <div className="text-center mt-5">Cargando perfil...</div>;
  }

  return (
    <div className="perfil-centrado-container">
      <div className="perfil-card-elegante">
        <div className="perfil-header-elegante">
          <img
            src={
              perfil.fotoPerfil
                ? `${apiUsuarios(perfil.fotoPerfil)}?t=${new Date().getTime()}`
                : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
            }

            alt="Foto de perfil"
            className="perfil-avatar-elegante"
          />

          <div className="perfil-titulos">
            <h2>{perfil.nombre?.toUpperCase()}</h2>
            <span className="perfil-rol-elegante">{perfil.rol}</span>
          </div>
        </div>

        <div className="perfil-info-grid">
          <p><FaEnvelope className="perfil-icon-elegante" /> {perfil.email}</p>
          <p><FaIdCard className="perfil-icon-elegante" /> {perfil.dni || "-"}</p>
          <p><FaPhone className="perfil-icon-elegante" /> {perfil.telefono || "-"}</p>
          <p><FaMapMarkerAlt className="perfil-icon-elegante" /> {perfil.direccion || "-"}</p>
          <p><FaCity className="perfil-icon-elegante" /> {perfil.localidad || "-"}</p>
          <p><FaCity className="perfil-icon-elegante" /> {perfil.provincia || "-"}</p>
        </div>

        <div className="perfil-btn-container">
          <button
            className="btn-sda-principal"
            onClick={() => setModalVisible(true)}
          >
            Editar Perfil
          </button>
        </div>
      </div>

      <EditarPerfilModal
        show={modalVisible}
        handleClose={cerrarModalConActualizacion}
        datosUsuario={perfil}
        onPerfilActualizado={fetchPerfil}
      />
    </div>
  );
};

export default Perfil;
