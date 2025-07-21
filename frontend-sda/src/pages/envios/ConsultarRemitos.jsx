import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  Form,
  InputGroup,
  Spinner,
} from "react-bootstrap";
import { FilePdf } from "react-bootstrap-icons";
import { apiSistema } from "../../utils/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../styles/datepicker-custom.css";
import "../../styles/tablasSistema.css";
import "../../styles/titulosSistema.css";
import { FiSearch, FiCalendar } from "react-icons/fi";

const ConsultarRemitos = () => {
  const hoy = new Date();
  const haceUnMes = new Date();
  haceUnMes.setMonth(hoy.getMonth() - 1);

  const [remitos, setRemitos] = useState([]);
  const [filtroNumero, setFiltroNumero] = useState("");
  const [filtroDesde, setFiltroDesde] = useState(haceUnMes);
  const [filtroHasta, setFiltroHasta] = useState(hoy);
  const [loading, setLoading] = useState(false);
  const [paginaActual, setPaginaActual] = useState(0);
  const [limite] = useState(10);
  const [totalRemitos, setTotalRemitos] = useState(0);


  useEffect(() => {
    const fetchRemitos = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          apiSistema(`/api/remitos?pagina=${paginaActual}&limite=${limite}` +
            (filtroNumero ? `&numero=${encodeURIComponent(filtroNumero)}` : "") +
            (filtroDesde ? `&desde=${filtroDesde.toISOString()}` : "") +
            (filtroHasta ? `&hasta=${filtroHasta.toISOString()}` : "")
          )
          
        );
        console.log("🔽 Remitos recibidos:", res.data);

        setRemitos(res.data.resultados);
        setTotalRemitos(res.data.total);
      } catch (error) {
        console.error("❌ Error al obtener remitos:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRemitos();
  }, [paginaActual, filtroNumero, filtroDesde, filtroHasta]);


  return (
    <div className="container mt-4">
      <h2 className="mb-4 titulo-seccion">Consultar Remitos</h2>

      <Card className="p-4 mb-4 shadow-sm border-0 rounded-4">
        <Form className="row g-3 align-items-center">

          {/* Fecha Desde */}
          <Form.Group className="col-md-4 d-flex align-items-center">
            <label className="label-sistema me-2 mb-0">Desde</label>
            <InputGroup className="input-group-custom flex-grow-1">
              <DatePicker
                selected={filtroDesde}
                onChange={(date) => setFiltroDesde(date)}
                dateFormat="yyyy-MM-dd"
                className="form-control input-sistema"
              />
              <InputGroup.Text className="icono-input-sistema">
                <FiCalendar />
              </InputGroup.Text>
            </InputGroup>
          </Form.Group>

          {/* Fecha Hasta */}
          <Form.Group className="col-md-4 d-flex align-items-center">
            <label className="label-sistema me-2 mb-0">Hasta</label>
            <InputGroup className="input-group-custom flex-grow-1">
              <DatePicker
                selected={filtroHasta}
                onChange={(date) => setFiltroHasta(date)}
                dateFormat="yyyy-MM-dd"
                className="form-control input-sistema"
              />
              <InputGroup.Text className="icono-input-sistema">
                <FiCalendar />
              </InputGroup.Text>
            </InputGroup>
          </Form.Group>

          {/* Filtro por número */}
          <Form.Group className="col-md-4 d-flex align-items-center">
            <label className="label-sistema me-2 mb-0">Buscar</label>
            <InputGroup className="input-group-custom flex-grow-1">
              <Form.Control
                type="text"
                className="input-sistema"
                placeholder="Remito (ej. 8)"
                value={filtroNumero}
                onChange={(e) => setFiltroNumero(e.target.value)}
              />
              <InputGroup.Text className="icono-input-sistema">
                <FiSearch />
              </InputGroup.Text>
            </InputGroup>
          </Form.Group>

        </Form>
      </Card>

      <Card className="p-3 shadow-sm">
        {loading ? (
          <div className="text-center p-4">
            <Spinner animation="border" variant="warning" />
          </div>
        ) : !Array.isArray(remitos) || remitos.length === 0 ? (
          <div className="text-center text-muted">No se encontraron remitos.</div>
        ) : (
          <table className="table tabla-montserrat text-center align-middle">
            <thead className="encabezado-moderno">
              <tr>
                <th></th>
                <th>N° Remito</th>
                <th>Fecha</th>
                <th>Remitente</th>
                <th>Destinatario</th>
                <th>Localidad</th>
                <th>Bultos</th>
                <th>Peso</th>
                <th>PDF</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(remitos) &&
                remitos.map((remito) => (
                  <tr key={remito._id} className="tabla-moderna-fila">
                    <td className="text-muted" style={{ fontSize: "1.2rem" }}>⋮⋮</td>
                    <td>{remito.numeroRemito}</td>
                    <td>{new Date(remito.fechaEmision).toLocaleDateString()}</td>
                    <td>{remito.clienteRemitente?.nombre || "-"}</td>
                    <td>{remito.destinatario?.nombre || "-"}</td>
                    <td>{remito.localidadDestino?.nombre || "-"}</td>
                    <td>{remito.encomienda?.cantidad}</td>
                    <td>{remito.encomienda?.peso} kg</td>
                    <td className="text-center">
                      <a
                        href={apiSistema(`/api/remitos/${remito.envio._id || remito.envio}/pdf`)}
                      
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-danger"
                        title="Descargar PDF"
                      >
                        <FilePdf size={22} />
                      </a>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </Card>
      {totalRemitos > limite && (
        <div className="paginacion-container mt-3">
          <span className="paginacion-info">
            Mostrando {remitos.length} de {totalRemitos} remitos
          </span>
          <div className="paginacion-botones">
            {(() => {
              const totalPaginas = Math.ceil(totalRemitos / limite);
              const visiblePages = 5;
              const totalGrupos = Math.ceil(totalPaginas / visiblePages);
              const grupoActual = Math.floor(paginaActual / visiblePages);
              const start = grupoActual * visiblePages;
              const end = Math.min(start + visiblePages, totalPaginas);

              return (
                <>
                  {/* ◀◀ Grupo anterior */}
                  {grupoActual > 0 && (
                    <button
                      className="paginacion-btn"
                      onClick={() => setPaginaActual(start - visiblePages)}
                    >
                      ◀◀
                    </button>
                  )}

                  {/* ◀ Página anterior */}
                  {paginaActual > 0 && (
                    <button
                      className="paginacion-btn"
                      onClick={() => setPaginaActual(paginaActual - 1)}
                    >
                      ◀
                    </button>
                  )}

                  {/* Botones de página */}
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

                  {/* ▶ Página siguiente */}
                  {paginaActual < totalPaginas - 1 && (
                    <button
                      className="paginacion-btn"
                      onClick={() => setPaginaActual(paginaActual + 1)}
                    >
                      ▶
                    </button>
                  )}

                  {/* ▶▶ Grupo siguiente */}
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
  );
};

export default ConsultarRemitos;
