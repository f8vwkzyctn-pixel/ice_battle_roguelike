/**
 * ПОЛНЫЙ КЛАСС ТЮЛЕНЯ
 * Наследует EnemyBase, добавляет уникальные анимации и способности
 */
class Seal extends EnemyBase {
    constructor(config = {}) {
        // Конфигурация тюленя
        const sealConfig = {
            name: 'Тюлень',
            type: 'seal',
            width: 64,
            height: 64,
            speed: 2.0,
            maxHealth: 25,
            health: 25,
            damage: 8,
            attackRange: 60,
            attackCooldown: 1.2,
            visionRange: 350,
            agroRange: 250,
            
            // Параметры ИИ
            aggressiveness: 0.8,  // Очень агрессивен
            caution: 0.2,
            unpredictability: 0.4, // Непредсказуемый
            dodgeChance: 0.4,     // Часто уворачивается
            
            // Анимации
            spriteFrames: {
                width: 64,
                height: 64,
                cols: 8,
                idle: [0, 1, 2, 3],
                walk: [4, 5, 6, 7],
                attack: [8, 9, 10, 11],
                hurt: [12, 13],
                death: [14, 15, 16, 17]
            },
            animationSpeed: 0.15,
            
            ...config
        };
        
        super(sealConfig);
        
        // === УНИКАЛЬНЫЕ СВОЙСТВА ТЮЛЕНЯ ===
        this.subtype = config.subtype || 'normal'; // normal, yo-chan, pon-chan
        this.bellyFlopPower = config.bellyFlopPower || 15;
        this.screamPower = config.screamPower || 5;
        this.flopChance = 0.3; // Шанс использовать хлопок животом
        
        // Специальные способности
        this.abilities = {
            bellyFlop: {
                cooldown: 3.0,
                current: 0,
                damageMultiplier: 1.5,
                area: 100,
                stunChance: 0.3
            },
            iceScream: {
                cooldown: 4.0,
                current: 0,
                range: 200,
                slowAmount: 0.5,
                duration: 2.0
            },
            slideAttack: {
                cooldown: 2.5,
                current: 0,
                distance: 150,
                damage: 12
            }
        };
        
        // Таймеры способностей
        this.abilityTimers = {};
        for (const ability in this.abilities) {
            this.abilityTimers[ability] = 0;
        }
        
        // Анимационные состояния
        this.isFlopping = false;
        this.flopProgress = 0;
        this.flopHeight = 0;
        
        // Звуки (заглушки)
        this.sounds = {
            flop: null,
            scream: null,
            hurt: null
        };
        
        console.log(`[SEAL] Создан тюлень "${this.name}" (HP: ${this.health})`);
    }
    
    // === ПЕРЕОПРЕДЕЛЕНИЕ ОБНОВЛЕНИЯ ===
    update(deltaTime, player, obstacles) {
        // Обновляем кулдауны способностей
        for (const ability in this.abilities) {
            if (this.abilityTimers[ability] > 0) {
                this.abilityTimers[ability] -= deltaTime;
            }
        }
        
        // Специальная логика для хлопка животом
        if (this.isFlopping) {
            this.updateFlopAnimation(deltaTime);
        }
        
        // Вызов родительского update
        super.update(deltaTime, player, obstacles);
        
        // Особое поведение тюленя
        this.updateSealBehavior(deltaTime, player);
    }
    
    // === ОСОБОЕ ПОВЕДЕНИЕ ТЮЛЕНЯ ===
    updateSealBehavior(deltaTime, player) {
        const distance = this.distanceTo(player);
        
        // Автоматическое использование способностей
        if (this.ai.state === 'attack' && distance <= this.attackRange) {
            this.tryUseAbility(player, distance);
        }
        
        // Пассивная регенерация во льду
        if (this.health < this.maxHealth && Math.random() < 0.01) {
            this.health = Math.min(this.maxHealth, this.health + 1);
        }
    }
    
