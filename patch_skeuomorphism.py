import os
import re

base_path = r'o:\Projects\Project Pegasus\Me_Games\Game #1'
games = [
    'IgnisZero', 'Lumina', 'Match3', 'Minesweeper', 'Mnemonic', 'OrbitTerminal', 
    'PrismShift', 'ShiftProtocol', 'Solitaire', 'ViperGrid'
]

css_link = '\n    <!-- UI Upgrade -->\n    <link rel="stylesheet" href="../assets/arcade-cabinet.css">\n'

wrapper_start = '''
    <div id="arcade-cabinet">
        <div id="arcade-bezel">
            <div id="game-container">
'''

wrapper_end = '''
                <div class="crt-overlay"></div>
            </div>
        </div>
    </div>
'''

for game in games:
    index_path = os.path.join(base_path, game, 'index.html')
    if not os.path.exists(index_path):
        print(f"Skipping {game}: index.html not found.")
        continue

    with open(index_path, 'r', encoding='utf-8') as f:
        html = f.read()

    # Skip if already processed
    if 'id="arcade-cabinet"' in html:
        print(f"Skipping {game}: Already has arcade-cabinet.")
        continue

    if 'arcade-cabinet.css' not in html:
        html = re.sub(r'</head>', lambda m: css_link + m.group(0), html, flags=re.IGNORECASE)

    if 'id="game-container"' in html:
        html = re.sub(r'<div\s+id="game-container"\s*>', wrapper_start, html, count=1, flags=re.IGNORECASE)
        html = re.sub(r'id="game-container"', 'id="inner-game-container"', html)

    html = re.sub(r'<body[^>]*>', lambda m: m.group(0) + wrapper_start, html, count=1, flags=re.IGNORECASE)

    if '<!-- NATIVE MOBILE TOUCH ZONE CONTROLLER' in html:
        html = html.replace('<!-- NATIVE MOBILE TOUCH ZONE CONTROLLER', wrapper_end + '<!-- NATIVE MOBILE TOUCH ZONE CONTROLLER')
    else:
        script_match = re.search(r'<script.*?>.*?</script>\s*</body>', html, re.IGNORECASE | re.DOTALL)
        if script_match:
             html = html.replace(script_match.group(0), wrapper_end + script_match.group(0))
        else:
             html = re.sub(r'</body>', lambda m: wrapper_end + m.group(0), html, flags=re.IGNORECASE)

    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"Successfully upgraded {game} to Skeuomorphic Arcade layout.")
