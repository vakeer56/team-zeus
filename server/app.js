const express = require('express');
const mongoose = require('mongoose');
const submissionRoutes = require('./src/routes/submissionRoutes');

const app = express();

require('dotenv').config();

const PORT=process.env.PORT || 3000;

app.use(express.json());
app.use('/submissions', submissionRoutes);


//-----------------------------REMOVE THE CONSOLE MSSGE LATER -------------------------------

mongoose.connect(process.env.DB_URL)
    .then( ()=> console.log("connected to the db...."))
    .catch( err => console.log(err)) ;

app.get('/', (req, res) => {
    res.send('app is alive')
});

app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}...`);
})
