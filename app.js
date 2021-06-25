const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;

const server = require('http').createServer(app);
const io = require('socket.io')(server);
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
    debug: true,
    // path: '/peerjs'
});

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use('/peerjs', peerServer);

// ---------------------- Home --------------------------

app.get('/', function(req, res) {
    res.render('home');
});

// ---------------------- Create Room --------------------------

app.get('/createRoom', function(req, res) {
    const roomId = uuidv4();
    console.log(roomId);
    res.render('createRoom', { roomId: roomId });
});

// ---------------------- Join Room --------------------------

app.get('/joinRoom', function(req, res) {
    res.render('joinRoom');
});

// ---------------------- Join Room (post) --------------------------

app.post('/joinRoom', function(req, res) {
    const requestedroomId = req.body.roomId;
    res.redirect(`/${requestedroomId}`);
});

// ---------------------- Room --------------------------

app.get('/:roomId', function(req, res) {
    const roomId = req.params.roomId;
    // console.log(roomId)
    res.render('room', { roomId: roomId });
});

io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
        // console.log(roomId);
        socket.join(roomId);

        socket.broadcast.to(roomId).emit('user-connected', userId);
    });
});

server.listen(process.env.PORT || port, function() {
    console.log(`Example app listening at http://localhost:${port}`);
});