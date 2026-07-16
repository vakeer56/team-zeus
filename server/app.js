/**
 * app.js  — Production entry point.
 *
 * This file is intentionally thin:
 *   1. Load env vars
 *   2. Connect to MongoDB
 *   3. Start listening (with Socket.io attached to the HTTP server)
 *
 * All route wiring, middleware registration, and the global error
 * handler live in src/app.js (the single source of truth), which is
 * also imported directly by the test suite.
 */

'use strict';

require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()) : [],
        methods: ['GET', 'POST'],
    },
});

// Expose Socket.io instance so route handlers can emit events via req.app.get('io')
app.set('io', io);

io.on('connection', (socket) => {
    console.log('Socket client connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('Socket client disconnected:', socket.id);
    });
});

mongoose
    .connect(process.env.DB_URL)
    .then(() => {
        console.log('Connected to the database.');
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}.`);
        });
    })
    .catch((err) => {
        console.error('Database connection failed:', err);
        process.exit(1);
    });
