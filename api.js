const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https'); // <--- Añade esta línea
const path = require('path'); // <--- Añade esta línea

const app = express();
const port = 3000;

// Crea un agente HTTPS para ignorar la verificación del certificado
const agent = new https.Agent({
    rejectUnauthorized: false
});

async function getPrice() {
    try {
        const url = "https://www.bcv.org.ve/";
        // Pasa el agente en la configuración de la petición de axios
        const { data: html } = await axios.get(url, { httpsAgent: agent });
        
        const $ = cheerio.load(html);

        const usdElement = $('#dolar strong');
        const euroElement = $('#euro strong');

        let usdPrice = null;
        if (usdElement.length > 0) {
            let usdText = usdElement.text().trim();
            usdText = usdText.replace(",", ".");
            usdPrice = parseFloat(usdText.replace(/[^0-9.]/g, ''));
        }

        let euroPrice = null;
        if (euroElement.length > 0) {
            let euroText = euroElement.text().trim();
            euroText = euroText.replace(",", ".");
            euroPrice = parseFloat(euroText.replace(/[^0-9.]/g, ''));
        }

        return { usd: usdPrice.toFixed(2), euro: euroPrice.toFixed(2) };

    } catch (error) {
        console.error('Error fetching data from BCV: ' + error.message);
        throw new Error('Could not retrieve prices from the source.');
    }
}

// Configurar la ruta para el archivo HTML
const htmlFilePath = path.join(__dirname, 'index.html');

app.get('/', (req, res) => {
    res.sendFile(htmlFilePath);
});

app.get('/prices', async (req, res) => {
    try {
        req.headers = {
            "Access-Control-Allow-Origin":"*"
        };
        const prices = await getPrice();

        if (prices.usd === null || prices.euro === null) {
            res.status(500).json({
                message: 'No se pudieron obtener los precios de las divisas.',
                existe: 0,
                data: null
            });
        } else {
            res.status(200).json({
                message: 'Precios obtenidos exitosamente.',
                existe: 1,
                data: prices
            });
        }
    } catch (error) {
        res.status(500).json({
            message: 'Ocurrió un error en el servidor.',
            error: error.message,
            existe: 0,
            data: null
        });
    }
});

app.listen(port, () => {
    console.log(`API está corriendo en http://localhost:${port}`);
    console.log(`Prueba la API visitando http://localhost:${port}/prices en tu navegador.`);
});