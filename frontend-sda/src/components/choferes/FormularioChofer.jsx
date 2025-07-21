import React from "react";
import { Modal, Form } from "react-bootstrap";

import "../../styles/formularioSistema.css";
import "../../styles/botonesSistema.css";

const FormularioChofer = ({
  mostrar,
  onHide,
  busqueda,
  handleBuscarUsuario,
  usuariosFiltrados,
  usuarioSeleccionado,
  handleSeleccionUsuario,
  formulario,
  handleChangeFormulario,
  handleCrearChofer,
  handleActualizarChofer,
  handleChangeUsuario, // nuevo handler para modificar datos base
  modoEdicion = false,
}) => {
  return (
    <Modal show={mostrar} onHide={onHide} centered>
      <Modal.Header closeButton className="modal-header-sda">
        <Modal.Title className="modal-title-sda">

          {modoEdicion ? "Editar Chofer" : "Agregar Chofer"}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {!modoEdicion && (
          <>
            {!usuarioSeleccionado && (
              <Form.Group controlId="busqueda" className="mb-3">
                <label className="label-sistema">Buscar usuario por nombre o email</label>
                <input
                  type="text"
                  className="input-sistema"
                  placeholder="Buscar..."
                  value={busqueda}
                  onChange={handleBuscarUsuario}
                />
              </Form.Group>
            )}

            <Form.Group controlId="usuarioSelect" className="mb-3">
              <label className="label-sistema">Seleccionar usuario</label>
              <select
                className="select-sistema"
                onChange={(e) => handleSeleccionUsuario(e.target.value)}
                value={usuarioSeleccionado?._id || ""}
              >
                <option value="">-- Seleccione --</option>
                {usuariosFiltrados?.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.nombre} ({u.email}) - Rol: {u.rol}
                  </option>
                ))}
              </select>
            </Form.Group>
          </>
        )}

        {(modoEdicion || usuarioSeleccionado) && (
          <>
            <hr />
            <h6 className="mb-3"> Datos del usuario</h6>

            <Form.Group controlId="nombre" className="mb-3">
              <label className="label-sistema">Nombre</label>
              <input
                type="text"
                className="input-sistema"
                name="nombre"
                value={usuarioSeleccionado?.nombre || ""}
                onChange={handleChangeUsuario}
              />
            </Form.Group>

            <Form.Group controlId="dni" className="mb-3">
              <label className="label-sistema">DNI</label>
              <input
                type="text"
                className="input-sistema"
                name="dni"
                value={usuarioSeleccionado?.dni || ""}
                onChange={handleChangeUsuario}
              />
            </Form.Group>

            <Form.Group controlId="telefono" className="mb-3">
              <label className="label-sistema">Teléfono</label>
              <input
                type="text"
                className="input-sistema"
                name="telefono"
                value={usuarioSeleccionado?.telefono || ""}
                onChange={handleChangeUsuario}
              />
            </Form.Group>

            <Form.Group controlId="direccion" className="mb-3">
              <label className="label-sistema">Dirección</label>
              <input
                type="text"
                className="input-sistema"
                name="direccion"
                value={usuarioSeleccionado?.direccion || ""}
                onChange={handleChangeUsuario}
              />
            </Form.Group>

            <Form.Group controlId="localidad" className="mb-3">
              <label className="label-sistema">Localidad</label>
              <input
                type="text"
                className="input-sistema"
                name="localidad"
                value={usuarioSeleccionado?.localidad || ""}
                onChange={handleChangeUsuario}
              />
            </Form.Group>

            <Form.Group controlId="provincia" className="mb-3">
              <label className="label-sistema">Provincia</label>
              <input
                type="text"
                className="input-sistema"
                name="provincia"
                value={usuarioSeleccionado?.provincia || ""}
                onChange={handleChangeUsuario}
              />
            </Form.Group>

            <hr />
            <h6 className="mb-3">Datos del chofer</h6>

            <Form.Group controlId="tipoVinculo" className="mb-3">
              <label className="label-sistema">Tipo de contratación</label>
              <select
                name="tipoVinculo"
                className="select-sistema"
                value={formulario.tipoVinculo}
                onChange={handleChangeFormulario}
              >
                <option value="contratado">Contratado</option>
                <option value="relacionDependencia">Relación de dependencia</option>
              </select>
            </Form.Group>
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        <button className="btn-soft-cancelar me-2" onClick={onHide}>
          Cancelar
        </button>
        <button
          className="btn-soft me-2"
          onClick={modoEdicion ? handleActualizarChofer : handleCrearChofer}
          disabled={!formulario.tipoVinculo}
        >
          {modoEdicion ? "Guardar cambios" : "Crear chofer"}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default FormularioChofer;
