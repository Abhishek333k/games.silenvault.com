/**
 * Ignis: Zero - Thermal Survival Engine (v1.0)
 * Top-Down Kinetic Flow
 */

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const STATES = { MENU: 'menu', PLAYING: 'playing', PAUSED: 'paused', GAMEOVER: 'gameover' };
let currentState = STATES.MENU;

let width, height;
let score = 0;
let heat = 100;
let lastTime = 0;

const COLORS = {
    bg: '#050507',
    heat: '#ff4d00',
    frost: '#00f2ff',
    obsidian: '#1a1a1c',
    white: '#ffffff'
};

const core = {
    x: 0, y: 0, r: 15,
    targetX: 0, targetY: 0,
    pulse: 0, pulseDir: 1
};

const shards = [];
const particles = [];
const enemies = [];

let shake = 0;

function init() {
    UI.cacheRefs();
    resize();
    setupEvents();
    requestAnimationFrame(loop);
}

function setupEvents() {
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', (e) => {
        core.targetX = e.clientX;
        core.targetY = e.clientY;
    });
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.code === 'KeyP') togglePause();
    });
    const startBtn = document.getElementById('start-btn');
    if (startBtn) startBtn.onclick = startGame;
    const resumeBtn = document.getElementById('resume-btn');
    if (resumeBtn) resumeBtn.onclick = togglePause;
}

// UI Cache to prevent DOM lookups
const UI = {
    heat: null,
    score: null,
    menu: null,
    hud: null,
    pause: null,
    overlay: null,
    cacheRefs() {
        this.heat = document.getElementById('heat-fill');
        this.score = document.getElementById('score');
        this.menu = document.getElementById('main-menu');
        this.hud = document.getElementById('hud');
        this.pause = document.getElementById('pause-screen');
        this.overlay = document.getElementById('overlay');
    }
};

let lastScore = -1;
function updateHUD() {
    if (score !== lastScore && UI.score) {
        UI.score.innerText = score.toString().padStart(6, '0');
        lastScore = score;
    }
    if (UI.heat) UI.heat.style.width = `${heat}%`;
}

function startGame() {
    currentState = STATES.PLAYING;
    score = 0; heat = 100;
    shards.length = 0; enemies.length = 0;
    if (UI.menu) UI.menu.classList.add('hidden');
    if (UI.hud) UI.hud.classList.remove('hidden');
    document.body.style.cursor = 'none';
}

function togglePause() {
    if (currentState === STATES.MENU || currentState === STATES.GAMEOVER) return;
    if (currentState === STATES.PAUSED) {
        currentState = STATES.PLAYING;
        document.getElementById('pause-screen').classList.add('hidden');
        document.body.style.cursor = 'none';
    } else {
        currentState = STATES.PAUSED;
        document.getElementById('pause-screen').classList.remove('hidden');
        document.body.style.cursor = 'auto';
    }
}

function spawnShard() {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.max(width, height) * 0.6;
    shards.push({
        x: core.x + Math.cos(angle) * dist,
        y: core.y + Math.sin(angle) * dist,
        r: 4 + Math.random() * 4,
        speed: 1.5 + Math.random() * 2
    });
}

function spawnEnemy() {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.max(width, height) * 0.7;
    enemies.push({
        x: core.x + Math.cos(angle) * dist,
        y: core.y + Math.sin(angle) * dist,
        r: 20 + Math.random() * 10,
        speed: 1 + Math.random() * 1
    });
}

function update(dt) {
    if (currentState !== STATES.PLAYING) return;

    // Heat Decay
    heat -= 0.05 * (1 + score / 5000);
    updateHUD();
    if (heat <= 0) gameOver();

    if (shake > 0) shake *= 0.9;

    // Core Movement (Smooth Follow)
    core.x += (core.targetX - core.x) * 0.1;
    core.y += (core.targetY - core.y) * 0.1;

    // Core Pulse
    core.pulse += 0.05 * core.pulseDir;
    if (core.pulse > 1 || core.pulse < 0) core.pulseDir *= -1;

    // Shards Logic
    if (Math.random() < 0.05) spawnShard();
    for (let i = shards.length - 1; i >= 0; i--) {
        const s = shards[i];
        const dx = core.x - s.x;
        const dy = core.y - s.y;
        const dist = Math.hypot(dx, dy);
        
        s.x += (dx / dist) * s.speed;
        s.y += (dy / dist) * s.speed;

        if (dist < core.r + s.r) {
            shards.splice(i, 1);
            score += 100;
            heat = Math.min(100, heat + 5);
            updateHUD();
            spawnParticles(core.x, core.y, COLORS.frost, 10);
        }
    }

    // Enemies Logic (Swarm AI)
    if (Math.random() < 0.01 + (score/100000)) spawnEnemy();
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        const dx = core.x - e.x;
        const dy = core.y - e.y;
        const dist = Math.hypot(dx, dy);

        // Movement Vector
        let moveX = dist > 0 ? (dx / dist) * e.speed : 0;
        let moveY = dist > 0 ? (dy / dist) * e.speed : 0;

        // Separation Force
        enemies.forEach(other => {
            if (other === e) return;
            const dOther = Math.hypot(e.x - other.x, e.y - other.y);
            if (dOther < 50) {
                moveX -= (other.x - e.x) * 0.05;
                moveY -= (other.y - e.y) * 0.05;
            }
        });

        e.x += moveX;
        e.y += moveY;

        if (dist < core.r + e.r) {
            heat -= 20;
            enemies.splice(i, 1);
            shakeCamera();
            spawnParticles(core.x, core.y, COLORS.heat, 20);
        }
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.life -= 0.02;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y, 
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1.0, color
        });
    }
}

