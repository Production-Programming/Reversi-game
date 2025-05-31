const logger = require('./logger');
const sendAlert = require('./mailer');

let static = require('node-static');
let http = require('http');
let { Pool } = require('pg');
const bcrypt = require('bcrypt');
const validator = require('validator');

const pool = new Pool({
     user: 'admin',
     host: 'dpg-d0lmhcffte5s739m1ri0-a.frankfurt-postgres.render.com',
     database: 'reversi',
     password: 'aaQoPC71ppliF1uq3bMSkDd23jXCA31Z',
     port: 5432,
     ssl: true,
});

async function getUserByUsername(username) {
    try {
      logger.info(`getUserByUsername: получение пользователя "${username}"`);
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM public.users WHERE username = \'' + username + '\'');
      logger.info(`getUserByUsername: результат - ${JSON.stringify(result.rows)}`);
      client.release();
      return result.rows;
    } catch (err) {
      logger.error(`getUserByUsername: ошибка при получении пользователя "${username}"`, err);
      return null;
    }
}

async function addUser(user) {
    try {
      logger.info(`addUser: попытка добавить пользователя ${user.username}`);
      const client = await pool.connect();
      const result = await pool.query('INSERT INTO public.users (username, first_name, last_name, password, email) VALUES ($1, $2, $3, $4, $5) RETURNING *', [user.username, user.first_name, user.last_name, await bcrypt.hash(user.password, 10), user.email]);
      logger.info(`addUser: пользователь ${user.username} добавлен успешно`);
      logger.info(result.rows);
      client.release();
      return result.rows;
    } catch (err) {
      logger.error(`addUser: ошибка при добавлении пользователя ${user.username} -`, err);
      return null;
    }
}

async function changeUser(user) {
    try {
      logger.info(`changeUser: обновление пользователя "${user.username}"`);
      const client = await pool.connect();
      const result = await pool.query('UPDATE public.users SET first_name=$1, last_name=$2, password=$3, email=$4 WHERE username=$5 RETURNING *', [user.first_name, user.last_name, user.password, user.email, user.username]);
      logger.info(`changeUser: результат обновления: ${JSON.stringify(result.rows[0])}`);
      client.release();
      return result.rows;
    } catch (err) {
      logger.error(`changeUser: ошибка при обновлении пользователя "${user.username}"`, err);
      return null;
    }
}

async function getUserGames(username){
    try {
        logger.info(`getUserGames: получение игр пользователя "${username}"`);
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM public.games WHERE first_player = \'' + username + '\' OR second_player = \'' + username+ '\' ORDER BY date DESC');
        logger.info(`getUserGames: найдено ${result.rows.length} игр`);
        client.release();
        return result.rows;
      } catch (err) {
        logger.error(`getUserGames: ошибка при получении игр пользователя "${username}"`, err);
        return null;
      }
}

