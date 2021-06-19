const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose')

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get('/', function(req, res) {
    res.render('home');
});

app.get('/room', function(req, res) {
    res.render('room');
});

app.listen(process.env.PORT || port, function() {
    console.log(`Example app listening at http://localhost:${port}`);
});