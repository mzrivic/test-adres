

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const TwoCaptcha = require("@2captcha/captcha-solver")
const http = require('http'); // Asegúrate de importar el módulo http
const WebSocket = require('ws'); // Importar el módulo WebSocket


const express = require('express'); // Asegúrate de importar Express
const port = 3000; // Puedes cambiar el puerto si lo deseas


const app = express();
app.use(express.json());



// Función para resolver el CAPTCHA
async function resolverCaptcha(captchaImageBuffer) {
    const apiKey = '3bb0ce42560f7ce77d0fe0fe1c633238'; // Reemplaza con tu clave API de 2Captcha
    const solver = new TwoCaptcha.Solver(apiKey);

    try {
        // Verifica si el buffer de la imagen CAPTCHA está definido
        if (!captchaImageBuffer) {
            console.error("El buffer de la imagen CAPTCHA no está definido.");
            return null;
        }

        // Convierte el buffer de la imagen a base64
        const imageBase64 = captchaImageBuffer.toString('base64');

        // Envía el CAPTCHA a 2Captcha
        const response = await solver.imageCaptcha({
            body: imageBase64,
            numeric: 1, // Indica que el captcha puede contener números
            min_len: 5, // Longitud mínima de la respuesta
            max_len: 5, // Longitud máxima de la respuesta
        });

        console.log("Respuesta de 2Captcha:", response);

        // Verifica el estado de la respuesta
        if (response.status === 1) {
            return response.data; // Devuelve el código del CAPTCHA resuelto
        } else {
            console.error("Error al enviar CAPTCHA:", response.request);
            return null;
        }
    } catch (error) {
        console.error("Error en la solicitud a 2Captcha:", error.message);
        return null;
    }
}














// Función para seleccionar el tipo de documento
async function seleccionarTipoDocumento(page, tipoDoc) {
    await page.selectOption('#tipoDoc', { value: tipoDoc });
}

// Función para ingresar el número de documento
async function ingresarNumeroDocumento(page, numero) {
    await page.fill('#txtNumDoc', numero);
}





async function generarNuevaImagenCaptcha(page) {
    try {
        // Esperar a que el enlace esté disponible en la página
        await page.waitForSelector('#Capcha_CaptchaLinkButton', { timeout: 5000 });

        // Hacer clic en el enlace para generar una nueva imagen de CAPTCHA
        await page.click('#Capcha_CaptchaLinkButton');
        console.log('Se ha generado una nueva imagen CAPTCHA');
        
        return { success: true, message: 'Imagen CAPTCHA generada correctamente.' }; // Retorna éxito
    } catch (error) {
        console.error('Error al generar la nueva imagen CAPTCHA:', error);
        return { success: false, message: 'No se pudo generar la nueva imagen CAPTCHA.' }; // Retorna error
    }
}



// Función para descargar la imagen CAPTCHA
async function descargarCaptcha(page) {
    const captchaSelector = '#Capcha_CaptchaImageUP';
    
    // Esperar a que la imagen esté visible
    await page.waitForSelector(captchaSelector);

    // Tomar una captura de pantalla de la imagen CAPTCHA
    const captchaBox = await page.locator(captchaSelector).boundingBox();
    
    if (captchaBox) {
        // Cambia esta línea a una captura de pantalla simple
        const screenshot = await page.screenshot({ type: 'png', clip: captchaBox });
        console.log('Captcha guardado en memoria.');
        return screenshot; // Devolver el buffer de la imagen
    } else {
        console.error("No se encontró el elemento CAPTCHA.");
        return null;
    }
}




















async function ingresarCodigoCaptcha(page, codigo) {
    try {
        await page.waitForSelector('#Capcha_CaptchaTextBox', { timeout: 10000 });
        
        const isVisible = await page.isVisible('#Capcha_CaptchaTextBox');
        console.log("Campo CAPTCHA visible:", isVisible);
        
        console.log("Código CAPTCHA a ingresar:", codigo);
        
        await page.fill('#Capcha_CaptchaTextBox', codigo, { timeout: 10000 });
        await page.waitForTimeout(1000); // Espera 1 segundo
 
    } catch (error) {
        console.error("Error al ingresar el código CAPTCHA:", error);
    }
}


