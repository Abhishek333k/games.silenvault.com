/**
 * Orbit Terminal - Gravity Slingshot Engine
 * High-Precision Physics Logic
 */

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const STATES = { MENU: 'menu', PLAYING: 'playing', LAUNCHED: 'launched', GAMEOVER: 'gameover' };
let currentState = STATES.MENU;

let width, height;
let score = 0;
let dragStart = null;
let dragEnd = null;

const COLORS = {
    bg: '#020205',
    ship: '#ffffff',
    planet: 'rgba(0, 136, 255, 0.2)',
    planetBorder: '#0088ff',
    target: '#ffd700',
    path: 'rgba(255, 255, 255, 0.1)'
};

const ship = {
    x: 0, y: 0, r: 8,
    vx: 0, vy: 0,
    trail: []
};

const planets = [];
let targetNode = { x: 0, y: 0, r: 20 };

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

let lastScore = -1;
function updateHUD() {
    if (score !== lastScore && UI.score) {
        UI.score.innerText = score.toString().padStart(2, '0');
        lastScore = score;
    }
}

function setupEvents() {
    window.addEventListener('resize', resize);
    window.addEventListener('mousedown', (e) => {
        if (currentState === STATES.PLAYING) {
            dragStart = { x: e.clientX, y: e.clientY };
        }
    });
    window.addEventListener('mousemove', (e) => {
        if (dragStart) dragEnd = { x: e.clientX, y: e.clientY };
    });
    window.addEventListener('mouseup', (e) => {
        if (dragStart && dragEnd) {
            const dx = dragStart.x - dragEnd.x;
            const dy = dragStart.y - dragEnd.y;
            launchShip(dx * 0.1, dy * 0.1);
        }
        dragStart = null; dragEnd = null;
    });
    const startBtn = document.getElementById('start-btn');
    if (startBtn) startBtn.onclick = startGame;
}

function resize() {
    width = window.innerWidth; height = window.innerHeight;
    canvas.width = width; canvas.height = height;
    if (currentState === STATES.MENU) resetShip();
}

function resetShip() {
    ship.x = 100; ship.y = height / 2;
    ship.vx = 0; ship.vy = 0;
    ship.trail = [];
    currentState = STATES.PLAYING;
}

function startGame() {
    score = 0;
    if (UI.menu) UI.menu.classList.add('hidden');
    if (UI.hud) UI.hud.classList.remove('hidden');
    generateLevel();
    resetShip();
}

function generateLevel() {
    planets.length = 0;
    const count = 3 + Math.floor(score / 5);
    targetNode.x = width - 100;
    targetNode.y = Math.random() * (height - 200) + 100;

    let attempts = 0;
    while (planets.length < count && attempts < 100) {
        attempts++;
        const p = {
            x: 250 + Math.random() * (width - 400),
            y: 100 + Math.random() * (height - 200),
            r: 40 + Math.random() * 60,
            mass: 500 + Math.random() * 1000
        };

        // Safe Zone Checks
        const distToShip = Math.hypot(p.x - 100, p.y - height/2);
        const distToTarget = Math.hypot(p.x - targetNode.x, p.y - targetNode.y);
        
        let tooCloseToOthers = false;
        planets.forEach(other => {
            if (Math.hypot(p.x - other.x, p.y - other.y) < p.r + other.r + 50) tooCloseToOthers = true;
        });

        if (distToShip > p.r + 150 && distToTarget > p.r + 150 && !tooCloseToOthers) {
            // Pre-calculate gradient for performance
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
            grad.addColorStop(0, 'rgba(0, 136, 255, 0.4)');
            grad.addColorStop(1, 'transparent');
            p.gradient = grad;
            planets.push(p);
        }
    }
}

function launchShip(vx, vy) {
    ship.vx = vx;
    ship.vy = vy;
    currentState = STATES.LAUNCHED;
    if (UI.status) UI.status.innerText = "IN FLIGHT";
}

function update() {
    if (currentState !== STATES.LAUNCHED) return;

    // Gravity Logic
    for (let i = 0; i < planets.length; i++) {
        const p = planets[i];
        const dx = p.x - ship.x;
        const dy = p.y - ship.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);
        
        if (dist < p.r) gameOver(); // Crash

        const force = p.mass / Math.max(distSq, 400); 
        ship.vx += (dx / dist) * force;
        ship.vy += (dy / dist) * force;
    }

    ship.x += ship.vx;
    ship.y += ship.vy;
    ship.trail.push({ x: ship.x, y: ship.y });
    if (ship.trail.length > 50) ship.trail.shift();

    // Check Bounds
    if (ship.x < 0 || ship.x > width || ship.y < 0 || ship.y > height) gameOver();

    // Check Target
    const tDx = targetNode.x - ship.x;
    const tDy = targetNode.y - ship.y;
    if (Math.hypot(tDx, tDy) < targetNode.r + ship.r) {
        levelComplete();
    }
}

