const jwt = require('jsonwebtoken');

const generarJWT = (uid, rol) => {
    return new Promise((resolve, reject) => {
        const payload = { uid, rol };
        // Use env variable or fallback
        jwt.sign(payload, process.env.JWT_SECRET || 'SDA_Secret_Key_2025', {
            expiresIn: '24h'
        }, (err, token) => {
            if (err) {
                console.log(err);
                reject('No se pudo generar el token');
            } else {
                resolve(token);
            }
        });
    });
}

module.exports = {
    generarJWT
}
