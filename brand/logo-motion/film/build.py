import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
html = """<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>PLACE LIBRE Brand Film</title><style>%s
html,body{margin:0;background:#111;height:100%%}canvas{display:block;width:100%%;height:100%%;object-fit:contain}</style></head>
<body><canvas id="c" width="1920" height="1080"></canvas>
<script>window.LOGO_DATA=%s;</script>
<script>
window.FILM_READY=(async()=>{const fs=['700 20px "Shippori Mincho"','500 20px "Shippori Mincho"','500 20px "Zen Kaku Gothic New"','400 20px "Libre Baskerville"','700 20px "Barlow Condensed"'];
await Promise.all(fs.map(f=>document.fonts.load(f,'灯あMISSIONThanks')));await document.fonts.ready;
const s=document.createElement('script');s.textContent=%r;document.body.appendChild(s);
if(location.hash!=='#export'){let t0=null;const loop=n=>{if(t0==null)t0=n;FILM.render(((n-t0)/1000)%%FILM.TOTAL);requestAnimationFrame(loop)};requestAnimationFrame(loop);}
return true;})();
</script></body></html>"""
js = open('film.js', encoding='utf-8').read()
open('film.html', 'w', encoding='utf-8').write(html % (open('fonts.css').read(), open('../logo-data.json').read(), js))
