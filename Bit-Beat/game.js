// Bit-Beat | Synthwave Rhythm Runner
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Game States
const STATES = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAMEOVER: 'gameover'
};

let currentState = STATES.MENU;
let score = 0;
let multiplier = 1;
let highScore = 0;
let width, height;

// Audio Sequencer Variables
let audioCtx = null;
const BPM = 125;
const stepTime = 60 / BPM / 4; // 16th note duration in seconds
let nextStepTime = 0;
let currentStep = 0;
let lastStepPlayed = -1;

// Grid parameters
const GROUND_Y_RATIO = 0.72;
let groundY = 0;

// Player states
const player = {
    x: 150,
    y: 0,
    w: 24,
    h: 40,
    vy: 0,
    gravity: 0.85,
    jumpForce: -16,
    isJumping: false,
    isSliding: false,
    slideTime: 0,
    slideDuration: 25 // frames
};

// Lists of active elements
const obstacles = [];
const particles = [];
let beatVisualPulse = 0;

// UI Cache
const UI = {
    hud: document.getElementById('hud'),
    score: document.getElementById('score'),
    bestScore: document.getElementById('best-score'),
    multiplier: document.getElementById('multiplier'),
    mainMenu: document.getElementById('main-menu'),
    pauseScreen: document.getElementById('pause-screen'),
    gameoverScreen: document.getElementById('gameover-screen'),
    finalStats: document.getElementById('final-stats')
};

// Web Audio API Synth Sequencer
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playKick(time) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.15);
    
    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(time);
    osc.stop(time + 0.16);
}

function playHihat(time) {
    if (!audioCtx) return;
    // Synthesize hihat using highpassed noise
    const bufferSize = audioCtx.sampleRate * 0.04;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6000, time);
    
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start(time);
    noise.stop(time + 0.05);
}

function playSnare(time) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const noiseGain = audioCtx.createGain();
    
    // Snare body tone
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, time);
    const oscGain = audioCtx.createGain();
    oscGain.gain.setValueAtTime(0.15, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
    osc.connect(oscGain).connect(audioCtx.destination);
    
    // Snare snap noise
    const bufferSize = audioCtx.sampleRate * 0.1;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1500, time);
    
    noiseGain.gain.setValueAtTime(0.12, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    
    noise.connect(filter).connect(noiseGain).connect(audioCtx.destination);
    
    osc.start(time);
    osc.stop(time + 0.09);
    noise.start(time);
    noise.stop(time + 0.11);
}

function playDeathSound() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(50, audioCtx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
}

// Window sizing
function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    groundY = height * GROUND_Y_RATIO;
    if (currentState === STATES.MENU) {
        player.y = groundY;
    }
}

// Setup Keyboard and UI Events
function setupEvents() {
    window.addEventListener('resize', resize);
    
    window.addEventListener('keydown', (e) => {
        if (currentState !== STATES.PLAYING) return;
        if (e.code === 'ArrowUp' || e.code === 'Space') {
            if (!player.isJumping && !player.isSliding) {
                player.vy = player.jumpForce;
                player.isJumping = true;
                playSoundFeedback(440);
            }
        }
        if (e.code === 'ArrowDown' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
            if (!player.isJumping && !player.isSliding) {
                player.isSliding = true;
                player.slideTime = player.slideDuration;
                playSoundFeedback(330);
            }
        }
    });

    document.getElementById('start-btn').onclick = startNewGame;
    document.getElementById('restart-btn').onclick = startNewGame;
    document.getElementById('pause-btn').onclick = togglePause;
    document.getElementById('resume-btn').onclick = togglePause;

    highScore = parseInt(localStorage.getItem('bitbeat_high_score') || '0', 10);
    UI.bestScore.innerText = highScore.toString().padStart(6, '0');
}

function playSoundFeedback(freq) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

// Start New Run
function startNewGame() {
    initAudio();
    score = 0;
    multiplier = 1;
    currentState = STATES.PLAYING;
    beatVisualPulse = 0;

    player.y = groundY;
    player.vy = 0;
    player.isJumping = false;
    player.isSliding = false;

    obstacles.length = 0;
    particles.length = 0;

    // Add star background particles
    for (let i = 0; i < 30; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height * 0.6,
            speed: 1 + Math.random() * 2,
            size: Math.random() * 2 + 1
        });
    }

    nextStepTime = audioCtx.currentTime + 0.05;
    currentStep = 0;

    UI.mainMenu.classList.add('hidden');
    UI.gameoverScreen.classList.add('hidden');
    UI.hud.classList.remove('hidden');
}

// Spawn new obstacle
function spawnObstacle() {
    const isHigh = Math.random() > 0.5;
    obstacles.push({
        x: width + 50,
        y: isHigh ? groundY - 65 : groundY - 26,
        w: 24,
        h: isHigh ? 36 : 26,
        type: isHigh ? 'high' : 'low',
        passed: false,
        onBeat: currentStep % 4 === 0
    });
}

function togglePause() {
    if (currentState === STATES.PLAYING) {
        currentState = STATES.PAUSED;
        UI.pauseScreen.classList.remove('hidden');
    } else if (currentState === STATES.PAUSED) {
        currentState = STATES.PLAYING;
        UI.pauseScreen.classList.add('hidden');
        nextStepTime = audioCtx.currentTime + 0.05;
    }
}

function gameOver() {
    currentState = STATES.GAMEOVER;
    playDeathSound();
    if (score > highScore) {
        highScore = Math.floor(score);
        localStorage.setItem('bitbeat_high_score', highScore.toString());
        UI.bestScore.innerText = highScore.toString().padStart(6, '0');
    }
    UI.finalStats.innerText = `FINAL SCORE GAINED: ${Math.floor(score)}`;
    UI.hud.classList.add('hidden');
    if(window.showToast) window.showToast('SYSTEM_LOCKOUT', 'red');
}

