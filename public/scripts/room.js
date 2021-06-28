const videoGrid1 = document.getElementById('video-grid-1');
const videoGrid2 = document.getElementById('video-grid-2');
const participants = document.querySelector('.user-list ul');
const msgInput = document.getElementById('messageInput');
const chat = document.querySelector('.chat-list')

const audioOpt = document.getElementById('audioOption')
const videoOpt = document.getElementById('videoOption')

const screenShare = document.querySelector('#screen-share i');

const socket = io('/');
const peer = new Peer();
let myVideoStream;

const callList = [];
const users = [];

const gridOfVideos = [{
        height: '100%',
        width: '100%'
    },
    {
        height: '50%',
        width: '50%'
    },
    {
        height: '50%',
        width: '50%'
    },
    {
        height: '50%',
        width: '50%'
    },
    {
        height: '50%',
        width: '33.33%'
    },
    {
        height: '50%',
        width: '33.33%'
    },
    {
        height: '33.33%',
        width: '33.33%'
    },
    {
        height: '33.33%',
        width: '33.33%'
    },
    {
        height: '33.33%',
        width: '33.33%'
    }
];



let constraints = {
    audio: {
        echoCancellation: { exact: true },
        googEchoCancellation: { exact: true },
        googAutoGainControl: { exact: true },
        googNoiseSuppression: { exact: true },
    },
    video: { width: 1440, height: 720 },

};


peer.on('open', id => {

    let userName = prompt('Enter your name.');
    if (userName === null) {
        userName = `Guest`;
    }

    users.push({ id: id, name: userName });

    const list = document.createElement('li');
    list.innerText = userName;
    participants.appendChild(list);

    navigator.mediaDevices.getUserMedia(constraints)
        .then(function(stream) {
            myVideoStream = stream;
            socket.emit('join-room', ROOM_ID, id, userName);

            const grid = videoGrid2;
            addVideoStream(grid, myVideoStream, `white`, id);
        });
});

peer.on('call', call => {
    call.answer(myVideoStream);
    const grid = videoGrid1;

    call.on('stream', userVideoStream => {
            console.log('call')
            if (!callList[call.peer]) {
                console.log(call.peer);
                addVideoStream(grid, userVideoStream, `red`, call.peer);
                callList[call.peer] = call;
            }
        },
        function(err) {
            console.log('Failed to get local stream', err);
        });
});


socket.on('user-connected', (userId, userName) => {
    const list = document.createElement('li');
    list.innerText = userName;
    participants.appendChild(list);

    connectToNewUser(userId, userName, myVideoStream);

});

function connectToNewUser(userId, userName, stream) {
    console.log(`new user ${userId} connected`);
    const call = peer.call(userId, stream);
    const grid = videoGrid1;


    call.on('stream', userVideoStream => {
            console.log('user')
            if (!callList[call.peer]) {
                addVideoStream(grid, userVideoStream, `green`, call.peer);
                callList[call.peer] = call;
            }
        },
        function(err) {
            console.log('Failed to get local stream', err);
        });
}


socket.on('user-disconnected', (userId, userName) => {
    console.log(`${userName} left`);

    let index = 0;
    for (let i = 0; i < videoGrid1.length; i++) {
        let tempId = videoGrid1.childNodes[i].getAttribute('id');
        if (tempId === userId) {
            index = i;
            break;
        }
    }
    videoGrid1.removeChild(videoGrid1.childNodes[index]);
});








function addVideoStream(grid, stream, color, userId) {
    const video = document.createElement('video');
    // video.setAttribute('muted', 'muted');
    video.srcObject = stream;
    if (grid === videoGrid2) {
        video.volume = 0;
    } else {


    }
    video.setAttribute('id', `${userId}`)

    video.style.border = `2px solid ${color}`;

    video.addEventListener('loadedmetadata', () => {
        video.play();
    })
    grid.append(video);


}

function chatBox(msg, bgColor, color, align, userName) {
    const date = new Date();
    const hour = date.getHours();
    const min = date.getMinutes();

    const messageArea = document.createElement('div');
    messageArea.classList.add(`${align}`);

    const message = document.createElement('div');
    message.classList.add('chat-box');
    message.style.backgroundColor = bgColor;
    message.style.color = color;

    message.innerHTML = `
    <div class='d-flex flex-row justify-content-between' style='font-size:10px;'>
    <div>${userName}</div>
    <div>${hour}:${min}</div>
    </div>
    <div class="message">
    ${msg}
    </div>`;

    messageArea.appendChild(message)
    chat.appendChild(messageArea);

    chat.scrollTop = chat.scrollHeight;
}

// setInterval(function() {
//     chat.scrollTop = chat.scrollHeight;
// }, 100);


msgInput.addEventListener('keydown', function(e) {
    if (e.keyCode === 13) {
        sendMsg();
    }
});

function sendMsg() {
    const msg = msgInput.value;
    console.log(msg);

    chatBox(msg, '#7c84ec', 'white', 'end', 'Me');

    socket.emit('message', msg);
    msgInput.value = '';
}

socket.on('createMessage', (msg, userId, userName) => {

    chatBox(msg, '#4f58ca', 'white', 'start', userName);
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

let temp;

function stopSharing() {
    videoGrid2.removeChild(videoGrid2.childNodes[1]);
    screenShare.classList.remove('screen-share-active');
}

function screenSharing() {

    screenShare.classList.add('screen-share-active');

    navigator.mediaDevices.getDisplayMedia({ video: true })
        .then(function(stream) {

            temp = stream;
            console.log(temp);

            socket.emit('screen-share', peer.id);

            const id = `${peer.id}-screen`;
            addVideoStream(videoGrid2, stream, 'blue', id);

            stream.getVideoTracks()[0].addEventListener('ended', () => {
                stopSharing();
                //connectToNewUser(peer.id, myVideoStream)
            });
        });
}

socket.on('screen-sharing', userId => {
    console.log('sharing' + userId)
    console.log(temp);
    //connectToNewUser(userId, temp)
});

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

setInterval(function() {

    for (let i = 0; i < videoGrid1.childNodes.length; i++) {

        videoGrid1.childNodes[i].style.height = gridOfVideos[videoGrid1.childNodes.length - 1].height;
        videoGrid1.childNodes[i].style.width = gridOfVideos[videoGrid1.childNodes.length - 1].width;

    }
}, 1000);