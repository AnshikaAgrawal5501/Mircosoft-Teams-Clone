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

    let flag = false;

    //------- user check

    for (let i = 0; i < users.length; i++) {
        if (users[i].fname === obj.fname && (users[i].nname === obj.nname || users[i].email === obj.email)) {
            flag = true;
            console.log("user found with same name")
            break;
        }
    }

    if (!flag) {
        users.push(obj);
        console.log("users-form", users)

        res.redirect(`/room/${req.params.roomId}`);
    } else {
        res.redirect(`/errorName/${req.params.roomId}`);
    }
});

app.get('/errorName/:roomId', function(req, res) {
    res.render('errorName', { roomId: req.params.roomId })
});

// ---------------------- Room --------------------------

app.get('/room/:roomId', function(req, res) {

    const roomId = req.params.roomId;

    try {

        if (counter >= 10) {
            res.render('capacityFull', { roomId: roomId });
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
        console.log("peer-connection", counter, users);

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

        socket.on('draw', (lastX, lastY, offsetX, offsetY, pencilColor, pencilWidth) => {
            socket.broadcast.to(roomId).emit('drawing', lastX, lastY, offsetX, offsetY, pencilColor, pencilWidth);
        });

        socket.on('disconnect', () => {

            let index;
            for (let i = 0; i < counter; i++) {
                if (users[i] !== undefined && users[i].id === userId) {
                    index = i;
                    break;
                }
            }

            if (index !== undefined) {
                users.splice(index, 1);
                counter--;
            }

            console.log(`${userName} disconnect`);
            socket.to(roomId).emit('user-disconnected', userId, userName, users);
        });
    });
});

// ---------------------- Error --------------------------

app.get('*', function(req, res) {
    res.render('error404');
});

server.listen(process.env.PORT || port, function() {
    console.log(`Example app listening at http://localhost:${port}`);
});