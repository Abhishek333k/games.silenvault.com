import os
import re

path = r'o:\Projects\Project Pegasus\Me_Games\Game #1\Hextris\index.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove Google Analytics
content = re.sub(r'<script>\s*\(function\(i,s,o,g,r,a,m\).*?</script>', '', content, flags=re.DOTALL)
# Remove Ads
content = re.sub(r'<script data-ad-client.*?</script>', '', content, flags=re.DOTALL)
# Remove socialShare div completely
content = re.sub(r'<div id=\'socialShare\'>.*?</div>\s*</div>\s*</div>\s*</div>', '</div></div></div>', content, flags=re.DOTALL)
# Remove the custom russian share script
content = re.sub(r'<script type="text/javascript">\s*\(function addRussianSocialShare.*?</script>', '', content, flags=re.DOTALL)
# Remove rrssb.min.js
content = re.sub(r'<script type="text/javascript" src=\'vendor/rrssb.min.js\'></script>', '', content, flags=re.DOTALL)
# Add toast lib
if '<script src="../assets/toast.js"></script>' not in content:
    content = content.replace('</head>', '  <link rel="stylesheet" href="../assets/toast.css">\n  <script src="../assets/toast.js"></script>\n</head>')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Hextris cleaned!")
