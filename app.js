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
let users = [];
let ord;

// ---------------------- Home --------------------------

app.get('/', function(req, res) {
    res.render('home');
});

// ---------------------- Create Room --------------------------

app.get('/createRoom', function(req, res) {
    const roomId = uuidv4();
    ord = roomId;
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
    res.redirect(`/form/${requestedroomId}`);
});

// ---------------------- Room (form) --------------------------

app.get('/form/:roomId', function(req, res) {
    res.render('form', { roomId: req.params.roomId });
});

app.post('/form/:roomId', function(req, res) {

    const obj = {
        fname: req.body.fname,
        lname: req.body.lname,
        email: req.body.email,
        phone: req.body.phone,
        nname: req.body.nname
    }

    if (obj.nname === undefined || obj.nname === '') {
        obj.nname = obj.fname
    }

    users.push(obj);
    console.log("line 74", users)
        // console.log(req)

    res.redirect(`/room/${req.params.roomId}`);
});

// ---------------------- Room --------------------------

app.get('/room/:roomId', function(req, res) {

    const roomId = req.params.roomId;

    try {

        if (counter >= 10) {
            res.render('sorry', { roomId: roomId });
        } else {
            res.render('room', {
                roomId: roomId,
                userFName: users[users.length - 1].fname,
                userLName: users[users.length - 1].lname,
                userEmail: users[users.length - 1].email,
                userPhone: users[users.length - 1].phone,
                userName: users[users.length - 1].nname,
            });
        }
    } catch (e) {
        res.redirect(`/form/${req.params.roomId}`);
    }
});

// ---------------------- Connection --------------------------

io.on('connection', socket => {
    socket.on('join-room', (roomId, userId, userName) => {

        users[users.length - 1].id = userId;

        socket.join(roomId);

        counter++;
        console.log("line 107 ", counter, users);

        socket.to(roomId).emit('user-connected', userId, userName, users);

        socket.on('message', message => {
            socket.to(roomId).emit('createMessage', message, userId, userName);
        });

        socket.on('screen-share', (userId) => {
            socket.broadcast.to(roomId).emit('screen-sharing', userId, users);
        });

        socket.on('stop-screen-share', (userId) => {
            socket.broadcast.to(roomId).emit('stop-screen-sharing', userId, users);
        });

        socket.on('disconnect', () => {

            let index = 0;
            for (let i = 0; i < counter; i++) {
                if (users[i].id === userId) {
                    index = i;
                    break;
                }
            }

            users.splice(index, 1);
            counter--;

            console.log(`${userName} disconnect`);
            socket.to(roomId).emit('user-disconnected', userId, userName, users);
        });
    });
});

// ---------------------- Error --------------------------

app.get('/sorry', function(req, res) {
    res.render('sorry');
});

app.get('*', function(req, res) {
    // res.status(404).send('what???');
    res.render('error');
});

server.listen(process.env.PORT || port, function() {
    console.log(`Example app listening at http://localhost:${port}`);
});