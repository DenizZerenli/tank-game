import { Storage } from '../utils/Storage.js';

export class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene', active: false });
    }

    create() {
        const gameScene = this.scene.get('GameScene');

        // Main HUD Group
        this.hudGroup = this.add.container(0, 0);

        // Score Container (Center Top)
        this.scoreLabel = this.add.text(640, 40, '0', {
            fontSize: '54px',
            fontFamily: 'Impact, sans-serif',
            color: '#00ffff',
        }).setOrigin(0.5);
        
        const scoreSub = this.add.text(640, 85, 'SCORE', {
            fontSize: '12px',
            fontFamily: 'Arial Black',
            color: '#ffffff',
            letterSpacing: 6
        }).setOrigin(0.5).setAlpha(0.5);

        // Shop Points Display (Animated PTS)
        this.shopPointsLabel = this.add.text(640, 115, `PTS: ${Storage.getPoints()}`, {
            fontSize: '20px',
            fontFamily: 'Arial Black',
            color: '#00ffcc'
        }).setOrigin(0.5);

        // High Score (Left Top)
        this.highScoreLabel = this.add.text(30, 30, `BEST: ${Storage.getHighScore()}`, {
            fontSize: '16px',
            fontFamily: 'Arial Black',
            color: '#aaaaaa'
        });

        // Modern Shop Button
        this.createShopButton();

        // Shop UI Container (Improved visuals)
        this.createShopUI();

        // Ammo Display (Left Bottom - Animated)
        this.ammoLabel = this.add.text(30, 650, 'AMMO: 10', {
            fontSize: '26px',
            fontFamily: 'Arial Black',
            color: '#ffffff'
        });

        // Level Display (Right Top)
        this.levelLabel = this.add.text(1250, 30, 'LEVEL 1', {
            fontSize: '24px',
            fontFamily: 'Impact',
            color: '#ffffff',
        }).setOrigin(1, 0);

        // Power & Angle (Right Bottom)
        this.powerLabel = this.add.text(1250, 640, 'PWR: 50%', {
            fontSize: '18px',
            fontFamily: 'Arial Black',
            color: '#ffff00'
        }).setOrigin(1, 0.5);

        this.angleLabel = this.add.text(1250, 675, 'ANG: 45°', {
            fontSize: '18px',
            fontFamily: 'Arial Black',
            color: '#00ffff'
        }).setOrigin(1, 0.5);

        // Listen for events from GameScene
        gameScene.events.on('updateScore', (score) => {
            this.scoreLabel.setText(score);
            this.shopPointsLabel.setText(`PTS: ${Storage.getPoints()}`);
            this.tweens.add({
                targets: this.scoreLabel,
                scale: 1.2,
                duration: 100,
                yoyo: true,
                ease: 'Back.easeOut'
            });
            this.tweens.add({
                targets: this.shopPointsLabel,
                scale: 1.1,
                duration: 100,
                yoyo: true
            });
        });

        gameScene.events.on('updateHighScore', (score) => {
            this.highScoreLabel.setText(`BEST: ${score}`);
        });

        gameScene.events.on('updateAmmo', (ammo) => {
            this.ammoLabel.setText(`AMMO: ${ammo}`);
            this.tweens.add({
                targets: this.ammoLabel,
                scale: 1.1,
                duration: 100,
                yoyo: true
            });
            if (ammo <= 3) {
                this.ammoLabel.setColor('#ff3333');
            } else {
                this.ammoLabel.setColor('#ffffff');
            }
        });

        gameScene.events.on('updateLevel', (level) => {
            this.levelLabel.setText(`LEVEL ${level}`);
            this.cameras.main.flash(400, 0, 255, 255, true);
        });

        gameScene.events.on('updateControls', (power, angle) => {
            this.powerLabel.setText(`PWR: ${Math.round(power)}%`);
            this.angleLabel.setText(`ANG: ${Math.round(Math.abs(angle))}°`);
        });

        // Hint (Animated)
        const hint = this.add.text(640, 695, 'DRAG TO AIM • RELEASE TO FIRE • R TO RESET', {
            fontSize: '11px',
            color: '#ffffff',
            alpha: 0.2,
            letterSpacing: 2
        }).setOrigin(0.5);
        this.tweens.add({
            targets: hint,
            alpha: 0.5,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
    }

    createShopButton() {
        const shopContainer = this.add.container(80, 85);
        const shopBg = this.add.graphics();
        shopBg.fillStyle(0x00ffcc, 0.1);
        shopBg.fillRoundedRect(-50, -20, 100, 40, 10);
        shopBg.lineStyle(2, 0x00ffcc, 0.5);
        shopBg.strokeRoundedRect(-50, -20, 100, 40, 10);
        shopContainer.add(shopBg);

        const shopText = this.add.text(0, 0, '🛒 SHOP', {
            fontSize: '18px',
            fontFamily: 'Arial Black',
            color: '#00ffcc'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        shopContainer.add(shopText);

        shopText.on('pointerover', () => {
            this.tweens.add({ targets: shopContainer, scale: 1.1, duration: 200 });
            shopBg.fillStyle(0x00ffcc, 0.2);
            shopBg.strokeRoundedRect(-50, -20, 100, 40, 10);
        });

        shopText.on('pointerout', () => {
            this.tweens.add({ targets: shopContainer, scale: 1, duration: 200 });
            shopBg.clear();
            shopBg.fillStyle(0x00ffcc, 0.1);
            shopBg.fillRoundedRect(-50, -20, 100, 40, 10);
            shopBg.lineStyle(2, 0x00ffcc, 0.5);
            shopBg.strokeRoundedRect(-50, -20, 100, 40, 10);
        });

        shopText.on('pointerdown', () => this.toggleShop());
    }

    createShopUI() {
        this.shopContainer = this.add.container(640, 360).setVisible(false).setScale(0.8);
        const shopBg = this.add.graphics();
        
        // Dark blurred background overlay
        const overlay = this.add.rectangle(0, 0, 1280, 720, 0x000000, 0.7).setOrigin(0.5);
        this.shopContainer.addAt(overlay, 0);

        // Main shop window
        shopBg.fillStyle(0x050505, 0.95);
        shopBg.fillRoundedRect(-350, -220, 700, 440, 25);
        shopBg.lineStyle(3, 0x00ffcc, 1);
        shopBg.strokeRoundedRect(-350, -220, 700, 440, 25);
        
        // Inner Glow
        shopBg.lineStyle(1, 0x00ffcc, 0.3);
        shopBg.strokeRoundedRect(-340, -210, 680, 420, 20);
        
        this.shopContainer.add(shopBg);

        const shopTitle = this.add.text(0, -180, 'ELITE TANK MARKET', {
            fontSize: '36px',
            fontFamily: 'Impact',
            color: '#00ffcc',
            letterSpacing: 4
        }).setOrigin(0.5);
        this.shopContainer.add(shopTitle);

        this.createShopItems();

        const closeBtn = this.add.text(320, -190, '✕', {
            fontSize: '28px',
            fontFamily: 'Arial',
            color: '#ff3333'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        closeBtn.on('pointerover', () => closeBtn.setScale(1.2));
        closeBtn.on('pointerout', () => closeBtn.setScale(1));
        closeBtn.on('pointerdown', () => this.toggleShop());
        this.shopContainer.add(closeBtn);
    }

    toggleShop() {
        const isVisible = !this.shopContainer.visible;
        this.shopContainer.setVisible(isVisible);
        this.shopPointsLabel.setText(`PTS: ${Storage.getPoints()}`);
        if (isVisible) {
            this.updateShopItems();
        }
    }

    createShopItems() {
        this.shopItems = [];
        const skins = [
            { id: 'std', name: 'STANDARD', price: 0, desc: 'Balanced' },
            { id: 'heavy', name: 'HEAVY', price: 500, desc: 'High Velocity' },
            { id: 'laser', name: 'LASER', price: 1000, desc: 'Rapid Fire' },
            { id: 'elite', name: 'ELITE', price: 2500, desc: 'Ultimate Stats' }
        ];

        skins.forEach((skin, i) => {
            const x = -225 + (i * 150);
            const item = this.add.container(x, 0);
            
            // Preview Tank
            const tracksImg = this.add.sprite(0, -30, `tank-tracks-${skin.id}`).setScale(1.5);
            const bodyImg = this.add.sprite(0, -40, `tank-body-${skin.id}`).setScale(1.5);
            const barrelImg = this.add.sprite(0, -45, `tank-barrel-${skin.id}`).setScale(1.5);
            item.add([tracksImg, bodyImg, barrelImg]);

            const nameText = this.add.text(0, 10, skin.name, { fontSize: '14px', fontFamily: 'Arial Black' }).setOrigin(0.5);
            const descText = this.add.text(0, 30, skin.desc, { fontSize: '10px', color: '#00ffcc' }).setOrigin(0.5);
            const priceText = this.add.text(0, 50, skin.price === 0 ? 'FREE' : `${skin.price} PTS`, { fontSize: '12px', color: '#ffff00' }).setOrigin(0.5);
            item.add([nameText, descText, priceText]);

            const buyBtn = this.add.text(0, 90, 'SELECT', {
                fontSize: '12px',
                fontFamily: 'Arial Black',
                backgroundColor: '#008800',
                padding: { x: 8, y: 4 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            buyBtn.on('pointerdown', () => this.handlePurchase(skin, buyBtn));
            item.add(buyBtn);

            item.skinData = skin;
            item.buyBtn = buyBtn;
            this.shopItems.push(item);
            this.shopContainer.add(item);
        });
    }

    updateShopItems() {
        const purchased = Storage.getPurchasedSkins();
        const selected = Storage.getSelectedSkin();

        this.shopItems.forEach(item => {
            const { id, price } = item.skinData;
            if (id === selected) {
                item.buyBtn.setText('SELECTED').setBackgroundColor('#004488');
            } else if (purchased.includes(id)) {
                item.buyBtn.setText('SELECT').setBackgroundColor('#008800');
            } else {
                item.buyBtn.setText(`BUY (${price})`).setBackgroundColor('#880000');
            }
        });
    }

    handlePurchase(skin, btn) {
        const purchased = Storage.getPurchasedSkins();
        if (purchased.includes(skin.id)) {
            Storage.setSelectedSkin(skin.id);
            this.scene.get('GameScene').scene.restart();
        } else {
            if (Storage.spendPoints(skin.price)) {
                Storage.purchaseSkin(skin.id);
                Storage.setSelectedSkin(skin.id);
                this.scene.get('GameScene').scene.restart();
            } else {
                btn.setText('NO POINTS');
                this.time.delayedCall(1000, () => this.updateShopItems());
            }
        }
        this.updateShopItems();
        this.shopPointsLabel.setText(`PTS: ${Storage.getPoints()}`);
    }
}
