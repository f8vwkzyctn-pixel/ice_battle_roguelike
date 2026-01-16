const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(express.static('.'));

const rooms = new Map();

io.on('connection', (socket) => {
    console.log(`Игрок подключился: ${socket.id}`);
    
    socket.on('create_room', (data) => {
        const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        rooms.set(roomId, {
            id: roomId,
            players: [socket.id],
            mode: data.mode,
            maxPlayers: data.maxPlayers,
            gameState: {}
        });
        
        socket.join(roomId);
        socket.emit('room_created', { room: rooms.get(roomId) });
        console.log(`Комната создана: ${roomId}`);
    });
    
    socket.on('join_room', (data) => {
        const room = rooms.get(data.roomId);
        if (room && room.players.length < room.maxPlayers) {
            room.players.push(socket.id);
            socket.join(data.roomId);
            
            socket.emit('player_joined', { player: data.player });
            socket.to(data.roomId).emit('player_joined', { 
                player: { id: socket.id, ...data.player }
            });
            
            console.log(`Игрок ${socket.id} присоединился к комнате ${data.roomId}`);
        }
    });
    
    socket.on('game_update', (data) => {
        socket.to(data.roomId).emit('game_state', data);
    });
    
    socket.on('disconnect', () => {
        console.log(`Игрок отключился: ${socket.id}`);
        rooms.forEach((room, roomId) => {
            room.players = room.players.filter(id => id !== socket.id);
            if (room.players.length === 0) {
                rooms.delete(roomId);
            }
        });
    });
});

server.listen(3000, () => {
    console.log('Сервер запущен на порту 3000');
});