fetch('http://localhost:3000/procesar', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ clientId: '16742008', clientType: 'CC' }),
})
.then(response => response.json())
.then(data => {
    console.log('Respuesta del servidor:', JSON.stringify(data, null, 2)); // Mostrar respuesta formateada
})
.catch(error => console.error('Error:', error));
