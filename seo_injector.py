import os
from datetime import datetime

DOMAIN = "https://games.silenvault.com"

GAMES = {
    "Aetheria": {
        "title": "Aetheria - Serene Puzzle Game | SilenVault Games",
        "description": "Immerse yourself in Aetheria, an atmosphere-driven puzzle experience that challenges your mind while soothing your senses.",
        "keywords": "aetheria, puzzle game, relaxing game, atmospheric puzzle, web game, silenvault",
        "image": f"{DOMAIN}/assets/og-aetheria.png"
    },
    "Bit-Beat": {
        "title": "Bit-Beat - Retro Rhythm Hacking | SilenVault Games",
        "description": "Hack to the rhythm in Bit-Beat. Fast-paced retro arcade action combined with rhythmic precision.",
        "keywords": "bit-beat, rhythm game, hacking game, retro arcade, web game, silenvault",
        "image": f"{DOMAIN}/assets/og-bitbeat.png"
    },
    "IgnisZero": {
        "title": "IgnisZero - High Stakes Firewall Defense | SilenVault Games",
        "description": "Defend the core in IgnisZero. Intense firewall defense gameplay requiring quick reflexes and strategy.",
        "keywords": "igniszero, defense game, firewall game, action web game, silenvault",
        "image": f"{DOMAIN}/assets/og-igniszero.png"
    },
    "Lumina": {
        "title": "Lumina - Light Refraction Puzzles | SilenVault Games",
        "description": "Bend light, mix colors, and solve intricate puzzles in Lumina. A beautiful brain-teaser.",
        "keywords": "lumina, light puzzle, color mixing game, logic game, web game, silenvault",
        "image": f"{DOMAIN}/assets/og-lumina.png"
    },
    "Mnemonic": {
        "title": "Mnemonic - Cyberpunk Logic Gate Puzzles | SilenVault Games",
        "description": "Route signals through complex logic gates in Mnemonic. A cyberpunk-themed circuit puzzle game.",
        "keywords": "mnemonic, logic gates, cyberpunk puzzle, circuit routing game, programming puzzle, silenvault",
        "image": f"{DOMAIN}/assets/og-mnemonic.png"
    },
    "OrbitTerminal": {
        "title": "OrbitTerminal - CLI Hacking Simulator | SilenVault Games",
        "description": "Master the command line in OrbitTerminal. An immersive terminal simulation and hacking puzzle.",
        "keywords": "orbitterminal, hacking simulator, cli game, terminal puzzle, web game, silenvault",
        "image": f"{DOMAIN}/assets/og-orbitterminal.png"
    },
    "PrismShift": {
        "title": "PrismShift - Spatial Light Manipulation | SilenVault Games",
        "description": "Shift the prism and manipulate light in this mind-bending spatial puzzle game.",
        "keywords": "prismshift, spatial puzzle, light manipulation, brain teaser, web game, silenvault",
        "image": f"{DOMAIN}/assets/og-prismshift.png"
    },
    "ShiftProtocol": {
        "title": "ShiftProtocol - Time & Logic Execution | SilenVault Games",
        "description": "Execute the right protocol at the right time. ShiftProtocol tests your temporal logic skills.",
        "keywords": "shiftprotocol, logic game, timing puzzle, execution game, web game, silenvault",
        "image": f"{DOMAIN}/assets/og-shiftprotocol.png"
    },
    "ViperGrid": {
        "title": "ViperGrid - Fast-paced Cyber Survival | SilenVault Games",
        "description": "Survive the neon grid. ViperGrid delivers high-speed evasion and tactical movement.",
        "keywords": "vipergrid, arcade survival, grid game, cyberpunk action, web game, silenvault",
        "image": f"{DOMAIN}/assets/og-vipergrid.png"
    },
    "ROOT": {
        "title": "SilenVault Games - Premium Web Game Collection",
        "description": "Play the SilenVault Games collection. A suite of premium, ad-free web games including puzzles, rhythm, and arcade experiences.",
        "keywords": "silenvault games, web games, free browser games, puzzle games, cyberpunk games",
        "image": f"{DOMAIN}/assets/og-main.png"
    }
}

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

    # Skip if already injected
    if "<!-- SEO Meta Tags -->" in content:
        print(f"Skipping {file_path}, already has SEO tags.")
        return

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
