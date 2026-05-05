require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const serviceRoutes = require('./routes/services');
const counterRoutes = require('./routes/counters');
const queueRoutes = require('./routes/queue');
const adminRoutes = require('./routes/admin');
const setupSocket = require('./socket');

const app = express();
const server = http.createServer(app);

// Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Make io accessible in controllers via req.app.get('io')
app.set('io', io);
setupSocket(io);

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/counters', counterRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
