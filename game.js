/**
 * ГЛАВНЫЙ ИГРОВОЙ ДВИЖОК
 * Объединяет все системы, управляет игровым циклом
 */
class GameEngine {
    constructor() {
        // === ОСНОВНЫЕ СВОЙСТВА ===
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // === СОСТОЯНИЯ ИГРЫ ===
        this.state = {
            running: false,
            paused: false,
            gameOver: false,
            victory: false,
            currentLevel: 1,
            score: 0,
            time: 0,
            combo: 0,
            maxCombo: 0
        };
        
        // === СИСТЕМЫ ИГРЫ ===
        this.systems = {
            input: window.InputManager,
            menu: window.DynamicMenu,
            physics: null,
            particles: [],
            enemies: [],
            player: null,
            camera: { x: 0, y: 0, zoom: 1 },
            background: []
        };
        
        // === СЧЁТЧИКИ ПРОИЗВОДИТЕЛЬНОСТИ ===
        this.performance = {
            fps: 0,
            frameCount: 0,
            lastFpsUpdate: 0,
            deltaTime: 0,
            lastTime: 0,
            slowFrames: 0
        };
        
        // === НАСТРОЙКИ ГРАФИКИ ===
        this.settings = {
            graphics: {
                quality: 'high', // low, medium, high
                particles: true,
                shadows: true,
                blur: true,
                antialias: true
            },
            audio: {
                volume: 0.7,
                music: true,
                sfx: true
            },
            gameplay: {
                difficulty: 'normal', // easy, normal, hard
                tutorial: true,
                autoSave: true
            }
        };
        
        // === ИГРОВЫЕ ОБЪЕКТЫ ===
        this.gameObjects = [];
        this.collisionGroups = {};
        
        // === АНИМАЦИИ И ЭФФЕКТЫ ===
        this.animations = [];
        this.effects = {
            screenShake: { intensity: 0, duration: 0 },
            flash: { color: null, duration: 0 },
            slowMo: { factor: 1, duration: 0 }
        };
        
        // === ИНИЦИАЛИЗАЦИЯ ===
        this.init();
        console.log('[GAME] Игровой движок инициализирован');
    }
    
    init() {
        // Настройка Canvas
        this.setupCanvas();
        
        // Загрузка ресурсов
        this.loadAssets();
        
        // Создание игровых объектов
        this.createGameObjects();
        
        // Настройка обработчиков
        this.setupEventHandlers();
        
        // Запуск игрового цикла
        this.startGameLoop();
    }
    
    setupCanvas() {
        // Высокое качество отрисовки
        this.ctx.imageSmoothingEnabled = this.settings.graphics.antialias;
        this.ctx.imageSmoothingQuality = 'high';
        
        // Сохранение пропорций при ресайзе
        window.addEventListener('resize', () => this.handleResize());
        this.handleResize();
    }
    
    handleResize() {
        const container = this.canvas.parentElement;
        const aspectRatio = this.width / this.height;
        
        let newWidth = container.clientWidth;
        let newHeight = container.clientHeight;
        const containerAspect = newWidth / newHeight;
        
        if (containerAspect > aspectRatio) {
            newWidth = newHeight * aspectRatio;
        } else {
            newHeight = newWidth / aspectRatio;
        }
        
        this.canvas.style.width = `${newWidth}px`;
        this.canvas.style.height = `${newHeight}px`;
    }
    
    loadAssets() {
        // Заглушка для загрузки ресурсов
        console.log('[GAME] Загрузка ресурсов...');
        
        // В реальной игре здесь загрузка спрайтов, звуков и т.д.
        this.assets = {
            loaded: false,
            progress: 0,
            images: {},
            sounds: {},
            fonts: {}
        };
        
        // Имитация загрузки
        const fakeLoad = setInterval(() => {
            this.assets.progress += 10;
            if (this.assets.progress >= 100) {
                this.assets.loaded = true;
                clearInterval(fakeLoad);
                console.log('[GAME] Ресурсы загружены');
                
                // Уведомление в меню
                if (window.DynamicMenu) {
                    window.DynamicMenu.showNotification('Игра загружена!', 'success');
                }
            }
        }, 100);
    }
    
    createGameObjects() {
        // Создание игрока
        this.systems.player = this.createPlayer();
        
        // Создание врагов (начинаем с тюленя)
        this.createEnemies();
        
        // Создание фона
        this.createBackground();
        
        // Создание системы частиц
        this.createParticleSystem();
    }
    
