const express = require('express');
const app = express();
const port = 3000;
const router = require('./routers/index')

app.set('view engine', 'ejs');
app.use(express.urlencoded({urlencoded: false}));

app.use('/', router);

app.listen(port, () => {
    console.log(`Cloud.gg listening on http://localhost:3000`)
})