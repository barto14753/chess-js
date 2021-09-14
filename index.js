const express = require('express');
const app = express();
const http = require('http');
const { type } = require('os');
const server = http.createServer(app);
const { Server } = require("socket.io");
const { PassThrough } = require('stream');
const io = new Server(server);


users = Array();
open_requests = Array();

const USER_IMAGES_PATH = 'img/faces/';
const USER_IMAGES = [
  'face1.png',
  'face2.png',
  'face3.png',
  'face4.png',
  'face5.png',
  'face6.png',
]

function getIndex(id)
{
  for (let i=0; i<users.length; i++)
  {
    if (users[i].id == id)
    {
      return i;
    }
  }
  return -1;
}

function getUser(id)
{
  let index = getIndex(id);

  if (index >= 0) return users[index];
  return null;
}


function deleteUser(id)
{
  let index = getIndex(id);

    if (index > -1) {
      users.splice(index, 1);
    }
    console.log(users);
}

function removeOpenRequest(info)
{
  for (let i=0; i<open_requests.length; i++)
  {
    if (open_requests[i].sender_id == info.sender_id)
    {
      open_requests.splice(i, 1);
    }
  }
}

function onSendRequest(info)
{
  io.to(info.receiver_id).emit('SEND REQUEST', info);
}

function onCancelRequest(info)
{
  io.to(info.receiver_id).emit('CANCEL REQUEST', info);
}

function onAcceptRequest(info)
{
  sender = getUser(info.sender_id)
  receiver = getUser(info.receiver_id)

  if (!sender.is_playing && !receiver.is_playing)
  {
    sender_game = {
      "opponent_id": info.receiver_id,
      "type": info.type,
    }

    receiver_game = {
      "opponent_id": info.receiver_id,
      "type": info.type,
    }

    sender.is_playing = true;
    receiver.is_playing = true;
    sender.game = sender_game;
    receiver.game = receiver_game;
    

    io.to(info.sender_id).emit('START GAME', sender_game);
    io.to(info.receiver_id).emit('START GAME', receiver_game);
    
  }
}

function onSendOpenRequest(socket, info)
{
  open_requests.push(info);
  socket.broadcast.emit('SEND OPEN REQUEST', info);
}

function onCancelOpenRequest(socket, info)
{
  removeOpenRequest(info);
  socket.broadcast.emit('CANCEL OPEN REQUEST', info);
}



app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});


io.on('connection', (socket) => {
  let user_obj = {
    "id": null,
    "username": null,
    "joined": new Date().toLocaleTimeString(),
    "photo": USER_IMAGES_PATH + USER_IMAGES[Math.floor(Math.random()*USER_IMAGES.length)],
    "is_playing": false,
    "game": null,
  }


  console.log('New user connected');
  console.log('Send open_requests', open_requests);
  socket.emit('init', users, user_obj, open_requests);
  


  socket.on('disconnect', () => {
    deleteUser(user_obj.id);
    socket.broadcast.emit('DELETE USER', user_obj)
    console.log("User %s disconnected", user_obj.username);

  });

  socket.on('SET DETAILS', (u, i) => {
    user_obj.username = u;
    user_obj.id = i;

    users.push(user_obj);
    console.log("User with set username: %s", user_obj.id, user_obj.username);
    console.log(users);
    socket.broadcast.emit('NEW USER', user_obj);

  });

  socket.on('SEND REQUEST', (info) => {
    console.log("SEND REQUEST", info);
    onSendRequest(info);
  });

  socket.on('CANCEL REQUEST', (info) => {
    console.log("CANCEL REQUEST", info);
    onCancelRequest(info);
  });

  socket.on('ACCEPT REQUEST', (info) => {
    console.log("ACCEPT REQUEST", info);
    onAcceptRequest(info);
  });

  socket.on('SEND OPEN REQUEST', (info) => {
    console.log("SEND OPEN REQUEST", info);
    onSendOpenRequest(socket, info);
  });

  socket.on('CANCEL OPEN REQUEST', (info) => {
    console.log("CANCEL OPEN REQUEST", info);
    onCancelOpenRequest(socket, info);
  });


});



server.listen(3000, () => {
    console.log('Listening on port 3000');
  });