/**
 * КЛИЕНТ МУЛЬТИПЛЕЕРА
 * WebSocket соединение, комнаты, P2P
 */
class MultiplayerClient {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.room = null;
        this.players = {};
        this.playerId = null;
        this.mode = null; // 'pvp', 'coop'
        
        // Настройки
        this.config = {
            server: 'ws://localhost:3000', // Замени на реальный сервер
            reconnect: true,
            reconnectDelay: 3000,
            heartbeat: 5000,
            syncRate: 60 // FPS синхронизации
        };
    }
    
    connect() {
        if (this.connected) return;
        
        this.socket = new WebSocket(this.config.server);
        
        this.socket.onopen = () => {
            console.log('[MULTI] Подключено к серверу');
            this.connected = true;
            this.startHeartbeat();
        };
        
        this.socket.onmessage = (event) => {
            this.handleMessage(JSON.parse(event.data));
        };
        
        this.socket.onclose = () => {
            console.log('[MULTI] Отключено от сервера');
            this.connected = false;
            if (this.config.reconnect) {
                setTimeout(() => this.connect(), this.config.reconnectDelay);
            }
        };
        
        this.socket.onerror = (error) => {
            console.error('[MULTI] Ошибка:', error);
        };
    }
    
    handleMessage(data) {
        switch(data.type) {
            case 'welcome':
                this.playerId = data.playerId;
                console.log(`[MULTI] ID игрока: ${this.playerId}`);
                break;
                
            case 'room_created':
                this.room = data.room;
                console.log(`[MULTI] Комната создана: ${data.room.id}`);
                break;
                
            case 'player_joined':
                this.players[data.player.id] = data.player;
                console.log(`[MULTI] Игрок присоединился: ${data.player.name}`);
                break;
                
            case 'game_state':
                this.updateGameState(data.state);
                break;
                
            case 'chat':
                this.handleChat(data.message, data.player);
                break;
        }
    }
    
    createRoom(mode, maxPlayers = 4) {
        this.send({
            type: 'create_room',
            mode: mode,
            maxPlayers: maxPlayers,
            player: this.getPlayerData()
        });
    }
    
    joinRoom(roomId) {
        this.send({
            type: 'join_room',
            roomId: roomId,
            player: this.getPlayerData()
        });
    }
    
    sendGameUpdate(data) {
        if (!this.connected) return;
        
        this.send({
            type: 'game_update',
            playerId: this.playerId,
            roomId: this.room?.id,
            data: data,
            timestamp: Date.now()
        });
    }
    
    sendChat(message) {
        this.send({
            type: 'chat',
            playerId: this.playerId,
            message: message,
            timestamp: Date.now()
        });
    }
    
    send(data) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        }
    }
    
    startHeartbeat() {
        setInterval(() => {
            if (this.connected) {
                this.send({ type: 'ping' });
            }
        }, this.config.heartbeat);
    }
    
    getPlayerData() {
        return {
            id: this.playerId,
            name: localStorage.getItem('playerName') || 'Игрок',
            level: 1,
            character: 'default'
        };
    }
    
    updateGameState(state) {
        // Обновление состояния игры от сервера
        // В реальной игре здесь синхронизация всех игроков
    }
    
    handleChat(message, player) {
        console.log(`[ЧАТ] ${player.name}: ${message}`);
        // Добавление в игровой чат
    }
}

// Глобальный экземпляр
window.Multiplayer = new MultiplayerClient();