"""Build film6.html (neon version). Fonts: fonts.css (fonts.py) + fonts6.css (Dela Gothic One, Barlow Condensed 800 subsets)."""
import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
exec(open('build2.py', encoding='utf-8').read().split("js = open")[0])
js = open('film2_head.js', encoding='utf-8').read() + open('film6_scenes.js', encoding='utf-8').read()
js = js.replace('bctx.fillStyle = logoGrad(bctx);\n    bctx.fillRect(-2000', 'bctx.fillStyle = neonGrad(bctx);\n    bctx.fillRect(-2000')
css = open('fonts.css').read() + (open('fonts6.css').read() if os.path.exists('fonts6.css') else '')
html = html.replace('const fs=[', 'const fs=[\'400 20px "Dela Gothic One"\',\'800 20px "Barlow Condensed"\',')
open('film6.html', 'w', encoding='utf-8').write(html % (css, open('../logo-data.json').read(), js))
