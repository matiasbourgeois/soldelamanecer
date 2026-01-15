const winston = require('winston');
const path = require('path');

// Definir formatos personalizados
const logFormat = winston.format.printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
});

const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'backend-sda' },
    transports: [
        // Escribir todos los errores en error.log
        new winston.transports.File({
            filename: path.join(process.cwd(), 'logs', 'error.log'),
            level: 'error'
        }),
        // Escribir todos los logs en combined.log
        new winston.transports.File({
            filename: path.join(process.cwd(), 'logs', 'combined.log')
        })
    ]
});

// Si no estamos en producción, loguear a la consola con colores
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
            logFormat
        )
    }));
}

module.exports = logger;
