
let username = prompt("Username: ");
if (username.length == 0) username = "Anonymous"

let socket = io();
let user;
let users = Array();


$('.sidebar-button').click((event) => {
  console.log($(event.target));

  let id = $(event.target).parent().parent().attr("id");
  let mode = "NONE";
  let type = "NONE";

  if ($(event.target).hasClass('badge-secondary')) mode = "SEND";
  else if ($(event.target).hasClass('badge-danger')) mode = "CANCEL";
  else if ($(event.target).hasClass('badge-success')) mode = "ACCEPT";

  if ($(event.target).hasClass('1-min')) type = "1-min";
  else if ($(event.target).hasClass('5-min')) type = "5-min";
  else if ($(event.target).hasClass('15-min')) type = "15-min";


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
    req.find('.wall-user-image').attr(receiver.photo);
    req.find('.match-type').text(type);

    $('#personal-invitations').append(req);

  }
  else if (mode == "CANCEL")// CANCEL
  {
    $(event.target).removeClass('badge-danger');
    $(event.target).addClass('badge-secondary');

    $('personal-invitations').find('#' + receiver.id).remove();

  }
  else if (mode == "ACCEPT")// CANCEL
  {
    $(event.target).removeClass('badge-success');
    $(event.target).addClass('badge-secondary');

    //TODO
  }

  socket.emit(mode + " REQUEST", info, );

})

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
  req.find('.wall-user-image').attr(sender.photo);
  req.find('.match-type').text(info.type);

  $("#personal-invitations").append(req);


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




// COMMUNICATION WITH SERVER

socket.on('init', function(u, user_obj) {
  user = {
      "id": socket.id,
      "username": username,
      "joined": user_obj.joined,
      "photo": user_obj.photo
  }
  socket.emit("SET DETAILS", username, socket.id, );
  console.log("Sent");
  onCreateYourself();

  for (const user of u) onNewUser(user);

});

socket.on('NEW USER', function(user) {
  onNewUser(user);
});

socket.on('DELETE USER', function(user) {
  onDeleteUser(user.id);
});

socket.on("SEND REQUEST", function(info) {
  sender = getUser(info.sender_id)
  console.log("SENDER", sender, info.sender_id);
  onNewRequest(sender, info)
})

socket.on("CANCEL REQUEST", function(info) {
  sender = getUser(info.sender_id)
  onCancelRequest(sender, info)
})





















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



