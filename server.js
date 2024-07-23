const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const moment = require('moment');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(express.static('public'));
app.use(express.json());

// MongoDB connection
const dbUrl = 'mongodb://localhost:27017/messenger';

async function main() {
  try {
    await mongoose.connect(dbUrl);
    console.log("Connected to the DB");
  } catch (err) {
    console.log(err);
  }
}
main();

// Message Schema
const messageSchema = new mongoose.Schema({
  content: String,
  sender: String,
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model('Message', messageSchema);

// Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('a user connected');

  let username = 'Anonymous';

  // Set username
  socket.on('set username', (name) => {
    username = name;
  });

  // Load previous messages
  Message.find().then((messages) => {
    socket.emit('load messages', messages);
  });

  // Handle incoming messages
  socket.on('chat message', (msg) => {
    const message = new Message({
      content: msg.content,
      sender: username,
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
    });

    message.save().then(() => {
      io.emit('chat message', message);
    });
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
