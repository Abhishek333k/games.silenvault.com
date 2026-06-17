# Pegasus Arcade: Tactical Mission Briefings

Welcome to the **Pegasus Arcade Vault**. This document compiles the core configurations, missions, controls, and architectural logic for all active training simulators within the Pegasus ecosystem. 

---

## 🌌 1. Aetheria
* **Codename:** Zen Drift Engine
* **Aesthetic Theme:** Pastel Celestial Void
* **System Color:** Violet (`#8b5cf6`)
* **Simulacrum Icon:** `✧`

### Introduction & Lore
Enter the ascension corridor. Aetheria simulates drift kinetics across a procedurally generated, low-density field of crumbling and shifting islands floating within a crystalline sky-well.

### Tactical Mission
Drift across the unstable islands and collect the floating shards of light. Accumulate enough cosmic mass to open the rift and ascend to the next altitude layer. 

### Systems & Controls
* **[W] / [S] / [A] / [D]** or **[Arrow Keys]**: Adjust thrusters to drift in zero-G.
* **[Spacebar]**: Charge local gravity pocket to float/stabilize.
* **[R]**: Force restart level navigation.
* **[Esc]** or **[P]**: Toggle simulation pause.
* **[M]**: Toggle audio synthesis.

### Engine Mechanics
* **Procedural Level Generator**: Rebuilds floating islands dynamically with varying properties (Static, Crumbling, or Moving) based on current altitude (level).
* **Frictionless Drift Physics**: Employs momentum-decay algorithms with wind-field vectors modifying player movement direction.

---

## ▣ 2. Viper Grid
* **Codename:** Neon Strike
* **Aesthetic Theme:** Retro Cyber-Grid
* **System Color:** Cyan (`#00f2ff`)
* **Simulacrum Icon:** `▣`

### Introduction & Lore
A tactical block-breaking protocol engineered to test reflex timing and kinetic trajectory prediction. Deflect high-velocity ion beams within an unstable cybernetic grid.

### Tactical Mission
Clear the grid of light blocks. Keep the energy core in active play. Use structural angles to hit critical targets and trigger multi-ball replication.

### Systems & Controls
* **[Mouse Movement]**: Calibrate and move the deflector paddle left and right.
* **[Left Click]**: Release initial energy core from dock.
* **[Esc]** or **[P]**: Pause simulation.

### Engine Mechanics
* **Swept-Sphere Physics Solver**: A 4-step sub-frame loop resolves rapid collisions without "ball tunneling" (passing through bricks).
* **Paddle Spin / Momentum Transfer**: Translates paddle velocity (`vx`) into the ball’s deflection angle on impact for high-speed trick shots.

---

## ▲ 3. Ignis Zero
* **Codename:** Thermal Survival
* **Aesthetic Theme:** Dark Obsidian Core
* **System Color:** Orange/Red (`#ff4d00`)
* **Simulacrum Icon:** `▲`

### Introduction & Lore
You are the central engine core. Plunged into an absolute-zero obsidian void, your core energy (heat) is constantly leaking. The surrounding darkness actively consumes you.

### Tactical Mission
Survive as long as possible by absorbing escaping frost shards to feed your furnace. Avoid colliding with the freezing Obsidian Sentinels that swarm the perimeter.

### Systems & Controls
* **[Mouse Movement]**: Guide the burning core around the void.
* **[Spacebar]** or **[P]**: Pause Core systems.

### Engine Mechanics
* **Thermal Core Decay**: Continuous negative heat accumulation scales over time, requiring quick shard absorption to stave off core death.
* **Boids Swarm Separation**: Sentinels dynamically calculate repulsion vectors from one another to prevent stacking, creating a living, organic hunting swarm.

---

## ◆ 4. Shift Protocol
* **Codename:** Dimensional Stealth
* **Aesthetic Theme:** Cyberpunk Infiltration
* **System Color:** Magenta (`#ff00ff`)
* **Simulacrum Icon:** `◆`

### Introduction & Lore
The network is split between two phase layers: Alpha and Omega. Security systems exist in both layers. To navigate the database safely, you must alter your system frequency.

### Tactical Mission
Infiltrate the network, collect security nodes, and avoid patrol guards. Shift dimensions to phase through solid walls and avoid hazards in the opposite dimension.

