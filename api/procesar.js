
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const TwoCaptcha = require("@2captcha/captcha-solver");
const http = require('http');
const WebSocket = require('ws');
const express = require('express');

const port = 3000;
const app = express();
app.use(express.json());

// Crear servidor HTTP y WebSocket
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let clients = [];





// // Función para resolver el CAPTCHA
// async function resolverCaptcha(captchaImageBuffer) {
//     const apiKey = '3bb0ce42560f7ce77d0fe0fe1c633238'; // Reemplaza con tu clave API de 2Captcha
//     const solver = new TwoCaptcha.Solver(apiKey);

//     try {
//         // Verifica si el buffer de la imagen CAPTCHA está definido
//         if (!captchaImageBuffer) {
//             console.error("El buffer de la imagen CAPTCHA no está definido.");
//             return null;
//         }

//         // Convierte el buffer de la imagen a base64
//         const imageBase64 = captchaImageBuffer.toString('base64');

//         // Envía el CAPTCHA a 2Captcha
//         const response = await solver.imageCaptcha({
//             body: imageBase64,
//             numeric: 1, // Indica que el captcha puede contener números
//             min_len: 5, // Longitud mínima de la respuesta
//             max_len: 5, // Longitud máxima de la respuesta
//         });

//         console.log("Respuesta de 2Captcha:", response);

//         // Verifica el estado de la respuesta
//         if (response.status === 1) {
//             // return response.data; // Devuelve el código del CAPTCHA resuelto


//             return {data: response.status, data: response.data, id: response.id}; // Devuelve el código del CAPTCHA resuelto junto con el id

