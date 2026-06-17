# Aetheria: The "True Version" Checklist
**Project:** Pegasus Game #1  
**Target:** 100% Production Ready

## 🛠️ Phase 1: Game Architecture (The Brain)
- [ ] **Game State Manager:** Implementation of "Main Menu," "Pause," and "Game Over" states.
- [ ] **Persistent Save System:** Using `localStorage` to remember the user's level so they don't start from Level 1 every time they open the PC app.
- [ ] **Level Difficulty Scaling:** Logic to make islands smaller or move faster as you reach level 50+.

## 🎨 Phase 2: Sensory Polish (The Feel)
- [ ] **Ambient Audio:** Wind loops and soft synth pads that change based on height.
- [ ] **Interactive Sound FX:** Harmonic chimes for shard collection (different notes for each shard).
- [ ] **Dynamic Backgrounds:** The sky color should shift from Day (Level 1) to Sunset (Level 10) to Night (Level 20).

## ⚠️ Phase 3: Friction & Hazards (The Game)
- [ ] **Crumbling Islands:** Platforms that vanish 2 seconds after you land on them.
- [ ] **Wind Currents:** Areas of the screen that push the player in a certain direction.
- [ ] **Moving Islands:** Patrol-based platform movement.

## ♿ Phase 4: Accessibility (The "True Version")
- [ ] **Key Remapping UI:** Letting users choose their own controls.
- [ ] **High Contrast Mode:** A toggle to make islands bright neon for better visibility.
- [ ] **Screen Reader Labels:** Making sure the UI can be read by accessibility tools.

---
## Deployment Logic
- [ ] **Desktop Wrapper:** Setup for Tauri/Electron to create the `.exe`.
- [ ] **Cloudflare Sync:** Automated deployment to the web.
