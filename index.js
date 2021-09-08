const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const { PassThrough } = require('stream');
const io = new Server(server);


users = Array();
requests = Array();
games = Array();

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

}

function onSendOpenRequest(socket, info)
{
  socket.broadcast.emit('SEND OPEN REQUEST', info);
}

function onCancelOpenRequest(socket, info)
{
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
  }

  console.log('New user connected'); 
  socket.emit('init', users, user_obj);
  


  socket.on('disconnect', () => {
    deleteUser(user_obj.id);
    socket.broadcast.emit('DELETE USER', user_obj)
    console.log("User %s disconnected", user_obj.username);

  });

  socket.on('SET DETAILS', (u, i) => {
    user_obj.username = u;
    user_obj.id = i;

    users.push(user_obj);
    console.log("User set username: %s", user_obj.id, user_obj.username);
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
    console.log("CANCEL REQUEST", info);
    onCancelOpenRequest(socket, info);
  });

});



server.listen(3000, () => {
    console.log('Listening on port 3000');
  });