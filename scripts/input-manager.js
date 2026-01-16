class InputManager {
    constructor() {
        this.state = {
            keys: {},
            gamepads: [],
            gamepadIndex: -1,
            gamepadType: null,
            mouse: { x: 0, y: 0, down: false },
            touch: { x: 0, y: 0, active: false, id: null },
            moveVector: { x: 0, y: 0 },
            actions: {
                attack: false,
                jump: false,
                dodge: false,
                interact: false,
                menu: false
            },
            activeDevice: 'keyboard',
            deviceName: 'Unknown',
            connected: true
        };
        
        // АВТОМАТИЧЕСКОЕ ОПРЕДЕЛЕНИЕ УСТРОЙСТВА
        this.autoDetectDevice();
        this.init();
    }
    
    autoDetectDevice() {
        const ua = navigator.userAgent.toLowerCase();
        const isMobile = /mobile|android|iphone|ipad|ipod/i.test(ua);
        const isTablet = /tablet|ipad/i.test(ua) && !/mobile/i.test(ua);
        
        // Проверка тач-ввода
        const hasTouch = 'ontouchstart' in window || 
                        navigator.maxTouchPoints > 0 || 
                        navigator.msMaxTouchPoints > 0;
        
        // Проверка геймпада
        const hasGamepad = navigator.getGamepads && 
                          Array.from(navigator.getGamepads()).some(gp => gp);
        
        if (hasGamepad) {
            this.state.activeDevice = 'gamepad';
            this.state.deviceName = 'Gamepad';
            console.log('[INPUT] Устройство: Геймпад');
        } 
        else if (hasTouch || isMobile || isTablet) {
            this.state.activeDevice = 'touch';
            this.state.deviceName = isTablet ? 'Планшет' : 'Телефон';
            console.log('[INPUT] Устройство: Мобильное (тач)');
            
            // Создаём сенсорные кнопки
            this.createTouchControls();
        } 
        else {
            this.state.activeDevice = 'keyboard';
            this.state.deviceName = 'Клавиатура';
            console.log('[INPUT] Устройство: Клавиатура');
        }
    }
    
    createTouchControls() {
        // Убедимся что элемент существует
        if (!document.getElementById('touch-controls')) {
            const controls = document.createElement('div');
            controls.id = 'touch-controls';
            controls.innerHTML = `
                <div class="touch-area" id="touch-move">
                    <div class="touch-joystick" id="joystick"></div>
                </div>
                <div class="touch-buttons">
                    <button class="touch-btn attack-btn" data-action="attack">⚔️</button>
                    <button class="touch-btn jump-btn" data-action="jump">⬆️</button>
                    <button class="touch-btn dodge-btn" data-action="dodge">🌀</button>
                </div>
            `;
            document.body.appendChild(controls);
            
            // Добавляем стили
            this.addTouchStyles();
            
            // Назначаем обработчики
            this.setupTouchEvents();
        }
    }
    
    addTouchStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #touch-controls {
                position: fixed;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 180px;
                pointer-events: none;
                z-index: 1000;
                display: flex;
                justify-content: space-between;
                padding: 20px;
                box-sizing: border-box;
            }
            
            .touch-area {
                width: 140px;
                height: 140px;
                background: rgba(100, 150, 255, 0.15);
                border: 2px solid rgba(100, 150, 255, 0.3);
                border-radius: 50%;
                position: relative;
                pointer-events: auto;
                touch-action: none;
            }
            
            .touch-joystick {
                width: 60px;
                height: 60px;
                background: rgba(255, 255, 255, 0.8);
                border-radius: 50%;
                position: absolute;
                top: 40px;
                left: 40px;
                transition: transform 0.1s;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            }
            
            .touch-buttons {
                display: flex;
                flex-direction: column;
                gap: 15px;
                align-items: flex-end;
            }
            
            .touch-btn {
                width: 70px;
                height: 70px;
                border-radius: 50%;
                border: none;
                font-size: 24px;
                pointer-events: auto;
                touch-action: manipulation;
                background: rgba(255, 100, 100, 0.2);
                border: 2px solid rgba(255, 100, 100, 0.5);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.1s;
                user-select: none;
            }
            
            .touch-btn:active {
                transform: scale(0.9);
                background: rgba(255, 100, 100, 0.4);
            }
            
            .jump-btn {
                background: rgba(100, 255, 100, 0.2);
                border-color: rgba(100, 255, 100, 0.5);
            }
            
            .dodge-btn {
                background: rgba(100, 100, 255, 0.2);
                border-color: rgba(100, 100, 255, 0.5);
            }
            
            /* Для очень маленьких экранов */
            @media (max-width: 400px) {
                .touch-area { width: 120px; height: 120px; }
                .touch-btn { width: 60px; height: 60px; font-size: 20px; }
                #touch-controls { height: 150px; padding: 15px; }
            }
        `;
        document.head.appendChild(style);
    }
    
    setupTouchEvents() {
        const joystick = document.getElementById('joystick');
        const touchArea = document.getElementById('touch-move');
        let touchId = null;
        
        touchArea.addEventListener('touchstart', (e) => {
            if (touchId === null) {
                const touch = e.changedTouches[0];
                touchId = touch.identifier;
                this.updateJoystick(touch);
                e.preventDefault();
            }
        });
        
        touchArea.addEventListener('touchmove', (e) => {
            for (const touch of e.changedTouches) {
                if (touch.identifier === touchId) {
                    this.updateJoystick(touch);
                    e.preventDefault();
                    break;
                }
            }
        });
        
        touchArea.addEventListener('touchend', (e) => {
            for (const touch of e.changedTouches) {
                if (touch.identifier === touchId) {
                    this.resetJoystick();
                    touchId = null;
                    e.preventDefault();
                    break;
                }
            }
        });
        
        // Кнопки
        document.querySelectorAll('.touch-btn').forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                const action = btn.getAttribute('data-action');
                this.state.actions[action] = true;
                e.preventDefault();
            });
            
            btn.addEventListener('touchend', (e) => {
                const action = btn.getAttribute('data-action');
                this.state.actions[action] = false;
                e.preventDefault();
            });
        });
    }
    
    updateJoystick(touch) {
        const area = document.getElementById('touch-move');
        const joystick = document.getElementById('joystick');
        const rect = area.getBoundingClientRect();
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
        
        // Ограничение движения джойстика
        const deltaX = touchX - centerX;
        const deltaY = touchY - centerY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const maxDistance = 50;
        
        let moveX = deltaX;
        let moveY = deltaY;
        
        if (distance > maxDistance) {
            moveX = (deltaX / distance) * maxDistance;
            moveY = (deltaY / distance) * maxDistance;
        }
        
        // Обновляем позицию джойстика
        joystick.style.transform = `translate(${moveX}px, ${moveY}px)`;
        
        // Обновляем вектор движения
        this.state.moveVector.x = moveX / maxDistance;
        this.state.moveVector.y = moveY / maxDistance;
    }
    
    resetJoystick() {
        const joystick = document.getElementById('joystick');
        if (joystick) {
            joystick.style.transform = 'translate(0, 0)';
        }
        this.state.moveVector.x = 0;
        this.state.moveVector.y = 0;
    }
    
    init() {
        // Клавиатура
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // Мышь
        window.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        
        // Геймпад
        window.addEventListener('gamepadconnected', (e) => this.onGamepadConnected(e));
        window.addEventListener('gamepaddisconnected', (e) => this.onGamepadDisconnected(e));
        
        // Обновление геймпада
        this.startGamepadPolling();
        
        console.log('[INPUT] Менеджер ввода готов');
    }
    
    // Остальные методы оставляем как были...
    onKeyDown(e) { 
        if (!e.repeat) {
            this.state.keys[e.code] = true;
            this.state.activeDevice = 'keyboard';
            this.updateActionsFromKeys();
        }
    }
    
    onKeyUp(e) { 
        this.state.keys[e.code] = false; 
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
        
        if (moveX !== 0 && moveY !== 0) {
            moveX *= 0.7071;
            moveY *= 0.7071;
        }
        
        this.state.moveVector.x = moveX;
        this.state.moveVector.y = moveY;
        
        // Действия
        const actions = ['attack', 'jump', 'dodge', 'interact', 'menu'];
        actions.forEach(action => {
            this.state.actions[action] = this.isKeyPressed(action);
        });
    }
    
    isKeyPressed(action) {
        const keybindings = {
            up: ['KeyW', 'ArrowUp'],
            down: ['KeyS', 'ArrowDown'],
            left: ['KeyA', 'ArrowLeft'],
            right: ['KeyD', 'ArrowRight'],
            attack: ['Space', 'KeyJ', 'KeyZ'],
            jump: ['KeyK', 'KeyX'],
            dodge: ['ShiftLeft', 'KeyL', 'KeyC'],
            interact: ['KeyE', 'KeyF'],
            menu: ['Escape', 'KeyP']
        };
        
        const keys = keybindings[action];
        if (!keys) return false;
        
        return keys.some(key => this.state.keys[key]);
    }
    
    onGamepadConnected(e) {
        console.log('[INPUT] Геймпад подключен:', e.gamepad.id);
        this.state.gamepadIndex = e.gamepad.index;
        this.state.activeDevice = 'gamepad';
        this.state.deviceName = e.gamepad.id;
    }
    
    startGamepadPolling() {
        const poll = () => {
            if (this.state.activeDevice === 'gamepad') {
                const gamepads = navigator.getGamepads();
                if (gamepads[this.state.gamepadIndex]) {
                    const gp = gamepads[this.state.gamepadIndex];
                    
                    // Левая ось для движения
                    const deadzone = 0.15;
                    let moveX = Math.abs(gp.axes[0]) > deadzone ? gp.axes[0] : 0;
                    let moveY = Math.abs(gp.axes[1]) > deadzone ? gp.axes[1] : 0;
                    
                    this.state.moveVector.x = moveX;
                    this.state.moveVector.y = moveY;
                    
                    // Кнопки
                    this.state.actions.attack = gp.buttons[0]?.pressed || false;
                    this.state.actions.jump = gp.buttons[1]?.pressed || false;
                    this.state.actions.dodge = gp.buttons[2]?.pressed || false;
                }
            }
            requestAnimationFrame(poll);
        };
        poll();
    }
    
    // Геттеры
    getMoveVector() { return { ...this.state.moveVector }; }
    getAction(action) { return this.state.actions[action] || false; }
    getDeviceInfo() { 
        return {
            type: this.state.activeDevice,
            name: this.state.deviceName,
            gamepadType: this.state.gamepadType
        };
    }
    
    isGamepadConnected() { return this.state.activeDevice === 'gamepad'; }
    isTouchDevice() { return this.state.activeDevice === 'touch'; }
}

// Создаём глобальный экземпляр
window.InputManager = new InputManager();