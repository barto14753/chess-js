let username = prompt("Username: ");
if (username.length == 0) username = "Anonymous"

let socket = io();
let user;
let users = Array();
let openRequest = Array();
let myGame = null;


function getIndex(user_id)
{
  for (let i=0; i<users.length; i++)
  {
    if (users[i].id == user_id) return i;
  }
  return -1;
}

function removeUser(user_id)
{
  let index = getIndex(user_id);
  if (index >= 0) users.splice(index, 1);
}

function getType(el)
{
  console.log('getType', el);
  if (el.hasClass('1-min')) return "1-min";
  else if (el.hasClass('5-min')) return "5-min";
  else if (el.hasClass('15-min')) return "15-min";
  return "NONE"

}


$('.sidebar-button').click((event) => {
  console.log($(event.target));

  let id = $(event.target).parent().parent().attr("id");
  let mode = "NONE";
  let type = getType($(event.target));

  if ($(event.target).hasClass('badge-secondary')) mode = "SEND";
  else if ($(event.target).hasClass('badge-danger')) mode = "CANCEL";
  else if ($(event.target).hasClass('badge-success')) mode = "ACCEPT";



  let info = 
  {
    "sender_id": user.id,
    "receiver_id": id,
    "type": type,

  }

  let receiver = getUser(id);

  if (mode == "SEND")
  {
    $(event.target).removeClass('badge-secondary');
    $(event.target).addClass('badge-danger');

    let req = $('#personal-invitations-template-mine').clone(true);
    req.removeClass('d-none');
    req.find('.username').text(receiver.username);
    req.attr("id", receiver.id);
    req.find('.wall-user-image').attr("src", receiver.photo);
    req.find('.match-type').text(type);

    $('#personal-invitations').append(req);


  }
  else if (mode == "CANCEL") // CANCEL
  {
    $(event.target).removeClass('badge-danger');
    $(event.target).addClass('badge-secondary');

    $('#personal-invitations').find('#' + receiver.id).remove();

  }
  else if (mode == "ACCEPT") // ACCEPT
  {
    // Request can be accepted when sender is not playing (button will change after proper message from server)
    console.log();

    
  }

  socket.emit(mode + " REQUEST", info, );

})

$('.wall-games-button').click((event) => {
  
  type = getType($(event.target));
  let info = {
    "sender_id": user.id,
    "type": type,
  }

  socket.emit("SEND OPEN REQUEST", info);

  $('.wall-games-pick').addClass('d-none');
  $('.wall-games-wait').removeClass('d-none');

  openRequest = info.type;

})

function cancelMyOpenRequest()
{
  info = {
    "sender_id": user.id,
  }

  socket.emit("CANCEL OPEN REQUEST", info);
  $('.wall-games-pick').removeClass('d-none');
  $('.wall-games-wait').addClass('d-none');

  openRequest = null;
}

$('.wall-games-wait').find(".btn").click((event) => {
  cancelMyOpenRequest();
})

// Cancel request
$('#personal-invitations-template-mine').find(".btn").click((event) => {
  let el = $(event.target).parent().parent();
  let type = el.find('.match-type').text();

  
  let id = el.attr("id");

  el.remove();
  let btn = $('#sidebar-users-list').find('#' + id);
  btn = btn.find('.' + type);
  console.log('.' + type, btn);
  btn.removeClass('badge-danger');
  btn.addClass('badge-secondary');

  let info = 
  {
    "sender_id": user.id,
    "receiver_id": id,
    "type": type,

  }
  socket.emit("CANCEL REQUEST", info);


})

function acceptRequest(event, is_open_request)
{
  
  let el = $(event.target).parent().parent();
  let type = el.find('.match-type').text();

  console.log("Accept request", el, type);

  let id = el.attr("id");

  let info = 
  {
    "sender_id": user.id,
    "receiver_id": id,
    "type": type,
    "is_open_request": is_open_request,

  }

  socket.emit("ACCEPT REQUEST", info);
}

// Accept request (only if user is not playing)
$('#personal-invitations-template-other').find(".btn").click((event) => {
  acceptRequest(event, false);

})


