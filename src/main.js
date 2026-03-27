import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';

if (window.location.protocol === 'file:') {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:rgba(255,0,0,0.9); color:white; padding:20px; font-family:sans-serif; text-align:center; z-index:1000; border-radius:10px; max-width:80%; box-shadow:0 0 20px rgba(0,0,0,0.5);';
    errorDiv.innerHTML = '<h2>HATA: Local Server Gerekli!</h2>' +
        '<p>Tarayıcı güvenliği (CORS) nedeniyle, modüler JavaScript dosyaları doğrudan "file://" protokolü ile çalıştırılamaz.</p>' +
        '<p><b>Çözüm:</b> VS Code kullanıyorsanız "Live Server" eklentisini kurup "Go Live" butonuna basın veya terminalden <code>npx serve .</code> komutunu çalıştırın.</p>';
    document.body.appendChild(errorDiv);
}

if (typeof Phaser === 'undefined') {
    console.error('Phaser kütüphanesi yüklenemedi!');
}

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#000000',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 1 },
            debug: false, 
            enableSleep: true,
            positionIterations: 12,
            velocityIterations: 8,
            constraintIterations: 2
        }
    },
    scene: [BootScene, MenuScene, GameScene, UIScene]
};

const game = new Phaser.Game(config);