// Función para enviar el formulario
async function enviarFormulario(page) {

    
    await page.click('#btnConsultar');
}



// Función para obtener datos básicos
async function obtenerDatosBasicos(nuevaPagina) {
    return nuevaPagina.evaluate(() => {
        const filas = document.querySelectorAll('#GridViewBasica tr');
        const info = {};
        filas.forEach((fila) => {
            const columnas = fila.querySelectorAll('td');
            if (columnas.length > 1) {
                const key = columnas[0]?.innerText?.trim() || '';
                const value = columnas[1]?.innerText?.trim() || '';
                if (key) {
                    info[key] = value;
                }
            }
        });

        // Procesar nombres y apellidos
        const nombres = info['NOMBRES'] || '';
        const apellidos = info['APELLIDOS'] || '';
        const nombreArray = nombres.split(' ');
        const apellidoArray = apellidos.split(' ');

        info['PRIMER_NOMBRE'] = nombreArray[0] || '';
        info['SEGUNDO_NOMBRE'] = nombreArray[1] || '';
        info['PRIMER_APELLIDO'] = apellidoArray[0] || '';
        info['SEGUNDO_APELLIDO'] = apellidoArray[1] || '';

        delete info['NOMBRES'];
        delete info['APELLIDOS'];

        return info;
    });
}

// Función para obtener datos de afiliación
async function obtenerDatosAfiliacion(nuevaPagina) {
    return nuevaPagina.evaluate(() => {
        const filas = document.querySelectorAll('#GridViewAfiliacion tr');
        const info = [];
        filas.forEach((fila) => {
            const columnas = fila.querySelectorAll('td');
            if (columnas.length > 0) {
                const filaData = {
                    estado: columnas[0]?.innerText?.trim() || '',
                    entidad: columnas[1]?.innerText?.trim() || '',
                    regimen: columnas[2]?.innerText?.trim() || '',
                    fechaAfiliacionEfectiva: columnas[3]?.innerText?.trim() || '',
                    fechaFinalizacionAfiliacion: columnas[4]?.innerText?.trim() || '',
                    tipoAfiliado: columnas[5]?.innerText?.trim() || ''
                };
                info.push(filaData);
            }
        });
        return info;
    });
}

// Función para obtener la fecha del proceso
async function obtenerFechaProceso(nuevaPagina) {
    return nuevaPagina.evaluate(() => {
        const fechaElement = document.querySelector('#lblProceso');
        return fechaElement ? fechaElement.innerText.trim() : null;
    });
}





// Función modificada para devolver los datos capturados
async function procesarFormulario(page, clientId) {
    try {
        // Enviar el formulario
        await enviarFormulario(page);

        // Esperar un tiempo para dar oportunidad a que se abra la nueva pestaña
        await page.waitForTimeout(2000); // Ajusta este valor si es necesario

        // Obtener todas las pestañas abiertas
        const pages = await page.context().pages();

        // Filtrar la nueva pestaña basándonos en la URL que sabemos que se abre
        const nuevaPagina = pages.find(p => p.url().includes('RespuestaConsulta.aspx'));

        if (!nuevaPagina) {
            throw new Error('No se encontró la nueva pestaña');
        }

        // Esperar a que los selectores necesarios estén presentes
        await Promise.all([
            nuevaPagina.waitForSelector('#GridViewBasica', { timeout: 10000 }), // Espera hasta 10 segundos por el selector
            nuevaPagina.waitForSelector('#GridViewAfiliacion', { timeout: 10000 }),
            nuevaPagina.waitForSelector('#lblProceso', { timeout: 10000 })
        ]);

        // Capturar los datos de la nueva pestaña
        const datosBasicos = await obtenerDatosBasicos(nuevaPagina);
        const datosAfiliacion = await obtenerDatosAfiliacion(nuevaPagina);
        const fechaProceso = await obtenerFechaProceso(nuevaPagina);

        // Estructurar los datos capturados
        const datosCapturados = {
            datosBasicos,
            datosAfiliacion,
            fechaProceso
        };

        // (Opcional) Procesar los datos capturados según sea necesario
        console.log('Datos capturados:', datosCapturados);

        // Retornar los datos capturados
        return datosCapturados;

    } catch (error) {
        console.error('Error al procesar la nueva página:', error);
        throw error;
    }
}