    createPlayer() {
        return {
            type: 'player',
            x: this.width / 2,
            y: this.height / 2,
            width: 40,
            height: 60,
            health: 100,
            maxHealth: 100,
            speed: 5,
            damage: 10,
            isAttacking: false,
            attackCooldown: 0,
            invulnerable: false,
            color: '#4CAF50',
            name: 'Игрок',
            score: 0,
            abilities: {
                dash: { cooldown: 2, current: 0 },
                heal: { cooldown: 10, current: 0 }
            }
        };
    }
    
    createEnemies() {
        // Создаём тюленя
        const seal = new Seal({
            x: this.width * 0.75,
            y: this.height / 2,
            name: 'Тюлень Лорд'
        });
        
        this.systems.enemies.push(seal);
        console.log(`[GAME] Создан враг: ${seal.name}`);
    }
    
    createBackground() {
        // Создаём слои фона для параллакса
        this.systems.background = [
            {
                type: 'sky',
                color: '#0a192f',
                speed: 0.1,
                elements: this.createSkyElements()
            },
            {
                type: 'mountains',
                color: '#1a365d',
                speed: 0.3,
                elements: this.createMountainRange()
            },
            {
                type: 'ice',
                color: '#2a4d7a',
                speed: 0.6,
                elements: this.createIcebergs()
            }
        ];
    }
    
    createSkyElements() {
        const elements = [];
        for (let i = 0; i < 20; i++) {
            elements.push({
                x: Math.random() * this.width * 2,
                y: Math.random() * this.height * 0.3,
                size: 1 + Math.random() * 3,
                brightness: 0.2 + Math.random() * 0.3,
                speed: 0.05 + Math.random() * 0.1
            });
        }
        return elements;
    }
    
    createParticleSystem() {
        // Базовая система частиц
        this.systems.particles = {
            pool: [],
            active: [],
            maxParticles: 1000
        };
    }
    
    // === ИГРОВОЙ ЦИКЛ ===
    startGameLoop() {
        this.state.running = true;
        this.performance.lastTime = performance.now();
        
        const gameLoop = (currentTime) => {
            // Расчёт deltaTime
            this.performance.deltaTime = (currentTime - this.performance.lastTime) / 1000;
            this.performance.lastTime = currentTime;
            
            // Ограничение deltaTime для предотвращения "спайков"
            if (this.performance.deltaTime > 0.1) {
                this.performance.deltaTime = 0.1;
                this.performance.slowFrames++;
            }
            
            // Обновление FPS-счётчика
            this.updateFPS(currentTime);
            
            // Обновление игры если не на паузе
            if (!this.state.paused && this.state.running) {
                this.update(this.performance.deltaTime);
                this.render();
            }
            
            // Продолжение цикла
            if (this.state.running) {
                requestAnimationFrame(gameLoop);
            }
        };
        
        requestAnimationFrame(gameLoop);
        console.log('[GAME] Игровой цикл запущен');
    }
    
    updateFPS(currentTime) {
        this.performance.frameCount++;
        
        if (currentTime - this.performance.lastFpsUpdate >= 1000) {
            this.performance.fps = this.performance.frameCount;
            this.performance.frameCount = 0;
            this.performance.lastFpsUpdate = currentTime;
            
            // Вывод FPS в консоль для отладки
            if (window.DEBUG_MODE) {
                console.log(`[FPS: ${this.performance.fps}]`);
            }
        }
    }
    
    update(deltaTime) {
        // Обновление времени игры
        this.state.time += deltaTime;
        
        // Обновление ввода
        this.updateInput(deltaTime);
        
        // Обновление игрока
        this.updatePlayer(deltaTime);
        
        // Обновление врагов
        this.updateEnemies(deltaTime);
        
        // Обновление физики и коллизий
        this.updatePhysics(deltaTime);
        
        // Обновление частиц
        this.updateParticles(deltaTime);
        
        // Обновление камеры
        this.updateCamera(deltaTime);
        
        // Обновление эффектов
        this.updateEffects(deltaTime);
        
        // Проверка условий победы/поражения
        this.checkGameState();
    }
    
