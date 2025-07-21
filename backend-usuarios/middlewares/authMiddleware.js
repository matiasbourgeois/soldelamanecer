const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "secreto_super_seguro";

const verificarToken = (req, res, next) => {
    const token = req.header("Authorization");

    if (!token) {
        return res.status(401).json({ error: "Acceso denegado. Token no proporcionado." });
    }

    try {
        const tokenSinBearer = token.startsWith("Bearer ") ? token.slice(7) : token;
        
        const verificado = jwt.verify(tokenSinBearer, JWT_SECRET);

        req.usuario = verificado; // Se podrá usar luego en las rutas
        next();
    } catch (error) {
        console.error("🚨 Error verificando token:", error.message);
        res.status(400).json({ error: "Token inválido" });
    }
};

module.exports = verificarToken;
