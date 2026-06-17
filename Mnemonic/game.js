/**
 * Mnemonic: The Digital Ghost - Logic Infiltration Engine
 * Cyberpunk logic routing game. Caches DOM references and optimizes loops.
 */

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const STATES = { MENU: 'menu', PLAYING: 'playing', PAUSED: 'paused', GAMEOVER: 'gameover', COMPLETE: 'complete' };
let currentState = STATES.MENU;

let width = window.innerWidth;
let height = window.innerHeight;
let score = 0;
let steps = 0;
let firewall = 0; // percentage: 0 to 100
let gridCols = 4;
let gridRows = 4;
let cellSize = 80;
let gridOffsetX = 0;
let gridOffsetY = 0;

// Grid Nodes array
let grid = [];
let sourceNodes = [];
let mainframeNode = null;
let dataPulses = [];

// Direction offsets: 0 = Up, 1 = Right, 2 = Down, 3 = Left
const DIRS = [
    { x: 0, y: -1 }, // Up
    { x: 1, y: 0 },  // Right
    { x: 0, y: 1 },  // Down
    { x: -1, y: 0 }  // Left
];

const COLORS = {
    bg: '#020205',
    grid: 'rgba(0, 242, 255, 0.05)',
    wireInactive: 'rgba(255, 255, 255, 0.1)',
    wireActive: '#39ff14',
    wirePowered: '#00f2ff',
    gateBg: 'rgba(10, 10, 25, 0.8)',
    gateBorder: 'rgba(0, 242, 255, 0.3)',
    gateBorderActive: '#00f2ff',
    text: '#ffffff',
    source: '#39ff14',
    mainframe: '#ff0055',
    mainframeActive: '#00f2ff'
};

// Audio Engine (Web Audio Synth)
const AudioEngine = {
    ctx: null,
    init() {
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) { console.warn("Web Audio API not supported", e); }
    },
    playClick() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    },
    playSuccess() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        for (let i = 0; i < notes.length; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(notes[i], now + i * 0.08);
            gain.gain.setValueAtTime(0.1, now + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.3);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + i * 0.08);
            osc.stop(now + i * 0.08 + 0.3);
        }
    },
    playFailure() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(60, this.ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
    }
};

// UI Cache Matrix
const UI = {
    startScreen: null,
    pauseScreen: null,
    gameOverScreen: null,
    hud: null,
    overlay: null,
    overlayText: null,
    overlaySubtext: null,
    score: null,
    statusText: null,
    firewallText: null,
    firewallFill: null,
    finalScore: null,
    startBtn: null,
    resumeBtn: null,
    restartBtn: null,
    cacheRefs() {
        this.startScreen = document.getElementById('main-menu');
        this.pauseScreen = document.getElementById('pause-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.hud = document.getElementById('hud');
        this.overlay = document.getElementById('overlay');
        this.overlayText = document.getElementById('overlay-text');
        this.overlaySubtext = document.getElementById('overlay-subtext');
        this.score = document.getElementById('score');
        this.statusText = document.getElementById('status-text');
        this.firewallText = document.getElementById('firewall-text');
        this.firewallFill = document.getElementById('firewall-fill');
        this.finalScore = document.getElementById('final-score');
        this.startBtn = document.getElementById('start-btn');
        this.resumeBtn = document.getElementById('resume-btn');
        this.restartBtn = document.getElementById('restart-btn');
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
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            togglePause();
        }
    });

    canvas.addEventListener('click', handleCanvasClick);

    if (UI.startBtn) {
        UI.startBtn.onclick = () => {
            AudioEngine.init();
            startGame();
        };
    }
    if (UI.resumeBtn) {
        UI.resumeBtn.onclick = resumeGame;
    }
    if (UI.restartBtn) {
        UI.restartBtn.onclick = () => {
            UI.gameOverScreen.classList.add('hidden');
            startGame();
        };
    }
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
    
    // Dynamically scale cell size for mobile screens
    // We want the grid width to be 95% of screen width, or max 60px per cell
    const maxGridWidth = width * 0.95;
    const maxGridHeight = height * 0.75; // Leave room for HUD
    
    const cellW = maxGridWidth / gridCols;
    const cellH = maxGridHeight / gridRows;
    
    cellSize = Math.min(60, Math.min(cellW, cellH));
    
    const gridWidth = gridCols * cellSize;
    const gridHeight = gridRows * cellSize;
    
    gridOffsetX = (width - gridWidth) / 2;
    gridOffsetY = (height - gridHeight) / 2 + (height * 0.05);
}

