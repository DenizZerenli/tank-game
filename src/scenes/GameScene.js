import { Tank } from '../entities/Tank.js';
import { Trajectory } from '../utils/Trajectory.js';
import { Storage } from '../utils/Storage.js';
import { SoundHelper } from '../utils/SoundHelper.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init() {
        this.score = 0;
        this.highScore = Storage.getHighScore();
        this.currentLevel = 1;
        this.isAiming = false;
        this.canFire = true;
        this.isGameOver = false; // Game over state
        this.isRegenerating = false;
        this.power = 50;
        this.angle = -45;
        this.ammo = 10;
        this.multiplier = 1;
        this.projectiles = [];
        this.sounds = new SoundHelper(this);
        
        // Tank Stats based on skin
        const skin = Storage.getSelectedSkin();
        this.stats = {
            fireRate: skin === 'laser' ? 400 : (skin === 'elite' ? 300 : 800),
            bulletSpeed: skin === 'heavy' ? 0.45 : (skin === 'elite' ? 0.5 : 0.35),
            ammoBonus: skin === 'elite' ? 5 : 0
        };
        this.ammo += this.stats.ammoBonus;

        // Safety Queues
        this.destroyQueue = new Set();
        this.levelResetPending = false;
    }

    create() {
        // Set world bounds
        this.matter.world.setBounds(0, 0, 1280, 720);
        
        // Define Collision Categories
        this.catProjectile = this.matter.world.nextCategory();
        this.catObject = this.matter.world.nextCategory();
        this.catTarget = this.matter.world.nextCategory();

        // Modern Gradient Sky
        const sky = this.add.graphics();
        sky.fillGradientStyle(0x000033, 0x000033, 0x000066, 0x000066, 1);
        sky.fillRect(0, 0, 1280, 720);
        sky.setScrollFactor(0);

        // Distant Stars/Glow
        this.add.particles(0, 0, 'particle', {
            x: { min: 0, max: 1280 },
            y: { min: 0, max: 400 },
            scale: { start: 0.1, end: 0 },
            alpha: { start: 0.1, end: 0.5 },
            lifespan: 10000,
            frequency: 500,
            blendMode: 'ADD',
            scrollFactor: 0.05
        });

        // Parallax Clouds
        this.clouds = [];
        for (let i = 0; i < 6; i++) {
            const cloud = this.add.image(
                Phaser.Math.Between(0, 1280),
                Phaser.Math.Between(50, 300),
                'cloud'
            ).setAlpha(0.15).setScale(Phaser.Math.FloatBetween(0.8, 2.0)).setScrollFactor(0.1);
            this.clouds.push(cloud);
        }

        // Ground with texture
        this.ground = this.matter.add.rectangle(640, 700, 1280, 40, { isStatic: true, label: 'ground' });
        const groundVisual = this.add.graphics();
        groundVisual.fillStyle(0x1a1a1a); // Dark soil/metal
        groundVisual.fillRect(0, 680, 1280, 40);
        groundVisual.lineStyle(2, 0x333333);
        groundVisual.strokeRect(0, 680, 1280, 40);
        
        // Add grass/detail layer
        const groundTop = this.add.graphics();
        groundTop.fillStyle(0x00aa00, 0.3);
        groundTop.fillRect(0, 680, 1280, 5);

        // Tank
        this.tank = new Tank(this, 100, 670);

        // Trajectory Preview
        this.trajectoryLine = this.add.graphics();

        // Level setup
        this.setupLevel(this.currentLevel);

        // Input Handling
        this.input.on('pointerdown', (pointer) => {
            if (this.ammo > 0) {
                this.isAiming = true;
                this.updateAiming(pointer);
            }
        });

        this.input.on('pointermove', (pointer) => {
            if (this.isAiming) {
                this.updateAiming(pointer);
            }
        });

        this.input.on('pointerup', () => {
            if (this.isAiming) {
                this.fireProjectile();
                this.isAiming = false;
                this.trajectoryLine.clear();
            }
        });

        // Key listeners
        this.input.keyboard.on('keydown-R', () => this.restartLevel());
        this.input.keyboard.on('keydown-U', () => this.undoLastShot());

        // Collision events
        this.matter.world.on('collisionstart', (event) => {
            event.pairs.forEach((pair) => {
                const { bodyA, bodyB } = pair;
                this.handleCollision(bodyA, bodyB);
            });
        });

        // Particle Systems
        this.explosionEmitter = this.add.particles(0, 0, 'particle', {
            speed: { min: 50, max: 200 },
            scale: { start: 1, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 1000,
            blendMode: 'ADD',
            emitting: false
        });

        this.powerUpEmitter = this.add.particles(0, 0, 'particle', {
            speed: 100,
            scale: { start: 0.5, end: 0 },
            tint: 0xffff00,
            lifespan: 500,
            emitting: false
        });

        // Initial UI Update
        this.time.delayedCall(100, () => {
            this.events.emit('updateControls', this.power, this.angle);
            this.events.emit('updateAmmo', this.ammo);
            this.events.emit('updateScore', this.score);
            this.events.emit('updateHighScore', this.highScore);
            this.events.emit('updateLevel', this.currentLevel);
        });
        
        this.cameras.main.fadeIn(500, 0, 0, 0);

        // Process Queues in Update
        this.events.on('update', this.processQueues, this);
    }

    update() {
        // Parallax clouds
        this.clouds.forEach(cloud => {
            cloud.x += 0.2;
            if (cloud.x > 1400) cloud.x = -100;
        });

        // Apply wind or other environmental factors if needed
    }

    processQueues() {
        // 1. Process Destructions
        if (this.destroyQueue.size > 0) {
            this.destroyQueue.forEach(obj => {
                if (obj && obj.active) {
                    if (obj.body) {
                        this.matter.world.remove(obj.body);
                    }
                    obj.destroy();
                }
            });
            this.destroyQueue.clear();
        }

        // 2. Process Level Reset
        if (this.levelResetPending && !this.isRegenerating) {
            this.isRegenerating = true;
            this.levelResetPending = false;
            
            // Perform heavy operation safely outside physics step
            this.setupLevel(this.currentLevel);
            
            this.time.delayedCall(100, () => {
                this.isRegenerating = false;
            });
        }
    }

    updateAiming(pointer) {
        if (this.isGameOver) return;
        
        // Calculate angle and power based on drag from tank
        const dx = pointer.x - this.tank.x;
        const dy = pointer.y - this.tank.y;
        
        // Angle in degrees
        const angleRad = Math.atan2(dy, dx);
        this.angle = Phaser.Math.RadToDeg(angleRad);
        
        // Power based on distance (capped)
        const distance = Phaser.Math.Distance.Between(this.tank.x, this.tank.y, pointer.x, pointer.y);
        this.power = Phaser.Math.Clamp(distance / 3, 10, 100);

        this.tank.setAngle(this.angle);
        this.events.emit('updateControls', this.power, this.angle);

        this.drawTrajectory();
    }

    drawTrajectory() {
        this.trajectoryLine.clear();
        this.trajectoryLine.lineStyle(2, 0xffffff, 0.5);

        const tip = this.tank.getTurretTip();
        const rad = Phaser.Math.DegToRad(this.angle);
        const velocityScale = 0.3; // Scale factor for power to velocity
        const vx = Math.cos(rad) * this.power * velocityScale;
        const vy = Math.sin(rad) * this.power * velocityScale;
        
        // Note: Gravity in Matter.js depends on the engine settings, usually y=1.
        const points = Trajectory.calculate(tip.x, tip.y, vx, vy, 1, 40);

        this.trajectoryLine.beginPath();
        this.trajectoryLine.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            this.trajectoryLine.lineTo(points[i].x, points[i].y);
        }
        this.trajectoryLine.strokePath();

        // Draw circles for dots
        points.forEach((p, idx) => {
            if (idx % 2 === 0) {
                this.trajectoryLine.fillCircle(p.x, p.y, 2);
            }
        });
    }

    fireProjectile() {
        if (!this.canFire || this.ammo <= 0) return;

        const tip = this.tank.getTurretTip();
        const rad = Phaser.Math.DegToRad(this.angle);
        const velocityScale = this.stats.bulletSpeed; 
        const vx = Math.cos(rad) * this.power * velocityScale;
        const vy = Math.sin(rad) * this.power * velocityScale;

        const projectile = this.matter.add.image(tip.x, tip.y, 'projectile', null, {
            shape: 'circle',
            friction: 0.05,
            restitution: 0.5,
            label: 'projectile',
            frictionAir: 0.01,
            collisionFilter: {
                category: this.catProjectile,
                mask: 0xffffffff // Collide with everything
            }
        });
        
        // Scale increases with level: base 0.5, +0.1 per level
        const currentScale = 0.5 + (this.currentLevel - 1) * 0.1;
        projectile.setScale(currentScale);
        projectile.setVelocity(vx, vy);
        projectile.setAngularVelocity(0.1);
        projectile.collisionCount = 0; 

        this.projectiles.push(projectile);
        this.ammo--;
        this.events.emit('updateAmmo', this.ammo);
        this.sounds.playShoot();

        this.canFire = false;
        this.time.delayedCall(this.stats.fireRate, () => { 
            this.canFire = true;
        });

        this.time.delayedCall(4000, () => {
            if (projectile.active) {
                this.showExplosion(projectile.x, projectile.y);
                this.queueForDestruction(projectile);
            }
        });

        if (this.ammo === 0) {
            this.time.delayedCall(3000, () => {
                if (this.ammo === 0) this.gameOver();
            });
        }
    }

    setupLevel(level) {
        // Clear old obstacles
        if (this.obstacles) {
            this.obstacles.forEach(o => {
                if (o.gameObject) o.gameObject.destroy();
                this.matter.world.remove(o);
            });
        }
        this.obstacles = [];

        // Ground
        if (!this.ground) {
            this.ground = this.matter.add.rectangle(640, 700, 1280, 40, { 
                isStatic: true, 
                label: 'ground',
                collisionFilter: {
                    category: this.catObject,
                    mask: 0xffffffff
                }
            });
            this.add.rectangle(640, 700, 1280, 40, 0x1a1a1a);
        }

        // 1. Position Target Strategically
        const targetX = Phaser.Math.Between(850, 1150);
        const onGround = Math.random() > 0.4;
        const targetY = onGround ? 660 : Phaser.Math.Between(200, 450);

        if (this.target) this.target.destroy();
        this.target = this.matter.add.image(targetX, targetY, 'target', null, { 
            isStatic: true, 
            label: 'target',
            isSensor: true,
            collisionFilter: {
                category: this.catTarget,
                mask: this.catProjectile
            }
        });
        this.target.setScale(1.5);

        // 2. Select a Formation Type
        const formations = ['WALL', 'GRID', 'STAIRS', 'DEFENSE'];
        const type = formations[Phaser.Math.Between(0, formations.length - 1)];
        
        this.createFormation(type, targetX, targetY);

        // 3. Strategic Hazards (Kırmızı Toplar)
        const hazardCount = Math.min(Math.floor(level/2) + 1, 3);
        for (let i = 0; i < hazardCount; i++) {
            // Place hazards at mid-points between tank and target
            let hx = 400 + (i * 200) + Phaser.Math.Between(-50, 50);
            let hy = Phaser.Math.Between(200, 500);
            
            const hazard = this.matter.add.image(hx, hy, 'hazard', null, {
                isStatic: true,
                isSensor: true,
                label: 'hazard'
            });
            this.obstacles.push(hazard);
            
            this.tweens.add({
                targets: hazard,
                scale: 1.2,
                alpha: 0.7,
                duration: 800 + (i * 100),
                yoyo: true,
                repeat: -1
            });
        }

        this.events.emit('updateLevel', this.currentLevel);
    }

    createFormation(type, targetX, targetY) {
        const midX = (this.tank.x + targetX) / 2;
        
        switch(type) {
            case 'WALL':
                // Vertical wall in the middle
                for(let i=0; i<4; i++) {
                    this.spawnObstacle(midX, 650 - (i * 60), 'crate');
                }
                break;
            
            case 'GRID':
                // 2x2 grid of platforms and crates
                this.spawnObstacle(midX - 100, 400, 'platform');
                this.spawnObstacle(midX + 100, 400, 'platform');
                this.spawnObstacle(midX, 550, 'crate');
                break;

            case 'STAIRS':
                // Stepped platforms
                this.spawnObstacle(400, 550, 'platform');
                this.spawnObstacle(650, 400, 'platform');
                this.spawnObstacle(900, 250, 'platform');
                break;

            case 'DEFENSE':
                // Protecting the target directly
                this.spawnObstacle(targetX - 100, targetY, 'crate');
                this.spawnObstacle(targetX, targetY - 100, 'platform');
                break;
        }
    }

    spawnObstacle(x, y, asset) {
        let obj;
        if (asset === 'crate') {
            obj = this.matter.add.image(x, y, 'crate', null, { 
                label: 'destructible', 
                friction: 0.8,
                restitution: 0.1,
                density: 0.1, // Increased density
                isSensor: false,
                collisionFilter: {
                    category: this.catObject,
                    mask: 0xffffffff
                }
            });
            obj.setScale(0.9);
        } else {
            obj = this.matter.add.image(x, y, 'platform', null, { 
                isStatic: true, 
                label: 'obstacle',
                restitution: 0.5,
                isSensor: false,
                collisionFilter: {
                    category: this.catObject,
                    mask: 0xffffffff
                }
            });
            obj.setScale(0.6, 1.5).setTint(0x555555);
        }
        this.obstacles.push(obj);
        return obj;
    }

    spawnPowerUp() {
        const x = Phaser.Math.Between(400, 1100);
        const y = Phaser.Math.Between(200, 500);
        const powerUp = this.matter.add.image(x, y, 'particle', null, { 
            isStatic: true, 
            isSensor: true,
            label: 'powerup' 
        });
        powerUp.setTint(0xffff00).setScale(2);
        
        this.tweens.add({
            targets: powerUp,
            y: y - 20,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
    }

    handleCollision(bodyA, bodyB) {
        const labels = [bodyA.label, bodyB.label];

        if (labels.includes('projectile')) {
            const projBody = bodyA.label === 'projectile' ? bodyA : bodyB;
            const otherBody = bodyA.label === 'projectile' ? bodyB : bodyA;
            const projectileObj = projBody.gameObject;

            if (!projectileObj || projectileObj.isBeingDestroyed) return;

            projectileObj.collisionCount = (projectileObj.collisionCount || 0) + 1;
            
            if (projectileObj.collisionCount > 10) {
                this.queueForDestruction(projectileObj);
                return;
            }

            if (otherBody.label === 'target') {
                const targetObj = otherBody.gameObject;
                if (!targetObj || targetObj.isBeingProcessed) return;
                
                targetObj.isBeingProcessed = true;
                
                const points = 100 * this.multiplier;
                this.score += points;
                Storage.addPoints(points);
                this.ammo += 2;
                this.events.emit('updateScore', this.score);
                this.events.emit('updateAmmo', this.ammo);
                this.showExplosion(projBody.position.x, projBody.position.y);
                this.showScorePopup(projBody.position.x, projBody.position.y, points);
                this.sounds.playScore();
                
                this.levelResetPending = true;
                this.queueForDestruction(projectileObj);
                this.checkLevelComplete();

            } else if (otherBody.label === 'hazard') {
                // RED BALL HIT -> GAME OVER
                this.showExplosion(projBody.position.x, projBody.position.y);
                this.sounds.playHit();
                this.queueForDestruction(projectileObj);
                this.gameOver("HAZARD HIT!");
                
            } else if (otherBody.label === 'destructible') {
                const destructibleObj = otherBody.gameObject;
                if (!destructibleObj || destructibleObj.isBeingDestroyed) return;

                this.score += 10;
                this.events.emit('updateScore', this.score);
                this.showExplosion(projBody.position.x, projBody.position.y);
                this.sounds.playHit();
                
                if (projectileObj.collisionCount > 1) {
                    this.queueForDestruction(projectileObj);
                }
                this.queueForDestruction(destructibleObj);

            } else {
                this.showExplosion(projBody.position.x, projBody.position.y);
                this.sounds.playHit();
                
                if (projectileObj.collisionCount > 5) {
                    this.queueForDestruction(projectileObj);
                }
            }
        }
    }

    queueForDestruction(gameObject) {
        if (!gameObject || gameObject.isBeingDestroyed) return;
        gameObject.isBeingDestroyed = true;
        gameObject.setVisible(false);
        this.destroyQueue.add(gameObject);
    }

    safeDestroy(gameObject) {
        // Redundant now but keeping for compatibility if needed elsewhere
        this.queueForDestruction(gameObject);
    }

    checkLevelComplete() {
        if (this.score >= this.currentLevel * 500) {
            this.currentLevel++;
            this.setupLevel(this.currentLevel);
            this.cameras.main.flash(500, 255, 255, 255);
        }
    }

    restartLevel() {
        this.scene.restart();
    }

    undoLastShot() {
        if (this.projectiles.length > 0) {
            const last = this.projectiles.pop();
            if (last.active) last.destroy();
            this.ammo++;
            this.events.emit('updateAmmo', this.ammo);
        }
    }

    gameOver(reason = "GAME OVER") {
        this.isGameOver = true;
        this.canFire = false;
        
        Storage.saveHighScore(this.score);
        
        // Stop physics engine
        this.matter.world.pause();
        
        // Stop all tweens (moving platforms, hazard pulses)
        this.tweens.killAll();

        // Show Game Over Text
        const gameOverText = this.add.text(640, 360, `${reason}\nPress R to Restart`, {
            fontSize: '64px',
            fontFamily: 'Impact',
            color: '#ff0000',
            align: 'center',
            stroke: '#000',
            strokeThickness: 8
        }).setOrigin(0.5).setAlpha(0);
        
        this.tweens.add({
            targets: gameOverText,
            alpha: 1,
            scale: { start: 0.5, end: 1 },
            duration: 500,
            ease: 'Back.easeOut'
        });
    }

    restartLevel() {
        if(this.matter.world) this.matter.world.resume();
        this.scene.restart();
    }

    showExplosion(x, y) {
        this.explosionEmitter.emitParticleAt(x, y, 20);
        this.cameras.main.shake(100, 0.005);
    }

    showScorePopup(x, y, points) {
        const text = this.add.text(x, y - 20, `+${points}`, {
            fontSize: '24px',
            color: '#ffff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: text,
            y: y - 80,
            alpha: 0,
            duration: 1000,
            onComplete: () => text.destroy()
        });
    }
}
