const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

users = Array();

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


function deleteUser(id)
{
  let index = getIndex(id);

    if (index > -1) {
      users.splice(index, 1);
    }
    console.log(users);
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
    "photo": USER_IMAGES_PATH + USER_IMAGES[Math.floor(Math.random()*USER_IMAGES.length)]
  }

  console.log('New user connected'); 
  socket.emit('init', users, user_obj);
  console.log(users);


  socket.on('disconnect', () => {
    deleteUser(user_obj.id);
    socket.broadcast.emit('deleteUser', user_obj)
    console.log("User %s disconnected", user_obj.username);

  });

  socket.on('setDetails', (u, i) => {
    user_obj.username = u;
    user_obj.id = i;

    users.push(user_obj);
    console.log("User set username: %s", user_obj.id, user_obj.username);
    console.log(users);
    socket.broadcast.emit('newUser', user_obj);

  });

});



server.listen(3000, () => {
    console.log('Listening on port 3000');
  });