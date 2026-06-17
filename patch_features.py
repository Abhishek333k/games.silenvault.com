import os
import glob

# The script tags to inject
INJECT_CONTENT = """    <link rel="stylesheet" href="../assets/toast.css">
    <script src="../assets/toast.js"></script>
    <script src="../assets/audio.js"></script>
    <script src="../assets/controls.js"></script>"""

# Find all game index.html files
html_files = glob.glob("*/index.html")

patched_count = 0
for file_path in html_files:
    if "assets" in file_path:
        continue
        
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    if "audio.js" in content:
        continue # Already patched
        
    # Replace the existing toast injection with the new unified one
    # Note: We look for the <script src="../assets/toast.js"></script> and replace it + the link
    if '<script src="../assets/toast.js"></script>' in content:
        # standard replacement
        content = content.replace(
            '<link rel="stylesheet" href="../assets/toast.css">\n    <script src="../assets/toast.js"></script>',
            INJECT_CONTENT
        )
        content = content.replace(
            '<script src="../assets/toast.js"></script>\n    <link rel="stylesheet" href="../assets/toast.css">',
            INJECT_CONTENT
        )
        # fallback if just one line
        content = content.replace(
            '<script src="../assets/toast.js"></script>',
            INJECT_CONTENT.replace('    <link rel="stylesheet" href="../assets/toast.css">\n', '')
        )
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        patched_count += 1
        print(f"Patched: {file_path}")

print(f"Successfully patched {patched_count} games with audio.js and controls.js.")
