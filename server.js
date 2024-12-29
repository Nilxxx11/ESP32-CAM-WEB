// 1. server.js
const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

const wss = new WebSocket.Server({ noServer: true });
let connectedClients = new Set();
let esp32Connection = null;

wss.on('connection', (ws, req) => {
  const isESP32 = req.url === '/esp32';
  
  if (isESP32) {
    console.log('ESP32 conectado');
    esp32Connection = ws;
    
    ws.on('message', (data) => {
      // Transmitir los datos de video a todos los clientes web conectados
      connectedClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      });
    });
    
    ws.on('close', () => {
      console.log('ESP32 desconectado');
      esp32Connection = null;
    });
  } else {
    console.log('Cliente web conectado');
    connectedClients.add(ws);
    
    ws.on('close', () => {
      console.log('Cliente web desconectado');
      connectedClients.delete(ws);
    });
  }
});

// Ruta de estado/health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    clients: connectedClients.size,
    esp32Connected: esp32Connection !== null
  });
});

const server = app.listen(process.env.PORT || 3000, () => {
  console.log(`Servidor corriendo en puerto ${server.address().port}`);
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, socket => {
    wss.emit('connection', socket, request);
  });
});