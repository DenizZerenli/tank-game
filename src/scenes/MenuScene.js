export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // Dynamic Gradient Background
        this.createGradientBackground();

        // Animated Background Elements (Particles)
        this.createParticles();

        // Animated Clouds
        this.createClouds();

        // Modern Glassmorphism Container for Title
        const titleContainer = this.add.container(640, 200);
        const titleBg = this.add.graphics();
        titleBg.fillStyle(0xffffff, 0.05);
        titleBg.fillRoundedRect(-350, -80, 700, 160, 30);
        titleBg.lineStyle(2, 0xffffff, 0.1);
        titleBg.strokeRoundedRect(-350, -80, 700, 160, 30);
        titleContainer.add(titleBg);

        const title = this.add.text(0, 0, 'TANK PHYSICS', {
            fontSize: '90px',
            fontFamily: 'Impact, sans-serif',
            color: '#ffffff',
            letterSpacing: 12
        }).setOrigin(0.5);
        title.setShadow(0, 0, '#00ffff', 30, true, true);
        titleContainer.add(title);

        // Animate title entry
        titleContainer.setAlpha(0).setY(100);
        this.tweens.add({
            targets: titleContainer,
            alpha: 1,
            y: 200,
            duration: 1000,
            ease: 'Back.easeOut'
        });

        // Modern Interactive Buttons
        this.createMenuButton(640, 480, 'LAUNCH GAME', () => {
            this.cameras.main.fadeOut(800, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('GameScene');
                this.scene.start('UIScene');
            });
        });

        // Subtitle/Tagline
        const tagline = this.add.text(640, 300, 'ELITE ARMORED COMBAT SIMULATOR', {
            fontSize: '16px',
            fontFamily: 'Arial Black',
            color: '#00ffcc',
            letterSpacing: 4
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: tagline,
            alpha: 0.8,
            duration: 1000,
            delay: 500
        });

        // Footer info
        this.add.text(1260, 700, 'v3.0 - ELITE EDITION', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#444444'
        }).setOrigin(1, 1);
    }

    createParticles() {
        this.add.particles(0, 0, 'particle', {
            x: { min: 0, max: 1280 },
            y: { min: 0, max: 720 },
            scale: { start: 0.2, end: 0 },
            alpha: { start: 0.1, end: 0 },
            speed: { min: 10, max: 30 },
            lifespan: 10000,
            frequency: 50,
            blendMode: 'ADD'
        });
    }

    createMenuButton(x, y, text, callback) {
        const btnW = 320;
        const btnH = 70;
        
        const container = this.add.container(x, y);
        
        const glow = this.add.graphics();
        glow.fillStyle(0x00ffcc, 0.1);
        glow.fillRoundedRect(-btnW/2 - 10, -btnH/2 - 10, btnW + 20, btnH + 20, 15);
        glow.setAlpha(0);
        container.add(glow);

        const bg = this.add.graphics();
        this.drawButton(bg, 0, 0, btnW, btnH, 0xffffff, 0.1);
        container.add(bg);

        const btnText = this.add.text(0, 0, text, {
            fontSize: '28px',
            fontFamily: 'Arial Black',
            color: '#ffffff'
        }).setOrigin(0.5);
        container.add(btnText);

        const zone = this.add.zone(0, 0, btnW, btnH).setInteractive({ useHandCursor: true });
        container.add(zone);

        zone.on('pointerover', () => {
            this.tweens.add({ targets: container, scale: 1.05, duration: 200 });
            this.tweens.add({ targets: glow, alpha: 1, duration: 200 });
            btnText.setColor('#00ffcc');
            this.drawButton(bg, 0, 0, btnW, btnH, 0x00ffcc, 0.2);
        });

        zone.on('pointerout', () => {
            this.tweens.add({ targets: container, scale: 1, duration: 200 });
            this.tweens.add({ targets: glow, alpha: 0, duration: 200 });
            btnText.setColor('#ffffff');
            this.drawButton(bg, 0, 0, btnW, btnH, 0xffffff, 0.1);
        });

        zone.on('pointerdown', () => {
            this.tweens.add({ targets: container, scale: 0.95, duration: 100, yoyo: true });
            callback();
        });
    }

    drawButton(graphics, x, y, w, h, color, alpha) {
        graphics.clear();
        graphics.fillStyle(color, alpha);
        graphics.fillRoundedRect(x - w/2, y - h/2, w, h, 12);
        graphics.lineStyle(2, color, 0.5);
        graphics.strokeRoundedRect(x - w/2, y - h/2, w, h, 12);
    }

    createGradientBackground() {
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0a0a2a, 0x0a0a2a, 0x1a1a4a, 0x1a1a4a, 1);
        bg.fillRect(0, 0, 1280, 720);
        
        // Add some "digital rain" or particles for depth
        const particles = this.add.particles(0, 0, 'particle', {
            x: { min: 0, max: 1280 },
            y: { min: 0, max: 720 },
            scale: { start: 0.1, end: 0 },
            alpha: { start: 0.2, end: 0 },
            lifespan: 5000,
            frequency: 100,
            blendMode: 'ADD'
        });
    }

    createClouds() {
        for (let i = 0; i < 8; i++) {
            const cloud = this.add.image(
                Phaser.Math.Between(0, 1280),
                Phaser.Math.Between(0, 400),
                'cloud'
            ).setAlpha(0.2).setScale(Phaser.Math.FloatBetween(0.5, 1.5));
            
            this.tweens.add({
                targets: cloud,
                x: '+=200',
                duration: Phaser.Math.Between(10000, 20000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    drawButton(graphics, x, y, w, h, color, alpha) {
        graphics.clear();
        graphics.fillStyle(color, alpha);
        graphics.fillRoundedRect(x - w/2, y - h/2, w, h, 10);
        graphics.lineStyle(2, color, 0.8);
        graphics.strokeRoundedRect(x - w/2, y - h/2, w, h, 10);
    }
}
