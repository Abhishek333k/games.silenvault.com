/**
 * Brick Breaker - Cosmic Edition (v2.0)
 * Space Theme with Parallax & Crystalline Physics.
 */

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const STATES = { MENU: 'menu', PLAYING: 'playing', PAUSED: 'paused', LEVEL_CLEAR: 'clear', GAMEOVER: 'gameover' };
const MODES = { CLASSIC: 'classic', ZEN: 'zen', HARDCORE: 'hardcore' };

let currentState = STATES.MENU;
let gameMode = MODES.CLASSIC;

let width, height;
let score = 0;
let lives = 3;
let currentLevel = 1;
let shakeTime = 0;

const COLORS = {
    bg: '#020205',
    glass: 'rgba(255, 255, 255, 0.18)',
    emerald: '#10b981',
    violet: '#8b5cf6',
    rose: '#f43f5e',
    white: '#ffffff',
    gold: '#ffd700'
};

const audio = {
    ctx: null, master: null,
    init() {
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.master = this.ctx.createGain();
            this.master.connect(this.ctx.destination);
            this.master.gain.value = 0.2;
        } catch(e) {}
    },
    play(freq, type = 'sine', decay = 0.3, vol = 0.2) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        g.gain.setValueAtTime(vol, this.ctx.currentTime);
        // Cosmic reverb-like decay
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + decay);
        osc.connect(g); g.connect(this.master);
        osc.start(); osc.stop(this.ctx.currentTime + decay);
    }
};

const paddle = {
    w: 160, h: 12, x: 0, y: 0,
    targetW: 160, color: COLORS.white,
    gravityActive: false, lasers: 0
};

const balls = [];
const bricks = [];
const particles = [];
const powerups = [];
const projectiles = [];
const stars = [];

function init() {
    UI.cacheRefs();
    createStars();
    resize();
    setupEvents();
    requestAnimationFrame(loop);
}

function createStars() {
    stars.length = 0;
    for(let i=0; i<100; i++) {
        stars.push({
            x: Math.random() * 2000,
            y: Math.random() * 2000,
            size: Math.random() * 2,
            speed: 0.1 + Math.random() * 0.5
        });
    }
}

function setupEvents() {
    window.addEventListener('resize', resize);
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.code === 'KeyP') togglePause();
    });
    window.addEventListener('mousemove', (e) => {
        if (currentState === STATES.PLAYING) {
            const oldX = paddle.x;
            paddle.x = e.clientX - paddle.w / 2;
            paddle.vx = (paddle.x - oldX); // Track momentum
            if (paddle.x < 0) paddle.x = 0;
            if (paddle.x > width - paddle.w) paddle.x = width - paddle.w;
            balls.forEach(b => { if (!b.active) b.x = paddle.x + paddle.w / 2; });
        }
    });
    window.addEventListener('mousedown', (e) => {
        if (currentState !== STATES.PLAYING) return;
        audio.init();
        if (e.button === 0) {
            const idleBall = balls.find(b => !b.active);
            if (idleBall) {
                idleBall.active = true;
                idleBall.vx = (Math.random() - 0.5) * 6;
                idleBall.vy = -idleBall.speed;
                audio.play(150, 'sine', 0.5);
            } else if (paddle.lasers > 0) {
                fireLasers();
            }
        }
        if (e.button === 2) paddle.gravityActive = true;
    });
    window.addEventListener('mouseup', (e) => { if (e.button === 2) paddle.gravityActive = false; });
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    document.getElementById('start-btn').onclick = () => startGame(MODES.CLASSIC);
    document.getElementById('zen-btn').onclick = () => startGame(MODES.ZEN);
    document.getElementById('hardcore-btn').onclick = () => startGame(MODES.HARDCORE);
    document.getElementById('resume-btn').onclick = togglePause;
    document.getElementById('fullscreen-btn').onclick = () => {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
        else document.exitFullscreen();
    };
}

function fireLasers() {
    paddle.lasers -= 2;
    projectiles.push({ x: paddle.x + 15, y: paddle.y, w: 3, h: 20, color: COLORS.rose });
    projectiles.push({ x: paddle.x + paddle.w - 18, y: paddle.y, w: 3, h: 20, color: COLORS.rose });
    audio.play(800, 'sawtooth', 0.1, 0.1);
}

function resize() {
    width = window.innerWidth; height = window.innerHeight;
    canvas.width = width; canvas.height = height;
    paddle.y = height - 100;
    if (balls.length === 0) createBall();
    balls.forEach(b => { if (!b.active) { b.x = width/2; b.y = paddle.y - b.r - 2; } });
}

