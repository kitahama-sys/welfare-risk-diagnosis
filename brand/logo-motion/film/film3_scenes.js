  /* ================= v2: bold cut ================= */
  const DARK = '#0a0f2c';
  const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  function FIN_CAM() { return cam(0.52, 850, 787.5, W / 2, 540); }

  function fillBg(col) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = col; ctx.fillRect(0, 0, W, H); }
  function brandBg(angle = 0.35) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const dx = Math.cos(angle) * W / 2, dy = Math.sin(angle) * W / 2;
    const g = ctx.createLinearGradient(W / 2 - dx, H / 2 - dy, W / 2 + dx, H / 2 + dy);
    g.addColorStop(0, '#0a3a92'); g.addColorStop(0.5, '#6a3a74'); g.addColorStop(1, '#dc1f22');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  function shock(x, y, t, t0, color, maxR, width = 16, dur = 0.65) {
    const k = seg(t, t0, t0 + dur);
    if (k <= 0 || k >= 1) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 0.6 * (1 - E.in2(k));
    ctx.strokeStyle = color;
    ctx.lineWidth = width * (1 - k) + 1;
    ctx.beginPath();
    ctx.ellipse(x, y, maxR * E.out3(k), maxR * E.out3(k) * 0.999, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  // big type that hits the screen: scale from large, sharp stop
  const slam = (t, t0, d = 0.3, from = 1.9) => {
    const k = seg(t, t0, t0 + d), e = E.out5(k);
    return { a: clamp(k * 4), sc: lerp(from, 1, e), blur: 14 * (1 - e) };
  };
  const hitOut = (t, t0, d = 0.3) => {
    const k = seg(t, t0, t0 + d), e = E.in3(k);
    return { a: 1 - e, sc: 1 + 0.6 * e, blur: 16 * e };
  };
  const mixS = (a, b) => ({ a: a.a * b.a, sc: (a.sc || 1) * (b.sc || 1), blur: (a.blur || 0) + (b.blur || 0), dy: (a.dy || 0) + (b.dy || 0), dx: (a.dx || 0) + (b.dx || 0), rot: (a.rot || 0) + (b.rot || 0) });
  function glowChars(str, font, ls, x, y, fill, glow, fn) {
    ctx.save();
    if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 40; }
    const r = chars(str, font, ls, x, y, fill, fn);
    ctx.restore();
    return r;
  }
  function ringFill(k, p, fill, glow, alpha = 1) {
    if (p <= 0.001 || alpha <= 0.001) return;
    const { L, Lb } = CL;
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    bctx.clearRect(0, 0, W, H);
    applyCam(bctx, k);
    bctx.fillStyle = fill === 'grad' ? logoGrad(bctx) : fill;
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
    if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 28; }
    ctx.drawImage(buf, 0, 0);
    ctx.restore();
  }
  function label(t, t0, t1, en, jp, dark) {
    const a = clamp(seg(t, t0, t0 + 0.25)) * (1 - seg(t, t1, t1 + 0.2));
    if (a <= 0) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = a;
    const col = dark ? 'rgba(255,255,255,0.9)' : C.ink;
    ctx.fillStyle = col;
    ctx.fillRect(96, 96, 56 * E.out5(seg(t, t0, t0 + 0.4)), 3);
    ctx.font = F.label(34);
    ctx.letterSpacing = '6px';
    ctx.fillText(en, 170, 110);
    ctx.font = F.gothic(20);
    ctx.letterSpacing = '4px';
    ctx.fillText(jp, 170 + ctx.measureText(en).width + 120, 108);
    ctx.restore();
  }

  /* ----- 1. two people collide (0–3.0) ----- */
  function sceneMeet(t) {
    fillBg(DARK);
    const R = 92, ground = 520;
    const units = [[C.dotL, 0.25, 780, 900], [C.dotR, 0.6, 1140, 1020]];
    const leap = seg(t, 1.42, 1.78), back = E.out3(seg(t, 1.78, 2.3));
    // transition into the ring scene
    const tr = E.inOut3(seg(t, 2.75, 3.25));
    const k2 = cam(0.62, 850, 573, W / 2, 500);
    units.forEach(([col, t0, x0, x1], i) => {
      const dr = drop(t, t0, 0.95, 1000, 0.4);
      if (!dr.visible) return;
      let x = lerp(x0, x1, E.in2(leap));
      if (back > 0) x = lerp(x1, i ? 1060 : 860, back);
      let y = ground + dr.y - 190 * 4 * leap * (1 - leap) * (leap < 1 ? 1 : 0);
      let sx = dr.sx, sy = dr.sy;
      const hit = bump(t, 1.79, 0.05);
      sx *= 1 - hit * 0.3; sy *= 1 + hit * 0.25;
      // into ring-scene head positions
      const hd = i ? HEAD_R : HEAD_L;
      const [tx, ty] = toScreen(k2, hd[0] + (i ? 300 : -300), hd[1]);
      x = lerp(x, tx, tr); y = lerp(y, ty, tr);
      const r = lerp(R, HEAD_R0 * k2.s, tr);
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.shadowColor = col; ctx.shadowBlur = 60 * (1 - tr);
      head(ctx, x, y, 1, sx, sy, col, r);
      ctx.restore();
    });
    shock(W / 2 - 180, ground, t, 0.25 + 0.95 / 2.75, 'rgba(255,255,255,0.8)', 260);
    shock(W / 2 + 180, ground, t, 0.6 + 0.95 / 2.75, 'rgba(255,255,255,0.8)', 260);
    shock(W / 2, ground - R, t, 1.79, '#ffffff', 520, 22, 0.8);
    // flash at collision
    const fl = Math.exp(-Math.max(0, t - 1.79) * 10) * (t > 1.79 ? 1 : 0);
    if (fl > 0.01) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = fl * 0.28; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  }

  /* ----- 2. circles slam into one ring (3.0–6.3) ----- */
  function sceneRing(t) {
    fillBg(DARK);
    const zoom = E.in3(seg(t, 5.55, 6.3));
    let k = cam(0.62, 850, 573, W / 2, 500);
    if (zoom > 0) k = cam(0.62 * Math.pow(16, zoom), lerp(850, 905, zoom), lerp(573, 642, zoom), W / 2, 500);
    const d = 300 * (1 - E.in3(seg(t, 4.2, 4.62)));
    const draw = E.inOut3(seg(t, 3.2, 3.7));
    const merged = t > 4.62;
    ctx.save();
    if (!merged) {
      if (t < 4.2) {
        applyCam(ctx, k);
        ctx.lineWidth = 66;
        ctx.strokeStyle = logoGrad(ctx);
        ctx.shadowColor = 'rgba(140,90,255,0.55)'; ctx.shadowBlur = 40;
        [[649.5 - d, 320], [1118 + d, 252]].forEach(([cx, Rr]) => {
          ctx.beginPath();
          ctx.arc(cx, 642, Rr, -Math.PI / 2 - draw * Math.PI, -Math.PI / 2 + draw * Math.PI);
          ctx.stroke();
        });
      } else sdfRing(k, d, d, 70, 1);
    } else {
      const pulse = 1 + 0.06 * Math.exp(-(t - 4.62) * 8) * Math.sin((t - 4.62) * 30);
      const kk = cam(k.s * pulse, k.ax, k.ay, k.sx, k.sy);
      ringFill(kk, 1, 'grad', 'rgba(150,90,255,0.35)');
    }
    ctx.restore();
    const circ = 1 - E.inOut3(seg(t, 3.15, 3.5));
    [[HEAD_L, C.dotL, -1], [HEAD_R, C.dotR, 1]].forEach(([hd, col, side]) => {
      const pop = bump(t, 4.64, 0.06);
      ctx.save();
      applyCam(ctx, k);
      ctx.shadowColor = col; ctx.shadowBlur = 40;
      head(ctx, hd[0] + side * d, hd[1] - 40 * pop, circ, 1 + pop * 0.2, 1 - pop * 0.2, col);
      ctx.restore();
    });
    const [cx, cy] = toScreen(k, 905, 642);
    shock(cx, cy, t, 4.62, '#ffffff', 900, 26, 0.8);
    const fl = t > 4.62 ? Math.exp(-(t - 4.62) * 9) : 0;
    if (fl > 0.01) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = fl * 0.25; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  }

  /* ----- 3. punch through to the free space (6.3–7.7) ----- */
  function sceneFree(t) {
    fillBg(C.paper);
  }

  /* ----- 4. MISSION (7.6–12.0) ----- */
  const SPARKS = Array.from({ length: 46 }, (_, i) => ({ a: hash(i) * Math.PI * 2, v: 500 + hash(i + 50) * 900, r: 3 + hash(i + 90) * 6 }));
  function sceneMission(t) {
    brandBg(0.35 + (t - 7.6) * 0.04);
    // giant outline word drifting behind
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = F.label(560);
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.strokeText('MISSION', 260 - (t - 7.6) * 170, 560);
    ctx.restore();
    label(t, 7.75, 11.6, 'MISSION', '存在意義', true);
    const lay = layout('灯す、ゆとり', F.minchoB(180), 6);
    const gx = W / 2 - 50 + lay.chars[0].cx, gy = 500;
    // light bursts when 灯 lands
    const b = seg(t, 8.12, 8.9);
    if (b > 0) {
      const settle = 1 - seg(t, 11.5, 11.9);
      const r = lerp(1200, 420, E.out3(b)) * (1 + 0.03 * Math.sin(t * 9));
      const a = (b < 0.15 ? b / 0.15 : 1 - 0.45 * E.out3((b - 0.15) / 0.85)) * settle;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'screen';
      const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
      g.addColorStop(0, `rgba(255,230,190,${a})`);
      g.addColorStop(0.35, `rgba(255,170,120,${0.55 * a})`);
      g.addColorStop(1, 'rgba(255,140,120,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      const sk = seg(t, 8.12, 9.6);
      SPARKS.forEach(s => {
        const dd = s.v * (1 - Math.exp(-sk * 3)) / 3 * 1.3;
        const al = (1 - sk) * settle;
        if (al <= 0) return;
        ctx.globalAlpha = al;
        ctx.fillStyle = '#ffe2c0';
        ctx.beginPath();
        ctx.arc(gx + Math.cos(s.a) * dd, gy + Math.sin(s.a) * dd, s.r * (1 - sk * 0.5), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }
    glowChars('灯す、ゆとり', F.minchoB(180), 6, W / 2 - 50, 560, '#ffffff', 'rgba(255,220,190,0.5)', i => mixS(slam(t, 8.05 + (i ? 0.35 + i * 0.12 : 0), 0.3, 2.4), hitOut(t, 11.55 + i * 0.02)));
    const pk = seg(t, 9.1, 9.5), po = hitOut(t, 11.65);
    if (pk > 0) {
      const s = 0.1 * E.outBack(pk, 2.6) * po.sc;
      ringFill(cam(s, 850, 642, W / 2 - 50 + lay.total / 2 + 80, 528), 1, '#ffffff', 'rgba(255,255,255,0.5)', po.a);
    }
    glowChars('選べる余白を、目の前の一人ひとりに。', F.mincho(46), 10, W / 2, 700, '#ffffff', null, i => mixS(softIn(t, 9.5 + i * 0.025, 0.5, 14), hitOut(t, 11.6)));
  }

  /* ----- 5. VISION (12.0–16.5) ----- */
  function sceneVision(t) {
    const flip = t > 14.55;
    if (flip) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#b3203d'); g.addColorStop(1, '#e3261f');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    } else fillBg(C.paper);
    // rows of ゆるい, sliding and swaying
    const rowsIn = E.out3(seg(t, 12.1, 12.6));
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = F.minchoB(150);
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 2.5;
    const word = 'ゆるい　';
    for (let r = 0; r < 8; r++) {
      const y = -30 + r * 160;
      const dir = r % 2 ? 1 : -1;
      const off = ((t * 140 * dir + r * 230) % 1440 + 1440) % 1440 - 1440;
      for (let x = off; x < W + 200; x += 720) {
        [...word].forEach((ch, j) => {
          const cx = x + j * 170, cy = y + 16 * Math.sin(t * 2.6 + cx * 0.006 + r);
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(0.08 * Math.sin(t * 2.2 + cx * 0.004 + r * 1.3));
          ctx.globalAlpha = rowsIn * (flip ? 0.35 : 0.3);
          if (flip) { ctx.strokeStyle = '#ffffff'; }
          else { const g = ctx.createLinearGradient(-80, 0, 80, 0); g.addColorStop(0, gradAt(cx / W)); g.addColorStop(1, gradAt(cx / W + 0.08)); ctx.strokeStyle = g; }
          ctx.strokeText(ch, 0, 0);
          ctx.restore();
        });
      }
    }
    ctx.restore();
    label(t, 12.15, 16.2, 'VISION', '最終目標', flip);
    const ink = flip ? '#ffffff' : C.ink;
    const melt = seg(t, 16.05, 16.5);
    const common = (i, st) => {
      if (melt > 0) {
        const m = E.in3(clamp((melt - hash(i + 7) * 0.3) / 0.7));
        st.dy = (st.dy || 0) + m * 900;
        st.rot = (st.rot || 0) + m * (hash(i) - 0.5) * 1.4;
      }
      return st;
    };
    const lay = layout('世界一ゆるい会社', F.minchoB(178), 4);
    glowChars('世界一ゆるい会社', F.minchoB(178), 4, W / 2, 610, ink, null, i => {
      let st;
      if (i < 3) st = slam(t, 12.35 + i * 0.08, 0.3, 2.2);
      else if (i < 6) {
        const k = seg(t, 12.85 + (i - 3) * 0.1, 13.6 + (i - 3) * 0.1);
        const jig = Math.exp(-k * 3) * Math.sin(k * 22);
        st = { a: clamp(k * 5), sc: 1 + 0.35 * jig, dy: -30 * jig };
        const sway = seg(t, 13.3, 13.9);
        st.rot = sway * 0.12 * Math.sin(t * 3 + i);
        st.dy += sway * 18 * Math.sin(t * 3.4 + i * 1.2);
        st.sc *= 1 + sway * 0.06 * Math.sin(t * 4 + i);
      } else st = slam(t, 13.55 + (i - 6) * 0.08, 0.3, 2.2);
      return common(i, st);
    });
    glowChars('決めすぎない、詰めすぎない。', F.mincho(48), 12, W / 2, 770, ink, null, i => common(i + 20, softIn(t, 14.75 + i * 0.03, 0.45, 14)));
    // flip flash
    const fl = t > 14.55 ? Math.exp(-(t - 14.55) * 12) : 0;
    if (fl > 0.01) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = fl * 0.35; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    return lay;
  }

  /* ----- 6. VALUE (16.5–21.5) ----- */
  const SMILES = (() => {
    const out = [], sp = 104;
    for (let row = 0, y = 60; y < 1060; y += sp * 0.866, row++) {
      for (let x = 50 + (row % 2) * sp / 2; x < 1890; x += sp) {
        if (x > 250 && x < 1670 && y > 360 && y < 770) continue;
        const n = out.length;
        out.push({ x, y, d: Math.hypot(x - W / 2, y - 540), r: 15 + 7 * hash(n + 3), col: gradAt(x / W), ph: hash(n) * 6.28, dl: hash(n + 11) * 0.3 });
      }
    }
    const fk = FIN_CAM(), n = out.length, targets = [];
    for (let i = 0; i < n; i++) {
      const p = CL.pts[Math.floor((i / n) * CL.pts.length)];
      const [x, y] = toScreen(fk, p.x, p.y);
      targets.push({ x, y, s: p.s });
    }
    const ang = (x, y) => Math.atan2(y - 540, x - W / 2);
    const so = out.slice().sort((a, b) => ang(a.x, a.y) - ang(b.x, b.y));
    const st = targets.slice().sort((a, b) => ang(a.x, a.y) - ang(b.x, b.y));
    so.forEach((s, i) => {
      s.tx = st[i].x; s.ty = st[i].y;
      const pa = st[i].s < CL.Lb ? st[i].s / CL.Lb : (CL.L - st[i].s) / (CL.L - CL.Lb);
      s.ta = 21.75 + 0.95 * (Math.acos(1 - 2 * clamp(pa)) / Math.PI);
    });
    return out;
  })();
  function smileAt(s, t) {
    const tt = Math.min(t, 21.3);
    const k = seg(tt, 17.25 + s.dl, 18.2 + s.dl), e = E.out5(k);
    const spin = (1 - e) * 1.6;
    const vx = s.x - W / 2, vy = s.y - 540;
    let x = W / 2 + (vx * Math.cos(spin) - vy * Math.sin(spin)) * e;
    let y = 540 + (vx * Math.sin(spin) + vy * Math.cos(spin)) * e;
    let hop = 0;
    [18.55, 19.35, 20.15].forEach(w0 => { const wf = (tt - w0) * 1500; if (wf > 0) hop += bump(s.d, wf, 90); });
    y += 5 * Math.sin(tt * 3 + s.ph) - 34 * hop;
    return { x, y, hop, sc: E.outBack(clamp(k * 1.5), 2.2) };
  }
  function sceneValue(t) {
    fillBg(DARK);
    label(t, 16.6, 21.2, 'VALUE', '行動基準', true);
    const lay = layout('Thanks Make', F.serif(210), 0);
    glowChars('Thanks Make', F.serif(210), 0, W / 2, 610, '#ffffff', 'rgba(255,255,255,0.35)', i => {
      const left = i < 6;
      const k = seg(t, left ? 16.62 : 16.95, (left ? 16.62 : 16.95) + 0.35), e = E.out5(k);
      return mixS({ a: clamp(k * 4), dx: (left ? -500 : 500) * (1 - e), blur: 18 * (1 - e) }, hitOut(t, 21.05 + i * 0.015, 0.25));
    });
    glowChars('ありがとうを生み出す', F.mincho(52), 14, W / 2, 745, '#ffffff', null, i => mixS(softIn(t, 17.7 + i * 0.035, 0.45, 14), hitOut(t, 21.05)));
    shock(W / 2, 560, t, 17.25, 'rgba(255,255,255,0.7)', 1100, 20, 0.8);
  }
  function drawSmiles(t) {
    if (t < 17.2 || t > 22.8) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    SMILES.forEach(s => {
      let { x, y, hop, sc } = smileAt(s, t);
      if (sc <= 0) return;
      if (t > 21.3) {
        const f0 = Math.max(21.3, s.ta - 0.75);
        const f = E.inOut3(seg(t, f0, s.ta));
        const nx = -(s.ty - y), ny = s.tx - x, nl = Math.hypot(nx, ny) || 1;
        const arc = Math.sin(Math.PI * f) * 140;
        x = lerp(x, s.tx, f) + (nx / nl) * arc;
        y = lerp(y, s.ty, f) + (ny / nl) * arc;
        sc *= 1 - E.in3(seg(t, s.ta - 0.12, s.ta + 0.02));
        if (t > s.ta + 0.02) return;
      }
      ctx.shadowColor = s.col; ctx.shadowBlur = t < 21.5 ? 18 : 0;
      smile(ctx, x, y, s.r, s.col, sc * (1 + 0.3 * hop), sc * (1 - 0.25 * hop));
    });
    ctx.restore();
  }

  /* ----- 7. FINALE (21.3–28) ----- */
  function sceneFinale(t) {
    // white opens from the centre over the dark value scene
    const open = E.in3(seg(t, 21.3, 21.8));
    if (open < 1) {
      fillBg(DARK);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = C.paper;
      ctx.beginPath(); ctx.arc(W / 2, H / 2, 1200 * open, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    } else fillBg(C.paper);
    drawSmiles(t);
    const k0 = FIN_CAM();
    const pulse = 1 + 0.05 * Math.exp(-Math.max(0, t - 22.72) * 7) * Math.sin(Math.max(0, t - 22.72) * 26);
    const k = cam(k0.s * pulse, k0.ax, k0.ay, k0.sx, k0.sy);
    const p = E.inOutSine(seg(t, 21.75, 22.7));
    ringFill(k, p, 'grad', null);
    const [rcx, rcy] = toScreen(k0, 905, 642);
    shock(rcx, rcy, t, 22.72, 'rgba(90,60,140,0.55)', 700, 18, 0.7);
    const blink = bump(t, 25.9, 0.08);
    [[HEAD_L, C.dotL, 22.85], [HEAD_R, C.dotR, 23.0]].forEach(([hd, col, t0]) => {
      const dr = drop(t, t0, 0.8, 900, 0.4);
      if (!dr.visible) return;
      ctx.save();
      applyCam(ctx, k0);
      head(ctx, hd[0], hd[1] + dr.y, 0, dr.sx * (1 + blink * 0.14), dr.sy * (1 - blink * 0.42), col);
      ctx.restore();
      const [hx, hy] = toScreen(k0, hd[0], hd[1]);
      shock(hx, hy, t, t0 + 0.8 / 2.75, col, 150, 10, 0.5);
    });
    ctx.save();
    applyCam(ctx, k0);
    ctx.beginPath();
    ctx.rect(150, 1080, 1400, MAIN_BASE - 1080 + 1);
    ctx.clip();
    const iHit = drop(t, 24.15, 0.75, 420, 0.4);
    D.main.forEach((m, i) => {
      const e = E.out5(seg(t, 23.45 + i * 0.035, 23.85 + i * 0.035));
      ctx.save();
      ctx.translate(0, 190 * (1 - e));
      if (i === 6 && iHit.k > 0 && iHit.k < 1) {
        const sq = bounceSquash(iHit.k) * 0.3, cx = m.x + m.w / 2;
        ctx.translate(cx, MAIN_BASE); ctx.scale(1 + sq * 0.5, 1 - sq); ctx.translate(-cx, -MAIN_BASE);
      }
      ctx.fillStyle = C.mark;
      ctx.fill(P.main[i], 'evenodd');
      ctx.restore();
    });
    ctx.restore();
    if (iHit.visible) {
      ctx.save();
      applyCam(ctx, k0);
      const hb = bump(t, 25.98, 0.07);
      smile(ctx, IDOT[0], IDOT[1] + iHit.y - 24 * hb, IDOT_R, C.idot, iHit.sx, iHit.sy);
      ctx.restore();
      const [ix, iy] = toScreen(k0, IDOT[0], IDOT[1]);
      shock(ix, iy + 6, t, 24.15 + 0.75 / 2.75, C.idot, 260, 12, 0.7);
    }
    ctx.save();
    applyCam(ctx, k0);
    D.sub.forEach((m, i) => {
      const e = E.out5(seg(t, 24.55 + i * 0.025, 25.2 + i * 0.025));
      if (e <= 0) return;
      ctx.save();
      ctx.globalAlpha = e;
      ctx.translate(((m.x + m.w / 2) - 846) * 0.5 * (1 - e), 0);
      ctx.fillStyle = C.mark;
      ctx.fill(P.sub[i], 'evenodd');
      ctx.restore();
    });
    ctx.restore();
    // close to dark for the loop
    const out = E.inOut3(seg(t, 27.2, 27.95));
    if (out > 0) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = out; ctx.fillStyle = DARK; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  }

  const HITS = [0.25 + 0.95 / 2.75, 0.6 + 0.95 / 2.75, 1.79, 4.62, 6.35, 6.75, 8.12, 12.35, 13.55, 14.55, 17.25, 22.72, 22.85 + 0.29, 24.15 + 0.27];
  const HIT_AMP = [0.5, 0.5, 1, 1.2, 0.5, 0.5, 0.9, 0.5, 0.5, 0.7, 0.8, 0.8, 0.5, 0.6];
  function shake(t) {
    let s = 0;
    HITS.forEach((h, i) => { if (t > h && t - h < 0.5) s += HIT_AMP[i] * Math.exp(-(t - h) * 11); });
    return [s * 6 * Math.sin(t * 91), s * 4 * Math.cos(t * 77)];
  }

  const SKIP0 = 6.3, SKIP = 1.05, LEN = TOTAL - SKIP;
  function render(t) {
    t = ((t % LEN) + LEN) % LEN;
    if (t >= SKIP0) t += SKIP;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.filter = 'none';
    if (t < 3.0) sceneMeet(t);
    else if (t < 6.3) sceneRing(t);
    else if (t < 7.6) sceneFree(t);
    if (t >= 7.35 && t < 12.0) {
      // the gradient panel slides in over the white
      const w = E.inOut3(seg(t, 7.35, 7.62));
      if (w > 0) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.beginPath(); ctx.rect(W * (1 - w), 0, W * w + 1, H); ctx.clip();
        sceneMission(t);
        ctx.restore();
      }
    }
    if (t >= 11.75 && t < 16.5) {
      const w = E.inOut3(seg(t, 11.75, 12.02));
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.beginPath(); ctx.rect(0, H * (1 - w), W, H * w + 1); ctx.clip();
      sceneVision(t);
      ctx.restore();
    }
    if (t >= 16.5 && t < 21.8) sceneValue(t);
    if (t >= 16.5 && t < 21.3) drawSmiles(t);
    if (t >= 21.3) sceneFinale(t);

    const [sx, sy] = shake(t);
    if (Math.abs(sx) + Math.abs(sy) > 0.3) {
      bctx.setTransform(1, 0, 0, 1, 0, 0);
      bctx.clearRect(0, 0, W, H);
      bctx.drawImage(cv, 0, 0);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(buf, sx - W * 0.015, sy - H * 0.015, W * 1.03, H * 1.03);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 1.05);
    v.addColorStop(0, 'rgba(10,5,30,0)');
    v.addColorStop(1, 'rgba(10,5,30,0.28)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.1;
    ctx.drawImage(grains[Math.floor(t * 24) % grains.length], 0, 0, W, H);
    ctx.restore();
  }

  window.FILM = { render, TOTAL: LEN, W, H };
})();
