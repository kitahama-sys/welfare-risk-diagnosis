const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { spawn } = require('child_process');
(async () => {
  const FF = process.argv[2], out = process.argv[3], fps = 30, total = 244, split = 28;
  const b = await chromium.launch();
  const open = async f => { const p = await b.newPage({ viewport: { width: 1920, height: 1080 } }); await p.goto('file://' + process.cwd() + '/' + f + '#export'); await p.evaluate(() => window.FILM_READY); return p; };
  const opener = await open('film4.html'), loop = await open('loop.html');
  const ff = spawn(FF, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = total * fps, t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const t = i / fps, p = t < split ? opener : loop;
    const d = await p.evaluate(t => { FILM.render(t); return document.getElementById('c').toDataURL('image/jpeg', 0.95); }, t);
    if (!ff.stdin.write(Buffer.from(d.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 600 === 0) console.log('frame', i, '/', n, Math.round((Date.now() - t0) / 1000) + 's');
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close(); console.log('done', Math.round((Date.now() - t0) / 1000) + 's');
})();
