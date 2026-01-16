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
                quality: 'high',
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
                difficulty: 'normal',
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
        this.setupCanvas();
        this.loadAssets();
        this.createGameObjects();
        this.setupEventHandlers();
        this.startGameLoop();
    }
    
    setupCanvas() {
        this.ctx.imageSmoothingEnabled = this.settings.graphics.antialias;
        this.ctx.imageSmoothingQuality = 'high';
        
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
        console.log('[GAME] Загрузка ресурсов...');
        
        this.assets = {
            loaded: false,
            progress: 0,
            images: {},
            sounds: {},
            fonts: {}
        };
        
        const fakeLoad = setInterval(() => {
            this.assets.progress += 10;
            if (this.assets.progress >= 100) {
                this.assets.loaded = true;
                clearInterval(fakeLoad);
                console.log('[GAME] Ресурсы загружены');
                
                if (window.DynamicMenu) {
                    window.DynamicMenu.showNotification('Игра загружена!', 'success');
                }
            }
        }, 100);
    }
    
    createGameObjects() {
        this.systems.player = this.createPlayer();
        this.createEnemies();
        this.createBackground();
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
        const seal = new Seal({
            x: this.width * 0.75,
            y: this.height / 2,
            name: 'Тюлень Лорд'
        });
        
        this.systems.enemies.push(seal);
        console.log(`[GAME] Создан враг: ${seal.name}`);
    }
    
    createBackground() {
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
    
    createMountainRange() {
        const mountains = [];
        const count = 8;
        for (let i = 0; i <= count; i++) {
            mountains.push({
                x: (i / count) * this.width * 1.5,
                y: this.height * 0.6,
                width: 150 + Math.random() * 100,
                height: 100 + Math.random() * 150,
                color: `hsl(210, 50%, ${30 + Math.random() * 20}%)`
            });
        }
        return mountains;
    }
    
    createIcebergs() {
        const icebergs = [];
        for (let i = 0; i < 10; i++) {
            icebergs.push({
                x: Math.random() * this.width * 2,
                y: this.height * 0.7 + Math.random() * 100,
                width: 40 + Math.random() * 60,
                height: 60 + Math.random() * 80,
                color: `hsl(200, ${60 + Math.random() * 20}%, ${70 + Math.random() * 20}%)`
            });
        }
        return icebergs;
    }
    
    createParticleSystem() {
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
            this.performance.deltaTime = (currentTime - this.performance.lastTime) / 1000;
            this.performance.lastTime = currentTime;
            
            if (this.performance.deltaTime > 0.1) {
                this.performance.deltaTime = 0.1;
                this.performance.slowFrames++;
            }
            
            this.updateFPS(currentTime);
            
            if (!this.state.paused && this.state.running) {
                this.update(this.performance.deltaTime);
                this.render();
            }
            
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
            
            if (window.DEBUG_MODE) {
                console.log(`[FPS: ${this.performance.fps}]`);
            }
        }
    }
    
    update(deltaTime) {
        this.state.time += deltaTime;
        this.updateInput(deltaTime);
        this.updatePlayer(deltaTime);
        this.updateEnemies(deltaTime);
        this.updatePhysics(deltaTime);
        this.updateParticles(deltaTime);
        this.updateCamera(deltaTime);
        this.updateEffects(deltaTime);
        this.checkGameState();
    }
    
    updateInput(deltaTime) {
        if (!this.systems.input) return;
        
        const input = this.systems.input;
        const moveVector = input.getMoveVector();
        
        this.systems.player.x += moveVector.x * this.systems.player.speed;
        this.systems.player.y += moveVector.y * this.systems.player.speed;
        
        this.systems.player.x = Math.max(50, Math.min(this.width - 50, this.systems.player.x));
        this.systems.player.y = Math.max(50, Math.min(this.height - 50, this.systems.player.y));
        
        if (input.getAction('attack')) {
            this.playerAttack();
        }
        
        if (input.getAction('jump')) {
            this.playerJump();
        }
        
        if (input.getAction('dodge')) {
            this.playerDodge();
        }
        
        if (input.getAction('menu')) {
            this.togglePause();
        }
    }
    
    playerAttack() {
        if (this.systems.player.attackCooldown > 0) return;
        
        this.systems.player.isAttacking = true;
        this.systems.player.attackCooldown = 0.5;
        this.createAttackEffect();
        this.checkAttackHit();
        
        if (this.systems.input.isGamepadConnected()) {
            this.systems.input.vibrate(0.3, 100);
        }
    }
    
    createAttackEffect() {
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
        
        this.effects.screenShake = { intensity: 5, duration: 0.1 };
    }
    
    checkAttackHit() {
        for (const enemy of this.systems.enemies) {
            if (!enemy.isActive) continue;
            
            const dx = enemy.x - this.systems.player.x;
            const dy = enemy.y - this.systems.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 80) {
                const damage = this.systems.player.damage;
                const hit = enemy.takeDamage(damage, this.systems.player);
                
                if (hit) {
                    this.state.combo++;
                    this.state.maxCombo = Math.max(this.state.maxCombo, this.state.combo);
                    this.state.score += 10 * this.state.combo;
                    this.createHitEffect(enemy.x, enemy.y);
                    
                    console.log(`[GAME] Попадание! Урон: ${damage}, Комбо: ${this.state.combo}`);
                }
            }
        }
    }
    
    createHitEffect(x, y) {
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
    
    playerJump() {
        console.log('[GAME] Прыжок!');
        // В полной версии будет физика прыжка
    }
    
    playerDodge() {
        console.log('[GAME] Уворот!');
        // В полной версии будет неуязвимость при увороте
    }
    
    updatePlayer(deltaTime) {
        const player = this.systems.player;
        
        if (player.attackCooldown > 0) {
            player.attackCooldown -= deltaTime;
            if (player.attackCooldown <= 0) {
                player.isAttacking = false;
            }
        }
        
        for (const ability in player.abilities) {
            if (player.abilities[ability].current > 0) {
                player.abilities[ability].current -= deltaTime;
            }
        }
        
        if (player.health < player.maxHealth && this.state.time % 2 < deltaTime) {
            player.health = Math.min(player.maxHealth, player.health + 1);
        }
    }
    
    updateEnemies(deltaTime) {
        for (const enemy of this.systems.enemies) {
            if (enemy.isActive) {
                enemy.update(deltaTime, this.systems.player, []);
                this.checkEnemyAttacks(enemy, deltaTime);
            }
        }
        
        this.systems.enemies = this.systems.enemies.filter(e => e.isActive);
    }
    
    checkEnemyAttacks(enemy, deltaTime) {
        if (enemy.attackTimer > 0 || !enemy.isActive) return;
        
        const dx = this.systems.player.x - enemy.x;
        const dy = this.systems.player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < enemy.attackRange) {
            const attack = enemy.performAttack(this.systems.player, distance, Math.atan2(dy, dx));
            
            if (attack && attack.successful) {
                this.playerTakeDamage(attack.damage);
                this.state.combo = 0;
            }
        }
    }
    
    playerTakeDamage(damage) {
        if (this.systems.player.invulnerable) return;
        
        this.systems.player.health -= damage;
        this.systems.player.invulnerable = true;
        
        this.effects.flash = { color: '#FF5252', duration: 0.2 };
        this.effects.screenShake = { intensity: 10, duration: 0.2 };
        
        if (this.systems.input.isGamepadConnected()) {
            this.systems.input.vibrate(0.5, 200);
        }
        
        console.log(`[GAME] Игрок получил урон: ${damage}, HP: ${this.systems.player.health}`);
        
        setTimeout(() => {
            this.systems.player.invulnerable = false;
        }, 1000);
    }
    
    updatePhysics(deltaTime) {
        // Простая гравитация для частиц
        for (const p of this.systems.particles.active) {
            p.vy += 0.1; // Гравитация
        }
    }
    
    updateParticles(deltaTime) {
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
        const targetX = this.systems.player.x - this.width / 2;
        const targetY = this.systems.player.y - this.height / 2;
        
        this.systems.camera.x += (targetX - this.systems.camera.x) * 0.1;
        this.systems.camera.y += (targetY - this.systems.camera.y) * 0.1;
        
        if (this.effects.screenShake.duration > 0) {
            this.systems.camera.x += (Math.random() - 0.5) * this.effects.screenShake.intensity;
            this.systems.camera.y += (Math.random() - 0.5) * this.effects.screenShake.intensity;
            this.effects.screenShake.duration -= deltaTime;
        }
    }
    
    updateEffects(deltaTime) {
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
        this.ctx.fillStyle = '#0a192f';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.save();
        this.ctx.translate(-this.systems.camera.x, -this.systems.camera.y);
        
        this.renderBackground();
        this.renderEnemies();
        this.renderPlayer();
        this.renderParticles();
        
        this.ctx.restore();
        
        this.renderUI();
        this.renderScreenEffects();
    }
    
    renderBackground() {
        for (const layer of this.systems.background) {
            this.ctx.fillStyle = layer.color;
            this.ctx.fillRect(
                this.systems.camera.x * layer.speed,
                this.systems.camera.y * layer.speed,
                this.width,
                this.height
            );
            
            // Звёзды/снежинки
            if (layer.type === 'sky') {
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
            
            // Горы
            if (layer.type === 'mountains') {
                for (const mountain of layer.elements) {
                    this.ctx.fillStyle = mountain.color;
                    this.ctx.beginPath();
                    this.ctx.moveTo(
                        mountain.x + this.systems.camera.x * layer.speed,
                        this.height
                    );
                    this.ctx.lineTo(
                        mountain.x + this.systems.camera.x * layer.speed + mountain.width / 2,
                        mountain.y + this.systems.camera.y * layer.speed
                    );
                    this.ctx.lineTo(
                        mountain.x + this.systems.camera.x * layer.speed + mountain.width,
                        this.height
                    );
                    this.ctx.closePath();
                    this.ctx.fill();
                }
            }
        }
    }
    
    renderPlayer() {
        const player = this.systems.player;
        this.ctx.save();
        
        if (player.invulnerable) {
            this.ctx.globalAlpha = 0.5 + Math.sin(this.state.time * 10) * 0.3;
        }
        
        // Тело игрока (пиксельный стиль)
        this.ctx.fillStyle = player.color;
        this.ctx.fillRect(
            player.x - player.width / 2,
            player.y - player.height / 2,
            player.width,
            player.height
        );
        
        // Голова
        this.ctx.fillStyle = '#8BC34A';
        this.ctx.fillRect(
            player.x - player.width / 3,
            player.y - player.height / 2 - 10,
            player.width * 0.66,
            15
        );
        
        // Оружие при атаке
        if (player.isAttacking) {
            this.ctx.fillStyle = '#FF9800';
            this.ctx.fillRect(
                player.x + player.width / 2,
                player.y - 10,
                25,
                20
            );
        }
        
        this.ctx.restore();
    }
    
    renderEnemies() {
        for (const enemy of this.systems.enemies) {
            if (enemy.draw) {
                enemy.draw(this.ctx);
            } else {
                // Заглушка
                this.ctx.fillStyle = '#FF5252';
                this.ctx.beginPath();
                this.ctx.arc(enemy.x, enemy.y, enemy.width / 2, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Имя врага
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = '12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(enemy.name, enemy.x, enemy.y - 40);
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
        
        // Комбо с эффектом
        if (this.state.combo > 1) {
            const comboScale = 1 + (this.state.combo * 0.05);
            this.ctx.save();
            this.ctx.translate(20, 110);
            this.ctx.scale(comboScale, comboScale);
            this.ctx.fillStyle = `hsl(${this.state.combo * 10}, 100%, 60%)`;
            this.ctx.fillText(`КОМБО: x${this.state.combo}`, 0, 0);
            this.ctx.restore();
        } else {
            this.ctx.fillText(`Комбо: x${this.state.combo}`, 20, 110);
        }
        
        this.ctx.fillText(`Макс комбо: x${this.state.maxCombo}`, 20, 140);
        
        // Время игры
        this.ctx.fillStyle = '#BB86FC';
        this.ctx.fillText(`Время: ${Math.floor(this.state.time)}с`, 20, 170);
        
        // FPS (для отладки)
        if (window.DEBUG_MODE) {
            this.ctx.fillStyle = this.performance.fps < 30 ? '#FF5252' : '#4CAF50';
            this.ctx.fillText(`FPS: ${this.performance.fps}`, this.width - 100, 30);
            
            // Отладочная информация
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(`Врагов: ${this.systems.enemies.length}`, this.width - 100, 50);
            this.ctx.fillText(`Частиц: ${this.systems.particles.active.length}`, this.width - 100, 65);
        }
        
        this.ctx.restore();
    }
    
    renderHealthBar(x, y, width, height, percent, color, text) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x, y, width, height);
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, width * percent, height);
        
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, x + width / 2, y + height / 2 + 6);
        this.ctx.textAlign = 'left';
    }
    
    renderScreenEffects() {
        if (this.effects.flash.duration > 0) {
            this.ctx.fillStyle = this.effects.flash.color;
            this.ctx.globalAlpha = this.effects.flash.duration * 0.5;
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.globalAlpha = 1.0;
        }
    }
    
    // === УПРАВЛЕНИЕ ИГРОЙ ===
    checkGameState() {
        if (this.systems.player.health <= 0 && !this.state.gameOver) {
            this.gameOver();
        }
        
        if (this.systems.enemies.length === 0 && !this.state.victory) {
            this.victory();
        }
    }
    
    gameOver() {
        this.state.gameOver = true;
        this.state.running = false;
        
        console.log('[GAME] Игра окончена!');
        
        this.showGameOverScreen();
        
        if (window.DynamicMenu) {
            window.DynamicMenu.showNotification('Поражение! Попробуй ещё раз.', 'error');
        }
    }
    
    showGameOverScreen() {
        const gameOverHTML = `
            <div style="
                position: absolute;
                top: 0; left: 0;
                width: 100%; height: 100%;
                background: rgba(0, 0, 0, 0.85);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                color: white;
                z-index: 1000;
                font-family: Arial, sans-serif;
            ">
                <h1 style="color: #FF5252; font-size: 4em; margin-bottom: 20px;">💀 ПОРАЖЕНИЕ 💀</h1>
                <div style="font-size: 1.5em; margin-bottom: 40px; text-align: center;">
                    <p>Вы пали в битве с тюленем!</p>
                    <p>Ваш счёт: ${this.state.score}</p>
                    <p>Максимальное комбо: x${this.state.maxCombo}</p>
                    <p>Время выживания: ${Math.floor(this.state.time)} секунд</p>
                </div>
                <div style="display: flex; gap: 20px;">
                    <button onclick="game.restart()" style="
                        background: linear-gradient(145deg, #4CAF50, #2E7D32);
                        color: white;
                        border: none;
                        padding: 20px 40px;
                        font-size: 1.5em;
                        border-radius: 15px;
                        cursor: pointer;
                        transition: transform 0.2s;
                        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                        🔄 Играть снова
                    </button>
                    <button onclick="window.DynamicMenu.changeState('main')" style="
                        background: linear-gradient(145deg, #2196F3, #0D47A1);
                        color: white;
                        border: none;
                        padding: 20px 40px;
                        font-size: 1.5em;
                        border-radius: 15px;
                        cursor: pointer;
                        transition: transform 0.2s;
                        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                        🏠 В главное меню
                    </button>
                </div>
                <p style="margin-top: 40px; opacity: 0.7; font-size: 0.9em;">
                    Совет: Попробуй уворачиваться от атак тюленя и атаковать в паузах между его атаками
                </p>
            </div>
        `;
        
        const div = document.createElement('div');
        div.innerHTML = gameOverHTML;
        div.id = 'gameover-screen';
        document.body.appendChild(div);
    }
    
    victory() {
        this.state.victory = true;
        this.state.running = false;
        
        console.log('[GAME] Победа!');
        
        this.showVictoryScreen();
        
        if (window.DynamicMenu) {
            window.DynamicMenu.updateProgress({
                enemiesDefeated: this.state.score / 10,
                playTime: this.state.time
            });
            window.DynamicMenu.showNotification('Победа! Отличный результат!', 'success');
        }
    }
    
    showVictoryScreen() {
        const victoryHTML = `
            <div style="
                position: absolute;
                top: 0; left: 0;
                width: 100%; height: 100%;
                background: linear-gradient(135deg, rgba(76, 175, 80, 0.9), rgba(33, 150, 243, 0.9));
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                color: white;
                z-index: 1000;
                font-family: Arial, sans-serif;
                text-align: center;
            ">
                <h1 style="font-size: 4em; margin-bottom: 20px; text-shadow: 3px 3px 0 rgba(0,0,0,0.3);">
                    🏆 ПОБЕДА! 🏆
                </h1>
                <div style="
                    background: rgba(0, 0, 0, 0.5);
                    padding: 30px;
                    border-radius: 20px;
                    margin-bottom: 40px;
                    min-width: 400px;
                    backdrop-filter: blur(10px);
                ">
                    <p style="font-size: 1.8em; margin: 10px 0;">⏱️ Время: ${Math.floor(this.state.time)}с</p>
                    <p style="font-size: 1.8em; margin: 10px 0;">🎯 Очки: ${this.state.score}</p>
                    <p style="font-size: 1.8em; margin: 10px 0;">🔥 Макс комбо: x${this.state.maxCombo}</p>
                    <p style="font-size: 1.8em; margin: 10px 0;">🦭 Тюленей побеждено: 1</p>
                </div>
                <div style="display: flex; gap: 20px; margin-bottom: 30px;">
                    <button onclick="game.restart()" style="
                        background: linear-gradient(145deg, #4CAF50, #2E7D32);
                        color: white;
                        border: none;
                        padding: 20px 40px;
                        font-size: 1.5em;
                        border-radius: 15px;
                        cursor: pointer;
                        transition: all 0.3s;
                        box-shadow: 0 5px 20px rgba(0,0,0,0.4);
                        border: 3px solid rgba(255,255,255,0.3);
                    " onmouseover="this.style.transform='scale(1.1)'; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.5)'" 
                     onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 5px 20px rgba(0,0,0,0.4)'">
                        🎮 Следующий бой
                    </button>
                    <button onclick="window.DynamicMenu.changeState('main')" style="
                        background: linear-gradient(145deg, #2196F3, #0D47A1);
                        color: white;
                        border: none;
                        padding: 20px 40px;
                        font-size: 1.5em;
                        border-radius: 15px;
                        cursor: pointer;
                        transition: all 0.3s;
                        box-shadow: 0 5px 20px rgba(0,0,0,0.4);
                        border: 3px solid rgba(255,255,255,0.3);
                    " onmouseover="this.style.transform='scale(1.1)'; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.5)'" 
                     onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 5px 20px rgba(0,0,0,0.4)'">
                        🏠 В меню
                    </button>
                </div>
                <div style="
                    background: rgba(255, 255, 255, 0.1);
                    padding: 20px;
                    border-radius: 15px;
                    max-width: 600px;
                    margin-top: 20px;
                ">
                    <p style="font-size: 1.2em; margin: 0;">
                        🎉 Отличная работа! Вы победили первого тюленя!<br>
                        В следующих обновлениях вас ждут: <strong>Дингус, Максвелл, Йо-Чан и другие боссы!</strong>
                    </p>
                </div>
            </div>
        `;
        
        const div = document.createElement('div');
        div.innerHTML = victoryHTML;
        div.id = 'victory-screen';
        document.body.appendChild(div);
    }
    
    restart() {
        const victoryScreen = document.getElementById('victory-screen');
        const gameOverScreen = document.getElementById('gameover-screen');
        
        if (victoryScreen) victoryScreen.remove();
        if (gameOverScreen) gameOverScreen.remove();
        
        this.state = {
            running: true,
            paused: false,
            gameOver: false,
            victory: false,
            currentLevel: 1,
            score: 0,
            time: 0,
            combo: 0,
            maxCombo: 0
        };
        
        this.systems.player = this.createPlayer();
        this.systems.enemies = [];
        this.createEnemies();
        
        this.systems.particles.active = [];
        
        console.log('[GAME] Игра перезапущена');
    }
    
    togglePause() {
        this.state.paused = !this.state.paused;
        console.log(`[GAME] Пауза: ${this.state.paused}`);
        
        if (window.DynamicMenu) {
            if (this.state.paused) {
                window.DynamicMenu.showNotification('Игра на паузе', 'info');
            }
        }
    }
    
    start() {
        this.state.running = true;
        this.state.paused = false;
        console.log('[GAME] Игра начата');
    }
    
    pause() {
        this.state.paused = true;
    }
    
    resume() {
        this.state.paused = false;
    }
    
    // === ПУБЛИЧНЫЕ МЕТОДЫ ===
    getState() {
        return { ...this.state };
    }
    
    getPerformance() {
        return { ...this.performance };
    }
    
    getPlayer() {
        return { ...this.systems.player };
    }
    
    debug() {
        window.DEBUG_MODE = !window.DEBUG_MODE;
        console.log(`[GAME] Режим отладки: ${window.DEBUG_MODE}`);
        
        if (window.DEBUG_MODE) {
            // Даём игроку преимущества для тестирования
            this.systems.player.health = 999;
            this.systems.player.damage = 50;
            console.log('[DEBUG] Режим бога активирован!');
        }
    }
    
    // Утилиты
    setupEventHandlers() {
        window.addEventListener('keydown', (e) => {
            if (e.key === '`' || e.key === '~') { // Клавиша ~ для отладки
                this.debug();
            }
            
            if (e.key === 'p' || e.key === 'P') {
                this.togglePause();
            }
        });
    }
}

// Создаём глобальный экземпляр игры
window.game = new GameEngine();

// Экспорт для модулей (если нужно)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameEngine;
}

// Горячие клавиши для отладки
window.addEventListener('load', () => {
    console.log(`
    ============================================
    🎮 БИТВА ЗА ЛЬДИНУ - УПРАВЛЕНИЕ:
    ============================================
    WASD/Стрелки - Движение
    Пробел/J     - Атака
    K/X          - Прыжок
    Shift/C      - Уворот
    P            - Пауза
    Escape       - Меню
    ~            - Режим отладки (админка)
    ============================================
    Геймпад: Xbox/PS поддерживается автоматически
    Тачскрин: Виртуальные кнопки на мобильных
    ============================================
    `);
});