//         } else {
//             console.error("Error al enviar CAPTCHA:", response.request);
//             return null;
//         }
//     } catch (error) {
//         console.error("Error en la solicitud a 2Captcha:", error.message);
//         return null;
//     }
// }














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
    
    try {
        // Esperar a que la imagen esté visible
        await page.waitForSelector(captchaSelector, { timeout: 5000 });

        // Obtener el tamaño del elemento que contiene el CAPTCHA
        const captchaBox = await page.locator(captchaSelector).boundingBox();
        
        if (captchaBox) {
            // Tomar una captura de pantalla de la imagen CAPTCHA
            const screenshotBuffer = await page.screenshot({ type: 'png', clip: captchaBox });

            // Convertir el buffer a base64
            const screenshotBase64 = screenshotBuffer.toString('base64');

            console.log('Captcha guardado en memoria y convertido a base64.');

            // Retornar éxito y la imagen en base64
            return { success: true, message: 'Captcha descargado correctamente.', screenshot: screenshotBase64 };
        } else {
            console.error("No se encontró el elemento CAPTCHA.");
            return { success: false, message: 'No se encontró el elemento CAPTCHA.', screenshot: null };
        }
    } catch (error) {
        console.error('Error al descargar la imagen CAPTCHA:', error);
        return { success: false, message: 'Error al descargar la imagen CAPTCHA.', screenshot: null };
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






// Función para resolver el CAPTCHA y obtener el saldo
async function resolverCaptcha(captchaImageBuffer) {
    const apiKey = '3bb0ce42560f7ce77d0fe0fe1c633238'; // Reemplaza con tu clave API de 2Captcha
    const solver = new TwoCaptcha.Solver(apiKey);

    try {
        if (!captchaImageBuffer) {
            console.error("El buffer de la imagen CAPTCHA no está definido.");
            return { success: false, error: "Buffer de CAPTCHA no definido." };
        }

        const imageBase64 = captchaImageBuffer.toString('base64');

        const response = await solver.imageCaptcha({
            body: imageBase64,
            numeric: 1,
            min_len: 5,
            max_len: 5
        });

        console.log("Respuesta de 2Captcha:", response);

        if (response.status === 1) {
            const saldo = await obtenerSaldo(apiKey);
            return {
                success: true,
                data: response.data,
                id: response.id,
                saldo: saldo || "No se pudo obtener el saldo"
            };
        } else {
            console.error("Error al enviar CAPTCHA:", response.request);
            return { success: false, error: "Error al enviar CAPTCHA." };
        }
    } catch (error) {
        console.error("Error en la solicitud a 2Captcha:", error.message);
        return { success: false, error: error.message };
    }
}

// Función para obtener el saldo de 2Captcha
async function obtenerSaldo(apiKey) {
    try {
        const saldoResponse = await fetch(`http://2captcha.com/res.php?key=${apiKey}&action=getbalance&json=1`);
        const saldoData = await saldoResponse.json();

        if (saldoData.status === 1) {
            console.log("Saldo disponible:", saldoData.request);
            return saldoData.request;
        } else {
            console.error("Error al obtener el saldo:", saldoData.request);
            return null;
        }
    } catch (error) {
        console.error("Error en la solicitud de saldo a 2Captcha:", error.message);
        return null;
    }
}




// Función modificada para devolver los datos capturados
async function procesarFormulario(page, clientId) {
    try {
        // Obtener todas las pestañas abiertas
        const pages = await page.context().pages();

        // Filtrar la nueva pestaña basándonos en la URL que sabemos que se abre
        const nuevaPagina = pages.find(p => p.url().includes('RespuestaConsulta.aspx'));

        // Verificar si se encontró la nueva pestaña
        if (!nuevaPagina) {
            const errorMessage = 'No se encontró la nueva pestaña';
            console.error('Error encontrado:', errorMessage);
            return { error: errorMessage }; // Retornar error para manejarlo después
        }



        // Verificar si hay un mensaje en el label de error
        const errorLabel = await nuevaPagina.$('#lblError');
        if (errorLabel) {
            const errorMessage = await errorLabel.evaluate(el => el.textContent);
            console.warn('Advertencia encontrada en lblError:', errorMessage); // Mostrar como advertencia
            return { advertencia: errorMessage }; // Retornar advertencia y finalizar
        }

        // Si no hay error, esperar a que los selectores necesarios estén presentes
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
        return { datos: datosCapturados };

    } catch (error) {
        console.error('Error al procesar la nueva página:', error.message);
        return { error: error.message }; // Retornar error para manejarlo después
    }
}























// Función para verificar si el elemento contiene visibility:hidden en su atributo style
async function verificarVisibilidad(page, idElemento) {
    return await page.evaluate((idElemento) => {
        const elemento = document.getElementById(idElemento);
        if (elemento && elemento.getAttribute('style') !== null) {
            const estilo = elemento.getAttribute('style');
            return estilo.includes('visibility:hidden'); // Retorna true si contiene 'visibility:hidden', false si no
        }
        return false; // Si el elemento no tiene el atributo 'style' o no existe
    }, idElemento);
}















// Manejar conexiones WebSocket
wss.on('connection', (socket) => {
    console.log('Cliente conectado');
    clients.push(socket);

    socket.on('close', () => {
        console.log('Cliente desconectado');
        clients = clients.filter(client => client !== socket);
    });
});

// Función para enviar mensajes a todos los clientes conectados
const sendToAllClients = (message) => {
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
};

// Función para enviar actualizaciones a todos los clientes conectados
function enviarActualizacion(data) {
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}





// Función para obtener la clase de un elemento
async function obtenerClase(page, elementId) {
    const element = await page.$(`#${elementId}`);
    if (element) {
        // Obtener la propiedad de estilo visibility
        const visibility = await element.evaluate(el => el.style.visibility);
        return visibility; // Devuelve el valor de visibility
    }
    return null; // Devuelve null si el elemento no se encuentra
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
        }else{

            enviarActualizacion({ message: 'Imagen generada correctamente.' });


        }

        await page.waitForTimeout(5000);




        const clase = await obtenerClase(page, 'RegularExpressionValidator1');
        console.log(`El elemento es visible.`,clase);
        
        // Mostrar el texto obtenido
        if (clase === "visible") {
          
            console.log(`El elemento es visible.`);

            // Envía un mensaje de error al cliente
            sendToAllClients(JSON.stringify({ error: 'Numero de Indenficacion No Valido' })); 
        
            // Cierra el navegador
            await browser.close();
        
            // Devuelve la respuesta de error y termina la ejecución
            return res.status(500).json({ error: 'Error  en el nuemero de identificacion' });
        
        } else if (clase === "hidden") {

            console.log(`Texto del error: El elemento está oculto.`);


        
            // Si hay un mensaje de error que necesitas enviar al cliente
            sendToAllClients(JSON.stringify({ message: 'Numero de identificacion valido' })); // Asegúrate de definir esta función


        } else {
            console.log('El elemento no está visible o no existe.');
        
            await browser.close(); // Cerrar el navegador si no se encuentra el elemento
            return res.status(404).json({ error: 'Elemento numero de indentificacion no encontro' });
        }
        
        


        sendToAllClients(JSON.stringify({ message: 'Intentado descargar  Captcha' })); // Asegúrate de definir esta función


        const captchaResultado = await descargarCaptcha(page);
        let codigoCaptcha;
        let idCaptcha ; // ID del CAPTCHA
        let saldo;

        if (!captchaResultado.success) {
            console.error(captchaResultado.message);
            await browser.close();
            return res.status(500).json({ error: captchaResultado.message });
        } else {
            console.log('Captcha descargado correctamente');
            sendToAllClients(JSON.stringify({ message: 'Captcha descargado correctamente' })); // Asegúrate de definir esta función

            // Resuelve el CAPTCHA y asigna el resultado
            const respuestaCaptcha = await resolverCaptcha(captchaResultado.screenshot);
        
            if (respuestaCaptcha) {
                // Asignar los valores de la respuesta del CAPTCHA
                codigoCaptcha = respuestaCaptcha.data; // Código del CAPTCHA resuelto
                 idCaptcha = respuestaCaptcha.id; // ID del CAPTCHA
                 saldo = respuestaCaptcha.saldo; // ID del CAPTCHA

        
                 sendToAllClients(JSON.stringify({ message: 'Ingresando Captcha' })); // Asegúrate de definir esta función


                await ingresarCodigoCaptcha(page, codigoCaptcha);

                // await ingresarCodigoCaptcha(page, "34562");


        
            } else {
                sendToAllClients(JSON.stringify({ error: 'No se pudo resolver el CAPTCHA' })); // Asegúrate de definir esta función

                console.error('Error: No se pudo resolver el CAPTCHA');
                sendToAllClients(JSON.stringify({ error: 'No se pudo resolver el CAPTCHA' }));
        
                // Cerrar el navegador y responder al cliente
                await browser.close();
                return res.status(400).json({
                    mensaje: 'Error al resolver el CAPTCHA',
                    error: 'No se pudo resolver el CAPTCHA',
                });
            }
        }



        sendToAllClients(JSON.stringify({ message: ' Enviando Informacion' })); // Asegúrate de definir esta función


        await enviarFormulario(page);

        // Esperar un tiempo para dar oportunidad a que se abra la nueva pestaña
        await page.waitForTimeout(2000); // Ajusta este valor si es necesario









 // Verifica si el atributo style contiene 'visibility:hidden' después de hacer clic en el botón
 const esOculto = await verificarVisibilidad(page, 'Capcha_ctl00');
 console.log(`Estado del captcha: `, esOculto ? 'Oculto (todo bien)' : 'Visible (error)');

 // Si el captcha no está oculto (es decir, no contiene 'visibility:hidden')
 if (!esOculto) {
     console.log(`El código ingresado no es válido.`);

     // Envía un mensaje de error al cliente
     sendToAllClients(JSON.stringify({ error: 'El código ingresado no es válido' })); // Asegúrate de definir esta función

     // Cierra el navegador
     await browser.close();

     // Devuelve la respuesta de error
     return res.status(500).json({ error: 'El código ingresado no es válido' });

 } else {
     console.log(`El captcha está oculto, todo está bien.`);

     sendToAllClients(JSON.stringify({ message: ' Captcha Validado correctamente' })); // Asegúrate de definir esta función

 }

 sendToAllClients(JSON.stringify({ message: 'Esperando Informacion del afiliado' })); // Asegúrate de definir esta función

// / Asegúrate de que `codigoCaptcha` esté accesible aquí

const respuestaCaptcha  = {
   
    status: 1,
    id: idCaptcha, // Aquí obtienes el id de la respuesta de 2Captcha
    data: codigoCaptcha,
    saldo: saldo

};




// Procesar el formulario
const resultado = await procesarFormulario(page, clientId);

// Manejo de la respuesta según el resultado
if (resultado.error) {
    // Si hay un error, enviar un mensaje al cliente
    console.log('Error en el proceso:', resultado.error);

    // Responder con un error claro al cliente e incluir los datos del captcha (si los tienes disponibles)
    return res.status(400).json({
        mensaje: 'Error al procesar el formulario',
        error: resultado.error, // Aquí se envía el mensaje de error específico
        datosCaptcha: respuestaCaptcha // Aquí incluyes la respuestaCaptcha si está disponible
    });
} else if (resultado.advertencia) {
    // Si hay una advertencia, notificar al cliente pero sin marcarlo como error
    console.log('Advertencia en el proceso:', resultado.advertencia);

    // Responder con un estado 200 indicando que el proceso tuvo una advertencia
    return res.status(200).json({
        mensaje: 'Advertencia al procesar el formulario',
        advertencia: resultado.advertencia, // Aquí se envía el mensaje de advertencia
        datosCaptcha: respuestaCaptcha // Aquí incluyes la respuestaCaptcha si está disponible
    });
}


// Si no hay error, continuar con el flujo normal
const datos = resultado.datos;

// Asegúrate de que `codigoCaptcha` esté accesible aquí
const datosCapturados = {
    datosBasicos: datos.datosBasicos,
    datosAfiliacion: datos.datosAfiliacion,
    fechaProceso: datos.fechaProceso,
   
};



// Cerrar el navegador
await browser.close();

// Responder al cliente con los datos capturados
res.status(200).json({
    mensaje: 'Formulario procesado correctamente',
    datosAfiliado: datosCapturados,
    datosCaptcha: respuestaCaptcha 
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