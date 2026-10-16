  /* ================= seminar waiting loop: chapters after the v4 opener (28s–244s) ================= */
  const LOOP = 244;
  const DARK = '#0a0f2c';
  const INK = C.ink, MUTED = '#6a6774';
  const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const S0 = () => ctx.setTransform(1, 0, 0, 1, 0, 0);
  const QR = window.QR_DATA || [];

  function fillBg(col) { S0(); ctx.fillStyle = col; ctx.fillRect(0, 0, W, H); }
  function darkBg(t) {
    fillBg(DARK);
    const g = ctx.createRadialGradient(W / 2, H * 0.5, 0, W / 2, H * 0.5, 1000);
    g.addColorStop(0, 'rgba(80,60,170,0.28)'); g.addColorStop(1, 'rgba(10,15,44,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  function brandBg(angle) {
    S0();
    const dx = Math.cos(angle) * W / 2, dy = Math.sin(angle) * W / 2;
    const g = ctx.createLinearGradient(W / 2 - dx, H / 2 - dy, W / 2 + dx, H / 2 + dy);
    g.addColorStop(0, '#0a3a92'); g.addColorStop(0.5, '#6a3a74'); g.addColorStop(1, '#dc1f22');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  const vis = (t, t0, t1, d = 0.7, rise = 16) => mixST(softIn(t, t0, d, rise), softOut(t, t1, 0.5, 12));
  function line(str, font, x, y, color, st, align = 'center', ls = 0) {
    if (!st || st.a <= 0.003) return;
    ctx.save(); S0();
    ctx.globalAlpha = clamp(st.a);
    if (st.blur > 0.3) ctx.filter = `blur(${st.blur.toFixed(1)}px)`;
    ctx.font = font; ctx.letterSpacing = ls + 'px'; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = color;
    ctx.fillText(str, x + (st.dx || 0), y + (st.dy || 0));
    ctx.restore();
  }
  function para(t, lines, font, x, y, lh, color, t0, stagger, t1, align = 'center', ls = 0) {
    lines.forEach((s, i) => line(s, font, x, y + i * lh, color, vis(t, t0 + i * stagger, t1), align, ls));
  }
  // centered big text drawn char by char, with a whole-line scale (for "title moves up" moves)
  function title(str, font, ls, x, y, scale, fill, fn) {
    const lay = layout(str, font, ls);
    lay.chars.forEach((c, i) => {
      const st = fn(i, lay.chars.length) || {};
      const a = st.a == null ? 1 : st.a;
      if (a <= 0.003) return;
      ctx.save(); S0();
      ctx.globalAlpha = clamp(a);
      if (st.blur > 0.3) ctx.filter = `blur(${st.blur.toFixed(1)}px)`;
      if (st.glow) { ctx.shadowColor = st.glow; ctx.shadowBlur = 30; }
      ctx.translate(x + c.cx * scale + (st.dx || 0), y + (st.dy || 0) * scale);
      if (st.rot) ctx.rotate(st.rot);
      const sc = scale * (st.sc == null ? 1 : st.sc);
      ctx.scale(sc, sc);
      ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = typeof fill === 'function' ? fill(i, c) : fill;
      ctx.fillText(c.ch, 0, 0);
      ctx.restore();
    });
    return lay;
  }
  function ringSolid(k, fill, alpha = 1, glow = null) {
    if (alpha <= 0.003) return;
    bctx.setTransform(1, 0, 0, 1, 0, 0); bctx.clearRect(0, 0, W, H);
    applyCam(bctx, k);
    bctx.fillStyle = fill === 'grad' ? logoGrad(bctx) : fill;
    bctx.fill(P.ring, 'evenodd');
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.save(); S0(); ctx.globalAlpha = alpha;
    if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 30; }
    ctx.drawImage(buf, 0, 0); ctx.restore();
  }
  function pal(x, y, col, r = 40, sx = 1, sy = 1, glow = null) {
    ctx.save(); S0();
    if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 30; }
    head(ctx, x, y, 0, sx, sy, col, r);
    ctx.restore();
  }
  // a little hop on a given beat; returns [dy, sx, sy]
  function hopAt(t, t0, h = 40, d = 0.42) {
    const k = seg(t, t0, t0 + d);
    if (k <= 0 || k >= 1) { const land = bump(t, t0 + d, 0.04) * 0.18; return [0, 1 + land, 1 - land]; }
    return [-h * 4 * k * (1 - k), 0.94, 1.08];
  }
  // pair of heads resting somewhere and breathing to the 120 BPM pulse
  function pair(t, x, y, cols, alpha = 1, r = 40, gap = 52, hops = [], glow = null) {
    if (alpha <= 0.003) return;
    const beat = ((t % 0.5) + 0.5) % 0.5 / 0.5;
    const breathe = Math.exp(-beat * 6) * 0.05;
    [-1, 1].forEach((side, i) => {
      let dy = 0, sx = 1 + breathe, sy = 1 - breathe;
      hops.forEach(h => { const [a, b, c] = hopAt(t, h + i * 0.08); dy += a; sx *= b; sy *= c; });
      ctx.save(); ctx.globalAlpha = alpha;
      pal(x + side * gap, y + dy, cols[i], r, sx, sy, glow);
      ctx.restore();
    });
  }

  /* ---------- A. LOGO STORY 28–50 ---------- */
  function chLogoStory(t) {
    fillBg(C.paper);
    const out = 1 - seg(t, 49.3, 50.0);
    const k = cam(0.5, 850, 573, 560, 560);
    // warm "free space" light inside the ring
    const sp = seg(t, 35.2, 37.5) * out;
    if (sp > 0) {
      const [cx, cy] = toScreen(k, 905, 642);
      ctx.save(); S0();
      const r = 260 * E.out3(sp) * (1 + 0.04 * Math.sin(t * 2.4));
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, `rgba(255,205,170,${0.6 * sp})`); g.addColorStop(1, 'rgba(255,205,170,0)');
      ctx.fillStyle = g; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      for (let i = 0; i < 3; i++) {
        const ph = ((t - 35.2) * 0.45 + i / 3) % 1;
        if (t < 35.2) break;
        ctx.globalAlpha = (1 - ph) * 0.35 * sp; ctx.strokeStyle = '#d98a7a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(cx, cy, 60 + ph * 200, (60 + ph * 200) * 0.62, 0, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
    }
    // two rings come together into one
    const d = 240 * (1 - E.inOut3(seg(t, 29.6, 32.6)));
    const ain = seg(t, 28.2, 29.2) * out;
    if (t < 32.8) sdfRing(k, d, d, 70, ain);
    if (t > 32.4) ringDraw(k, 1, seg(t, 32.4, 32.8) * out, true);
    const hopsL = [44.0, 45.0, 46.0], hopsR = [44.08, 45.08, 46.08];
    [[HEAD_L, C.dotL, -1, 28.5, hopsL], [HEAD_R, C.dotR, 1, 28.7, hopsR]].forEach(([hd, col, side, t0, hops]) => {
      const dr = drop(t, t0, 0.9, 500, 0.25);
      if (!dr.visible) return;
      let dy = 0, sx = dr.sx, sy = dr.sy;
      hops.forEach(h => { const [a, b, c] = hopAt(t, h, 60); dy += a; sx *= b; sy *= c; });
      ctx.save(); applyCam(ctx, k); ctx.globalAlpha = out;
      head(ctx, hd[0] + side * d, hd[1] + dr.y + dy, 0, sx, sy, col);
      ctx.restore();
    });
    // smiles of the people around: users, customers, members, families
    if (t > 42.2) {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + 0.3, rr = 330 + 40 * hash(i);
        const x = 560 + Math.cos(a) * rr * 1.15, y = 560 + Math.sin(a) * rr * 0.85;
        const kk = seg(t, 42.6 + i * 0.12, 43.1 + i * 0.12);
        const sc = Math.max(E.outBack(kk, 2.4), 0) * out;
        if (sc <= 0) continue;
        const bob = 6 * Math.sin(t * 3 + i);
        smile(ctx, x, y + bob, 16 + 6 * hash(i + 4), gradAt((x - 200) / 720), sc, sc);
      }
    }
    const X = 1000;
    para(t, ['人と人との繋がりを、', '円（縁）がつながるカタチに。'], F.minchoB(54), X, 500, 86, INK, 29.2, 0.5, 34.6, 'left', 4);
    para(t, ['縁が輪になり、', '自由な空間をつくる。'], F.minchoB(54), X, 500, 86, INK, 35.4, 0.5, 41.6, 'left', 4);
    line('そして、笑顔を。', F.minchoB(54), X, 470, INK, vis(t, 42.4, 49.2), 'left', 4);
    para(t, ['利用者様・お客様、社内のメンバー、', '家族の皆さまの笑顔を創り出す。'], F.mincho(34), X, 570, 58, INK, 43.4, 0.4, 49.2, 'left', 3);
  }

  /* ---------- B. MISSION 50–80 ---------- */
  function chMission(t) {
    fillBg(C.paper);
    const w = E.inOut3(seg(t, 50.0, 50.6));
    ctx.save(); S0(); ctx.beginPath(); ctx.rect(W * (1 - w), 0, W * w + 1, H); ctx.clip();
    brandBg(0.35 + (t - 50) * 0.01);
    ctx.font = F.label(560); ctx.textBaseline = 'middle'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.strokeText('MISSION', 1400 - (t - 50) * 30 - 700, 560);
    const up = E.inOut3(seg(t, 56.2, 57.6));
    const sc = lerp(1, 0.7, up), y = lerp(590, 340, up);
    const font = F.minchoB(150), lay = layout('灯す、ゆとり', font, 8);
    const x0 = W / 2 - 50 * sc;
    const out = seg(t, 79.2, 79.8);
    // light behind 灯
    const glow = E.out3(seg(t, 51.0, 52.5)) * (1 - out);
    if (glow > 0) {
      const gx = x0 + lay.chars[0].cx * sc, gy = y - 50 * sc, r = 340 * sc * glow * (1 + 0.03 * Math.sin(t * 5));
      ctx.save(); ctx.globalCompositeOperation = 'screen';
      const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
      g.addColorStop(0, `rgba(255,225,190,${0.75 * glow})`); g.addColorStop(0.45, `rgba(255,170,140,${0.3 * glow})`); g.addColorStop(1, 'rgba(255,170,140,0)');
      ctx.fillStyle = g; ctx.fillRect(gx - r, gy - r, r * 2, r * 2); ctx.restore();
    }
    ctx.restore();
    if (w < 1) return;
    title('灯す、ゆとり', font, 8, x0, y, sc, '#ffffff', i => mixST(softIn(t, 51.0 + i * 0.16, 0.9, 26), softOut(t, 79.2 + i * 0.02)));
    const pk = seg(t, 52.2, 52.9);
    if (pk > 0) ringSolid(cam(0.085 * sc * E.outBack(pk, 2), 850, 642, x0 + (lay.total / 2) * sc + 62 * sc, y - 44 * sc), '#ffffff', 1 - out, 'rgba(255,255,255,0.5)');
    line('選べる余白を、目の前の一人ひとりに。', F.mincho(46), W / 2, 470, '#ffffff', vis(t, 57.6, 79.2), 'center', 6);
    para(t, ['私たちの福祉が、だれかの人生を大きく変えなくてもかまわない。', '大切なのは、関わるすべての人の「ゆとり」をそっと灯し続けること。'],
      F.mincho(34), W / 2, 630, 64, 'rgba(255,255,255,0.94)', 58.8, 0.6, 68.4, 'center', 3);
    para(t, ['私たちは、そんな“選べる日常”の土台になる灯りを、', '利用者さんも、ご家族も、スタッフも、みんなに届けていきます。'],
      F.mincho(34), W / 2, 630, 64, 'rgba(255,255,255,0.94)', 69.0, 0.6, 79.2, 'center', 3);
    // the two: land under 灯, then sit and breathe at the bottom
    const k1 = seg(t, 51.4, 51.9), sit = E.inOut3(seg(t, 56.2, 57.4)), leave = E.in2(seg(t, 79.3, 79.8));
    const gx = x0 + lay.chars[0].cx * sc;
    const px = lerp(gx, W / 2, sit), py = lerp(lerp(-200, 705, E.outBack(k1, 1.2)), 905, sit) - leave * 1300;
    if (k1 > 0) pair(t, px, py, ['#ffffff', '#ffffff'], 1, 40, 52, [60, 62, 64, 66, 68, 70, 72, 74, 76], 'rgba(255,220,200,0.5)');
  }

  /* ---------- C. VISION 80–108 ---------- */
  function chVision(t) {
    fillBg(C.paper);
    const pin = seg(t, 80.0, 80.6);
    const fade = lerp(0.24, 0.09, seg(t, 86, 88)) * pin * (1 - seg(t, 107.2, 107.9));
    ctx.save(); S0(); ctx.font = F.minchoB(140); ctx.textBaseline = 'middle'; ctx.lineWidth = 2.2;
    for (let r = 0; r < 8; r++) {
      const y = -20 + r * 150, dir = r % 2 ? 1 : -1;
      const off = ((t * 60 * dir + r * 260) % 1350 + 1350) % 1350 - 1350;
      for (let x = off; x < W + 200; x += 675) {
        [...'ゆるい'].forEach((ch, j) => {
          const cx = x + j * 170, cy = y + 12 * Math.sin(t * 1.6 + cx * 0.006 + r);
          ctx.save(); ctx.translate(cx, cy); ctx.rotate(0.06 * Math.sin(t * 1.4 + cx * 0.004 + r));
          ctx.globalAlpha = fade; ctx.strokeStyle = gradAt(cx / W); ctx.strokeText(ch, 0, 0); ctx.restore();
        });
      }
    }
    ctx.restore();
    const up = E.inOut3(seg(t, 86.2, 87.6));
    const sc = lerp(1, 0.7, up), y = lerp(600, 340, up);
    const font = F.minchoB(150), lay = layout('世界一ゆるい会社', font, 6);
    const appear = [80.7, 80.9, 81.1, 81.6, 81.8, 82.0, 82.6, 82.8];
    const sway = i => (i >= 3 && i <= 5 ? 1.6 : 0.6) * seg(t, 82.4, 83.2);
    const jel = i => { const k = seg(t, appear[i], appear[i] + 0.8); return Math.exp(-k * 3) * Math.sin(k * 20) * (i >= 3 && i <= 5 ? 1 : 0.3); };
    const dyOf = i => -24 * jel(i) + sway(i) * 9 * Math.sin(t * 2.2 + i * 1.1);
    title('世界一ゆるい会社', font, 6, W / 2, y, sc, INK, i => {
      const s = mixST(softIn(t, appear[i], 0.6, 0), softOut(t, 107.2 + i * 0.02));
      s.dy = (s.dy || 0) + dyOf(i);
      s.sc = 1 + 0.3 * jel(i);
      s.rot = sway(i) * 0.05 * Math.sin(t * 1.9 + i);
      return s;
    });
    line('決めすぎない、詰めすぎない。', F.mincho(46), W / 2, 470, INK, vis(t, 87.6, 107.2), 'center', 6);
    para(t, ['互いの違いも、弱さも、ペースもまるごと抱えて、チームとして進んでいく。', '誰よりも“ゆるく在ること”が、福祉の未来をやわらかく変えていけると信じています。'],
      F.mincho(34), W / 2, 630, 64, INK, 88.8, 0.6, 107.2, 'center', 3);
    // the two ride ゆ and い, then sit at the bottom
    const sit = E.inOut3(seg(t, 86.2, 87.4)), leave = E.in2(seg(t, 107.3, 107.8));
    [[3, C.dotL, 82.0, -1], [5, C.dotR, 82.2, 1]].forEach(([ci, col, t0, side]) => {
      const dr = drop(t, t0, 0.8, 600, 0.3);
      if (!dr.visible) return;
      const rx = W / 2 + lay.chars[ci].cx * sc, ry = y - 150 * sc + dyOf(ci) * sc;
      const bx = W / 2 + side * 52, by = 905;
      const beat = ((t % 0.5) + 0.5) % 0.5 / 0.5, br = Math.exp(-beat * 6) * 0.05 * sit;
      let hy = 0;
      [90, 94, 98, 102].forEach(h => { hy += hopAt(t, h + (side > 0 ? 0.08 : 0))[0]; });
      const x = lerp(rx, bx, sit), yy = lerp(ry + dr.y, by + hy, sit) - leave * 1300 - 4 * 30 * sit * (1 - sit);
      pal(x, yy, col, 40 * lerp(sc, 1, sit), dr.sx * (1 + br), dr.sy * (1 - br));
    });
  }

  /* ---------- D. ゆとり × けじめ ＝ ゆるさ 108–132 ---------- */
  const YUTORI = ['手段は自分で選ぶ', '自分らしさで成果を出す', 'やり切ったら余白の時間をつくる', '“時間”ではなく“価値”を生み出す', '違和感は口に出して伝える', '自分や家族の時間を守る'];
  const KEJIME = ['やるときはやる', '期限と約束は守る', '期待に応える', '成果と進捗をオープンにする', '先回りして動く', '即時連絡'];
  function chFormula(t) {
    const open = E.inOut3(seg(t, 108.0, 108.8));
    fillBg(C.paper);
    ctx.save(); S0(); ctx.beginPath(); ctx.arc(W / 2, H / 2, 1200 * open + 1, 0, Math.PI * 2); ctx.clip();
    darkBg(t);
    ctx.restore();
    const out = 131.3;
    const toks = [['ゆとり', 470, 108.8], ['×', 790, 109.4], ['けじめ', 1100, 109.8], ['＝', 1400, 110.4], ['ゆるさ', 1640, 110.8]];
    toks.forEach(([s, x, t0], i) => {
      const st = mixST(softIn(t, t0, 0.6, 20), softOut(t, out));
      const fill = i === 4 ? (() => { const g = ctx.createLinearGradient(x - 140, 0, x + 140, 0); g.addColorStop(0, '#5d7bff'); g.addColorStop(0.5, '#b25cff'); g.addColorStop(1, '#ff4b5c'); return g; })() : (i % 2 ? 'rgba(255,255,255,0.6)' : '#ffffff');
      line(s, F.minchoB(i % 2 ? 70 : 92), x, 320, fill, st, 'center', 6);
    });
    const list = (items, x, t0, col) => items.forEach((s, i) => {
      const st = vis(t, t0 + i * 0.5, out, 0.6, 12);
      line(s, F.mincho(34), x + 30, 440 + i * 66, 'rgba(255,255,255,0.92)', st, 'left', 2);
      if (st.a > 0.01) { ctx.save(); S0(); ctx.globalAlpha = st.a; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x + 8, 428 + i * 66 + (st.dy || 0), 7, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    });
    list(YUTORI, 300, 112.2, '#6f86ff');
    list(KEJIME, 930, 115.6, '#ff5a6e');
    const k1 = seg(t, 111.2, 111.8), leave = E.in2(seg(t, 131.3, 131.8));
    if (k1 > 0) pair(t, 1640, lerp(-200, 228, E.outBack(k1, 1.3)) - leave * 1300, ['#b25cff', '#ff4b6b'], 1, 34, 46, [113, 116, 119, 122, 125, 128], 'rgba(180,120,255,0.6)');
  }

  /* ---------- E. VALUE 132–170 ---------- */
  const VALUES = ['気持ちのいい挨拶を自分からする', 'チームの成果を“自分ごと”として喜ぶ', '感謝のきっかけを“見逃さず”拾いにいく', '何気ない“プラスワン（ひと手間）”をかける', '他責にせず、自分ごとで考え行動する',
    '“まずやってみる”を大切にする', '背景・事情を想像し、受け止める', '言いにくいことほど、相手を思って伝える', '“当たり前”にこそ、ありがとうを伝える', '感謝を行動で返す'];
  const VSMILES = (() => {
    const out = [], sp = 120;
    for (let row = 0, y = 70; y < 1060; y += sp * 0.866, row++) {
      for (let x = 60 + (row % 2) * sp / 2; x < 1880; x += sp) {
        if (x > 330 && x < 1590 && y > 170 && y < 820) continue;
        out.push({ x, y, d: Math.hypot(x - W / 2, y - 540), r: 13 + 6 * hash(out.length + 3), col: gradAt(x / W), ph: hash(out.length) * 6.28 });
      }
    }
    return out;
  })();
  function chValue(t) {
    darkBg(t);
    const out = seg(t, 169.3, 169.9);
    // smiles field: bursts out, then a "thanks" ripple runs through it on each value
    ctx.save(); S0();
    VSMILES.forEach(s => {
      const k = seg(t, 133.4 + s.d / 1600, 134.2 + s.d / 1600);
      if (k <= 0) return;
      let wave = 0;
      for (let i = 0; i < 10; i++) { const wf = (t - (140 + i * 3)) * 1400; if (wf > 0 && wf < 2400) wave += bump(s.d, wf, 110); }
      const sc = E.outBack(k, 2.2) * (1 - out);
      ctx.globalAlpha = 0.55 + 0.45 * clamp(wave);
      ctx.shadowColor = s.col; ctx.shadowBlur = 14 + 20 * wave;
      smile(ctx, s.x, s.y + 4 * Math.sin(t * 2 + s.ph) - 22 * wave, s.r, s.col, sc * (1 + 0.2 * wave), sc * (1 - 0.15 * wave));
    });
    ctx.restore();
    const up = E.inOut3(seg(t, 138.2, 139.6));
    const sc = lerp(1, 0.55, up), y = lerp(570, 280, up);
    title('Thanks Make', F.serif(150), 2, W / 2, y, sc, '#ffffff', i => mixST(softIn(t, 132.4 + i * 0.05, 0.8, 20), softOut(t, 169.3)));
    line('ありがとうを生み出す', F.mincho(lerp(44, 32, up)), W / 2, lerp(680, 345, up), 'rgba(255,255,255,0.9)', vis(t, 133.2, 169.3), 'center', 10);
    VALUES.forEach((v, i) => {
      const t0 = 140 + i * 3, t1 = i === 9 ? 169.2 : t0 + 2.55;
      const st = vis(t, t0, t1, 0.5, 18);
      const num = String(i + 1).padStart(2, '0');
      const g = ctx.createLinearGradient(W / 2 - 70, 0, W / 2 + 70, 0); g.addColorStop(0, '#6f86ff'); g.addColorStop(1, '#ff4b5c');
      line(num, F.label(120), W / 2, 560, g, st, 'center', 4);
      line(v, F.minchoB(56), W / 2, 700, '#ffffff', st, 'center', 4);
    });
    const k1 = seg(t, 139.2, 139.8);
    const hops = Array.from({ length: 10 }, (_, i) => 140 + i * 3);
    if (k1 > 0) pair(t, W / 2, lerp(-200, 448, E.outBack(k1, 1.3)) - E.in2(seg(t, 169.3, 169.8)) * 1300, [C.dotL, C.dotR], 1, 34, 120, hops, 'rgba(180,120,255,0.7)');
  }

  /* ---------- F. 組織デザイン事業 170–234 ---------- */
  const FEATURES = [
    { n: '01', h: ['企業の理念策定から', '現場への浸透まで'], d: ['ヒアリングをもとに経営理念を', '策定し、名刺やWebサイトなど', '理念を表現するツールも制作。'] },
    { n: '02', h: ['組織に「ゆとり」を', 'つくる仕組みを'], d: ['理念と現場をつなぐ', '評価制度や研修の設計を、', 'あらゆる業界へご提案。'] },
    { n: '03', h: ['看護・福祉の', '現場業務をシンプルに'], d: ['請求・経理業務や情報共有を', 'AI・DXで効率化。導入後の', 'アフターフォローまで一貫して。'] },
  ];
  const SERVICES = [
    { s: '組織の内側を強くする', n: 'インナーブランディング', d: '理念策定・人事評価制度・採用基盤・研修設計' },
    { s: '組織の魅力を外へ伝える', n: 'アウターブランディング', d: 'SNS運用からWebサイト制作、各種デザインまで' },
    { s: '業務を効率化・自動化する', n: 'AI導入・DX推進', d: '福祉現場に適したAI・デジタルツールの導入を支援' },
    { s: '新たな価値を創造する', n: '新規事業支援', d: '新規事業の立ち上げから運営まで伴走支援' },
  ];
  function card(x, y, w, h, a) {
    ctx.save(); S0(); ctx.globalAlpha = a;
    ctx.shadowColor = 'rgba(40,20,60,0.18)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 18); ctx.fill();
    ctx.shadowColor = 'transparent';
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#0a3f8e'); g.addColorStop(1, '#d81718');
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x, y + 22, 6, h - 44, 3); ctx.fill();
    ctx.restore();
  }
  function drawQR(x, y, size, a) {
    if (!QR.length || a <= 0.003) return;
    const n = QR.length, pad = 18, cell = (size - pad * 2) / n;
    ctx.save(); S0(); ctx.globalAlpha = a;
    ctx.shadowColor = 'rgba(40,20,60,0.18)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(x, y, size, size, 14); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.fillStyle = '#141318';
    QR.forEach((row, r) => { for (let c = 0; c < n; c++) if (row[c] === '1') ctx.fillRect(x + pad + c * cell, y + pad + r * cell, cell + 0.5, cell + 0.5); });
    ctx.restore();
  }
  function chOrg(t) {
    const open = E.inOut3(seg(t, 169.8, 171.0)), close = E.in3(seg(t, 233.0, 234.0));
    const scale = lerp(6, 1, open) * lerp(1, 6, close);
    drawWorld(t, scale, 12, 0.2 * Math.sin(t * 0.05));
    if (open < 0.5) return;
    const OUT = 233.0;
    // F1 title
    const eg = ctx.createLinearGradient(W / 2 - 200, 0, W / 2 + 200, 0); eg.addColorStop(0, '#0a3f8e'); eg.addColorStop(1, '#d81718');
    line('ORGANIZATION DESIGN', F.label(40), W / 2, 395, eg, vis(t, 171.2, 181.4), 'center', 10);
    title('組織デザイン事業', F.minchoB(110), 8, W / 2, 535, 1, INK, i => mixST(softIn(t, 171.5 + i * 0.1, 0.8, 22), softOut(t, 181.4)));
    line('その理念は、現場で生きているか。', F.mincho(46), W / 2, 650, INK, vis(t, 172.9, 181.4), 'center', 6);
    // F2 lead
    para(t, ['企業経営の軸となる「理念」の策定から、', '一人ひとりが目的を持って働ける組織のデザインに尽力。', '評価制度や研修制度の設計、ブランディングツールの制作、', 'AI・DXを活用した業務改善の仕組みづくりまで。'],
      F.mincho(40), W / 2, 420, 76, INK, 182.2, 0.9, 193.6, 'center', 3);
    // F3 three features
    line('3つの特徴', F.gothic(30), W / 2, 300, MUTED, vis(t, 194.4, 210.8), 'center', 8);
    FEATURES.forEach((f, i) => {
      const x = 560 + i * 400, t0 = 195.0 + i * 4.2;
      const st = vis(t, t0, 210.8, 0.7, 18);
      const g = ctx.createLinearGradient(x - 60, 0, x + 60, 0); g.addColorStop(0, '#0a3f8e'); g.addColorStop(1, '#d81718');
      line(f.n, F.label(96), x, 430, g, st, 'center', 2);
      f.h.forEach((s, j) => line(s, F.minchoB(38), x, 505 + j * 52, INK, st, 'center', 2));
      f.d.forEach((s, j) => line(s, F.gothic(25), x, 630 + j * 42, MUTED, vis(t, t0 + 0.4, 210.8, 0.7, 12), 'center', 1));
    });
    // the two hop from number to number
    const fk = seg(t, 194.6, 195.2);
    if (fk > 0 && t < 211.3) {
      const idx = t < 199.2 ? 0 : t < 203.4 ? 1 : 2;
      const tt = [195.0, 199.2, 203.4][idx];
      const prevX = idx === 0 ? 560 : 560 + (idx - 1) * 400, nx = 560 + idx * 400;
      const mv = idx === 0 ? 1 : E.inOut3(seg(t, tt - 0.5, tt));
      const arc = idx === 0 ? 0 : 4 * mv * (1 - mv) * 120;
      const y0 = idx === 0 ? lerp(-200, 330, E.outBack(fk, 1.3)) : 330;
      pair(t, lerp(prevX, nx, mv), y0 - arc - E.in2(seg(t, 210.8, 211.3)) * 1300, [C.dotL, C.dotR], 1, 30, 40, [], null);
    }
    // F4 services
    line('サービス一覧', F.gothic(30), W / 2, 290, MUTED, vis(t, 211.6, 222.2), 'center', 8);
    SERVICES.forEach((s, i) => {
      const cx = i % 2 ? 1250 : 670, cy = i < 2 ? 440 : 675, w = 570, h = 212;
      const st = vis(t, 212.2 + i * 0.7, 222.2, 0.7, 16);
      if (st.a <= 0.003) return;
      const yy = cy + (st.dy || 0);
      card(cx - w / 2, yy - h / 2, w, h, st.a);
      const ss = { a: st.a };
      line(s.s, F.gothic(23), cx - w / 2 + 40, yy - 44, MUTED, ss, 'left', 2);
      line(s.n, F.minchoB(42), cx - w / 2 + 40, yy + 16, INK, ss, 'left', 2);
      line(s.d, F.gothic(22), cx - w / 2 + 40, yy + 66, MUTED, ss, 'left', 0);
    });
    // F5 call to action with QR
    line('その課題、私たちと一緒に解決しませんか。', F.minchoB(52), W / 2, 360, INK, vis(t, 222.8, OUT), 'center', 4);
    const qa = vis(t, 223.6, OUT, 0.7, 16);
    drawQR(650, 450 + (qa.dy || 0), 240, qa.a);
    line('3分でできる', F.gothic(26), 940, 520, MUTED, vis(t, 224.0, OUT), 'left', 4);
    line('無料組織診断', F.minchoB(58), 940, 600, INK, vis(t, 224.2, OUT), 'left', 6);
    line('pl-corpdesign.com', `500 30px "Barlow", sans-serif`, 942, 660, MUTED, vis(t, 224.4, OUT), 'left', 2);
    line('何から手をつけていいかわからない段階からでも、ご相談ください。', F.gothic(24), W / 2, 790, MUTED, vis(t, 225.0, OUT), 'center', 2);
    if (t > 223.8 && t < 233.4) pair(t, 1270, lerp(-200, 470, E.outBack(seg(t, 224.6, 225.2), 1.3)) - E.in2(seg(t, 232.8, 233.3)) * 1300, [C.dotL, C.dotR], 1, 30, 40, [227, 229, 231], null);
  }

  /* ---------- G. close 234–244 ---------- */
  function chClose(t) {
    fillBg(C.paper);
    const k = cam(0.5, 850, 787.5, W / 2, 540);
    ringDraw(k, E.inOutSine(seg(t, 234.3, 235.6)), 1);
    [[HEAD_L, C.dotL, 235.5], [HEAD_R, C.dotR, 235.65]].forEach(([hd, col, t0]) => {
      const dr = drop(t, t0, 0.9, 600, 0.25);
      if (!dr.visible) return;
      const blink = bump(t, 239.5, 0.08);
      ctx.save(); applyCam(ctx, k); ctx.shadowColor = 'rgba(40,20,60,0.2)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 8;
      head(ctx, hd[0], hd[1] + dr.y, 0, dr.sx * (1 + blink * 0.12), dr.sy * (1 - blink * 0.38), col); ctx.restore();
    });
    ctx.save(); applyCam(ctx, k); ctx.beginPath(); ctx.rect(150, 1080, 1400, MAIN_BASE - 1080 + 1); ctx.clip();
    D.main.forEach((m, i) => {
      const e = E.out5(seg(t, 236.0 + i * 0.05, 236.7 + i * 0.05));
      ctx.save(); ctx.translate(0, 190 * (1 - e)); ctx.fillStyle = C.mark; ctx.fill(P.main[i], 'evenodd'); ctx.restore();
    });
    ctx.restore();
    const iHit = drop(t, 236.8, 0.8, 160, 0.3);
    if (iHit.visible) { ctx.save(); applyCam(ctx, k); ctx.globalAlpha = clamp(iHit.k * 6); smile(ctx, IDOT[0], IDOT[1] + iHit.y - 18 * bump(t, 239.58, 0.08), IDOT_R, C.idot, iHit.sx, iHit.sy); ctx.restore(); }
    ctx.save(); applyCam(ctx, k);
    D.sub.forEach((m, i) => {
      const e = E.out5(seg(t, 237.0 + i * 0.03, 237.8 + i * 0.03));
      if (e <= 0) return;
      ctx.save(); ctx.globalAlpha = e; ctx.translate(((m.x + m.w / 2) - 846) * 0.3 * (1 - e), 0); ctx.fillStyle = C.mark; ctx.fill(P.sub[i], 'evenodd'); ctx.restore();
    });
    ctx.restore();
    // hand back to the v4 opener, which starts in the dark
    const o = E.inOut3(seg(t, 242.9, 243.95));
    if (o > 0) { ctx.save(); S0(); ctx.globalAlpha = o; ctx.fillStyle = DARK; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  }

  function render(t) {
    S0(); ctx.globalAlpha = 1; ctx.filter = 'none';
    if (t < 50) chLogoStory(t);
    else if (t < 80) chMission(t);
    else if (t < 108) chVision(t);
    else if (t < 132) chFormula(t);
    else if (t < 170) chValue(t);
    else if (t < 234) chOrg(t);
    else chClose(t);
    S0();
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
    v.addColorStop(0, 'rgba(30,20,50,0)'); v.addColorStop(1, 'rgba(30,20,50,0.16)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.08;
    ctx.drawImage(grains[Math.floor(t * 24) % grains.length], 0, 0, W, H); ctx.restore();
  }
  window.FILM = { render, TOTAL: LOOP, START: 28, W, H };
})();