function startGame() {
    currentState = STATES.PLAYING;
    score = 0;
    steps = 0;
    firewall = 0;
    gridCols = 4;
    gridRows = 4;
    
    if (UI.startScreen) UI.startScreen.classList.add('hidden');
    if (UI.gameOverScreen) UI.gameOverScreen.classList.add('hidden');
    if (UI.hud) UI.hud.classList.remove('hidden');
    
    generateLevel();
}

function togglePause() {
    if (currentState === STATES.PLAYING) {
        currentState = STATES.PAUSED;
        if (UI.pauseScreen) UI.pauseScreen.classList.remove('hidden');
    } else if (currentState === STATES.PAUSED) {
        resumeGame();
    }
}

function resumeGame() {
    currentState = STATES.PLAYING;
    if (UI.pauseScreen) UI.pauseScreen.classList.add('hidden');
}

function gameOver() {
    currentState = STATES.GAMEOVER;
    AudioEngine.playFailure();
    const currentHighScore = parseInt(localStorage.getItem('mnemonic_high_score') || '0');
    if (score > currentHighScore) {
        localStorage.setItem('mnemonic_high_score', score);
    }
    if (UI.gameOverScreen) if(window.showToast) window.showToast('SYSTEM_LOCKOUT', 'red');
    if (UI.finalScore) UI.finalScore.innerText = score.toString().padStart(2, '0');
    if (UI.hud) UI.hud.classList.add('hidden');
}

