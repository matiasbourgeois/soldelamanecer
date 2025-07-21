// src/components/Inicio.jsx
const Inicio = () => {
    return (
      <main className="container-fluid vh-100 d-flex align-items-center justify-content-center text-start">
        <div className="row w-70 d-flex align-items-center mx-auto">
          <div className="col-md-2"></div>
          <div className="col-md-4 text-md-start px-3">
            <h1 className="fw-bold text-dark" style={{ fontSize: "2.2rem", lineHeight: "1.2", marginRight: "20px" }}>
              Soluciones logísticas <br /> integrales para su <br /> negocio.
            </h1>
          </div>
          <div className="col-md-5 text-center px-3">
            <video autoPlay loop muted className="img-fluid">
              <source src="/images/camionetaVideo.mp4" type="video/mp4" />
              Tu navegador no soporta la reproducción de videos.
            </video>
          </div>
          <div className="col-md-2"></div>
        </div>
        
      </main>
    );
  };
  
  export default Inicio;