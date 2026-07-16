/**
 * src/app.js  — Pure Express app (no listen, no DB connection).
 * Imported by tests and by the root app.js entry point.
 */

const express = require('express');
const authRoutes = require('./routes/auth.routes');
const assessmentRoutes = require('./routes/assessment.routes');
const submissionRoutes = require('./routes/submissionRoutes');
const proctorRoutes = require('./routes/proctorRoutes');
const ApiError = require('./utils/ApiError');

const app = express();

app.use(express.json());
app.use(authRoutes);
app.use(assessmentRoutes);
app.use('/submissions', submissionRoutes);
app.use('/proctor', proctorRoutes);

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