// Generate procedurally solvable network puzzle
function generateLevel() {
    recalculateGridSpacing();
    grid = [];
    sourceNodes = [];
    dataPulses = [];
    mainframeNode = null;

    // Allocate grid array
    for (let r = 0; r < gridRows; r++) {
        grid[r] = [];
        for (let c = 0; c < gridCols; c++) {
            grid[r][c] = {
                type: 'empty',
                r: r, c: c,
                rotations: 0,
                visualAngleOffset: 0,
                connections: [false, false, false, false], // Up, Right, Down, Left
                inputs: [false, false, false, false],
                outputs: [false, false, false, false],
                gateType: null, // 'AND', 'OR', 'NOT', 'XOR'
                active: false,
                signalValue: 0
            };
        }
    }

    // Place source nodes on the left edge
    const sourceR1 = Math.floor(gridRows / 3);
    const sourceR2 = Math.floor(gridRows * 2 / 3);
    
    sourceNodes.push(grid[sourceR1][0]);
    grid[sourceR1][0].type = 'source';
    grid[sourceR1][0].connections = [false, true, false, false];
    grid[sourceR1][0].active = true;
    grid[sourceR1][0].signalValue = 1;

    // Place Mainframe on the right edge
    const mainframeR = Math.floor(gridRows / 2);
    mainframeNode = grid[mainframeR][gridCols - 1];
    mainframeNode.type = 'mainframe';
    mainframeNode.connections = [false, false, false, true];

    function applyNotGatesToPath(coords, targetOutput) {
        const candidates = [];
        for (let i = 1; i < coords.length - 1; i++) {
            const cell = grid[coords[i].r][coords[i].c];
            if (cell.type === 'wire') candidates.push(cell);
        }
        
        let count = 0;
        if (targetOutput === 1) {
            count = (Math.random() < 0.5 && candidates.length >= 2) ? 2 : 0;
        } else {
            count = (candidates.length >= 1) ? 1 : 0;
        }
        
        for (let i = candidates.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }
        
        for (let i = 0; i < count && i < candidates.length; i++) {
            const cell = candidates[i];
            cell.type = 'gate';
            cell.gateType = 'NOT';
            cell.inputs = [false, false, false, false];
            cell.outputs = [false, false, false, false];
            
            let pathIndex = -1;
            for (let k = 1; k < coords.length - 1; k++) {
                if (coords[k].r === cell.r && coords[k].c === cell.c) {
                    pathIndex = k;
                    break;
                }
            }
            
            if (pathIndex !== -1) {
                const prev = coords[pathIndex - 1];
                const next = coords[pathIndex + 1];
                
                let inDir = -1;
                if (prev.r < cell.r) inDir = 0;
                else if (prev.r > cell.r) inDir = 2;
                else if (prev.c < cell.c) inDir = 3;
                else if (prev.c > cell.c) inDir = 1;
                
                let outDir = -1;
                if (next.r < cell.r) outDir = 0;
                else if (next.r > cell.r) outDir = 2;
                else if (next.c < cell.c) outDir = 3;
                else if (next.c > cell.c) outDir = 1;
                
                if (inDir !== -1 && outDir !== -1) {
                    cell.inputs[inDir] = true;
                    cell.outputs[outDir] = true;
                }
            }
        }
    }

    if (gridRows > 4) {
        // 2-Source Mode: Place second source
        sourceNodes.push(grid[sourceR2][0]);
        grid[sourceR2][0].type = 'source';
        grid[sourceR2][0].connections = [false, true, false, false];
        grid[sourceR2][0].active = true;
        grid[sourceR2][0].signalValue = 1;

        // Setup Gate merge point
        const mergeC = Math.floor(gridCols / 2);
        const mergeR = Math.floor(gridRows / 2);

        const gateCell = grid[mergeR][mergeC];
        gateCell.type = 'gate';
        const gatesPool = ['AND', 'OR', 'XOR'];
        gateCell.gateType = gatesPool[Math.floor(Math.random() * gatesPool.length)];
        
        let sig1 = 1, sig2 = 1;
        if (gateCell.gateType === 'AND') {
            sig1 = 1; sig2 = 1;
        } else if (gateCell.gateType === 'OR') {
            const combos = [[1, 1], [1, 0], [0, 1]];
            const choice = combos[Math.floor(Math.random() * combos.length)];
            sig1 = choice[0]; sig2 = choice[1];
        } else if (gateCell.gateType === 'XOR') {
            const combos = [[1, 0], [0, 1]];
            const choice = combos[Math.floor(Math.random() * combos.length)];
            sig1 = choice[0]; sig2 = choice[1];
        }
        
        gateCell.connections = [true, true, true, false]; // Up, Right, Down
        gateCell.inputs = [true, false, true, false]; // Up, Down inputs
        gateCell.outputs = [false, true, false, false]; // Right output

        // Choose turn columns randomly
        const turnC1 = 1 + Math.floor(Math.random() * (mergeC - 1));
        const turnC2 = 1 + Math.floor(Math.random() * (mergeC - 1));

        // Generate Path 1 (Top half)
        const path1 = [];
        for (let c = 0; c <= turnC1; c++) path1.push({ r: sourceR1, c: c });
        const step1 = Math.sign((mergeR - 1) - sourceR1);
        if (step1 !== 0) {
            let tempR = sourceR1 + step1;
            while (tempR !== (mergeR - 1) + step1) {
                path1.push({ r: tempR, c: turnC1 });
                tempR += step1;
            }
        }
        for (let c = turnC1 + 1; c <= mergeC; c++) path1.push({ r: mergeR - 1, c: c });

        // Generate Path 2 (Bottom half)
        const path2 = [];
        for (let c = 0; c <= turnC2; c++) path2.push({ r: sourceR2, c: c });
        const step2 = Math.sign((mergeR + 1) - sourceR2);
        if (step2 !== 0) {
            let tempR = sourceR2 + step2;
            while (tempR !== (mergeR + 1) + step2) {
                path2.push({ r: tempR, c: turnC2 });
                tempR += step2;
            }
        }
        for (let c = turnC2 + 1; c <= mergeC; c++) path2.push({ r: mergeR + 1, c: c });

        // Apply path connections
        applyPath(path1);
        applyPath(path2);

        // Manually connect last wire cell of Path 1 & Path 2 to the merge gate
        grid[mergeR - 1][mergeC].connections[2] = true; // Down to gate
        grid[mergeR + 1][mergeC].connections[0] = true; // Up to gate
        
        applyNotGatesToPath(path1, sig1);
        applyNotGatesToPath(path2, sig2);

        // Path 3 (Gate to Mainframe - straight horizontal line)
        const path3 = [];
        for (let c = mergeC + 1; c < gridCols - 1; c++) {
            const cell = grid[mergeR][c];
            cell.type = 'wire';
            cell.connections = [false, true, false, true]; // Left, Right
            path3.push({ r: mergeR, c: c });
        }
        applyNotGatesToPath(path3, 1);
        
    } else {
        // 1-Source Mode: Single Path
        const turnC = 1 + Math.floor(Math.random() * (gridCols - 2));
        const path = [];
        for (let c = 0; c <= turnC; c++) path.push({ r: sourceR1, c: c });
        const step = Math.sign(mainframeR - sourceR1);
        if (step !== 0) {
            let tempR = sourceR1 + step;
            while (tempR !== mainframeR + step) {
                path.push({ r: tempR, c: turnC });
                tempR += step;
            }
        }
        for (let c = turnC + 1; c < gridCols; c++) path.push({ r: mainframeR, c: c });

        applyPath(path);
        applyNotGatesToPath(path, 1);
    }

    // Fill remaining cells with dummy elements to distract/provide noise
    for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
            const cell = grid[r][c];
            if (cell.type === 'empty') {
                const rand = Math.random();
                if (rand < 0.5) {
                    cell.type = 'wire';
                    if (Math.random() < 0.5) {
                        cell.connections = [true, false, true, false]; // Straight vertical
                    } else {
                        cell.connections = [true, true, false, false]; // L-elbow
                    }
                }
            }
        }
    }

    // Scramble the rotations of all non-source/non-mainframe elements
    for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
            const cell = grid[r][c];
            if (cell.type !== 'source' && cell.type !== 'mainframe' && cell.type !== 'empty') {
                const rotateTimes = Math.floor(Math.random() * 4);
                for (let k = 0; k < rotateTimes; k++) {
                    rotateCellClockwise(cell, true);
                }
            }
        }
    }

    evaluateCircuit();
    updateHUD();
}

