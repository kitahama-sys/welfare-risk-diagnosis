  /* ================= v6: neon / digital, authored on the 120 BPM grid ================= */
  const BG = '#05061a';
  const NEON = { b: '#2f6bff', p: '#a24bff', r: '#ff2d55', L: '#b25cff', R: '#ff3b6b' };
  const NSTOPS = [[0, '#2f6bff'], [0.45, '#9a4dff'], [1, '#ff2d55']];
  const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const DG = s => `400 ${s}px "Dela Gothic One", sans-serif`;
  const BC = s => `800 ${s}px "Barlow Condensed", sans-serif`;
  function neonGrad(c) { const g = c.createLinearGradient(296, 0, 1404, 0); NSTOPS.forEach(([o, col]) => g.addColorStop(o, col)); return g; }
  const neonAt = u => {
    u = clamp(u);
    const seg2 = u < 0.45 ? [NSTOPS[0], NSTOPS[1], u / 0.45] : [NSTOPS[1], NSTOPS[2], (u - 0.45) / 0.55];
    const a = hex(seg2[0][1]), b = hex(seg2[1][1]);
    return `rgb(${a.map((v, j) => Math.round(lerp(v, b[j], seg2[2]))).join(',')})`;
  };
  const S0 = () => ctx.setTransform(1, 0, 0, 1, 0, 0);
  function flash(t, t0, amt = 0.6, col = '#fff', decay = 9) {
    if (t < t0) return;
    const a = Math.exp(-(t - t0) * decay) * amt;
    if (a < 0.01) return;
    ctx.save(); S0(); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  function shock(x, y, t, t0, color, maxR, width = 14, dur = 0.55) {
    const k = seg(t, t0, t0 + dur);
    if (k <= 0 || k >= 1) return;
    ctx.save(); S0();
    ctx.globalAlpha = 0.8 * (1 - E.in2(k));
    ctx.strokeStyle = color; ctx.lineWidth = width * (1 - k) + 1;
    ctx.shadowColor = color; ctx.shadowBlur = 30;
    ctx.beginPath(); ctx.arc(x, y, maxR * E.out3(k), 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  function darkBg(t, glow = 0.5, tint = null) {
    S0();
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W / 2, H * 0.55, 0, W / 2, H * 0.55, 1100);
    g.addColorStop(0, tint || `rgba(70,50,190,${0.35 * glow})`); g.addColorStop(1, 'rgba(5,6,26,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // moving grid
    ctx.save();
    ctx.strokeStyle = 'rgba(110,130,255,0.075)'; ctx.lineWidth = 1;
    const off = (t * 48) % 96;
    ctx.beginPath();
    for (let x = -96 + (off * 0.5) % 96; x < W + 96; x += 96) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = -96 + off; y < H + 96; y += 96) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();
    ctx.restore();
  }
  function orb(x, y, col, r, sx = 1, sy = 1, circ = 1, glow = 1) {
    ctx.save(); S0();
    ctx.shadowColor = col; ctx.shadowBlur = 55 * glow;
    head(ctx, x, y, circ, sx, sy, col, r);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.35 * glow;
    head(ctx, x, y, circ, sx * 0.72, sy * 0.72, '#ffffff', r);
    ctx.restore();
  }
  function ringNeon(k, p, glowAmt = 1, fill = 'neon', alpha = 1) {
    if (p <= 0.001 || alpha <= 0.001) return;
    const { L, Lb } = CL;
    bctx.setTransform(1, 0, 0, 1, 0, 0); bctx.clearRect(0, 0, W, H);
    applyCam(bctx, k);
    bctx.fillStyle = fill === 'neon' ? neonGrad(bctx) : fill === 'brand' ? logoGrad(bctx) : fill;
    bctx.fill(P.ring, 'evenodd');
    if (p < 0.999) {
      bctx.globalCompositeOperation = 'destination-in';
      const b1 = p * Lb, a2 = L - p * (L - Lb);
      bctx.setLineDash([b1, Math.max(0, a2 - b1), L - a2, L]);
      bctx.lineWidth = 124; bctx.strokeStyle = '#fff'; bctx.stroke(P.center); bctx.setLineDash([]);
      bctx.globalCompositeOperation = 'source-over';
    }
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.save(); S0(); ctx.globalAlpha = alpha;
    if (glowAmt > 0) {
      ctx.shadowColor = 'rgba(150,90,255,0.9)'; ctx.shadowBlur = 50 * glowAmt;
      ctx.drawImage(buf, 0, 0);
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = alpha * 0.25 * glowAmt; ctx.shadowBlur = 0;
    }
    ctx.drawImage(buf, 0, 0);
    ctx.restore();
  }
  // slam-in type
  const slam = (t, t0, d = 0.14, from = 1.7) => { const k = seg(t, t0, t0 + d), e = E.out5(k); return { a: k > 0 ? 1 : 0, sc: lerp(from, 1, e) }; };
  function bigChars(str, font, ls, x, y, fill, glow, fn) {
    ctx.save();
    if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 34; }
    const r = chars(str, font, ls, x, y, fill, fn);
    ctx.restore();
    return r;
  }
  function strokeWord(str, font, x, y, strokeStyle, alpha, lw = 3) {
    ctx.save(); S0();
    ctx.globalAlpha = alpha; ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = lw; ctx.strokeStyle = strokeStyle; ctx.strokeText(str, x, y);
    ctx.restore();
  }

  /* ---------- 0–6: COUNT DOWN → ZERO → ring ---------- */
  const K_RING = () => cam(0.62, 850, 573, W / 2, 520);
  function sceneIntro(t) {
    darkBg(t, 0.5 + 0.5 * seg(t, 3, 4));
    // countdown numerals on the bar's beats
    [['3', 0.0], ['2', 1.0], ['1', 2.0]].forEach(([n, t0]) => {
      const k = seg(t, t0, t0 + 1.0);
      if (k <= 0 || k >= 1) return;
      const sc = lerp(1.25, 1, E.out5(seg(t, t0, t0 + 0.15)));
      const jit = t - t0 < 0.1 ? (hash(Math.floor(t * 60)) - 0.5) * 40 : 0;
      ctx.save(); S0();
      ctx.translate(W / 2 + jit, H / 2 + 20); ctx.scale(sc, sc);
      ctx.font = BC(820); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const g = ctx.createLinearGradient(-250, 0, 250, 0); NSTOPS.forEach(([o, c]) => g.addColorStop(o, c));
      ctx.globalAlpha = (1 - E.in2(k)) * 0.9;
      ctx.lineWidth = 8; ctx.strokeStyle = g; ctx.shadowColor = '#8a65ff'; ctx.shadowBlur = 45;
      ctx.strokeText(n, 0, 0);
      ctx.globalAlpha = (1 - E.in2(k)) * 0.16; ctx.fillStyle = g; ctx.fillText(n, 0, 0);
      ctx.restore();
    });
    const ground = 660, R = 70;
    const k2 = K_RING();
    const d = 300 * (1 - E.in3(seg(t, 3.5, 4.0)));
    const up = E.out3(seg(t, 3.0, 3.4));
    const circ = 1 - E.inOut3(seg(t, 3.2, 3.5));
    [[NEON.L, 0.5 - 0.8 / 2.75, 720, HEAD_L, -1], [NEON.R, 1.5 - 0.8 / 2.75, 1200, HEAD_R, 1]].forEach(([col, t0, x0, hd, side]) => {
      const dr = drop(t, t0, 0.8, 900, 0.4);
      if (!dr.visible) return;
      // anticipation, then charge into each other on "ZERO"
      const ant = seg(t, 2.0, 2.5), ch = E.in3(seg(t, 2.5, 3.0));
      let x = x0 - side * 60 * E.out3(ant) * (1 - ch) + (W / 2 - side * R - x0) * ch;
      let y = ground + dr.y;
      let sx = dr.sx * (1 + 0.15 * ant * (1 - ch)), sy = dr.sy * (1 - 0.12 * ant * (1 - ch));
      if (ch > 0 && ch < 1) { sx *= 1 + 0.35 * ch; sy *= 1 - 0.25 * ch; }
      const [tx, ty] = toScreen(k2, hd[0] + side * d, hd[1]);
      x = lerp(x, tx, up); y = lerp(y, ty, up);
      const r = lerp(R, HEAD_R0 * k2.s, up);
      if (up <= 0) { ctx.save(); S0(); contactShadow(ctx, x, ground + 4, 110, 0.6 * clamp(1 + dr.y / 400)); ctx.restore(); }
      orb(x, y, col, r, sx, sy, circ);
    });
    // circles burst out of the collision, then slam into one ring on the downbeat
    const draw = E.out3(seg(t, 3.0, 3.5));
    if (draw > 0) {
      if (t < 3.5) {
        ctx.save(); applyCam(ctx, k2);
        ctx.lineWidth = 66; ctx.strokeStyle = neonGrad(ctx); ctx.shadowColor = 'rgba(150,90,255,0.9)'; ctx.shadowBlur = 40;
        [[649.5 - d, 320], [1118 + d, 252]].forEach(([cx, Rr]) => { ctx.beginPath(); ctx.arc(cx, 642, Rr, -Math.PI / 2 - draw * Math.PI, -Math.PI / 2 + draw * Math.PI); ctx.stroke(); });
        ctx.restore();
      } else if (t < 4.0) {
        // reuse SDF merge with neon colors: draw then tint
        sdfRing(k2, d, d, 70, 1);
      }
    }
    shock(W / 2 - 400, ground, t, 0.5, NEON.L, 220); shock(W / 2 + 240, ground, t, 1.5, NEON.R, 220);
    shock(W / 2, ground - R, t, 3.0, '#ffffff', 900, 22, 0.7);
    flash(t, 3.0, 0.55);
    // ZERO
    if (t >= 3.0 && t < 4.0) {
      const k = seg(t, 3.0, 4.0);
      strokeWord('ZERO', BC(300), W / 2, 930, 'rgba(255,255,255,0.9)', 1 - E.in2(k), 3);
    }
  }
  function sceneBreak(t) {
    // 4–6: one bar without kick — the new ring hums on the 8ths, then we dive through it
    darkBg(t, 1);
    const k0 = K_RING();
    const push = 1 + 0.12 * seg(t, 4.0, 5.5);
    const dive = E.in3(seg(t, 5.45, 6.0));
    const s = k0.s * push * Math.pow(18, dive);
    const k = cam(s, lerp(850, 905, dive), lerp(573, 642, dive), W / 2, 520);
    const ph = ((t - 4.0) % 0.25) / 0.25;
    const pulse = Math.exp(-ph * 5) * (0.4 + 0.8 * seg(t, 4.0, 5.8));
    ringNeon(k, 1, 1 + pulse * 1.5);
    const kick = t < 4.3 ? 1 + 0.08 * Math.exp(-(t - 4) * 10) * Math.sin((t - 4) * 40) : 1;
    [[HEAD_L, NEON.L], [HEAD_R, NEON.R]].forEach(([hd, col]) => {
      const [x, y] = toScreen(k, hd[0], hd[1]);
      orb(x, y, col, HEAD_R0 * k.s, kick, 2 - kick, 0, 1 + pulse);
    });
    const [cx, cy] = toScreen(k0, 905, 642);
    shock(cx, cy, t, 4.0, '#ffffff', 950, 24, 0.7);
    flash(t, 4.0, 0.5);
  }

  /* ---------- 6–10: MISSION ---------- */
  function sceneMission(t) {
    darkBg(t, 0.7);
    strokeWord('MISSION', BC(600), W / 2 + 500 - (t - 6) * 260, 540, 'rgba(160,140,255,0.16)', 1, 3);
    const lay = layout('灯す、ゆとり', DG(170), 10);
    const x0 = W / 2 - 60, gx = x0 + lay.chars[0].cx, gy = 480;
    // the light
    const b = seg(t, 6.0, 6.9), out = seg(t, 9.6, 9.9);
    if (b > 0) {
      const beat = Math.exp(-(((t - 6) % 0.5) / 0.5) * 4) * 0.25;
      const r = lerp(1400, 460, E.out3(b)) * (1 + beat);
      const a = (b < 0.1 ? b / 0.1 : 1 - 0.4 * E.out3((b - 0.1) / 0.9)) * (1 - out);
      ctx.save(); S0(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
      g.addColorStop(0, `rgba(255,240,220,${a})`); g.addColorStop(0.25, `rgba(255,120,160,${0.5 * a})`);
      g.addColorStop(0.6, `rgba(120,80,255,${0.25 * a})`); g.addColorStop(1, 'rgba(60,40,200,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // sparks
      const sk = seg(t, 6.0, 7.4);
      for (let i = 0; i < 60; i++) {
        const ang = hash(i) * Math.PI * 2, v = 400 + hash(i + 50) * 1100;
        const dd = v * (1 - Math.exp(-sk * 3)) / 3 * 1.4;
        ctx.globalAlpha = (1 - sk) * (1 - out);
        ctx.fillStyle = i % 3 ? '#fff0e0' : neonAt(hash(i + 9));
        ctx.fillRect(gx + Math.cos(ang) * dd, gy + Math.sin(ang) * dd, 3 + hash(i + 90) * 5, 3 + hash(i + 90) * 5);
      }
      ctx.restore();
    }
    const hits = [6.0, 6.25, 6.5, 7.0, 7.25, 7.5];
    bigChars('灯す、ゆとり', DG(170), 10, x0, 560, '#ffffff', 'rgba(255,200,230,0.6)', i => {
      const s = slam(t, hits[i]);
      const o = seg(t, 9.6 + i * 0.03, 9.85 + i * 0.03);
      return { a: s.a * (1 - o), sc: s.sc * (1 + 0.4 * o), dy: -30 * o };
    });
    const pk = seg(t, 7.75, 7.95);
    if (pk > 0) {
      const s = 0.105 * lerp(1.7, 1, E.out5(pk)) * (1 + 0.4 * out);
      ringNeon(cam(s, 850, 642, x0 + lay.total / 2 + 90, 522), 1, 1, '#ffffff', 1 - out);
    }
    // the two, dropping in under 灯 and bouncing on every beat
    [[NEON.L, 6.5, -1], [NEON.R, 6.75, 1]].forEach(([col, tc, side]) => {
      const dr = drop(t, tc - 0.6 / 2.75, 0.6, 700, 0.4);
      if (!dr.visible) return;
      const bt = ((t - 7.0) % 0.5 + 0.5) % 0.5 / 0.5;
      const bounce = t > 7.0 ? 4 * bt * (1 - bt) * 22 : 0;
      const sq = t > 7.0 ? Math.exp(-bt * 12) * 0.2 : 0;
      const y = 700 + dr.y - bounce - E.in2(seg(t, 9.5, 9.8)) * 1300;
      orb(gx + side * 62, y, col, 42, dr.sx * (1 + sq), dr.sy * (1 - sq));
    });
    flash(t, 6.0, 0.8);
  }

  /* ---------- 10–14: VISION ---------- */
  function sceneVision(t) {
    const flip = t >= 12.5;
    if (flip) {
      S0();
      const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#ff2d55'); g.addColorStop(1, '#8a1eff');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    } else darkBg(t, 0.6);
    // rows of ゆるい
    ctx.save(); S0();
    ctx.font = DG(140); ctx.textBaseline = 'middle'; ctx.lineWidth = 2;
    for (let r = 0; r < 8; r++) {
      const y = -20 + r * 150, dir = r % 2 ? 1 : -1;
      const off = ((t * 220 * dir + r * 260) % 1350 + 1350) % 1350 - 1350;
      for (let x = off; x < W + 200; x += 675) {
        [...'ゆるい'].forEach((ch, j) => {
          const cx = x + j * 170, cy = y + 14 * Math.sin(t * 6.28 + cx * 0.006 + r);
          ctx.save(); ctx.translate(cx, cy); ctx.rotate(0.07 * Math.sin(t * 6.28 + cx * 0.004 + r));
          ctx.globalAlpha = seg(t, 10.0, 10.3) * (flip ? 0.3 : 0.22);
          ctx.strokeStyle = flip ? '#ffffff' : neonAt(cx / W);
          ctx.strokeText(ch, 0, 0); ctx.restore();
        });
      }
    }
    ctx.restore();
    const melt = seg(t, 13.5, 13.95);
    const fallOf = i => E.in3(clamp((melt - hash(i + 7) * 0.3) / 0.7)) * 900;
    const lay = layout('世界一ゆるい会社', DG(160), 6);
    const hits = [10.0, 10.25, 10.5, 11.0, 11.25, 11.5, 12.0, 12.25];
    const jel = i => {
      const k = seg(t, hits[i], hits[i] + 0.7);
      const jig = Math.exp(-k * 3) * Math.sin(k * 22);
      const beat = ((t - 11.5) % 0.5 + 0.5) % 0.5 / 0.5;
      const groove = t > 12.0 ? Math.exp(-beat * 6) : 0;
      return { jig, groove };
    };
    bigChars('世界一ゆるい会社', DG(160), 6, W / 2, 610, '#ffffff', flip ? null : 'rgba(170,120,255,0.55)', i => {
      const s = slam(t, hits[i]);
      if (i >= 3 && i <= 5) {
        const { jig, groove } = jel(i);
        return { a: s.a, sc: (1 + 0.35 * jig) * (1 + 0.08 * groove), dy: -26 * jig - 10 * groove + fallOf(i), rot: 0.1 * Math.sin(t * 6.28 + i) * seg(t, 11.6, 12.0) + melt * (hash(i) - 0.5) * 1.4 };
      }
      return { a: s.a, sc: s.sc, dy: fallOf(i), rot: melt * (hash(i) - 0.5) * 1.4 };
    });
    [[3, NEON.L, 11.75], [5, NEON.R, 12.0]].forEach(([ci, col, tc]) => {
      const dr = drop(t, tc - 0.6 / 2.75, 0.6, 700, 0.4);
      if (!dr.visible) return;
      const { jig, groove } = jel(ci);
      const y = 468 - 26 * jig - 10 * groove + dr.y + fallOf(ci);
      orb(W / 2 + lay.chars[ci].cx, y, flip ? '#ffffff' : col, 40, dr.sx * (1 + 0.1 * groove), dr.sy * (1 - 0.12 * groove));
    });
    flash(t, 10.0, 0.6); flash(t, 12.5, 0.85);
  }

  /* ---------- 14–19: VALUE ---------- */
  const SMILES = (() => {
    const out = [], sp = 100;
    for (let row = 0, y = 60; y < 1060; y += sp * 0.866, row++) {
      for (let x = 50 + (row % 2) * sp / 2; x < 1890; x += sp) {
        if (x > 230 && x < 1690 && y > 330 && y < 740) continue;
        const n = out.length;
        out.push({ x, y, d: Math.hypot(x - W / 2, y - 330), r: 15 + 7 * hash(n + 3), col: neonAt(x / W), ph: hash(n) * 6.28, dl: hash(n + 11) * 0.25 });
      }
    }
    const fk = FIN_CAM(), n = out.length, targets = [];
    for (let i = 0; i < n; i++) { const p = CL.pts[Math.floor((i / n) * CL.pts.length)]; const [x, y] = toScreen(fk, p.x, p.y); targets.push({ x, y, s: p.s }); }
    const ang = (x, y) => Math.atan2(y - 540, x - W / 2);
    const so = out.slice().sort((a, b) => ang(a.x, a.y) - ang(b.x, b.y));
    const st = targets.slice().sort((a, b) => ang(a.x, a.y) - ang(b.x, b.y));
    so.forEach((s, i) => {
      s.tx = st[i].x; s.ty = st[i].y;
      const pa = st[i].s < CL.Lb ? st[i].s / CL.Lb : (CL.L - st[i].s) / (CL.L - CL.Lb);
      s.ta = 19.35 + 1.15 * (Math.acos(1 - 2 * clamp(pa)) / Math.PI);
    });
    return out;
  })();
  function FIN_CAM() { return cam(0.52, 850, 787.5, W / 2, 540); }
  function smileAt(s, t) {
    const tt = Math.min(t, 19.0);
    const k = seg(tt, 15.0 + s.dl, 15.9 + s.dl), e = E.out5(k);
    const spin = (1 - e) * 1.8, ox = W / 2, oy = 330, ux = s.x - ox, uy = s.y - oy;
    let x = ox + (ux * Math.cos(spin) - uy * Math.sin(spin)) * e;
    let y = oy + (ux * Math.sin(spin) + uy * Math.cos(spin)) * e;
    let hop = 0, lit = 0;
    [16.0, 17.0, 18.0].forEach(w0 => { const wf = (tt - w0) * 1800; if (wf > 0) { const b = bump(s.d, wf, 100); hop += b; lit += b; } });
    const beat = ((tt - 15.0) % 0.5 + 0.5) % 0.5 / 0.5;
    y += -30 * hop - 5 * Math.exp(-beat * 6);
    return { x, y, hop, lit, sc: E.outBack(clamp(k * 1.5), 2.2) };
  }
  function drawSmiles(t) {
    if (t < 15.0 || t > 20.7) return;
    ctx.save(); S0();
    SMILES.forEach(s => {
      let { x, y, hop, lit, sc } = smileAt(s, t);
      if (sc <= 0) return;
      if (t > 19.0) {
        const f0 = Math.max(19.0, s.ta - 0.7), f = E.inOut3(seg(t, f0, s.ta));
        const nx = -(s.ty - y), ny = s.tx - x, nl = Math.hypot(nx, ny) || 1, arc = Math.sin(Math.PI * f) * 150;
        x = lerp(x, s.tx, f) + (nx / nl) * arc; y = lerp(y, s.ty, f) + (ny / nl) * arc;
        sc *= 1 - E.in3(seg(t, s.ta - 0.1, s.ta + 0.02));
        if (t > s.ta + 0.02) return;
      }
      ctx.shadowColor = s.col; ctx.shadowBlur = 22 + 30 * lit;
      smile(ctx, x, y, s.r, lit > 0.3 ? '#ffffff' : s.col, sc * (1 + 0.3 * hop), sc * (1 - 0.25 * hop));
    });
    ctx.restore();
  }
  function sceneValue(t) {
    darkBg(t, 0.8);
    const out = seg(t, 18.75, 19.0);
    const lay = layout('THANKS MAKE', BC(270), 10);
    bigChars('THANKS MAKE', BC(270), 10, W / 2, 640, '#ffffff', 'rgba(170,130,255,0.6)', i => {
      const left = i < 6, t0 = left ? 14.0 : 14.5;
      const k = seg(t, t0 - 0.2, t0), e = E.out5(k);
      const beat = ((t - 15) % 0.5 + 0.5) % 0.5 / 0.5;
      const pump = t > 15 ? 1 + 0.03 * Math.exp(-beat * 8) : 1;
      return { a: k > 0 ? 1 - out : 0, dx: (left ? -1400 : 1400) * (1 - e), sc: pump * (1 + 0.5 * out) };
    });
    // the two land on the text, then high-five on beat 15.0
    [[NEON.L, 14.25, -1], [NEON.R, 14.75, 1]].forEach(([col, tc, side]) => {
      const dr = drop(t, tc - 0.6 / 2.75, 0.6, 800, 0.4);
      if (!dr.visible) return;
      const lean = E.in3(seg(t, 14.8, 15.0)) * (1 - E.out3(seg(t, 15.0, 15.4)));
      let hop = 0;
      [16.0, 17.0, 18.0].forEach(w => { const h = seg(t, w, w + 0.4); if (h > 0 && h < 1) hop += 4 * h * (1 - h); });
      const y = 420 + dr.y - hop * 90 - E.in2(seg(t, 18.5, 18.8)) * 1300;
      const hit = bump(t, 15.0, 0.035);
      orb(W / 2 + side * (80 - 30 * lean), y, col, 44, dr.sx * (1 - hit * 0.3), dr.sy * (1 + hit * 0.2));
    });
    shock(W / 2, 400, t, 15.0, '#ffffff', 1200, 22, 0.8);
    flash(t, 15.0, 0.5);
  }

  /* ---------- 19–28: finale ---------- */
  function sceneFinale(t) {
    const day = t >= 24.0;
    if (day) { S0(); ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H); }
    else darkBg(t, 0.6);
    drawSmiles(t);
    const k0 = FIN_CAM();
    const hold = seg(t, 22.0, 22.4) * (1 - seg(t, 23.95, 24.0)); // the pause dims the world
    const pulse = 1 + 0.05 * Math.exp(-Math.max(0, t - 20.5) * 7) * Math.sin(Math.max(0, t - 20.5) * 26) * (t > 20.5 ? 1 : 0);
    const k = cam(k0.s * pulse, k0.ax, k0.ay, k0.sx, k0.sy);
    const p = E.inOutSine(seg(t, 19.35, 20.5));
    ringNeon(k, p, day ? 0 : 1 - 0.6 * hold, day ? 'brand' : 'neon');
    const [rcx, rcy] = toScreen(k0, 905, 642);
    shock(rcx, rcy, t, 20.5, '#ffffff', 900, 20, 0.6);
    const blink = bump(t, 26.0, 0.08);
    [[HEAD_L, NEON.L, C.dotL, 21.0], [HEAD_R, NEON.R, C.dotR, 21.25]].forEach(([hd, nc, bc, tc]) => {
      const dr = drop(t, tc - 0.7 / 2.75, 0.7, 900, 0.4);
      if (!dr.visible) return;
      const [x, y] = toScreen(k0, hd[0], hd[1]);
      if (day) { ctx.save(); S0(); head(ctx, x, y, 0, dr.sx * (1 + blink * 0.14), dr.sy * (1 - blink * 0.42), bc, HEAD_R0 * k0.s); ctx.restore(); }
      else orb(x, y + dr.y * k0.s, nc, HEAD_R0 * k0.s, dr.sx, dr.sy, 0, 1 - 0.6 * hold);
      shock(x, y, t, tc, nc, 140, 10, 0.4);
    });
    // wordmark
    ctx.save(); applyCam(ctx, k0);
    ctx.beginPath(); ctx.rect(150, 1080, 1400, MAIN_BASE - 1080 + 1); ctx.clip();
    if (!day) { ctx.shadowColor = 'rgba(200,180,255,0.8)'; ctx.shadowBlur = 20 * (1 - 0.6 * hold); }
    const iHitK = seg(t, 24.0, 24.9);
    D.main.forEach((m, i) => {
      const e = E.out5(seg(t, 21.5 + i * 0.04, 21.75 + i * 0.04));
      ctx.save(); ctx.translate(0, 190 * (1 - e));
      if (i === 6 && iHitK > 0 && iHitK < 1) {
        const sq = Math.exp(-iHitK * 9) * 0.3, cx = m.x + m.w / 2;
        ctx.translate(cx, MAIN_BASE); ctx.scale(1 + sq * 0.5, 1 - sq); ctx.translate(-cx, -MAIN_BASE);
      }
      ctx.fillStyle = day ? C.mark : '#ffffff'; ctx.globalAlpha = day ? 1 : 1 - 0.55 * hold;
      ctx.fill(P.main[i], 'evenodd');
      ctx.restore();
    });
    ctx.restore();
    // i-dot: slow fall through the pause, lands on the downbeat of 24.0
    if (t >= 23.0) {
      let y;
      if (t < 24.0) y = -700 * (1 - E.in2(seg(t, 23.0, 24.0)));
      else { const u = t - 24.0; y = -60 * Math.abs(Math.sin(Math.PI * u / 0.32)) * Math.exp(-u * 6) * (u < 0.9 ? 1 : 0); }
      const sq = t >= 24 ? Math.exp(-(t - 24) * 14) * 0.35 : 0;
      const hb = bump(t, 26.08, 0.07);
      ctx.save(); applyCam(ctx, k0);
      if (!day) { ctx.shadowColor = NEON.r; ctx.shadowBlur = 40; }
      smile(ctx, IDOT[0], IDOT[1] + y - 24 * hb, IDOT_R, day ? C.idot : NEON.r, 1 + sq * 0.8, 1 - sq);
      ctx.restore();
    }
    if (day) {
      ctx.save(); applyCam(ctx, k0);
      D.sub.forEach((m, i) => {
        const e = E.out5(seg(t, 24.25 + i * 0.025, 24.8 + i * 0.025));
        if (e <= 0) return;
        ctx.save(); ctx.globalAlpha = e; ctx.translate(((m.x + m.w / 2) - 846) * 0.5 * (1 - e), 0);
        ctx.fillStyle = C.mark; ctx.fill(P.sub[i], 'evenodd'); ctx.restore();
      });
      ctx.restore();
      const [ix, iy] = toScreen(k0, IDOT[0], IDOT[1]);
      shock(ix, iy + 6, t, 24.0, C.idot, 1400, 30, 0.9);
    }
    flash(t, 20.5, 0.4); flash(t, 24.0, 1.0, '#ffffff', 6);
    const outK = E.inOut3(seg(t, 27.2, 27.95));
    if (outK > 0) { ctx.save(); S0(); ctx.globalAlpha = outK; ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  }

  /* ---------- post: shake, RGB split, slice glitch, scanlines, grain ---------- */
  const HITS = [[0.5, 0.5], [1.5, 0.5], [3.0, 1.2], [4.0, 1.2], [6.0, 1.3], [10.0, 0.8], [11.0, 0.4], [12.0, 0.4], [12.5, 1.0], [14.0, 0.7], [14.5, 0.7], [15.0, 1.0], [20.5, 0.8], [21.0, 0.5], [21.25, 0.5], [24.0, 1.4]];
  const GLITCH = [[2.95, 0.2, 0.8], [3.95, 0.2, 0.8], [5.75, 0.3, 1.0], [6.0, 0.12, 0.8], [9.7, 0.3, 1.0], [12.5, 0.12, 0.7], [13.6, 0.4, 1.0], [14.0, 0.1, 0.6], [18.7, 0.3, 1.0], [24.0, 0.14, 0.7]];
  const ch = [mk(), mk(), mk()].map(c => ({ c, x: c.getContext('2d') }));
  const scan = (() => { const c = mk(W, H), x = c.getContext('2d'); x.fillStyle = 'rgba(0,0,0,0.5)'; for (let y = 0; y < H; y += 3) x.fillRect(0, y, W, 1); return c; })();
  function glitchAmt(t) {
    let g = 0;
    GLITCH.forEach(([t0, d, a]) => { if (t >= t0 && t < t0 + d) g = Math.max(g, a * (1 - (t - t0) / d)); });
    return g;
  }
  function post(t) {
    // shake
    let s = 0;
    HITS.forEach(([h, a]) => { if (t > h && t - h < 0.4) s += a * Math.exp(-(t - h) * 12); });
    const g = glitchAmt(t);
    if (s > 0.02 || g > 0.02) {
      bctx.setTransform(1, 0, 0, 1, 0, 0); bctx.clearRect(0, 0, W, H); bctx.drawImage(cv, 0, 0);
      const sx = s * 12 * Math.sin(t * 91), sy = s * 8 * Math.cos(t * 77);
      S0();
      if (g > 0.02) {
        // RGB split
        const off = 18 * g;
        [['#ff0000', -off], ['#00ff00', 0], ['#0000ff', off]].forEach(([col, dx], i) => {
          const c = ch[i].x;
          c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, W, H); c.drawImage(buf, 0, 0);
          c.globalCompositeOperation = 'multiply'; c.fillStyle = col; c.fillRect(0, 0, W, H);
          c.globalCompositeOperation = 'source-over';
        });
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'lighter';
        ch.forEach((c, i) => ctx.drawImage(c.c, sx + (i - 1) * off - W * 0.01, sy - H * 0.01, W * 1.02, H * 1.02));
        ctx.globalCompositeOperation = 'source-over';
        // horizontal slice displacement
        const f = Math.floor(t * 30);
        bctx.clearRect(0, 0, W, H); bctx.drawImage(cv, 0, 0);
        for (let i = 0; i < 9; i++) {
          if (hash(f * 13 + i) > g) continue;
          const y = hash(f * 7 + i) * H, h = 10 + hash(f * 3 + i) * 90, dx = (hash(f * 5 + i) - 0.5) * 220 * g;
          ctx.drawImage(buf, 0, y, W, h, dx, y, W, h);
        }
      } else ctx.drawImage(buf, sx - W * 0.01, sy - H * 0.01, W * 1.02, H * 1.02);
    }
    S0();
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 1.0);
    v.addColorStop(0, 'rgba(0,0,10,0)'); v.addColorStop(1, 'rgba(0,0,10,0.45)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = t >= 24.0 && t < 27.3 ? 0.03 : 0.12; ctx.drawImage(scan, 0, 0); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.1;
    ctx.drawImage(grains[Math.floor(t * 24) % grains.length], 0, 0, W, H); ctx.restore();
  }

  function render(t) {
    t = ((t % TOTAL) + TOTAL) % TOTAL;
    S0(); ctx.globalAlpha = 1; ctx.filter = 'none';
    if (t < 4.0) sceneIntro(t);
    else if (t < 6.0) sceneBreak(t);
    else if (t < 10.0) sceneMission(t);
    else if (t < 14.0) sceneVision(t);
    else if (t < 19.0) { sceneValue(t); drawSmiles(t); }
    else sceneFinale(t);
    post(t);
  }
  window.FILM = { render, TOTAL, W, H };
})();
