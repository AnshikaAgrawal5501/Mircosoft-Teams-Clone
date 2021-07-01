const videoGrid1 = document.getElementById('video-grid-1');
const videoGrid2 = document.getElementById('video-grid-2');
const participants = document.querySelector('.user-list ul');
const msgInput = document.getElementById('messageInput');
const chat = document.querySelector('.chat-list');
const modal = document.getElementById('userData');

let fname, lname, email, phone, nname, flag = true;

const audioOpt = document.getElementById('audioOption');
const videoOpt = document.getElementById('videoOption');

const screenShare = document.querySelector('#screen-share i');

const socket = io('/');
const peer = new Peer();
let myVideoStream;

let callList = [];

const gridOfVideos = [{
        height: '98%',
        width: '98%'
    },
    {
        height: '48%',
        width: '48%'
    },
    {
        height: '48%',
        width: '48%'
    },
    {
        height: '48%',
        width: '48%'
    },
    {
        height: '48%',
        width: '31.33%'
    },
    {
        height: '48%',
        width: '31.33%'
    },
    {
        height: '31.33%',
        width: '31.33%'
    },
    {
        height: '31.33%',
        width: '31.33%'
    },
    { //9
        height: '31.33%',
        width: '31.33%'
    },
    {
        height: '23%',
        width: '31.33%'
    },
    {
        height: '23%',
        width: '31.33%'
    },
    {
        height: '31.33%',
        width: '23%'
    },
    {
        height: '23%',
        width: '23%'
    },
    {
        height: '23%',
        width: '23%'
    },
    {
        height: '23%',
        width: '23%'
    },
    {
        height: '23%',
        width: '23%'
    },
    {
        height: '18%',
        width: '23%'
    },
    {
        height: '18%',
        width: '23%'
    },
];

// const gridOfVideos = [{
//         height: '100%',
//         width: '100%'
//     },
//     {
//         height: '50%',
//         width: '50%'
//     },
//     {
//         height: '50%',
//         width: '50%'
//     },
//     {
//         height: '50%',
//         width: '50%'
//     },
//     {
//         height: '50%',
//         width: '33.33%'
//     },
//     {
//         height: '50%',
//         width: '33.33%'
//     },
//     {
//         height: '33.33%',
//         width: '33.33%'
//     },
//     {
//         height: '33.33%',
//         width: '33.33%'
//     },
//     { //9
//         height: '33.33%',
//         width: '33.33%'
//     },
//     {
//         height: '25%',
//         width: '33.33%'
//     },
//     {
//         height: '25%',
//         width: '33.33%'
//     },
//     {
//         height: '33.33%',
//         width: '25%'
//     },
//     {
//         height: '25%',
//         width: '25%'
//     },
//     {
//         height: '25%',
//         width: '25%'
//     },
//     {
//         height: '25%',
//         width: '25%'
//     },
//     {
//         height: '25%',
//         width: '25%'
//     },
//     {
//         height: '20%',
//         width: '25%'
//     },
//     {
//         height: '20%',
//         width: '25%'
//     },
// ];


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