function applyPath(coords) {
    for (let i = 0; i < coords.length; i++) {
        const curr = coords[i];
        const cell = grid[curr.r][curr.c];
        
        if (cell.type === 'source' || cell.type === 'mainframe' || cell.type === 'gate') {
            continue;
        }
        
        cell.type = 'wire';
        cell.connections = [false, false, false, false];
        
        if (i > 0) {
            const prev = coords[i - 1];
            if (prev.r < curr.r) cell.connections[0] = true; // Up
            else if (prev.c > curr.c) cell.connections[1] = true; // Right
            else if (prev.r > curr.r) cell.connections[2] = true; // Down
            else if (prev.c < curr.c) cell.connections[3] = true; // Left
        }
        
        if (i < coords.length - 1) {
            const next = coords[i + 1];
            if (next.r < curr.r) cell.connections[0] = true;
            else if (next.c > curr.c) cell.connections[1] = true;
            else if (next.r > curr.r) cell.connections[2] = true;
            else if (next.c < curr.c) cell.connections[3] = true;
        }
    }
}

function rotateCellClockwise(cell, silent = false) {
    if (cell.type === 'source' || cell.type === 'mainframe' || cell.type === 'empty') return;
    
    // Shift connections array right: [Up, Right, Down, Left] -> [Left, Up, Right, Down]
    const tempConn = [...cell.connections];
    const tempIn = [...cell.inputs];
    const tempOut = [...cell.outputs];

    for (let i = 0; i < 4; i++) {
        cell.connections[(i + 1) % 4] = tempConn[i];
        cell.inputs[(i + 1) % 4] = tempIn[i];
        cell.outputs[(i + 1) % 4] = tempOut[i];
    }
    
    cell.rotations = (cell.rotations + 1) % 4;
    
    if (!silent) {
        cell.visualAngleOffset = -Math.PI / 2; // Trigger rotation animation
        steps++;
        // Firewall raises faster in later sectors
        // DISABLED: firewall = Math.min(100, firewall + (3 + Math.floor(score / 2)));
        AudioEngine.playClick();
        evaluateCircuit();
        updateHUD();
        
        if (firewall >= 100 && currentState === STATES.PLAYING) {
            gameOver();
        }
    }
}

