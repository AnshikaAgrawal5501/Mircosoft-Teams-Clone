import { socket, peer, myVideoStream } from './script_room.js';

const audioOpt = document.getElementById('audioOption')
const videoOpt = document.getElementById('videoOption')

const setMuteButton = () => {
    const html = `<i class="fas fa-microphone nav-link"></i>`
    audioOpt.innerHTML = html;
}

const setUnmuteButton = () => {
    const html = `<i class="fas fa-microphone-slash nav-link"></i>`
    audioOpt.innerHTML = html;
}

const muteUnmute = () => {
    console.log(myVideoStream.getAudioTracks()[0])
    const enabled = data.myVideoStream.getAudioTracks()[0].enabled;
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

////////////////////////////////////////////////////////////////////////////////////////////


function toggleVideoBtnDisabled(disabled) {
    document.getElementById('toggle-video').disabled = disabled;
}


function maximiseStream(e) {
    let elem = e.target.parentElement.previousElementSibling;

    elem.requestFullscreen() || elem.mozRequestFullScreen() || elem.webkitRequestFullscreen() || elem.msRequestFullscreen();
}


function singleStreamToggleMute(e) {
    if (e.target.classList.contains('fa-microphone')) {
        e.target.parentElement.previousElementSibling.muted = true;
        e.target.classList.add('fa-microphone-slash');
        e.target.classList.remove('fa-microphone');
    } else {
        e.target.parentElement.previousElementSibling.muted = false;
        e.target.classList.add('fa-microphone');
        e.target.classList.remove('fa-microphone-slash');
    }
}



document.getElementById('toggle-video').addEventListener('click', (e) => {
    e.preventDefault();

    let elem = document.getElementById('toggle-video');

    if (myStream.getVideoTracks()[0].enabled) {
        e.target.classList.remove('fa-video');
        e.target.classList.add('fa-video-slash');
        elem.setAttribute('title', 'Show Video');

        myStream.getVideoTracks()[0].enabled = false;
    } else {
        e.target.classList.remove('fa-video-slash');
        e.target.classList.add('fa-video');
        elem.setAttribute('title', 'Hide Video');

        myStream.getVideoTracks()[0].enabled = true;
    }

    broadcastNewTracks(myStream, 'video');
});


//When the mute icon is clicked
document.getElementById('toggle-mute').addEventListener('click', (e) => {
    e.preventDefault();

    let elem = document.getElementById('toggle-mute');

    if (myStream.getAudioTracks()[0].enabled) {
        e.target.classList.remove('fa-microphone-alt');
        e.target.classList.add('fa-microphone-alt-slash');
        elem.setAttribute('title', 'Unmute');

        myStream.getAudioTracks()[0].enabled = false;
    } else {
        e.target.classList.remove('fa-microphone-alt-slash');
        e.target.classList.add('fa-microphone-alt');
        elem.setAttribute('title', 'Mute');

        myStream.getAudioTracks()[0].enabled = true;
    }

    broadcastNewTracks(myStream, 'audio');
});

function broadcastNewTracks(stream, type, mirrorMode = true) {
    setLocalStream(stream, mirrorMode);

    let track = type == 'audio' ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];

    for (let p in pc) {
        let pName = pc[p];

        if (typeof pc[pName] == 'object') {
            replaceTrack(track, pc[pName]);
        }
    }
}

function setLocalStream(stream, mirrorMode = true) {
    const localVidElem = document.getElementById('local');

    localVidElem.srcObject = stream;
    mirrorMode ? localVidElem.classList.add('mirror-mode') : localVidElem.classList.remove('mirror-mode');
}

function replaceTrack(stream, recipientPeer) {
    let sender = recipientPeer.getSenders ? recipientPeer.getSenders().find(s => s.track && s.track.kind === stream.kind) : false;

    sender ? sender.replaceTrack(stream) : '';
}