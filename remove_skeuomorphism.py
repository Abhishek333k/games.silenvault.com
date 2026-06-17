import os
import re

base_path = r'o:\Projects\Project Pegasus\Me_Games\Game #1'
games = ['Aetheria', 'Asteroids', 'Bit-Beat', 'Bounce']

for game in games:
    index_path = os.path.join(base_path, game, 'index.html')
    if not os.path.exists(index_path):
        continue

    with open(index_path, 'r', encoding='utf-8') as f:
        html = f.read()

    # Remove CSS link
    html = re.sub(r'<!-- UI Upgrade -->\s*<link rel="stylesheet" href="\.\./assets/arcade-cabinet\.css">\s*', '', html, flags=re.IGNORECASE)
    
    # Special case: Asteroids had it without ../ if it was global, wait Asteroids is in a folder. 
    html = re.sub(r'<link rel="stylesheet" href="\.\./assets/arcade-cabinet\.css">\s*', '', html, flags=re.IGNORECASE)

    # Remove crt-overlay
    html = re.sub(r'<div class="crt-overlay"[^>]*></div>\s*', '', html, flags=re.IGNORECASE)
    
    # Remove wrappers
    # We replace the opening cabinet/bezel/container with just the container
    html = re.sub(r'<div id="arcade-cabinet">\s*<div id="arcade-bezel">\s*<div id="game-container">', '<div id="game-container">', html, flags=re.IGNORECASE)
    
    # Now we must remove the corresponding closing tags. 
    # Because there's a </div> for container, bezel, and cabinet right before </body> or scripts,
    # Let's just find the sequence of three closing divs before scripts/body and replace with one closing div.
    html = re.sub(r'</div>\s*</div>\s*</div>\s*(<script|</body>|<!-- NATIVE MOBILE)', r'</div>\n    \1', html, flags=re.IGNORECASE)
    
    # Aetheria had its CSS appended to style.css. I will handle style.css separately.
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(html)
        
    print(f"Unwrapped {game}")
