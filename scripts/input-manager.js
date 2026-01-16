/**
 * УНИВЕРСАЛЬНЫЙ МЕНЕДЖЕР ВВОДА
 * Поддержка: Клавиатура, Геймпад (Xbox/PS), Тачскрин, Гибрид
 */
class InputManager {
    constructor() {
        // === СОСТОЯНИЕ УПРАВЛЕНИЯ ===
        this.state = {
            // Клавиатура
            keys: {},
            
            // Геймпад
            gamepads: [],
            gamepadIndex: -1,
            gamepadType: null, // 'xbox', 'ps', 'switch', 'unknown'
            
            // Мышь/Тач
            mouse: { x: 0, y: 0, down: false },
            touch: { x: 0, y: 0, active: false, id: null },
            
            // Вектор движения
            moveVector: { x: 0, y: 0 },
            
            // Действия
            actions: {
                attack: false,
                jump: false,
                dodge: false,
                interact: false,
                menu: false
            },
            
            // Мета-данные
            activeDevice: 'keyboard',
            deviceName: 'Unknown',
            connected: true
        };
        
        // === КОНФИГУРАЦИЯ УПРАВЛЕНИЯ ===
        this.config = {
            // Привязки клавиш
            keybindings: {
                up: ['KeyW', 'ArrowUp'],
                down: ['KeyS', 'ArrowDown'],
                left: ['KeyA', 'ArrowLeft'],
                right: ['KeyD', 'ArrowRight'],
                attack: ['Space', 'KeyJ', 'KeyZ'],
                jump: ['KeyK', 'KeyX'],
                dodge: ['ShiftLeft', 'KeyL', 'KeyC'],
                interact: ['KeyE', 'KeyF'],
                menu: ['Escape', 'KeyP']
            },
            
            // Конфигурация геймпадов
            gamepadProfiles: {
                'xbox': {
                    buttons: {
                        0: 'attack',    // A
                        1: 'jump',      // B
                        2: 'interact',  // X
                        3: 'dodge',     // Y
                        9: 'menu',      // Menu
                        8: 'menu'       // View
                    },
                    axes: {
                        0: 'moveX',
                        1: 'moveY'
                    },
                    deadzone: 0.15
                },
                'ps': {
                    buttons: {
                        0: 'attack',    // Cross
                        1: 'jump',      // Circle
                        2: 'interact',  // Square
                        3: 'dodge',     // Triangle
                        9: 'menu',      // Options
                        8: 'menu'       // Share
                    },
                    axes: {
                        0: 'moveX',
                        1: 'moveY'
                    },
                    deadzone: 0.1
                },
                'switch': {
                    buttons: {
                        0: 'attack',    // B
                        1: 'jump',      // A
                        2: 'interact',  // Y
                        3: 'dodge',     // X
                        9: 'menu',      // +
                        8: 'menu'       // -
                    },
                    axes: {
                        0: 'moveX',
                        1: 'moveY'
                    },
                    deadzone: 0.2
                }
            },
            
            // Конфигурация тач-контролов
            touchControls: {
                left: { x: 0.1, y: 0.8, width: 0.3, height: 0.15 },
                right: { x: 0.7, y: 0.8, width: 0.3, height: 0.15 },
                attack: { x: 0.85, y: 0.7, radius: 40 },
                jump: { x: 0.85, y: 0.5, radius: 40 }
            },
            
            // Настройки
            vibration: true,
            sensitivity: 1.0,
            invertY: false,
            autoDetect: true
        };
        
        // === ИНИЦИАЛИЗАЦИЯ ===
        this.init();
        console.log('[INPUT] Менеджер ввода инициализирован');
    }
    
    init() {
        // События клавиатуры
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // События мыши
        window.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        
        // События тачскрина
        window.addEventListener('touchstart', (e) => this.onTouchStart(e));
        window.addEventListener('touchend', (e) => this.onTouchEnd(e));
        window.addEventListener('touchmove', (e) => this.onTouchMove(e));
        
        // События геймпада
        window.addEventListener('gamepadconnected', (e) => this.onGamepadConnected(e));
        window.addEventListener('gamepaddisconnected', (e) => this.onGamepadDisconnected(e));
        
        // События устройства
        window.addEventListener('blur', () => this.resetState());
        
        // Определение устройства
        this.detectDevice();
        
        // Запуск обновления геймпада
        this.startGamepadPolling();
    }
    
