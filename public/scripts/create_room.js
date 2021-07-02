const cid = document.getElementById('copyId');
const curl = document.getElementById('copyUrl');
const copyText = document.getElementById("roomId");

cid.addEventListener('click', copyId);
curl.addEventListener('click', copyUrl);

function copyId() {

    console.log(copyText.value)
    copyText.select();
    copyText.setSelectionRange(0, 99999)
    document.execCommand("copy");
}

function copyUrl() {

    copyText.value = `http://microsoft-teams-clone-5501.herokuapp.com/room/${copyText.value}`;

    console.log(copyText.value);

    copyText.select();
    copyText.setSelectionRange(0, 99999)
    document.execCommand("copy");
}