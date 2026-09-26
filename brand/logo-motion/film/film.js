/* PLACE LIBRE brand film — every frame is a pure function of t (seconds). */
(function () {
  const D = window.LOGO_DATA;
  const W = 1920, H = 1080, TOTAL = 28.0;
  const cv = document.getElementById('c');
  const ctx = cv.getContext('2d');

  /* ---------- math ---------- */
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const lerp = (a, b, k) => a + (b - a) * k;
  const E = {
    inOut3: k => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
    inOutSine: k => (1 - Math.cos(Math.PI * k)) / 2,
    out3: k => 1 - Math.pow(1 - k, 3),
    out5: k => 1 - Math.pow(1 - k, 5),
    in3: k => k * k * k,
    in2: k => k * k,
    outBack: (k, s = 1.70158) => 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2),
    outBounce: k => {
      const n = 7.5625, d = 2.75;
      if (k < 1 / d) return n * k * k;
      if (k < 2 / d) return n * (k -= 1.5 / d) * k + 0.75;
      if (k < 2.5 / d) return n * (k -= 2.25 / d) * k + 0.9375;
      return n * (k -= 2.625 / d) * k + 0.984375;
    },
  };
  const bump = (k, c, w) => Math.exp(-Math.pow((k - c) / w, 2));
  const bounceSquash = k => bump(k, 1 / 2.75, 0.035) + 0.45 * bump(k, 2 / 2.75, 0.03) + 0.18 * bump(k, 2.5 / 2.75, 0.025);

  /* ---------- palette ---------- */
  const C = { paper: '#f4f2ee', ink: '#24232b', muted: '#6e6a76', dotL: '#5c3973', dotR: '#ae1c3b', idot: '#d2161a', mark: '#141318' };
  const STOPS = [[0, '#073f8e'], [0.2, '#453f7d'], [0.4, '#703c68'], [0.6, '#9c364c'], [0.8, '#c12830'], [1, '#d81718']];
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  function gradAt(u) {
    u = clamp(u);
    for (let i = 1; i < STOPS.length; i++) {
      if (u <= STOPS[i][0]) {
        const [o0, c0] = STOPS[i - 1], [o1, c1] = STOPS[i];
        const k = (u - o0) / (o1 - o0), a = hex(c0), b = hex(c1);
        return `rgb(${a.map((v, j) => Math.round(lerp(v, b[j], k))).join(',')})`;
      }
    }
    return STOPS[STOPS.length - 1][1];
  }
  function logoGrad(c) {
    const g = c.createLinearGradient(296, 0, 1404, 0);
    STOPS.forEach(([o, col]) => g.addColorStop(o, col));
    return g;
  }
  function screenGrad(c, x0, x1, stops = STOPS) {
    const g = c.createLinearGradient(x0, 0, x1, 0);
    stops.forEach(([o, col]) => g.addColorStop(o, col));
    return g;
  }

  /* ---------- logo geometry ---------- */
  const P = { ring: new Path2D(D.ring), center: new Path2D(D.center), main: D.main.map(m => new Path2D(m.d)), sub: D.sub.map(m => new Path2D(m.d)) };
  const HEAD_L = [610, 211], HEAD_R = [1118, 273], IDOT = [1066.5, 1079], HEAD_R0 = 60, IDOT_R = 25.5;
  const MAIN_BASE = 1283;
  const CL = (() => {
    const NS = 'http://www.w3.org/2000/svg';
    const sv = document.createElementNS(NS, 'svg');
    sv.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');
    const sp = document.createElementNS(NS, 'path');
    sp.setAttribute('d', D.center);
    sv.appendChild(sp);
    document.body.appendChild(sv);
    const L = sp.getTotalLength(), N = 720, pts = [];
    let Lb = 0, bd = 1e9;
    for (let i = 0; i < N; i++) {
      const s = (L * i) / N, q = sp.getPointAtLength(s);
      pts.push({ x: q.x, y: q.y, s });
      const d = Math.hypot(q.x - 945, q.y - 856);
      if (d < bd) { bd = d; Lb = s; }
    }
    sv.remove();
    return { L, Lb, pts };
  })();

  /* camera: logo point (ax, ay) sits at screen (sx, sy) with scale s */
  const cam = (s, ax, ay, sx = W / 2, sy = H / 2) => ({ s, ax, ay, sx, sy });
  const applyCam = (c, k) => c.setTransform(k.s, 0, 0, k.s, k.sx - k.ax * k.s, k.sy - k.ay * k.s);
  const toScreen = (k, x, y) => [k.sx + (x - k.ax) * k.s, k.sy + (y - k.ay) * k.s];

  /* head: circle (circ=1) that settles into the logo's semicircle (circ=0); bottom always rests on the base point */
  function head(c, bx, by, circ, sx, sy, color, r = HEAD_R0) {
    c.save();
    c.translate(bx, by);
    c.scale(sx, sy);
    const cy = -r * circ;
    c.beginPath();
    c.arc(0, cy, r, Math.PI, 2 * Math.PI);
    c.ellipse(0, cy, r, Math.max(r * circ, 0.001), 0, 0, Math.PI);
    c.closePath();
    c.fillStyle = color;
    c.fill();
    c.restore();
  }
  // smile: the i-dot shape, flat top at (x, y)
  function smile(c, x, y, r, color, sx = 1, sy = 1) {
    c.save();
    c.translate(x, y);
    c.scale(sx, sy);
    c.beginPath();
    c.arc(0, 0, r, 0, Math.PI);
    c.closePath();
    c.fillStyle = color;
    c.fill();
    c.restore();
  }
  function contactShadow(c, x, y, w, a) {
    if (a <= 0.001) return;
    c.save();
    c.translate(x, y);
    c.scale(1, 0.22);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, w);
    g.addColorStop(0, `rgba(40,25,60,${0.22 * a})`);
    g.addColorStop(1, 'rgba(40,25,60,0)');
    c.fillStyle = g;
    c.beginPath();
    c.arc(0, 0, w, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
  // drop from height H with soft bounces; returns y offset and squash/stretch
  function drop(t, t0, dur, Hgt, amp = 0.22) {
    const k = seg(t, t0, t0 + dur);
    const y = -Hgt * (1 - E.outBounce(k));
    const sq = k < 1 ? bounceSquash(k) * amp : 0;
    const st = k < 1 / 2.75 ? 0.14 * E.in2(k * 2.75) * (1 - bump(k, 1 / 2.75, 0.02)) : 0;
    return { y, sx: 1 + sq * 0.9 - st * 0.45, sy: 1 - sq + st, visible: t >= t0, k };
  }

  /* ---------- offscreen buffers ---------- */
  const mk = (w = W, h = H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const buf = mk(), bctx = buf.getContext('2d');
  const grains = [];
  (function makeGrain() {
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let n = 0; n < 8; n++) {
      const g = mk(960, 540), gc = g.getContext('2d'), im = gc.createImageData(960, 540);
      for (let i = 0; i < im.data.length; i += 4) {
        const v = 128 + (rnd() - 0.5) * 255;
        im.data[i] = im.data[i + 1] = im.data[i + 2] = v;
        im.data[i + 3] = 255;
      }
      gc.putImageData(im, 0, 0);
      grains.push(g);
    }
  })();

  /* ---------- text ---------- */
  function layout(str, font, ls) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = font;
    const ws = [...str].map(ch => ctx.measureText(ch).width);
    ctx.restore();
    const total = ws.reduce((a, b) => a + b, 0) + ls * (ws.length - 1);
    let x = -total / 2;
    return { total, chars: [...str].map((ch, i) => { const cx = x + ws[i] / 2; x += ws[i] + ls; return { ch, cx, w: ws[i] }; }) };
  }
  // draw centered text char by char; fn(i, n) -> {a, dx, dy, blur, rot, sc}
  function chars(str, font, ls, x, y, fill, fn) {
    const lay = layout(str, font, ls);
    const n = lay.chars.length;
    lay.chars.forEach((c, i) => {
      const st = fn(i, n) || {};
      const a = st.a == null ? 1 : st.a;
      if (a <= 0.003) return;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = a;
      if (st.blur > 0.2) ctx.filter = `blur(${st.blur.toFixed(1)}px)`;
      ctx.translate(x + c.cx + (st.dx || 0), y + (st.dy || 0));
      if (st.rot) ctx.rotate(st.rot);
      if (st.sc != null) ctx.scale(st.sc, st.sc);
      ctx.font = font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = typeof fill === 'function' ? fill(i, c) : fill;
      ctx.fillText(c.ch, 0, 0);
      ctx.restore();
    });
    return lay;
  }
  const softIn = (t, t0, d = 0.7, rise = 18) => {
    const k = seg(t, t0, t0 + d), e = E.out3(k);
    return { a: e, dy: rise * (1 - e), blur: 10 * (1 - e) };
  };
  const softOut = (t, t0, d = 0.45, rise = 14) => {
    const k = seg(t, t0, t0 + d), e = E.in2(k);
    return { a: 1 - e, dy: -rise * e, blur: 8 * e };
  };
  const mixST = (a, b) => ({ a: a.a * b.a, dy: (a.dy || 0) + (b.dy || 0), blur: (a.blur || 0) + (b.blur || 0) });

  const F = {
    minchoB: s => `700 ${s}px "Shippori Mincho", serif`,
    mincho: s => `500 ${s}px "Shippori Mincho", serif`,
    gothic: s => `500 ${s}px "Zen Kaku Gothic New", sans-serif`,
    label: s => `700 ${s}px "Barlow Condensed", sans-serif`,
    serif: s => `400 ${s}px "Libre Baskerville", serif`,
  };

  /* ---------- paper world (the "free space") ---------- */
  const PAPER_C = [905, 640];
  function paperPath(scale, t, wob) {
    const pts = CL.pts, n = 180, step = pts.length / n, out = [];
    const S = 1.46 * scale;
    for (let i = 0; i < n; i++) {
      const p = pts[Math.floor(i * step)], q = pts[Math.floor(((i + 1) % n) * step)], r = pts[Math.floor(((i - 1 + n) % n) * step)];
      let nx = q.y - r.y, ny = -(q.x - r.x);
      const nl = Math.hypot(nx, ny) || 1;
      nx /= nl; ny /= nl;
      const th = (i / n) * Math.PI * 2;
      const w = wob * (Math.sin(th * 3 + t * 0.9) + 0.6 * Math.sin(th * 5 - t * 0.7 + 1.3) + 0.35 * Math.sin(th * 8 + t * 1.3 + 2));
      out.push([W / 2 + (p.x - PAPER_C[0]) * S - nx * w, 548 + (p.y - PAPER_C[1]) * S - ny * w]);
    }
    const path = new Path2D();
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    let m = mid(out[n - 1], out[0]);
    path.moveTo(m[0], m[1]);
    for (let i = 0; i < n; i++) {
      const m2 = mid(out[i], out[(i + 1) % n]);
      path.quadraticCurveTo(out[i][0], out[i][1], m2[0], m2[1]);
    }
    path.closePath();
    return path;
  }
  function blobPath(cx, cy, r, seed, t, amp) {
    const path = new Path2D(), n = 64, pts = [];
    for (let i = 0; i < n; i++) {
      const th = (i / n) * Math.PI * 2;
      const rr = r * (1 + amp * (0.5 * Math.sin(th * 2 + seed + t * 0.5) + 0.3 * Math.sin(th * 3 - seed * 1.7 + t * 0.4) + 0.2 * Math.sin(th * 5 + seed * 0.3 - t * 0.6)));
      pts.push([cx + Math.cos(th) * rr, cy + Math.sin(th) * rr]);
    }
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    let m = mid(pts[n - 1], pts[0]);
    path.moveTo(m[0], m[1]);
    for (let i = 0; i < n; i++) { const m2 = mid(pts[i], pts[(i + 1) % n]); path.quadraticCurveTo(pts[i][0], pts[i][1], m2[0], m2[1]); }
    path.closePath();
    return path;
  }
  const BLOBS = [
    { x: 120, y: 60, r: 430, c: [[0, '#173b93'], [1, '#2b3f95']], seed: 0.3 },
    { x: -40, y: 1040, r: 420, c: [[0, '#4a3a86'], [1, '#6a3a74']], seed: 1.9 },
    { x: 700, y: -120, r: 150, c: [[0, '#6a3a74'], [1, '#8a3862']], seed: 3.1, head: true },
    { x: 1220, y: -90, r: 150, c: [[0, '#9a3450'], [1, '#b02e40']], seed: 4.2, head: true },
    { x: 1830, y: 90, r: 380, c: [[0, '#7a3a6c'], [1, '#a43247']], seed: 2.4 },
    { x: 1940, y: 960, r: 470, c: [[0, '#c9262c'], [1, '#e0322f']], seed: 5.3 },
    { x: 980, y: 1180, r: 330, c: [[0, '#a6304a'], [1, '#c72a31']], seed: 0.9 },
  ];
  function drawWorld(t, paperScale, wob, turn) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = screenGrad(ctx, 0, W, [[0, '#123a8e'], [0.45, '#5b3a78'], [1, '#d42a2d']]);
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.shadowColor = 'rgba(20,10,40,0.32)';
    ctx.shadowBlur = 50;
    ctx.shadowOffsetY = 16;
    BLOBS.forEach((b, i) => {
      const ang = turn * (i % 2 ? 1 : -1) * 0.5;
      const dx = b.x - W / 2, dy = b.y - H / 2;
      const x = W / 2 + dx * Math.cos(ang) - dy * Math.sin(ang) + 26 * Math.sin(t * 0.35 + b.seed);
      const y = H / 2 + dx * Math.sin(ang) + dy * Math.cos(ang) + 22 * Math.cos(t * 0.3 + b.seed * 1.3);
      const g = ctx.createLinearGradient(x - b.r, y - b.r, x + b.r, y + b.r);
      b.c.forEach(([o, col]) => g.addColorStop(o, col));
      ctx.fillStyle = g;
      if (b.head) {
        ctx.beginPath();
        ctx.arc(x, y + 250, b.r, Math.PI, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
      } else ctx.fill(blobPath(x, y, b.r, b.seed, t, 0.09 + wob * 0.002));
    });
    ctx.restore();
    const pp = paperPath(paperScale, t, wob);
    ctx.save();
    ctx.shadowColor = 'rgba(25,10,45,0.38)';
    ctx.shadowBlur = 60;
    ctx.shadowOffsetY = 18;
    ctx.fillStyle = C.paper;
    ctx.fill(pp);
    ctx.restore();
    return pp;
  }

  /* ---------- SDF ring for the merge ---------- */
  function sdfRing(k, dL, dR, K, alpha) {
    const s = k.s;
    const [lx, cy] = toScreen(k, 649.5 - dL, 642), [rx] = toScreen(k, 1118 + dR, 642);
    const RoL = 353 * s, RiL = 287 * s, RoR = 285 * s, RiR = 219 * s, KK = K * s;
    const x0 = Math.max(0, Math.floor(lx - RoL - 4)), x1 = Math.min(W, Math.ceil(rx + RoR + 4));
    const y0 = Math.max(0, Math.floor(cy - RoL - 4)), y1 = Math.min(H, Math.ceil(cy + RoL + 4));
    const w = x1 - x0, h = y1 - y0;
    if (w <= 0 || h <= 0) return;
    const im = bctx.createImageData(w, h), d = im.data;
    const smin = (a, b) => { const hh = Math.max(KK - Math.abs(a - b), 0) / KK; return Math.min(a, b) - hh * hh * KK * 0.25; };
    for (let y = 0; y < h; y++) {
      const py = y0 + y + 0.5 - cy, py2 = py * py;
      for (let x = 0; x < w; x++) {
        const px = x0 + x + 0.5;
        const dl = Math.sqrt((px - lx) * (px - lx) + py2), dr = Math.sqrt((px - rx) * (px - rx) + py2);
        const o = smin(dl - RoL, dr - RoR), i = smin(dl - RiL, dr - RiR);
        const sd = Math.max(o, -i);
        const a = sd > 1 ? 0 : sd < -1 ? 1 : 0.5 - sd * 0.5;
        const idx = (y * w + x) * 4;
        d[idx] = d[idx + 1] = d[idx + 2] = 255;
        d[idx + 3] = a * 255;
      }
    }
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    bctx.clearRect(0, 0, W, H);
    bctx.putImageData(im, x0, y0);
    bctx.globalCompositeOperation = 'source-in';
    applyCam(bctx, k);
    bctx.fillStyle = logoGrad(bctx);
    bctx.fillRect(-2000, -2000, 6000, 6000);
    bctx.globalCompositeOperation = 'source-over';
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = alpha;
    ctx.drawImage(buf, 0, 0);
    ctx.restore();
  }

  // exact ring, revealed by two arms that start at the top of the neck and meet at the bottom
  function ringDraw(k, p, alpha = 1, shadow = true) {
    if (p <= 0.001 || alpha <= 0.001) return;
    const { L, Lb } = CL;
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    bctx.clearRect(0, 0, W, H);
    applyCam(bctx, k);
    bctx.fillStyle = logoGrad(bctx);
    bctx.fill(P.ring, 'evenodd');
    if (p < 0.999) {
      bctx.globalCompositeOperation = 'destination-in';
      const b1 = p * Lb, a2 = L - p * (L - Lb);
      bctx.setLineDash([b1, Math.max(0, a2 - b1), L - a2, L]);
      bctx.lineWidth = 124;
      bctx.strokeStyle = '#fff';
      bctx.stroke(P.center);
      bctx.setLineDash([]);
      bctx.globalCompositeOperation = 'source-over';
    }
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = alpha;
    if (shadow) { ctx.shadowColor = 'rgba(40,20,60,0.2)'; ctx.shadowBlur = 28; ctx.shadowOffsetY = 10; }
    ctx.drawImage(buf, 0, 0);
    ctx.restore();
  }

  /* ---------- VALUE smiles ---------- */
  const SMILES = (() => {
    const out = [], pp = paperPath(1, 0, 0), sp = 92;
    for (let row = 0, y = 150; y < 1000; y += sp * 0.866, row++) {
      for (let x = 230 + (row % 2) * sp / 2; x < 1700; x += sp) {
        if (!ctx.isPointInPath(pp, x, y)) continue;
        if (x > 400 && x < 1520 && y > 250 && y < 760) continue;
        const dd = Math.hypot(x - W / 2, y - 520);
        out.push({ x, y, d: dd, r: 13 + 5 * ((x * 7 + y * 3) % 5) / 5, col: gradAt((x - 230) / 1470), ph: (x * 0.013 + y * 0.021) % (Math.PI * 2) });
      }
    }
    // assign ring targets: sort both sets by angle around the centre so paths rarely cross
    const fk = FIN_CAM();
    const n = out.length;
    const targets = [];
    for (let i = 0; i < n; i++) {
      const p = CL.pts[Math.floor((i / n) * CL.pts.length)];
      const [x, y] = toScreen(fk, p.x, p.y);
      targets.push({ x, y, s: p.s });
    }
    const ang = (x, y) => Math.atan2(y - 520, x - W / 2);
    const so = out.slice().sort((a, b) => ang(a.x, a.y) - ang(b.x, b.y));
    const st = targets.slice().sort((a, b) => ang(a.x, a.y) - ang(b.x, b.y));
    so.forEach((s, i) => {
      s.tx = st[i].x; s.ty = st[i].y;
      const pa = st[i].s < CL.Lb ? st[i].s / CL.Lb : (CL.L - st[i].s) / (CL.L - CL.Lb);
      s.ta = 23.0 + 1.25 * (Math.acos(1 - 2 * clamp(pa)) / Math.PI);
    });
    return out;
  })();
  function FIN_CAM() { return cam(0.5, 850, 787.5, W / 2, 540); }
  function smilePos(s, t) {
    const tt = Math.min(t, 22.6);
    const wave = (tt - 19.9) * 780;
    const hop = wave > 0 ? bump(s.d, wave, 70) + (tt > 21.0 ? bump(s.d, (tt - 21.0) * 780, 70) : 0) : 0;
    return [s.x + 4 * Math.sin(tt * 1.6 + s.ph), s.y + 5 * Math.sin(tt * 2 + s.ph) - 26 * hop, hop];
  }

  /* ---------- scenes ---------- */
  function sceneOpening(t) {
    // camera drifts from the heads down to the whole mark
    const kc = E.inOut3(seg(t, 3.6, 5.6));
    const zoom = E.in3(seg(t, 7.55, 9.3));
    let k = cam(lerp(0.8, 0.55, kc), 850, lerp(300, 573, kc), W / 2, lerp(470, 500, kc));
    if (zoom > 0) {
      const s = k.s * Math.pow(12, zoom);
      k = cam(s, lerp(850, 905, E.inOut3(seg(t, 7.55, 8.6))), lerp(573, 642, E.inOut3(seg(t, 7.55, 8.6))), W / 2, 500);
    }
    // separation of the two "people"
    const hop = seg(t, 2.55, 3.15);
    let dUnit = lerp(430, 270, E.inOut3(hop));
    dUnit = lerp(dUnit, 0, E.inOut3(seg(t, 5.25, 6.75)));
    const hopY = -70 * 4 * hop * (1 - hop);

    // ring: arcs drawn around each person, then merged
    const draw = E.inOut3(seg(t, 4.05, 5.1));
    const merged = seg(t, 6.7, 7.0);
    if (draw > 0) {
      if (t < 5.25) {
        applyCam(ctx, k);
        ctx.save();
        ctx.lineWidth = 66;
        ctx.strokeStyle = logoGrad(ctx);
        ctx.shadowColor = 'rgba(40,20,60,0.16)'; ctx.shadowBlur = 24 * k.s; ctx.shadowOffsetY = 8;
        [[649.5 - dUnit, 320], [1118 + dUnit, 252]].forEach(([cx, R]) => {
          ctx.beginPath();
          ctx.arc(cx, 642, R, -Math.PI / 2 - draw * Math.PI, -Math.PI / 2 + draw * Math.PI);
          ctx.stroke();
        });
        ctx.restore();
      } else if (merged < 1) {
        sdfRing(k, dUnit, dUnit, 70, 1);
      }
      if (merged > 0) ringDraw(k, 1, merged, false);
    }

    // heads
    const circ = 1 - E.inOut3(seg(t, 4.0, 4.7));
    [[HEAD_L, C.dotL, 0.45, -1], [HEAD_R, C.dotR, 0.7, 1]].forEach(([hd, col, t0, side]) => {
      const dr = drop(t, t0, 1.25, 900);
      if (!dr.visible) return;
      const land = hop > 0 && hop < 1 ? 0 : bump(t, 3.17, 0.05) * 0.16;
      const bx = hd[0] + side * dUnit, by = hd[1];
      applyCam(ctx, k);
      const [sx, sy] = toScreen(k, bx, by);
      if (zoom < 0.05) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        contactShadow(ctx, sx, sy + 4, 90 * k.s, (1 - circ < 1 ? 1 : 0) * clamp(1 + (dr.y + hopY) / 400) * (1 - seg(t, 3.9, 4.3)));
        applyCam(ctx, k);
      }
      head(ctx, bx, by + dr.y + hopY, circ, dr.sx * (1 + land * 0.9), dr.sy * (1 - land), col);
    });

    // captions
    chars('人と人との、つながり。', F.mincho(46), 12, W / 2, 700, C.ink, i => mixST(softIn(t, 1.5 + i * 0.06), softOut(t, 3.55 + i * 0.02)));
    chars('縁が、輪になる。', F.mincho(46), 12, W / 2, 900, C.ink, i => mixST(softIn(t, 5.3 + i * 0.07), softOut(t, 7.2 + i * 0.02)));
  }

  function sceneTexts(t) {
    // 「そこは、自由な場所。」
    chars('そこは、自由な場所。', F.mincho(54), 14, W / 2, 575, C.ink, i => mixST(softIn(t, 8.75 + i * 0.07, 0.8), softOut(t, 9.75 + i * 0.015, 0.35)));
  }

  function label(t, t0, t1, en, jp) {
    const inK = i => softIn(t, t0 + i * 0.04, 0.6, 10);
    const outK = () => softOut(t, t1, 0.4, 10);
    const lay = layout(en, F.label(40), 9);
    chars(en, F.label(40), 9, W / 2 - 60, 318, (i, c) => gradAt((c.cx + lay.total / 2) / lay.total), i => mixST(inK(i), outK()));
    const x = W / 2 - 60 + lay.total / 2 + 70;
    chars(jp, F.gothic(21), 5, x, 316, C.muted, i => mixST(inK(i + 3), outK()));
    // small dot, like the poster's section marker
    const a = mixST(inK(0), outK()).a;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = a;
    const gx = W / 2 - 60 - lay.total / 2 - 26;
    const g = ctx.createLinearGradient(gx - 7, 0, gx + 7, 0);
    g.addColorStop(0, '#073f8e'); g.addColorStop(1, '#d81718');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(gx, 303, 7, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function sceneMission(t) {
    const T0 = 10.0, T1 = 13.75;
    label(t, T0 + 0.05, T1, 'MISSION', '存在意義');
    // warm light behind 灯
    const glow = E.out3(seg(t, 10.35, 11.8)) * (1 - seg(t, T1, T1 + 0.45));
    if (glow > 0) {
      const lay = layout('灯す、ゆとり', F.minchoB(128), 14);
      const gx = W / 2 - 40 + lay.chars[0].cx, gy = 500;
      const r = 300 * glow * (1 + 0.03 * Math.sin(t * 7) + 0.02 * Math.sin(t * 11.3));
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
      g.addColorStop(0, `rgba(255,196,150,${0.75 * glow})`);
      g.addColorStop(0.45, `rgba(255,170,150,${0.28 * glow})`);
      g.addColorStop(1, 'rgba(255,170,150,0)');
      ctx.fillStyle = g;
      ctx.fillRect(gx - r, gy - r, r * 2, r * 2);
      ctx.restore();
    }
    const lay = chars('灯す、ゆとり', F.minchoB(128), 14, W / 2 - 40, 548, C.ink, i => mixST(softIn(t, 10.3 + i * 0.13, 0.9, 24), softOut(t, T1 + i * 0.02)));
    // the full stop is the logo ring
    const pk = seg(t, 11.15, 11.9), po = softOut(t, T1 + 0.1);
    if (pk > 0) {
      const x = W / 2 - 40 + lay.total / 2 + 64, y = 526;
      const s = 0.07 * E.outBack(pk, 2.2);
      const k = cam(s, 850, 642, x, y + po.dy);
      ringDraw(k, E.inOut3(clamp(pk * 1.3)), po.a, false);
    }
    chars('選べる余白を、目の前の一人ひとりに。', F.mincho(38), 8, W / 2, 668, C.ink, i => mixST(softIn(t, 11.4 + i * 0.03), softOut(t, T1 + 0.05)));
  }

  function sceneVision(t) {
    const T0 = 14.2, T1 = 17.95;
    label(t, T0 + 0.05, T1, 'VISION', '最終目標');
    chars('世界一ゆるい会社', F.minchoB(128), 16, W / 2, 548, C.ink, (i, n) => {
      const k = seg(t, 14.4 + i * 0.1, 15.3 + i * 0.1);
      const e = E.outBack(k, 2.6);
      const sway = seg(t, 14.9 + i * 0.1, 15.6 + i * 0.1);
      const loose = i >= 3 && i <= 5 ? 1.6 : 1; // ゆるい sways the most
      const base = mixST({ a: E.out3(clamp(k * 1.6)), dy: -46 * (1 - e), blur: 8 * (1 - E.out3(k)) }, softOut(t, T1 + i * 0.02));
      base.rot = sway * loose * 0.055 * Math.sin(t * 2.3 + i * 0.9);
      base.dy += sway * loose * 7 * Math.sin(t * 2.6 + i * 1.1);
      return base;
    });
    chars('決めすぎない、詰めすぎない。', F.mincho(38), 10, W / 2, 668, C.ink, i => mixST(softIn(t, 15.5 + i * 0.035), softOut(t, T1 + 0.05)));
  }

  function sceneValue(t) {
    const T0 = 18.4, T1 = 22.2;
    label(t, T0 + 0.05, T1, 'VALUE', '行動基準');
    chars('Thanks Make', F.serif(132), 2, W / 2, 548, C.ink, i => mixST(softIn(t, 18.6 + i * 0.055, 0.8, 22), softOut(t, T1 + i * 0.015)));
    chars('ありがとうを生み出す', F.mincho(40), 12, W / 2, 668, C.ink, i => mixST(softIn(t, 19.25 + i * 0.04), softOut(t, T1 + 0.05)));
  }

  function drawSmiles(t) {
    if (t < 18.8) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    SMILES.forEach(s => {
      const k = seg(t, 18.9 + s.d / 1500, 19.45 + s.d / 1500);
      if (k <= 0) return;
      let [x, y, hop] = smilePos(s, t);
      let sc = E.outBack(k, 2.4);
      if (t > 22.6) {
        const f0 = Math.max(22.6, s.ta - 1.05);
        const f = E.inOut3(seg(t, f0, s.ta));
        const nx = -(s.ty - y), ny = s.tx - x, nl = Math.hypot(nx, ny) || 1;
        const arc = Math.sin(Math.PI * f) * 90;
        x = lerp(x, s.tx, f) + (nx / nl) * arc;
        y = lerp(y, s.ty, f) + (ny / nl) * arc;
        sc *= 1 - E.in3(seg(t, s.ta - 0.18, s.ta + 0.02));
        if (t > s.ta + 0.02) return;
      }
      smile(ctx, x, y, s.r, s.col, sc * (1 + 0.25 * hop), sc * (1 - 0.2 * hop));
    });
    ctx.restore();
  }

  function sceneFinale(t) {
    const k = FIN_CAM();
    const fade = 1 - E.inOut3(seg(t, 27.15, 27.95));
    if (fade <= 0) return;
    // ring assembles as the smiles arrive
    const p = E.inOutSine(seg(t, 23.0, 24.25));
    ringDraw(k, p, fade);
    // heads drop in, then smile together
    const blink = bump(t, 26.25, 0.09);
    [[HEAD_L, C.dotL, 23.85], [HEAD_R, C.dotR, 24.02]].forEach(([hd, col, t0]) => {
      const dr = drop(t, t0, 1.0, 620, 0.26);
      if (!dr.visible) return;
      ctx.save();
      applyCam(ctx, k);
      ctx.globalAlpha = fade;
      ctx.shadowColor = 'rgba(40,20,60,0.2)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 8;
      head(ctx, hd[0], hd[1] + dr.y, 0, dr.sx * (1 + blink * 0.12), dr.sy * (1 - blink * 0.38), col);
      ctx.restore();
    });
    // wordmark rises out of its baseline
    ctx.save();
    applyCam(ctx, k);
    ctx.globalAlpha = fade;
    ctx.beginPath();
    ctx.rect(150, 1080, 1400, MAIN_BASE - 1080 + 1);
    ctx.clip();
    const iHit = drop(t, 25.0, 0.8, 150, 0.3);
    D.main.forEach((m, i) => {
      const e = E.out5(seg(t, 24.35 + i * 0.05, 25.05 + i * 0.05));
      ctx.save();
      ctx.translate(0, 180 * (1 - e));
      if (i === 6 && iHit.k > 0 && iHit.k < 1) {
        const sq = bounceSquash(iHit.k) * 0.25;
        const cx = m.x + m.w / 2;
        ctx.translate(cx, MAIN_BASE); ctx.scale(1 + sq * 0.5, 1 - sq); ctx.translate(-cx, -MAIN_BASE);
      }
      ctx.fillStyle = C.mark;
      ctx.fill(P.main[i], 'evenodd');
      ctx.restore();
    });
    ctx.restore();
    // i-dot, the red smile, lands last
    if (iHit.visible) {
      ctx.save();
      applyCam(ctx, k);
      ctx.globalAlpha = fade * clamp(iHit.k * 6);
      const hb = bump(t, 26.33, 0.08);
      smile(ctx, IDOT[0], IDOT[1] + iHit.y - 18 * hb, IDOT_R, C.idot, iHit.sx, iHit.sy);
      ctx.restore();
    }
    // WELFARE COMPANY tracks in
    ctx.save();
    applyCam(ctx, k);
    D.sub.forEach((m, i) => {
      const e = E.out5(seg(t, 25.15 + i * 0.03, 26.0 + i * 0.03));
      if (e <= 0) return;
      ctx.save();
      ctx.globalAlpha = e * fade;
      ctx.translate(((m.x + m.w / 2) - 846) * 0.3 * (1 - e), 0);
      ctx.fillStyle = C.mark;
      ctx.fill(P.sub[i], 'evenodd');
      ctx.restore();
    });
    ctx.restore();
  }

  /* ---------- frame ---------- */
  function render(t) {
    t = ((t % TOTAL) + TOTAL) % TOTAL;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.filter = 'none';
    ctx.fillStyle = C.paper;
    ctx.fillRect(0, 0, W, H);

    // the colored world appears around the free space from 8.5s to 23.7s
    if (t > 8.45 && t < 23.8) {
      const inK = E.inOut3(seg(t, 8.45, 9.9));
      const outK = E.in3(seg(t, 22.55, 23.75));
      const scale = lerp(6, 1, inK) * lerp(1, 6, outK);
      const turn = E.inOut3(seg(t, 13.9, 14.7)) + E.inOut3(seg(t, 18.1, 18.9));
      const wob = t < 14.1 ? 12 : t < 18.2 ? lerp(12, 26, seg(t, 14.1, 14.8)) : lerp(26, 14, seg(t, 18.2, 18.9));
      drawWorld(t, scale, wob, turn);
    }
    if (t < 10) sceneOpening(t);
    if (t > 8.5 && t < 10.2) sceneTexts(t);
    if (t > 9.9 && t < 14.4) sceneMission(t);
    if (t > 14.1 && t < 18.6) sceneVision(t);
    if (t > 18.3 && t < 22.8) sceneValue(t);
    drawSmiles(t);
    if (t > 22.5) sceneFinale(t);

    // finishing: soft vignette and film grain
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
    v.addColorStop(0, 'rgba(30,20,50,0)');
    v.addColorStop(1, 'rgba(30,20,50,0.14)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.085;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(grains[Math.floor(t * 24) % grains.length], 0, 0, W, H);
    ctx.restore();
  }

  window.FILM = { render, TOTAL, W, H };
})();
