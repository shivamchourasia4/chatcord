const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

//set static folder
app.use(express.static(path.join(__dirname, "public")));

const botName = "Chatcord Bot";

// Run when client connects
io.on(`connection`, (socket) => {
  //   console.log("New WS Connection...");

  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Welcome current user
    socket.emit("message", formatMessage(botName, "Welcome to chatcord!"));
    // notifies only the user which connects

    // Broadcast when a user connects
    // notifies all user that a user has connected except for that particular user.
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    //io.emit() notifies everybody

    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user,
      users: getRoomUsers(user.room),
    });
  });

  //Listen for chatMessage
  socket.on("chatMessage", (msg) => {
    // console.log(msg);

    const user = getCurrentUser(socket.id);

    // emit to everybody
    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  // Runs when the client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send user and room info
      io.to(user.room).emit("roomUsers", {
        room: user,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
