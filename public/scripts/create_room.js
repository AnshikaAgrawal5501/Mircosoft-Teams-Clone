// let copyText = document.getElementById("roomId");
// console.log(copyText.value)

function copyId() {
    let copyText = document.getElementById("roomId");
    console.log(copyText.value)
    copyText.select();
    // copyText.setSelectionRange(0, 99999)
    document.execCommand("copy");
    // copyText = null;
    // console.log(copyText);
}

function copyUrl() {
    let copyText = document.getElementById("roomId");
    console.log(copyText.value)
    console.log("hi ", copyText.value);

    copyText.value = `http://localhost:3000/${copyText.value}`;

    console.log(copyText.value);

    copyText.select();
    // copyText.setSelectionRange(0, 99999)
    document.execCommand("copy");
}

// function copied(copyText) {
//     copyText.select();
//     copyText.setSelectionRange(0, 99999)
//     document.execCommand("copy");
//     copyText = null;
//     console.log(copyText);
// }