// Logic updates
function update() {
    if (currentState !== STATES.PLAYING) return;

    // Increment base score
    score += 0.25 * multiplier;

    // Decr pulse
    if (beatVisualPulse > 0) beatVisualPulse -= 0.05;

    // Scheduler procedural beat logic
    const currentTime = audioCtx.currentTime;
    while (nextStepTime < currentTime + 0.1) {
        const timeToPlay = nextStepTime;
        
        // Kick on every beat
        if (currentStep % 4 === 0) {
            playKick(timeToPlay);
            beatVisualPulse = 1.0;
        }
        
        // Hihat on offbeats
        if (currentStep % 2 === 1) {
            playHihat(timeToPlay);
        }

        // Snare on backbeats
        if (currentStep === 4 || currentStep === 12) {
            playSnare(timeToPlay);
        }

        // Rhythmical obstacle spawner: every 8 steps (2 beats) or 12 steps, spawn wall
        if (currentStep % 8 === 0 && Math.random() > 0.3) {
            spawnObstacle();
        }

        nextStepTime += stepTime;
        currentStep = (currentStep + 1) % 16;
    }

    // Player Jump Physics
    if (player.isJumping) {
        player.vy += player.gravity;
        player.y += player.vy;
        if (player.y >= groundY) {
            player.y = groundY;
            player.vy = 0;
            player.isJumping = false;
        }
    }

    // Player Slide Timer
    if (player.isSliding) {
        player.slideTime--;
        if (player.slideTime <= 0) {
            player.isSliding = false;
        }
    }

    // Drifting background stars
    particles.forEach(p => {
        p.x -= p.speed * 0.8;
        if (p.x < 0) p.x = width;
    });

    // Move obstacles
    const obsSpeed = 7.5;
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        o.x -= obsSpeed;

        // Collision Check
        const py = player.isSliding ? player.y - 15 : player.y - player.h;
        const ph = player.isSliding ? 15 : player.h;
        const px = player.x;
        const pw = player.w;

        if (px + pw > o.x && px < o.x + o.w && py + ph > o.y && py < o.y + o.h) {
            gameOver();
            return;
        }

        // Check if safely passed
        if (!o.passed && o.x + o.w < player.x) {
            o.passed = true;
            // Reward beat sync matching
            if (o.onBeat) {
                multiplier = Math.min(8, multiplier + 1);
                score += 100 * multiplier;
            } else {
                multiplier = Math.max(1, multiplier - 1);
                score += 50;
            }
        }

        if (o.x < -100) {
            obstacles.splice(i, 1);
        }
    }

    // Update HUD elements
    UI.multiplier.innerText = `X${multiplier}`;
    UI.score.innerText = Math.floor(score).toString().padStart(6, '0');
}

// Rendering screen
function draw() {
    ctx.fillStyle = '#030306';
    ctx.fillRect(0, 0, width, height);

    // Synthwave Sunset grid background
    ctx.strokeStyle = 'rgba(255, 0, 127, ' + (0.04 + beatVisualPulse * 0.05) + ')';
    ctx.lineWidth = 1.5;
    
    // Horizontal perspective lines
    const perspectiveLines = 14;
    for (let i = 0; i <= perspectiveLines; i++) {
        const xOffset = (i / perspectiveLines) * width;
        ctx.beginPath();
        ctx.moveTo(width / 2, groundY * 0.8);
        ctx.lineTo(xOffset, height);
        ctx.stroke();
    }

    // Moving horizontal grid lines
    const timeRatio = (Date.now() * 0.003) % 1.0;
    ctx.strokeStyle = 'rgba(255, 0, 127, 0.08)';
    for (let i = 0; i < 10; i++) {
        const y = groundY + ((i + timeRatio) / 10) * (height - groundY);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    // Background Stars
    particles.forEach(p => {
        ctx.fillStyle = 'rgba(0, 240, 255, 0.35)';
        ctx.fillRect(p.x, p.y, p.size, p.size);
    });

    // Drawing ground line
    ctx.strokeStyle = '#b300ff';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#b300ff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(width, groundY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw obstacles (Neon Gate walls)
    obstacles.forEach(o => {
        ctx.save();
        const color = o.onBeat ? '#ff007f' : '#00f0ff';
        ctx.strokeStyle = color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = color;
        ctx.lineWidth = 3;

        // Render double lines to simulate vector screens
        ctx.strokeRect(o.x, o.y, o.w, o.h);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(o.x + 2, o.y + 2, o.w - 4, o.h - 4);
        ctx.restore();
    });

    // Draw Player (Glowing Cyber-triangle/arrow)
    ctx.save();
    ctx.translate(player.x, player.y);
    
    ctx.fillStyle = '#00f0ff';
    ctx.shadowBlur = 25;
    ctx.shadowColor = '#00f0ff';

    ctx.beginPath();
    if (player.isSliding) {
        // Flat sliding wedge shape
        ctx.moveTo(-15, 0);
        ctx.lineTo(15, 0);
        ctx.lineTo(12, -15);
        ctx.lineTo(-12, -15);
    } else {
        // Sleek runner arrow shape
        ctx.moveTo(-12, 0);
        ctx.lineTo(12, 0);
        ctx.lineTo(0, -player.h);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

function init() {
    resize();
    setupEvents();
    requestAnimationFrame(loop);
}

window.addEventListener('DOMContentLoaded', init);
