const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https'); // <--- Añade esta línea
const path = require('path'); // <--- Añade esta línea

const app = express();
const port = 3000;

app.disable('x-powered-by');

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

app.get('/', async (req, res) => {
    // res.sendFile(htmlFilePath);
    try {
        
        res.header('Access-Control-Allow-Origin','*');

        const prices = await getPrice();

        if (prices.usd === null || prices.euro === null) {
            res.status(500).json({
                message: 'No se pudieron obtener los precios de las divisas.',
                existe: 0,
                data: null
            });
        } else {
            res.send(generateIndex(prices));
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

app.get('/prices', async (req, res) => {
    try {
        
        res.header('Access-Control-Allow-Origin','*');

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



function generateIndex(prices) {
    const index = `
        <!DOCTYPE html>
        <html lang="sp">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>CalculaDolar</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-LN+7fdVzj6u52u30Kp6M/trliBMCMKTyK833zpbD+pXdCLuTusPj697FH4R/5mcr" crossorigin="anonymous">
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/js/bootstrap.bundle.min.js" integrity="sha384-ndDqU0Gzau9qJ1lfW4pNLlhNTkCfHzAVBReH9diLvGRem5+R9g2FzA8ZGN954O5Q" crossorigin="anonymous"></script>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

        </head>
        <body>
            <div class="container mt-5">
                <div class="row justify-content-center">
                    <div class="col-lg-8">
                        <div class="card shadow-lg border-0 rounded-3">
                            <div class="card-header bg-primary text-white text-center py-4 rounded-top-3">
                                <h4 class="mb-0">CalculaDolar</h4>
                                <p class="mb-0 text-white-75">BCV</p>
                            </div>
                            <div class="card-body p-4">
                                <div class="d-flex align-items-center mb-4 pb-3 border-bottom">

                                    <div class="col-12 col-md-6 justify-content-between align-items-center d-flex">
                                        <div class="p-3 bg-success-subtle rounded-circle text-center text-start">
                                            <i class="fa-solid fa-calculator text-primary fs-4"></i>
                                        </div>

                                        <div class="text-start col ms-3">
                                            <h5 class="col-12 mb-0">Calcular Divisas</h5>
                                            <p class="col-12 text-muted mb-0">ingresa una cantidad</p>
                                            <input class="col-12 form-control p-2" type="text" name="cantidad" id="cantidad"> 
                                        </div>
                                    </div>    

                                    <div class="row ms-2">
                                        <div class="mb-2 col col-12 text-start">
                                            <h5 class="col-12 mb-0 fas fa-dollar-sign text-success">&nbsp; USD</h5>
                                            <span class="fs-4 fw-bold text-dark">Bs.</span>
                                            <span id="calculateDolarPrice" class="fs-4 fw-bold text-dark">${prices.usd}</span>
                                        </div>
                                    
                                        <div class="mb-2 ms-auto col-12 text-start">
                                            <h5 class="col-12 mb-0 fas fa-euro-sign text-success">&nbsp; EUR</h5>
                                            <span class="fs-4 fw-bold text-dark">Bs.</span>
                                            <span id="calculateEuroPrice" class="fs-4 fw-bold text-dark">${prices.euro}</span>
                                        </div>
                                    </div>


                                </div>
                                <div class="d-flex align-items-center mb-4 pb-3 border-bottom">
                                    <div class="p-3 bg-success-subtle rounded-circle me-3">
                                        <i class="fas fa-dollar-sign text-success fs-4"></i>
                                    </div>
                                    <div>
                                        <h5 class="mb-0">Dólar USD</h5>
                                        <p class="text-muted mb-0">Precio hoy</p>
                                    </div>
                                    <div class="ms-auto text-end">
                                        <span class="fs-4 fw-bold text-dark">Bs.</span>
                                        <span id="dolarPrice" class="fs-4 fw-bold text-dark">${prices.usd}</span>
                                    </div>
                                </div>

                                <div class="d-flex align-items-center">
                                    <div class="p-3 bg-info-subtle rounded-circle me-3">
                                        <i class="fas fa-euro-sign text-info fs-4"></i>
                                    </div>
                                    <div>
                                        <h5 class="mb-0">Euro EUR</h5>
                                        <p class="text-muted mb-0">Precio hoy</p>
                                    </div>
                                    <div class="ms-auto text-end">
                                        <span class="fs-4 fw-bold text-dark">Bs.</span>
                                        <span id="eurPrice" class="fs-4 fw-bold text-dark">${prices.euro}</span>
                                    </div>
                                </div>

                                <div class="m-5 text-center justify-content-center d-flex align-items-center">
                                    <button onclick="updatePrices()" type="button" class="btn btn-primary">Actualizar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <script>
                const input = document.getElementById('cantidad'); 
                input.addEventListener('keyup', () => {
                    const cantidad = input.value == "" || input.value == "0" ? 1 : parseFloat(input.value);
                    const dolarPrice = parseFloat(document.getElementById('dolarPrice').textContent);
                    const euroPrice = parseFloat(document.getElementById('eurPrice').textContent);
    
                    document.getElementById('calculateDolarPrice').textContent = parseFloat(cantidad * dolarPrice).toFixed(2);
                    document.getElementById('calculateEuroPrice').textContent = parseFloat(cantidad * euroPrice).toFixed(2);
                });

                async function updatePrices() {

                    const response = await fetch('/prices');
                    let prices = await response.json();
                    prices = prices.data;

                    if (prices.usd === null || prices.euro === null) {
                        res.status(500).json({
                            message: 'No se pudieron obtener los precios de las divisas.',
                            existe: 0,
                            data: null
                        });
                    } else {
                        document.getElementById('dolarPrice').innerText = prices.usd;
                        document.getElementById('eurPrice').innerText = prices.euro;
                    }
                }
            </script>
        </body>
        </html>`;
        return index;
}

async function updatePrices() {

    const response = await fetch('http://localhost:3000/prices');
    const prices = await response.json();

    if (prices.usd === null || prices.euro === null) {
        res.status(500).json({
            message: 'No se pudieron obtener los precios de las divisas.',
            existe: 0,
            data: null
        });
    } else {
        document.getElementById('dolarPrice').innerText = prices.usd;
        document.getElementById('eurPrice').innerText = prices.euro;
    }
}