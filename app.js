require('dotenv').config()
const express = require('express')
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const cors = require('cors')
const cookieparser = require('cookie-parser')
const PORT = process.env.PORT

const indexRouter = require('./routes/index')

const app = express()
app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
});
app.use(cookieparser())
app.use(express.json())
app.use('/', indexRouter)

mongoose.connect('mongodb://localhost:27017/rest_api', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error'));
db.once('open', function () {
    console.log('DB Connected');
});

app.listen(PORT, () => console.log("Server Running Port " + PORT))