function createBall(x = width/2, y = height/2, active = false) {
    let bSpeed = 9 + (currentLevel * 0.15);
    if (gameMode === MODES.ZEN) bSpeed *= 0.8;
    if (gameMode === MODES.HARDCORE) bSpeed *= 1.4;

    const newBall = {
        x, y, vx: 0, vy: 0, r: 7, active, speed: bSpeed, trail: []
    };
    if (active) {
        newBall.vx = (Math.random() - 0.5) * 6;
        newBall.vy = -bSpeed;
    }
    balls.push(newBall);
}

function startGame(mode) {
    gameMode = mode;
    currentState = STATES.PLAYING;
    audio.init();
    score = 0; currentLevel = 1;
    lives = (mode === MODES.ZEN) ? Infinity : (mode === MODES.HARDCORE ? 1 : 3);
    balls.length = 0; createBall();
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    generateLevel();
    updateHUD();
    document.body.style.cursor = 'none';
}

// UI Cache to prevent DOM lookups in game loop
const UI = {
    score: null,
    lives: null,
    level: null,
    pauseScreen: null,
    msgOverlay: null,
    msgText: null,
    cacheRefs() {
        this.score = document.getElementById('score');
        this.lives = document.getElementById('lives');
        this.level = document.getElementById('level');
        this.pauseScreen = document.getElementById('pause-screen');
        this.msgOverlay = document.getElementById('message-overlay');
        this.msgText = document.getElementById('message-text');
    }
};

let lastHUDState = { score: -1, lives: -1, level: -1 };

function updateHUD(force = false) {
    if (force || lastHUDState.score !== score) {
        UI.score.innerText = score.toString().padStart(6, '0');
        lastHUDState.score = score;
    }
    if (force || lastHUDState.lives !== lives) {
        UI.lives.innerText = (lives === Infinity) ? '∞' : lives.toString().padStart(2, '0');
        lastHUDState.lives = lives;
    }
    if (force || lastHUDState.level !== currentLevel) {
        UI.level.innerText = currentLevel.toString().padStart(2, '0');
        lastHUDState.level = currentLevel;
    }
}

function togglePause() {
    if (currentState === STATES.MENU || currentState === STATES.LEVEL_CLEAR) return;
    if (currentState === STATES.PAUSED) {
        currentState = STATES.PLAYING;
        UI.pauseScreen.classList.add('hidden');
        document.body.style.cursor = 'none';
    } else {
        currentState = STATES.PAUSED;
        UI.pauseScreen.classList.remove('hidden');
        document.body.style.cursor = 'auto';
    }
}

function generateLevel() {
    bricks.length = 0; powerups.length = 0; projectiles.length = 0;
    const cols = 12; const rows = 8;
    const padding = 15;
    const bw = (width - (cols + 1) * padding) / cols;
    const bh = 24;

    const templates = [
        (r,c) => true,
        (r,c) => (r+c) % 2 === 0,
        (r,c) => Math.abs(c-5.5) + Math.abs(r-3.5) < 5,
        (r,c) => r % 2 === 0,
        (r,c) => c % 3 !== 0
    ];
    const layout = templates[(currentLevel-1) % templates.length];

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (!layout(r, c)) continue;
            let color = COLORS.glass;
            let pType = null;
            const rnd = Math.random();
            if (rnd > 0.96) { color = COLORS.emerald; pType = 'wide'; }
            else if (rnd > 0.92) { color = COLORS.violet; pType = 'multi'; }
            else if (rnd > 0.88) { color = COLORS.rose; pType = 'laser'; }

            bricks.push({ x: padding + c*(bw+padding), y: 120 + r*(bh+padding), w: bw, h: bh, alive: true, hp: (color !== COLORS.glass) ? 2 : 1, color, pType, pulse: 0 });
        }
    }
}

