/**
 * Prism Shift - Optic Logic Engine
 * Ray-Tracing Reflection Logic
 */

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const STATES = { MENU: 'menu', PLAYING: 'playing', CLEAR: 'clear' };
let currentState = STATES.MENU;

let width, height;
let score = 0;
let beamSegments = [];

const COLORS = {
    bg: '#0a0a0c',
    laser: '#ffffff',
    prism: 'rgba(255, 255, 255, 0.1)',
    well: '#10b981'
};

const source = { x: 50, y: 100, angle: 0 };
const target = { x: 0, y: 0, r: 30 };
const prisms = [];

// UI Cache
const UI = {
    score: null,
    status: null,
    menu: null,
    hud: null,
    overlay: null,
    cacheRefs() {
        this.score = document.getElementById('score');
        this.status = document.getElementById('status');
        this.menu = document.getElementById('main-menu');
        this.hud = document.getElementById('hud');
        this.overlay = document.getElementById('overlay');
    }
};

function init() {
    UI.cacheRefs();
    resize();
    setupEvents();
    requestAnimationFrame(loop);
}

function setupEvents() {
    window.addEventListener('resize', resize);
    window.addEventListener('mousedown', (e) => {
        if (currentState !== STATES.PLAYING) return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        for (let i = 0; i < prisms.length; i++) {
            const p = prisms[i];
            if (mx > p.x - p.w/2 && mx < p.x + p.w/2 && my > p.y - p.h/2 && my < p.y + p.h/2) {
                p.angle += Math.PI / 4; 
                p.cos = Math.cos(p.angle);
                p.sin = Math.sin(p.angle);
                calculateBeam();
                break;
            }
        }
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
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // Use setTransform to ensure clean scale
    if (currentState === STATES.PLAYING) calculateBeam();
}

function startGame() {
    score = 0;
    if (UI.menu) UI.menu.classList.add('hidden');
    if (UI.hud) UI.hud.classList.remove('hidden');
    generateLevel();
}

function generateLevel() {
    prisms.length = 0;
    const rows = 3; const cols = 3;
    const spacing = 150;
    const startX = width / 2 - (cols * spacing) / 2;
    const startY = height / 2 - (rows * spacing) / 2;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (Math.random() > 0.4) {
                const angle = Math.floor(Math.random() * 8) * (Math.PI / 4);
                prisms.push({
                    x: startX + c * spacing,
                    y: startY + r * spacing,
                    w: 60, h: 20,
                    angle: angle,
                    cos: Math.cos(angle),
                    sin: Math.sin(angle)
                });
            }
        }
    }

    target.x = width - 100;
    target.y = height / 2;
    calculateBeam();
}

function calculateBeam() {
    beamSegments = [{ x: source.x, y: source.y }];
    let curX = source.x; let curY = source.y;
    let curAngle = source.angle;
    let maxBounces = 20;

    while (maxBounces--) {
        let nextX = curX + Math.cos(curAngle) * 3000;
        let nextY = curY + Math.sin(curAngle) * 3000;
        let closestDist = 3000;
        let hitObj = null;

        // Check Prisms
        for (let i = 0; i < prisms.length; i++) {
            const p = prisms[i];
            const hit = intersectLineBox(curX, curY, nextX, nextY, p);
            if (hit && hit.dist < closestDist) {
                closestDist = hit.dist;
                nextX = hit.x; nextY = hit.y;
                hitObj = { type: 'prism', obj: p };
            }
        }

        // Check Target
        const tDist = Math.hypot(target.x - curX, target.y - curY);
        if (tDist < closestDist && intersectLineCircle(curX, curY, nextX, nextY, target)) {
            beamSegments.push({ x: target.x, y: target.y });
            levelComplete();
            return;
        }

        beamSegments.push({ x: nextX, y: nextY });
        if (!hitObj) break;

        // Reflection Logic
        curX = nextX + Math.cos(2 * hitObj.obj.angle - curAngle) * 1; 
        curY = nextY + Math.sin(2 * hitObj.obj.angle - curAngle) * 1;
        curAngle = 2 * hitObj.obj.angle - curAngle;
    }
}

