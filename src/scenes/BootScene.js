export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Load placeholder assets from Phaser labs
        this.load.setBaseURL('https://labs.phaser.io');
        this.load.image('sky', 'assets/skies/space3.png');
        
        // Loading indicator
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
        });
    }

    create() {
        // Generate procedural graphics as fallback/primary assets
        this.generateGraphics();
        this.scene.start('MenuScene');
    }

    generateGraphics() {
        // Tank Parts
        this.createTankSkins();

        // Projectile (Glowing energy ball)
        const projGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        projGraphics.fillStyle(0x00ffff, 0.5);
        projGraphics.fillCircle(12, 12, 12);
        projGraphics.fillStyle(0xffffff);
        projGraphics.fillCircle(12, 12, 6);
        projGraphics.generateTexture('projectile', 24, 24);

        // Platform
        const platGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        platGraphics.fillStyle(0x333333);
        platGraphics.fillRect(0, 0, 100, 20);
        platGraphics.lineStyle(2, 0x666666);
        platGraphics.strokeRect(2, 2, 96, 16);
        platGraphics.generateTexture('platform', 100, 20);

        // Crate
        const crateGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        crateGraphics.fillStyle(0x8B4513);
        crateGraphics.fillRect(0, 0, 32, 32);
        crateGraphics.lineStyle(2, 0x5D2E0C);
        crateGraphics.strokeRect(2, 2, 28, 28);
        crateGraphics.lineBetween(2, 2, 30, 30);
        crateGraphics.lineBetween(2, 30, 30, 2);
        crateGraphics.generateTexture('crate', 32, 32);

        // Target
        const targetGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        targetGraphics.lineStyle(2, 0xff0000, 0.8);
        targetGraphics.strokeCircle(16, 16, 14);
        targetGraphics.lineStyle(2, 0xff0000, 0.4);
        targetGraphics.strokeCircle(16, 16, 10);
        targetGraphics.fillStyle(0xff0000, 0.6);
        targetGraphics.fillCircle(16, 16, 4);
        targetGraphics.generateTexture('target', 32, 32);

        // Particle
        const partGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        partGraphics.fillStyle(0xffffff, 1);
        partGraphics.fillCircle(4, 4, 4);
        partGraphics.generateTexture('particle', 8, 8);

        // Cloud
        const cloudGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        cloudGraphics.fillStyle(0xffffff, 0.4);
        cloudGraphics.fillCircle(20, 30, 20);
        cloudGraphics.fillCircle(40, 25, 25);
        cloudGraphics.fillCircle(60, 30, 20);
        cloudGraphics.generateTexture('cloud', 80, 50);
    }

    createTankSkins() {
        const skins = [
            { id: 'std', color: 0x445544, highlight: 0x667766 }, // Standard
            { id: 'heavy', color: 0x443333, highlight: 0x775555 }, // Power (Heavy)
            { id: 'laser', color: 0x333344, highlight: 0x555588 }, // Speed (Laser)
            { id: 'elite', color: 0x554400, highlight: 0xaa8800 }  // Elite (Gold)
        ];

        skins.forEach(skin => {
            // 1. Tracks (Fixed)
            const tracksG = this.make.graphics({ x: 0, y: 0, add: false });
            tracksG.fillStyle(0x222222);
            tracksG.fillRect(0, 0, 40, 10);
            tracksG.fillStyle(0x111111);
            for(let i=0; i<40; i+=5) tracksG.fillRect(i, 0, 2, 10);
            
            // Elite skin special tracks
            if(skin.id === 'elite') {
                tracksG.lineStyle(1, 0xffd700, 0.5);
                tracksG.strokeRect(0, 0, 40, 10);
            }
            
            tracksG.generateTexture(`tank-tracks-${skin.id}`, 40, 10);

            // 2. Body (Fixed)
            const bodyG = this.make.graphics({ x: 0, y: 0, add: false });
            bodyG.fillStyle(skin.color);
            bodyG.fillRect(0, 0, 40, 20);
            bodyG.fillStyle(skin.highlight, 0.5);
            bodyG.fillRect(0, 0, 40, 5);
            
            // Add extra details for elite
            if(skin.id === 'elite') {
                bodyG.lineStyle(2, 0xffd700, 0.8);
                bodyG.strokeRect(2, 2, 36, 16);
            }
            
            bodyG.generateTexture(`tank-body-${skin.id}`, 40, 20);

            // 3. Barrel (Rotates)
            const barrelG = this.make.graphics({ x: 0, y: 0, add: false });
            barrelG.fillStyle(skin.color);
            barrelG.fillRect(0, 0, 45, 8);
            barrelG.fillStyle(skin.highlight, 0.5);
            barrelG.fillRect(0, 0, 45, 3);
            barrelG.fillStyle(0x222222);
            barrelG.fillRect(40, 0, 5, 8);
            
            // Elite barrel glow
            if(skin.id === 'elite') {
                barrelG.lineStyle(1, 0xffd700, 1);
                barrelG.strokeRect(0, 0, 45, 8);
            }
            
            barrelG.generateTexture(`tank-barrel-${skin.id}`, 45, 8);
        });

        // Hazard Ball (Red Death Ball)
        const hazardG = this.make.graphics({ x: 0, y: 0, add: false });
        hazardG.fillStyle(0xff0000, 0.3);
        hazardG.fillCircle(16, 16, 16);
        hazardG.fillStyle(0xff0000, 1);
        hazardG.fillCircle(16, 16, 8);
        hazardG.lineStyle(2, 0xffffff, 0.8);
        hazardG.strokeCircle(16, 16, 12);
        hazardG.generateTexture('hazard', 32, 32);
    }
}
