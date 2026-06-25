import http from 'http';
import app from './app.js';
import connectDB from './config/db.js';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

dotenv.config();

const server = http.createServer(app);

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'development' 
        ? (origin, callback) => callback(null, true)
        : [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:5174',
            'http://127.0.0.1:5174',
            process.env.CLIENT_URL
          ].filter(Boolean),
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Client socket connected: ${socket.id}`);

    socket.on('join', (employeeId) => {
      socket.join(employeeId);
      console.log(`Socket ${socket.id} joined room: ${employeeId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Client socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getSocketInstance = () => io;

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  initSocket(server);
  server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
});