function intersectLineBox(x1, y1, x2, y2, box) {
    // Local space transform using cached trig values
    const cos = box.cos; // Pre-calculated in generateLevel/rotation
    const sin = -box.sin; 
    const dx = x2 - x1; const dy = y2 - y1;
    
    // Start point in box space
    const lx1 = (x1 - box.x) * box.cos + (y1 - box.y) * box.sin;
    const ly1 = -(x1 - box.x) * box.sin + (y1 - box.y) * box.cos;
    // End point in box space
    const lx2 = (x2 - box.x) * box.cos + (y2 - box.y) * box.sin;
    const ly2 = -(x2 - box.x) * box.sin + (y2 - box.y) * box.cos;

    // Check intersection with y=0 line in local box space
    if (Math.sign(ly1) !== Math.sign(ly2)) {
        const t = ly1 / (ly1 - ly2);
        const ix = lx1 + t * (lx2 - lx1);
        if (Math.abs(ix) < box.w / 2) {
            const worldX = box.x + ix * Math.cos(box.angle);
            const worldY = box.y + ix * Math.sin(box.angle);
            return { x: worldX, y: worldY, dist: Math.hypot(worldX - x1, worldY - y1) };
        }
    }
    return null;
}

function intersectLineCircle(x1, y1, x2, y2, c) {
    const dx = x2 - x1; const dy = y2 - y1;
    const length = Math.hypot(dx, dy);
    const dot = (((c.x - x1) * dx) + ((c.y - y1) * dy)) / Math.pow(length, 2);
    const closestX = x1 + (dot * dx);
    const closestY = y1 + (dot * dy);
    const dist = Math.hypot(c.x - closestX, c.y - closestY);
    return dist < c.r;
}

let lastScore = -1;
function updateHUD() {
    if (score !== lastScore && UI.score) {
        UI.score.innerText = score.toString().padStart(2, '0');
        lastScore = score;
    }
}

function levelComplete() {
    if (currentState === STATES.CLEAR) return;
    currentState = STATES.CLEAR;
    score++;
    updateHUD();
    if (UI.overlay) if(window.showToast) window.showToast(UI.overlayText.innerText, 'cyan');
    localStorage.setItem('prism_high_score', score);
    
    setTimeout(() => {
        if (UI.overlay) UI.overlay.classList.add('hidden');
        currentState = STATES.PLAYING;
        generateLevel();
    }, 1500);
}

function loop() {
    draw();
    requestAnimationFrame(loop);
}

function draw() {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, width, height);

    // Astro-Optic Grid Background
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 80) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 80) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Target Well (Glowing energy collector ring)
    ctx.save();
    ctx.strokeStyle = COLORS.well;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 25; ctx.shadowColor = COLORS.well;
    ctx.beginPath(); ctx.arc(target.x, target.y, target.r, 0, Math.PI * 2); ctx.stroke();

    // Subtle internal rotating scanline inside target
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(target.x, target.y, target.r - 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Prisms (Rendered as physical scientific glass crystals)
    for (let i = 0; i < prisms.length; i++) {
        const p = prisms[i];
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        
        // Translucent glass core
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10; ctx.shadowColor = 'rgba(16, 185, 129, 0.4)';
        
        ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
        ctx.strokeRect(-p.w/2, -p.h/2, p.w, p.h);

        // Internal refractive facets (ROYGBIV edge dispersion simulation)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        // Facet lines crossing the rectangle corners to center
        ctx.moveTo(-p.w/2, -p.h/2); ctx.lineTo(p.w/2, p.h/2);
        ctx.moveTo(p.w/2, -p.h/2); ctx.lineTo(-p.w/2, p.h/2);
        ctx.stroke();

        ctx.restore();
    }

    // Volumetric Glowing Laser Beams (Multi-pass rendering)
    if (beamSegments.length > 0) {
        ctx.save();
        const pulse = 0.85 + Math.sin(Date.now() * 0.015) * 0.15;
        
        // Pass 1: Wide Volumetric Outer Glow
        ctx.strokeStyle = COLORS.laser;
        ctx.lineWidth = 12 * pulse;
        ctx.globalAlpha = 0.18 * pulse;
        ctx.shadowBlur = 20 * pulse;
        ctx.shadowColor = COLORS.laser;
        ctx.beginPath();
        for (let i = 0; i < beamSegments.length; i++) {
            const s = beamSegments[i];
            if (i === 0) ctx.moveTo(s.x, s.y); else ctx.lineTo(s.x, s.y);
        }
        ctx.stroke();

        // Pass 2: Mid-range Glow Core
        ctx.lineWidth = 6 * pulse;
        ctx.globalAlpha = 0.45 * pulse;
        ctx.beginPath();
        for (let i = 0; i < beamSegments.length; i++) {
            const s = beamSegments[i];
            if (i === 0) ctx.moveTo(s.x, s.y); else ctx.lineTo(s.x, s.y);
        }
        ctx.stroke();

        // Pass 3: Ultra white-hot focused inner core line
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        for (let i = 0; i < beamSegments.length; i++) {
            const s = beamSegments[i];
            if (i === 0) ctx.moveTo(s.x, s.y); else ctx.lineTo(s.x, s.y);
        }
        ctx.stroke();
        ctx.restore();
    }
}

window.addEventListener('DOMContentLoaded', init);
