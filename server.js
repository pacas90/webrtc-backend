const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

const io = new Server(server, {
  allowEIO3: true,
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.static(__dirname));

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // 1. Android device announces it is ready to share
  socket.on('notify-sharing', (data) => {
    console.log(`Device ${socket.id} is ready to share.`);
    // Tell all web dashboards that a new device is available
    socket.broadcast.emit('incoming-request', { 
        id: socket.id, 
        name: data.name || 'Unknown Device' 
    });
  });

  // 2. Web dashboard accepts a specific device's request
  socket.on('accept-request', (targetAndroidId) => {
    console.log(`Web ${socket.id} accepted share from ${targetAndroidId}`);
    // Tell that SPECIFIC Android device to start sending video to this web user
    io.to(targetAndroidId).emit('request-offer', { viewerId: socket.id });
  });

  // 3. Point-to-Point WebRTC Signaling
  // Notice we now use io.to(target).emit instead of socket.broadcast
  
  socket.on('sdp-offer', (data) => {
    io.to(data.target).emit('sdp-offer', { senderId: socket.id, sdp: data.sdp });
  });

  socket.on('sdp-answer', (data) => {
    io.to(data.target).emit('sdp-answer', data);
  });

  socket.on('ice-candidate', (data) => {
    io.to(data.target).emit('ice-candidate', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Tell dashboards to remove this device if it disconnected
    socket.broadcast.emit('device-disconnected', socket.id);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Targeted signaling server running on port ${PORT}`);
});