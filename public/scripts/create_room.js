const cid = document.getElementById('copyId');
const curl = document.getElementById('copyUrl');
const copyText = document.getElementById("roomId");
const id = document.getElementById('id');
const url = document.getElementById('url');

id.value = copyText.value;
url.value = `https://microsoft-teams-clone-5501.herokuapp.com/form/${copyText.value}`;

cid.addEventListener('click', copyId);
curl.addEventListener('click', copyUrl);

function copyId() {

    console.log(id.value)
    id.select();
    id.setSelectionRange(0, 99999)
    document.execCommand("copy");
}

function copyUrl() {

    console.log(url.value);

    url.select();
    url.setSelectionRange(0, 99999)
    document.execCommand("copy");
}