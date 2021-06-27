const videoGrid1 = document.getElementById('video-grid-1');
const videoGrid2 = document.getElementById('video-grid-2');
const participants = document.querySelector('#participants ul');
const msgInput = document.getElementById('messageInput');
const chat = document.querySelector('.chat-list')

const audioOpt = document.getElementById('audioOption')
const videoOpt = document.getElementById('videoOption')

const screenShare = document.querySelector('#screen-share i');

const socket = io('/');
const peer = new Peer();
let myVideoStream;


const callList = [];


let constraints = {
    audio: {
        echoCancellation: { exact: true },
        googEchoCancellation: { exact: true },
        googAutoGainControl: { exact: true },
        googNoiseSuppression: { exact: true },
    },
    video: { width: 1440, height: 720 },

};
console.log(constraints);
peer.on('open', id => {

    let userName = prompt('Enter your name.');
    if (userName === null) {
        userName = `Guest`;
    }

    navigator.mediaDevices.getUserMedia(constraints)
        .then(function(stream) {
            myVideoStream = stream;
            socket.emit('join-room', ROOM_ID, id, userName);

            const grid = videoGrid2;
            addVideoStream(grid, myVideoStream, `white`);
        });
});


// peer.on('call', call => {
//     navigator.mediaDevices.getUserMedia(constraints)
//         .then(function(stream) {
//             call.answer(stream);
//             const grid = videoGrid1;

//             call.on('stream', userVideoStream => {
//                     console.log('call')
//                     if (!callList[call.peer]) {
//                         addVideoStream(grid, userVideoStream, `red`);
//                         callList[call.peer] = call;
//                     }
//                 },
//                 function(err) {
//                     console.log('Failed to get local stream', err);
//                 });
//         });
// });

peer.on('call', call => {
    call.answer(myVideoStream);
    const grid = videoGrid1;

    call.on('stream', userVideoStream => {
            console.log('call')
            if (!callList[call.peer]) {
                addVideoStream(grid, userVideoStream, `red`);
                callList[call.peer] = call;
            }
        },
        function(err) {
            console.log('Failed to get local stream', err);
        });

});

socket.on('user-connected', (userId, userName) => {
    // console.log(participants)

    const user = document.createElement('li');
    user.innerText = `${userId} ----- ${userName}`;
    participants.appendChild(user);


    connectToNewUser(userId, myVideoStream);

});

// navigator.mediaDevices.getUserMedia(constraints)
//     .then(function(stream) {

//         myVideoStream = stream;
//         peer.on('open', id => {

//             console.log('entered')

//             let userName = prompt('Enter your name.');
//             if (userName === null) {
//                 userName = `Guest`;
//             }

//             socket.emit('join-room', ROOM_ID, id, userName);

//             const grid = videoGrid2;
//             addVideoStream(grid, myVideoStream, `white`);
//         });

//         peer.on('call', call => {
//             call.answer(stream);
//             const grid = videoGrid1;

//             call.on('stream', userVideoStream => {
//                     console.log('call')
//                     if (!callList[call.peer]) {
//                         addVideoStream(grid, userVideoStream, `red`);
//                         callList[call.peer] = call;
//                     }
//                 },
//                 function(err) {
//                     console.log('Failed to get local stream', err);
//                 });

//         });
//     });





// socket.on('user-connected', (userId, userName) => {
//     // console.log(participants)

//     const user = document.createElement('li');
//     user.innerText = `${userId} ----- ${userName}`;
//     participants.appendChild(user);


//     navigator.mediaDevices.getUserMedia(constraints)
//         .then(function(stream) {
//             connectToNewUser(userId, stream);
//         });
// });

// document.querySelector('.leave').addEventListener('click', function() {
//     // console.log('leave')

//     peer.on('close', id => {
//         // peer.destroy(id => {
//         console.log(id);
//         socket.emit('disconnect', ROOM_ID, id);
//         // });

//     });
// });

peer.on('close', id => {
    // peer.destroy()
    socket.emit('disconnect', ROOM_ID, id);
});


socket.on('user-disconnected', userId => {

    videoGrid1.removeChild(document.getElementsByName('video'));

    console.log('user left')
});




function connectToNewUser(userId, stream) {
    console.log(`new user ${userId} connected`);
    const call = peer.call(userId, stream);
    const grid = videoGrid1;


    call.on('stream', userVideoStream => {
            console.log('user')
            if (!callList[call.peer]) {
                addVideoStream(grid, userVideoStream, `green`);
                callList[call.peer] = call;
            }
        },
        function(err) {
            console.log('Failed to get local stream', err);
        });

}

function addVideoStream(grid, stream, color) {
    const video = document.createElement('video');
    // video.setAttribute('muted', 'muted');
    video.srcObject = stream;
    if (grid === videoGrid2) {
        video.volume = 0;
    }
    video.style.border = `2px solid ${color}`;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    })
    grid.append(video);
}


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

let users = [];

socket.on('createMessage', (msg, userId, userName) => {

    let msgColor;
    let bgColor;

    if (users.length == 0) {
        let user = { id: userId, name: userName, color: 'white', bgColor: 'blue' };
        users.push(user);
        msgColor = user.color;
        bgColor = user.bgColor;
    } else if (users.length == 1 && users[0].id !== userId) {
        let user = { id: userId, name: userName, color: 'black', bgColor: 'grey' };
        users.push(user);
        msgColor = user.color;
        bgColor = user.bgColor;
    } else {
        if (users[0].id == userId) {
            msgColor = users[0].color;
            bgColor = users[0].bgColor;
        } else {
            msgColor = users[1].color;
            bgColor = users[1].bgColor;
        }
    }

    const date = new Date();
    const hour = date.getHours();
    const min = date.getMinutes();

    const message = document.createElement('div');
    message.classList.add('chat-box');
    message.style.backgroundColor = bgColor;
    message.style.color = msgColor;

    message.innerHTML = `
    <div class='d-flex flex-row justify-content-between' style='font-size:10px;'>
    <div>${userName}</div>
    <div>${hour}:${min}</div>
    </div>
    <div class="message">
    ${msg}
    </div>`;

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


function stopSharing() {
    videoGrid2.removeChild(videoGrid2.childNodes[1]);
    screenShare.classList.remove('screen-share-active');
}

function screenSharing() {

    screenShare.classList.add('screen-share-active');

    navigator.mediaDevices.getDisplayMedia({ video: true })
        .then(function(stream) {

            addVideoStream(videoGrid2, stream, 'blue');

            stream.getVideoTracks()[0].addEventListener('ended', () => {
                stopSharing();
            });
        });
}

// function uploadFile() {

// }

// const fileInput = document.getElementById('uploadedFile');
// fileInput.onchange = () => {
//     const selectedFile = fileInput.files[0];
//     console.log(selectedFile);
// }

var loadFile = function(event) {
    var image = document.getElementById('output');
    image.src = URL.createObjectURL(event.target.files[0]);
};