async function addGame(game) {
    try {
      logger.info(`addGame: добавление игры ${game.game_id}`);
      const client = await pool.connect();
      const result = await pool.query('INSERT INTO public.games (game_id, date, first_player, second_player, winner, first_player_points, second_player_points) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [game.game_id, game.date, game.first_player, game.second_player, game.winner, game.first_player_points, game.second_player_points]);
      logger.info(`addGame: игра ${game.game_id} успешно добавлена`);
      client.release();
      return result.rows;
    } catch (err) {
      logger.error(`addGame: ошибка при добавлении игры ${game.game_id}`, err);
      return null;
    }
}

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

logger.info("The server is running")

let players = [];

const { Server } = require("socket.io");
const { count } = require('console');
const io = new Server(app);

io.on('connection', (socket) => {
    function serverLog(...messages){
        messages.forEach((msg) => {
            logger.info(msg);
            io.emit('log', ['****\t' + msg]);
    });
    }

    serverLog('a page connected to the server: '+socket.id);
    logger.info(`[connection] Новый пользователь подключен: socket.id=${socket.id}`);

    socket.on('add_user', async (payload) => {
        serverLog('Server received a command','\'add_user\'', JSON.stringify(payload));
        if ((typeof payload == 'undefined') || (payload === null)) {
            response = {};
            response.result = 'fail';
            response.message = 'client did not send the payload';
            socket.emit('add_user_response', response);
            logger.error('add user command failed', JSON.stringify(response));
            sendAlert('add_user: empty payload', `Socket ID: ${socket.id}`);
            return;
        }

        if ((typeof payload.username == 'undefined') || validator.isEmpty(payload.username)) {
            response = {};
            response.result = 'fail';
            response.message = 'Поле "Логин" является обязательным. Заполните его и попробуйте еще раз.';
            socket.emit('add_user_response', response);
            logger.error('add user command failed', JSON.stringify(response));
            sendAlert('add_user: login is missing', `Socket ID: ${socket.id}`);
            return;
        }

        if ((typeof payload.username == 'undefined') || validator.isEmpty(payload.first_name)) {
            response = {};
            response.result = 'fail';
            response.message = 'Поле "Имя" является обязательным. Заполните его и попробуйте еще раз.';
            socket.emit('add_user_response', response);
            logger.error('add user command failed', JSON.stringify(response));
            sendAlert('add_user: name is missing', `username: ${payload.username}, socket.id: ${socket.id}`);
            return;
        }

        if ((typeof payload.username == 'undefined') || validator.isEmpty(payload.last_name)) {
            response = {};
            response.result = 'fail';
            response.message = 'Поле "Фамилия" является обязательным. Заполните его и попробуйте еще раз.';
            socket.emit('add_user_response', response);
            logger.error('add user command failed', JSON.stringify(response));
            sendAlert('add_user: surname is missing', `username: ${payload.username}, socket.id: ${socket.id}`);
            return;
        }

        if ((typeof payload.username == 'undefined') || validator.isEmpty(payload.password)) {
            response = {};
            response.result = 'fail';
            response.message = 'Поле "Пароль" является обязательным. Заполните его и попробуйте еще раз.';
            socket.emit('add_user_response', response);
            logger.error('add user command failed', JSON.stringify(response));
            sendAlert('add_user: password is missing', `username: ${payload.username}, socket.id: ${socket.id}`);
            return;
        }

        if ((typeof payload.username == 'undefined') || (!validator.isEmpty(payload.email) && !validator.isEmail(payload.email))) {
            response = {};
            response.result = 'fail';
            response.message = 'Поле "Почта" заполнено неверно. Попробуйте еще раз.';
            socket.emit('add_user_response', response);
            logger.error('add user command failed', JSON.stringify(response));
            sendAlert('add_user: invalid email', `username: ${payload.username}, email: ${payload.email}, socket.id: ${socket.id}`);
            return;
        }

        let check = await getUserByUsername(payload.username);
        if (check !== null && check.length > 0){
            response = {
                result:'fail',
                message:'Пользователь с таким логином уже существует!'
            }
            socket.emit('add_user_response', response);
            logger.error('add_user command failed', JSON.stringify(response));
            sendAlert('add_user: duplicate login', `username: ${payload.username}, socket.id: ${socket.id}`);
            return;
        }

        let result = await addUser(payload);
        if (result === null || result.length === 0){
            response = {
                result:'fail',
                message:'Ошибка при добавлении пользователя. Попробуйте еще раз позже!'
            }
            socket.emit('add_user_response', response);
            logger.error('add_user command failed', JSON.stringify(response));
            sendAlert('add_user: database error when adding', `username: ${payload.username}, socket.id: ${socket.id}`);
            return;
        }

        response = {
            result:'success',
            message:'Пользователь с именем' + payload.username + 'успешно зарегистрирован!',
            username: payload.username
        }
        logger.info(`[add_user] Пользователь "${payload.username}" успешно зарегистрирован [socket.id=${socket.id}]`);
        socket.emit('add_user_response', response);
    });

    socket.on('login', async (payload) => {
        serverLog('Server received a command','\'login\'', JSON.stringify(payload));
        if ((typeof payload == 'undefined') || (payload === null)) {
            response = {};
            response.result = 'fail';
            response.message = 'client did not send the payload';
            socket.emit('login_response', response);
            logger.error('login command failed', JSON.stringify(response));
            sendAlert('login: empty payload');
            return;
        }

        let result = await getUserByUsername(payload.username);
        if (result === null || result.length === 0){
            response = {
                result:'fail',
                message:'Неверный логин. Попробуйте еще раз!'
            }
            socket.emit('login_response', response);
            logger.error('login command failed', JSON.stringify(response));
            sendAlert('login: wrong login');
            return;
        }

        if (!await bcrypt.compare(payload.password, result[0].password)){
            response = {
                result:'fail',
                message:'Неверный пароль. Попробуйте еще раз!'
            }
            socket.emit('login_response', response);
            logger.error('login command failed', JSON.stringify(response));
            sendAlert('login: wrong password', `username: ${payload.username}, socket.id: ${socket.id}`);
            return;
        }

        response = {
            result:'success',
            message:'Пользователь с именем' + payload.username + 'успешно авторизован!',
            username: payload.username
        }
        logger.info(`[login] Пользователь "${payload.username}" успешно вошел в систему [socket.id=${socket.id}]`);
        socket.emit('login_response', response);
    });

    socket.on('change_user', async (payload) => {
        serverLog('Server received a command','\'change_user\'', JSON.stringify(payload));
        if ((typeof payload == 'undefined') || (payload === null)) {
            response = {};
            response.result = 'fail';
            response.message = 'client did not send the payload';
            socket.emit('change_user_response', response);
            logger.error('cahnge_user command failed', JSON.stringify(response));
            sendAlert('change_user: empty payload', `empty payload from socket.id=${socket.id}`);
            return;
        }

        if ((typeof payload.first_name == 'undefined') || validator.isEmpty(payload.first_name)) {
            response = {};
            response.result = 'fail';
            response.message = 'Поле "Имя" является обязательным. Заполните его и попробуйте еще раз.';
            socket.emit('change_user_response', response);
            logger.error('change_user command failed', JSON.stringify(response));
            sendAlert('change_user: no first_name', `There is no first_name [socket.id=${socket.id}]`);
            return;
        }

        if ((typeof payload.last_name == 'undefined') || validator.isEmpty(payload.last_name)) {
            response = {};
            response.result = 'fail';
            response.message = 'Поле "Фамилия" является обязательным. Заполните его и попробуйте еще раз.';
            socket.emit('change_user_response', response);
            logger.error('change_user command failed', JSON.stringify(response));
            sendAlert('change_user: no last_name', `There is no last_name [socket.id=${socket.id}]`);
            return;
        }

        if ((typeof payload.email == 'undefined') || (!validator.isEmpty(payload.email) && !validator.isEmail(payload.email))) {
            response = {};
            response.result = 'fail';
            response.message = 'Поле "Почта" заполнено неверно. Попробуйте еще раз.';
            socket.emit('change_user_response', response);
            logger.error('change_user command failed', JSON.stringify(response));
            sendAlert('ааа')
            sendAlert('change_user: incorrect email address', `incorrect email: "${payload.email}" [socket.id=${socket.id}]`);
            return;
        }

        let user = await getUserByUsername(payload.username);

        if ((typeof payload.password == 'undefined') || validator.isEmpty(payload.password)){
            payload.password = user[0].password;
        }
        else{
            payload.password = await bcrypt.hash(payload.password, 10);
        }

        let result = await changeUser(payload);
        if (result === null || result.length === 0){
            response = {
                result:'fail',
                message:'Ошибка при обновлении пользователя. Попробуйте еще раз позже!'
            }
            socket.emit('change_user_response', response);
            logger.error('change_user command failed', JSON.stringify(response));
            sendAlert('change_user: database error', `Database error during update ${payload.username}: ${err.message}`);
            return;
        }

        response = {
            result:'success',
            user: result[0]
        }
        logger.info(`[change_user] Пользователь "${payload.username}" успешно обновлен [socket.id=${socket.id}]`);
        socket.emit('change_user_response', response);
    });

    socket.on('invite', (payload) => {
        serverLog('Server received a command','\'invite\'',JSON.stringify(payload));
        if ((typeof payload == 'undefined') || (payload === null)) {
            response = {};
            response.result = 'fail';
            response.message = 'client did not send the payload';
            socket.emit('invite_response', response);
            logger.error('invite command failed', JSON.stringify(response));
            sendAlert('invite: empty payload', `empty payload от socket.id=${socket.id}`);
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
            logger.error('invite command failed', JSON.stringify(response));
            sendAlert('invite: no user to invite', `There is no invited user. socket.id=${socket.id}`);
            return;
        }
        if ((typeof room == 'undefined') || (room === null) || (room === "")) {
            response = {
                result:'fail',
                message:'the user that was invited in not in a room'
            }
            socket.emit('invite_response', response);
            logger.error('invite command failed', JSON.stringify(response));
            sendAlert('Invitation without a room', `Player: ${username} (socket: ${socket.id}) tries to invite, but not in the room.`);
            return;
        }
        if ((typeof username == 'undefined') || (username === null) || (username == "")) {
            response = {
                result:'fail',
                message:'the user that was invited does not have a name registered'
            }
            socket.emit('invite_response', response);
            logger.error('invite command failed', JSON.stringify(response));
            sendAlert('invite: unknown name', `Unknown name when trying to invite. socket.id=${socket.id}`);
            return;
        }

        io.in(room).allSockets().then((sockets)=>{
            if ((typeof sockets == 'undefined') || (sockets === null) || !sockets.has(requested_user)){
                response = {
                    result:'fail',
                    message:'the user that was invited is no longer in the room'
                }
                socket.emit('invite_response', response);
                logger.error('invite command failed', JSON.stringify(response));
                sendAlert('invite: invited user is no longer in the room', `Invited ${requested_user} not in a room ${room}`);
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
                logger.info(`[invite] Пользователь "${username}" пригласил "${requested_user}" в комнате "${room}" [socket.id=${socket.id}]`);
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
            logger.error('uninvite command failed', JSON.stringify(response));
            sendAlert('uninvite: empty payload', `empty payload from socket.id=${socket.id}`);
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
            logger.error('uninvite command failed', JSON.stringify(response));
            sendAlert('uninvite: no valid user to uninvite', `The user is not specified for uninvite. socket.id=${socket.id}`);
            return;
        }
        if ((typeof room == 'undefined') || (room === null) || (room === "")) {
            response = {
                result:'fail',
                message:'the user that was uninvited is not in a room'
            }
            socket.emit('uninvited', response);
            logger.error('uninvite command failed', JSON.stringify(response));
            sendAlert('Uninvite without a room', `Player: ${username ?? 'unknown'} (socket: ${socket.id})`);
            return;
        }
        if ((typeof username == 'undefined') || (username === null) || (username == "")) {
            response = {
                result:'fail',
                message:'the user that was uninvited does not have a name registered'
            }
            socket.emit('uninvited', response);
            logger.error('uninvite command failed', JSON.stringify(response));
            sendAlert('uninvite: unknown username', `unknown username from socket.id=${socket.id}`);
            return;
        }

        io.in(room).allSockets().then((sockets)=>{
            if ((typeof sockets == 'undefined') || (sockets === null) || !sockets.has(requested_user)){
                response = {
                    result:'fail',
                    message:'the user that was uninvited is no longer in the room'
                }
                socket.emit('uninvited', response);
                logger.error('uninvite command failed', JSON.stringify(response));
                sendAlert('uninvite: user is no longer in the room', `User ${requested_user} is no longer in a room ${room}`);
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
                logger.info(`[uninvite] Пользователь "${username}" отозвал приглашение для "${requested_user}" в комнате "${room}" [socket.id=${socket.id}]`);
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
            logger.error('game_start command failed', JSON.stringify(response));
            sendAlert('game_start error', `Empty payload received from socket.id=${socket.id}`);
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
            logger.error('game_start command failed', JSON.stringify(response));
            sendAlert('game_start error', `No opponent specified. socket.id=${socket.id}`);
            return;
        }
        if ((typeof room == 'undefined') || (room === null) || (room === "")) {
            response = {
                result:'fail',
                message:'the user that was engaged to play is not in a room'
            }
            socket.emit('game_start_response', response);
            logger.error('game_start command failed', JSON.stringify(response));
            sendAlert('Game started without a room', `Player: ${username ?? 'unknown'} (socket: ${socket.id}) tried to start a game`);
            return;
        }
        if ((typeof username == 'undefined') || (username === null) || (username == "")) {
            response = {
                result:'fail',
                message:'the user that was engaged to play does not have a name registered'
            }
            socket.emit('game_start_response', response);
            logger.error('game_start command failed', JSON.stringify(response));
            sendAlert('Game started from unknown user', `Missing username. Socket ID: ${socket.id}`);
            return;
        }

        io.in(room).allSockets().then((sockets)=>{
            if ((typeof sockets == 'undefined') || (sockets === null) || !sockets.has(requested_user)){
                response = {
                    result:'fail',
                    message:'the user that was engaged to play is no longer in the room'
                }
                socket.emit('game_start_response', response);
                logger.error('game_start command failed', JSON.stringify(response));
                sendAlert('game_start error', `Requested player (${requested_user}) not found in room ${room}`);
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
                logger.info(`[game_start] Игра запущена пользователем "${username}" с "${requested_user}". game_id=${response.game_id}, room="${room}", socket.id=${socket.id}`);
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
            logger.error('join_room command failed', JSON.stringify(response));
            sendAlert('join_room: empty payload', `Socket ID: ${socket.id}`);
            return;
        }
        let room = payload.room;
        let username = payload.username;
        if ((typeof room == 'undefined') || (room === null)) {
            response = {};
            response.result = 'fail';
            response.message = 'client did not send a valid room to join';
            socket.emit('join_room_response', response);
            logger.error('join_room command failed', JSON.stringify(response));
            sendAlert('join_room: missing room', `username: ${username ?? 'unspecified'}, socket.id: ${socket.id}`);
            return;
        }
        if ((typeof username == 'undefined') || (username === null)) {
            response = {};
            response.result = 'fail';
            response.message = 'client did not send the valid username';
            socket.emit('join_room_response', response);
            logger.error('join_room command failed', JSON.stringify(response));
            sendAlert('join_room: missing username', `room: ${room}, socket.id: ${socket.id}`);
            return;
        }

        socket.join(room);

        io.in(room).fetchSockets().then((sockets)=>{
            
            if ((typeof sockets == 'undefined') || (sockets === null) || !sockets.includes(socket)){
                response = {};
                response.result = 'fail';
                response.message = 'Server internal error joining chat room';
                socket.emit('join_room_response', response);
                logger.error('join_room command failed', JSON.stringify(response));
                sendAlert('join_room: internal error joining', `room: ${room}, username: ${username}, socket.id: ${socket.id}`);
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
                    logger.info(`[join_room] Пользователь "${username}" присоединился к комнате "${room}". Участников: ${sockets.length} [socket.id=${socket.id}]`);
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
            logger.info(`[disconnect] Пользователь "${payload.username}" отключился от комнаты "${room}" [socket.id=${socket.id}]`);
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
            logger.error('send_chat_message command failed', JSON.stringify(response));
            sendAlert('Message send error', `Payload is missing. Socket ID: ${socket.id}`);
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
            logger.error('send_chat_message command failed', JSON.stringify(response));
            sendAlert('Message send error', `Room is missing. Username: ${username ?? 'unknown'}, Socket ID: ${socket.id}`);
            return;
        }
        if ((typeof username == 'undefined') || (username === null)){
            response = {};
            response.result = 'fail';
            response.message = 'client did not send the valid username';
            socket.emit('send_chat_message_response', response);
            logger.error('send_chat_message command failed', JSON.stringify(response));
            sendAlert('Message send error', `Username is missing. Room: ${room}, Socket ID: ${socket.id}`);
            return;
        }
        if ((typeof message == 'undefined') || (message === null)){
            response = {};
            response.result = 'fail';
            response.message = 'client did not send the valid message';
            socket.emit('send_chat_message_response', response);
            logger.error('send_chat_message command failed', JSON.stringify(response));
            sendAlert('Message send error', `Message content is missing. Username: ${username}, Room: ${room}, Socket ID: ${socket.id}`);
            return;
        }

        response.result = 'success';
        response.username = username;
        response.room = room;
        response.message = message;
        io.of('/').to(room).emit('send_chat_message_response',response);
        logger.info(`[send_chat_message] "${username}" отправил сообщение в "${room}": "${message}" [socket.id=${socket.id}]`);
        serverLog('send_chat_message succeeded', JSON.stringify(response));
    });

    socket.on('play_token', async (payload) => {
        serverLog('Server received a command','\'play_token\'',JSON.stringify(payload));
        let response = {};
        if ((typeof payload == 'undefined') || (payload === null)) {
            response = {};
            response.result = 'fail';
            response.message = 'client did not send the payload';
            socket.emit('play_token_response',response);
            logger.error('play_token command failed', JSON.stringify(response));
            sendAlert('play_token error', `Payload not received from client. Socket ID: ${socket.id}`);
            return;
        }
        let player = players[socket.id];
        if ((typeof player == 'undefined') || (player === null)){
            response = {};
            response.result = 'fail';
            response.message = 'play_token came from unregistered player';
            socket.emit('play_token_response',response);
            logger.error('play_token command failed', JSON.stringify(response));
            sendAlert('play_token from unregistered player', `Socket ID: ${socket.id}`);
            return;
        }
        let username = player.username;
        if ((typeof username == 'undefined') || (username === null)){
            response = {};
            response.result = 'fail';
            response.message = 'play_token command did not come from a registered username';
            socket.emit('play_token_response',response);
            logger.error('play_token command failed', JSON.stringify(response));
            sendAlert('play_token error', `Username is missing. Socket ID: ${socket.id}`);
            return;
        }

        let game_id = player.room;
        if ((typeof game_id == 'undefined') || (game_id === null)){
            response = {};
            response.result = 'fail';
            response.message = 'There was no valid game associated with play_token command';
            socket.emit('play_token_response',response);
            logger.error('play_token command failed', JSON.stringify(response));
            sendAlert('play_token error', `No game (room) assigned to user ${username}. Socket ID: ${socket.id}`);
            return;
        }

        let row = payload.row;
        if ((typeof row == 'undefined') || (row === null)){
            response = {};
            response.result = 'fail';
            response.message = 'There was no valid row associated with play_token command';
            socket.emit('play_token_response',response);
            logger.error('play_token command failed', JSON.stringify(response));
            sendAlert('play_token error', `Invalid row sent by player ${username}. Socket ID: ${socket.id}`);
            return;
        }

        let col = payload.column;
        if ((typeof col == 'undefined') || (col === null)){
            response = {};
            response.result = 'fail';
            response.message = 'There was no valid column associated with play_token command';
            socket.emit('play_token_response',response);
            logger.error('play_token command failed', JSON.stringify(response));
            sendAlert('play_token error', `Invalid column sent by player ${username}. Socket ID: ${socket.id}`);
            return;
        }

        let color = payload.color;
        if ((typeof color == 'undefined') || (color === null)){
            response = {};
            response.result = 'fail';
            response.message = 'There was no valid color associated with play_token command';
            socket.emit('play_token_response',response);
            logger.error('play_token command failed', JSON.stringify(response));
            sendAlert('play_token error', `Disk color missing in payload from player ${username}. Socket ID: ${socket.id}`);
            return;
        }

        let game = games[game_id];
        if ((typeof game == 'undefined') || (game === null)){
            response = {};
            response.result = 'fail';
            response.message = 'There was no valid game associated with play_token command';
            socket.emit('play_token_response',response);
            logger.error('play_token command failed', JSON.stringify(response));
            sendAlert('play_token error', `Game not found. Game ID: ${game_id}, Player: ${username}, Socket ID: ${socket.id}`);
            return;
        }

        if (color !== game.whose_turn){
            let response = {
                result: "fail",
                message: "play_token played the wrong color. Incorrect turn"
            }
            socket.emit('play_token_response',response);
            logger.error('play_token command failed', JSON.stringify(response));
            sendAlert('Wrong turn error', `Player: ${username} (socket: ${socket.id}) played color: ${color}, expected: ${game.whose_turn}`);
            return;
        }

        if ((game.whose_turn === 'white' && game.player_white.socket != socket.id)||
            (game.whose_turn === 'black' && game.player_black.socket != socket.id)){
            let response = {
                result: "fail",
                message: "play_token played the right color, but wrong player"
            }
            socket.emit('play_token_response',response);
            logger.error('play_token command failed', JSON.stringify(response));
            sendAlert('Unauthorized player move', `Player: ${username} (socket: ${socket.id}) attempted to play as ${color}`);
            return;
        }

        response.result = 'success';
        socket.emit('play_token_response',response);
        logger.info(`[play_token] Ход от "${username}" (${color}) на (${row}, ${col}) в игре "${game_id}" [socket.id=${socket.id}]`);
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

        await send_game_update(socket, game_id, 'played a token');
    });

    socket.on('game_over', async (payload) => {
        serverLog('Server received a command','\'game_over\'',JSON.stringify(payload));
        if ((typeof payload == 'undefined') || (payload === null)) {
            response = {};
            response.result = 'fail';
            response.message = 'client did not send the payload';
            socket.emit('game_over_response',response);
            logger.error('game_over command failed', JSON.stringify(response));
            sendAlert('Game Over Error', `Payload is missing. Socket ID: ${socket.id}`);
            return;
        }

        winner = games[payload.game_id].player_white.username;

        if (winner === payload.username){
            winner = games[payload.game_id].player_black.username;
        }

        let white_points = 0;
        let black_points = 0;

        for (let row = 0; row < 8; row++){
            for (let col = 0; col < 8; col++){
                if (games[payload.game_id].board[row][col] == 'w'){
                    white_points += 1;
                }
                if (games[payload.game_id].board[row][col] == 'b'){
                    black_points += 1;
                }
            }
        }

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        let game_info = {};
        game_info.game_id = payload.game_id;
        game_info.date = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        game_info.first_player = games[payload.game_id].player_white.username;
        game_info.second_player = games[payload.game_id].player_black.username;
        game_info.winner = winner;
        game_info.first_player_points = white_points;
        game_info.second_player_points = black_points;

        let result = await addGame(game_info);
        if (result === null || result.length === 0){
            response = {
                result:'fail',
                message:'К сожалению, произошла ошибка при сохранении игры. Результат не зафиксирован.'
            }
            io.in(payload.game_id).emit('game_over_response', response);
            logger.error('game_over command failed', JSON.stringify(response));
            sendAlert('Game Over Error', `Failed to save game result. Game ID: ${payload.game_id}`);
            return;
        }

        let response = {
            result: 'success',
            game_id: payload.game_id,
            game: games[payload.game_id],
            who_won: winner
        }
        logger.info(`[game_over] Игра "${payload.game_id}" завершена. Победитель: "${winner}". Очки: белые=${white_points}, черные=${black_points}`);
        io.in(payload.game_id).emit('game_over_response', response);
    });

    socket.on('get_user', async (payload) => {
        serverLog('Server received a command','\'get_user\'',JSON.stringify(payload));
        if ((typeof payload == 'undefined') || (payload === null)) {
            response = {};
            response.result = 'fail';
            response.message = 'client did not send the payload';
            socket.emit('get_user_response',response);
            logger.error('get_user command failed', JSON.stringify(response));
            sendAlert('User Data Load Error', `Payload is missing. Socket ID: ${socket.id}`);
            return;
        }

        let result = await getUserByUsername(payload);
        if (result === null || result.length === 0){
            response = {
                result:'fail',
                message:'Ошибка сервера. Не удалось загрузить данные пользователя.'
            }
            socket.emit('get_user_response', response);
            logger.error('get_user command failed', JSON.stringify(response));
            sendAlert('User Data Load Error', `Failed to load user data for: ${payload}. Socket ID: ${socket.id}`);
            return;
        }

        let response = {
            result: 'success',
            user: result[0],
        }
        logger.info(`[get_user] Данные пользователя "${payload}" успешно получены`);
        socket.emit('get_user_response', response);
    });

    socket.on('get_games', async (payload) => {
        serverLog('Server received a command','\'get_games\'',JSON.stringify(payload));
        if ((typeof payload == 'undefined') || (payload === null)) {
            response = {};
            response.result = 'fail';
            response.message = 'client did not send the payload';
            socket.emit('get_games_response',response);
            logger.error('get_games command failed', JSON.stringify(response));
            sendAlert('Game Data Load Error', `Payload is missing. Socket ID: ${socket.id}`);
            return;
        }

        let result = await getUserGames(payload);
        if (result === null || result.length === 0){
            response = {
                result:'fail',
                message:'Ошибка сервера. Не удалось выгрузить игры.'
            }
            socket.emit('get_games_response', response);
            logger.error('get_games command failed', JSON.stringify(response));
            sendAlert('Game Data Load Error', `Failed to load games for user: ${payload}. Socket ID: ${socket.id}`);
            return;
        }

        let response = {
            result: 'success',
            games: result,
        }
        logger.info(`[get_games] Получены игры пользователя "${payload}"`);
        socket.emit('get_games_response', response);
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
        logger.error("Problem with whose turn");
        sendAlert("The problem with whose turn occured");
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

async function send_game_update(socket, game_id, message){
    if ((typeof games[game_id] == "undefined") || (games[game_id] === null)){
        logger.info("No game exists with game id:" + game_id + ". Making a new game for " + socket.id);
        games[game_id] = create_new_game();
    }

    io.of('/').to(game_id).allSockets().then( (sockets) => {

        const iterator = sockets[Symbol.iterator]();
        if (sockets.size >= 1){
            let first = iterator.next().value;
            if ((games[game_id].player_white.socket !== first) &&
                (games[game_id].player_black.socket !== first)){
                    if (games[game_id].player_white.socket === ""){
                        logger.info("White player is assigned to: " + first);
                        games[game_id].player_white.socket = first;
                        games[game_id].player_white.username = players[first].username;
                    }
                    else if (games[game_id].player_black.socket === ""){
                        logger.info("Black player is assigned to: " + first);
                        games[game_id].player_black.socket = first;
                        games[game_id].player_black.username = players[first].username;
                    }
                    else{
                        logger.info("Kicking " + first + " out of game: " + game_id);
                        io.in(first).socketsLeave([game_id]);
                    }
                }
        }

        if (sockets.size >= 2){
            let second = iterator.next().value;
            if ((games[game_id].player_white.socket !== second) &&
                (games[game_id].player_black.socket !== second)){
                    if (games[game_id].player_white.socket === ""){
                        logger.info("White player is assigned to: " + second);
                        games[game_id].player_white.socket = second;
                        games[game_id].player_white.username = players[second].username;
                    }
                    else if (games[game_id].player_black.socket === ""){
                        logger.info("Black player is assigned to: " + second);
                        games[game_id].player_black.socket = second;
                        games[game_id].player_black.username = players[second].username;
                    }
                    else{
                        logger.info("Kicking " + second + " out of game: " + game_id);
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

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        let game_info = {};
        game_info.game_id = game_id;
        game_info.date = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        game_info.first_player = games[game_id].player_white.username;
        game_info.second_player = games[game_id].player_black.username;
        game_info.winner = winner;
        game_info.first_player_points = whitesum;
        game_info.second_player_points = blacksum;

        let result = await addGame(game_info);
        if (result === null || result.length === 0){
            response = {
                result:'fail',
                message:'К сожалению, произошла ошибка при сохранении игры. Результат не зафиксирован.'
            }
            io.in(game_id).emit('game_over_response', response);
            logger.error('game_over command failed', JSON.stringify(response));
            sendAlert("An error occurred while saving the game. The result is not fixed.")
            setTimeout(((id) => {
                return (() => {
                    delete games[id];
                });
            })(game_id), 60 * 60 * 1000);
            return;
        }

        let payload = {
            result: 'success',
            game_id: game_id,
            game: games[game_id],
            who_won: winner
        }
        io.in(game_id).emit('game_over_response', payload);

        setTimeout(((id) => {
            return (() => {
                delete games[id];
            });
        })(game_id), 60 * 60 * 1000);
    }

    process.on('uncaughtException', (err) => {
        logger.error('Uncaught Exception:', err);
        sendAlert('Uncaught Exception', err.stack);
    });

    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Rejection:', reason);
        sendAlert('Unhandled Rejection', JSON.stringify(reason));
    });

}