    // === ОБНАРУЖЕНИЕ УСТРОЙСТВА ===
    detectDevice() {
        const ua = navigator.userAgent.toLowerCase();
        const width = window.innerWidth;
        
        // Определение типа устройства
        if (this.hasGamepad()) {
            this.state.activeDevice = 'gamepad';
            this.state.deviceName = this.getGamepadName();
        } else if ('ontouchstart' in window || width <= 768) {
            this.state.activeDevice = 'touch';
            this.state.deviceName = this.isMobile() ? 'Mobile' : 'Tablet';
            this.setupTouchControls();
        } else {
            this.state.activeDevice = 'keyboard';
            this.state.deviceName = 'Keyboard/Mouse';
        }
        
        console.log(`[INPUT] Устройство: ${this.state.deviceName} (${this.state.activeDevice})`);
    }
    
    isMobile() {
        return /mobile|android|iphone/i.test(navigator.userAgent);
    }
    
    // === УПРАВЛЕНИЕ КЛАВИАТУРОЙ ===
    onKeyDown(event) {
        if (event.repeat) return;
        
        const key = event.code;
        this.state.keys[key] = true;
        this.state.activeDevice = 'keyboard';
        
        // Обновление действий
        this.updateActionsFromKeys();
        
        // Предотвращение действий браузера для игровых клавиш
        if (this.isGameKey(key)) {
            event.preventDefault();
        }
    }
    
    onKeyUp(event) {
        const key = event.code;
        this.state.keys[key] = false;
        this.updateActionsFromKeys();
    }
    
    updateActionsFromKeys() {
        // Сброс действий
        for (const action in this.state.actions) {
            this.state.actions[action] = false;
        }
        
        // Движение
        let moveX = 0, moveY = 0;
        
        if (this.isKeyPressed('left')) moveX -= 1;
        if (this.isKeyPressed('right')) moveX += 1;
        if (this.isKeyPressed('up')) moveY -= 1;
        if (this.isKeyPressed('down')) moveY += 1;
        
        // Нормализация диагонального движения
        if (moveX !== 0 && moveY !== 0) {
            moveX *= 0.7071; // 1/√2
            moveY *= 0.7071;
        }
        
        this.state.moveVector.x = moveX;
        this.state.moveVector.y = moveY;
        
        // Действия
        this.state.actions.attack = this.isKeyPressed('attack');
        this.state.actions.jump = this.isKeyPressed('jump');
        this.state.actions.dodge = this.isKeyPressed('dodge');
        this.state.actions.interact = this.isKeyPressed('interact');
        this.state.actions.menu = this.isKeyPressed('menu');
    }
    
    isKeyPressed(action) {
        const keys = this.config.keybindings[action];
        if (!keys) return false;
        
        return keys.some(key => this.state.keys[key]);
    }
    
    isGameKey(key) {
        for (const binding in this.config.keybindings) {
            if (this.config.keybindings[binding].includes(key)) {
                return true;
            }
        }
        return false;
    }
    
    // === УПРАВЛЕНИЕ ГЕЙМПАДОМ ===
    hasGamepad() {
        return navigator.getGamepads().some(gp => gp !== null);
    }
    
    getGamepadName() {
        const gamepads = navigator.getGamepads();
        for (const gp of gamepads) {
            if (gp) {
                return gp.id;
            }
        }
        return 'Unknown Gamepad';
    }
    
    onGamepadConnected(event) {
        console.log(`[INPUT] Геймпад подключен: ${event.gamepad.id}`);
        
        this.state.gamepads = navigator.getGamepads();
        this.state.gamepadIndex = event.gamepad.index;
        this.state.activeDevice = 'gamepad';
        
        // Определение типа геймпада
        const id = event.gamepad.id.toLowerCase();
        if (id.includes('xbox') || id.includes('microsoft')) {
            this.state.gamepadType = 'xbox';
            this.state.deviceName = 'Xbox Controller';
        } else if (id.includes('playstation') || id.includes('dualsense') || id.includes('dualshock')) {
            this.state.gamepadType = 'ps';
            this.state.deviceName = 'PlayStation Controller';
        } else if (id.includes('nintendo') || id.includes('switch')) {
            this.state.gamepadType = 'switch';
            this.state.deviceName = 'Nintendo Switch';
        } else {
            this.state.gamepadType = 'unknown';
            this.state.deviceName = 'Gamepad';
        }
        
        // Вибрация при подключении
        if (this.config.vibration && event.gamepad.vibrationActuator) {
            event.gamepad.vibrationActuator.playEffect('dual-rumble', {
                startDelay: 0,
                duration: 200,
                weakMagnitude: 0.5,
                strongMagnitude: 0.3
            });
        }
    }
    