    // === ПЕРЕОПРЕДЕЛЕНИЕ АТАКИ ===
    performAttack(target, distance, angle) {
        // Решение: обычная атака или способность?
        let attackType = 'normal';
        
        if (distance < 40 && this.abilityTimers.bellyFlop <= 0 && Math.random() < this.flopChance) {
            // Хлопок животом!
            return this.performBellyFlop(target, angle);
        } else if (distance > 100 && this.abilityTimers.iceScream <= 0 && Math.random() < 0.2) {
            // Крик
            return this.performIceScream(target, angle);
        }
        
        // Обычная атака тюленя
        const attackResult = super.performAttack(target, distance, angle);
        
        // Добавляем эффект отталкивания
        if (attackResult.successful) {
            this.effects.particles.push({
                type: 'seal_attack',
                x: this.x + Math.cos(angle) * 40,
                y: this.y + Math.sin(angle) * 40,
                angle: angle + (Math.random() - 0.5) * 0.5,
                lifetime: 0.3,
                color: '#4fc3f7'
            });
        }
        
        return { ...attackResult, subtype: 'seal_slap' };
    }
    
    // === СПЕЦИАЛЬНЫЕ СПОСОБНОСТИ ===
    
    // Хлопок животом (сильная атака ближнего боя)
    performBellyFlop(target, angle) {
        console.log(`[${this.name}] ХЛОПОК ЖИВОТОМ!`);
        
        this.isFlopping = true;
        this.flopProgress = 0;
        this.flopHeight = 30;
        this.abilityTimers.bellyFlop = this.abilities.bellyFlop.cooldown;
        
        // Эффекты
        for (let i = 0; i < 20; i++) {
            this.effects.particles.push({
                type: 'belly_flop',
                x: this.x + (Math.random() - 0.5) * 80,
                y: this.y + 30 + Math.random() * 20,
                velocity: { 
                    x: (Math.random() - 0.5) * 10, 
                    y: -5 - Math.random() * 5 
                },
                lifetime: 1.0 + Math.random(),
                color: '#ffcc00'
            });
        }
        
        return {
            type: 'belly_flop',
            damage: this.damage * this.abilities.bellyFlop.damageMultiplier,
            angle: angle,
            area: this.abilities.bellyFlop.area,
            stunChance: this.abilities.bellyFlop.stunChance,
            successful: true
        };
    }
    
    // Анимация хлопка
    updateFlopAnimation(deltaTime) {
        this.flopProgress += deltaTime * 4; // 0-1 за 0.25 сек
        
        if (this.flopProgress < 1) {
            // Подскок
            const height = Math.sin(this.flopProgress * Math.PI) * this.flopHeight;
            this.y -= height * (1 - this.flopProgress);
        } else {
            // Завершение
            this.isFlopping = false;
            this.flopProgress = 0;
            
            // Ударная волна
            this.createShockwave();
        }
    }
    
    createShockwave() {
        for (let i = 0; i < 360; i += 15) {
            const rad = i * Math.PI / 180;
            this.effects.particles.push({
                type: 'shockwave',
                x: this.x,
                y: this.y,
                angle: rad,
                speed: 5 + Math.random() * 3,
                lifetime: 0.8,
                color: '#00e5ff'
            });
        }
    }
    
    // Ледяной крик (дальняя атака)
    performIceScream(target, angle) {
        console.log(`[${this.name}] ЛЕДЯНОЙ КРИК!`);
        
        this.abilityTimers.iceScream = this.abilities.iceScream.cooldown;
        
        // Визуальный эффект крика
        for (let i = 0; i < 30; i++) {
            const spread = (Math.random() - 0.5) * 0.8;
            this.effects.particles.push({
                type: 'ice_scream',
                x: this.x + Math.cos(angle) * 20,
                y: this.y + Math.sin(angle) * 20,
                angle: angle + spread,
                speed: 8 + Math.random() * 4,
                lifetime: 1.0 + Math.random() * 0.5,
                color: '#00ffff'
            });
        }
        
        return {
            type: 'ice_scream',
            damage: this.screamPower,
            angle: angle,
            range: this.abilities.iceScream.range,
            slowAmount: this.abilities.iceScream.slowAmount,
            duration: this.abilities.iceScream.duration,
            successful: true
        };
    }
    
