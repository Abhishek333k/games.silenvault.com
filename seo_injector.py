import os
from datetime import datetime

DOMAIN = "https://games.silenvault.com"

GAMES = {
    "Aetheria": {
        "title": "Relaxing Atmospheric Puzzle Game | Free Browser Games",
        "description": "Play this relaxing, atmosphere-driven puzzle experience right in your browser. Solve serene challenges that soothe your senses.",
        "keywords": "relaxing puzzle game, atmospheric browser game, free online puzzles, zen puzzle, calm web game",
        "image": f"{DOMAIN}/assets/og-aetheria.png"
    },
    "Bit-Beat": {
        "title": "Retro Rhythm Hacking Game | Play Online Free",
        "description": "Hack to the rhythm in this fast-paced retro arcade browser game. Test your rhythmic precision and typing speed.",
        "keywords": "rhythm hacking game, retro arcade browser game, typing rhythm game, free online arcade, cyberpunk rhythm",
        "image": f"{DOMAIN}/assets/og-bitbeat.png"
    },
    "IgnisZero": {
        "title": "High Stakes Firewall Defense Game | Action Web Games",
        "description": "Defend the core in this intense firewall defense simulator. Quick reflexes and strategy required.",
        "keywords": "firewall defense game, cyber security simulator, fast paced action game, browser defense game",
        "image": f"{DOMAIN}/assets/og-igniszero.png"
    },
    "Lumina": {
        "title": "Light Refraction & Color Mixing Puzzle | Free Web Game",
        "description": "Bend light, mix colors, and solve intricate optical puzzles in this beautiful brain-teaser.",
        "keywords": "light puzzle game, color mixing game, optics browser game, physics puzzle online, brain teaser",
        "image": f"{DOMAIN}/assets/og-lumina.png"
    },
    "Mnemonic": {
        "title": "Cyberpunk Circuit Routing Puzzle Game | Free Browser Game",
        "description": "Route signals through complex logic gates and hack the mainframe in this cyberpunk-themed circuit puzzle game.",
        "keywords": "logic gate puzzle, cyberpunk hacking game, circuit routing puzzle, programming browser game",
        "image": f"{DOMAIN}/assets/og-mnemonic.png"
    },
    "OrbitTerminal": {
        "title": "CLI Terminal Hacking Simulator | Play Online Free",
        "description": "Master the command line in this immersive terminal simulation and hacking puzzle browser game.",
        "keywords": "hacking simulator, command line game, terminal puzzle, cli browser game, hacker web game",
        "image": f"{DOMAIN}/assets/og-orbitterminal.png"
    },
    "Snake": {
        "title": "Retro Snake | Play Online Free",
        "description": "Play the classic Snake arcade game in your browser. Eat the food and grow your snake without hitting the walls.",
        "keywords": "snake game, retro snake, nokia snake browser, play snake online, classic arcade game",
        "image": f"{DOMAIN}/assets/og-snake.png"
    },
    "SpaceInvaders": {
        "title": "Space Invaders - Classic Arcade Shooter | Play Free",
        "description": "Defend the earth from descending aliens in this classic Space Invaders clone. Shoot the saucers and take cover.",
        "keywords": "space invaders, classic alien shooter, retro arcade browser game, free online space invaders",
        "image": f"{DOMAIN}/assets/og-spaceinvaders.png"
    },
    "Pacman": {
        "title": "Pac-Man - Classic Arcade Maze | Play Online Free",
        "description": "Play the legendary Pac-Man maze game. Eat all the dots and avoid the ghosts. Grab a power pellet to turn the tables.",
        "keywords": "pacman, pac-man browser game, classic arcade maze, retro pacman online, free pacman",
        "image": f"{DOMAIN}/assets/og-pacman.png"
    },
    "Pong": {
        "title": "Retro Pong - Classic Arcade Tennis | Play Free",
        "description": "Play the original arcade classic Pong. Challenge the AI in this fast-paced digital tennis game.",
        "keywords": "pong, classic pong, retro arcade tennis, free online pong, atari pong clone",
        "image": f"{DOMAIN}/assets/og-pong.png"
    },
    "Minesweeper": {
        "title": "Minesweeper - Classic Logic Puzzle | Play Free",
        "description": "Clear the board without detonating any hidden mines. Use logic and numerical clues to survive.",
        "keywords": "minesweeper, classic minesweeper, logic puzzle game, free online minesweeper, retro pc game",
        "image": f"{DOMAIN}/assets/og-minesweeper.png"
    },
    "Match3": {
        "title": "Neon Match-3 Puzzle Game | Play Online Free",
        "description": "Swap the neon gems to create cascades of 3 or more. A fast-paced, relaxing Match-3 puzzle game.",
        "keywords": "match 3 game, gem matching puzzle, candy crush clone, free match 3, online jewel puzzle",
        "image": f"{DOMAIN}/assets/og-match3.png"
    },
    "Solitaire": {
        "title": "Classic Solitaire (Klondike) | Play Free",
        "description": "Play classic Klondike Solitaire directly in your browser. Relaxing, ad-free card game experience.",
        "keywords": "solitaire, klondike solitaire, free online solitaire, classic card game, ad-free solitaire",
        "image": f"{DOMAIN}/assets/og-solitaire.png"
    },
    "Bounce": {
        "title": "Retro Bounce - Endless Platformer | Play Free",
        "description": "Navigate the bouncing red ball through treacherous spikes and platforms in this retro endless runner.",
        "keywords": "bounce game, nokia bounce clone, endless runner ball, retro platformer, red ball game",
        "image": f"{DOMAIN}/assets/og-bounce.png"
    },
    "Game-2048": {
        "title": "2048 - Classic Number Puzzle Game | Play Free",
        "description": "Play the incredibly addictive 2048 number puzzle game. Slide tiles to combine numbers and reach the 2048 tile.",
        "keywords": "2048, number puzzle game, math game, sliding puzzle browser game, free online 2048",
        "image": f"{DOMAIN}/assets/og-2048.png"
    },
    "FloppyBird": {
        "title": "Floppy Bird - Classic Arcade Runner | Play Free",
        "description": "Play the notoriously difficult classic Flappy Bird clone directly in your browser. Tap to fly between pipes.",
        "keywords": "flappy bird, floppy bird, arcade browser game, retro arcade runner, free online flappy",
        "image": f"{DOMAIN}/assets/og-floppybird.png"
    },
    "Tetris": {
        "title": "Tetris - Classic Block Puzzle Game | Play Online Free",
        "description": "Play the legendary Tetris block falling puzzle game. Clear lines and survive as long as possible.",
        "keywords": "tetris, block puzzle game, classic tetris browser, retro arcade puzzle, free online tetris",
        "image": f"{DOMAIN}/assets/og-tetris.png"
    },
    "Asteroids": {
        "title": "Asteroids - Classic Retro Space Shooter | Play Free",
        "description": "Play Asteroids in your browser. Pilot your ship through an asteroid field and blast rocks into dust in this vector graphics classic.",
        "keywords": "asteroids game, space shooter browser game, classic arcade shooter, retro vector graphics",
        "image": f"{DOMAIN}/assets/og-asteroids.png"
    },
    "DinoRunner": {
        "title": "Chrome Dinosaur Game Clone | Play Online Free",
        "description": "Play the classic offline T-Rex runner game directly in your browser. Jump over cacti and dodge pterodactyls.",
        "keywords": "dinosaur game, chrome dino, offline t-rex, endless runner browser game, free online arcade",
        "image": f"{DOMAIN}/assets/og-dinorunner.png"
    },
    "PrismShift": {
        "title": "Spatial Light Manipulation Puzzle | Free Online Game",
        "description": "Shift perspectives and manipulate light in this mind-bending 3D spatial puzzle game.",
        "keywords": "spatial puzzle game, light manipulation puzzle, brain teaser browser game, perspective puzzle",
        "image": f"{DOMAIN}/assets/og-prismshift.png"
    },
    "ShiftProtocol": {
        "title": "Time & Logic Execution Puzzle | Free Web Game",
        "description": "Execute the right protocol at the right time. Test your temporal logic and execution skills.",
        "keywords": "time puzzle game, execution logic game, browser timing puzzle, sequence solver",
        "image": f"{DOMAIN}/assets/og-shiftprotocol.png"
    },
    "ViperGrid": {
        "title": "Fast-Paced Cyber Survival Arcade Game | Play Free",
        "description": "Survive the neon grid. High-speed evasion, tactical movement, and cyberpunk arcade action.",
        "keywords": "arcade survival game, grid evasion game, cyberpunk action web game, retro neon arcade",
        "image": f"{DOMAIN}/assets/og-vipergrid.png"
    },
    "ROOT": {
        "title": "Premium Free Web Games | Puzzle, Arcade & Strategy",
        "description": "Play a suite of premium, ad-free web games directly in your browser. Features relaxing puzzles, rhythm hacking, and cyberpunk arcades.",
        "keywords": "free browser games, premium web games, no ads games, online puzzle games, retro arcade browser",
        "image": f"{DOMAIN}/assets/og-main.png"
    }
}
import re

