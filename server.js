const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
// Use process.env.PORT or default to 3000 if running locally without explicit port setting
const PORT = process.env.PORT || 3000;

const io = new Server(server, {
  allowEIO3: true, // Support for Socket.io 2.x clients (Android)
  cors: {
    origin: "*", // Keep this broad for initial testing, but restrict in production!
    methods: ["GET", "POST"]
  }
});

app.use(express.static(__dirname));

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  // Browser asks Android to start the stream
  socket.on('request-offer', () => {
    console.log('Browser requested offer');
    io.emit('request-offer');
  });

  socket.on('sdp-offer', (data) => {
    console.log('Relaying Offer');
    socket.broadcast.emit('sdp-offer', data);
  });

  socket.on('sdp-answer', (data) => {
    console.log('Relaying Answer');
    socket.broadcast.emit('sdp-answer', data);
  });

  socket.on('ice-candidate', (data) => {
    console.log('Relaying ICE Candidate');
    socket.broadcast.emit('ice-candidate', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Signaling server running on http://localhost:${PORT}`);
});
