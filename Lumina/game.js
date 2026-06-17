// Lumina - Bioluminescent Deep-Sea Exploration Game
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
let highScore = 0;
let energy = 100;
let width, height;

// Player coordinates (Submarine)
const player = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    r: 15,
    lerp: 0.1,
    lightRadius: 180
};

// Lists of entities
const shards = [];
const monsters = [];
const particles = [];

// Screen shake trigger
let shakeTime = 0;

// UI elements Cache
const UI = {
    hud: document.getElementById('hud'),
    score: document.getElementById('score'),
    bestScore: document.getElementById('best-score'),
    energyFill: document.getElementById('energy-fill'),
    mainMenu: document.getElementById('main-menu'),
    pauseScreen: document.getElementById('pause-screen'),
    gameoverScreen: document.getElementById('gameover-screen'),
    finalStats: document.getElementById('final-stats')
};

// Web Audio API Synthesizer
let audioCtx = null;
function playSound(freq, duration, type = 'sine', vol = 0.1) {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

// Resize logic
function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    if (currentState === STATES.MENU) {
        player.x = width / 2;
        player.y = height / 2;
        player.targetX = player.x;
        player.targetY = player.y;
    }
}

// Setup Event Listeners
function setupEvents() {
    window.addEventListener('resize', resize);
    
    window.addEventListener('mousemove', (e) => {
        player.targetX = e.clientX;
        player.targetY = e.clientY;
    });

    document.getElementById('start-btn').onclick = startNewGame;
    document.getElementById('restart-btn').onclick = startNewGame;
    document.getElementById('pause-btn').onclick = togglePause;
    document.getElementById('resume-btn').onclick = togglePause;

    // Read stored high score
    highScore = parseInt(localStorage.getItem('lumina_high_score') || '0', 10);
    UI.bestScore.innerText = highScore.toString().padStart(6, '0');
}

// Start Mission
function startNewGame() {
    score = 0;
    energy = 100;
    currentState = STATES.PLAYING;
    shakeTime = 0;

    // Reset player position
    player.x = width / 2;
    player.y = height / 2;
    player.targetX = player.x;
    player.targetY = player.y;

    // Populate Entities
    shards.length = 0;
    for (let i = 0; i < 8; i++) spawnShard();

    monsters.length = 0;
    for (let i = 0; i < 5; i++) spawnMonster();

    particles.length = 0;
    for (let i = 0; i < 40; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4 - 0.2,
            r: Math.random() * 2 + 1,
            pulse: Math.random() * Math.PI
        });
    }

    UI.mainMenu.classList.add('hidden');
    UI.gameoverScreen.classList.add('hidden');
    UI.hud.classList.remove('hidden');
    playSound(440, 0.3, 'sine', 0.15);
    setTimeout(() => playSound(660, 0.4, 'sine', 0.15), 150);
}

// Spawn Shards
function spawnShard() {
    shards.push({
        x: 100 + Math.random() * (width - 200),
        y: 100 + Math.random() * (height - 200),
        r: 8,
        pulseOffset: Math.random() * Math.PI * 2
    });
}

// Spawn Monsters (Shadow boids)
function spawnMonster() {
    monsters.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        r: 22 + Math.random() * 8,
        pulseOffset: Math.random() * Math.PI * 2
    });
}

// Toggle Pause
function togglePause() {
    if (currentState === STATES.PLAYING) {
        currentState = STATES.PAUSED;
        UI.pauseScreen.classList.remove('hidden');
    } else if (currentState === STATES.PAUSED) {
        currentState = STATES.PLAYING;
        UI.pauseScreen.classList.add('hidden');
    }
}

// Trigger Game Over
function gameOver() {
    currentState = STATES.GAMEOVER;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('lumina_high_score', highScore);
        UI.bestScore.innerText = highScore.toString().padStart(6, '0');
    }
    UI.finalStats.innerText = `DEPTH REACHED: ${score} FEET`;
    UI.hud.classList.add('hidden');
    if(window.showToast) window.showToast('SYSTEM_LOCKOUT', 'red');
    playSound(180, 0.5, 'sawtooth', 0.25);
}

// Update game loop
function update() {
    if (currentState !== STATES.PLAYING) return;

    // Handle screen shake
    if (shakeTime > 0) shakeTime--;

    // Energy drain over time
    energy -= 0.045;
    if (energy <= 0) {
        energy = 0;
        gameOver();
        return;
    }

    // Dynamic light radius based on battery percentage
    player.lightRadius = 50 + (energy / 100) * 160;

    // Lerp Player coordinate
    player.x += (player.targetX - player.x) * player.lerp;
    player.y += (player.targetY - player.y) * player.lerp;

    // Update particles (underwater drifting micro-plankton)
    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.02;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
    });

    // Collision detection: Shards
    for (let i = shards.length - 1; i >= 0; i--) {
        const s = shards[i];
        const dist = Math.hypot(player.x - s.x, player.y - s.y);
        if (dist < player.r + s.r) {
            shards.splice(i, 1);
            score += 150;
            energy = Math.min(100, energy + 15);
            playSound(880, 0.15, 'sine', 0.15);
            setTimeout(() => playSound(1100, 0.2, 'sine', 0.15), 80);
            spawnShard();
        }
    }

    // Update and collide: Monsters (Shadow entities)
    monsters.forEach(m => {
        m.x += m.vx;
        m.y += m.vy;
        m.pulseOffset += 0.01;

        // Bounce off screen boundaries
        if (m.x - m.r < 0 || m.x + m.r > width) m.vx *= -1;
        if (m.y - m.r < 0 || m.y + m.r > height) m.vy *= -1;

        // Collision with player
        const dist = Math.hypot(player.x - m.x, player.y - m.y);
        if (dist < player.r + m.r) {
            // Bounce away
            const angle = Math.atan2(m.y - player.y, m.x - player.x);
            m.vx = Math.cos(angle) * 3;
            m.vy = Math.sin(angle) * 3;

            energy = Math.max(0, energy - 25);
            shakeTime = 20;
            playSound(120, 0.4, 'sawtooth', 0.2);
        }
    });

    // Update HUD display
    UI.energyFill.style.width = `${energy}%`;
    UI.score.innerText = score.toString().padStart(6, '0');
}

