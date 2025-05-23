let static = require('node-static');

let http = require('http');

if ((typeof port == 'undefined') || (port === null)) {
    port = 8080;
    directory = './public';
}

let file = new static.Server(directory);

let app = http.createServer(
    function(request, response) {
        request.addListener('end',
            function(){
                file.serve(request, response);
            }
        ).resume();
    }
).listen(port);

console.log("The server is running")

let players = [];

const { Server } = require("socket.io");
const { count } = require('console');
const io = new Server(app);

io.on('connection', (socket) => {
    function serverLog(...messages){
        io.emit('log',['**** Message from the server:\n']);
        messages.forEach((item) => {
            io.emit('log',['****\t'+item]);
            console.log(item);
        })
    }

    serverLog('a page connected to the server: '+socket.id);

    socket.on('invite', (payload) => {
        serverLog('Server received a command','\'invite\'',JSON.stringify(payload));
        if ((typeof payload == 'undefined') || (payload === null)) {
            response = {};
            response.result = 'fail';
            response.message = 'client did not send the payload';
            socket.emit('invite_response', response);
            serverLog('invite command failed', JSON.stringify(response));
            return;
        }
        let requested_user = payload.requested_user;
        let room = players[socket.id].room;
        let username = players[socket.id].username;
        if ((typeof requested_user == 'undefined') || (requested_user === null) || (requested_user === "")) {
            response = {
                result:'fail',
                message:'client did not send the valid user to invite to play'
            }
            socket.emit('invite_response', response);
            serverLog('invite command failed', JSON.stringify(response));
            return;
        }
        if ((typeof room == 'undefined') || (room === null) || (room === "")) {
            response = {
                result:'fail',
                message:'the user that was invited in not in a room'
            }
            socket.emit('invite_response', response);
            serverLog('invite command failed', JSON.stringify(response));
            return;
        }
        if ((typeof username == 'undefined') || (username === null) || (username == "")) {
            response = {
                result:'fail',
                message:'the user that was invited does not have a name registered'
            }
            socket.emit('invite_response', response);
            serverLog('invite command failed', JSON.stringify(response));
            return;
        }

        io.in(room).allSockets().then((sockets)=>{
            if ((typeof sockets == 'undefined') || (sockets === null) || !sockets.has(requested_user)){
                response = {
                    result:'fail',
                    message:'the user that was invited is no longer in the room'
                }
                socket.emit('invite_response', response);
                serverLog('invite command failed', JSON.stringify(response));
            }
            else{
                response = {
                    result:'success',
                    socket_id: requested_user
                }
                socket.emit("invite_response", response);

                response = {
                    result:'success',
                    socket_id: socket.id
                }
                socket.to(requested_user).emit("invited", response);
                serverLog('invite command succeded', JSON.stringify(response));
            }
        });
    });

    socket.on('uninvite', (payload) => {
        serverLog('Server received a command','\'uninvite\'',JSON.stringify(payload));
        if ((typeof payload == 'undefined') || (payload === null)) {
            response = {};
            response.result = 'fail';
            response.message = 'client did not send the payload';
            socket.emit('uninvited', response);
            serverLog('uninvite command failed', JSON.stringify(response));
            return;
        }
        let requested_user = payload.requested_user;
        let room = players[socket.id].room;
        let username = players[socket.id].username;
        if ((typeof requested_user == 'undefined') || (requested_user === null) || (requested_user === "")) {
            response = {
                result:'fail',
                message:'client did not send the valid user to uninvite'
            }
            socket.emit('uninvited', response);
            serverLog('uninvite command failed', JSON.stringify(response));
            return;
        }
        if ((typeof room == 'undefined') || (room === null) || (room === "")) {
            response = {
                result:'fail',
                message:'the user that was uninvited is not in a room'
            }
            socket.emit('uninvited', response);
            serverLog('uninvite command failed', JSON.stringify(response));
            return;
        }
        if ((typeof username == 'undefined') || (username === null) || (username == "")) {
            response = {
                result:'fail',
                message:'the user that was uninvited does not have a name registered'
            }
            socket.emit('uninvited', response);
            serverLog('uninvite command failed', JSON.stringify(response));
            return;
        }

        io.in(room).allSockets().then((sockets)=>{
            if ((typeof sockets == 'undefined') || (sockets === null) || !sockets.has(requested_user)){
                response = {
                    result:'fail',
                    message:'the user that was uninvited is no longer in the room'
                }
                socket.emit('uninvited', response);
                serverLog('uninvite command failed', JSON.stringify(response));
            }
            else{
                response = {
                    result:'success',
                    socket_id: requested_user
                }
                socket.emit("uninvited", response);

                response = {
                    result:'success',
                    socket_id: socket.id
                }
                socket.to(requested_user).emit("uninvited", response);
                serverLog('uninvite command succeded', JSON.stringify(response));
            }
        });
    });

    socket.on('game_start', (payload) => {
        serverLog('Server received a command','\'game_start\'',JSON.stringify(payload));
        if ((typeof payload == 'undefined') || (payload === null)) {
            response = {};
            response.result = 'fail';
            response.message = 'client did not send the payload';
            socket.emit('game_start_response', response);
            serverLog('game_start command failed', JSON.stringify(response));
            return;
        }
        let requested_user = payload.requested_user;
        let room = players[socket.id].room;
        let username = players[socket.id].username;
        if ((typeof requested_user == 'undefined') || (requested_user === null) || (requested_user === "")) {
            response = {
                result:'fail',
                message:'client did not send the valid user to engage in play'
            }
            socket.emit('game_start_response', response);
            serverLog('game_start command failed', JSON.stringify(response));
            return;
        }
        if ((typeof room == 'undefined') || (room === null) || (room === "")) {
            response = {
                result:'fail',
                message:'the user that was engaged to play is not in a room'
            }
            socket.emit('game_start_response', response);
            serverLog('game_start command failed', JSON.stringify(response));
            return;
        }
        if ((typeof username == 'undefined') || (username === null) || (username == "")) {
            response = {
                result:'fail',
                message:'the user that was engaged to play does not have a name registered'
            }
            socket.emit('game_start_response', response);
            serverLog('game_start command failed', JSON.stringify(response));
            return;
        }

        io.in(room).allSockets().then((sockets)=>{
            if ((typeof sockets == 'undefined') || (sockets === null) || !sockets.has(requested_user)){
                response = {
                    result:'fail',
                    message:'the user that was engaged to play is no longer in the room'
                }
                socket.emit('game_start_response', response);
                serverLog('game_start command failed', JSON.stringify(response));
            }
            else{
                let game_id = Math.floor(1 + Math.random() * 0x100000).toString(16);
                response = {
                    result:'success',
                    game_id: game_id,
                    socket_id: requested_user
                }
                socket.emit("game_start_response", response);
                socket.to(requested_user).emit("game_start_response", response);
                serverLog('game_start command succeded', JSON.stringify(response));
            }
        });
    });

    socket.on('join_room', (payload) => {
        serverLog('Server received a command','\'join_room\'',JSON.stringify(payload));
        if ((typeof payload == 'undefined') || (payload === null)) {
            response = {};
            response.result = 'fail';
            response.message = 'client did not send the payload';
            socket.emit('join_room_response', response);
            serverLog('join_room command failed', JSON.stringify(response));
            return;
        }
        let room = payload.room;
        let username = payload.username;
        if ((typeof room == 'undefined') || (room === null)) {
            response = {};
            response.result = 'fail';
            response.message = 'client did not send a valid room to join';
            socket.emit('join_room_response', response);
            serverLog('join_room command failed', JSON.stringify(response));
            return;
        }
        if ((typeof username == 'undefined') || (username === null)) {
            response = {};
            response.result = 'fail';
            response.message = 'client did not send the valid username';
            socket.emit('join_room_response', response);
            serverLog('join_room command failed', JSON.stringify(response));
            return;
        }

        socket.join(room);

        io.in(room).fetchSockets().then((sockets)=>{
            
            if ((typeof sockets == 'undefined') || (sockets === null) || !sockets.includes(socket)){
                response = {};
                response.result = 'fail';
                response.message = 'Server internal error joining chat room';
                socket.emit('join_room_response', response);
                serverLog('join_room command failed', JSON.stringify(response));
            }
            else{
                players[socket.id] = {
                    username: username,
                    room: room
                }
                for (const member of sockets){
                    response = {
                        result: 'success',
                        socket_id: member.id,
                        room: players[member.id].room,
                        username: players[member.id].username,
                        count: sockets.length
                    }
                    io.of('/').to(room).emit('join_room_response', response);
                    serverLog('join_room succeeded', JSON.stringify(response));
                    if (room !== 'зал ожидания'){
                        send_game_update(socket, room, "initial update");
                    }
                }
            }
        });
    });

    socket.on('disconnect', () => {
        serverLog('a page disconnected from the server: '+socket.id);
        if ((typeof players[socket.id] != 'undefined') && (players[socket.id] != null)) {
            let payload = {
                username: players[socket.id].username,
                room: players[socket.id].room,
                count: Object.keys(players).length - 1,
                socket_id: socket.id
            };
            let room = players[socket.id].room;
            delete players[socket.id];
            io.of("/").to(room).emit('player_disconnected', payload);
            serverLog('player_dissconnected succeeded ', JSON.stringify(payload));
        }

    });

    socket.on('send_chat_message', (payload) => {
        serverLog('Server received a command','\'send_chat_message\'',JSON.stringify(payload));
        let response = {};
        if ((typeof payload == 'undefined') || (payload === null)) {
            response = {};
            response.result = 'fail';
            response.message = 'client did not send the payload';
            socket.emit('send_chat_message_response',response);
            serverLog('send_chat_message command failed', JSON.stringify(response));
            return;
        }
        let room = payload.room;
        let username = payload.username;
        let message = payload.message;
        if ((typeof room == 'undefined') || (room === null)){
            response = {};
            response.result = 'fail';
            response.message = 'client did not send a valid room to message';
            socket.emit('send_chat_message_response',response);
            serverLog('send_chat_message command failed', JSON.stringify(response));
            return;
        }
        if ((typeof username == 'undefined') || (username === null)){
            response = {};
            response.result = 'fail';
            response.message = 'client did not send the valid username';
            socket.emit('send_chat_message_response', response);
            serverLog('send_chat_message command failed', JSON.stringify(response));
            return;
        }
        if ((typeof message == 'undefined') || (message === null)){
            response = {};
            response.result = 'fail';
            response.message = 'client did not send the valid message';
            socket.emit('send_chat_message_response', response);
            serverLog('send_chat_message command failed', JSON.stringify(response));
            return;
        }

        response.result = 'success';
        response.username = username;
        response.room = room;
        response.message = message;
        io.of('/').to(room).emit('send_chat_message_response',response);
        serverLog('send_chat_message succeeded', JSON.stringify(response));
    });

    socket.on('play_token', (payload) => {
        serverLog('Server received a command','\'play_token\'',JSON.stringify(payload));
        let response = {};
        if ((typeof payload == 'undefined') || (payload === null)) {
            response = {};
            response.result = 'fail';
            response.message = 'client did not send the payload';
            socket.emit('play_token_response',response);
            serverLog('play_token command failed', JSON.stringify(response));
            return;
        }
        let player = players[socket.id];
        if ((typeof player == 'undefined') || (player === null)){
            response = {};
            response.result = 'fail';
            response.message = 'play_token came from unregistered player';
            socket.emit('play_token_response',response);
            serverLog('play_token command failed', JSON.stringify(response));
            return;
        }
        let username = player.username;
        if ((typeof username == 'undefined') || (username === null)){
            response = {};
            response.result = 'fail';
            response.message = 'play_token command did not come from a registered username';
            socket.emit('play_token_response',response);
            serverLog('play_token command failed', JSON.stringify(response));
            return;
        }

        let game_id = player.room;
        if ((typeof game_id == 'undefined') || (game_id === null)){
            response = {};
            response.result = 'fail';
            response.message = 'There was no valid game associated with play_token command';
            socket.emit('play_token_response',response);
            serverLog('play_token command failed', JSON.stringify(response));
            return;
        }

        let row = payload.row;
        if ((typeof row == 'undefined') || (row === null)){
            response = {};
            response.result = 'fail';
            response.message = 'There was no valid row associated with play_token command';
            socket.emit('play_token_response',response);
            serverLog('play_token command failed', JSON.stringify(response));
            return;
        }

        let col = payload.column;
        if ((typeof col == 'undefined') || (col === null)){
            response = {};
            response.result = 'fail';
            response.message = 'There was no valid column associated with play_token command';
            socket.emit('play_token_response',response);
            serverLog('play_token command failed', JSON.stringify(response));
            return;
        }

        let color = payload.color;
        if ((typeof color == 'undefined') || (color === null)){
            response = {};
            response.result = 'fail';
            response.message = 'There was no valid color associated with play_token command';
            socket.emit('play_token_response',response);
            serverLog('play_token command failed', JSON.stringify(response));
            return;
        }

        let game = games[game_id];
        if ((typeof game == 'undefined') || (game === null)){
            response = {};
            response.result = 'fail';
            response.message = 'There was no valid game associated with play_token command';
            socket.emit('play_token_response',response);
            serverLog('play_token command failed', JSON.stringify(response));
            return;
        }

        if (color !== game.whose_turn){
            let response = {
                result: "fail",
                message: "play_token played the wrong color. Incorrect turn"
            }
            socket.emit('play_token_response',response);
            serverLog('play_token command failed', JSON.stringify(response));
            return;
        }

        if ((game.whose_turn === 'white' && game.player_white.socket != socket.id)||
            (game.whose_turn === 'black' && game.player_black.socket != socket.id)){
            let response = {
                result: "fail",
                message: "play_token played the right color, but wrong player"
            }
            socket.emit('play_token_response',response);
            serverLog('play_token command failed', JSON.stringify(response));
            return;
        }

        response.result = 'success';
        socket.emit('play_token_response',response);

        if (color === "white"){
            game.board[row][col] = 'w';
            flip_tokens('w', row, col, game.board);
            game.whose_turn = "black";
            game.legal_moves = calculate_legal_moves('b', game.board);
        }
        else if (color === "black"){
            game.board[row][col] = 'b';
            flip_tokens('b', row, col, game.board);
            game.whose_turn = "white";
            game.legal_moves = calculate_legal_moves('w', game.board);
        }

        let d = new Date();
        game.last_move_time = d.getTime();

        send_game_update(socket, game_id, 'played a token');
    });
});

