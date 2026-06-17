/**
 * Aetheria: The Sky Fragment - Ascension Engine (v1.2)
 * Fully Audited & Syntax-Verified
 */

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const STATES = { MENU: 'menu', PLAYING: 'playing', PAUSED: 'paused', SETTINGS: 'settings', VICTORY: 'victory' };
let currentState = STATES.MENU;

let width, height;
let currentLevel = parseInt(localStorage.getItem('aetheria_level')) || 1;
let hasAscended = localStorage.getItem('aetheria_ascended') === 'true';
let shardsCollected = 0;
let totalShardsInLevel = 5;
let isTransitioning = false;
let gameSpeed = 1.0;
let isHighContrast = false;

const player = {
    x: 100, y: 100, vx: 0, vy: 0, size: 10,
    trail: [], maxTrail: 40
};

const keys = {};
const particles = [];
const fragments = [];
const islands = [];
const winds = [];

const getUI = (id) => document.getElementById(id);

const audio = {
    ctx: null, master: null,
    init() {
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.master = this.ctx.createGain();
            this.master.connect(this.ctx.destination);
            this.master.gain.value = 0.3;
            this.startAmbience();
        } catch(e) { console.error("Audio failed", e); }
    },
    startAmbience() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle'; osc.frequency.value = 55;
        const gain = this.ctx.createGain(); gain.gain.value = 0.1;
        osc.connect(gain); gain.connect(this.master);
        osc.start();
    },
    playChime() {
        if (!this.ctx || this.master.gain.value === 0) return;
        const notes = [261.63, 329.63, 392.00, 523.25];
        const freq = notes[Math.floor(Math.random()*notes.length)];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1.2);
        osc.connect(gain); gain.connect(this.master);
        osc.start(); osc.stop(this.ctx.currentTime + 1.2);
    },
    playWhoosh() {
        if (!this.ctx || this.master.gain.value === 0) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);
        osc.connect(gain); gain.connect(this.master);
        osc.start(); osc.stop(this.ctx.currentTime + 0.2);
    },
    toggleMute() {
        if (!this.master) return;
        if (this.master.gain.value > 0) { this.prevVol = this.master.gain.value; this.master.gain.value = 0; }
        else { this.master.gain.value = this.prevVol || 0.3; }
    }
};

function init() {
    resize(true);
    createParticles();
    setupEvents();
    requestAnimationFrame(update);
}

function setupEvents() {
    window.onkeydown = (e) => { 
        const k = e.key.toLowerCase(); keys[k] = true;
        if (k === 'escape' || k === 'p') togglePause();
        if (k === 'r' && currentState === STATES.PLAYING) generateLevel();
        if (k === 'm') audio.toggleMute();
    };
    window.onkeyup = (e) => keys[e.key.toLowerCase()] = false;
    window.onresize = () => resize(false);
    window.onblur = () => { for (let k in keys) keys[k] = false; };

    canvas.onmousedown = canvas.ontouchstart = (e) => {
        if (currentState !== STATES.PLAYING) return;
        if (audio.ctx && audio.ctx.state === 'suspended') audio.ctx.resume();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches ? e.touches[0] : e;
        const tx = touch.clientX - rect.left;
        const ty = touch.clientY - rect.top;
        const dx = tx - player.x;
        const dy = ty - player.y;
        const dist = Math.hypot(dx, dy);
        player.vx += (dx / dist) * 2.5;
        player.vy += (dy / dist) * 2.5;
        audio.playWhoosh();
    };

    getUI('start-btn').onclick = () => { audio.init(); startGame(); };
    getUI('resume-btn').onclick = () => { if(audio.ctx) audio.ctx.resume(); togglePause(); };
    getUI('pause-trigger').onclick = () => { if(audio.ctx) audio.ctx.resume(); togglePause(); };
    getUI('restart-btn').onclick = () => { togglePause(); generateLevel(); };
    getUI('accessibility-toggle').onclick = openSettings;
    getUI('close-settings').onclick = closeSettings;
    getUI('rebirth-btn').onclick = rebirth;

    getUI('contrast-toggle').onchange = (e) => {
        isHighContrast = e.target.checked;
        document.body.classList.toggle('high-contrast', isHighContrast);
    };
    getUI('speed-slider').oninput = (e) => gameSpeed = parseFloat(e.target.value);
    getUI('volume-slider').oninput = (e) => { if(audio.master) audio.master.gain.value = e.target.value; };

    // Developer Backdoors
    window.skipToLevel = (n) => {
        currentLevel = n;
        generateLevel();
        console.log(`Skipped to Level ${n}`);
    };

    window.resetSave = () => {
        localStorage.clear();
        location.reload();
    };
}