function update() {
    if (currentState !== STATES.PLAYING) return;
    if (shakeTime > 0) shakeTime--;
    paddle.w += (paddle.targetW - paddle.w) * 0.1;

    // Multi-Step Physics Solver (4 sub-steps per frame)
    const subSteps = 4;
    for (let s = 0; s < subSteps; s++) {
        for (let i = balls.length - 1; i >= 0; i--) {
            const b = balls[i];
            if (!b.active) continue;

            b.x += b.vx / subSteps; 
            b.y += b.vy / subSteps;

            if (s === 0) {
                b.trail.push({x: b.x, y: b.y});
                if (b.trail.length > 12) b.trail.shift();
            }

            // Wall Collisions
            if (b.x < b.r) { b.vx = Math.abs(b.vx); b.x = b.r; audio.play(400, 'sine', 0.05); }
            if (b.x > width - b.r) { b.vx = -Math.abs(b.vx); b.x = width - b.r; audio.play(400, 'sine', 0.05); }
            if (b.y < b.r) { b.vy = Math.abs(b.vy); b.y = b.r; audio.play(400, 'sine', 0.05); }
            
            if (b.y > height) {
                balls.splice(i, 1);
                if (balls.length === 0) resetLife();
                continue;
            }

            // Paddle Collision (Swept + Momentum)
            if (b.vy > 0 && b.y + b.r > paddle.y && b.y - b.r < paddle.y + paddle.h && b.x > paddle.x && b.x < paddle.x + paddle.w) {
                const hitPos = (b.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
                b.vx = hitPos * 10 + (paddle.vx * 0.2); // Add paddle spin
                b.vy = -Math.abs(b.vy) * 1.02; 
                b.y = paddle.y - b.r;
                shakeTime = 4; audio.play(100, 'triangle', 0.2);
            }

            // Brick Collision (Swept)
            for (let j = 0; j < bricks.length; j++) {
                const brick = bricks[j];
                if (!brick.alive) continue;
                if (b.x + b.r > brick.x && b.x - b.r < brick.x + brick.w && b.y + b.r > brick.y && b.y - b.r < brick.y + brick.h) {
                    const overlapX = Math.min(b.x + b.r - brick.x, brick.x + brick.w - (b.x - b.r));
                    const overlapY = Math.min(b.y + b.r - brick.y, brick.y + brick.h - (b.y - b.r));
                    
                    if (overlapX < overlapY) b.vx *= -1; else b.vy *= -1;
                    
                    hitBrick(brick);
                    break; // One collision per sub-step
                }
            }
        }
    }

    // Powerups
    for (let i = powerups.length - 1; i >= 0; i--) {
        const p = powerups[i]; p.y += 3.5;
        if (p.y + 15 > paddle.y && p.y < paddle.y + paddle.h && p.x > paddle.x && p.x < paddle.x + paddle.w) {
            applyPowerup(p.type); powerups.splice(i, 1);
        } else if (p.y > height) powerups.splice(i, 1);
    }

    // Projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i]; p.y -= 15;
        if (p.y < 0) { projectiles.splice(i, 1); continue; }
        bricks.forEach(b => {
            if (b.alive && p.x < b.x + b.w && p.x + p.w > b.x && p.y < b.y + b.h && p.y + p.h > b.y) {
                hitBrick(b); projectiles.splice(i, 1);
            }
        });
    }

    bricks.forEach(b => { if (b.pulse > 0) b.pulse -= 0.05; });
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]; p.x += p.vx; p.y += p.vy; p.life -= 0.02;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function hitBrick(brick) {
    brick.hp--;
    bricks.forEach(b => { if(b.color === brick.color) b.pulse = 1.0; });
    audio.play(400 + Math.random()*200, 'sine', 0.2);
    if (brick.hp <= 0) {
        brick.alive = false; 
        score += (gameMode === MODES.HARDCORE) ? 200 : 100; updateHUD();
        spawnParticles(brick.x + brick.w/2, brick.y + brick.h/2, brick.color === COLORS.glass ? COLORS.white : brick.color, 25);
        if (brick.pType) spawnPowerup(brick.x + brick.w/2, brick.y + brick.h/2, brick.pType, brick.color);
        if (bricks.every(b => !b.alive)) levelComplete();
    }
}

function levelComplete() {
    currentState = STATES.LEVEL_CLEAR;
    document.getElementById('message-overlay').classList.remove('hidden');
    document.getElementById('message-text').innerText = `LEVEL CLEAR`;
    audio.play(80, 'sine', 1.0, 0.4);
    
    paddle.targetW = 160; paddle.w = 160; paddle.lasers = 0;
    paddle.color = COLORS.white; paddle.gravityActive = false;

    setTimeout(() => {
        currentLevel++; generateLevel();
        document.getElementById('message-overlay').classList.add('hidden');
        currentState = STATES.PLAYING;
        balls.length = 0; createBall(); updateHUD();
    }, 2500);
}

function spawnPowerup(x, y, type, color) {
    powerups.push({ x, y, type, color, rot: 0 });
}

function applyPowerup(type) {
    score += 500; updateHUD();
    audio.play(600, 'square', 0.3);
    if (type === 'wide') { paddle.targetW = 320; setTimeout(() => paddle.targetW = 160, 10000); }
    else if (type === 'multi') { createBall(paddle.x + paddle.w/2, paddle.y - 20, true); createBall(paddle.x + paddle.w/2, paddle.y - 20, true); }
    else if (type === 'laser') { paddle.lasers += 40; paddle.color = COLORS.rose; }
}