    updateInput(deltaTime) {
        if (!this.systems.input) return;
        
        const input = this.systems.input;
        const moveVector = input.getMoveVector();
        
        // Движение игрока
        this.systems.player.x += moveVector.x * this.systems.player.speed;
        this.systems.player.y += moveVector.y * this.systems.player.speed;
        
        // Ограничение в пределах экрана
        this.systems.player.x = Math.max(50, Math.min(this.width - 50, this.systems.player.x));
        this.systems.player.y = Math.max(50, Math.min(this.height - 50, this.systems.player.y));
        
        // Действия
        if (input.getAction('attack')) {
            this.playerAttack();
        }
        
        if (input.getAction('jump')) {
            this.playerJump();
        }
        
        if (input.getAction('dodge')) {
            this.playerDodge();
        }
        
        // Меню
        if (input.getAction('menu')) {
            this.togglePause();
        }
    }
    
    playerAttack() {
        if (this.systems.player.attackCooldown > 0) return;
        
        this.systems.player.isAttacking = true;
        this.systems.player.attackCooldown = 0.5;
        
        // Эффект атаки
        this.createAttackEffect();
        
        // Проверка попадания по врагам
        this.checkAttackHit();
        
        // Вибрация геймпада
        if (this.systems.input.isGamepadConnected()) {
            this.systems.input.vibrate(0.3, 100);
        }
    }
    
    createAttackEffect() {
        // Создаём частицы атаки
        for (let i = 0; i < 10; i++) {
            this.addParticle({
                x: this.systems.player.x,
                y: this.systems.player.y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 5,
                life: 0.5,
                color: '#FF9800',
                size: 3 + Math.random() * 5
            });
        }
        
        // Эффект экрана
        this.effects.screenShake = { intensity: 5, duration: 0.1 };
    }
    
