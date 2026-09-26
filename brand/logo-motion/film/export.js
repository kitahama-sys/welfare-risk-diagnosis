const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { spawn } = require('child_process');
(async()=>{
  const FF=process.argv[2], out=process.argv[3], fps=60;
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1920,height:1080}});
  await p.goto('file://'+process.cwd()+'/film.html#export'); await p.evaluate(()=>window.FILM_READY);
  const total=await p.evaluate(()=>FILM.TOTAL); const n=Math.round(total*fps);
  const ff=spawn(FF,['-y','-loglevel','error','-f','image2pipe','-framerate',String(fps),'-c:v','mjpeg','-i','-','-c:v','libx264','-preset','slow','-crf','15','-pix_fmt','yuv420p','-movflags','+faststart',out],{stdio:['pipe','inherit','inherit']});
  for(let i=0;i<n;i++){
    const d=await p.evaluate(t=>{FILM.render(t);return document.getElementById('c').toDataURL('image/jpeg',0.96)},i/fps);
    if(!ff.stdin.write(Buffer.from(d.split(',')[1],'base64'))) await new Promise(r=>ff.stdin.once('drain',r));
    if(i%300===0) console.log('frame',i,'/',n);
  }
  ff.stdin.end(); await new Promise(r=>ff.on('close',r)); await b.close(); console.log('done');
})();
