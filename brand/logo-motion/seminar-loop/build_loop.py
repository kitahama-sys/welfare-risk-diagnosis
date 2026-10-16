"""Build loop.html: chapters 28s-244s of the seminar waiting loop (the v4 film plays 0-28s)."""
import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
js = open('../film/film2_head.js', encoding='utf-8').read() + open('loop_scenes.js', encoding='utf-8').read()
html = """<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>PLACE LIBRE Seminar Loop</title><style>%s
html,body{margin:0;background:#111;height:100%%}canvas{display:block;width:100%%;height:100%%;object-fit:contain}</style></head>
<body><canvas id="c" width="1920" height="1080"></canvas>
<script>window.LOGO_DATA=%s;window.QR_DATA=%s;</script>
<script>
window.FILM_READY=(async()=>{const fs=['700 20px "Shippori Mincho"','500 20px "Shippori Mincho"','500 20px "Zen Kaku Gothic New"','400 20px "Libre Baskerville"','700 20px "Barlow Condensed"','500 20px "Barlow"'];
await Promise.all(fs.map(f=>document.fonts.load(f,'灯あ組織MISSIONThanks01')));await document.fonts.ready;
const s=document.createElement('script');s.textContent=%r;document.body.appendChild(s);
if(location.hash!=='#export'){let t0=null;const loop=n=>{if(t0==null)t0=n;FILM.render(28+((n-t0)/1000)%%216);requestAnimationFrame(loop)};requestAnimationFrame(loop);}
return true;})();
</script></body></html>"""
css = open('fonts_loop.css').read()
open('loop.html', 'w', encoding='utf-8').write(html % (css, open('../logo-data.json').read(), open('qr.json').read(), js))
