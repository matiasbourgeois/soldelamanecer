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

        req.usuario = {
            id: verificado.id || verificado._id,
            _id: verificado._id || verificado.id,
            rol: verificado.rol,
        };


        next();
    } catch (error) {
        console.error("🚨 Error verificando token:", error.message);
        res.status(403).json({ error: "Token inválido o expirado" });
    }
};




module.exports = verificarToken;
