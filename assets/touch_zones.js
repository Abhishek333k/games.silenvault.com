// TouchZoneController: Dispatches specific keys based on where the user touches the screen.

class TouchZoneController {
    constructor(element, zones) {
        this.element = element;
        this.zones = zones; // Array of { rect: {x, y, w, h} (percentages 0-1), key: 'ArrowLeft', code: 37 }
        this.activeTouches = new Map(); // touch.identifier -> key currently being pressed

        this.handleStart = this.handleStart.bind(this);
        this.handleMove = this.handleMove.bind(this);
        this.handleEnd = this.handleEnd.bind(this);

        this.init();
    }

    init() {
        this.element.style.touchAction = 'none';
        this.element.addEventListener('touchstart', this.handleStart, { passive: false });
        this.element.addEventListener('touchmove', this.handleMove, { passive: false });
        this.element.addEventListener('touchend', this.handleEnd, { passive: false });
        this.element.addEventListener('touchcancel', this.handleEnd, { passive: false });
    }

    getZone(clientX, clientY) {
        const rect = this.element.getBoundingClientRect();
        const px = (clientX - rect.left) / rect.width;
        const py = (clientY - rect.top) / rect.height;

        for (let zone of this.zones) {
            if (px >= zone.rect.x && px <= zone.rect.x + zone.rect.w &&
                py >= zone.rect.y && py <= zone.rect.y + zone.rect.h) {
                return zone;
            }
        }
        return null;
    }

    triggerKey(keyObj, isDown) {
        const type = isDown ? 'keydown' : 'keyup';
        const evt = new KeyboardEvent(type, { key: keyObj.key, code: keyObj.key, keyCode: keyObj.code, which: keyObj.code, bubbles: true });
        window.dispatchEvent(evt);
        document.dispatchEvent(evt);
    }

    handleStart(e) {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const zone = this.getZone(touch.clientX, touch.clientY);
            if (zone) {
                this.activeTouches.set(touch.identifier, zone);
                this.triggerKey(zone, true);
            }
        }
    }

    handleMove(e) {
        e.preventDefault();
        // If they drag their finger into a different zone, we release the old key and press the new one
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const currentZone = this.activeTouches.get(touch.identifier);
            const newZone = this.getZone(touch.clientX, touch.clientY);
            
            if (currentZone && newZone && currentZone.key !== newZone.key) {
                this.triggerKey(currentZone, false);
                this.triggerKey(newZone, true);
                this.activeTouches.set(touch.identifier, newZone);
            } else if (!currentZone && newZone) {
                this.triggerKey(newZone, true);
                this.activeTouches.set(touch.identifier, newZone);
            }
        }
    }

    handleEnd(e) {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const zone = this.activeTouches.get(touch.identifier);
            if (zone) {
                this.triggerKey(zone, false);
                this.activeTouches.delete(touch.identifier);
            }
        }
    }
}
window.TouchZoneController = TouchZoneController;
