const videoGrid1 = document.getElementById('video-grid-1');
const videoGrid2 = document.getElementById('video-grid-2');
const participants = document.querySelector('.user-list ul');
const msgInput = document.getElementById('messageInput');
const chat = document.querySelector('.chat-list');
const modal = document.getElementById('userData');

let fname, lname, email, phone, nname, flag = true;

const audioOpt = document.getElementById('audioOption')
const videoOpt = document.getElementById('videoOption')

const screenShare = document.querySelector('#screen-share i');

const socket = io('/');
const peer = new Peer();
let myVideoStream;

let callList = [];

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


/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////   calling    //////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////


let constraints = {
    audio: {
        echoCancellation: { exact: true },
        googEchoCancellation: { exact: true },
        googAutoGainControl: { exact: true },
        googNoiseSuppression: { exact: true },
    },
    video: { width: 1440, height: 720 },

};



// function submitUserInfo() {
//     fname = document.getElementById('fname').value;
//     lname = document.getElementById('lname').value;
//     email = document.getElementById('email').value;
//     phone = document.getElementById('phone').value;
//     nname = document.getElementById('nname').value;

//     console.log(modal, fname, lname, email, phone, nname);
//     flag = false;
// }

// function modalOpen() {
//     const myModal = new bootstrap.Modal(modal, { keyboard: false });
//     myModal.show();

//     while ($(modal).hasClass('show')) {
//         console.log('df');
//     }

//     return;
// }


peer.on('open', id => {

    // modalOpen();



    let userName = prompt('Enter your name.');
    if (userName === null) {
        userName = `Guest`;
    }

    // console.log(modal, fname, lname, email, phone, nname);

    createListElement(userName);

    navigator.mediaDevices.getUserMedia(constraints)
        .then(function(stream) {
            myVideoStream = stream;
            socket.emit('join-room', ROOM_ID, id, userName);
            console.log("peer on", myVideoStream);

            const grid = videoGrid2;
            addVideoStream(grid, myVideoStream, `white`, id);
        });
});

peer.on('call', call => {
    call.answer(myVideoStream);
    const grid = videoGrid1;

    console.log("answer", myVideoStream);

    call.on('stream', userVideoStream => {

            if (!callList[call.peer]) {
                console.log(call.peer);
                console.log("call", userVideoStream);
                addVideoStream(grid, userVideoStream, `red`, call.peer);
                callList[call.peer] = call;
            }
        },
        function(err) {
            console.log('Failed to get local stream', err);
        });

    callList = [];
});

peer.on('connection', function(conn) {
    conn.on('data', function(users) {
        createParticipantList(users);
    });
});

function createListElement(userName) {
    const list = document.createElement('li');
    list.innerText = userName;
    participants.appendChild(list);
}

function createParticipantList(users) {
    participants.innerHTML = '';

    for (let i = 0; i < users.length; i++) {
        createListElement(users[i].name);
    }
}

socket.on('user-connected', (userId, userName, users) => {

    createParticipantList(users)
    connectToNewUser(userId, myVideoStream, users);

});

function connectToNewUser(userId, stream, users) {

    // if (flag) {
    //     console.log('abc', stream)
    // }
    console.log(`new user ${userId} connected`);
    const call = peer.call(userId, stream);
    const grid = videoGrid1;


    call.on('stream', userVideoStream => {

            if (!callList[call.peer]) {
                console.log("user", userVideoStream);
                addVideoStream(grid, userVideoStream, `green`, call.peer);
                callList[call.peer] = call;
            }
        },
        function(err) {
            console.log('Failed to get local stream', err);
        });


    callList = [];

    const conn = peer.connect(userId);
    conn.on('open', function() {
        conn.send(users);
    });
}


socket.on('user-disconnected', (userId, userName, users) => {
    console.log(`${userName} left`);

    participants.innerHTML = '';

    for (let i = 0; i < users.length; i++) {
        const list = document.createElement('li');
        list.innerText = users[i].name;
        participants.appendChild(list);
    }

    let index = 0;
    for (let i = 0; i < videoGrid1.childNodes.length; i++) {
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

    video.srcObject = stream;
    video.style.border = `2px solid ${color}`;

    video.addEventListener('loadedmetadata', () => {
        video.play();
    })

    if (grid === videoGrid2) {
        video.volume = 0;
        video.setAttribute('id', `${userId}`);
        grid.append(video);
    } else {

        let index;
        for (let i = 0; i < grid.childNodes.length; i++) {
            let tempId = grid.childNodes[i].getAttribute('id');
            if (tempId === userId) {
                index = i;
                break;
            }
        }
        console.log(index)

        if (index !== undefined) {
            grid.removeChild(grid.childNodes[index]);
            video.setAttribute('id', `${userId}`);
            grid.insertBefore(video, grid.childNodes[index]);
        } else {
            video.setAttribute('id', `${userId}`);
            grid.append(video);
        }
    }
}


/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////   chatting   //////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////



function chatBox(msg, bgColor, align, userName) {
    const date = new Date();
    const hour = date.getHours();
    const min = date.getMinutes();

    const messageArea = document.createElement('div');
    messageArea.classList.add(`${align}`);

    const message = document.createElement('div');
    message.classList.add('chat-box');
    message.style.backgroundColor = bgColor;
    message.style.color = 'white';

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


msgInput.addEventListener('keydown', function(e) {
    if (e.keyCode === 13) {
        sendMsg();
    }
});

function sendMsg() {
    const msg = msgInput.value;
    console.log(msg);

    chatBox(msg, '#7c84ec', 'end', 'Me');

    socket.emit('message', msg);
    msgInput.value = '';
}

socket.on('createMessage', (msg, userId, userName) => {

    chatBox(msg, '#4f58ca', 'start', userName);
});



/////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////   audio-video mute   /////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////




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



/////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////   screen-sharing   //////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////




let temp;

function stopSharing() {
    console.log('stop-sharing', myVideoStream);

    videoGrid2.removeChild(videoGrid2.childNodes[1]);
    screenShare.classList.remove('screen-share-active');

    socket.emit('stop-screen-share', peer.id);
}

function screenSharing() {

    screenShare.classList.add('screen-share-active');

    navigator.mediaDevices.getDisplayMedia({ video: true })
        .then(function(stream) {

            console.log("screen before", myVideoStream);

            temp = myVideoStream;
            myVideoStream = stream;

            console.log("screen after", myVideoStream);

            socket.emit('screen-share', peer.id);

            addVideoStream(videoGrid2, stream, 'blue', peer.id);

            stream.getVideoTracks()[0].addEventListener('ended', () => {
                myVideoStream = temp;

                stopSharing();
            });
        });

}

socket.on('screen-sharing', (userId, users) => {
    console.log('sharing' + userId)

    connectToNewUser(userId, myVideoStream, users);
});

socket.on('stop-screen-sharing', (userId, users) => {
    console.log('stop-sharing' + userId)

    connectToNewUser(userId, myVideoStream, users);
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




/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////   Grid-check   //////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////




setInterval(function() {

    for (let i = 0; i < videoGrid1.childNodes.length; i++) {

        videoGrid1.childNodes[i].style.height = gridOfVideos[videoGrid1.childNodes.length - 1].height;
        videoGrid1.childNodes[i].style.width = gridOfVideos[videoGrid1.childNodes.length - 1].width;

    }
}, 1000);


// window.addEventListener('load', function() {
//     console.log('modal')
//     const myModal = new bootstrap.Modal(modal, { keyboard: false });
//     myModal.show();
// });