    // Попытка использовать способность
    tryUseAbility(player, distance) {
        // Логика выбора способности на основе ситуации
        if (distance < 50 && this.abilityTimers.bellyFlop <= 0) {
            // Близко - хлопок
            if (Math.random() < 0.3) {
                const angle = Math.atan2(player.y - this.y, player.x - this.x);
                this.performBellyFlop(player, angle);
            }
        } else if (distance > 120 && this.abilityTimers.slideAttack <= 0) {
            // Далеко - скользящая атака
            if (Math.random() < 0.4) {
                this.performSlideAttack(player);
            }
        }
    }
    
    // Скользящая атака
    performSlideAttack(target) {
        console.log(`[${this.name}] СКОЛЬЗЯЩАЯ АТАКА!`);
        
        this.abilityTimers.slideAttack = this.abilities.slideAttack.cooldown;
        
        // Резкое ускорение к цели
        const angle = Math.atan2(target.y - this.y, target.x - this.x);
        this.velocity.x = Math.cos(angle) * 15;
        this.velocity.y = Math.sin(angle) * 15;
        
        // Эффект скольжения
        for (let i = 0; i < 10; i++) {
            this.effects.particles.push({
                type: 'slide',
                x: this.x - Math.cos(angle) * 30,
                y: this.y - Math.sin(angle) * 30,
                velocity: { 
                    x: -Math.cos(angle) * 5 + (Math.random() - 0.5) * 2,
                    y: -Math.sin(angle) * 5 + (Math.random() - 0.5) * 2
                },
                lifetime: 0.5 + Math.random() * 0.3,
                color: '#4fc3f7'
            });
        }
        
        return {
            type: 'slide_attack',
            damage: this.abilities.slideAttack.damage,
            successful: true
        };
    }
    
    // === ПЕРЕОПРЕДЕЛЕНИЕ ПОЛУЧЕНИЯ УРОНА ===
    takeDamage(amount, source) {
        const taken = super.takeDamage(amount, source);
        
        if (taken && this.health > 0) {
            // Реакция тюленя на урон
            if (amount > 5) {
                // Сильный удар - ответная реакция
                this.flopChance = Math.min(0.8, this.flopChance + 0.2);
                this.ai.aggressiveness = Math.min(1.0, this.ai.aggressiveness + 0.1);
            }
            
            // Звук получения урона
            // if (this.sounds.hurt) this.sounds.hurt.play();
        }
        
        return taken;
    }
    
    // === ПЕРЕОПРЕДЕЛЕНИЕ СМЕРТИ ===
    die() {
        console.log(`[${this.name}] Тюлень повержен!`);
        
        // Особые эффекты смерти тюленя
        for (let i = 0; i < 25; i++) {
            this.effects.particles.push({
                type: 'seal_death',
                x: this.x + (Math.random() - 0.5) * 60,
                y: this.y + (Math.random() - 0.5) * 40,
                velocity: { 
                    x: (Math.random() - 0.5) * 8, 
                    y: -3 - Math.random() * 4 
                },
                lifetime: 1.5 + Math.random(),
                color: ['#4fc3f7', '#00e5ff', '#ffffff'][Math.floor(Math.random() * 3)]
            });
        }
        
        super.die();
    }
    