    onGamepadDisconnected(event) {
        console.log('[INPUT] Геймпад отключен');
        this.state.gamepads = [];
        this.state.gamepadIndex = -1;
        this.detectDevice(); // Возвращаемся к другому устройству
    }
    
    startGamepadPolling() {
        const updateGamepad = () => {
            if (this.state.activeDevice === 'gamepad') {
                this.pollGamepads();
            }
            requestAnimationFrame(updateGamepad);
        };
        updateGamepad();
    }
    
    pollGamepads() {
        const gamepads = navigator.getGamepads();
        if (!gamepads[this.state.gamepadIndex]) return;
        
        const gp = gamepads[this.state.gamepadIndex];
        const profile = this.config.gamepadProfiles[this.state.gamepadType] || 
                       this.config.gamepadProfiles.xbox;
        
        // Сброс действий
        for (const action in this.state.actions) {
            this.state.actions[action] = false;
        }
        
        // Обработка кнопок
        for (const [buttonIndex, action] of Object.entries(profile.buttons)) {
            if (gp.buttons[buttonIndex] && gp.buttons[buttonIndex].pressed) {
                this.state.actions[action] = true;
            }
        }
        
        // Обработка осей (стиков)
        let moveX = gp.axes[0] || 0;
        let moveY = gp.axes[1] || 0;
        
        // Мёртвая зона
        if (Math.abs(moveX) < profile.deadzone) moveX = 0;
        if (Math.abs(moveY) < profile.deadzone) moveY = 0;
        
        // Инверсия Y (если нужно)
        if (this.config.invertY) moveY = -moveY;
        
        this.state.moveVector.x = moveX * this.config.sensitivity;
        this.state.moveVector.y = moveY * this.config.sensitivity;
        
        // Триггеры (LT/RT для Xbox, L2/R2 для PS)
        if (gp.buttons[6] && gp.buttons[6].value > 0.5) { // LT/L2
            this.state.actions.dodge = true;
        }
        if (gp.buttons[7] && gp.buttons[7].value > 0.5) { // RT/R2
            this.state.actions.attack = true;
        }
    }
    
    vibrate(intensity = 0.5, duration = 100) {
        if (!this.config.vibration || this.state.gamepadIndex === -1) return;
        
        const gamepads = navigator.getGamepads();
        const gp = gamepads[this.state.gamepadIndex];
        
        if (gp && gp.vibrationActuator) {
            gp.vibrationActuator.playEffect('dual-rumble', {
                startDelay: 0,
                duration: duration,
                weakMagnitude: intensity * 0.7,
                strongMagnitude: intensity
            });
        }
    }
    
    // === ТАЧСКРИН УПРАВЛЕНИЕ ===
    setupTouchControls() {
        // Создаём виртуальные кнопки если их нет
        if (!document.getElementById('touch-controls')) {
            const controls = document.createElement('div');
            controls.id = 'touch-controls';
            controls.innerHTML = `
                <div class="touch-zone" id="touch-left"></div>
                <div class="touch-zone" id="touch-right"></div>
                <div class="touch-button" id="touch-attack">⚔️</div>
                <div class="touch-button" id="touch-jump">⬆️</div>
            `;
            document.body.appendChild(controls);
            
            // Стили
            const style = document.createElement('style');
            style.textContent = `
                #touch-controls {
                    position: fixed;
                    bottom: 20px;
                    left: 0;
                    width: 100%;
                    height: 150px;
                    pointer-events: none;
                    z-index: 1000;
                    display: flex;
                    justify-content: space-between;
                    padding: 0 20px;
                }
                .touch-zone {
                    width: 150px;
                    height: 150px;
                    background: rgba(100, 150, 255, 0.1);
                    border: 2px solid rgba(100, 150, 255, 0.3);
                    border-radius: 50%;
                    pointer-events: auto;
                    touch-action: manipulation;
                }
                .touch-button {
                    width: 70px;
                    height: 70px;
                    background: rgba(255, 100, 100, 0.2);
                    border: 2px solid rgba(255, 100, 100, 0.5);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    pointer-events: auto;
                    touch-action: manipulation;
                    position: absolute;
                    bottom: 40px;
                }
                #touch-attack { right: 100px; }
                #touch-jump { right: 20px; }
            `;
            document.head.appendChild(style);
        }
    }
    
