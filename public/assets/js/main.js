function getParameterValue(requestedKey) {
    let pageIRI = window.location.search.substring(1);
    let pageIRIVariables = pageIRI.split('&');
    for (let i = 0; i < pageIRIVariables.length; i++) {
        let data = pageIRIVariables[i].split('=');
        let key = data[0];
        let value = data[1];
        if (key === requestedKey) {
            return value;
        }
    }
    return null;
}

let username = decodeURI(getParameterValue('username'));
if ((typeof username == 'undefined') || (username === null) || (username === 'null') || (username === "")) {
    username = "Anonymous_" + Math.floor(Math.random()*1000);
}


let chatRoom = decodeURI(getParameterValue('game_id'));
if ((typeof chatRoom == 'undefined') || (chatRoom === null) || (chatRoom === 'null')) {
    chatRoom = "зал ожидания";
}
let socket = io();
socket.on('log', function(array) {
    console.log.apply(console,array);
});

function makeInviteButton(socket_id){
    let newHTML = "<button type='button' class='btn btn-outline-primary'>Пригласить</button>";
    let newNode = $(newHTML);
    newNode.click( () => {
        let payload = {
            requested_user:socket_id
        }
        console.log('**** Client log message, sending \'invite\' command: '+JSON.stringify(payload));
        socket.emit('invite', payload);
    }
    );
    return newNode;
}

function makeInvitedButton(socket_id){
    let newHTML = "<button type='button' class='btn btn-primary'>Приглашен</button>";
    let newNode = $(newHTML);
    newNode.click( () => {
        let payload = {
            requested_user:socket_id
        }
        console.log('**** Client log message, sending \'uninvite\' command: '+JSON.stringify(payload));
        socket.emit('uninvite', payload);
    }
    );
    return newNode;
}

function makePlayButton(socket_id){
    let newHTML = "<button type='button' class='btn btn-success'>Играть</button>";
    let newNode = $(newHTML);
    newNode.click( () => {
        let payload = {
            requested_user:socket_id
        }
        console.log('**** Client log message, sending \'game_start\' command: '+JSON.stringify(payload));
        socket.emit('game_start', payload);
    }
    );
    return newNode;
}

function makeStartGameButton(){
    let newHTML = "<button type='button' class='btn btn-danger'>Игра начинается</button>";
    let newNode = $(newHTML);
    return newNode;
}


socket.on('invite_response', (payload) =>{
    if(( typeof payload == 'undefined') || (payload === null)){
        console.log('Server did not send a payload');
        return;
    }
    if(payload.result === 'fail'){
        console.log(payload.message);
        return;
    }
    let newNode = makeInvitedButton(payload.socket_id);
    $('.socket_'+payload.socket_id+' button').replaceWith(newNode);
})

socket.on('invited', (payload) =>{
    if(( typeof payload == 'undefined') || (payload === null)){
        console.log('Server did not send a payload');
        return;
    }
    if(payload.result === 'fail'){
        console.log(payload.message);
        return;
    }
    let newNode = makePlayButton(payload.socket_id);
    $('.socket_'+payload.socket_id+' button').replaceWith(newNode);
})

socket.on('uninvited', (payload) =>{
    if(( typeof payload == 'undefined') || (payload === null)){
        console.log('Server did not send a payload');
        return;
    }
    if(payload.result === 'fail'){
        console.log(payload.message);
        return;
    }
    let newNode = makeInviteButton(payload.socket_id);
    $('.socket_'+payload.socket_id+' button').replaceWith(newNode);
})


socket.on('game_start_response', (payload) =>{
    if(( typeof payload == 'undefined') || (payload === null)){
        console.log('Server did not send a payload');
        return;
    }
    if(payload.result === 'fail'){
        console.log(payload.message);
        return;
    }
    let newNode = makeStartGameButton();
    $('.socket_'+payload.socket_id+' button').replaceWith(newNode);
    window.location.href = 'game.html?username='+username+'&game_id='+payload.game_id;
})

