const test = () => {
    // How the React state initializes
    const obtenerPrimerDiaMesAnterior = () => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const obtenerUltimoDiaMesAnterior = () => {
        const d = new Date();
        d.setDate(0);
        d.setHours(23, 59, 59, 999);
        return d;
    };

    // How Mantine creates dates when you select them manually (Mantine uses Local Midnight)
    const mantineDate = new Date(2026, 2, 5, 0, 0, 0); // March 5th local midnight

    console.log("Mantine Date toString():", mantineDate.toString());
    console.log("Mantine Date toISOString():", mantineDate.toISOString());

    // Original formatearYYYYMMDDLocal
    const formatearOriginal = (dateOb) => {
        const d = new Date(dateOb);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Mi patch UTC
    const formatearUTC = (dateOb) => {
        const d = new Date(dateOb);
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Mi patch toLocale
    const formatearLocale = (dateOb) => {
        const d = new Date(dateOb);
        const str = d.toLocaleDateString('es-AR', {
            year: 'numeric', month: '2-digit', day: '2-digit'
        });
        const partes = str.split(/[\/\-]/);
        if (partes.length === 3) {
            return `${partes[2]}-${partes[1]}-${partes[0]}`;
        }
        return '';
    };

    console.log("\nFOR MANTINE SELECTED DATE (05/03/2026 Local Midnight):");
    console.log("Original: ", formatearOriginal(mantineDate));
    console.log("UTC Patch: ", formatearUTC(mantineDate));
    console.log("Locale Patch: ", formatearLocale(mantineDate));

    // Wait! The user said "che sigue igual, muestra las del 4". So BEFORE my patch, it showed the 4th, and AFTER my patch, it shows the 4th.

}
test();
