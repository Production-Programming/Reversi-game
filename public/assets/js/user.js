$( () => {
    $('#menu').attr("href", "menu.html?username=" + username);
    socket.emit('get_user', username);
    socket.emit('get_games', username);
});