$('#open-challanges').find(".btn").click((event) => {
  acceptRequest(event, true);
})

// remove invitation which was accepted
function removePersonalInvitation(game)
{
  $('#personal-invitations').find('#' + game.opponent_id).each(function () {
    if ($(this).find(game.type).length) $(this).remove();
  })

  let el = $('#sidebar-users-list').find('.' + game.type);
  if (el.hasClass('badge-success'))
  {
    el.removeClass('badge-success');
  }
  else
  {
    el.removeClass('badge-danger');
  }
  el.addClass('badge-secondary');
}

function getUser(user_id)
{
    console.log("get user", users);
    for (const user of users)
    {
        if (user.id === user_id) return user;
    }

    return null;
}

function onCreateYourself()
{
  console.log("On create yourself", user);
  $('.user-photo').attr('src', user.photo);
  $('.username-text').text(user.username);
}

function onNewUser(user)
{
  console.log("On new user", user);

  users.push(user);

  let newUser = $('#sidebar-user-template').clone(true);
  newUser.attr("id", user.id);
  newUser.removeClass("d-none");
  newUser.find('.user-image').attr("src", user.photo);
  newUser.find('.sidebar-username').text(user.username);

  $('#sidebar-users-list').append(newUser);
}

function onDeleteUser(user_id)
{
  console.log("On delete user", user_id);

  removeUser(user_id);

  // besides sidebar it will remove all elements with user_id (values in other columns should have user_id)
  $('#' + user_id).remove();
}

function onNewRequest(sender, info)
{
  console.log("On new request", sender);

  // Sidebar
  let btn = $('#sidebar-users-list').find('#' + sender.id).find('.' + info.type);
  btn.removeClass('badge-secondary');
  btn.addClass('badge-success');

  // Personal invitations
  let req = $('#personal-invitations-template-other').clone(true);
  req.attr("id", sender.id);
  req.removeClass('d-none');
  req.find('.username').text(sender.username);
  req.find('.wall-user-image').attr("src", sender.photo);
  req.find('.match-type').text(info.type);

  $('#personal-invitations').append(req);

}

function onCancelRequest(sender, info)
{
  console.log("On cancel request", sender);

  // Sidebar
  let btn = $('#sidebar-users-list').find('#' + sender.id).find('.' + info.type);
  btn.removeClass('badge-success');
  btn.addClass('badge-secondary');

  // Personal invitations
  $('#personal-invitations').find('#' + sender.id).remove();
}

function onNewOpenRequest(sender, info)
{
  console.log("On new open request", sender, info);

  let req = $('#wall-open-challange-template').clone(true);
  req.removeClass("d-none");
  req.attr("id", sender.id);
  req.find('.wall-user-image').attr("src", sender.photo);
  req.find('.username').text(sender.username)
  req.find('.match-type').text(info.type);

  $('#open-challanges').append(req);

}

function setPlayersDetails(game)
{
  let opponent = getUser(game.opponent_id);

  $('#game-opponent').text(opponent.username);
  $('#game-opponent-image').attr("src", opponent.photo);

  $('#game-me').text(user.username);
  $('#game-me-image').attr("src", user.photo);
}

function setClock(game_type)
{
  let clocks = $('.clock-time');
  console.log("CLOCK SET", clocks);
  
  if (game_type == '1-min')
  {
    clocks.attr("value", 60);
    clocks.text("1:00");
  }
  else if (game_type == '5-min')
  {
    clocks.attr("value", 300);
    clocks.text("5:00");
  }
  else if (game_type == '15-min')
  {
    clocks.attr("value", 900);
    clocks.text("15:00");
  }
}


function onCancelOpenRequest(sender, info)
{
  $('#open-challanges').find('#' + sender.id).remove();
}

function showBoard()
{
  $('.wall-container').addClass('d-none');
  $('.game-container').removeClass('d-none');
}

function showDashboard()
{
  $('.wall-container').removeClass('d-none');
  $('.game-container').addClass('d-none');
}

function onStartGame(game)
{
  myGame = game;
  cancelMyOpenRequest();
  setPlayersDetails(game);
  setClock(game.type);
  restartBoard(game);
  showBoard();
}




