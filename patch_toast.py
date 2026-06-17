import os
import re

games = ['Aetheria', 'Bit-Beat', 'IgnisZero', 'Lumina', 'Mnemonic', 'OrbitTerminal', 'PrismShift', 'ShiftProtocol', 'ViperGrid']

for g in games:
    idx_path = os.path.join(g, 'index.html')
    js_path = os.path.join(g, 'game.js')
    
    if os.path.exists(idx_path):
        with open(idx_path, 'r', encoding='utf-8') as f:
            html = f.read()
        
        # Inject Toast CSS and JS if not already there
        if 'toast.js' not in html:
            injection = '    <link rel="stylesheet" href="../assets/toast.css">\n    <script src="../assets/toast.js"></script>\n</body>'
            html = html.replace('</body>', injection)
            
            # Hide the old overlay containers via CSS inline so they never appear but still exist in DOM
            html = html.replace('id="overlay"', 'id="overlay" style="display: none !important;"')
            html = html.replace('id="game-over-screen"', 'id="game-over-screen" style="display: none !important;"')
            
            with open(idx_path, 'w', encoding='utf-8') as f:
                f.write(html)
            print(f"Patched HTML for {g}")
            
    if os.path.exists(js_path):
        with open(js_path, 'r', encoding='utf-8') as f:
            js = f.read()
            
        # Replace the show logic for overlay
        # Some games might use UI.overlay.classList.remove('hidden')
        js = re.sub(r"UI\.overlay\.classList\.remove\('hidden'\);?", 
                    r"if(window.showToast) window.showToast(UI.overlayText.innerText, 'cyan');", js)
        
        # Replace the show logic for game over
        js = re.sub(r"UI\.gameOverScreen\.classList\.remove\('hidden'\);?", 
                    r"if(window.showToast) window.showToast('SYSTEM_LOCKOUT', 'red');", js)
        
        # Some games use UI.gameoverScreen instead of gameOverScreen
        js = re.sub(r"UI\.gameoverScreen\.classList\.remove\('hidden'\);?", 
                    r"if(window.showToast) window.showToast('SYSTEM_LOCKOUT', 'red');", js)
        
        with open(js_path, 'w', encoding='utf-8') as f:
            f.write(js)
        print(f"Patched JS for {g}")

print("Toast patching complete!")