// Crear servidor HTTP y WebSocket
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let clients = [];

// Manejar conexiones WebSocket
wss.on('connection', (ws) => {
    console.log('Cliente conectado');
    clients.push(ws);

    ws.on('close', () => {
        console.log('Cliente desconectado');
        clients = clients.filter(client => client !== ws);
    });
});

// Función para enviar actualizaciones a todos los clientes conectados
function enviarActualizacion(data) {
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}
















// Ruta de estado del servidor
app.get('/api/status', (req, res) => {
    res.status(200).json({ mensaje: 'Servidor en funcionamiento' });
});

// Ruta de bienvenida
app.get('/', (req, res) => {
    res.status(200).send('<h1>Bienvenido a mi API</h1>');
});

// Ruta para procesar datos
app.post('/api/procesar', async (req, res) => {
    const { clientId, clientType } = req.body;

    if (!clientId || !clientType) {
        return res.status(400).send('Faltan parámetros clientId o clientType');
    }

    try {
        const browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
            viewport: { width: 1920, height: 1080 }
        });

        const page = await context.newPage();

        // Intentamos cargar la página con un timeout de 15 segundos
        try {
            await page.goto('https://aplicaciones.adres.gov.co/bdua_internet/Pages/ConsultarAfiliadoWeb.aspx', { timeout: 15000 });
            enviarActualizacion({ message: 'La página se ha cargado correctamente.' });
        } catch (navigationError) {
            await browser.close();
            return res.status(502).json({ error: 'La página del servicio no está disponible o no se pudo cargar. Inténtalo más tarde.' });
        }

        // Verificar que el elemento clave esté presente
        const selectorbtnConsultar = '#btnConsultar'; // Cambia este selector según corresponda
        const existeBtnConsulta = await page.$(selectorbtnConsultar);

        if (!existeBtnConsulta) {
            await browser.close();
            return res.status(503).json({ error: 'La página se cargó, pero los elementos necesarios no están disponibles.' });
        } else {
            enviarActualizacion({ message: 'El elemento necesario está disponible y la página se puede procesar.' });
        }

        // Intentamos seleccionar el tipo de documento
        try {
            await seleccionarTipoDocumento(page, clientType);
            enviarActualizacion({ message: 'Tipo de documento seleccionado correctamente.' });
        } catch (error) {
            console.error('Error al seleccionar el tipo de documento:', error);
            await browser.close();
            return res.status(500).json({ error: 'No se pudo seleccionar el tipo de documento.' });
        }

        // Intentamos ingresar el número de documento
        try {
            await ingresarNumeroDocumento(page, clientId);
            enviarActualizacion({ message: 'Número de documento ingresado correctamente.' });
        } catch (error) {
            console.error('Error al ingresar el número de documento:', error);
            await browser.close();
            return res.status(500).json({ error: 'No se pudo ingresar el número de documento.' });
        }



        

        // Captcha
        const resultadoCaptcha = await generarNuevaImagenCaptcha(page);

        if (!resultadoCaptcha.success) {
            await browser.close();
            return res.status(500).json({ error: resultadoCaptcha.message });
        }








        await page.waitForTimeout(5000);

        const captchaPath = await descargarCaptcha(page);






        
        const codigoCaptcha = await resolverCaptcha(captchaPath);

        if (codigoCaptcha) {
            await ingresarCodigoCaptcha(page, codigoCaptcha);
        } else {
            throw new Error('No se pudo resolver el CAPTCHA');
        }

        // Procesar el formulario
        const datos = await procesarFormulario(page, clientId); // Completa con tu lógica
        await browser.close();

        res.status(200).json({
            mensaje: 'Formulario procesado correctamente',
            datos: datos
        });
    } catch (error) {
        console.error('Error en el proceso:', error);
        res.status(500).send('Error al procesar el formulario');
    }
});

// Inicia el servidor
server.listen(port, () => {
    console.log(`Servidor escuchando en prueba http://localhost:${port}`);
});

module.exports = app;