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
});

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use('/peerjs', peerServer);

let counter = 0;

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

    if (counter >= 10) {
        res.render('sorry', { roomId: roomId });
    } else {
        res.render('room', { roomId: roomId });
    }
});

io.on('connection', socket => {
    socket.on('join-room', (roomId, userId, userName) => {
        socket.join(roomId);

        counter++;
        console.log(counter);

        socket.to(roomId).emit('user-connected', userId, userName);

        socket.on('message', message => {
            socket.to(roomId).emit('createMessage', message, userId, userName);
        });

        socket.on('screen-share', (userId) => {
            // console.log(temp);
            socket.broadcast.to(roomId).emit('screen-sharing', userId);
        });

        socket.on('disconnect', () => {
            counter--;
            console.log(`disconnect`);
            socket.to(roomId).emit('user-disconnected', userId, userName);
        });
    });
});

server.listen(process.env.PORT || port, function() {
    console.log(`Example app listening at http://localhost:${port}`);
});