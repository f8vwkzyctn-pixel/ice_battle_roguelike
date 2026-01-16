/**
 * ПОЛНЫЙ БАЗОВЫЙ КЛАСС ВРАГА
 * Включает: ИИ уклонения, патрулирование, адаптацию, анимации
 */
class EnemyBase {
    constructor(config) {
        // === БАЗОВЫЕ СВОЙСТВА ===
        this.id = `enemy_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        this.name = config.name || 'Враг';
        this.type = config.type || 'normal';
        
        // Позиция и физика
        this.x = config.x || 400;
        this.y = config.y || 300;
        this.width = config.width || 64;
        this.height = config.height || 64;
        this.velocity = { x: 0, y: 0 };
        this.speed = config.speed || 2.5;
        this.baseSpeed = this.speed;
        
        // Здоровье
        this.maxHealth = config.maxHealth || 100;
        this.health = config.health || this.maxHealth;
        this.healthRegen = config.healthRegen || 0.1;
        this.invulnerable = false;
        this.invulnerabilityTime = 0;
        
        // Боевые параметры
        this.damage = config.damage || 10;
        this.attackRange = config.attackRange || 80;
        this.attackCooldown = config.attackCooldown || 1.0;
        this.attackTimer = 0;
        this.visionRange = config.visionRange || 300;
        this.agroRange = config.agroRange || 200;
        
        // === СИСТЕМА АНИМАЦИЙ ===
        this.animations = {};
        this.currentAnimation = null;
        this.animationTimer = 0;
        this.animationSpeed = config.animationSpeed || 0.15;
        this.spriteFrames = config.spriteFrames || { width: 32, height: 32, cols: 8 };
        
        // === ПРОДВИНУТЫЙ ИИ ===
        this.ai = {
            // Состояния: idle, patrol, chase, attack, evade, retreat
            state: 'idle',
            stateTimer: 0,
            target: null,
            lastKnownPlayerPosition: null,
            memory: [], // [action, success, timestamp]
            
            // Параметры ИИ
            aggressiveness: config.aggressiveness || 0.7, // 0-1
            caution: config.caution || 0.3, // 0-1
            unpredictability: config.unpredictability || 0.2, // 0-1
            learningRate: 0.1,
            
            // Уклонение
            dodgeChance: config.dodgeChance || 0.3,
            lastDodgeTime: 0,
            dodgeCooldown: 1.5,
            
            // Патрулирование
            patrolPoints: [],
            currentPatrolIndex: 0,
            patrolSpeed: this.speed * 0.7,
            idleTime: 0,
            maxIdleTime: 2.0
        };
        
        // === АДАПТИВНОЕ ПОВЕДЕНИЕ ===
        this.behavior = {
            learnedPatterns: {},
            playerStyle: null, // aggressive, defensive, evasive
            counterStrategy: 'neutral',
            successfulAttacks: 0,
            failedAttacks: 0,
            damageDealt: 0,
            damageTaken: 0
        };
        
        // === ВИЗУАЛЬНЫЕ ЭФФЕКТЫ ===
        this.effects = {
            hitFlash: 0,
            shield: 0,
            aura: null,
            particles: []
        };
        
        // === СЕТЕВЫЕ СВОЙСТВА (для мультиплеера) ===
        this.networkId = null;
        this.isRemote = false;
        this.lastUpdateTime = 0;
        
        console.log(`[ENEMY] Создан ${this.name} (ID: ${this.id})`);
    }
    
    // === ОСНОВНОЙ ЦИКЛ ОБНОВЛЕНИЯ ===
    update(deltaTime, player, obstacles = []) {
        if (!deltaTime || deltaTime > 0.1) deltaTime = 0.016;
        
        // Кулдауны
        if (this.attackTimer > 0) this.attackTimer -= deltaTime;
        if (this.invulnerabilityTime > 0) this.invulnerabilityTime -= deltaTime;
        this.invulnerable = this.invulnerabilityTime > 0;
        
        // Регенерация
        if (this.health < this.maxHealth && this.ai.state !== 'chase') {
            this.health = Math.min(this.maxHealth, this.health + this.healthRegen * deltaTime);
        }
        
        // Обновление ИИ
        this.updateAI(deltaTime, player, obstacles);
        
        // Обновление физики
        this.updatePhysics(deltaTime);
        
        // Обновление анимации
        this.updateAnimation(deltaTime);
        
        // Обновление эффектов
        this.updateEffects(deltaTime);
        
        // Ограничение области
        this.constrainToBounds();
    }
    
    // === ПРОДВИНУТЫЙ ИИ С УКЛОНЕНИЕМ ===
    updateAI(deltaTime, player, obstacles) {
        this.ai.stateTimer += deltaTime;
        
        // Определяем расстояние до игрока
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angleToPlayer = Math.atan2(dy, dx);
        
        // Обновляем последнюю известную позицию
        if (distance < this.visionRange) {
            this.ai.lastKnownPlayerPosition = { x: player.x, y: player.y };
        }
        
        // Машина состояний ИИ
        switch (this.ai.state) {
            case 'idle':
                this.updateIdleState(deltaTime, player, distance);
                break;
                
            case 'patrol':
                this.updatePatrolState(deltaTime, player, distance);
                break;
                
            case 'chase':
                this.updateChaseState(deltaTime, player, distance, angleToPlayer, obstacles);
                break;
                
            case 'attack':
                this.updateAttackState(deltaTime, player, distance, angleToPlayer);
                break;
                
            case 'evade':
                this.updateEvadeState(deltaTime, player, distance, angleToPlayer);
                break;
                
            case 'retreat':
                this.updateRetreatState(deltaTime, player, distance);
                break;
        }
        
        // Адаптация к стилю игрока
        if (this.ai.stateTimer > 5.0) {
            this.adaptToPlayer(player);
            this.ai.stateTimer = 0;
        }
        
        // Случайная смена поведения для непредсказуемости
        if (Math.random() < this.ai.unpredictability * deltaTime) {
            this.randomBehaviorChange();
        }
    }
    
    // Состояние: бездействие
    updateIdleState(deltaTime, player, distance) {
        this.velocity.x = 0;
        this.velocity.y = 0;
        
        // Случайные движения на месте
        this.ai.idleTime += deltaTime;
        if (this.ai.idleTime > this.ai.maxIdleTime) {
            // Переход в патрулирование или преследование
            if (distance < this.agroRange && Math.random() < this.ai.aggressiveness) {
                this.changeAIState('chase', player);
            } else if (this.ai.patrolPoints.length > 0) {
                this.changeAIState('patrol');
            }
            this.ai.idleTime = 0;
        }
        
        // Игрок близко - начинаем преследование
        if (distance < this.agroRange) {
            this.changeAIState('chase', player);
        }
    }
    
    // Состояние: патрулирование
    updatePatrolState(deltaTime, player, distance) {
        if (this.ai.patrolPoints.length === 0) {
            this.changeAIState('idle');
            return;
        }
        
        const targetPoint = this.ai.patrolPoints[this.ai.currentPatrolIndex];
        const dx = targetPoint.x - this.x;
        const dy = targetPoint.y - this.y;
        const pointDistance = Math.sqrt(dx * dx + dy * dy);
        
        // Движение к точке
        if (pointDistance > 10) {
            const angle = Math.atan2(dy, dx);
            this.velocity.x = Math.cos(angle) * this.ai.patrolSpeed;
            this.velocity.y = Math.sin(angle) * this.ai.patrolSpeed;
        } else {
            // Достигли точки
            this.ai.currentPatrolIndex = (this.ai.currentPatrolIndex + 1) % this.ai.patrolPoints.length;
            this.changeAIState('idle');
        }
        
        // Игрок близко - прерываем патрулирование
        if (distance < this.agroRange) {
            this.changeAIState('chase', player);
        }
    }
    
    // Состояние: преследование с уклонением
    updateChaseState(deltaTime, player, distance, angleToPlayer, obstacles) {
        // Анализируем атаки игрока
        const isPlayerAttacking = player.isAttacking || player.attackCooldown < 0.5;
        
        // Уклонение от атак
        if (isPlayerAttacking && distance < 150 && Math.random() < this.ai.dodgeChance) {
            if (Date.now() - this.ai.lastDodgeTime > this.ai.dodgeCooldown * 1000) {
                this.changeAIState('evade', player);
                return;
            }
        }
        
        // Проверка препятствий
        let avoidX = 0, avoidY = 0;
        for (const obstacle of obstacles) {
            const obsDist = this.distanceTo(obstacle);
            if (obsDist < 100) {
                const angle = Math.atan2(this.y - obstacle.y, this.x - obstacle.x);
                avoidX += Math.cos(angle) * (100 - obsDist) * 0.01;
                avoidY += Math.sin(angle) * (100 - obsDist) * 0.01;
            }
        }
        
        // Движение к игроку с учетом препятствий
        if (distance > this.attackRange) {
            const chaseSpeed = this.speed * (1 + this.ai.aggressiveness * 0.5);
            this.velocity.x = Math.cos(angleToPlayer) * chaseSpeed + avoidX;
            this.velocity.y = Math.sin(angleToPlayer) * chaseSpeed + avoidY;
        } else {
            // В зоне атаки
            this.changeAIState('attack', player);
            return;
        }
        
        // Игрок слишком далеко - возвращаемся
        if (distance > this.visionRange * 1.5) {
            this.changeAIState('patrol');
        }
    }
    
    // Состояние: атака с интеллектом
    updateAttackState(deltaTime, player, distance, angleToPlayer) {
        // Поддерживаем дистанцию для атаки
        if (distance > this.attackRange * 1.2) {
            this.changeAIState('chase', player);
            return;
        }
        
        if (distance < this.attackRange * 0.7) {
            // Слишком близко - отступаем
            this.velocity.x = -Math.cos(angleToPlayer) * this.speed * 0.8;
            this.velocity.y = -Math.sin(angleToPlayer) * this.speed * 0.8;
        } else {
            // Оптимальная дистанция
            this.velocity.x = Math.cos(angleToPlayer) * this.speed * 0.3;
            this.velocity.y = Math.sin(angleToPlayer) * this.speed * 0.3;
        }
        
        // Атака при возможности
        if (this.attackTimer <= 0 && distance <= this.attackRange) {
            this.performAttack(player, distance, angleToPlayer);
            this.attackTimer = this.attackCooldown;
            
            // После атаки возможен отход
            if (Math.random() < this.ai.caution && this.health < this.maxHealth * 0.5) {
                this.changeAIState('evade', player);
            }
        }
        
        // Слишком поврежден - отступаем
        if (this.health < this.maxHealth * 0.3 && Math.random() < 0.1) {
            this.changeAIState('retreat', player);
        }
    }
    
    // Состояние: уклонение (НОВАЯ механика!)
    updateEvadeState(deltaTime, player, distance, angleToPlayer) {
        this.ai.lastDodgeTime = Date.now();
        
        // Уклонение в сторону, перпендикулярную игроку
        const evadeAngle = angleToPlayer + (Math.random() > 0.5 ? Math.PI/2 : -Math.PI/2);
        const evadeDistance = 100 + Math.random() * 100;
        
        this.velocity.x = Math.cos(evadeAngle) * this.speed * 2.0;
        this.velocity.y = Math.sin(evadeAngle) * this.speed * 2.0;
        
        // Эффект уклонения
        this.effects.hitFlash = 0.3;
        this.speed = this.baseSpeed * 1.5;
        
        // Возврат в chase через 0.5-1 сек
        if (this.ai.stateTimer > 0.5 + Math.random() * 0.5) {
            this.speed = this.baseSpeed;
            this.changeAIState('chase', player);
        }
    }
    
    // Состояние: отступление
    updateRetreatState(deltaTime, player, distance) {
        // Отступаем от игрока
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const retreatAngle = Math.atan2(dy, dx) + Math.PI; // Противоположное направление
        
        this.velocity.x = Math.cos(retreatAngle) * this.speed * 1.2;
        this.velocity.y = Math.sin(retreatAngle) * this.speed * 1.2;
        
        // Ищем укрытия
        if (this.ai.stateTimer > 1.0) {
            // Восстанавливаемся
            this.health += this.healthRegen * 3 * deltaTime;
            
            // Если здоровье восстановлено - возвращаемся
            if (this.health > this.maxHealth * 0.7 || distance > this.visionRange) {
                this.changeAIState('chase', player);
            }
        }
    }
    
    // === МЕТОДЫ АТАКИ ===
    performAttack(target, distance, angle) {
        console.log(`[${this.name}] Атакует ${target.name || 'цель'}`);
        
        // Выбор типа атаки на основе ситуации
        let attackType;
        if (distance < 50 && Math.random() < 0.3) {
            attackType = 'heavy';
        } else if (this.health < this.maxHealth * 0.4) {
            attackType = 'desperate';
        } else {
            attackType = 'normal';
        }
        
        // Эффекты атаки
        this.effects.particles.push({
            type: 'attack',
            x: this.x + Math.cos(angle) * 30,
            y: this.y + Math.sin(angle) * 30,
            angle: angle,
            lifetime: 0.5
        });
        
        // Запоминаем результат
        this.recordAction('attack', true);
        
        // В реальной игре здесь был бы урон
        return { 
            type: attackType, 
            damage: this.damage,
            angle: angle,
            successful: true 
        };
    }
    
    // === АДАПТИВНЫЙ ИИ ===
    adaptToPlayer(player) {
        // Анализ стиля игрока
        if (this.behavior.successfulAttacks > this.behavior.failedAttacks * 2) {
            this.behavior.playerStyle = 'aggressive';
            this.behavior.counterStrategy = 'evasive';
            this.ai.dodgeChance = Math.min(0.7, this.ai.dodgeChance + 0.1);
        } else if (this.behavior.damageTaken < this.behavior.damageDealt) {
            this.behavior.playerStyle = 'defensive';
            this.behavior.counterStrategy = 'breaking';
            this.damage *= 1.1; // Пробивание защиты
        } else {
            this.behavior.playerStyle = 'balanced';
            this.behavior.counterStrategy = 'adaptive';
            this.speed = this.baseSpeed * 1.1;
        }
        
        console.log(`[${this.name}] Адаптировался к стилю: ${this.behavior.playerStyle}, стратегия: ${this.behavior.counterStrategy}`);
    }
    
    randomBehaviorChange() {
        const behaviors = ['idle', 'patrol', 'chase', 'evade'];
        const randomState = behaviors[Math.floor(Math.random() * behaviors.length)];
        this.changeAIState(randomState);
    }
    
    // === СМЕНА СОСТОЯНИЙ ИИ ===
    changeAIState(newState, target = null) {
        if (this.ai.state === newState) return;
        
        console.log(`[${this.name}] ИИ: ${this.ai.state} -> ${newState}`);
        this.ai.state = newState;
        this.ai.stateTimer = 0;
        this.ai.target = target;
        
        // Действия при смене состояния
        switch(newState) {
            case 'chase':
                this.speed = this.baseSpeed * 1.3;
                break;
            case 'evade':
                this.speed = this.baseSpeed * 2.0;
                break;
            default:
                this.speed = this.baseSpeed;
        }
    }
    
    // === СИСТЕМА АНИМАЦИЙ ===
    updateAnimation(deltaTime) {
        if (!this.currentAnimation) return;
        
        this.animationTimer += deltaTime;
        if (this.animationTimer >= this.animationSpeed) {
            this.animationTimer = 0;
            
            // Здесь будет смена кадра
            // В реальной реализации: this.currentAnimation.nextFrame()
        }
    }
    
    // === ФИЗИКА ===
    updatePhysics(deltaTime) {
        this.x += this.velocity.x * deltaTime * 60;
        this.y += this.velocity.y * deltaTime * 60;
        
        // Постепенное замедление
        this.velocity.x *= 0.9;
        this.velocity.y *= 0.9;
    }
    
    updateEffects(deltaTime) {
        if (this.effects.hitFlash > 0) {
            this.effects.hitFlash -= deltaTime;
        }
    }
    
    // === ПОЛУЧЕНИЕ УРОНА ===
    takeDamage(amount, source) {
        if (this.invulnerable || amount <= 0) return false;
        
        const originalHealth = this.health;
        this.health = Math.max(0, this.health - amount);
        this.effects.hitFlash = 0.5;
        this.invulnerabilityTime = 0.3;
        
        // Анализ урона для адаптации
        this.behavior.damageTaken += amount;
        
        console.log(`[${this.name}] Получил урон: ${amount}, HP: ${originalHealth} -> ${this.health}`);
        
        // Реакция на урон
        if (this.health <= 0) {
            this.die();
            return true;
        }
        
        // Изменение поведения при получении урона
        if (amount > this.maxHealth * 0.2) {
            // Большой урон - отступаем
            if (Math.random() < 0.7) {
                this.changeAIState('retreat', source);
            }
        } else if (this.health < this.maxHealth * 0.4) {
            // Мало здоровья - более агрессивен
            this.ai.aggressiveness = Math.min(1.0, this.ai.aggressiveness * 1.3);
        }
        
        this.recordAction('damage_taken', true);
        return true;
    }
    
    // === СМЕРТЬ ===
    die() {
        console.log(`[${this.name}] Умер`);
        this.isActive = false;
        this.changeAIState('dead');
        
        // Эффекты смерти
        for (let i = 0; i < 15; i++) {
            this.effects.particles.push({
                type: 'death',
                x: this.x + (Math.random() - 0.5) * 50,
                y: this.y + (Math.random() - 0.5) * 50,
                velocity: { x: (Math.random() - 0.5) * 10, y: (Math.random() - 0.5) * 10 },
                lifetime: 1 + Math.random() * 2
            });
        }
    }
    
    // === ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ===
    distanceTo(target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    recordAction(action, success) {
        this.ai.memory.push({
            action,
            success,
            timestamp: Date.now(),
            state: this.ai.state,
            health: this.health
        });
        
        // Ограничиваем память 50 последними действиями
        if (this.ai.memory.length > 50) {
            this.ai.memory.shift();
        }
        
        if (success) {
            this.behavior.successfulAttacks++;
        } else {
            this.behavior.failedAttacks++;
        }
    }
    
    constrainToBounds() {
        const padding = 50;
        if (this.x < padding) this.x = padding;
        if (this.x > 800 - padding) this.x = 800 - padding;
        if (this.y < padding) this.y = padding;
        if (this.y > 600 - padding) this.y = 600 - padding;
    }
    
    // === СЕТЕВЫЕ МЕТОДЫ ===
    serialize() {
        return {
            id: this.id,
            type: this.type,
            x: Math.round(this.x * 100) / 100,
            y: Math.round(this.y * 100) / 100,
            health: Math.round(this.health * 10) / 10,
            state: this.ai.state,
            animation: this.currentAnimation
        };
    }
    
    deserialize(data) {
        if (this.isRemote) {
            this.x = data.x;
            this.y = data.y;
            this.health = data.health;
            this.changeAIState(data.state);
        }
    }
}

// Экспорт для модулей
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnemyBase;
}