    onTouchStart(event) {
        event.preventDefault();
        
        for (const touch of event.changedTouches) {
            const x = touch.clientX;
            const y = touch.clientY;
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            // Анализ зоны касания
            const controls = this.config.touchControls;
            
            // Левая зона (движение)
            const leftZone = {
                x: controls.left.x * width,
                y: controls.left.y * height,
                width: controls.left.width * width,
                height: controls.left.height * height
            };
            
            if (this.isPointInRect(x, y, leftZone)) {
                this.state.touch.active = true;
                this.state.touch.id = touch.identifier;
                this.state.touch.x = x;
                this.state.touch.y = y;
                this.state.activeDevice = 'touch';
                return;
            }
            
            // Кнопка атаки
            const attackBtn = {
                x: controls.attack.x * width,
                y: controls.attack.y * height,
                radius: controls.attack.radius
            };
            
            if (this.isPointInCircle(x, y, attackBtn)) {
                this.state.actions.attack = true;
                this.vibrate(0.2, 50);
                return;
            }
            
            // Кнопка прыжка
            const jumpBtn = {
                x: controls.jump.x * width,
                y: controls.jump.y * height,
                radius: controls.jump.radius
            };
            
            if (this.isPointInCircle(x, y, jumpBtn)) {
                this.state.actions.jump = true;
                return;
            }
        }
    }
    
    onTouchEnd(event) {
        for (const touch of event.changedTouches) {
            if (touch.identifier === this.state.touch.id) {
                this.state.touch.active = false;
                this.state.touch.id = null;
                this.state.moveVector.x = 0;
                this.state.moveVector.y = 0;
            }
            
            // Сброс кнопок
            this.state.actions.attack = false;
            this.state.actions.jump = false;
        }
    }
    
    onTouchMove(event) {
        if (!this.state.touch.active) return;
        
        for (const touch of event.changedTouches) {
            if (touch.identifier === this.state.touch.id) {
                const dx = touch.clientX - this.state.touch.x;
                const dy = touch.clientY - this.state.touch.y;
                
                // Нормализация движения
                const maxDist = 50;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > maxDist) {
                    this.state.moveVector.x = dx / dist;
                    this.state.moveVector.y = dy / dist;
                } else {
                    this.state.moveVector.x = dx / maxDist;
                    this.state.moveVector.y = dy / maxDist;
                }
                
                break;
            }
        }
    }
    
    // === МЫШЬ ===
    onMouseDown(event) {
        this.state.mouse.down = true;
        this.state.mouse.x = event.clientX;
        this.state.mouse.y = event.clientY;
        this.state.actions.attack = true;
    }
    
    onMouseUp(event) {
        this.state.mouse.down = false;
        this.state.actions.attack = false;
    }
    
    onMouseMove(event) {
        this.state.mouse.x = event.clientX;
        this.state.mouse.y = event.clientY;
    }
    
    // === ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ===
    isPointInRect(x, y, rect) {
        return x >= rect.x && x <= rect.x + rect.width &&
               y >= rect.y && y <= rect.y + rect.height;
    }
    
    isPointInCircle(x, y, circle) {
        const dx = x - circle.x;
        const dy = y - circle.y;
        return dx * dx + dy * dy <= circle.radius * circle.radius;
    }
    
    resetState() {
        // Сброс всех состояний при потере фокуса
        for (const key in this.state.keys) {
            this.state.keys[key] = false;
        }
        this.state.mouse.down = false;
        this.state.touch.active = false;
        this.state.moveVector.x = 0;
        this.state.moveVector.y = 0;
        
        for (const action in this.state.actions) {
            this.state.actions[action] = false;
        }
    }
    
    // === ПУБЛИЧНЫЕ МЕТОДЫ ===
    getMoveVector() {
        return { ...this.state.moveVector };
    }
    
    getAction(action) {
        return this.state.actions[action] || false;
    }
    
    getMousePosition() {
        return { ...this.state.mouse };
    }
    
    getDeviceInfo() {
        return {
            type: this.state.activeDevice,
            name: this.state.deviceName,
            gamepadType: this.state.gamepadType
        };
    }
    
    isGamepadConnected() {
        return this.state.activeDevice === 'gamepad';
    }
    
    isTouchDevice() {
        return this.state.activeDevice === 'touch';
    }
    
    // Обновление конфигурации
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
}

// Создаём глобальный экземпляр
window.InputManager = new InputManager();

// Экспорт для модулей
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InputManager;
}