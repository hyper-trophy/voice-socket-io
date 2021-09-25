const userStatus = {
    microphone: false,
    mute: false,
    username: localStorage.getItem("username") || "user#" + Math.floor(Math.random() * 999999),
    online: true,
};

const usernameInput = document.getElementById("username");
const usernameLabel = document.getElementById("username-label");
const usernameDiv = document.getElementById("username-div");
const usersDiv = document.getElementById("users");

let currDeviceID = null;
var stream
var MediaRecorder1
var MediaRecorder2

// (async () => {
//     mediaSource = await navigator.mediaDevices.enumerateDevices().then(r => r.filter(e => e.kind == 'audioinput'))
//     let selector = document.getElementById("micSource");
//     mediaSource.map(
//         e =>
//             selector.appendChild(new Option(e.label, e.deviceId))
//     )
//     currDeviceID = mediaSource[0].deviceId
//     selector.onchange = async () => {
//         let idx = selector.selectedIndex
//         currDeviceID = selector.options[idx].value
//         console.log("divice ID", currDeviceID)
//         stream = await navigator.mediaDevices.getUserMedia({
//             audio: {
//                 echoCancellation: true,
//                 deviceId: currDeviceID
//             }
//         })
//         MediaRecorder1.stream = stream
//         MediaRecorder2.stream = stream
//     }
// })()

usernameLabel.onclick = function () {
    usernameDiv.style.display = "block";
    usernameLabel.style.display = "none";
}

function changeUsername() {
    userStatus.username = usernameInput.value;
    usernameLabel.innerText = userStatus.username;
    usernameDiv.style.display = "none";
    usernameLabel.style.display = "block";
    localStorage.setItem("username", userStatus.username)
    emitUserInformation();
}

function toggleConnection(e) {
    userStatus.online = !userStatus.online;

    editButtonClass(e, userStatus.online);
    emitUserInformation();
}

function toggleMute(e) {
    userStatus.mute = !userStatus.mute;

    editButtonClass(e, userStatus.mute);
    emitUserInformation();
}

function toggleMicrophone(e) {
    userStatus.microphone = !userStatus.microphone;
    editButtonClass(e, userStatus.microphone);
    emitUserInformation();
}

function editButtonClass(target, bool) {
    const classList = target.classList;
    classList.remove("enable-btn");
    classList.remove("disable-btn");

    if (bool)
        return classList.add("enable-btn");

    classList.add("disable-btn");
}

function emitUserInformation() {
    socket.emit("userInformation", userStatus);
}

usernameInput.value = userStatus.username;
usernameLabel.innerText = userStatus.username;


window.onload = (e) => {
    mainFunction(200);
};

var socket = io("wss://lets-talk-harsh.herokuapp.com");
// var socket = io("ws://localhost:3000");
socket.emit("userInformation", userStatus);

let wait = (d) => new Promise(r => setTimeout(r, d))

var audioChunkObj = {
    "voice1": [],
    "voice2": []
}

async function mainFunction(time) {

    socket.on("voice1", function (data) {
        var audio1 = new Audio(data);
        audio1.play();
    });

    socket.on("voice2", function (data) {
        var audio2 = new Audio(data);
        audio2.play();
    });

    socket.on("usersUpdate", function (data) {
        usersDiv.innerHTML = '';
        for (const key in data) {
            if (!Object.hasOwnProperty.call(data, key)) continue;

            const element = data[key];
            const li = document.createElement("li");
            li.innerText = element.username;
            usersDiv.append(li);

        }
    });

    const sendData = (channel) =>
        () => {
            var audioBlob = new Blob(audioChunkObj[channel]);
            var fileReader = new FileReader();
            fileReader.readAsDataURL(audioBlob);
            fileReader.onloadend = function () {
                if (!userStatus.microphone || !userStatus.online) return;
                var base64String = fileReader.result;
                socket.emit(channel, base64String);
            };
            audioChunkObj[channel] = [];
        }

    stream = await navigator.mediaDevices.getUserMedia({
        audio: {
            echoCancellation: true,
            // deviceId: currDeviceID
        }
    })
    MediaRecorder1 = new MediaRecorder(stream);
    MediaRecorder2 = new MediaRecorder(stream);

    MediaRecorder1.addEventListener("dataavailable", function (event) {
        audioChunkObj["voice1"].push(event.data);
    });

    MediaRecorder2.addEventListener("dataavailable", function (event) {
        audioChunkObj["voice2"].push(event.data);
    });

    MediaRecorder1.addEventListener("stop", sendData("voice1"))
    MediaRecorder2.addEventListener("stop", sendData("voice2"))

    MediaRecorder1.start()
    while (true) {
        await wait(200)
        MediaRecorder2.state!="recording" && MediaRecorder2.start()
        await wait(230)
        MediaRecorder1.stop()
        await wait(200)
         MediaRecorder1.state!="recording" && MediaRecorder1.start()
        await wait(230)
        MediaRecorder2.stop()
    }
    // navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    //     var madiaRecorder = new MediaRecorder(stream);

    //     var audioChunks = [];
    //     madiaRecorder.start();

    //     madiaRecorder.addEventListener("dataavailable", function (event) {
    //         audioChunks.push(event.data);

    //     });

    //     madiaRecorder.addEventListener("stop", function () {

    //         var audioBlob = new Blob(audioChunks);


    //         var fileReader = new FileReader();
    //         fileReader.readAsDataURL(audioBlob);
    //         fileReader.onloadend = function () {
    //             if (!userStatus.microphone || !userStatus.online) return;

    //             var base64String = fileReader.result;
    //             socket.emit("voice", base64String);
    //         };

    //         audioChunks = [];
    //         madiaRecorder.start();


    //         setTimeout(function () {
    //             madiaRecorder.stop();
    //         }, time);
    //     });

    //     setTimeout(function () {
    //         madiaRecorder.stop();
    //     }, time);
    // });

}
