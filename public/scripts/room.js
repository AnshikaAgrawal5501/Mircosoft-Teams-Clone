const videoGrid1 = document.getElementById('video-grid-1');
const videoGrid2 = document.getElementById('video-grid-2');

const participants = document.querySelector('.user-list ul');

const chat = document.querySelector('.chat-list');
const message = document.getElementsByClassName('emojionearea-editor')

const audioOpt = document.getElementById('audioOption');
const videoOpt = document.getElementById('videoOption');

const screenShare = document.querySelector('#screen-share i');

const socket = io('/');
const peer = new Peer();

let myVideoStream;
let callList = [];

let isWhiteBoard = false;

// --------------     Dimensions as per the count of videos present in the grid        ---------------

// Maximum capacity is 10 people at one time

// own video is displayed below 
// (1st:video, 2nd:screen-share)

// others videos are displayed above 
// (total 18 videos can come 9:videos, 9:screen-shares)

const gridOfVideos = [{ //1
        height: '100%',
        width: '100%'
    },
    { //2
        height: '50%',
        width: '50%'
    },
    { //3
        height: '50%',
        width: '50%'
    },
    { //4
        height: '50%',
        width: '50%'
    },
    { //5
        height: '50%',
        width: '33.33%'
    },
    { //6
        height: '50%',
        width: '33.33%'
    },
    { //7
        height: '33.33%',
        width: '33.33%'
    },
    { //8
        height: '33.33%',
        width: '33.33%'
    },
    { //9
        height: '33.33%',
        width: '33.33%'
    },
    { //10
        height: '25%',
        width: '33.33%'
    },
    { //11
        height: '25%',
        width: '33.33%'
    },
    { //12
        height: '33.33%',
        width: '25%'
    },
    { //13
        height: '25%',
        width: '25%'
    },
    { //14
        height: '25%',
        width: '25%'
    },
    { //15
        height: '25%',
        width: '25%'
    },
    { //16
        height: '25%',
        width: '25%'
    },
    { //17
        height: '20%',
        width: '25%'
    },
    { //18
        height: '20%',
        width: '25%'
    },
];


/*==============================================================================================
=======================================    Calling   ===========================================
================================================================================================
*/


let constraints = {
    audio: {
        echoCancellation: { exact: true },
        googEchoCancellation: { exact: true },
        googAutoGainControl: { exact: true },
        googNoiseSuppression: { exact: true },
    },
    video: { width: 1440, height: 720 },

};

// ---------------------------      Peer joining a meeting        ----------------------------

peer.on('open', id => {

    sound('join');

    console.log(USER_NAME);

    // as soon as enter in the meeting see our name 
    createListElement(USER_NAME, USER_FNAME, USER_LNAME, USER_EMAIL, USER_PHONE);

    navigator.mediaDevices.getUserMedia(constraints)
        .then(function(stream) {

            myVideoStream = stream;

            // informing other users that someone entered
            socket.emit('join-room', ROOM_ID, id, USER_NAME);
            console.log("peer on", myVideoStream);

            const grid = videoGrid2;
            addVideoStream(grid, myVideoStream, `white`, id);
            // white color is taken for example to check that peer's own video is visible in below grid only.
        });
});

// ---------------------------      Peer calling the new user connected      ----------------------------

socket.on('user-connected', (userId, userName, users) => {

    sound('join')

    // recreate participant list as soon as someone got connected
    createParticipantList(users)

    connectToNewUser(userId, myVideoStream, users);
});