function rebirth() {
    localStorage.setItem('aetheria_ascended', 'true');
    hasAscended = true;
    currentLevel = 1;
    localStorage.setItem('aetheria_level', 1);
    getUI('victory-screen').classList.add('hidden');
    startGame();
}

function startGame() {
    currentState = STATES.PLAYING;
    getUI('main-menu').classList.add('hidden');
    getUI('game-hud').classList.remove('hidden');
    getUI('instructions').classList.remove('hidden');
    generateLevel();
}

function togglePause() {
    if (currentState === STATES.MENU || currentState === STATES.VICTORY) return;
    currentState = (currentState === STATES.PAUSED) ? STATES.PLAYING : STATES.PAUSED;
    getUI('pause-menu').classList.toggle('hidden', currentState !== STATES.PAUSED);
}

function openSettings() { getUI('settings-menu').classList.remove('hidden'); }
function closeSettings() { getUI('settings-menu').classList.add('hidden'); }

function isPathClear(x1, y1, x2, y2) {
    for (const isl of islands) {
        const hw = isl.w / 2; const hh = isl.h / 2;
        const l = isl.x - hw; const r = isl.x + hw;
        const t = isl.y - hh; const b = isl.y + hh;
        if (lineIntersectsRect(x1, y1, x2, y2, l, t, r, b)) return false;
    }
    return true;
}

function lineIntersectsRect(x1, y1, x2, y2, l, t, r, b) {
    if (x1 < l && x2 < l) return false;
    if (x1 > r && x2 > r) return false;
    if (y1 < t && y2 < t) return false;
    if (y1 > b && y2 > b) return false;
    const minX = Math.min(x1, x2); const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2); const maxY = Math.max(y1, y2);
    if (maxX < l || minX > r || maxY < t || minY > b) return false;
    if (((y1 < t && y2 > b) || (y1 > b && y2 < t)) && (minX < r && maxX > l)) return true;
    return false;
}

function resize(gen = false) {
    const dpr = window.devicePixelRatio || 1;
    const container = document.getElementById('game-container');
    width = container.clientWidth; 
    height = container.clientHeight;
    
    canvas.width = width * dpr; 
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    
    ctx.scale(dpr, dpr);
    if (gen) generateLevel();
}

function generateLevel() {
    fragments.length = 0; islands.length = 0; winds.length = 0; shardsCollected = 0;
    totalShardsInLevel = (currentState === STATES.MENU) ? 3 : 3 + Math.floor(currentLevel / 3);
    
    if (currentState !== STATES.MENU) localStorage.setItem('aetheria_level', currentLevel);
    
    getUI('level').innerText = currentLevel;
    getUI('total').innerText = totalShardsInLevel;
    getUI('count').innerText = 0;

    const hue = hasAscended ? 45 : 200 + (currentLevel * 5) % 100;
    document.querySelector('.sky-gradient').style.background = `linear-gradient(to bottom, hsl(${hue}, 60%, 80%), hsl(${hue+20}, 60%, 90%))`;

    const count = 7 + Math.min(currentLevel, 10);
    for (let i = 0; i < count; i++) {
        let type = 'static';
        if (currentLevel > 4 && Math.random() > 0.8) type = 'crumble';
        if (currentLevel > 8 && Math.random() > 0.8) type = 'move';
        
        if (currentLevel > 3) {
            const ww = 350, wh = 350;
            const wx = Math.random() * (width - ww), wy = Math.random() * (height - wh);
            const wfx = (Math.random() - 0.5) * 0.15;
            const wp = []; for(let j=0; j<12; j++) wp.push({x: Math.random()*ww, y: Math.random()*wh});
            winds.push({x: wx, y: wy, w: ww, h: wh, fx: wfx, p: wp});
        }

        islands.push({
            x: 100 + Math.random() * (width - 200),
            y: 100 + Math.random() * (height - 200),
            w: 120 + Math.random() * 80, h: 25,
            color: `hsla(${hue}, 60%, 85%, 0.9)`,
            type, ct: 0, ic: false, startX: 0, range: 100, spd: 0.5 + (currentLevel * 0.05)
        });
        islands[i].startX = islands[i].x;
    }

    for (let i = 0; i < totalShardsInLevel; i++) {
        const isl = islands[Math.floor(Math.random() * islands.length)];
        fragments.push({ x: isl.x, y: isl.y - 60, size: 8, collected: false, a: Math.random() * 6 });
    }
    player.x = islands[0].x; player.y = islands[0].y - 60;
    player.vx = player.vy = 0; player.trail = [];
}