socket.on('join_room_response', (payload) =>{
    if(( typeof payload == 'undefined') || (payload === null)){
        console.log('Server did not send a payload');
        return;
    }
    if(payload.result === 'fail'){
        console.log(payload.message);
        return;
    }

    if (payload.socket_id === socket.id){
        return;
    }

    let domElements = $('.socket_'+payload.socket_id);

    if (domElements.length != 0){
        return;
    }


    let nodeA = $("<div></div>");
    nodeA.addClass("row");
    nodeA.addClass("align-items-center");
    nodeA.addClass("socket_"+payload.socket_id);
    nodeA.hide();

    let nodeB = $("<div></div>");
    nodeB.addClass("col");
    nodeB.addClass("text-end");
    nodeB.addClass("socket_"+payload.socket_id);
    nodeB.append('<h4>'+payload.username+"</h4>");

    let nodeC = $("<div></div>");
    nodeC.addClass("col");
    nodeC.addClass("text-start");
    nodeC.addClass("socket_"+payload.socket_id);
    let buttonC = makeInviteButton(payload.socket_id);
    nodeC.append(buttonC);
    
    nodeA.append(nodeB);
    nodeA.append(nodeC);

    $("#players").append(nodeA);
    nodeA.show("fade", 1000);

    let newHTML = '<p class=\'join_room_response\'>'+payload.username+' вошел в чат. (В зале ожидания находятся '+payload.count+' человек)</p>';
    let newNode = $(newHTML);
    newNode.hide();    
    $('#messages').prepend(newNode);
    newNode.show("fade", 500);
})

socket.on('player_disconnected', (payload) =>{
    if(( typeof payload == 'undefined') || (payload === null)){
        console.log('Server did not send a payload');
        return;
    }

    if (payload.socket_id === socket.id){
        return;
    }

    let domElements = $('.socket_'+payload.socket_id);
    if(domElements.length !== 0){
        domElements.hide("fade", 500);
    }

    let newHTML = '<p class=\'left_room_response\'>'+payload.username+' покинул чат. (В зале ожидания находятся '+payload.count+' человек)</p>';
    let newNode = $(newHTML);
    newNode.hide();    
    $('#messages').prepend(newNode);
    newNode.show("fade", 500);
})

function sendChatMessage(){
    let request = {};
    request.room = chatRoom;
    request.username = username;
    request.message = $('#chatMessage').val();
    console.log('**** Client log message, sending \'send_chat_message\' command: '+JSON.stringify(request));
    socket.emit('send_chat_message',request);
    $('#chatMessage').val("");
}

socket.on('send_chat_message_response', (payload) =>{
    if(( typeof payload == 'undefined') || (payload === null)){
        console.log('Server did not send a payload');
        return;
    }
    if(payload.result === 'fail'){
        console.log(payload.message);
        return;
    }
    let newHTML = '<p class=\'chat_message\'><b>'+payload.username+'</b>: '+payload.message+'</p>';
    let newNode = $(newHTML);
    newNode.hide();
    $('#messages').prepend(newNode);
    newNode.show("fade", 500)
})

let old_board = [
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
];

let my_color = "";

let interval_timer;