def generate_seo_block(game_key, folder=""):
    data = GAMES.get(game_key, GAMES["ROOT"])
    url = f"{DOMAIN}/{folder}/" if folder else f"{DOMAIN}/"
    if folder == "": url = f"{DOMAIN}/"
    
    return f"""
    <!-- SEO Meta Tags -->
    <meta name="description" content="{data['description']}">
    <meta name="keywords" content="{data['keywords']}">
    <meta name="author" content="SilenVault">
    <meta name="robots" content="index, follow">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="{url}">
    <meta property="og:title" content="{data['title']}">
    <meta property="og:description" content="{data['description']}">
    <meta property="og:image" content="{data['image']}">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="{url}">
    <meta property="twitter:title" content="{data['title']}">
    <meta property="twitter:description" content="{data['description']}">
    <meta property="twitter:image" content="{data['image']}">
"""

def inject_seo(file_path, game_key, folder=""):
    if not os.path.exists(file_path):
        return
        
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove old SEO block if it exists
    if "<!-- SEO Meta Tags -->" in content:
        content = re.sub(r'<!-- SEO Meta Tags -->.*?</head>', '</head>', content, flags=re.DOTALL)

    # Find the closing </head> or <title>
    head_close_idx = content.find('</head>')
    if head_close_idx == -1:
        return

    seo_block = generate_seo_block(game_key, folder)
    new_content = content[:head_close_idx] + seo_block + content[head_close_idx:]
    
    # Also update the <title> tag if it exists
    title_start = new_content.find('<title>')
    title_end = new_content.find('</title>')
    if title_start != -1 and title_end != -1:
        new_content = new_content[:title_start+7] + GAMES[game_key]['title'] + new_content[title_end:]

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Injected SEO tags into {file_path}")

