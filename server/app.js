const express = require('express');
const mongoose = require('mongoose');
const submissionRoutes = require('./src/routes/submissionRoutes');
const proctorRoutes = require('./src/routes/proctorRoutes');
const authRoutes = require('./src/routes/auth.routes');

const app = express();

require('dotenv').config();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/submissions', submissionRoutes);
app.use('/proctor', proctorRoutes);


//-----------------------------REMOVE THE CONSOLE MSSGE LATER -------------------------------
app.use(authRoutes);

mongoose.connect(process.env.DB_URL)
    .then(() => console.log("connected to the db...."))
    .catch((err) => console.log(err));

app.get('/', (req, res) => {
    res.send('app is alive')
});

app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}...`);
});