    // === РИСОВАНИЕ ТЮЛЕНЯ ===
    draw(ctx) {
        if (!this.isActive) return;
        
        ctx.save();
        
        // Эффект получения урона (мигание)
        if (this.effects.hitFlash > 0) {
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
        }
        
        // Позиция для анимации хлопка
        let drawY = this.y;
        if (this.isFlopping) {
            const bounce = Math.sin(this.flopProgress * Math.PI) * this.flopHeight;
            drawY = this.y - bounce;
        }
        
        // === ЗАГЛУШКА: рисуем тюленя как круг ===
        // В реальной игре здесь была бы отрисовка спрайта
        
        // Тело тюленя
        ctx.fillStyle = this.effects.hitFlash > 0 ? '#ff6666' : '#8bd3f0';
        ctx.beginPath();
        ctx.ellipse(this.x, drawY, this.width/2, this.height/2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Голова
        ctx.fillStyle = '#6ac3e0';
        ctx.beginPath();
        ctx.arc(this.x, drawY - this.height/4, this.width/3, 0, Math.PI * 2);
        ctx.fill();
        
        // Глаза
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x - 10, drawY - this.height/4 - 5, 3, 0, Math.PI * 2);
        ctx.arc(this.x + 10, drawY - this.height/4 - 5, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Усы
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        for (let i = -1; i <= 1; i += 0.5) {
            ctx.beginPath();
            ctx.moveTo(this.x + i * 5, drawY - this.height/4);
            ctx.lineTo(this.x + i * 15, drawY - this.height/4 + i * 3);
            ctx.stroke();
        }
        
        // Хлопок животом (анимация)
        if (this.isFlopping && this.flopProgress > 0.3) {
            ctx.fillStyle = '#ffcc00';
            ctx.beginPath();
            ctx.ellipse(this.x, drawY + this.height/3, 
                       this.width/2 * (1 + this.flopProgress * 0.5), 
                       this.height/4 * this.flopProgress, 
                       0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Полоска здоровья над головой
        const healthWidth = 60;
        const healthHeight = 6;
        const healthX = this.x - healthWidth/2;
        const healthY = drawY - this.height/2 - 15;
        const healthPercent = this.health / this.maxHealth;
        
        // Фон полоски
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(healthX - 1, healthY - 1, healthWidth + 2, healthHeight + 2);
        
        // Здоровье
        const gradient = ctx.createLinearGradient(healthX, 0, healthX + healthWidth, 0);
        if (healthPercent > 0.6) {
            gradient.addColorStop(0, '#00ff00');
            gradient.addColorStop(1, '#00cc00');
        } else if (healthPercent > 0.3) {
            gradient.addColorStop(0, '#ffff00');
            gradient.addColorStop(1, '#ffcc00');
        } else {
            gradient.addColorStop(0, '#ff0000');
            gradient.addColorStop(1, '#cc0000');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(healthX, healthY, healthWidth * healthPercent, healthHeight);
        
        // Рамка
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(healthX, healthY, healthWidth, healthHeight);
        
        // Имя
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, this.x, healthY - 5);
        
        // Состояние ИИ (для дебага)
        if (window.DEBUG_MODE) {
            ctx.fillStyle = '#ff0';
            ctx.font = '10px Arial';
            ctx.fillText(this.ai.state, this.x, drawY + this.height/2 + 20);
        }
        
        // Эффекты частиц
        this.drawEffects(ctx);
        
        ctx.restore();
    }
    
    drawEffects(ctx) {
        // Рисуем частицы
        for (let i = this.effects.particles.length - 1; i >= 0; i--) {
            const p = this.effects.particles[i];
            p.lifetime -= 0.016;
            
            if (p.lifetime <= 0) {
                this.effects.particles.splice(i, 1);
                continue;
            }
            
            ctx.save();
            ctx.globalAlpha = p.lifetime;
            
            switch(p.type) {
                case 'seal_attack':
                    ctx.fillStyle = p.color || '#4fc3f7';
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 5 * (1 - p.lifetime), 0, Math.PI * 2);
                    ctx.fill();
                    break;
                    
                case 'belly_flop':
                    ctx.fillStyle = p.color || '#ffcc00';
                    ctx.beginPath();
                    ctx.arc(p.x + p.velocity.x * (1 - p.lifetime) * 10, 
                           p.y + p.velocity.y * (1 - p.lifetime) * 10, 
                           3 + p.lifetime * 5, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                    
                case 'shockwave':
                    p.x += Math.cos(p.angle) * p.speed;
                    p.y += Math.sin(p.angle) * p.speed;
                    ctx.strokeStyle = p.color || '#00e5ff';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 20 * (1 - p.lifetime), 0, Math.PI * 2);
                    ctx.stroke();
                    break;
            }
            
            ctx.restore();
        }
    }
    
    // === СЕРИАЛИЗАЦИЯ ДЛЯ МУЛЬТИПЛЕЕРА ===
    serialize() {
        const baseData = super.serialize();
        return {
            ...baseData,
            subtype: this.subtype,
            isFlopping: this.isFlopping,
            flopProgress: this.flopProgress
        };
    }
}

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Seal;
}