const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./src/routes/auth.routes');
const assessmentRoutes = require('./src/routes/assessment.routes');
const ApiError = require('./src/utils/ApiError');

const app = express();

require('dotenv').config();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(authRoutes);
app.use(assessmentRoutes);

mongoose.connect(process.env.DB_URL)
    .then(() => console.log("connected to the db...."))
    .catch((err) => console.log(err));

app.get('/', (req, res) => {
    res.send('app is alive');
});

app.use((err, req, res, next) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({ success: false, message: err.message });
    }

    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`server is running on port ${PORT}...`);
    });
}

module.exports = app;