var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

var PORT = 8080;
var DEBUG = true;

var rooms =[];

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  if(DEBUG)console.log('a user connected');

  socket.on('join', (args) => {
    const info = JSON.parse(args);
    socket.matchId = info.mid;
    //socket.join(`game/${info.mid}`);
    socket.join(`game/${socket.matchId}`);
    
    let room = rooms[info.mid];
    if(room == undefined){
        // Creation de la room si elle n'existe pas
        if(DEBUG)console.log("Creation de la room "+info.mid)
        rooms[info.mid]= {
        boardTypeId: 1,
        firstPlayerIndex: (Math.floor(Math.random() * 2)),
        totalPlayers: parseInt(info.totalPlayers),
        players: [],
        lastPlayerId: -1,
        };
    }
    // Ajout du player 
    socket.pid = info.pid;
    socket.playerName = info.playerName;
    socket.gameId = rooms[info.mid].players.length;
    rooms[info.mid].players.push({ 
        id: rooms[info.mid].players.length,
        playerName: info.playerName,
        pid: info.pid,
    });

    // Verification room complete
    if(rooms[info.mid].players.length == rooms[info.mid].totalPlayers)
    {
        // Lance la partie
        if(DEBUG) console.log(`Start game ${info.mid}`);
        io.to(`game/${info.mid}`).emit('start', rooms[info.mid]);
    }

  });

  socket.on('leftRoom', (args) => {
    if(socket.matchId != undefined){
        if(DEBUG) console.log('a user left room '+socket.matchId); 
        socket.leave(`game/${socket.matchId}`);
        RemovePlayerFromRoom(socket.matchId, socket.gameId);
        io.to(`game/${socket.matchId}`).emit('userLeft', socket.playerName, socket.pid, socket.gameId);
        socket.matchId = undefined;
        socket.gameId = undefined;
    }
  });

  socket.on('add', (args) => {
    const info = JSON.parse(args);
    if(DEBUG) console.log("Player "+ info.id+" clic on "+info.loc.x+","+info.loc.y);
    rooms[socket.matchId].lastPlayerId = info.id;
    io.to(`game/${socket.matchId}`).emit('msg', args);
  });

  socket.on("disconnect", () => {
    if(DEBUG) console.log('a user disconnected'); 
    if(socket.matchId != undefined){
        socket.leave(`game/${socket.matchId}`);
        RemovePlayerFromRoom(socket.matchId, socket.gameId);
        io.to(`game/${socket.matchId}`).emit('userLeft',socket.playerName, socket.pid, socket.gameId );
        socket.matchId = undefined;
        socket.gameId = undefined;
    }
  });
});

function RemovePlayerFromRoom(roomId, playerGameId){
    if(rooms[roomId]== undefined)return;
    DeleteArrayElement(rooms[roomId].players, playerGameId);
    if(rooms[roomId].players.length == 0){
        DeleteRoom(roomId);
        if(DEBUG) console.log('Suppression de la room '+roomId);
    }
}

function DeleteRoom(matchId){
    const index = rooms.indexOf(matchId);
    if (index > -1) {
        rooms.splice(index, 1);
    }
}
function DeleteArrayElement(array, index){
    const _index = array.findIndex(a => a.id === index);
    if (_index > -1) {
        array.splice(_index, 1);
    }
}

http.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});