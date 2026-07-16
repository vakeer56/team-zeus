const express = require('express');

const app = express();

require('dotenv').config();

const PORT=process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('app is alive')
});

app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}...`);
})