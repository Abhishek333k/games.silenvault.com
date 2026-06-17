/**
 * Shift Protocol - Dimensional Stealth Engine
 * Tactical Phase-Shifting Logic
 */

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const STATES = { MENU: 'menu', PLAYING: 'playing', GAMEOVER: 'gameover' };
const PHASES = { ALPHA: 'alpha', OMEGA: 'omega' };

let currentState = STATES.MENU;
let currentPhase = PHASES.ALPHA;

let width, height;
let score = 0;
let lastTime = 0;
let glitchDuration = 0;

const COLORS = {
    bg: '#050507',
    alpha: '#00f2ff',
    omega: '#ff00ff',
    grid: 'rgba(255, 255, 255, 0.03)'
};

const player = {
    x: 0, y: 0, r: 12,
    targetX: 0, targetY: 0
};

const nodes = [];
const guards = [];
const obstacles = [];

function init() {
    UI.cacheRefs();
    resize();
    setupEvents();
    requestAnimationFrame(loop);
}

function setupEvents() {
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', (e) => {
        player.targetX = e.clientX;
        player.targetY = e.clientY;
    });
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && currentState === STATES.PLAYING) togglePhase();
    });
    const startBtn = document.getElementById('start-btn');
    if (startBtn) startBtn.onclick = startGame;
}

function resize() {
    const dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    player.x = width / 2; player.y = height / 2;
}

function startGame() {
    currentState = STATES.PLAYING;
    score = 0; currentPhase = PHASES.ALPHA;
    nodes.length = 0; guards.length = 0; obstacles.length = 0;
    if (UI.menu) UI.menu.classList.add('hidden');
    if (UI.hud) UI.hud.classList.remove('hidden');
    document.body.style.cursor = 'none';
    spawnNode();
    for(let i=0; i<6; i++) spawnObstacle();
}

let lastScore = -1;
function updateHUD() {
    if (score !== lastScore && UI.score) {
        UI.score.innerText = score.toString().padStart(2, '0');
        lastScore = score;
    }
}

// UI Cache to prevent DOM lookups
const UI = {
    phase: null,
    score: null,
    menu: null,
    overlay: null,
    hud: null,
    cacheRefs() {
        this.phase = document.getElementById('phase-label');
        this.score = document.getElementById('score');
        this.menu = document.getElementById('main-menu');
        this.overlay = document.getElementById('overlay');
        this.hud = document.getElementById('hud');
    }
};

function togglePhase() {
    currentPhase = (currentPhase === PHASES.ALPHA) ? PHASES.OMEGA : PHASES.ALPHA;
    glitchDuration = 12; // Trigger a brief digital dimension glitch transition
    if (UI.phase) {
        UI.phase.innerText = currentPhase.toUpperCase();
        UI.phase.className = `value ${currentPhase === PHASES.ALPHA ? 'cyan' : 'magenta'}`;
    }
}

function spawnNode() {
    nodes.push({
        x: 100 + Math.random() * (width - 200),
        y: 100 + Math.random() * (height - 200),
        r: 10, phase: Math.random() > 0.5 ? PHASES.ALPHA : PHASES.OMEGA
    });
}

function spawnObstacle() {
    obstacles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        w: 50 + Math.random() * 100,
        h: 50 + Math.random() * 100,
        phase: Math.random() > 0.5 ? PHASES.ALPHA : PHASES.OMEGA
    });
}

function spawnGuard() {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if(side === 0) { x = Math.random() * width; y = -50; }
    else if(side === 1) { x = width + 50; y = Math.random() * height; }
    else if(side === 2) { x = Math.random() * width; y = height + 50; }
    else { x = -50; y = Math.random() * height; }

    guards.push({
        x, y, r: 15,
        speed: 2 + Math.random() * 2,
        phase: Math.random() > 0.5 ? PHASES.ALPHA : PHASES.OMEGA
    });
}

function update() {
    if (glitchDuration > 0) glitchDuration--;
    if (currentState !== STATES.PLAYING) return;

    player.x += (player.targetX - player.x) * 0.15;
    player.y += (player.targetY - player.y) * 0.15;

    // Node Collection
    for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        const dist = Math.hypot(player.x - n.x, player.y - n.y);
        if (dist < player.r + n.r && currentPhase === n.phase) {
            nodes.splice(i, 1);
            score++;
            updateHUD();
            spawnNode();
            if (score % 2 === 0) spawnGuard();
        }
    }

    // Guard Collision
    for (let i = 0; i < guards.length; i++) {
        const g = guards[i];
        const dx = player.x - g.x;
        const dy = player.y - g.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist > 0) {
            g.x += (dx / dist) * g.speed;
            g.y += (dy / dist) * g.speed;
        }

        if (dist < player.r + g.r && currentPhase === g.phase) {
            gameOver();
        }
    }

    // Obstacle Collision (Precise Circle-Rect)
    for (let i = 0; i < obstacles.length; i++) {
        const o = obstacles[i];
        if (currentPhase === o.phase) {
            const closestX = Math.max(o.x, Math.min(player.x, o.x + o.w));
            const closestY = Math.max(o.y, Math.min(player.y, o.y + o.h));
            const distance = Math.hypot(player.x - closestX, player.y - closestY);
            if (distance < player.r) gameOver();
        }
    }
}

