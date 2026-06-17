// Universal Mobile Touch Control Injector
// Injects a virtual D-Pad and Action button on touch devices and maps them to KeyboardEvents

(function() {
    // Only run if on a touch device
    if (!('ontouchstart' in window) && navigator.maxTouchPoints === 0) return;

    // Wait for DOM
    document.addEventListener('DOMContentLoaded', () => {
        // Inject CSS
        const style = document.createElement('style');
        style.innerHTML = `
            #v-dpad { position: fixed; bottom: 30px; left: 20px; width: 120px; height: 120px; display: grid; grid-template-columns: 1fr 1fr 1fr; grid-template-rows: 1fr 1fr 1fr; gap: 5px; z-index: 9999; opacity: 0.6; }
            #v-dpad .v-btn { background: rgba(255, 255, 255, 0.2); border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.4); backdrop-filter: blur(5px); box-shadow: 0 0 10px rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; color: white; font-weight: bold; font-family: monospace; user-select: none; }
            #v-dpad .v-btn:active, #v-dpad .v-btn.active { background: rgba(0, 255, 255, 0.5); box-shadow: 0 0 15px cyan; transform: scale(0.95); }
            #v-up { grid-column: 2; grid-row: 1; }
            #v-left { grid-column: 1; grid-row: 2; }
            #v-right { grid-column: 3; grid-row: 2; }
            #v-down { grid-column: 2; grid-row: 3; }
            
            #v-action { position: fixed; bottom: 50px; right: 30px; width: 80px; height: 80px; background: rgba(255, 0, 85, 0.3); border-radius: 50%; border: 2px solid rgba(255, 0, 85, 0.6); backdrop-filter: blur(5px); box-shadow: 0 0 15px rgba(255, 0, 85, 0.5); z-index: 9999; opacity: 0.8; display: flex; justify-content: center; align-items: center; color: white; font-weight: bold; font-family: monospace; user-select: none; }
            #v-action:active, #v-action.active { background: rgba(255, 0, 85, 0.7); box-shadow: 0 0 25px #ff0055; transform: scale(0.95); }
        `;
        document.head.appendChild(style);

        // Inject HTML
        const overlay = document.createElement('div');
        overlay.innerHTML = `
            <div id="v-dpad">
                <div class="v-btn" id="v-up">W</div>
                <div class="v-btn" id="v-left">A</div>
                <div class="v-btn" id="v-right">D</div>
                <div class="v-btn" id="v-down">S</div>
            </div>
            <div id="v-action">ACT</div>
        `;
        document.body.appendChild(overlay);

        // Key Mapping Function
        const triggerKey = (keyName, isDown) => {
            const eventType = isDown ? 'keydown' : 'keyup';
            const event = new KeyboardEvent(eventType, {
                key: keyName,
                code: keyName,
                bubbles: true,
                cancelable: true
            });
            window.dispatchEvent(event);
            document.dispatchEvent(event);
        };

        // Bindings
        const bindButton = (id, keyName) => {
            const btn = document.getElementById(id);
            if(!btn) return;
            btn.addEventListener('touchstart', (e) => { e.preventDefault(); btn.classList.add('active'); triggerKey(keyName, true); });
            btn.addEventListener('touchend', (e) => { e.preventDefault(); btn.classList.remove('active'); triggerKey(keyName, false); });
            btn.addEventListener('touchcancel', (e) => { e.preventDefault(); btn.classList.remove('active'); triggerKey(keyName, false); });
        };

        bindButton('v-up', 'ArrowUp');
        bindButton('v-down', 'ArrowDown');
        bindButton('v-left', 'ArrowLeft');
        bindButton('v-right', 'ArrowRight');
        bindButton('v-action', ' '); // Spacebar
    });
})();
