/**
 * ДИНАМИЧЕСКОЕ МЕНЮ
 * Меняется по времени суток, погоде, устройству и прогрессу
 */
class DynamicMenu {
    constructor() {
        // === СОСТОЯНИЯ ===
        this.states = {
            main: 'main',
            game: 'game',
            multiplayer: 'multiplayer',
            settings: 'settings',
            secrets: 'secrets'
        };
        
        this.currentState = this.states.main;
        this.previousState = null;
        
        // === ВРЕМЕННЫЕ ДАННЫЕ ===
        this.timeData = {
            hour: 0,
            minute: 0,
            season: 'winter', // winter, spring, summer, autumn
            isDay: true,
            isNight: false,
            isMorning: false,
            isEvening: false
        };
        
        // === ТЕМЫ МЕНЮ ===
        this.themes = {
            morning: {
                background: 'linear-gradient(135deg, #ffcc80 0%, #ffb74d 100%)',
                color: '#5d4037',
                accent: '#ff9800',
                particles: 'sunbeams',
                music: 'morning_chill'
            },
            day: {
                background: 'linear-gradient(135deg, #4fc3f7 0%, #0277bd 100%)',
                color: '#004d40',
                accent: '#00bcd4',
                particles: 'snowflakes',
                music: 'icy_winds'
            },
            evening: {
                background: 'linear-gradient(135deg, #7b1fa2 0%, #512da8 100%)',
                color: '#f3e5f5',
                accent: '#e040fb',
                particles: 'stars',
                music: 'northern_lights'
            },
            night: {
                background: 'linear-gradient(135deg, #0d47a1 0%, #311b92 100%)',
                color: '#e3f2fd',
                accent: '#2962ff',
                particles: 'aurora',
                music: 'deep_freeze'
            },
            midnight: {
                background: 'linear-gradient(135deg, #000000 0%, #1a237e 100%)',
                color: '#bb86fc',
                accent: '#6200ea',
                particles: 'galaxy',
                music: 'cosmic_drift'
            }
        };
        
        this.currentTheme = this.themes.day;
        
        // === ПРОГРЕСС ИГРОКА ===
        this.playerProgress = {
            level: 1,
            enemiesDefeated: 0,
            bossesDefeated: 0,
            secretsFound: 0,
            playTime: 0,
            highestCombo: 0
        };
        
        // === ЭЛЕМЕНТЫ DOM ===
        this.elements = {
            menu: null,
            title: null,
            buttons: {},
            background: null,
            timeDisplay: null,
            deviceIndicator: null,
            hintDisplay: null
        };
        
        // === АНИМАЦИИ ===
        this.animations = {
            particles: [],
            transitions: [],
            effects: []
        };
        
        // === СОВЕТЫ И ПОДСКАЗКИ ===
        this.hints = [
            "Тюмени уворачиваются от атак - предугадывай их движения!",
            "Используй пропуск хода для накопления атак",
            "Каждый враг имеет уникальные слабости",
            "Ночью враги становятся сильнее",
            "Попробуй пройти игру без прокачки",
            "Прислушайся к звукам битвы",
            "Северное сияние даёт временные бонусы",
            "Снегопад скрывает твои движения"
        ];
        
        this.currentHintIndex = 0;
        this.hintTimer = 0;
        
        // === ИНИЦИАЛИЗАЦИЯ ===
        this.init();
        console.log('[MENU] Динамическое меню инициализировано');
    }
    
    init() {
        // Находим элементы DOM
        this.elements.menu = document.getElementById('main-menu');
        this.elements.title = document.querySelector('.game-title');
        this.elements.background = document.getElementById('dynamic-bg');
        this.elements.timeDisplay = document.getElementById('time-display');
        this.elements.deviceIndicator = document.getElementById('device-indicator');
        this.elements.hintDisplay = document.getElementById('menu-hint');
        
        // Находим кнопки
        this.elements.buttons = {
            start: document.getElementById('start-btn'),
            multiplayer: document.getElementById('multiplayer-btn'),
            settings: document.getElementById('settings-btn'),
            secrets: document.getElementById('secrets-btn')
        };
        
        // Установка обработчиков
        this.setupEventListeners();
        
        // Запуск обновлений
        this.updateTime();
        this.updateTheme();
        this.updateUI();
        this.startAnimations();
        
        // Обновление каждую секунду
        setInterval(() => {
            this.updateTime();
            this.updateTheme();
            this.updateUI();
        }, 1000);
        
        // Смена подсказок каждые 10 секунд
        setInterval(() => this.rotateHint(), 10000);
    }
    