// Evaluate signal routing across grid using Breadth-First-Search logic
function evaluateCircuit() {
    // Reset all status
    for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
            if (grid[r][c].type !== 'source') {
                grid[r][c].active = false;
                grid[r][c].signalValue = 0;
                grid[r][c].flowFrom = null;
            }
        }
    }

    const queue = [];
    
    // Enqueue all active source nodes
    for (let i = 0; i < sourceNodes.length; i++) {
        queue.push(sourceNodes[i]);
    }

    let iterations = 0;
    const maxIterations = 200; // Loop guard

    while (queue.length > 0 && iterations++ < maxIterations) {
        const curr = queue.shift();
        
        // Scan all 4 output directions
        for (let d = 0; d < 4; d++) {
            if (!curr.connections[d]) continue; // No conduit output on this side
            
            // If it's a logic gate, it only outputs through designated output sides
            if (curr.type === 'gate' && !curr.outputs[d]) continue;

            const offset = DIRS[d];
            const nextR = curr.r + offset.y;
            const nextC = curr.c + offset.x;

            // Boundary Check
            if (nextR < 0 || nextR >= gridRows || nextC < 0 || nextC >= gridCols) continue;

            const neighbor = grid[nextR][nextC];
            const oppositeDir = (d + 2) % 4; // Inverse connector direction

            // Verify physical wire alignment
            if (neighbor.type === 'gate') {
                // Must enter the logic gate through a designated input port
                if (!neighbor.inputs[oppositeDir]) continue;
            } else {
                if (!neighbor.connections[oppositeDir]) continue;
            }

            // Determine if signal flows or logical gate satisfies rules
            let passedSignal = curr.signalValue;

            if (neighbor.type === 'wire') {
                if (!neighbor.active || neighbor.signalValue === 0) {
                    neighbor.active = true;
                    neighbor.signalValue = passedSignal;
                    neighbor.flowFrom = oppositeDir;
                    queue.push(neighbor);
                }
            } else if (neighbor.type === 'gate') {
                // Calculate state of inputs on logic gate
                let updated = false;
                
                // NOT logic
                if (neighbor.gateType === 'NOT') {
                    const invertedSignal = passedSignal === 1 ? 0 : 1;
                    if (!neighbor.active || neighbor.signalValue !== invertedSignal) {
                        neighbor.active = true;
                        neighbor.signalValue = invertedSignal;
                        updated = true;
                    }
                } 
                // AND / OR / XOR Logic
                else {
                    // Gather all incoming signals pointing to inputs of the gate
                    let input1Val = 1; // Default to 1 (pull-up) if unconnected
                    let input2Val = 1; // Default to 1 (pull-up) if unconnected
                    let input1Connected = false;
                    let input2Connected = false;
                    let inputIndex = 0;

                    // Search neighbors for inputs
                    for (let nDir = 0; nDir < 4; nDir++) {
                        if (neighbor.inputs[nDir]) {
                            const nOffset = DIRS[nDir];
                            const nR = neighbor.r + nOffset.y;
                            const nC = neighbor.c + nOffset.x;
                            
                            let hasPhysicalConnection = false;
                            let activeVal = 0;
                            
                            if (nR >= 0 && nR < gridRows && nC >= 0 && nC < gridCols) {
                                const nCell = grid[nR][nC];
                                const nOpposite = (nDir + 2) % 4;
                                
                                // Verify neighboring cell physically outputs to this gate's input
                                let connectsToUs = false;
                                if (nCell.type === 'gate') {
                                    connectsToUs = nCell.outputs[nOpposite];
                                } else {
                                    connectsToUs = nCell.connections[nOpposite];
                                }
                                
                                if (connectsToUs) {
                                    hasPhysicalConnection = true;
                                    if (nCell.active) {
                                        activeVal = nCell.signalValue;
                                    }
                                }
                            }
                            
                            if (inputIndex === 0) {
                                if (hasPhysicalConnection) {
                                    input1Val = activeVal;
                                    input1Connected = true;
                                }
                            } else {
                                if (hasPhysicalConnection) {
                                    input2Val = activeVal;
                                    input2Connected = true;
                                }
                            }
                            inputIndex++;
                        }
                    }

                    // For OR and XOR gates, unconnected inputs should act as 0 (pulled low)
                    if (neighbor.gateType === 'OR' || neighbor.gateType === 'XOR') {
                        if (!input1Connected) input1Val = 0;
                        if (!input2Connected) input2Val = 0;
                    }

                    let resultingSignal = 0;
                    if (neighbor.gateType === 'AND') {
                        resultingSignal = (input1Val === 1 && input2Val === 1) ? 1 : 0;
                    } else if (neighbor.gateType === 'OR') {
                        resultingSignal = (input1Val === 1 || input2Val === 1) ? 1 : 0;
                    } else if (neighbor.gateType === 'XOR') {
                        resultingSignal = (input1Val !== input2Val) ? 1 : 0;
                    }

                    if (!neighbor.active || neighbor.signalValue !== resultingSignal) {
                        neighbor.active = true;
                        neighbor.signalValue = resultingSignal;
                        updated = true;
                    }
                }

                if (updated) {
                    queue.push(neighbor);
                }
            } else if (neighbor.type === 'mainframe') {
                if (passedSignal === 1) {
                    neighbor.active = true;
                    neighbor.signalValue = 1;
                    triggerVictory();
                }
            }
        }
    }
}

