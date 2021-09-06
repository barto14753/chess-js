
let username = prompt("Username: ");
if (username.length == 0) username = "Anonymous"

let socket = io();
let user;
let users = Array();


$('.sidebar-button').click((event) => {
  let id = $(event.target).parent().parent().attr("id");
  let mode = ($(event.target).hasClass('badge-secondary')) ? "SEND" : "CANCEL";

  let info = 
  {
    "sender_id": user.id,
    "receiver_id": id
  }

  if (mode == "SEND")
  {
    socket.emit("SEND REQUEST", info);
    $(event.target).removeClass('badge-secondary');
    $(event.target).addClass('badge-danger');
  }
  else // CANCEL
  {
    socket.emit("CANCEL REQUEST", info);
    $(event.target).removeClass('badge-danger');
    $(event.target).addClass('badge-secondary');
  }
})

function getUser(user_id)
{
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

  // besides sidebar it will remove all elements with user_id (values in other columns should have user_id)
  $('#' + user_id).remove();
}




// COMMUNICATION WITH SERVER

socket.on('init', function(u, user_obj) {
  user = {
      "id": socket.id,
      "username": username,
      "joined": user_obj.joined,
      "photo": user_obj.photo
  }
  socket.emit("setDetails", username, socket.id, );
  onCreateYourself();

  for (const user of u) onNewUser(user);

});

socket.on('newUser', function(user) {
  onNewUser(user);
});

socket.on('deleteUser', function(user) {
  onDeleteUser(user.id);
});



















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

var board = null
var game = new Chess()
var $status = $('#status')
var $fen = $('#fen')
var $pgn = $('#pgn')

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
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen for example simplicity
  })

  // illegal move
  if (move === null) return 'snapback'

  updateStatus()
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
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd
}
board = Chessboard('myBoard', config)

updateStatus()