function gameOver() {
    currentState = STATES.GAMEOVER;
    document.getElementById('overlay').classList.remove('hidden');
    // Save to Hub
    const top = parseInt(localStorage.getItem('ignis_high_score') || '0');
    if (score > top) localStorage.setItem('ignis_high_score', score);
    
    setTimeout(() => location.reload(), 3000);
}

function shakeCamera() {
    shake = 12;
}

function loop(time) {
    const dt = time - lastTime;
    lastTime = time;
    update(dt);
    draw();
    requestAnimationFrame(loop);
}

function draw() {
    ctx.save();
    if (shake > 0) {
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    }
    
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, width, height);

    // Subtle thermal background grid lines
    ctx.strokeStyle = 'rgba(255, 77, 0, 0.03)';
    ctx.lineWidth = 1;
    const step = 60;
    for (let x = 0; x < width; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
    for (let y = 0; y < height; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }

    // Frost Shards (icy blue glow fields)
    shards.forEach(s => {
        const shardGrad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 2.5);
        shardGrad.addColorStop(0, '#ffffff');
        shardGrad.addColorStop(0.3, COLORS.frost);
        shardGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = shardGrad;
        ctx.shadowBlur = 15;
        ctx.shadowColor = COLORS.frost;
        ctx.beginPath(); 
        ctx.arc(s.x, s.y, s.r * 2.5, 0, Math.PI * 2); 
        ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Obsidian Sentinels (dark core with cracked heat outlines)
    enemies.forEach(e => {
        // Sentinel outer heat aura
        const eGrad = ctx.createRadialGradient(e.x, e.y, e.r * 0.3, e.x, e.y, e.r * 1.5);
        eGrad.addColorStop(0, '#ff4d00');
        eGrad.addColorStop(0.5, '#4a0e00');
        eGrad.addColorStop(1, 'transparent');
        
        ctx.fillStyle = eGrad;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Sentinel obsidian solid shell
        ctx.fillStyle = COLORS.obsidian;
        ctx.strokeStyle = COLORS.heat;
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 15; 
        ctx.shadowColor = COLORS.heat;
        ctx.beginPath(); 
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); 
        ctx.fill(); 
        ctx.stroke();
    });
    ctx.shadowBlur = 0;

    // Thermal Engine Core (multi-layered radial glow fields)
    ctx.save();
    ctx.translate(core.x, core.y);
    const glowSize = core.r + (core.pulse * 18);
    
    // Outer Heat Flare
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize * 2.5);
    grad.addColorStop(0, COLORS.heat);
    grad.addColorStop(0.4, 'rgba(255, 77, 0, 0.4)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath(); 
    ctx.arc(0, 0, glowSize * 2.5, 0, Math.PI * 2); 
    ctx.fill();
    
    // White-Hot Inner Core
    ctx.fillStyle = COLORS.white;
    ctx.shadowBlur = 25;
    ctx.shadowColor = '#ffffff';
    ctx.beginPath(); 
    ctx.arc(0, 0, core.r, 0, Math.PI * 2); 
    ctx.fill();
    ctx.restore();

    // Cooling Particles (shifting yellow -> orange -> red -> dark grey)
    ctx.shadowBlur = 0;
    particles.forEach(p => {
        // Calculate particle color based on life
        let pColor = COLORS.heat;
        if (p.life < 0.3) pColor = '#3a3a3a'; // Cold ash
        else if (p.life < 0.6) pColor = '#bd1f00'; // Cooling red
        else if (p.life < 0.8) pColor = '#ffae00'; // Hot orange
        
        ctx.fillStyle = pColor;
        ctx.globalAlpha = p.life;
        ctx.beginPath(); 
        ctx.arc(p.x, p.y, 3 * p.life, 0, Math.PI * 2); 
        ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.restore();
}

window.addEventListener('DOMContentLoaded', init);