function triggerVictory() {
    if (currentState !== STATES.PLAYING) return;
    currentState = STATES.COMPLETE;
    AudioEngine.playSuccess();
    score++;
    
    // Spawn data flow pulses for visual payoff
    spawnVictoryPulses();

    if (UI.overlay) if(window.showToast) window.showToast(UI.overlayText.innerText, 'cyan');
    
    setTimeout(() => {
        if (UI.overlay) UI.overlay.classList.add('hidden');
        
        // Progressively scale grid difficulty
        if (score % 2 === 0) {
            gridCols = Math.min(8, gridCols + 1);
            gridRows = Math.min(8, gridRows + 1);
        }
        
        currentState = STATES.PLAYING;
        // Cool down firewall for next sector
        firewall = Math.max(0, firewall - 30);
        generateLevel();
    }, 1800);
}

function spawnVictoryPulses() {
    // Generate active animated nodes to glide across screen
    for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
            if (grid[r][c].active) {
                dataPulses.push({
                    x: gridOffsetX + c * cellSize + cellSize / 2,
                    y: gridOffsetY + r * cellSize + cellSize / 2,
                    targetX: gridOffsetX + (c + 1) * cellSize + cellSize / 2,
                    targetY: gridOffsetY + r * cellSize + cellSize / 2,
                    progress: 0,
                    speed: 0.08
                });
            }
        }
    }
}

function updateHUD() {
    if (UI.score) UI.score.innerText = score.toString().padStart(2, '0');
    const displayFirewall = Math.floor(firewall);
    if (UI.firewallText) UI.firewallText.innerText = `${displayFirewall}%`;
    if (UI.firewallFill) UI.firewallFill.style.width = `${displayFirewall}%`;
    
    if (UI.statusText) {
        if (firewall > 70) {
            UI.statusText.innerText = "CRITICAL TRACE";
            UI.statusText.className = "hud-value neon-red";
        } else {
            UI.statusText.innerText = "DECRYPTING...";
            UI.statusText.className = "hud-value neon-cyan";
        }
    }
}

function handleCanvasClick(e) {
    if (currentState !== STATES.PLAYING) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Check which cell is clicked
    const c = Math.floor((mx - gridOffsetX) / cellSize);
    const r = Math.floor((my - gridOffsetY) / cellSize);

    if (r >= 0 && r < gridRows && c >= 0 && c < gridCols) {
        rotateCellClockwise(grid[r][c]);
    }
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

function update() {
    // Smoothly interpolate visual rotation offset for all cells
    if (grid && grid.length > 0) {
        for (let r = 0; r < gridRows; r++) {
            if (grid[r]) {
                for (let c = 0; c < gridCols; c++) {
                    const cell = grid[r][c];
                    if (cell && cell.visualAngleOffset !== undefined) {
                        cell.visualAngleOffset += (0 - cell.visualAngleOffset) * 0.15;
                    }
                }
            }
        }
    }

    if (currentState !== STATES.PLAYING) return;

    // Tick firewall progress slowly upwards over time
    // Scales based on current level (score)
    // DISABLED: firewall = Math.min(100, firewall + (0.015 * (1 + score * 0.1)));
    updateHUD();

    if (firewall >= 100) {
        gameOver();
    }

    // Animate active data pulses
    for (let i = dataPulses.length - 1; i >= 0; i--) {
        const p = dataPulses[i];
        p.progress += p.speed;
        if (p.progress >= 1) {
            dataPulses.splice(i, 1);
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, width, height);

    // Dynamic grid overlay (crosshairs instead of dots)
    ctx.strokeStyle = 'rgba(0, 242, 255, 0.15)';
    ctx.lineWidth = 1;
    for (let x = gridOffsetX % cellSize; x < width; x += cellSize) {
        for (let y = gridOffsetY % cellSize; y < height; y += cellSize) {
            ctx.beginPath();
            ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y);
            ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4);
            ctx.stroke();
        }
    }

    if (!grid || grid.length === 0 || !grid[0]) return;
    
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 2;
    ctx.strokeRect(gridOffsetX - 10, gridOffsetY - 10, gridCols * cellSize + 20, gridRows * cellSize + 20);

    // Draw grid cells (drawing logic handles rotation animations and gate drawing)
    for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
            drawCell(grid[r][c]);
        }
    }

    // Draw active data flow pulses
    for (let i = 0; i < dataPulses.length; i++) {
        const p = dataPulses[i];
        const cx = p.x + (p.targetX - p.x) * p.progress;
        const cy = p.y + (p.targetY - p.y) * p.progress;
        
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.shadowBlur = 0;
}