function gameOver() {
    currentState = STATES.GAMEOVER;
    document.getElementById('overlay').classList.remove('hidden');
    localStorage.setItem('shift_high_score', score);
    setTimeout(() => location.reload(), 3000);
}

let lastTime = 0;
let accumulator = 0;
const STEP = 1/60;
function loop(time = 0) {
    let dt = (time - lastTime) / 1000;
    if (dt > 0.25) dt = 0.25;
    lastTime = time;
    accumulator += dt;
    while(accumulator >= STEP) {
        update();
        accumulator -= STEP;
    }
    draw();
    requestAnimationFrame(loop);
}

function draw() {
    ctx.save();
    // Digital dimension shift camera shake
    if (glitchDuration > 0) {
        ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
    }

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, width, height);

    // Digital cybergrid background (dots instead of lines for premium cyberpunk feel)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    const dotSpacing = 80;
    for (let x = 0; x < width; x += dotSpacing) {
        for (let y = 0; y < height; y += dotSpacing) {
            ctx.fillRect(x, y, 1.5, 1.5);
        }
    }

    // Dynamic horizontal scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    for (let y = 0; y < height; y += 4) {
        ctx.fillRect(0, y, width, 1.5);
    }

    // Obstacles
    obstacles.forEach(o => {
        ctx.strokeStyle = (o.phase === PHASES.ALPHA) ? COLORS.alpha : COLORS.omega;
        ctx.lineWidth = (currentPhase === o.phase) ? 4.5 : 1;
        ctx.globalAlpha = (currentPhase === o.phase) ? 1 : 0.08;
        
        ctx.save();
        if (glitchDuration > 0 && Math.random() > 0.6) {
            ctx.translate((Math.random() - 0.5) * 15, 0);
        }
        
        // Render double lines to look like vector screens
        ctx.strokeRect(o.x, o.y, o.w, o.h);
        if (currentPhase === o.phase) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = ctx.strokeStyle;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.strokeRect(o.x + 2, o.y + 2, o.w - 4, o.h - 4);
        }
        ctx.restore();
    });

    // Guards
    guards.forEach(g => {
        ctx.save();
        ctx.fillStyle = (g.phase === PHASES.ALPHA) ? COLORS.alpha : COLORS.omega;
        ctx.globalAlpha = (currentPhase === g.phase) ? 1 : 0.08;

        if (glitchDuration > 0 && Math.random() > 0.5) {
            // Chromatic splitting offset
            ctx.fillStyle = COLORS.alpha;
            ctx.beginPath(); ctx.arc(g.x - 4, g.y, g.r, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = COLORS.omega;
            ctx.beginPath(); ctx.arc(g.x + 4, g.y, g.r, 0, Math.PI * 2); ctx.fill();
        } else {
            ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2); ctx.fill();
            if (currentPhase === g.phase) {
                ctx.shadowBlur = 20; 
                ctx.shadowColor = ctx.fillStyle;
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
        }
        ctx.restore();
    });
    ctx.shadowBlur = 0;

    // Nodes
    nodes.forEach(n => {
        ctx.strokeStyle = (n.phase === PHASES.ALPHA) ? COLORS.alpha : COLORS.omega;
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = (currentPhase === n.phase) ? 1 : 0.08;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.stroke();
        
        if (currentPhase === n.phase) {
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 15;
            ctx.shadowColor = ctx.strokeStyle;
            ctx.beginPath(); ctx.arc(n.x, n.y, 4, 0, Math.PI * 2); ctx.fill();
        }
    });
    ctx.shadowBlur = 0;

    // Player (Holographic Cloaking grid inside)
    ctx.globalAlpha = 1;
    const playerColor = (currentPhase === PHASES.ALPHA) ? COLORS.alpha : COLORS.omega;
    
    ctx.save();
    if (glitchDuration > 0) {
        // Double rendering chromatic aberration split
        ctx.fillStyle = COLORS.alpha;
        ctx.beginPath(); ctx.arc(player.x - 6, player.y, player.r, 0, Math.PI * 2); ctx.fill();
        
        ctx.fillStyle = COLORS.omega;
        ctx.beginPath(); ctx.arc(player.x + 6, player.y, player.r, 0, Math.PI * 2); ctx.fill();
    } else {
        // Holographic stealth field grid
        ctx.fillStyle = playerColor;
        ctx.shadowBlur = 25; 
        ctx.shadowColor = playerColor;
        ctx.beginPath(); 
        ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2); 
        ctx.fill();

        // Draw overlay design inside player core
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.r - 4, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
}

window.addEventListener('DOMContentLoaded', init);