peer.on('open', id => {

    console.log(USER_NAME);
    createListElement(USER_NAME, USER_FNAME, USER_LNAME, USER_EMAIL, USER_PHONE);

    navigator.mediaDevices.getUserMedia(constraints)
        .then(function(stream) {
            myVideoStream = stream;
            socket.emit('join-room', ROOM_ID, id, USER_NAME);
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

function popoverActivate() {
    $('[data-toggle="popover"]').popover();
}

function createListElement(userName, fname, lname, email, phone) {
    const list = document.createElement('li');

    list.innerHTML = `
    <a href="#" class="pops" title="${fname} ${lname}" data-toggle="popover" 
    data-placement="bottom" data-trigger="hover" data-content="Email: ${email} 
    Contact no. : ${phone}" onclick="popoverActivate()">
    ${userName}
    </a>
    `;

    participants.appendChild(list);
}

function createParticipantList(users) {
    participants.innerHTML = '';

    for (let i = 0; i < users.length; i++) {
        createListElement(users[i].nname, users[i].fname, users[i].lname, users[i].email, users[i].phone);
    }
}

socket.on('user-connected', (userId, userName, users) => {

    createParticipantList(users)
    connectToNewUser(userId, myVideoStream, users);

});

function connectToNewUser(userId, stream, users, flag = false) {

    console.log(`new user ${userId} connected`);
    const call = peer.call(userId, stream);
    const grid = videoGrid1;


    call.on('stream', userVideoStream => {

            if (!callList[call.peer]) {
                console.log("user", userVideoStream);

                if (!flag) {
                    addVideoStream(grid, userVideoStream, `green`, call.peer);
                } else {
                    removeVideo(`ca${userId}`);
                }
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

function removeVideo(userId) {
    let index = 0;
    for (let i = 0; i < videoGrid1.childNodes.length; i++) {
        let tempId = videoGrid1.childNodes[i].getAttribute('id');
        if (tempId === userId) {
            index = i;
        } else {
            videoGrid1.childNodes[i].style.display = 'block';
        }
    }
    videoGrid1.removeChild(videoGrid1.childNodes[index]);

    gridCheck();
}

socket.on('user-disconnected', (userId, userName, users) => {
    console.log(`${userName} left`);

    createParticipantList(users)

    removeVideo(`c${userId}`);
    removeVideo(`ca${userId}`)

    // let index = 0;
    // for (let i = 0; i < videoGrid1.childNodes.length; i++) {
    //     let tempId = videoGrid1.childNodes[i].getAttribute('id');
    //     if (tempId === `c${userId}`) {
    //         index = i;
    //         break;
    //     }
    // }
    // videoGrid1.removeChild(videoGrid1.childNodes[index]);

    // index = 0;
    // for (let i = 0; i < videoGrid1.childNodes.length; i++) {
    //     let tempId = videoGrid1.childNodes[i].getAttribute('id');
    //     if (tempId === `ca${userId}`) {
    //         index = i;
    //         break;
    //     }
    // }
    // videoGrid1.removeChild(videoGrid1.childNodes[index]);

    // gridCheck();
});


function addVideoStream(grid, stream, color, userId) {

    const video = document.createElement('video');
    video.srcObject = stream;

    video.addEventListener('loadedmetadata', () => {
        video.play();
    })

    // video.style.border = `2px solid ${color}`;
    // video.style.border = `2px solid #ff4151`;

    if (grid === videoGrid2) {

        video.volume = 0;
        video.setAttribute('id', `${userId}`);
        grid.append(video);
    } else {

        const div = document.createElement('div');
        div.setAttribute('id', `c${userId}`);
        div.classList.add('box-position');
        // div.style.borderRadius = `10px`;
        // div.style.border = `2px solid #ff4151`;

        div.innerHTML = `<div style="position: absolute; right: 10px; z-index: 2;" id="${userId}" onclick="resize(id)">
        <i class="fas fa-expand"></i>
        </div>`;

        let index;
        for (let i = 0; i < grid.childNodes.length; i++) {
            let tempId = grid.childNodes[i].getAttribute('id');
            if (tempId === `c${userId}`) {
                index = i;
                break;
            }
        }
        console.log(index)

        if (index !== undefined) {

            if (color === 'green') {
                div.setAttribute('id', `ca${userId}`);
                div.childNodes[0].setAttribute('id', `a${userId}`);
                div.appendChild(video);
                grid.append(div);
            }
        } else {
            div.appendChild(video);
            grid.append(div);
        }
    }

    gridCheck();
}

function resize(e) {
    console.log(e)
    for (let i = 0; i < videoGrid1.childNodes.length; i++) {
        let tempId = videoGrid1.childNodes[i].getAttribute('id');
        if (tempId !== `c${e}`) {
            videoGrid1.childNodes[i].style.display = 'none';
        }
    }
    const fs = document.getElementById(e);
    fs.style.display = 'none';
    const box = document.getElementById(`c${e}`);

    box.classList.add('resize');

    const div = document.createElement('div');
    div.innerHTML = '<i class="fas fa-compress"></i>';
    div.style.position = 'absolute';
    div.style.left = '10px';
    div.style.top = '0';
    div.style.zIndex = '2';

    div.setAttribute('onclick', `back('${e}')`);

    box.appendChild(div);
}

function back(e) {
    console.log(e);

    for (let i = 0; i < videoGrid1.childNodes.length; i++) {
        let tempId = videoGrid1.childNodes[i].getAttribute('id');
        if (tempId !== `c${e}`) {
            videoGrid1.childNodes[i].style.display = 'flex';
        }
    }

    const fs = document.getElementById(e);
    fs.style.display = 'block';

    const box = document.getElementById(`c${e}`);

    box.classList.remove('resize');
    console.log(box, box.childNodes);
    box.removeChild(box.childNodes[2]);

    gridCheck();
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
    // console.log(msg);

    if (msg.length > 0) {
        chatBox(msg, '#7c84ec', 'end', 'Me');

        socket.emit('message', msg);
        msgInput.value = '';
    }
}

socket.on('createMessage', (msg, userId, userName) => {

    if (!document.getElementById('chat').classList.contains('active')) {
        document.getElementById('chat-noti').innerHTML = '<i class="fas fa-dot-circle"></i>';
    }

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

    // connectToNewUser(userId, myVideoStream, users);
    connectToNewUser(userId, myVideoStream, users);
});

socket.on('stop-screen-sharing', (userId, users) => {
    console.log('stop-sharing' + userId)

    connectToNewUser(userId, myVideoStream, users, true);
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
/////////////////////////////////   Grid-check   ////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////


function gridCheck() {

    for (let i = 0; i < videoGrid1.childNodes.length; i++) {

        videoGrid1.childNodes[i].style.height = gridOfVideos[videoGrid1.childNodes.length - 1].height;
        videoGrid1.childNodes[i].style.width = gridOfVideos[videoGrid1.childNodes.length - 1].width;

    }
}

function notifications() {
    if (document.getElementById('chat').classList.contains('active')) {
        document.getElementById('chat-noti').innerHTML = '';
    }
}

setInterval(function() {
    // gridCheck();
    notifications();
}, 100);