socket.on('game_update', (payload) =>{
    if(( typeof payload == 'undefined') || (payload === null)){
        console.log('Server did not send a payload');
        return;
    }
    if(payload.result === 'fail'){
        console.log(payload.message);
        return;
    }
    let board = payload.game.board;
    if(( typeof board == 'undefined') || (board === null)){
        console.log('Server did not send a valid board to display');
        return;
    }

    if (socket.id === payload.game.player_white.socket){
        my_color = "white";
        $("#p1").html(payload.game.player_white.username);
        $("#p1-color").css("backgroundImage", `url(assets/images/piece_white.png)`);

        $("#p2").html(payload.game.player_black.username);
        $("#p2-color").css("backgroundImage", `url(assets/images/piece_black.png)`);
        $(`#p2-pieces`).addClass("text-light");
    }
    else if (socket.id === payload.game.player_black.socket){
        my_color = "black";
        $("#p1").html(payload.game.player_black.username);
        $("#p1-color").css("backgroundImage", `url(assets/images/piece_black.png)`);
        $(`#p1-pieces`).addClass("text-light");

        $("#p2").html(payload.game.player_white.username);
        $("#p2-color").css("backgroundImage", `url(assets/images/piece_white.png)`);
    }
    else{
        window.location.href = "lobby.html?username=" + username;
        return;
    }

    if (payload.game.whose_turn === my_color){
        $("#my_turn").html('Ваш ход');
    }
    else {
        $("#my_turn").html('Ход противника');
    }

    let whitesum = 0;
    let blacksum = 0;

    for (let row = 0; row < 8; row++){
        for (let col = 0; col < 8; col++){
            if (board[row][col] === 'w'){
                whitesum++;
            }
            else if (board[row][col] === 'b'){
                blacksum++;
            }

            if (old_board[row][col] !== board[row][col]){
                let graphic = "empty.png";
                let altTag = "empty";
                if ((old_board[row][col] === ' ') && (board[row][col] === 'w')){
                    graphic = "piece_white.png";
                    altTag = "white";
                }
                else if ((old_board[row][col] === ' ') && (board[row][col] === 'b')){
                    graphic = "piece_black.png";
                    altTag = "black";
                }
                else if ((old_board[row][col] === 'b') && (board[row][col] === 'w')){
                    graphic = "piece_white.png";
                    altTag = "white";
                }
                else if ((old_board[row][col] === 'w') && (board[row][col] === 'b')){
                    graphic = "piece_black.png";
                    altTag = "black";
                }
                const t = Date.now();
                $('#'+row+'_'+col).html('<img class="img-fluid" src="assets/images/' +graphic+'?time='+t+'" alt="'+altTag+'" />');
            }
            else if (board[row][col] === ' '){
                $('#'+row+'_'+col).html("");
            }

            $('#'+row+'_'+ col).off('click');

            if (payload.game.whose_turn === my_color){
                if (payload.game.legal_moves[row][col] === my_color.substr(0, 1)){
                    const t = Date.now();
                    $('#'+row+'_'+col).html('<img class="img-fluid piece_placeholder" src="assets/images/piece_' +my_color+'.png?time='+t+'" alt="'+my_color+'" />');
                    $('#'+row+'_'+col).click(((r,c) => {
                        return (() => {
                            let payload = {
                                row: r,
                                column: c,
                                color: my_color
                            };
                            console.log('**** Client log message, sending \'play_token\' command: '+JSON.stringify(payload));
                            socket.emit('play_token', payload);
                        });
                    })(row, col));
                }
            }
        }
    }

    clearInterval(interval_timer);
    interval_timer = setInterval(((last_time) => {
        return (() => {
            let d = new Date();
            let elapsed_m = d.getTime() - last_time;
            let minutes = Math.floor((elapsed_m/1000)/60);
            let seconds = Math.floor((elapsed_m % (60 * 1000))/1000);
            let total = minutes * 60 + seconds;
            if (total > 100){
                total = 100;
            }
            $("#elapsed").css("width", total+"%").attr("aria-valuenow", total);
            let timestring = ""+seconds;
            timestring = timestring.padStart(2, '0');
            timestring = minutes + ":" + timestring;
            if (total >= 100){
                $("#elapsed").html("Times up!");
            }
            else{
                $("#elapsed").html(timestring);
            }
        })
    })(payload.game.last_move_time), 1000);
    
    if (my_color === "white"){
        $('#p1-pieces').html(whitesum);
        $('#p2-pieces').html(blacksum);
    }
    else{
        $('#p2-pieces').html(whitesum);
        $('#p1-pieces').html(blacksum);
    }
    
    old_board = board;
})

socket.on('play_token_response', (payload) =>{
    if(( typeof payload == 'undefined') || (payload === null)){
        console.log('Server did not send a payload');
        return;
    }
    if(payload.result === 'fail'){
        console.log(payload.message);
        alert(payload.message);
        return;
    }
})

socket.on('game_over', (payload) =>{
    if(( typeof payload == 'undefined') || (payload === null)){
        console.log('Server did not send a payload');
        return;
    }
    if(payload.result === 'fail'){
        console.log(payload.message);
        return;
    }

    let message = "Ничья!";
    let url = "assets/images/draw.png";

    if (payload.who_won !== ""){
        message = payload.who_won + " победил!";
        url = "assets/images/win.gif"; 
    }

    Swal.fire({
        text: message,
        imageUrl: url,
        imageWidth: 300,
        imageHeight: 300,
        confirmButtonColor: '#42724e',
        confirmButtonText: 'ок',

    }).then(() => {
        window.location.href = 'lobby.html?username=' + username;
    });
});

$( () => {
    let request = {};
    request.room = chatRoom;
    request.username = username;
    console.log('**** Client log message, sending \'join_room\' command: '+JSON.stringify(request));
    socket.emit('join_room',request);

    $('#lobbyTitle').html(username+": зал ожидания");
    $('#quit').attr("href", "'lobby.html?username=" + username + "' role='button'");

    $('#chatMessage').keypress(function (e) {
        let key = e.which;
        if (key == 13) {
            $('button[id = chatButton]').click();
            return false;
        }
    });
});