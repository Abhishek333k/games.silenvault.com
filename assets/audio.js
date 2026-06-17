// Universal Web Audio Synthesizer (Zero-Bandwidth)
// Generates dynamic, unique retro sound effects and background arpeggios

class SFXEngine {
    constructor() {
        this.ctx = null;
        this.masterVolume = null;
        this.bgmOsc = null;
        this.bgmInt = null;
        this.isMuted = false;
        
        // Auto-initialize on first user interaction to bypass browser autoplay policies
        const initAudio = () => {
            if (!this.ctx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.ctx = new AudioContext();
                this.masterVolume = this.ctx.createGain();
                this.masterVolume.gain.value = 0.3;
                this.masterVolume.connect(this.ctx.destination);
            }
            window.removeEventListener('click', initAudio);
            window.removeEventListener('touchstart', initAudio);
            window.removeEventListener('keydown', initAudio);
        };
        window.addEventListener('click', initAudio);
        window.addEventListener('touchstart', initAudio);
        window.addEventListener('keydown', initAudio);
    }

    _playTone(freq, type, duration, volMod = 1) {
        if(!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        gain.gain.setValueAtTime(0.5 * volMod, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.masterVolume);
        
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    // UNIQUE SOUND PROFILES

    // 1. Arcade / Action
    playLaser() {
        if(!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);
        osc.connect(gain); gain.connect(this.masterVolume);
        osc.start(); osc.stop(this.ctx.currentTime + 0.1);
    }

    playExplosion() {
        if(!this.ctx || this.isMuted) return;
        const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 seconds
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
        filter.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.5);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
        noise.connect(filter); filter.connect(gain); gain.connect(this.masterVolume);
        noise.start();
    }

    playJump() {
        if(!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);
        osc.connect(gain); gain.connect(this.masterVolume);
        osc.start(); osc.stop(this.ctx.currentTime + 0.2);
    }

    // 2. Logic / Puzzle
    playCrystalShatter() {
        this._playTone(1200, 'sine', 0.1, 0.2);
        setTimeout(() => this._playTone(1800, 'sine', 0.1, 0.1), 50);
        setTimeout(() => this._playTone(2400, 'triangle', 0.2, 0.1), 100);
    }

    playCardFlip() {
        if(!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.05);
        osc.connect(gain); gain.connect(this.masterVolume);
        osc.start(); osc.stop(this.ctx.currentTime + 0.05);
    }

    playMove() {
        this._playTone(600, 'sine', 0.05, 0.2);
    }

    playError() {
        this._playTone(150, 'square', 0.2, 0.3);
    }

    // UNIQUE BACKGROUND MUSIC (Algorithmic Arpeggiator)
    // Allows each game to pass an array of frequencies to create a unique vibe
    playBGM(notesArray, bpm = 120, waveform = 'sine') {
        if(this.bgmInt) clearInterval(this.bgmInt);
        if(!this.ctx || this.isMuted) return;
        
        let step = 0;
        const intervalMs = (60 / bpm) * 1000 / 2; // 8th notes
        
        this.bgmInt = setInterval(() => {
            if(this.isMuted) return;
            const freq = notesArray[step % notesArray.length];
            if(freq > 0) {
                this._playTone(freq, waveform, 0.2, 0.05); // low volume for BGM
            }
            step++;
        }, intervalMs);
    }

    stopBGM() {
        if(this.bgmInt) {
            clearInterval(this.bgmInt);
            this.bgmInt = null;
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if(this.isMuted) this.stopBGM();
        return this.isMuted;
    }
}

// Instantiate globally
window.AudioEngine = new SFXEngine();
