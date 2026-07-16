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

app.use(cors());
app.use(express.json());

// ── CORS ────────────────────────────────────────────────────────────────────
// CORS_ORIGIN must be set explicitly in the environment — no wildcard default.
// Example .env entry:  CORS_ORIGIN=http://localhost:5173
// For multiple origins separate them with commas:
//   CORS_ORIGIN=https://app.example.com,https://staging.example.com
if (process.env.CORS_ORIGIN) {
    const allowedOrigins = process.env.CORS_ORIGIN.split(',').map((o) => o.trim());
    app.use(
        cors({
            origin: allowedOrigins,
            credentials: true,
        }),
    );
}
// ────────────────────────────────────────────────────────────────────────────
app.use(authRoutes);
app.use(assessmentRoutes);
app.use('/submissions', submissionRoutes);
app.use('/proctor', proctorRoutes);
app.use('/reports', reportRoutes);

app.get('/', (_req, res) => res.send('app is alive'));

// ---- Global error-handling middleware ----
// Must be registered AFTER routes so next(err) reaches it.
// Without this, Express 5 handles errors with its own HTML response
// and never uses ApiError.statusCode.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
    const status = err.statusCode || err.status || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({ success: false, message });
});

module.exports = app;
