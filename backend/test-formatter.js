const fs = require('fs');

const formatearFechaUTC = (fechaStr) => {
    if (!fechaStr) return '-';
    try {
        const d = new Date(fechaStr);
        const userTimezoneOffset = d.getTimezoneOffset() * 60000;
        const dateConOffset = new Date(d.getTime() + userTimezoneOffset);

        let out = `Original Date: ${fechaStr}\n`;
        out += `Pared Date (d): ${d.toString()}\n`;
        out += `Offset (d.getTimezoneOffset): ${d.getTimezoneOffset()} min\n`;
        out += `Date with offset added: ${dateConOffset.toString()}\n`;

        const final = new Intl.DateTimeFormat('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(dateConOffset);
        out += `Formateada AR: ${final}\n\n`;
        return out;
    } catch (e) { return '-'; }
};

const fecha1 = '2026-03-05T03:00:00.000Z';
const fecha2 = '2026-03-05T00:00:00.000Z';
const fecha3 = '2026-03-04T03:00:00.000Z'; // The 4th of March Midnight AR

fs.writeFileSync('out.txt', formatearFechaUTC(fecha1) + formatearFechaUTC(fecha2) + formatearFechaUTC(fecha3), 'utf8');
