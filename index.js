const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const mongoose = require("mongoose");

//import routes
const signup = require("./routes/signup");
const login = require("./routes/login");
const me = require("./routes/me");

const app = express();
require("dotenv").config();

const server = require("http").Server(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});
app.use(cors());
app.use(bodyParser.json());
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});
app.get("/", (req, res) => {
  res.json({ message: "API is working" });
});

app.use(signup);
app.use(login);
app.use(me);

/* Socket.IO */

//model to create a room
const Room = mongoose.model("Room", {
  name: {
    unique: true,
    type: String,
    required: true,
  },
});

const Message = mongoose.model("Message", {
  text: String,
  room: String,
  senderId: String,
  realName: String,
});

// FUNCTION TO REGISTER THE NAME OF THE ROOM

const registerRooms = async (room) => {
  Room.exists({ name: room }, async (err, result) => {
    if (err) {
      // return console.log(err);
    } else {
      try {
        let newRoom = new Room({ name: room });
        await newRoom.save();
      } catch (e) {
        // console.log(e.message);
      }
    }
  });
};

// FUNCTION TO REGISTER THE NAME OF THE MESSAGES
const registerMessage = async (message, room, senderId, realName) => {
  try {
    const newMessage = Message({
      text: message,
      room: room,
      senderId: senderId,
      realName: realName,
    });
    await newMessage.save().then();
  } catch (e) {
    console.log(e.message);
  }
};

const NEW_CHAT_MESSAGE_EVENT = "newChatMessage";
const OLD_MESSAGES = "history";

io.on("connection", (socket) => {
  console.log(`Client ${socket.id} connected`);

  // Join a conversation
  const { roomId } = socket.handshake.query;
  socket.join(roomId);
  console.log(roomId);
  Message.find().then(() => {
    io.emit("chatHistory", data);
  });

  registerRooms(roomId);

  socket.on("wantroom", (data) => {
    console.log("on wantroom");
    Room.find().then((result) => {
      // io.in(roomId).emit(NEW_CHAT_MESSAGE_EVENT, data);
      console.log(result);
      socket.emit("wantroom", result);
    });
  });

  socket.on(OLD_MESSAGES, (data) => {
    console.log("on history");
    Message.find({ room: roomId }).then((result) => {
      // io.in(roomId).emit(NEW_CHAT_MESSAGE_EVENT, data);
      console.log(result);
      socket.emit("history", result);
    });
  });

  // Listen for new messages
  socket.on(NEW_CHAT_MESSAGE_EVENT, (data) => {
    // io.in(roomId).emit(NEW_CHAT_MESSAGE_EVENT, data);

    console.log("roomId ===", roomId);
    console.log("sender", data.realName);

    const newMessage = Message({
      text: data.body,
      room: data.roomId,
      senderId: data.senderId,
      realName: data.realName,
    });
    console.log("searching messages");
    newMessage.save().then(() => {
      io.in(roomId).emit(NEW_CHAT_MESSAGE_EVENT, data);
    });
  });

  // Leave the room if the user closes the socket
  socket.on("disconnect", () => {
    console.log(`Client ${socket.id} disconnected`);
    socket.leave(roomId);
  });
});

/* Socket.IO */

server.listen(process.env.PORT, (req, res) => {
  console.log("server started at port 3010");
});