// SIDEBAR

jQuery(function ($) {

    $(".sidebar-dropdown > a").click(function() {
  $(".sidebar-submenu").slideUp(200);
  if (
    $(this)
      .parent()
      .hasClass("active")
  ) {
    $(".sidebar-dropdown").removeClass("active");
    $(this)
      .parent()
      .removeClass("active");
  } else {
    $(".sidebar-dropdown").removeClass("active");
    $(this)
      .next(".sidebar-submenu")
      .slideDown(200);
    $(this)
      .parent()
      .addClass("active");
  }
});

$("#close-sidebar").click(function() {
  $(".page-wrapper").removeClass("toggled");
});
$("#show-sidebar").click(function() {
  $(".page-wrapper").addClass("toggled");
});


   
   
});







// CHESSBOARD


var board = null
var game = new Chess()
var $status = $('#status')
var $fen = $('#fen')
var $pgn = $('#pgn')

function makeMove(move)
{
  socket.emit("MAKE MOVE", myGame, move);
}

function onMakeMove(move)
{
  console.log("Make move", move);
  let m = game.move({
    from: move.from,
    to: move.to,
    promotion: 'q' // NOTE: always promote to a queen for example simplicity
  });

  console.log(m);
  updateStatus();
  onSnapEnd();
}

function onDragStart (source, piece, position, orientation) {
  // do not pick up pieces if the game is over
  if (game.game_over()) return false

  // only pick up pieces for the side to move
  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false
  }
}

function onDrop (source, target) {
  // see if the move is legal
  if (game.turn()[0] != board.orientation()[0]) return;
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen for example simplicity
  })

  // illegal move or it is not player's turn
  if (move === null) return 'snapback'

  makeMove(move);
  updateStatus();
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
  board.position(game.fen())
}

function updateStatus () {
  var status = ''

  var moveColor = 'White'
  if (game.turn() === 'b') {
    moveColor = 'Black'
  }

  // checkmate?
  if (game.in_checkmate()) {
    status = 'Game over, ' + moveColor + ' is in checkmate.'
  }

  // draw?
  else if (game.in_draw()) {
    status = 'Game over, drawn position'
  }

  // game still on
  else {
    status = moveColor + ' to move'

    // check?
    if (game.in_check()) {
      status += ', ' + moveColor + ' is in check'
    }
  }

  $status.html(status)
  $fen.html(game.fen())
  $pgn.html(game.pgn())
}

var config = {
  orientation: "white",
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd
}


function restartBoard(game)
{
  config.orientation = game.color;
  board = Chessboard('myBoard', config)
  updateStatus()

}










// COMMUNICATION WITH SERVER

socket.on('init', function(u, user_obj, open_requests) {
  user = {
      "id": socket.id,
      "username": username,
      "joined": user_obj.joined,
      "photo": user_obj.photo
  }
  socket.emit("SET DETAILS", username, socket.id, );
  console.log("OPEN REQUESTS", open_requests);
  onCreateYourself();

  for (const us of u) onNewUser(us);
  for (const req of open_requests)
  {
    let sender = getUser(req.sender_id);
    onNewOpenRequest(sender, req);
  }

});

socket.on('NEW USER', function(user) {
  onNewUser(user);
});

socket.on('DELETE USER', function(user) {
  onDeleteUser(user.id);
});

socket.on("SEND REQUEST", function(info) {
  sender = getUser(info.sender_id);
  onNewRequest(sender, info);
})

socket.on("CANCEL REQUEST", function(info) {
  sender = getUser(info.sender_id);
  onCancelRequest(sender, info);
})

socket.on("SEND OPEN REQUEST", function(info) {
  sender = getUser(info.sender_id);
  onNewOpenRequest(sender, info);
})

socket.on("CANCEL OPEN REQUEST", function(info) {
  sender = getUser(info.sender_id)
  onCancelOpenRequest(sender, info)
})

socket.on("START GAME", function(game) {
  console.log("START GAME", game);
  onStartGame(game);
});

socket.on("MAKE MOVE", function(move) {
    onMakeMove(move);
});

