const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

/**
 * Genera un PDF a partir de una plantilla HTML y datos dinámicos.
 * @param {string} templateName - Nombre del archivo en la carpeta /templates.
 * @param {object} data - Datos para inyectar en la plantilla.
 * @param {string} outputPath - Ruta completa donde se guardará el PDF.
 * @returns {Promise<string>} - Ruta del archivo generado.
 */
const generatePDF = async (templateName, data, outputPath) => {
    let browser;
    try {
        const templatePath = path.join(process.cwd(), 'templates', templateName);
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Plantilla no encontrada: ${templatePath}`);
        }

        const htmlContent = fs.readFileSync(templatePath, 'utf8');
        const template = handlebars.compile(htmlContent);
        const finalHtml = template(data);

        // Asegurar que el directorio de salida exista
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setContent(finalHtml, { waitUntil: 'networkidle0' });

        await page.pdf({
            path: outputPath,
            format: data.format || 'A4',
            landscape: data.landscape || false,
            printBackground: true,
            margin: data.pdfMargin || { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
        });

        logger.info(`PDF generado exitosamente: ${outputPath}`);
        return outputPath;

    } catch (error) {
        logger.error(`Error en pdfService: ${error.message}`, { stack: error.stack });
        throw error;
    } finally {
        if (browser) await browser.close();
    }
};

module.exports = {
    generatePDF
};
