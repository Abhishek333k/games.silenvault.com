import os
import re

base_path = r'o:\Projects\Project Pegasus\Me_Games\Game #1'
games = [
    'FloppyBird', 'IgnisZero', 'Lumina', 'Mnemonic', 'OrbitTerminal', 'Pong', 
    'PrismShift', 'ShiftProtocol', 'ViperGrid'
] # Games that we know use simple canvas loops

loop_old = r'function\s+loop\s*\(\)\s*\{\s*update\(\);\s*draw\(\);\s*requestAnimationFrame\(loop\);\s*\}'
loop_new = '''let lastTime = 0;
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
}'''

resize_old = r'function\s+resize\s*\(\)\s*\{\s*width\s*=\s*canvas\.width\s*=\s*window\.innerWidth;\s*height\s*=\s*canvas\.height\s*=\s*window\.innerHeight;\s*\}'
resize_new = '''function resize() {
    const dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);
}'''

for game in games:
    js_path = os.path.join(base_path, game, 'game.js')
    if not os.path.exists(js_path):
        js_path = os.path.join(base_path, game, 'index.html') # Pong uses index.html
        if not os.path.exists(js_path):
            continue

    with open(js_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Check and replace loop
    if re.search(loop_old, content):
        content = re.sub(loop_old, loop_new, content)
        print(f"Patched Accumulator Loop in {game}")
    
    # Check and replace resize
    if re.search(resize_old, content):
        content = re.sub(resize_old, resize_new, content)
        print(f"Patched Retina Resize in {game}")

    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(content)
