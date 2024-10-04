const WebSocket = require('ws'); // Importa la biblioteca ws

// Crear una conexión WebSocket
const socket = new WebSocket('ws://localhost:3000');

// Evento que se dispara cuando se establece la conexión
socket.addEventListener('open', () => {
    console.log('Conexión WebSocket establecida');
});

// Evento que se dispara cuando se recibe un mensaje del servidor
socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data); // Parsear el mensaje recibido

    // Verifica si hay un mensaje de error
    if (message.error) {
        console.error('Error recibido del servidor:', message.error); // Manejo del error
        socket.close(); // Cerrar la conexión WebSocket
    } else {
        console.log('Mensaje recibido del servidor:', message); // Manejo del mensaje normal
    }
});

// Evento que se dispara cuando hay un error en la conexión WebSocket
socket.addEventListener('error', (error) => {
    console.error('Error en WebSocket:', error);
});

// Evento que se dispara cuando se cierra la conexión
socket.addEventListener('close', () => {
    console.log('Conexión WebSocket cerrada');
});

// Función principal para realizar la solicitud
async function realizarSolicitud() {
    try {
        // Realizamos la solicitud fetch
        const response = await fetch('http://localhost:3000/api/procesar', {
            method: 'POST', // Método de la solicitud
            headers: {
                'Content-Type': 'application/json', // Tipo de contenido
            },
            // body: JSON.stringify({ clientId: '123454', clientType: 'CC' }), // Cuerpo de la solicitud

            body: JSON.stringify({ clientId: '1022984543', clientType: 'CC' }), // Cuerpo de la solicitud

        });

        // Verificamos si la respuesta fue exitosa (código 2xx)
        if (!response.ok) {
            const errorMessage = await response.text(); // Captura el mensaje de error del servidor
            console.error('Error en la solicitud:', errorMessage);
            socket.close(); // Cerrar la conexión WebSocket en caso de error
            return; // Termina la función
        }

        // Convertimos la respuesta a JSON
        const data = await response.json();

        // Mostramos la respuesta formateada en la consola
        console.log('Respuesta del servidor:', JSON.stringify(data, null, 2));
    } catch (error) {
        // Capturamos y mostramos cualquier error que ocurra durante la solicitud
        console.error('Error:', error);
        socket.close(); // Cerrar la conexión WebSocket en caso de error
    }
}

// Llamamos a la función para realizar la solicitud
realizarSolicitud();