def build_sitemap():
    sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n'
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    date_str = datetime.now().strftime('%Y-%m-%d')
    
    # Root
    sitemap += f"  <url>\n    <loc>{DOMAIN}/</loc>\n    <lastmod>{date_str}</lastmod>\n    <priority>1.0</priority>\n  </url>\n"
    
    # Games
    for folder in GAMES.keys():
        if folder == "ROOT": continue
        sitemap += f"  <url>\n    <loc>{DOMAIN}/{folder}/</loc>\n    <lastmod>{date_str}</lastmod>\n    <priority>0.8</priority>\n  </url>\n"
        
    sitemap += '</urlset>'
    
    with open("sitemap.xml", 'w', encoding='utf-8') as f:
        f.write(sitemap)
    print("Created sitemap.xml")

def build_robots():
    robots = f"User-agent: *\nAllow: /\n\nSitemap: {DOMAIN}/sitemap.xml\n"
    with open("robots.txt", 'w', encoding='utf-8') as f:
        f.write(robots)
    print("Created robots.txt")

if __name__ == "__main__":
    # Root
    inject_seo("index.html", "ROOT")
    
    # Folders
    for folder in GAMES.keys():
        if folder == "ROOT": continue
        inject_seo(f"{folder}/index.html", folder, folder)
        
    build_sitemap()
    build_robots()