// Render loop
function draw() {
    ctx.save();
    
    // Process Screen Shake
    if (shakeTime > 0) {
        ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
    }

    // Fill screen with deep dark ocean base
    ctx.fillStyle = '#010103';
    ctx.fillRect(0, 0, width, height);

    // 1. Draw glowing background items first
    // Ambient micro-plankton
    particles.forEach(p => {
        const pulse = 0.3 + Math.sin(p.pulse) * 0.7;
        ctx.fillStyle = `rgba(0, 255, 200, ${pulse * 0.45})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
    });

    // Bioluminescent Shards (Crystals)
    shards.forEach(s => {
        const pulse = 0.8 + Math.sin(Date.now() * 0.005 + s.pulseOffset) * 0.2;
        ctx.save();
        ctx.translate(s.x, s.y);
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00ffcc';
        ctx.fillStyle = 'rgba(0, 255, 204, ' + (pulse * 0.9) + ')';
        
        // Draw double diamond shape
        ctx.beginPath();
        ctx.moveTo(0, -s.r * pulse);
        ctx.lineTo(s.r * pulse * 0.7, 0);
        ctx.lineTo(0, s.r * pulse);
        ctx.lineTo(-s.r * pulse * 0.7, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    });

    // Shadow monsters (only visible when near player light area)
    monsters.forEach(m => {
        const dist = Math.hypot(player.x - m.x, player.y - m.y);
        // Fade monster based on distance to player light radius
        let alpha = 1.0;
        if (dist > player.lightRadius) {
            alpha = Math.max(0, 1.0 - (dist - player.lightRadius) / 100);
        }

        if (alpha > 0) {
            ctx.save();
            ctx.translate(m.x, m.y);
            ctx.globalAlpha = alpha;

            // Draw shadow smoke
            const pulse = 0.9 + Math.sin(Date.now() * 0.003 + m.pulseOffset) * 0.1;
            ctx.fillStyle = 'rgba(15, 10, 25, 0.85)';
            ctx.strokeStyle = 'rgba(180, 0, 255, 0.4)';
            ctx.lineWidth = 1.5;
            
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#b300ff';
            
            ctx.beginPath();
            ctx.arc(0, 0, m.r * pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Threatening red pupils
            ctx.fillStyle = '#ff0033';
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#ff0033';
            ctx.beginPath();
            ctx.arc(-m.r * 0.3, -m.r * 0.1, 3.5, 0, Math.PI * 2);
            ctx.arc(m.r * 0.3, -m.r * 0.1, 3.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    });

    // 2. Draw the player submarine
    ctx.save();
    ctx.translate(player.x, player.y);
    // Draw outer engine flame pulse
    const flameSize = 6 + Math.sin(Date.now() * 0.05) * 3;
    ctx.fillStyle = '#00ffcc';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00ffcc';
    ctx.beginPath();
    ctx.arc(-player.r - 2, 0, flameSize, 0, Math.PI * 2);
    ctx.fill();

    // Sleek metallic hull
    const hullGrad = ctx.createLinearGradient(-player.r, -player.r, player.r, player.r);
    hullGrad.addColorStop(0, '#00e5ff');
    hullGrad.addColorStop(1, '#005b66');
    ctx.fillStyle = hullGrad;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00e5ff';
    ctx.beginPath();
    ctx.arc(0, 0, player.r, 0, Math.PI * 2);
    ctx.fill();

    // Cockpit neon viewport
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(player.r * 0.4, -player.r * 0.1, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. APPLY VOLUMETRIC DARKNESS MASK (Destination-Out method)
    // Create an offscreen buffer canvas for the mask
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = height;
    const mCtx = maskCanvas.getContext('2d');

    // Fill the mask completely black
    mCtx.fillStyle = 'rgba(0, 0, 3, 0.95)';
    mCtx.fillRect(0, 0, width, height);

    // Carve a smooth radial hole at player's light radius
    const radialGrad = mCtx.createRadialGradient(
        player.x, player.y, player.r * 0.5,
        player.x, player.y, player.lightRadius
    );
    radialGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)'); // Completely carved out
    radialGrad.addColorStop(0.3, 'rgba(0, 0, 0, 0.8)');
    radialGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.25)');
    radialGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)'); // Solid dark black

    mCtx.globalCompositeOperation = 'destination-out';
    mCtx.fillStyle = radialGrad;
    mCtx.beginPath();
    mCtx.arc(player.x, player.y, player.lightRadius, 0, Math.PI * 2);
    mCtx.fill();

    // Draw the black mask with the hole back onto the main screen
    ctx.drawImage(maskCanvas, 0, 0);

    // 4. Draw light beam halo outline on top to blend smoothly
    const haloGrad = ctx.createRadialGradient(
        player.x, player.y, player.r,
        player.x, player.y, player.lightRadius
    );
    haloGrad.addColorStop(0, 'rgba(0, 229, 255, 0.1)');
    haloGrad.addColorStop(0.6, 'rgba(0, 229, 255, 0.03)');
    haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.lightRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// Main game iteration loop
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// Start sequence
function init() {
    resize();
    setupEvents();
    requestAnimationFrame(loop);
}

window.addEventListener('DOMContentLoaded', init);
