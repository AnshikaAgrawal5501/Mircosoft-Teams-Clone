const videoGrid1 = document.getElementById('video-grid-1');
const videoGrid2 = document.getElementById('video-grid-2');
// const errorElement = document.querySelector('#errorMsg');
const participants = document.querySelector('#participants ul');
const msgInput = document.getElementById('messageInput');
const chat = document.querySelector('.chat-list ul')

const audioOpt = document.getElementById('audioOption')
const videoOpt = document.getElementById('videoOption')


const socket = io('/');
const peer = new Peer(undefined, {
    path: '/peerjs',
    host: 'https://fierce-lowlands-47586.herokuapp.com/',
    // port: '3000'
    port: process.env.PORT
});
let myVideoStream;



let constraints = {
    audio: true,
    video: { width: 1440, height: 720 }
};

navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
        myVideoStream = stream;
        // console.log(myVideoStream)
        const grid = videoGrid2;
        addVideoStream(grid, stream, `white`);
    });


peer.on('call', call => {
    navigator.mediaDevices.getUserMedia(constraints)
        .then(function(stream) {
            call.answer(stream);
            const grid = videoGrid1;
            call.on('stream', userVideoStream => {
                console.log('call')
                addVideoStream(grid, userVideoStream, `red`);
            });
            // addVideoStream(grid, stream, `red`);
        });
});

socket.on('user-connected', userId => {
    console.log(participants)
    const user = document.createElement('li');
    user.innerText = userId;
    participants.appendChild(user);
    navigator.mediaDevices.getUserMedia(constraints)
        .then(function(stream) {
            connectToNewUser(userId, stream);
        });
});

peer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id);
});


peer.on('close', id => {
    socket.emit('disconnect', ROOM_ID, id);
});


socket.on('user-disconnected', userId => {
    peer;
});




function connectToNewUser(userId, stream) {
    console.log(`new user ${userId} connected`);
    const call = peer.call(userId, stream);
    const grid = videoGrid1;
    // call.on('stream', userVideoStream => {
    //     console.log('user')
    //     addVideoStream(grid, userVideoStream, `green`);
    // }, function(err) {
    //     console.log('Failed to get local stream', err);
    // });
    // addVideoStream(grid, stream, `green`);
}

function addVideoStream(grid, stream, color) {
    const video = document.createElement('video');
    video.srcObject = stream;
    video.style.border = `2px solid ${color}`;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    })
    grid.append(video);
}

// function errorMsg(msg, error) {
//     errorElement.innerHTML += '<p>' + msg + '</p>';
//     if (typeof error !== 'undefined') {
//         console.error(error);
//     }
// }

msgInput.addEventListener('keydown', function(e) {
    if (e.keyCode === 13) {
        sendMsg();
    }
});

function sendMsg() {
    const msg = msgInput.value;
    console.log(msg);

    socket.emit('message', msg);
    msgInput.value = '';
}

let users = [
    { id: '', name: 'Me', color: 'pink' },
    { id: '', name: 'user', color: 'green' }
];

socket.on('createMessage', (msg, userId) => {


    // let userName;
    // let msgColor;

    // if (users[0].id === '') {
    //     users[0].id = userId;
    //     userName = users[0].name;
    //     msgColor = users[0].color;
    // } else {
    //     users[1].id = userId;
    //     userName = users[1].name;
    //     msgColor = users[1].color;
    // }


    const message = document.createElement('li');
    message.innerText = `${userId} - ${msg}`;
    // message.style.backgroundColor = msgColor;
    chat.appendChild(message);
});






const setMuteButton = () => {
    const html = `<i class="fas fa-microphone nav-link"></i>`
    audioOpt.innerHTML = html;
}

const setUnmuteButton = () => {
    const html = `<i class="fas fa-microphone-slash nav-link"></i>`
    audioOpt.innerHTML = html;
}

const muteUnmute = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        setUnmuteButton();
    } else {
        myVideoStream.getAudioTracks()[0].enabled = true;
        setMuteButton();
    }
}





const setPlayVideo = () => {
    const html = `<i class="fas fa-video-slash nav-link"></i>`
    videoOpt.innerHTML = html;
}

const setStopVideo = () => {
    const html = `<i class="fas fa-video nav-link"></i>`
    videoOpt.innerHTML = html;
};

const playStop = () => {
    let enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        setPlayVideo()
    } else {
        myVideoStream.getVideoTracks()[0].enabled = true;
        setStopVideo()
    }
}