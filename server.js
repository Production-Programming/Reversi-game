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


const { Server } = require("socket.io")
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

    socket.on('disconnect', () => {
        serverLog('a page disconnected from the server: '+socket.id);
    });
})