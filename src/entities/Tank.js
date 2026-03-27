import { Storage } from '../utils/Storage.js';

export class Tank extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);
        this.scene = scene;

        const skinId = Storage.getSelectedSkin();
        
        // 1. Tracks (Bottom layer)
        this.tracks = scene.add.sprite(0, 10, `tank-tracks-${skinId}`);
        this.add(this.tracks);

        // 2. Body (Middle layer)
        this.bodySprite = scene.add.sprite(0, 0, `tank-body-${skinId}`);
        this.add(this.bodySprite);

        // 3. Barrel (Top layer, rotates)
        this.barrel = scene.add.sprite(0, -5, `tank-barrel-${skinId}`);
        this.barrel.setOrigin(0, 0.5); // Rotation point at the start of barrel
        this.add(this.barrel);

        // Physics body for the tank (Static)
        scene.matter.add.gameObject(this, {
            isStatic: true,
            label: 'tank'
        });

        // Add to scene
        scene.add.existing(this);
        
        // Initial state
        this.angle = -45;
        this.updateTurretRotation();
    }

    setAngle(angle) {
        // Clamp angle (usually tanks shoot upwards, from 0 to -180 degrees)
        this.angle = Phaser.Math.Clamp(angle, -180, 0);
        this.updateTurretRotation();
    }

    updateTurretRotation() {
        // Only rotate the barrel sprite, not the whole container
        this.barrel.angle = this.angle;
    }

    getTurretTip() {
        // Get the global position of the barrel tip
        const length = this.barrel.width * this.barrel.scaleX;
        const rad = Phaser.Math.DegToRad(this.angle);
        return {
            x: this.x + this.barrel.x + Math.cos(rad) * length,
            y: this.y + this.barrel.y + Math.sin(rad) * length
        };
    }
}
