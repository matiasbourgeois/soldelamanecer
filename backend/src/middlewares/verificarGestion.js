module.exports = function verificarGestion(req, res, next) {
    if (['admin', 'administrativo'].includes(req.usuario.rol)) {
        return next();
    }
    return res.status(403).json({ error: "Acceso denegado. Se requiere rol de gestión." });
};
