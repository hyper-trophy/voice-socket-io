const express = require("express");
const app = express();
const handlebars = require("express-handlebars");
const http = require("http").Server(app);
const io = require("socket.io")(http);

//To holding users information 
const socketsStatus = {};

//config and set handlebars to express
const customHandlebars = handlebars.create({ layoutsDir: "./views" });

app.engine("handlebars", customHandlebars.engine);
app.set("view engine", "handlebars");

//enable user access to public folder 
app.use("/files", express.static("public"));

app.get("/", (req, res) => {
    res.render("index");
});

io.on("connection", function (socket) {
    const socketId = socket.id;
    socketsStatus[socket.id] = {};


    console.log("connect");

    socket.on("voice1", function (data) {

        var newData = data.split(";");
        newData[0] = "data:audio/ogg;";
        newData = newData[0] + newData[1];

        for (const id in socketsStatus) {

            if (id != socketId && !socketsStatus[id].mute && socketsStatus[id].online)
                socket.broadcast.to(id).emit("voice1", newData);
        }

    });

    socket.on("voice2", function (data) {

        var newData = data.split(";");
        newData[0] = "data:audio/ogg;";
        newData = newData[0] + newData[1];

        for (const id in socketsStatus) {

            if (id != socketId && !socketsStatus[id].mute && socketsStatus[id].online)
                socket.broadcast.to(id).emit("voice2", newData);
        }

    });

    socket.on("userInformation", function (data) {
        socketsStatus[socketId] = data;

        io.sockets.emit("usersUpdate", socketsStatus);
    });


    socket.on("disconnect", function () {
        delete socketsStatus[socketId];
        io.sockets.emit("usersUpdate", socketsStatus);
        console.log("disconnect")
    });

});

http.listen(process.env.PORT ||3000, () => {
    console.log("the app is run in port 3000!");
});