function connectToNewUser(userId, stream, users, flag = false) {

    // flag:false -> normal video
    // flag:true -> removal of screen share

    console.log(`new user ${userId} connected`);

    // Example user B just connected then user A will call to B
    // send its own stream to B

    const call = peer.call(userId, stream);
    const grid = videoGrid1;


    call.on('stream', userVideoStream => {

            // this stream is coming as an answer from user B (green : user B on user A's screen)

            if (!callList[call.peer]) {
                console.log("user", userVideoStream);

                if (!flag) {
                    addVideoStream(grid, userVideoStream, `green`, call.peer);
                    // green color is taken for example to check that correct incoming video is visible in above grid .

                } else {
                    // case of stop screen-share
                    // user B has stopped sharing so video remove from user A's screen
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

        // sending newly connected peer the participants list
        conn.send(users);
    });
}

// ---------------------------      Peer(new user) answering a call        ----------------------------

peer.on('call', call => {

    // user A called to B then user B answers the call and send its stream

    call.answer(myVideoStream);
    const grid = videoGrid1;

    console.log("answer", myVideoStream);

    call.on('stream', userVideoStream => {

            // this stream is coming from user A when it calls (red : user A on user B's screen)

            if (!callList[call.peer]) {
                console.log(call.peer);
                console.log("call", userVideoStream);
                addVideoStream(grid, userVideoStream, `red`, call.peer);
                // red color is taken for example to check that correct incoming video is visible in above grid .

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

        // getting the participant list of already present users and then creating for own
        createParticipantList(users);
    });
});

// ---------------------------      User disconnection        ----------------------------

function leave() {
    sound('leave');

    setTimeout(function() {
        window.location.href = '/'; // move back to home on pressing leave button
    }, 1500);
}

socket.on('user-disconnected', (userId, userName, users) => {
    console.log(`${userName} left`);
    sound('disconnect');

    // recreate the participant list when some got disconnected
    createParticipantList(users)

    removeVideo(`c${userId}`); // normal video removal of disconnected user
    removeVideo(`ca${userId}`); // shared screen removal if present of the disconnected user

});

// ---------------------------      Creating Participant list        ----------------------------

function popoverActivate() {

    // by clicking on the name in the participant list
    // user info will be visible

    $('[data-toggle="popover"]').popover({
        html: true,
        sanitize: false,
    })
}

function createListElement(userName, fname, lname, email, phone) {
    const list = document.createElement('li');

    list.innerHTML = `
    <a href="#" class="pops" title="${fname} ${lname}" data-toggle="popover" 
    data-placement="bottom" data-html="true" data-trigger="hover" data-content="Email: ${email}<br>
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

// ---------------------------      Removing videos from grid        ----------------------------

function removeVideo(userId) {
    let index = 0;

    for (let i = 0; i < videoGrid1.childNodes.length; i++) {
        let tempId = videoGrid1.childNodes[i].getAttribute('id');

        if (tempId === userId) {
            index = i;
            videoGrid1.removeChild(videoGrid1.childNodes[index]);
            i--;
        } else {

            // is white board is in action then let other videos hidden

            if (!isWhiteBoard) {
                videoGrid1.childNodes[i].style.display = 'block';
            }
        }
    }

    gridCheck();
}

// ---------------------------      Adding videos to grid        ----------------------------

function addVideoStream(grid, stream, color, userId) {

    const video = document.createElement('video');
    video.srcObject = stream;

    video.addEventListener('loadedmetadata', () => {
        video.play();
    });

    if (grid === videoGrid2) {

        // -----------------     peer's own video    -----------------

        video.volume = 0;
        video.setAttribute('id', `${userId}`);
        grid.append(video);

    } else {

        // -----------------     other user's video    -----------------

        const div = document.createElement('div');
        div.style.padding = '5px';

        const div1 = document.createElement('div');

        // id is given as " c + userId " so that while resizing and compressing we can access the correct division

        div.setAttribute('id', `c${userId}`);
        div1.classList.add('box-position');

        // creating the resize icon
        // id is given as userId so that we can later access the correct video while removing from grid.

        div1.innerHTML = `<div style="position: absolute; right: 10px; z-index: 2; color:rgb(255,255,255,0.5);" id="${userId}" onclick="resize(id)">
        <i class="fas fa-expand"></i>
        </div>`;

        // this working comes in the case of screen-sharing.
        // suppose a screen-share video comes it will have same userId and so same c+userId
        // therefore there will be a clash between users video and screen-share
        // here we check if the video with same userId is present that means 
        // here we are dealing with screen-share

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

            // index is not undefined means the case of screen-share

            if (color === 'green') {

                // when user B enters its video will go to user A
                // and user A sends its video back to B
                // but in screen-share we only want user B screen-share to go to A
                // and no video coming from user A back to B

                div.setAttribute('id', `ca${userId}`);
                div1.childNodes[0].setAttribute('id', `a${userId}`);
                div.appendChild(div1);
                div1.appendChild(video);
                grid.append(div);
            }
        } else {

            // index is undefined means a new user's video has come therefore display it

            div.appendChild(div1);
            div1.appendChild(video);
            grid.append(div);
        }

        // in case white board is in action and a new video appears then it will disturb the grid
        // since when white board is in action it will be in full screen mode and other videos are hidden
        // so we make this video also as hidden.

        if (isWhiteBoard) {
            div.style.display = 'none';
        }
    }

    gridCheck();
}

// -------------------      Select a video to view on full screen        -------------------

function resize(e) {
    console.log(e)

    // make other videos as hidden

    for (let i = 0; i < videoGrid1.childNodes.length; i++) {
        let tempId = videoGrid1.childNodes[i].getAttribute('id');
        if (tempId !== `c${e}`) {
            videoGrid1.childNodes[i].style.display = 'none';
        }
    }

    // fs is the resize icon
    const fs = document.getElementById(e);
    fs.style.display = 'none';
    const box = document.getElementById(`c${e}`);

    box.classList.add('resize'); // will make the height and width 100%

    // creating the compress icon
    const div = document.createElement('div');
    div.innerHTML = '<i class="fas fa-compress"></i>';
    div.classList.add('compress');

    div.setAttribute('onclick', `back('${e}')`);

    box.childNodes[0].appendChild(div);
}

// ---------------------------      Exit full screen        ----------------------------

function back(e) {
    console.log(e);

    // making all the videos back to flex/block
    for (let i = 0; i < videoGrid1.childNodes.length; i++) {
        let tempId = videoGrid1.childNodes[i].getAttribute('id');
        if (tempId !== `c${e}`) {
            videoGrid1.childNodes[i].style.display = 'flex';
        }
    }

    const fs = document.getElementById(e);
    fs.style.display = 'block';

    const box = document.getElementById(`c${e}`);

    box.classList.remove('resize'); // getting back to original height
    console.log(box, box.childNodes);
    box.childNodes[0].removeChild(box.childNodes[0].childNodes[2]); // removing the compress icon

    gridCheck();
}


/*==============================================================================================
=======================================    Chatting   ===========================================
================================================================================================
*/


// ---------------------------      creating a message box        ----------------------------

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

// ---------------------------      user pressing enter        ----------------------------

$('#messageInput').emojioneArea({
    pickerPosition: 'top',

    events: {
        keydown: function(editor, event) {
            if (event.keyCode === 13) {
                sendMsg();
            }
        }
    }
});

function sendMsg() {
    const msg = message[0].innerHTML;
    message[0].innerHTML = '';

    if (msg.length > 0) {
        chatBox(msg, '#7c84ec', 'end', 'Me');

        socket.emit('message', msg);
    }
}

socket.on('createMessage', (msg, userId, userName) => {

    // ----------------      chat notifications on if user is not active on chat        -------------

    if (!document.getElementById('chat').classList.contains('active')) {
        document.getElementById('chat-noti').innerHTML = '•';
    }

    chatBox(msg, '#4f58ca', 'start', userName);

    sound('message');
});


/*==============================================================================================
===================================    Audio-Video mute   ======================================
================================================================================================
*/


// ---------------------------      Audio mute/unmute        ----------------------------

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

// --------------------------------      Video on/off        -------------------------------

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


/*==============================================================================================
====================================    Screen-sharing   =======================================
================================================================================================
*/


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

    connectToNewUser(userId, myVideoStream, users, true);
});


/*==============================================================================================
=======================================   Grid-check   =========================================
================================================================================================
*/


// -------     each time a video is added or removed from the grid, dimensions are adjusted        --------

function gridCheck() {

    for (let i = 0; i < videoGrid1.childNodes.length; i++) {

        videoGrid1.childNodes[i].style.height = gridOfVideos[videoGrid1.childNodes.length - 1].height;
        videoGrid1.childNodes[i].style.width = gridOfVideos[videoGrid1.childNodes.length - 1].width;

    }
}


/*==============================================================================================
=====================================   Notifications   ========================================
================================================================================================
*/


// ----------------      chat notifications off if user is active on chat        -------------

function notifications() {
    if (document.getElementById('chat').classList.contains('active')) {
        document.getElementById('chat-noti').innerHTML = '';
    }
}

function sound(sound) {
    const audio = new Audio(`/sounds/${sound}.mp3`);
    audio.play();
}

setInterval(function() {
    notifications();
}, 100);


/*==============================================================================================
======================================   White-board   =========================================
================================================================================================
*/


let pencilColor = 'black';
let pencilWidth = 5;

// ---------------------------      creating a white board        ----------------------------

function whiteBoard() {

    isWhiteBoard = true;

    const div = document.createElement('div');
    div.style.padding = '5px';
    div.setAttribute('id', 'canvas');

    const div1 = document.createElement('div');
    div1.classList.add('box-position');


    div1.innerHTML = `<div class="white-board-icons" style="" id="" onclick="cross()">
    <i class="fas fa-times"></i>
        </div>
        <div class="white-board-icons" style="top:50px;" id="" onclick="pencil()">
        <i class="fas fa-pencil-alt"></i>
        </div>
        <div class="white-board-icons" style="top:100px;" id="" onclick="eraser()">
        <i class="fas fa-eraser"></i>
        </div>
        <div class="white-board-icons colour" style="top:150px; background-color:red;" id="" onclick="red()">
        </div>
        <div class="white-board-icons colour" style="top:200px; background-color:green;" id="" onclick="green()">
        </div>
        <div class="white-board-icons colour" style="top:250px; background-color:blue;" id="" onclick="blue()">
        </div>
        <div class="white-board-icons colour" style="top:300px; background-color:yellow;" id="" onclick="yellow()">
        </div>`;

    const canvas = document.createElement('canvas');

    div1.appendChild(canvas);
    div.appendChild(div1);

    for (let i = 0; i < videoGrid1.childNodes.length; i++) {
        videoGrid1.childNodes[i].style.display = 'none';
    }

    div.classList.add('resize');

    videoGrid1.appendChild(div);


    const ctx = canvas.getContext('2d');

    let painting = false;
    let lastX = 0;
    let lastY = 0;

    canvas.style.width = '100%';
    canvas.style.height = '100%';

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';


    console.log(ctx)

    function startPosition(e) {
        painting = true;
        lastX = e.offsetX;
        lastY = e.offsetY;
    }

    function finishPosition(e) {
        painting = false;
    }

    // drawing the design and sending the coordinates, pencil-color and pencil-width immediately to other users.

    function draw(e) {

        if (!painting) return;

        ctx.strokeStyle = pencilColor;
        ctx.lineWidth = pencilWidth;

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);

        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();

        socket.emit('draw', lastX, lastY, e.offsetX, e.offsetY, pencilColor, pencilWidth);

        lastX = e.offsetX;
        lastY = e.offsetY;
    }

    canvas.addEventListener('mousedown', startPosition);
    canvas.addEventListener('mouseup', finishPosition);
    canvas.addEventListener('mouseout', finishPosition);
    canvas.addEventListener('mousemove', draw);
}

// --------------------     other users getting coordinates via socket        ---------------------

socket.on('drawing', (lastX, lastY, offsetX, offsetY, pencilColor, pencilWidth) => {

    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext('2d');

    ctx.strokeStyle = pencilColor;
    ctx.lineWidth = pencilWidth;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);

    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
});

// ----------------      remove the white board and make all videos visible        -----------------

function cross() {
    isWhiteBoard = false;

    console.log(videoGrid1.childNodes)

    for (let i = 0; i < videoGrid1.childNodes.length; i++) {
        const tempId = videoGrid1.childNodes[i].getAttribute('id');
        console.log(videoGrid1.childNodes[i])
        if (tempId !== 'canvas') {
            videoGrid1.childNodes[i].style.display = 'block';
        } else {
            videoGrid1.removeChild(videoGrid1.childNodes[i]);
            i--;
        }
    }

    gridCheck();
}

// ---------------------------      use pencil        ----------------------------

function pencil() {
    pencilColor = 'black';
    pencilWidth = 5;
}

function red() {
    pencilColor = 'red';
    pencilWidth = 5;
}

function green() {
    pencilColor = 'green';
    pencilWidth = 5;
}

function blue() {
    pencilColor = 'blue';
    pencilWidth = 5;
}

function yellow() {
    pencilColor = 'yellow';
    pencilWidth = 5;
}

// ---------------------------     use eraser        ----------------------------

function eraser() {
    pencilColor = 'white';
    pencilWidth = 10;
}