function resetLife() {
    if (lives === Infinity) { createBall(); return; }
    lives--; updateHUD();
    audio.play(80, 'sawtooth', 0.6);
    if (lives <= 0) {
        currentState = STATES.GAMEOVER; 
        document.getElementById('message-text').innerText = "GAME OVER"; 
        document.getElementById('message-overlay').classList.remove('hidden');
        
        // PERSISTENCE: Save records for the Hub
        const topScore = parseInt(localStorage.getItem('viper_high_score') || '0');
        if (score > topScore) localStorage.setItem('viper_high_score', score);
        
        const topLevel = parseInt(localStorage.getItem('viper_max_level') || '0');
        if (currentLevel > topLevel) localStorage.setItem('viper_max_level', currentLevel);

        setTimeout(() => location.reload(), 3000);
    } else { createBall(); }
}

function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({ x, y, vx: (Math.random()-0.5)*18, vy: (Math.random()-0.5)*18, life: 1.0, color });
    }
}

function drawRoundedRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r); ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h); ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r); ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y); ctx.closePath();
}

function loop() { update(); draw(); requestAnimationFrame(loop); }

function draw() {
    ctx.save(); if (shakeTime > 0) ctx.translate((Math.random()-0.5)*10, (Math.random()-0.5)*10);
    ctx.clearRect(0, 0, width, height);

    // Dynamic grid overlay (cybernetic network aesthetic)
    ctx.strokeStyle = 'rgba(0, 210, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    for (let y = 0; y < height; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    // Stars Parallax
    ctx.fillStyle = "white";
    stars.forEach(s => {
        ctx.globalAlpha = 0.2 + Math.sin(Date.now()*0.001 + s.x)*0.3;
        ctx.beginPath(); ctx.arc(s.x % width, (s.y + Date.now()*s.speed*0.1) % height, s.size, 0, Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Bricks
    bricks.forEach(b => {
        if (b.alive) {
            ctx.shadowBlur = b.pulse > 0 ? 25 : 12;
            ctx.shadowColor = b.color;
            ctx.fillStyle = b.color;
            ctx.globalAlpha = 0.3 + (b.pulse * 0.7);
            
            drawRoundedRect(b.x, b.y, b.w, b.h, 6);
            ctx.fill();
            
            // Subtle glass border highlight
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            if (b.pulse > 0.1) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = b.pulse*3;
                ctx.stroke();
            }
        }
    });
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    // Powerups (Cosmic Prisms)
    powerups.forEach(p => {
        p.rot += 0.08; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.color; ctx.shadowBlur = 25; ctx.shadowColor = p.color;
        ctx.beginPath(); for(let i=0; i<4; i++){ ctx.rotate(Math.PI/2); ctx.moveTo(0, -18); ctx.lineTo(6, 0); ctx.lineTo(-6, 0); }
        ctx.fill(); ctx.restore();
    });
    ctx.shadowBlur = 0;

    projectiles.forEach(p => { ctx.fillStyle = p.color; ctx.shadowBlur = 15; ctx.shadowColor = p.color; ctx.fillRect(p.x, p.y, p.w, p.h); });
    ctx.shadowBlur = 0;

    // Paddle
    ctx.fillStyle = paddle.color;
    ctx.shadowBlur = paddle.gravityActive ? 25 : 10;
    ctx.shadowColor = paddle.color;
    drawRoundedRect(paddle.x, paddle.y, paddle.w, paddle.h, 8);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Balls & Glow (DeepSeek motion trails)
    balls.forEach(b => {
        // Draw volumetric fading particle trail buffer
        for(let i=0; i<b.trail.length; i++){
            const tr = b.trail[i]; 
            const ratio = i / b.trail.length;
            ctx.fillStyle = b.active ? `rgba(0, 242, 255, ${ratio * 0.35})` : `rgba(255, 255, 255, ${ratio * 0.2})`;
            ctx.beginPath(); 
            ctx.arc(tr.x, tr.y, b.r * (0.4 + ratio * 0.6), 0, Math.PI * 2); 
            ctx.fill();
        }
        ctx.fillStyle = '#fff'; 
        ctx.shadowBlur = 20; 
        ctx.shadowColor = '#00f2ff';
        ctx.beginPath(); 
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); 
        ctx.fill();
    });

    ctx.shadowBlur = 0;
    particles.forEach(p => {
        ctx.fillStyle = p.color; ctx.globalAlpha = p.life;
        ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1; ctx.restore();
}

window.addEventListener('DOMContentLoaded', init);