function createParticles() {
    for (let i = 0; i < 60; i++) {
        particles.push({ x: Math.random()*width, y: Math.random()*height, s: Math.random()*2, sp: Math.random()*0.2+0.05, o: Math.random()*0.4 });
    }
}

function handleInput() {
    if (isTransitioning || currentState === STATES.VICTORY) return;
    if (currentState === STATES.MENU) {
        const t = fragments.find(f => !f.collected);
        if (t) {
            const dx = t.x - player.x, dy = (t.y + Math.sin(t.a)*10) - player.y, d = Math.hypot(dx, dy);
            player.vx += (dx/d)*0.3; player.vy += (dy/d)*0.3; player.vy -= 0.1;
        }
    } else if (currentState === STATES.PLAYING) {
        const acc = 0.45 * gameSpeed, grav = 0.12 * gameSpeed;
        if (keys.arrowup || keys.w) player.vy -= acc;
        if (keys.arrowdown || keys.s) player.vy += acc;
        if (keys.arrowleft || keys.a) player.vx -= acc;
        if (keys.arrowright || keys.d) player.vx += acc;
        player.vy += grav; if (keys[' ']) player.vy -= grav * 3;
        winds.forEach(w => {
            if (player.x > w.x && player.x < w.x + w.w && player.y > w.y && player.y < w.y + w.h) {
                let windForce = w.fx;
                // Damping pocket near islands
                const nearIsland = islands.some(isl => Math.hypot(player.x - isl.x, player.y - isl.y) < 150);
                if (nearIsland) windForce *= 0.5;
                player.vx += windForce;
            }
        });
    }

    if (currentState !== STATES.PAUSED && currentState !== STATES.VICTORY && !isTransitioning) {
        player.vx *= 0.96; player.vy *= 0.96;
        player.x += player.vx; player.y += player.vy;
        player.trail.push({x: player.x, y: player.y});
        if (player.trail.length > player.maxTrail) player.trail.shift();

        for (let i = 0; i < islands.length; i++) {
            const isl = islands[i];
            const prevX = isl.x;
            if (isl.type === 'move') isl.x = isl.startX + Math.sin(Date.now()*0.001*isl.spd) * isl.range;
            const dx_island = isl.x - prevX;
            if (isl.ic) { isl.ct += 0.016*gameSpeed; if (isl.ct > 1) islands.splice(i, 1); }
            const hw = isl.w/2, hh = isl.h/2;
            if (player.x+player.size > isl.x-hw && player.x-player.size < isl.x+hw && player.y+player.size > isl.y-hh && player.y-player.size < isl.y+hh) {
                const dx = player.x-isl.x, dy = player.y-isl.y;
                if (Math.abs(dx/isl.w) > Math.abs(dy/isl.h)) { player.x = isl.x+(dx>0?hw+player.size:-hw-player.size); player.vx *= -0.3; }
                else { 
                    player.y = isl.y+(dy>0?hh+player.size:-hh-player.size); 
                    if (dy < 0) { player.vy *= -0.1; player.x += dx_island; if (isl.type === 'crumble') isl.ic = true; } 
                    else player.vy *= -0.3; 
                }
            }
        }
        if (player.x < player.size || player.x > width-player.size) player.vx *= -0.5;
        if (player.y < player.size) player.vy *= -0.5;
        if (player.y > height+200) generateLevel();
    }
}

let lastTime = 0;
let accumulator = 0;
const STEP = 1/60;

function update(time = 0) {
    let dt = (time - lastTime) / 1000;
    if (dt > 0.25) dt = 0.25; // Prevent physics spiral of death on tab minimize
    lastTime = time;
    accumulator += dt;
    
    // Decouple physics/draw step from monitor refresh rate to fix 144Hz bugs
    while(accumulator >= STEP) {
        if (currentState === STATES.PLAYING) handleInput();
        draw(); 
        accumulator -= STEP;
    }
    requestAnimationFrame(update); 
}

