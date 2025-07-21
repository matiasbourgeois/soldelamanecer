import React, { useState, useEffect, useContext } from "react";
import { Modal, Form } from "react-bootstrap";
import axios from "axios";
import AuthContext from "../context/AuthProvider";
import "../styles/formularioSistema.css";
import "../styles/botonesSistema.css";
import { apiUsuarios } from "../utils/api";

const EditarPerfilModal = ({ show, handleClose, datosUsuario, onPerfilActualizado }) => {
  const { auth, setAuth } = useContext(AuthContext);


  const [formData, setFormData] = useState({
    nombre: datosUsuario.nombre || "",
    dni: datosUsuario.dni || "",
    telefono: datosUsuario.telefono || "",
    direccion: datosUsuario.direccion || "",
    localidad: datosUsuario.localidad || "",
    provincia: datosUsuario.provincia || "",
  });

  const [foto, setFoto] = useState(null);
  const [archivoOriginal, setArchivoOriginal] = useState(null);

  useEffect(() => {
    setFormData({
      nombre: datosUsuario.nombre || "",
      dni: datosUsuario.dni || "",
      telefono: datosUsuario.telefono || "",
      direccion: datosUsuario.direccion || "",
      localidad: datosUsuario.localidad || "",
      provincia: datosUsuario.provincia || "",
    });

    if (datosUsuario.fotoPerfil) {
      const baseUsuarios = import.meta.env.VITE_API_USUARIOS;
      setFoto(`${baseUsuarios}${datosUsuario.fotoPerfil}`);

    } else {
      setFoto(null);
    }
  }, [datosUsuario]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const archivo = e.target.files[0];
    if (archivo) {
      setArchivoOriginal(archivo);
      setFoto(URL.createObjectURL(archivo));
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let rutaFotoSubida = datosUsuario.fotoPerfil; // por defecto la que ya tiene
  
      // 1. Si hay nueva imagen, primero la subimos
      if (archivoOriginal) {
        const formDataFoto = new FormData();
        formDataFoto.append("foto", archivoOriginal);
  
        const respuesta = await axios.post(
          `${import.meta.env.VITE_API_USUARIOS}/api/usuarios/subir-foto`,
          formDataFoto,
          {
            headers: {
              Authorization: `Bearer ${auth.token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
  
        if (respuesta.data && respuesta.data.fotoPerfil) {
          rutaFotoSubida = respuesta.data.fotoPerfil;
        } else {
          throw new Error("La imagen no se pudo subir correctamente.");
        }
      }
  
      // 2. Enviamos los datos del formulario incluyendo la nueva ruta
      const datosCompletos = {
        ...formData,
        fotoPerfil: rutaFotoSubida,
      };
  
      await axios.put(
        `${import.meta.env.VITE_API_USUARIOS}/api/usuarios/perfil-completo`,
        datosCompletos,
        {
          headers: { Authorization: `Bearer ${auth.token}` },
        }
      );
  
      // 3. Terminamos
      await onPerfilActualizado();
      setFoto(null);
      handleClose();
  
      // ✅ Esto actualiza la imagen del Sidebar sin F5
      if (setAuth) {
        setAuth((prevAuth) => ({
          ...prevAuth,
          fotoPerfil: rutaFotoSubida,
        }));
      }
  
    } catch (error) {
      console.error("❌ Error al actualizar perfil:", error.response?.data || error.message);
    }
  };
  


  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton className="modal-header-sda">
        <Modal.Title className="modal-title-sda">Editar Perfil</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-4 text-center">
            <label className="label-sistema d-block mb-2">Foto de Perfil</label>
            {foto && (
              <img
                src={foto}
                alt="Vista previa"
                className="vista-previa-imagen mb-3 mx-auto d-block"
              />
            )}
            <div className="custom-file-upload mx-auto">
              <input
                type="file"
                id="fotoPerfil"
                accept="image/*"
                onChange={handleFileChange}
              />
              <label htmlFor="fotoPerfil">Seleccionar imagen</label>
            </div>
          </Form.Group>

          {/* Campos del formulario */}
          {[
            { name: "nombre", label: "Nombre" },
            { name: "dni", label: "DNI" },
            { name: "telefono", label: "Teléfono" },
            { name: "direccion", label: "Dirección" },
            { name: "localidad", label: "Localidad" },
            { name: "provincia", label: "Provincia" },
          ].map(({ name, label }) => (
            <Form.Group className="mb-3" key={name}>
              <label className="label-sistema">{label}</label>
              <input
                type="text"
                name={name}
                className="input-sistema"
                value={formData[name]}
                onChange={handleChange}
              />
            </Form.Group>
          ))}

          <div className="d-flex justify-content-end mt-4">
            <button type="button" className="btn-soft-cancelar me-2" onClick={handleClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-soft-warning">
              Guardar Cambios
            </button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default EditarPerfilModal;
