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
    socket.on('join-room', (roomId, userId, userName) => {
        // console.log(roomId);
        socket.join(roomId);
        // console.log('me', roomId, userId, stream)

        socket.to(roomId).emit('user-connected', userId, userName);

        socket.on('message', message => {
            io.to(roomId).emit('createMessage', message, userId, userName);
        });

        socket.on('screen-share', userId => {
            socket.to(roomId).emit('screen-sharing', userId);
        });

        socket.on('disconnect', () => {
            console.log(`disconnect`);
            socket.to(roomId).emit('user-disconnected', userId, userName);
        });
    });
});

server.listen(process.env.PORT || port, function() {
    console.log(`Example app listening at http://localhost:${port}`);
});