function draw() {
    ctx.clearRect(0,0,width,height);
    winds.forEach(w => {
        ctx.strokeStyle = `rgba(255, 255, 255, 0.2)`; ctx.lineWidth = 1.5;
        w.p.forEach(p => {
            p.x += w.fx * 40; if (p.x < 0) p.x = w.w; if (p.x > w.w) p.x = 0;
            ctx.beginPath(); ctx.moveTo(w.x + p.x, w.y + p.y); ctx.lineTo(w.x + p.x + w.fx * 150, w.y + p.y); ctx.stroke();
        });
    });
    particles.forEach(p => { 
        p.y -= p.sp; if (p.y < -10) p.y = height+10;
        ctx.fillStyle = isHighContrast ? '#444' : `rgba(255,255,255,${p.o})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 6.28); ctx.fill();
    });
    islands.forEach(isl => {
        ctx.fillStyle = isHighContrast ? '#00ffff' : (isl.ic ? `rgba(255,100,100,${1-isl.ct})` : isl.color);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2;
        const x = isl.x-isl.w/2, y = isl.y-isl.h/2, w = isl.w, h = isl.h, r = 10;
        ctx.beginPath(); ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r); ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h); ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r); ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y); ctx.closePath();
        ctx.fill(); ctx.stroke();
    });
    fragments.forEach(f => {
        if (!f.collected) {
            f.a += 0.05; const fl = Math.sin(f.a)*10;
            const dist = Math.hypot(player.x-f.x, player.y-(f.y+fl));
            const clearPath = isPathClear(player.x, player.y, f.x, f.y+fl);
            if (dist < 80 && currentState === STATES.PLAYING && clearPath) { f.x += (player.x - f.x) * 0.15; f.y += (player.y - (f.y+fl)) * 0.15; }
            ctx.shadowBlur = 15; ctx.shadowColor = hasAscended ? '#ffd700' : '#fff';
            ctx.fillStyle = hasAscended ? '#ffd700' : '#fff';
            ctx.beginPath(); ctx.moveTo(f.x, f.y+fl-f.size); ctx.lineTo(f.x+f.size, f.y+fl); ctx.lineTo(f.x, f.y+fl+f.size); ctx.lineTo(f.x-f.size, f.y+fl); ctx.closePath(); ctx.fill();
            ctx.shadowBlur = 0;
            if (dist < player.size+f.size && clearPath) { f.collected = true; shardsCollected++; getUI('count').innerText = shardsCollected; audio.playChime(); if (shardsCollected >= totalShardsInLevel) levelComplete(); }
        }
    });
    if (player.trail.length > 2) {
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        for(let i=1; i < player.trail.length; i++) {
            const p1 = player.trail[i-1], p2 = player.trail[i], ratio = i / player.trail.length;
            const organicWidth = Math.pow(ratio, 1.5) * (player.size * 1.8);
            ctx.beginPath(); 
            ctx.strokeStyle = hasAscended ? `rgba(255, 215, 0, ${ratio * 0.5})` : `rgba(255, 255, 255, ${ratio * 0.4})`; 
            ctx.lineWidth = organicWidth; ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
        }
    }
    ctx.shadowBlur = 20; ctx.shadowColor = hasAscended ? '#ffd700' : '#fff'; 
    ctx.fillStyle = hasAscended ? '#ffd700' : '#fff';
    ctx.beginPath(); ctx.arc(player.x, player.y, player.size, 0, 6.28); ctx.fill(); ctx.shadowBlur = 0;
}

function levelComplete() {
    if (isTransitioning) return;
    if (currentState === STATES.MENU) { generateLevel(); return; }
    
    // PERSISTENCE: Save drift record for the Hub
    const topDrift = parseInt(localStorage.getItem('aetheria_drift_record') || '0');
    if (currentLevel > topDrift) localStorage.setItem('aetheria_drift_record', currentLevel);

    // Check for Victory (Level 100)
    if (currentLevel >= 100) {
        currentState = STATES.VICTORY;
        getUI('victory-screen').classList.remove('hidden');
        return;
    }

    isTransitioning = true;
    getUI('overlay').classList.remove('hidden');
    
    // Increment level immediately to prevent accidental resets to old level
    currentLevel++; 

    setTimeout(() => {
        const fade = getUI('fade-screen'); 
        if (fade) { 
            fade.classList.remove('hidden'); 
            fade.style.opacity = 1; 
        }
        setTimeout(() => {
            generateLevel();
            getUI('overlay').classList.add('hidden');
            if (fade) { 
                fade.style.opacity = 0; 
                setTimeout(() => fade.classList.add('hidden'), 500); 
            }
            isTransitioning = false;
        }, 600);
    }, 1500);
}

init();
