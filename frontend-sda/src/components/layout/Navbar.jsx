import { User } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "@styles/Navbar.css";
import { useContext } from "react";
import AuthContext from "@core/context/AuthProvider";


const Navbar = () => {
  const { auth } = useContext(AuthContext);
  if (auth?._id && auth?.token) return null;

  const [scrolled, setScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`navbar navbar-expand-lg fixed-top ${scrolled ? "scrolled" : ""}`}>
      <div className="container">
        <Link to="/" className="navbar-brand text-warning logo">
          Sol del Amanecer SRL
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className={`collapse navbar-collapse ${isDropdownOpen ? "show" : ""}`}>
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link to="/" className="nav-link" onClick={() => setIsDropdownOpen(false)}>
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/servicios" className="nav-link" onClick={() => setIsDropdownOpen(false)}>
                Servicios
              </Link>
            </li>
            <li className="nav-item">
              <Link
                to="/cotizador-online"
                className="nav-link"
                onClick={() => setIsDropdownOpen(false)}
              >
                Cotizador Online
              </Link>
            </li>

            <li className="nav-item">
              <Link to="/seguimiento" className="nav-link" onClick={() => setIsDropdownOpen(false)}>
                Seguimiento de Envíos
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/contacto" className="nav-link" onClick={() => setIsDropdownOpen(false)}>
                Contacto
              </Link>
            </li>
            <div className="nav-separator" />
            <li className="nav-item auth-buttons">
              <Link to="/login" className="nav-link">Iniciar Sesión</Link>
            </li>
            <li className="nav-item">
              <Link to="/registro" className="nav-link">Registrarse</Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