function drawCell(cell) {
    const cx = gridOffsetX + cell.c * cellSize + cellSize / 2;
    const cy = gridOffsetY + cell.r * cellSize + cellSize / 2;
    const half = cellSize / 2;

    ctx.save();
    ctx.translate(cx, cy);
    if (cell.visualAngleOffset) {
        ctx.rotate(cell.visualAngleOffset);
    }

    // Holographic glass tile bounds (Corner Brackets)
    ctx.fillStyle = 'rgba(0, 242, 255, 0.03)';
    ctx.fillRect(-half + 2, -half + 2, cellSize - 4, cellSize - 4);
    
    ctx.strokeStyle = 'rgba(0, 242, 255, 0.3)';
    ctx.lineWidth = 1.5;
    const cl = 6; // Corner line length
    ctx.beginPath();
    // Top-Left
    ctx.moveTo(-half + 2, -half + 2 + cl); ctx.lineTo(-half + 2, -half + 2); ctx.lineTo(-half + 2 + cl, -half + 2);
    // Top-Right
    ctx.moveTo(half - 2 - cl, -half + 2); ctx.lineTo(half - 2, -half + 2); ctx.lineTo(half - 2, -half + 2 + cl);
    // Bottom-Right
    ctx.moveTo(half - 2, half - 2 - cl); ctx.lineTo(half - 2, half - 2); ctx.lineTo(half - 2 - cl, half - 2);
    // Bottom-Left
    ctx.moveTo(-half + 2 + cl, half - 2); ctx.lineTo(-half + 2, half - 2); ctx.lineTo(-half + 2, half - 2 - cl);
    ctx.stroke();

    // Connection paths
    ctx.lineWidth = cell.active ? 4 : 2;
    ctx.strokeStyle = cell.active ? (cell.signalValue === 1 ? COLORS.wireActive : COLORS.wirePowered) : COLORS.wireInactive;
    
    if (cell.active) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = cell.signalValue === 1 ? COLORS.wireActive : COLORS.wirePowered;
    } else {
        ctx.shadowBlur = 0;
    }

    // Draw base wire circuitry
    for (let d = 0; d < 4; d++) {
        if (cell.connections[d]) {
            const offset = DIRS[d];
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(offset.x * half, offset.y * half);
            ctx.stroke();
            
            // Draw inner wire core for un-powered active lines to make them look like cables
            if (cell.active && cell.signalValue === 0) {
                ctx.lineWidth = 1;
                ctx.strokeStyle = '#000000';
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(offset.x * half, offset.y * half);
                ctx.stroke();
            }
        }
    }
    
    // Draw Signal Flow Visualization (Electron Pulses)
    if (cell.active && cell.signalValue === 1) {
        const time = Date.now() / 1000;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'; // Bright white pulse
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 16]);
        ctx.lineDashOffset = -time * 30; // Speed of 30 pixels per second
        
        for (let d = 0; d < 4; d++) {
            if (cell.connections[d]) {
                const offset = DIRS[d];
                
                let isInput = false;
                if (cell.type === 'gate') {
                    if (cell.inputs[d]) isInput = true;
                } else if (cell.type === 'mainframe') {
                    if (cell.connections[d]) isInput = true;
                } else {
                    if (cell.flowFrom === d) isInput = true;
                }
                
                ctx.beginPath();
                if (isInput) {
                    ctx.moveTo(offset.x * half, offset.y * half);
                    ctx.lineTo(0, 0);
                } else {
                    ctx.moveTo(0, 0);
                    ctx.lineTo(offset.x * half, offset.y * half);
                }
                ctx.stroke();
            }
        }
        ctx.setLineDash([]); // Reset dash
    }
    ctx.shadowBlur = 0;

    // Draw specific component types
    if (cell.type === 'source') {
        ctx.fillStyle = COLORS.source;
        ctx.shadowBlur = 15;
        ctx.shadowColor = COLORS.source;
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
    } 
    else if (cell.type === 'mainframe') {
        ctx.fillStyle = cell.active ? COLORS.mainframeActive : COLORS.mainframe;
        ctx.shadowBlur = 15;
        ctx.shadowColor = cell.active ? COLORS.mainframeActive : COLORS.mainframe;
        
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = i * Math.PI / 4;
            const x = Math.cos(angle) * 16;
            const y = Math.sin(angle) * 16;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();
    } 
    else if (cell.type === 'gate') {
        // Chip background
        ctx.fillStyle = COLORS.gateBg;
        ctx.strokeStyle = cell.active ? COLORS.gateBorderActive : COLORS.gateBorder;
        ctx.lineWidth = 2;
        
        ctx.fillRect(-20, -14, 40, 28);
        ctx.strokeRect(-20, -14, 40, 28);

        // Gate type text (aligned in the center of the chip)
        ctx.fillStyle = cell.active ? COLORS.wireActive : COLORS.text;
        ctx.font = 'bold 9px "Fira Code", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cell.gateType, 0, 0);

        // Draw inputs as pink circular sockets, outputs as cyan arrow chevrons
        for (let d = 0; d < 4; d++) {
            const offset = DIRS[d];
            const px = offset.x * 20;
            const py = offset.y * 14;

            if (cell.inputs[d]) {
                // Pink circle for input port
                ctx.save();
                ctx.beginPath();
                ctx.arc(px, py, 5, 0, Math.PI * 2);
                ctx.fillStyle = '#100512';
                ctx.fill();
                ctx.strokeStyle = '#ff0055'; // Pink border always indicates Input
                ctx.lineWidth = 1.5;
                ctx.stroke();
                
                // If active, fill center with glowing signal color
                if (cell.active) {
                    ctx.fillStyle = cell.signalValue === 1 ? COLORS.wireActive : COLORS.wirePowered;
                    ctx.beginPath();
                    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }
            if (cell.outputs[d]) {
                // Cyan triangle for output port pointing outward
                ctx.save();
                ctx.beginPath();
                if (d === 0) { // Up
                    ctx.moveTo(px - 5, py + 2);
                    ctx.lineTo(px + 5, py + 2);
                    ctx.lineTo(px, py - 6);
                } else if (d === 1) { // Right
                    ctx.moveTo(px - 2, py - 5);
                    ctx.lineTo(px - 2, py + 5);
                    ctx.lineTo(px + 6, py);
                } else if (d === 2) { // Down
                    ctx.moveTo(px - 5, py - 2);
                    ctx.lineTo(px + 5, py - 2);
                    ctx.lineTo(px, py + 6);
                } else if (d === 3) { // Left
                    ctx.moveTo(px + 2, py - 5);
                    ctx.lineTo(px + 2, py + 5);
                    ctx.lineTo(px - 6, py);
                }
                ctx.closePath();
                ctx.fillStyle = '#051015';
                ctx.fill();
                ctx.strokeStyle = '#00f2ff'; // Cyan border always indicates Output
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // If active, fill center with glowing signal color
                if (cell.active) {
                    ctx.fillStyle = cell.signalValue === 1 ? COLORS.wireActive : COLORS.wirePowered;
                    ctx.beginPath();
                    if (d === 0) { // Up
                        ctx.moveTo(px - 2.5, py + 1);
                        ctx.lineTo(px + 2.5, py + 1);
                        ctx.lineTo(px, py - 3);
                    } else if (d === 1) { // Right
                        ctx.moveTo(px - 1, py - 2.5);
                        ctx.lineTo(px - 1, py + 2.5);
                        ctx.lineTo(px + 3, py);
                    } else if (d === 2) { // Down
                        ctx.moveTo(px - 2.5, py - 1);
                        ctx.lineTo(px + 2.5, py - 1);
                        ctx.lineTo(px, py + 3);
                    } else if (d === 3) { // Left
                        ctx.moveTo(px + 1, py - 2.5);
                        ctx.lineTo(px + 1, py + 2.5);
                        ctx.lineTo(px - 3, py);
                    }
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.restore();
            }
        }
    }
    ctx.restore();
}

window.addEventListener('DOMContentLoaded', init);
