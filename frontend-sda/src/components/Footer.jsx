import "../styles/Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <p className="mb-1">&copy; {new Date().getFullYear()} Sol del Amanecer SRL</p>
      </div>
    </footer>
  );
};

export default Footer;