### Systems & Controls
* **[Mouse Movement]**: Steer your infiltration node through the network grid.
* **[Spacebar]**: Shift phase frequencies between **Alpha** and **Omega**.
* **[Esc]**: Pause network link.

### Engine Mechanics
* **Dimensional Phase Masking**: Obstacles, guards, and nodes only interact with the player if their phase alignments match. 
* **Circle-to-Rectangle Projection**: Employs precise geometric distance checks to resolve collisions with security blocks.

---

## ○ 5. Orbit Terminal
* **Codename:** Gravity Slingshot
* **Aesthetic Theme:** Deep-Space Gravitational Field
* **System Color:** Gold (`#ffd700`)
* **Simulacrum Icon:** `○`

### Introduction & Lore
The shortest path is rarely a straight line in space. Plot cargo-ship trajectories around black holes, dwarf stars, and high-gravity planet clusters.

### Tactical Mission
Sling your ship through the gravitational influence of planetary bodies. Reach the target station without crashing into orbit-locking celestial spheres.

### Systems & Controls
* **[Click and Drag]**: Pull back on the ship to configure the vector trajectory launch force.
* **[Release Mouse]**: Launch vessel into deep-space flight.

### Engine Mechanics
* **Newtonian Gravitational Solver**: Dynamically updates the ship velocity relative to multiple planetary masses using the inverse-square law ($F = G \frac{m_1 m_2}{r^2}$).
* **Trajectory Trail Buffer**: Tracks and renders previous coordinate positions to help visualize the curvature of space-time.

---

## ▽ 6. Prism Shift
* **Codename:** Optic Logic
* **Aesthetic Theme:** Minimalist Optical Lab
* **System Color:** Emerald (`#10b981`)
* **Simulacrum Icon:** `▽`

### Introduction & Lore
Restore integrity to the optical processing units. High-energy beam arrays must be calibrated and focused into the primary light well to boot system sectors.

### Tactical Mission
Rotate light-bending prisms to direct the laser beam to the target well. Prevent the beam from dissipating into empty space.

### Systems & Controls
* **[Left Click on Prism]**: Rotate selected crystal by 45 degrees clockwise.
* **[Esc]**: Pause system terminal.

### Engine Mechanics
* **Recursive Ray-Caster**: Traces ray segments step-by-step from source to target, executing recursive reflections at prism intersections.
* **Vector Reflection Matrix**: Calculates the output beam path using a flat-incidence reflection equation offset by a shadow-bias to prevent calculation loops.

---

## ⚿ 7. Mnemonic
* **Codename:** Cyber Security Injector
* **Aesthetic Theme:** Cyberpunk Hack Terminal
* **System Color:** Neon Green (`#39ff14`)
* **Simulacrum Icon:** `⚿`

### Introduction & Lore
The security perimeter of the corporate database is partitioned behind a sequence of volatile binary junctions. Operate as a Digital Ghost and inject system-critical data bypasses.

### Tactical Mission
Connect inputs to outputs. Rotate active data conduits and logic gates (AND, OR, NOT, XOR) to route the high energy core pulse to the Central Mainframe before the Firewall locks you out.

### Systems & Controls
* **[Left Click on Node]**: Rotate selected logic node or wire segment by 90 degrees clockwise.
* **[Spacebar]**: Pause/resume the terminal connection.

### Engine Mechanics
* **Logic Routing Solver**: Simulates real-time Boolean state propagation from custom Source nodes, checking connector orientation rules for every node.
* **Active Data Pulse Generator**: Spawns and slides animated floating particles across valid network lanes to indicate active throughput.

---

## ⚙️ System Diagnostics
All games have been optimized to ensure low garbage collection overhead:
1. **No Layout Thrashing**: Game interfaces cache HTML DOM tree nodes into a global lookup structure on boot.
2. **Linear Processing**: Inner logic and rendering loops avoid functional helper iterators (`forEach`), deploying standard counting `for` loops to maximize CPU cache hit rates.
3. **Pre-Calculated Lookups**: Rotation-bound engines cache trigonometric states (`sin`/`cos`) and linear gradients, rather than executing expensive math operations mid-frame.