    checkAttackHit() {
        for (const enemy of this.systems.enemies) {
            if (!enemy.isActive) continue;
            
            // Простая проверка расстояния
            const dx = enemy.x - this.systems.player.x;
            const dy = enemy.y - this.systems.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 80) { // Радиус атаки
                const damage = this.systems.player.damage;
                const hit = enemy.takeDamage(damage, this.systems.player);
                
                if (hit) {
                    // Увеличение комбо
                    this.state.combo++;
                    this.state.maxCombo = Math.max(this.state.maxCombo, this.state.combo);
                    
                    // Добавление очков
                    this.state.score += 10 * this.state.combo;
                    
                    // Эффект попадания
                    this.createHitEffect(enemy.x, enemy.y);
                    
                    console.log(`[GAME] Попадание! Урон: ${damage}, Комбо: ${this.state.combo}`);
                }
            }
        }
    }
    
    createHitEffect(x, y) {
        // Частицы крови/льда
        for (let i = 0; i < 15; i++) {
            this.addParticle({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 20,
                vy: (Math.random() - 0.5) * 20,
                life: 1.0,
                color: '#FF5252',
                size: 2 + Math.random() * 4
            });
        }
    }
    
    updatePlayer(deltaTime) {
        const player = this.systems.player;
        
        // Кулдауны
        if (player.attackCooldown > 0) {
            player.attackCooldown -= deltaTime;
            if (player.attackCooldown <= 0) {
                player.isAttacking = false;
            }
        }
        
        // Способности
        for (const ability in player.abilities) {
            if (player.abilities[ability].current > 0) {
                player.abilities[ability].current -= deltaTime;
            }
        }
        
        // Пассивная регенерация
        if (player.health < player.maxHealth && this.state.time % 2 < deltaTime) {
            player.health = Math.min(player.maxHealth, player.health + 1);
        }
    }
    
    updateEnemies(deltaTime) {
        for (const enemy of this.systems.enemies) {
            if (enemy.isActive) {
                enemy.update(deltaTime, this.systems.player, []);
                
                // Атака врага по игроку
                this.checkEnemyAttacks(enemy, deltaTime);
            }
        }
        
        // Удаление мёртвых врагов
        this.systems.enemies = this.systems.enemies.filter(e => e.isActive);
    }
    
    checkEnemyAttacks(enemy, deltaTime) {
        if (enemy.attackTimer > 0 || !enemy.isActive) return;
        
        const dx = this.systems.player.x - enemy.x;
        const dy = this.systems.player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < enemy.attackRange) {
            // Враг атакует
            const attack = enemy.performAttack(this.systems.player, distance, Math.atan2(dy, dx));
            
            if (attack && attack.successful) {
                // Игрок получает урон
                this.playerTakeDamage(attack.damage);
                
                // Сброс комбо при получении урона
                this.state.combo = 0;
            }
        }
    }
    
    playerTakeDamage(damage) {
        if (this.systems.player.invulnerable) return;
        
        this.systems.player.health -= damage;
        this.systems.player.invulnerable = true;
        
        // Эффект получения урона
        this.effects.flash = { color: '#FF5252', duration: 0.2 };
        this.effects.screenShake = { intensity: 10, duration: 0.2 };
        
        // Вибрация
        if (this.systems.input.isGamepadConnected()) {
            this.systems.input.vibrate(0.5, 200);
        }
        
        console.log(`[GAME] Игрок получил урон: ${damage}, HP: ${this.systems.player.health}`);
        
        // Снятие неуязвимости через 1 секунду
        setTimeout(() => {
            this.systems.player.invulnerable = false;
        }, 1000);
    }
    
    updatePhysics(deltaTime) {
        // Простая физика: гравитация и столкновения
        // В полной версии будет сложная система
    }
    
    updateParticles(deltaTime) {
        // Обновление частиц
        for (let i = this.systems.particles.active.length - 1; i >= 0; i--) {
            const p = this.systems.particles.active[i];
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.life -= deltaTime;
            
            if (p.life <= 0) {
                this.systems.particles.active.splice(i, 1);
            }
        }
    }
    
    updateCamera(deltaTime) {
        // Плавное слежение за игроком
        const targetX = this.systems.player.x - this.width / 2;
        const targetY = this.systems.player.y - this.height / 2;
        
        this.systems.camera.x += (targetX - this.systems.camera.x) * 0.1;
        this.systems.camera.y += (targetY - this.systems.camera.y) * 0.1;
        
        // Дрожание камеры
        if (this.effects.screenShake.duration > 0) {
            this.systems.camera.x += (Math.random() - 0.5) * this.effects.screenShake.intensity;
            this.systems.camera.y += (Math.random() - 0.5) * this.effects.screenShake.intensity;
            this.effects.screenShake.duration -= deltaTime;
        }
    }
    
    updateEffects(deltaTime) {
        // Обновление визуальных эффектов
        if (this.effects.flash.duration > 0) {
            this.effects.flash.duration -= deltaTime;
        }
        
        if (this.effects.slowMo.duration > 0) {
            this.effects.slowMo.duration -= deltaTime;
            if (this.effects.slowMo.duration <= 0) {
                this.effects.slowMo.factor = 1;
            }
        }
    }
    
    addParticle(config) {
        if (this.systems.particles.active.length >= this.systems.particles.maxParticles) {
            return;
        }
        
        this.systems.particles.active.push({
            x: config.x,
            y: config.y,
            vx: config.vx || 0,
            vy: config.vy || 0,
            life: config.life || 1.0,
            color: config.color || '#FFFFFF',
            size: config.size || 2,
            type: config.type || 'circle'
        });
    }
    
    // === ОТРИСОВКА ===
    render() {
        // Очистка экрана
        this.ctx.fillStyle = '#0a192f';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Сохранение контекста для трансформаций камеры
        this.ctx.save();
        
        // Применение трансформаций камеры
        this.ctx.translate(-this.systems.camera.x, -this.systems.camera.y);
        
        // Отрисовка фона
        this.renderBackground();
        
        // Отрисовка врагов
        this.renderEnemies();
        
        // Отрисовка игрока
        this.renderPlayer();
        
        // Отрисовка частиц
        this.renderParticles();
        
        // Восстановление контекста
        this.ctx.restore();
        
        // Отрисовка UI (поверх всего)
        this.renderUI();
        
        // Эффекты экрана (вспышки и т.д.)
        this.renderScreenEffects();
    }
    
    renderBackground() {
        // Параллакс-эффект
        for (const layer of this.systems.background) {
            this.ctx.fillStyle = layer.color;
            this.ctx.fillRect(
                this.systems.camera.x * layer.speed,
                this.systems.camera.y * layer.speed,
                this.width,
                this.height
            );
            
            // Отрисовка элементов слоя
            for (const element of layer.elements) {
                this.ctx.fillStyle = `rgba(255, 255, 255, ${element.brightness})`;
                this.ctx.beginPath();
                this.ctx.arc(
                    element.x + this.systems.camera.x * layer.speed,
                    element.y + this.systems.camera.y * layer.speed,
                    element.size,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();
            }
        }
    }
    
    renderPlayer() {
        const player = this.systems.player;
        this.ctx.save();
        
        // Мигание при неуязвимости
        if (player.invulnerable) {
            this.ctx.globalAlpha = 0.5 + Math.sin(this.state.time * 10) * 0.3;
        }
        
        // Тело игрока
        this.ctx.fillStyle = player.color;
        this.ctx.beginPath();
        this.ctx.arc(player.x, player.y, player.width / 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Оружие/атака
        if (player.isAttacking) {
            this.ctx.fillStyle = '#FF9800';
            this.ctx.beginPath();
            this.ctx.arc(player.x + 30, player.y, 15, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    renderEnemies() {
        for (const enemy of this.systems.enemies) {
            if (enemy.draw) {
                enemy.draw(this.ctx);
            } else {
                // Заглушка для отрисовки
                this.ctx.fillStyle = enemy.color || '#FF5252';
                this.ctx.beginPath();
                this.ctx.arc(enemy.x, enemy.y, enemy.width / 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }
    
    renderParticles() {
        for (const p of this.systems.particles.active) {
            this.ctx.save();
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            
            if (p.type === 'circle') {
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                this.ctx.fillRect(p.x, p.y, p.size, p.size);
            }
            
            this.ctx.restore();
        }
    }
    
    renderUI() {
        // Восстановление координат (без трансформаций камеры)
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // Полоска здоровья игрока
        this.renderHealthBar(
            20, 20, 300, 30,
            this.systems.player.health / this.systems.player.maxHealth,
            '#4CAF50',
            `❤️ Игрок: ${Math.ceil(this.systems.player.health)}/${this.systems.player.maxHealth}`
        );
        
        // Очки и комбо
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillText(`Очки: ${this.state.score}`, 20, 80);
        this.ctx.fillText(`Комбо: x${this.state.combo}`, 20, 110);
        this.ctx.fillText(`Макс комбо: x${this.state.maxCombo}`, 20, 140);
        
        // FPS (только в режиме отладки)
        if (window.DEBUG_MODE) {
            this.ctx.fillStyle = this.performance.fps < 30 ? '#FF5252' : '#4CAF50';
            this.ctx.fillText(`FPS: ${this.performance.fps}`, this.width - 100, 30);
        }
        
        this.ctx.restore();
    }
    
    renderHealthBar(x, y, width, height, percent, color, text) {
        // Фон
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x, y, width, height);
        
        // Здоровье
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, width * percent, height);
        
        // Рамка
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
        
        // Текст
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, x + width / 2, y + height / 2 + 6);
        this.ctx.textAlign = 'left';
    }
    
    renderScreenEffects() {
        // Вспышка при получении урона
        if (this.effects.flash.duration > 0) {
            this.ctx.fillStyle = this.effects.flash.color;
            this.ctx.globalAlpha = this.effects.flash.duration * 0.5;
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.globalAlpha = 1.0;
        }
    }
    
    // === УПРАВЛЕНИЕ ИГРОЙ ===
    checkGameState() {
        // Поражение
        if (this.systems.player.health <= 0 && !this.state.gameOver) {
            this.gameOver();
        }
        
        // Победа над всеми врагами
        if (this.systems.enemies.length === 0 && !this.state.victory) {
            this.victory();
        }
    }
    
    gameOver() {
        this.state.gameOver = true;
        this.state.running = false;
        
        console.log('[GAME] Игра окончена!');
        
        // Показ экрана поражения
        this.showGameOverScreen();
        
        // Обновление меню
        if (window.DynamicMenu) {
            window.DynamicMenu.showNotification('Поражение! Попробуй ещё раз.', 'error');
        }
    }
    
    victory() {
        this.state.victory = true;
        this.state.running = false;
        
        console.log('[GAME] Победа!');
        
        // Показ экрана победы
        this.showVictoryScreen();
        
        // Обновление прогресса в меню
        if (window.DynamicMenu) {
            window.DynamicMenu.updateProgress({
                enemiesDefeated: this.state.score / 10,
                playTime: this.state.time
            });
            window.DynamicMenu.showNotification('Победа! Отличный результат!', 'success');
