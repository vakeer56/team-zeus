/**
 * src/app.js  — Pure Express app (no listen, no DB connection).
 * Imported by tests and by the root app.js entry point.
 */

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const assessmentRoutes = require('./routes/assessment.routes');
const submissionRoutes = require('./routes/submissionRoutes');
const proctorRoutes = require('./routes/proctorRoutes');
const reportRoutes = require('./routes/reportRoutes');
const ApiError = require('./utils/ApiError');

const app = express();

app.use(express.json());

const defaultOrigins = [
    'http://localhost:5173',
    'https://team-zeus-oz502elrp-varuns-projects-ed5fdbfe.vercel.app',
];
const configuredOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
    : defaultOrigins;

app.use(
    cors({
        origin: configuredOrigins,
        credentials: true,
    }),
);
// ────────────────────────────────────────────────────────────────────────────
app.use(authRoutes);
app.use(assessmentRoutes);
app.use('/submissions', submissionRoutes);
app.use('/proctor', proctorRoutes);
app.use('/reports', reportRoutes);

app.get('/', (_req, res) => res.send('app is alive'));


app.use((err, _req, res, _next) => {
    const status = err.statusCode || err.status || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({ success: false, message });
});

module.exports = app;
