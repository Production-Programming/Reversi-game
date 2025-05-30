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

function goToMenuRegistration(){
    let user = {};
    user.username = encodeURI($('#loginInput').val());
    user.first_name = encodeURI($('#nameInput').val());
    user.last_name = encodeURI($('#surnameInput').val());
    user.password = encodeURI($('#passwordInput').val());
    user.email = encodeURI($('#emailInput').val());

    socket.emit('add_user',user);
}

function goToMenuLogin(){
    let user_info = {};
    user_info.username = encodeURI($('#loginInput').val());
    user_info.password = encodeURI($('#passwordInput').val());
    
    socket.emit('login', user_info);
}

function goToLobby(){
    window.location.href = "lobby.html?username="+username;
}

function goToLocalGame(){
    window.location.href = "local-game.html?username="+username;
}

function finishGame(){
    let payload = {
        result: 'success',
        game_id: chatRoom,
        username: username
    }
    socket.emit('game_over', payload);
}

function changeUser(){
    let user = {};
    user.username = username;
    user.first_name = encodeURI($('#nameInput').val());
    user.last_name = encodeURI($('#surnameInput').val());
    user.password = encodeURI($('#passwordInput').val());
    user.email = encodeURI($('#emailInput').val());

    socket.emit('change_user', user);
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
    let newHTML = "<button type='button' class='btn invite-btn'>Пригласить</button>";
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
    let newHTML = "<button type='button' class='btn invited-btn'>Приглашен</button>";
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
    let newHTML = "<button type='button' class='btn play-btn'>Играть</button>";
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

socket.on('add_user_response', (payload) =>{
    if(( typeof payload == 'undefined') || (payload === null)){
        console.log('Server did not send a user info');
        return;
    }
    if(payload.result === 'fail'){
        console.log(payload.message);
        Swal.fire({
            text: payload.message,
            confirmButtonColor: '#42724e',
            confirmButtonText: 'ок',
    
        })
        return;
    }
    else{
        console.log(payload.message);
        window.location.href = "menu.html?username="+payload.username;
    }
});

socket.on('login_response', (payload) =>{
    if(( typeof payload == 'undefined') || (payload === null)){
        console.log('Server did not send a user info');
        return;
    }
    if(payload.result === 'fail'){
        console.log(payload.message);
        Swal.fire({
            text: payload.message,
            confirmButtonColor: '#42724e',
            confirmButtonText: 'ок',
    
        })
        return;
    }
    else{
        console.log(payload.message);
        window.location.href = "menu.html?username="+payload.username;
    }
});

socket.on('change_user_response', (payload) =>{
    if(( typeof payload == 'undefined') || (payload === null)){
        console.log('Server did not send a user info');
        return;
    }
    if(( typeof payload == 'undefined') || (payload === null)){
        console.log('Server did not send a payload');
        return;
    }
    if(payload.result === 'fail'){
        console.log(payload.message);
        Swal.fire({
            text: payload.message,
            confirmButtonColor: '#42724e',
            confirmButtonText: 'ок',
        });
        return;
    }
    else{
        Swal.fire({
            text: "Данные успешно изменены.",
            confirmButtonColor: '#42724e',
            confirmButtonText: 'ок',
        });
    }
});

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
    nodeA.addClass("players-list")
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

    let newHTML = '<p class=\'join-room-response\'>Пользователь '+payload.username+' вошел в чат. (В зале ожидания находятся '+payload.count+' человек)</p>';
    if (payload.room !== "зал ожидания"){
        newHTML = '<p class=\'join-room-response\'>Пользователь '+payload.username+' приесоединился к игре.</p>';
    }
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

    let newHTML = '<p class=\'left-room-response\'>Пользователь '+payload.username+' покинул чат. (В зале ожидания находятся '+payload.count+' человек)</p>';
    if (payload.room !== "зал ожидания"){
        newHTML = '<p class=\'left-room-response\'>Пользователь '+payload.username+' покинул игру.</p>';
    }
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
    let newHTML = '<p class=\'chat-message\'><b>'+payload.username+'</b>: '+payload.message+'</p>';
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
                $("#elapsed").html("Время вышло!");
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

socket.on('game_over_response', (payload) =>{
    if(( typeof payload == 'undefined') || (payload === null)){
        console.log('Server did not send a payload');
        return;
    }
    if(payload.result === 'fail'){
        console.log(payload.message);
        Swal.fire({
            text: payload.message,
            confirmButtonColor: '#42724e',
            confirmButtonText: 'ок',
        }).then(() => {
            window.location.href = 'lobby.html?username=' + username;
        });
        return;
    }

    let message = "Ничья!";
    let url = "assets/images/draw.png";

    if (payload.who_won !== ""){
        message = "Игрок " + payload.who_won + " победил!";
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

socket.on('get_user_response', (payload) =>{
    if(( typeof payload == 'undefined') || (payload === null)){
        console.log('Server did not send a payload');
        return;
    }
    if(payload.result === 'fail'){
        console.log(payload.message);
        Swal.fire({
            text: payload.message,
            confirmButtonColor: '#42724e',
            confirmButtonText: 'ок',
        });
        return;
    }

    $('#loginValue').html(payload.user.username)
    $('#nameInput').val(payload.user.first_name);
    $('#surnameInput').val(payload.user.last_name);
    $('#emailInput').val(payload.user.email);
});

socket.on('get_games_response', (payload) =>{
    if(( typeof payload == 'undefined') || (payload === null)){
        console.log('Server did not send a payload');
        return;
    }
    if(payload.result === 'fail'){
        console.log(payload.message);
        Swal.fire({
            text: payload.message,
            confirmButtonColor: '#42724e',
            confirmButtonText: 'ок',
        });
        return;
    }

    var html = "<table id=\"gamesTable\"><tr><th>Дата</th><th>Игрок 1</th><th>Игрок 2</th><th>Счет</th></tr>";
    for (let i = 0; i < payload.games.length; i++){
        var win_class = "winner";
        if (payload.games[i].winner !== username && payload.games[i].winner !== "" && payload.games[i].winner !== null){
            win_class = "loser";
        }
        html += '<tr class=\'' + win_class +'\'><td>'+payload.games[i].date.substring(0, 19).replace('T', ' ')+'</td><td>'+payload.games[i].first_player+'</td><td>'+payload.games[i].second_player+'</td><td>'+payload.games[i].first_player_points+' : '+payload.games[i].second_player_points+'</td></tr>';
    }
    html += "</table>";
    $('#games').html(html);
});