    // === ОБНОВЛЕНИЕ ВРЕМЕНИ ===
    updateTime() {
        const now = new Date();
        this.timeData.hour = now.getHours();
        this.timeData.minute = now.getMinutes();
        
        // Определение времени суток
        this.timeData.isMorning = this.timeData.hour >= 5 && this.timeData.hour < 10;
        this.timeData.isDay = this.timeData.hour >= 10 && this.timeData.hour < 17;
        this.timeData.isEvening = this.timeData.hour >= 17 && this.timeData.hour < 21;
        this.timeData.isNight = this.timeData.hour >= 21 || this.timeData.hour < 5;
        
        // Определение сезона (упрощённо по месяцу)
        const month = now.getMonth();
        if (month >= 11 || month < 2) this.timeData.season = 'winter';
        else if (month >= 2 && month < 5) this.timeData.season = 'spring';
        else if (month >= 5 && month < 8) this.timeData.season = 'summer';
        else this.timeData.season = 'autumn';
        
        // Обновление отображения времени
        if (this.elements.timeDisplay) {
            const timeStr = now.toLocaleTimeString('ru-RU', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            const seasonEmoji = {
                winter: '❄️',
                spring: '🌸',
                summer: '☀️',
                autumn: '🍂'
            }[this.timeData.season];
            
            this.elements.timeDisplay.innerHTML = `
                ${seasonEmoji} ${timeStr} 
                <span style="font-size: 0.8em; opacity: 0.7;">
                    (${this.getTimeOfDayName()})
                </span>
            `;
        }
        
        // Обновление атрибута data-time-of-day
        document.documentElement.setAttribute('data-time-of-day', this.getTimeOfDayKey());
    }
    
    getTimeOfDayKey() {
        if (this.timeData.hour >= 5 && this.timeData.hour < 10) return 'morning';
        if (this.timeData.hour >= 10 && this.timeData.hour < 17) return 'day';
        if (this.timeData.hour >= 17 && this.timeData.hour < 21) return 'evening';
        if (this.timeData.hour >= 21 && this.timeData.hour < 24) return 'night';
        return 'midnight';
    }
    
    getTimeOfDayName() {
        const names = {
            morning: 'Утро',
            day: 'День',
            evening: 'Вечер',
            night: 'Ночь',
            midnight: 'Полночь'
        };
        return names[this.getTimeOfDayKey()] || 'День';
    }
    
    // === ОБНОВЛЕНИЕ ТЕМЫ ===
    updateTheme() {
        const timeKey = this.getTimeOfDayKey();
        this.currentTheme = this.themes[timeKey] || this.themes.day;
        
        // Применение темы к фону
        if (this.elements.background) {
            this.elements.background.style.background = this.currentTheme.background;
        }
        
        // Обновление цвета заголовка
        if (this.elements.title) {
            this.elements.title.style.background = `linear-gradient(to right, ${this.currentTheme.accent}, #${this.getComplementaryColor(this.currentTheme.accent)})`;
        }
        
        // Обновление частиц
        this.updateParticles();
    }
    
    getComplementaryColor(hex) {
        // Упрощённая функция для получения дополнительного цвета
        const colors = {
            '#ff9800': '00bcd4',
            '#00bcd4': 'ff9800',
            '#e040fb': '40c4ff',
            '#2962ff': 'ff6d00',
            '#6200ea': '00e676'
        };
        return colors[hex] || 'ffffff';
    }
    
    // === ЧАСТИЦЫ И АНИМАЦИИ ===
    updateParticles() {
        const particleType = this.currentTheme.particles;
        
        // Очистка старых частиц
        this.animations.particles = [];
        
        // Создание новых частиц в зависимости от темы
        switch(particleType) {
            case 'snowflakes':
                this.createSnowflakes();
                break;
            case 'sunbeams':
                this.createSunbeams();
                break;
            case 'stars':
                this.createStars();
                break;
            case 'aurora':
                this.createAurora();
                break;
            case 'galaxy':
                this.createGalaxy();
                break;
        }
    }
    
    createSnowflakes() {
        const count = 50;
        for (let i = 0; i < count; i++) {
            this.animations.particles.push({
                type: 'snow',
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                size: 2 + Math.random() * 4,
                speed: 0.5 + Math.random() * 1.5,
                opacity: 0.3 + Math.random() * 0.7,
                drift: (Math.random() - 0.5) * 0.5
            });
        }
    }
    
    createAurora() {
        // Северное сияние (полосы)
        for (let i = 0; i < 5; i++) {
            this.animations.particles.push({
                type: 'aurora',
                x: 0,
                y: 100 + i * 50,
                width: window.innerWidth,
                height: 30,
                color: `hsl(${200 + i * 20}, 100%, 60%)`,
                phase: Math.random() * Math.PI * 2,
                speed: 0.002 + Math.random() * 0.001
            });
        }
    }
    
    // === ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ===
    updateUI() {
        // Обновление индикатора устройства
        if (this.elements.deviceIndicator) {
            const deviceInfo = window.InputManager?.getDeviceInfo() || { type: 'keyboard', name: 'Keyboard' };
            this.elements.deviceIndicator.innerHTML = `
                Устройство: <span style="color: ${this.currentTheme.accent}">${deviceInfo.name}</span>
                | Управление: <span style="color: ${this.currentTheme.accent}">${this.getInputTypeName(deviceInfo.type)}</span>
            `;
        }
        
        // Обновление состояния кнопок
        this.updateButtons();
        
        // Обновление подсказок
        this.updateHint();
    }
    
    getInputTypeName(type) {
        const names = {
            keyboard: 'Клавиатура',
            gamepad: 'Геймпад',
            touch: 'Тачскрин'
        };
        return names[type] || 'Клавиатура';
    }
    
    updateButtons() {
        // Динамические надписи на кнопках
        if (this.elements.buttons.start) {
            const timeName = this.getTimeOfDayName().toLowerCase();
            this.elements.buttons.start.innerHTML = `🎮 НАЧАТЬ ${timeName.toUpperCase()}`;
        }
        
        if (this.elements.buttons.multiplayer) {
            const playerCount = this.getOnlinePlayers();
            const playersText = playerCount > 0 ? ` (${playerCount} онлайн)` : '';
            this.elements.buttons.multiplayer.innerHTML = `👥 МУЛЬТИПЛЕЕР${playersText}`;
        }
    }
    
    getOnlinePlayers() {
        // Заглушка - в реальной игре здесь запрос к серверу
        return Math.floor(Math.random() * 12);
    }
    
    // === ПОДСКАЗКИ ===
    updateHint() {
        if (!this.elements.hintDisplay || this.hints.length === 0) return;
        
        this.hintTimer += 0.016; // Примерно 60 FPS
        
        if (this.hintTimer >= 10) {
            this.rotateHint();
            this.hintTimer = 0;
        }
    }
    
    rotateHint() {
        this.currentHintIndex = (this.currentHintIndex + 1) % this.hints.length;
        const hint = this.hints[this.currentHintIndex];
        
        if (this.elements.hintDisplay) {
            this.elements.hintDisplay.innerHTML = `
                <div style="
                    background: rgba(0,0,0,0.3);
                    padding: 10px;
                    border-radius: 10px;
                    border-left: 3px solid ${this.currentTheme.accent};
                    margin-top: 20px;
                    font-size: 0.9em;
                    opacity: 0.8;
                ">
                    💡 ${hint}
                </div>
            `;
        }
    }
    
    // === АНИМАЦИИ ===
    startAnimations() {
        const animate = () => {
            this.renderParticles();
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    renderParticles() {
        // В реальной игре здесь отрисовка на Canvas
        // Для простоты обновляем CSS трансформации
    }
    
    // === ПЕРЕКЛЮЧЕНИЕ СОСТОЯНИЙ ===
    changeState(newState) {
        if (this.currentState === newState) return;
        
        this.previousState = this.currentState;
        this.currentState = newState;
        
        console.log(`[MENU] Смена состояния: ${this.previousState} -> ${newState}`);
        
        // Анимация перехода
        this.animateTransition(newState);
        
        // Обновление видимости элементов
        this.updateVisibility();
    }
    
    animateTransition(newState) {
        // Эффект перехода
        if (this.elements.menu) {
            this.elements.menu.style.opacity = '0';
            this.elements.menu.style.transform = 'scale(0.95)';
            
            setTimeout(() => {
                this.elements.menu.style.opacity = '1';
                this.elements.menu.style.transform = 'scale(1)';
            }, 50);
        }
    }
    
    updateVisibility() {
        // Показываем/скрываем элементы в зависимости от состояния
        const gameContainer = document.getElementById('game-container');
        
        switch(this.currentState) {
            case this.states.main:
                if (this.elements.menu) this.elements.menu.style.display = 'block';
                if (gameContainer) gameContainer.style.display = 'none';
                break;
                
            case this.states.game:
                if (this.elements.menu) this.elements.menu.style.display = 'none';
                if (gameContainer) gameContainer.style.display = 'flex';
                break;
                
            case this.states.multiplayer:
                // Здесь можно показать меню мультиплеера
                break;
        }
    }
    
    // === ОБРАБОТЧИКИ СОБЫТИЙ ===
    setupEventListeners() {
        // Кнопка старта
        if (this.elements.buttons.start) {
            this.elements.buttons.start.addEventListener('click', () => {
                this.changeState(this.states.game);
                // Запуск игры
                if (window.game) {
                    window.game.start();
                }
            });
        }
        
        // Кнопка мультиплеера
        if (this.elements.buttons.multiplayer) {
            this.elements.buttons.multiplayer.addEventListener('click', () => {
                this.changeState(this.states.multiplayer);
                // Здесь запуск мультиплеера
            });
        }
        
        // Кнопка настроек
        if (this.elements.buttons.settings) {
            this.elements.buttons.settings.addEventListener('click', () => {
                this.showSettings();
            });
        }
        
        // Кнопка секретов
        if (this.elements.buttons.secrets) {
            this.elements.buttons.secrets.addEventListener('click', () => {
                this.showSecrets();
            });
        }
        
        // Горячие клавиши
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.toggleMenu();
            }
        });
    }
    
    // === ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ===
    showSettings() {
        alert('Настройки будут в следующей версии!');
    }
    
    showSecrets() {
        const secrets = [
            { name: 'Ледяной Воин', description: 'Победить 100 врагов', unlocked: true },
            { name: 'Повелитель Тюленей', description: 'Победить всех тюленей', unlocked: false },
            { name: 'Ночной Охотник', description: 'Пройди игру ночью', unlocked: false },
            { name: 'Без Прокачки', description: 'Пройди игру без улучшений', unlocked: false }
        ];
        
        let secretsHTML = '<div style="text-align: left; margin: 20px 0;">';
        secrets.forEach(secret => {
            const icon = secret.unlocked ? '✅' : '🔒';
            const style = secret.unlocked ? 
                'color: #4CAF50;' : 
                'color: #757575; opacity: 0.6;';
            
            secretsHTML += `
                <div style="${style} margin-bottom: 10px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 5px;">
                    ${icon} <strong>${secret.name}</strong><br>
                    <small>${secret.description}</small>
                </div>
            `;
        });
        secretsHTML += '</div>';
        
        alert(`СЕКРЕТНЫЕ КОНЦОВКИ:\n\n${secretsHTML}`);
    }
    
    toggleMenu() {
        if (this.currentState === this.states.game) {
            this.changeState(this.states.main);
            if (window.game) {
                window.game.pause();
            }
        } else if (this.currentState === this.states.main) {
            this.changeState(this.states.game);
            if (window.game) {
                window.game.resume();
            }
        }
    }
    
    // === ПУБЛИЧНЫЕ МЕТОДЫ ===
    getCurrentTheme() {
        return this.currentTheme;
    }
    
    getTimeData() {
        return { ...this.timeData };
    }
    
    updateProgress(progress) {
        this.playerProgress = { ...this.playerProgress, ...progress };
    }
    
    showNotification(message, type = 'info') {
        // Создаём уведомление
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            z-index: 9999;
            animation: slideIn 0.3s ease-out;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Удаляем через 3 секунды
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
        
        // Добавляем стили анимации
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Создаём глобальный экземпляр
window.DynamicMenu = new DynamicMenu();

// Экспорт для модулей
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DynamicMenu;
}