let games = [];

function create_new_game(){
    let new_game = {};
    new_game.player_white = {};
    new_game.player_white.socket = "";
    new_game.player_white.username = "";
    new_game.player_black = {};
    new_game.player_black.socket = "";
    new_game.player_black.username = "";

    var d = new Date()
    new_game.last_move_time = d.getTime();

    new_game.whose_turn = 'black';
    
    new_game.board = [
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', 'w', 'b', ' ', ' ', ' '],
        [' ', ' ', ' ', 'b', 'w', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    ];

    new_game.legal_moves = calculate_legal_moves('b', new_game.board);

    return new_game;
}

moveDirections = [
    { row: -1, col: 0 },
    { row: -1, col: 1 },
    { row: 0, col: 1 },
    { row: 1, col: 1 },
    { row: 1, col: 0 },
    { row: 1, col: -1 },
    { row: 0, col: -1 },
    { row: -1, col: -1 },
];

function check_line_match(color, dr, dc, r, c, board){
    if (board[r][c] === color){
        return true;
    }

    if (board[r][c] === ' '){
        return false;
    }

    if ((r + dr < 0) || (r + dr > 7) || (c + dc < 0) || (c + dc > 7)){
        return false;
    }

    return check_line_match(color, dr, dc, r + dr, c + dc, board);
}

function adjacent_support(who, dr, dc, r, c, board){
    let other;
    if (who === 'b'){
        other = 'w';
    }
    else if (who === 'w'){
        other = 'b';
    }
    else{
        log("Problem with whose turn");
        return false;
    }

    if ((r + dr < 0) || (r + dr > 7) || (c + dc < 0) || (c + dc > 7)){
        return false;
    }

    if (board[r + dr][c + dc] !== other){
        return false;
    }

    if ((r + 2 * dr < 0) || (r + 2 * dr > 7) || (c + 2 * dc < 0) || (c + 2 * dc > 7)){
        return false;
    }   

    return check_line_match(who, dr, dc, r + 2 * dr, c + 2 * dc, board);
}

function calculate_legal_moves(who, board){
    legal_moves = [
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    ];

    for (let row = 0; row < 8; row++){
        for (let col = 0; col < 8; col++){
            if (board[row][col] === ' '){
                let correct_position = false;
                moveDirections.forEach((direction) => {
                    if (adjacent_support(who, direction.row, direction.col, row, col, board)){
                        correct_position = true;
                    }
                });
                if (correct_position){
                    legal_moves[row][col] = who;
                }
            }
        }
    }

    return legal_moves;
}

function flip_line(who, dr, dc, r, c, board){
    if ((r + dr < 0) || (r + dr > 7) || (c + dc < 0) || (c + dc > 7)){
        return false;
    }

    if (board[r + dr][c + dc] === ' '){
        return false;
    }

    if (board[r + dr][c + dc] === who){
        return true;
    }
    else{
        if (flip_line(who, dr, dc, r + dr, c + dc, board)){
            board[r + dr][c + dc] = who;
            return true;
        }
        else{
            return false;
        }
    }
}

function flip_tokens(who, row, col, board){
    let correct_position = false;
    moveDirections.forEach((direction) => flip_line(who, direction.row, direction.col, row, col, board));
}

function send_game_update(socket, game_id, message){
    if ((typeof games[game_id] == "undefined") || (games[game_id] === null)){
        console.log("No game exists with game id:" + game_id + ". Making a new game for " + socket.id);
        games[game_id] = create_new_game();
    }

    io.of('/').to(game_id).allSockets().then( (sockets) => {

        const iterator = sockets[Symbol.iterator]();
        if (sockets.size >= 1){
            let first = iterator.next().value;
            if ((games[game_id].player_white.socket !== first) &&
                (games[game_id].player_black.socket !== first)){
                    if (games[game_id].player_white.socket === ""){
                        console.log("White player is assigned to: " + first);
                        games[game_id].player_white.socket = first;
                        games[game_id].player_white.username = players[first].username;
                    }
                    else if (games[game_id].player_black.socket === ""){
                        console.log("Black player is assigned to: " + first);
                        games[game_id].player_black.socket = first;
                        games[game_id].player_black.username = players[first].username;
                    }
                    else{
                        console.log("Kicking " + first + " out of game: " + game_id);
                        io.in(first).socketsLeave([game_id]);
                    }
                }
        }

        if (sockets.size >= 2){
            let second = iterator.next().value;
            if ((games[game_id].player_white.socket !== second) &&
                (games[game_id].player_black.socket !== second)){
                    if (games[game_id].player_white.socket === ""){
                        console.log("White player is assigned to: " + second);
                        games[game_id].player_white.socket = second;
                        games[game_id].player_white.username = players[second].username;
                    }
                    else if (games[game_id].player_black.socket === ""){
                        console.log("Black player is assigned to: " + second);
                        games[game_id].player_black.socket = second;
                        games[game_id].player_black.username = players[second].username;
                    }
                    else{
                        console.log("Kicking " + second + " out of game: " + game_id);
                        io.in(second).socketsLeave([game_id])
                    }
                }
        }
        let payload = {
            result: "success",
            game_id: game_id,
            game: games[game_id],
            message: message
        };
        io.of("/").to(game_id).emit('game_update', payload);
    });

    let legal_moves = 0;
    let whitesum = 0;
    let blacksum = 0;

    for (let row = 0; row < 8; row++){
        for (let col = 0; col < 8; col++){
            if (games[game_id].legal_moves[row][col] !== ' '){
                legal_moves++;
            }
            if (games[game_id].board[row][col] === 'w'){
                whitesum++;
            }
            if (games[game_id].board[row][col] === 'b'){
                blacksum++;
            }
        }
    }

    if (legal_moves === 0){
        let winner = "";
        if (whitesum > blacksum){
            winner = games[game_id].player_white.username;
        }
        if (whitesum < blacksum){
            winner = games[game_id].player_black.username;
        }
        let payload = {
            result: 'success',
            game_id: game_id,
            game: games[game_id],
            who_won: winner
        }
        io.in(game_id).emit('game_over', payload);

        setTimeout(((id) => {
            return (() => {
                delete games[id];
            });
        })(game_id), 60 * 60 * 1000);
    }
}