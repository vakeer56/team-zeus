require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./src/routes/auth.routes');
const assessmentRoutes = require('./src/routes/assessment.routes');
const submissionRoutes = require('./src/routes/submissionRoutes');
const proctorRoutes = require('./src/routes/proctorRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const ApiError = require('./src/utils/ApiError');

const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Expose Socket.io instance on app
app.set('io', io);

io.on('connection', (socket) => {
  console.log('Socket client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Socket client disconnected:', socket.id);
  });
});

app.use(cors());
app.use(express.json());

// Routes mounting
app.use('/assessments', assessmentRoutes);
app.use('/submissions', submissionRoutes);
app.use('/proctor', proctorRoutes);
app.use('/reports', reportRoutes);
app.use(authRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    console.error("Express Error Handler:", err);
    const status = err.statusCode || err.status || 500;
    const message = err.message || 'Internal server error';
    return res.status(status).json({
        success: false,
        message: status === 500 ? 'Internal server error' : message
    });
});

mongoose.connect(process.env.DB_URL)
    .then(() => console.log("connected to the db...."))
    .catch((err) => console.log(err));

app.get('/', (req, res) => {
    res.send('app is alive');
});

if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`server is running on port ${PORT}...`);
    });
}

module.exports = app;
