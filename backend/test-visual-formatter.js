const formatearYYYYMMDDLocal = (dateOb) => {
    if (!dateOb) return '';
    const d = new Date(dateOb);
    if (isNaN(d.getTime())) return '';

    // MÁXIMA SEGURIDAD VISUAL: Lo que el navegador formatea para el usuario localmente
    // es la verdad absoluta. 
    const str = d.toLocaleDateString('es-AR', {
        year: 'numeric', month: '2-digit', day: '2-digit'
    });
    // str comes as "DD/MM/YYYY" or "DD-MM-YYYY" depending on Node version, usually DD/MM/YYYY
    const partes = str.split(/[\/\-]/);
    if (partes.length === 3) {
        return `${partes[2]}-${partes[1]}-${partes[0]}`;
    }
    return '';
};

// Test with Local Midnight (Created by new Date with components)
const test1 = new Date(2026, 2, 5, 0, 0, 0); // March 5 Local
console.log("Local Midnight:", formatearYYYYMMDDLocal(test1)); // Should be 2026-03-05

// Test with Local 23:59 (Created by setHours)
const test2 = new Date(2026, 2, 5, 23, 59, 59); // March 5 Local Last Min
console.log("Local 23:59:", formatearYYYYMMDDLocal(test2)); // Should be 2026-03-05

// Test with UTC Midnight string (What could come from controlled inputs)
const test3 = new Date("2026-03-05T00:00:00.000Z");
console.log("UTC Midnight:", formatearYYYYMMDDLocal(test3)); // Dependent on TZ, but let's see.

// Test with UTC AR Midnight string
const test4 = new Date("2026-03-05T03:00:00.000Z");
console.log("UTC AR Midnight:", formatearYYYYMMDDLocal(test4)); // Should be 2026-03-05
