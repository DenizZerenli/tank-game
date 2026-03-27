export class SoundHelper {
    constructor(scene) {
        this.scene = scene;
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    playShoot() {
        this.playTone(150, 0.1, 'sawtooth');
    }

    playHit() {
        this.playTone(80, 0.2, 'square');
    }

    playScore() {
        this.playTone(440, 0.1, 'sine');
        setTimeout(() => this.playTone(880, 0.1, 'sine'), 100);
    }

    playTone(freq, duration, type = 'sine') {
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        
        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);

        gainNode.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        oscillator.start();
        oscillator.stop(this.audioCtx.currentTime + duration);
    }
}