function levelComplete() {
    score++;
    updateHUD();
    if (UI.status) UI.status.innerText = "SUCCESS";
    setTimeout(() => {
        generateLevel();
        resetShip();
        if (UI.status) UI.status.innerText = "READY";
    }, 1000);
}

function gameOver() {
    currentState = STATES.GAMEOVER;
    if (UI.overlay) if(window.showToast) window.showToast(UI.overlayText.innerText, 'cyan');
    localStorage.setItem('orbit_high_score', score);
    setTimeout(() => location.reload(), 2000);
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

function draw() {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, width, height);

    // Astro-Grid Background
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.02)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 100) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 100) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Newtonian Slingshot Trail Ribbon
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 0; i < ship.trail.length - 1; i++) {
        const t1 = ship.trail[i];
        const t2 = ship.trail[i + 1];
        const ratio = i / ship.trail.length;
        ctx.strokeStyle = `rgba(255, 215, 0, ${ratio * 0.6})`;
        ctx.lineWidth = 1 + ratio * 3;
        ctx.beginPath();
        ctx.moveTo(t1.x, t1.y);
        ctx.lineTo(t2.x, t2.y);
        ctx.stroke();
    }
    ctx.restore();

    // Predicted Trajectory Trail on Drag
    if (dragStart && dragEnd) {
        ctx.save();
        ctx.strokeStyle = 'rgba(77, 255, 178, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 6]);
        
        let simX = ship.x;
        let simY = ship.y;
        const dx = dragStart.x - dragEnd.x;
        const dy = dragStart.y - dragEnd.y;
        let simVx = dx * 0.1;
        let simVy = dy * 0.1;
        
        ctx.beginPath();
        ctx.moveTo(simX, simY);
        
        for (let step = 0; step < 150; step++) {
            // Apply planetary gravity
            for (let i = 0; i < planets.length; i++) {
                const p = planets[i];
                const pdx = p.x - simX;
                const pdy = p.y - simY;
                const distSq = pdx * pdx + pdy * pdy;
                const dist = Math.sqrt(distSq);
                if (dist < p.r) break; // Crash inside simulation
                const force = p.mass / Math.max(distSq, 400);
                simVx += (pdx / dist) * force;
                simVy += (pdy / dist) * force;
            }
            simX += simVx;
            simY += simVy;
            
            if (simX < 0 || simX > width || simY < 0 || simY > height) break;
            ctx.lineTo(simX, simY);
        }
        ctx.stroke();

        // Draw launch force vector indicator
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(ship.x, ship.y);
        ctx.lineTo(ship.x + dx, ship.y + dy);
        ctx.stroke();
        
        // Draw launch aim point
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(ship.x + dx, ship.y + dy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Planets & Gravitational Fields
    for (let i = 0; i < planets.length; i++) {
        const p = planets[i];
        
        // Sphere of Influence contour rings (gravitational pulls)
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 136, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 8]);
        
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 1.5, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 2.0, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();

        // Dynamic radial glow of planet mass
        const grad = ctx.createRadialGradient(p.x, p.y, p.r * 0.1, p.x, p.y, p.r * 1.3);
        grad.addColorStop(0, 'rgba(0, 180, 255, 0.85)');
        grad.addColorStop(0.3, 'rgba(0, 70, 180, 0.6)');
        grad.addColorStop(0.8, 'rgba(0, 10, 50, 0.8)');
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 1.3, 0, Math.PI * 2); ctx.fill();
        
        ctx.strokeStyle = 'rgba(0, 180, 255, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke();
    }

    // Target Well
    ctx.save();
    ctx.fillStyle = COLORS.target;
    ctx.shadowBlur = 25; ctx.shadowColor = COLORS.target;
    
    // Draw nesting rings
    ctx.beginPath(); ctx.arc(targetNode.x, targetNode.y, targetNode.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(targetNode.x, targetNode.y, targetNode.r + 6, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    // Ship Icon
    ctx.save();
    ctx.fillStyle = COLORS.ship;
    ctx.shadowBlur = 15; ctx.shadowColor = COLORS.ship;
    ctx.beginPath(); ctx.arc(ship.x, ship.y, ship.r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

window.addEventListener('DOMContentLoaded', init);
