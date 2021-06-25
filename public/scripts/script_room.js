const videoGrid = document.getElementById('video-grid');
const errorElement = document.querySelector('#errorMsg');
const participants = document.querySelector('#participants ul');

const socket = io('/');
var peer = new Peer(undefined, {
    path: '/peerjs',
    host: '/',
    port: '3000'
});

// const audioOpt = document.getElementById('audioOption');
// const videoOpt = document.getElementById('videoOption');
// let videoFlag = false;
// let audioFlag = false;
// let constraints = { audio: false, video: false };

// audioOpt.addEventListener('click', function() {
//     if (audioFlag) {
//         audioMute();
//     } else {
//         audioUnmute();
//     }
// });

// videoOpt.addEventListener('click', function() {
//     if (videoFlag) {
//         videoOff();
//     } else {
//         videoOn();
//     }
// });

// function audioMute() { //to make audio off
//     constraints.audio = false;
//     console.log('audioMute')
//     audioFlag = !audioFlag;
//     streaming();
// }

// function audioUnmute() { //to make audio on
//     constraints.audio = true;
//     console.log('audioUnmute')
//     audioFlag = !audioFlag;
//     streaming();
// }

// function videoOn() { //to open the video
//     constraints.video = { width: 1440, height: 720 };
//     console.log('videoOn')
//     videoFlag = !videoFlag;
//     streaming();
// }

// function videoOff() { //to off the video
//     constraints.video = false;
//     console.log('videoOff')
//     videoFlag = !videoFlag;
//     streaming();
// }

let constraints = {
    audio: true,
    video: { width: 1440, height: 720 }
};

navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
        const video = document.createElement('video');
        addVideoStream(video, stream);
    });


peer.on('call', call => {
    navigator.mediaDevices.getUserMedia(constraints)
        .then(function(stream) {
            call.answer(stream);
            const video = document.createElement('video');
            call.on('stream', userVideoStream => {
                addVideoStream(video, userVideoStream);
            });
        });

})

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

function connectToNewUser(userId, stream) {
    console.log(`new user ${userId} connected`);
    const call = peer.call(userId, stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream);
    }, function(err) {
        console.log('Failed to get local stream', err);
    });
}

function addVideoStream(video, stream) {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    })
    videoGrid.append(video);
}

function errorMsg(msg, error) {
    errorElement.innerHTML += '<p>' + msg + '</p>';
    if (typeof error !== 'undefined') {
        console.error(error);
    }
}