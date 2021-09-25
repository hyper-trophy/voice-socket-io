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
socket.emit("userInformation", userStatus);

let wait = (d) => new Promise(r => setTimeout(r, d))

var audioChunkObj = {
    "voice1": [],
    "voice2": []
}

function mainFunction(time) {

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

    navigator.mediaDevices.getUserMedia({ audio: true }).then(async (stream) => {
        var MediaRecorder1 = new MediaRecorder(stream);
        var MediaRecorder2 = new MediaRecorder(stream);

        MediaRecorder1.addEventListener("dataavailable", function (event) {
            audioChunkObj["voice1"].push(event.data);
        });

        MediaRecorder2.addEventListener("dataavailable", function (event) {
            audioChunkObj["voice2"].push(event.data);
        });

        MediaRecorder1.addEventListener("stop", sendData("voice1"))
        MediaRecorder2.addEventListener("stop", sendData("voice2"))

        MediaRecorder1.start()
        await wait(10)
        while (true) {
            await wait(100)
            MediaRecorder2.start()
            await wait(10)
            MediaRecorder1.stop()
            await wait(100)
            MediaRecorder1.start()
            await wait(10)
            MediaRecorder2.stop()
        }
    })

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
