const express = require('express');
const app = express();
const http = require('http');
const { type } = require('os');
const server = http.createServer(app);
const { Server } = require("socket.io");
const { PassThrough } = require('stream');
const io = new Server(server);
const PING_TIMESTAMP = 50; // miliseconds


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


function pingPlayers()
{
  io.emit("PING", PING_TIMESTAMP);
}

setInterval(pingPlayers, PING_TIMESTAMP);




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
    let sender_color = 'white';
    let receiver_color = 'black';
    if (Math.random() < 0.5)
    {
      sender_color = 'black';
      receiver_color = 'white';
    } 

    sender_game = {
      "opponent_id": info.receiver_id,
      "type": info.type,
      "color": sender_color,
      "is_open_request": info.is_open_request,
    }

    receiver_game = {
      "opponent_id": info.sender_id,
      "type": info.type,
      "color": receiver_color,
      "is_open_request": info.is_open_request,
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

function onMakeMove(opponent_id, move)
{
  io.to(opponent_id).emit('MAKE MOVE', move);
}

function getEndgameAlert(result, description)
{
  if (result == "WIN")
  {
    switch (description)
    {
      case "CHECKMATE": return "You win by checkmate";
      case "RESIGNATION": return "You win by resignation";
      case "DISCONNECT": return "You win cause rival disconnected";
    }
  }
  else if (result == "DRAW")
  {
    switch (description)
    {
      case "PAT": return "You draw by pat";
      case "AGREEMENT": return "You draw by agreement";
    }
  }
  else if (result == "LOSS")
  {
    switch (description)
    {
      case "CHECKMATE": return "You lose by checkmate";
      case "RESIGNATION": return "You lose by resignation";
    }
  }
}

function stopPlaying(user_id)
{
  let u = getUser(user_id);
  if (u)
  {
    u.is_playing = false;
  }
}

function onEndGame(match)
{
  stopPlaying(match.sender_id);
  stopPlaying(match.receiver_id);

  sender_info = {
    "opponent_id": match.receiver_id,
    "type": match.type,
    "result": match.result,
    "description": match.description,
    "alert": getEndgameAlert(match.result, match.description),
    "date": new Date().toLocaleTimeString(),
  }

  let receiver_result = "WIN";
  if (match.result == "WIN") receiver_result = "LOSS";



  receiver_info = {
    "opponent_id": match.sender_id,
    "type": match.type,
    "result": receiver_result,
    "description": match.description,
    "alert": getEndgameAlert(receiver_result, match.description),
  }

  io.to(match.sender_id).emit("END GAME", sender_info);
  io.to(match.receiver_id).emit("END GAME", receiver_info);
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

  socket.on('MAKE MOVE', (game, move) => {
    console.log("MAKE MOVE", move, game, game.opponent_id);
    onMakeMove(game.opponent_id, move);
  });

  socket.on('END GAME', (match) => {
    console.log("END GAME", match);
    onEndGame(match);
  });

  socket.on('OFFER DRAW', (opponent_id) => {
    console.log("OFFER DRAW", opponent_id);
    io.to(opponent_id).emit('OFFER DRAW');
  });


});


server.listen(3000, () => {
    console.log('Listening on port 3000');
  });