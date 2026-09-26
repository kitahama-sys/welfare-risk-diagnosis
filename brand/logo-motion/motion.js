/* PLACE LIBRE logo motion — shared engine.
   Each concept is a pure function of time t (seconds), so the same code drives
   the live preview and frame-by-frame video export. */
(function (global) {
  const DATA = global.LOGO_DATA;
  const NS = 'http://www.w3.org/2000/svg';
  const VB = { x: -600, y: -30, w: 2900, h: 1631 };
  const STOPS = [[0, '#073f8e'], [0.2, '#453f7d'], [0.4, '#703c68'], [0.6, '#9c364c'], [0.8, '#c12830'], [1, '#d81718']];
  const COLORS = { dotL: '#5c3973', dotR: '#ae1c3b', idot: '#d2161a' };
  const BG = {
    light: { bg: '#ffffff', text: '#000000', color: true },
    dark: { bg: '#0e1019', text: '#ffffff', color: true },
    mono: { bg: '#0e1019', text: '#ffffff', color: false },
  };

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const E = {
    inOut3: k => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
    out3: k => 1 - Math.pow(1 - k, 3),
    in3: k => k * k * k,
    in2: k => k * k,
    outBack: (k, s = 1.70158) => 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2),
    inBack: (k, s = 1.70158) => (s + 1) * k * k * k - s * k * k,
    outBounce: k => {
      const n = 7.5625, d = 2.75;
      if (k < 1 / d) return n * k * k;
      if (k < 2 / d) return n * (k -= 1.5 / d) * k + 0.75;
      if (k < 2.5 / d) return n * (k -= 2.25 / d) * k + 0.9375;
      return n * (k -= 2.625 / d) * k + 0.984375;
    },
    outElastic: k => (k <= 0 ? 0 : k >= 1 ? 1 : Math.pow(2, -9 * k) * Math.sin((k * 9 - 0.75) * (2 * Math.PI) / 3.6) + 1),
  };
  // squash amount for an easeOutBounce drop, peaking at each ground contact
  const bounceSquash = k => {
    const g = (c, w, a) => a * Math.exp(-Math.pow((k - c) / w, 2));
    return g(1 / 2.75, 0.035, 0.32) + g(2 / 2.75, 0.03, 0.14) + g(2.5 / 2.75, 0.025, 0.06);
  };

  const T = (x = 0, y = 0) => `translate(${x.toFixed(2)} ${y.toFixed(2)})`;
  const S = (ox, oy, sx, sy = sx) =>
    `translate(${ox} ${oy}) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(${-ox} ${-oy})`;

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  // Centerline measurements (total length, and arc length at the bottom of the neck)
  let GEO = null;
  function geo() {
    if (GEO) return GEO;
    const svg = el('svg', { width: 0, height: 0, style: 'position:absolute;width:0;height:0;overflow:hidden' });
    document.body.appendChild(svg);
    const p = el('path', { d: DATA.center }, svg);
    const L = p.getTotalLength();
    let best = 0, bd = 1e9;
    for (let i = 0; i <= 1000; i++) {
      const s = (L * i) / 1000, q = p.getPointAtLength(s);
      const d = Math.hypot(q.x - 945, q.y - 856);
      if (d < bd) { bd = d; best = s; }
    }
    svg.remove();
    GEO = { L, Lb: best };
    return GEO;
  }

  const MAIN_BASE = 1283, SUB_BASE = 1424;
  const HEAD_L = [610, 211], HEAD_R = [1118, 273], IDOT = [1066.5, 1079];
  const RING_C = [850, 642], RING_BOTTOM = [850, 995];

  let uid = 0;
  function makeStage(container) {
    const n = ++uid;
    const svg = el('svg', { viewBox: `${VB.x} ${VB.y} ${VB.w} ${VB.h}`, preserveAspectRatio: 'xMidYMid meet', 'aria-hidden': 'true' });
    const defs = el('defs', {}, svg);
    const grad = el('linearGradient', { id: 'g' + n, gradientUnits: 'userSpaceOnUse', x1: 296, y1: 0, x2: 1404, y2: 0 }, defs);
    STOPS.forEach(([o, c]) => el('stop', { offset: o, 'stop-color': c }, grad));
    const bg = el('rect', { x: VB.x, y: VB.y, width: VB.w, height: VB.h }, svg);
    const root = el('g', {}, svg);
    const mark = el('g', {}, root);
    const ringLayer = el('g', {}, mark);
    const ring = el('path', { d: DATA.ring, 'fill-rule': 'evenodd' }, ringLayer);
    const dotL = el('path', { d: DATA.dotL }, mark);
    const dotR = el('path', { d: DATA.dotR }, mark);
    const word = el('g', {}, root);
    const mainG = el('g', {}, word);
    const main = DATA.main.map(c => Object.assign(el('path', { d: c.d, 'fill-rule': 'evenodd' }, mainG), { box: c, cx: c.x + c.w / 2 }));
    const subG = el('g', {}, word);
    const sub = DATA.sub.map(c => Object.assign(el('path', { d: c.d, 'fill-rule': 'evenodd' }, subG), { box: c, cx: c.x + c.w / 2 }));
    const idot = el('path', { d: DATA.idot }, root);
    container.appendChild(svg);
    const st = {
      n, svg, defs, bg, root, mark, ringLayer, ring, dotL, dotR, word, mainG, main, subG, sub, idot,
      ringFills: [ring], gradUrl: `url(#g${n})`, extra: {},
      applyBg(mode) {
        const m = BG[mode] || BG.light;
        bg.setAttribute('fill', m.bg);
        this.ringFills.forEach(e => (e.style.fill = m.color ? this.gradUrl : '#ffffff'));
        dotL.style.fill = m.color ? COLORS.dotL : '#ffffff';
        dotR.style.fill = m.color ? COLORS.dotR : '#ffffff';
        idot.style.fill = m.color ? COLORS.idot : '#ffffff';
        [...main, ...sub].forEach(e => (e.style.fill = m.text));
        if (this.onBg) this.onBg(m);
      },
    };
    return st;
  }

  const set = (e, tr, op) => {
    e.setAttribute('transform', tr || '');
    e.setAttribute('opacity', op == null ? 1 : clamp(op).toFixed(3));
  };

  /* ---------- A: ひと筆で描く ---------- */
  const lineDraw = {
    id: 'A', dur: 6.0, rest: 3.2,
    build(st) {
      const { L, Lb } = geo();
      const n = st.n;
      const mask = el('mask', { id: 'dm' + n, maskUnits: 'userSpaceOnUse', x: VB.x, y: VB.y, width: VB.w, height: VB.h }, st.defs);
      const cl = el('path', { d: DATA.center, fill: 'none', stroke: '#fff', 'stroke-width': 124 }, mask);
      st.ring.setAttribute('mask', `url(#dm${n})`);
      const clip = el('clipPath', { id: 'cm' + n }, st.defs);
      el('rect', { x: 150, y: 1100, width: 1400, height: MAIN_BASE - 1100 + 1 }, clip);
      st.mainG.setAttribute('clip-path', `url(#cm${n})`);
      const arms = (p, q) => {
        const a1 = q * Lb, b1 = p * Lb, a2 = L - p * (L - Lb), b2 = L - q * (L - Lb);
        if (b1 - a1 < 0.5) return `0 ${L + 10}`;
        return `0 ${a1} ${b1 - a1} ${Math.max(0, a2 - b1)} ${b2 - a2} ${L}`;
      };
      return t => {
        const p = E.inOut3(seg(t, 0.2, 1.6));
        const q = E.inOut3(seg(t, 4.4, 5.55));
        cl.setAttribute('stroke-dasharray', arms(p, q));
        const out = seg(t, 4.3, 4.75);
        [[st.dotL, 1.05, HEAD_L], [st.dotR, 1.2, HEAD_R]].forEach(([e, t0]) => {
          const k = seg(t, t0, t0 + 0.5);
          const y = -130 * (1 - E.outBack(k, 2)) - 90 * E.in3(out);
          set(e, T(0, y), Math.min(k * 3, 1) * (1 - out));
        });
        st.main.forEach((e, i) => {
          const k = E.out3(seg(t, 1.35 + i * 0.045, 1.9 + i * 0.045));
          const o = E.in3(seg(t, 4.35 + i * 0.03, 4.8 + i * 0.03));
          set(e, T(0, 175 * (1 - k) + 175 * o), 1);
        });
        const kd = seg(t, 1.95, 2.5);
        set(st.idot, T(0, -110 * (1 - E.outBounce(kd)) - 60 * E.in3(out)), Math.min(kd * 5, 1) * (1 - out));
        st.sub.forEach((e, i) => {
          const k = E.out3(seg(t, 2.0 + i * 0.025, 2.6 + i * 0.025));
          const o = seg(t, 4.3, 4.6);
          set(e, T((e.cx - 846) * 0.35 * (1 - k), 0), k * (1 - o));
        });
      };
    },
  };

  /* ---------- B: ふたつが出会う ---------- */
  const connect = {
    id: 'B', dur: 7.0, rest: 4.2,
    build(st) {
      const n = st.n;
      const f = el('filter', { id: 'goo' + n, filterUnits: 'userSpaceOnUse', x: VB.x, y: VB.y, width: VB.w, height: VB.h, 'color-interpolation-filters': 'sRGB' }, st.defs);
      el('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: 22 }, f);
      el('feColorMatrix', { values: '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 38 -17' }, f);
      const gm = el('mask', { id: 'gm' + n, maskUnits: 'userSpaceOnUse', x: VB.x, y: VB.y, width: VB.w, height: VB.h }, st.defs);
      const go = el('g', { filter: `url(#goo${n})` }, gm);
      const oL = el('circle', { cy: 642, fill: '#fff' }, go), oR = el('circle', { cy: 642, fill: '#fff' }, go);
      const gi = el('g', { filter: `url(#goo${n})` }, gm);
      const iL = el('circle', { cy: 642, fill: '#000' }, gi), iR = el('circle', { cy: 642, fill: '#000' }, gi);
      const gooRect = el('rect', { x: VB.x, y: VB.y, width: VB.w, height: VB.h, mask: `url(#gm${n})` });
      st.ringLayer.insertBefore(gooRect, st.ring);
      st.ringFills.push(gooRect);
      const D0 = 250;
      return t => {
        const s = E.outBack(seg(t, 0.2, 0.9), 1.4) * (1 - E.inBack(seg(t, 6.3, 6.85), 1.6));
        const d = D0 * (1 - E.inOut3(seg(t, 0.9, 2.3))) + D0 * E.inOut3(seg(t, 5.65, 6.5));
        const sc = Math.max(s, 0);
        oL.setAttribute('cx', 649.5 - d); oL.setAttribute('r', 353 * sc);
        iL.setAttribute('cx', 649.5 - d); iL.setAttribute('r', 287 * sc);
        oR.setAttribute('cx', 1118 + d); oR.setAttribute('r', 285 * sc);
        iR.setAttribute('cx', 1118 + d); iR.setAttribute('r', 219 * sc);
        const exact = seg(t, 2.25, 2.5) * (t < 5.6 ? 1 : 0);
        set(st.ring, '', exact);
        set(gooRect, '', exact >= 1 ? 0 : 1);
        const hk = E.outBack(seg(t, 0.45, 1.05), 2.2) * (1 - E.inBack(seg(t, 6.2, 6.7), 1.6));
        set(st.dotL, T(-d, 0) + ' ' + S(HEAD_L[0], HEAD_L[1], Math.max(hk, 0)), 1);
        set(st.dotR, T(d, 0) + ' ' + S(HEAD_R[0], HEAD_R[1], Math.max(hk, 0)), 1);
        const out = E.inOut3(seg(t, 5.3, 5.75));
        st.main.forEach((e, i) => {
          const k = E.out3(seg(t, 2.5 + i * 0.05, 3.2 + i * 0.05));
          set(e, T(0, 50 * (1 - k) + 20 * out), k * (1 - out));
        });
        st.sub.forEach((e, i) => {
          const k = E.out3(seg(t, 2.9 + i * 0.02, 3.5 + i * 0.02));
          set(e, T(0, 30 * (1 - k) + 12 * out), k * (1 - out));
        });
        const kd = E.outBack(seg(t, 3.25, 3.7), 2.6);
        set(st.idot, S(IDOT[0], IDOT[1], Math.max(kd * (1 - out), 0)), 1);
      };
    },
  };

  /* ---------- C: 呼吸する ---------- */
  const breathe = {
    id: 'C', dur: 6.0, rest: 0,
    build(st) {
      const { L } = geo();
      const n = st.n;
      const cp = el('clipPath', { id: 'rc' + n }, st.defs);
      el('path', { d: DATA.ring, 'clip-rule': 'evenodd' }, cp);
      const bf = el('filter', { id: 'sb' + n, filterUnits: 'userSpaceOnUse', x: VB.x, y: VB.y, width: VB.w, height: VB.h }, st.defs);
      el('feGaussianBlur', { stdDeviation: 20 }, bf);
      const g = el('g', { 'clip-path': `url(#rc${n})` }, st.ringLayer);
      const mk = () => el('path', { d: DATA.center, fill: 'none', 'stroke-width': 110, 'stroke-linecap': 'round', filter: `url(#sb${n})` }, g);
      const sheens = [mk()];
      st.onBg = m => sheens.forEach(s => {
        s.setAttribute('stroke', m.color ? '#ffffff' : '#4a5a9a');
        s.setAttribute('opacity', m.color ? 0.42 : 0.4);
      });
      const SEG = 300;
      const TAU = Math.PI * 2;
      return t => {
        const ph = t / 6;
        sheens.forEach((s, i) => {
          s.setAttribute('stroke-dasharray', `${SEG} ${L - SEG}`);
          s.setAttribute('stroke-dashoffset', (-L * (ph + i * 0.5)).toFixed(1));
        });
        set(st.mark, S(RING_C[0], RING_C[1], 1 + 0.012 * Math.sin(TAU * ph)), 1);
        const bob = (phase) => Math.pow(Math.sin(Math.PI * (t / 3 - phase)), 2);
        const bl = bob(0), br = bob(0.22);
        set(st.dotL, T(0, -14 * bl) + ' ' + S(HEAD_L[0], HEAD_L[1], 1 - 0.02 * bl, 1 + 0.05 * bl), 1);
        set(st.dotR, T(0, -14 * br) + ' ' + S(HEAD_R[0], HEAD_R[1], 1 - 0.02 * br, 1 + 0.05 * br), 1);
        set(st.idot, T(0, 5 * Math.sin(TAU * (t / 3 - 0.35))), 1);
        st.main.forEach(e => set(e, '', 1));
        st.sub.forEach(e => set(e, '', 1));
      };
    },
  };

  /* ---------- D: はずむ ---------- */
  const bounce = {
    id: 'D', dur: 6.0, rest: 3.0,
    build(st) {
      const drop = (e, base, t0, t1, H, hopAt, outAt) => (t) => {
        const k = seg(t, t0, t1);
        let y = -H * (1 - E.outBounce(k));
        const sq = k > 0 && k < 1 ? bounceSquash(k) : 0;
        let sy = 1 - sq, sx = 1 + sq * 0.8;
        // greeting hop during the hold
        const h = seg(t, hopAt, hopAt + 0.42);
        if (h > 0 && h < 1) {
          y -= 70 * 4 * h * (1 - h);
          const land = Math.exp(-Math.pow((h - 1) / 0.08, 2)) * 0.18 + Math.exp(-Math.pow(h / 0.08, 2)) * 0.12;
          sy -= land; sx += land * 0.8;
        }
        const o = seg(t, outAt, outAt + 0.5);
        if (o > 0) {
          const pre = o < 0.25 ? Math.sin((o / 0.25) * Math.PI) * 0.2 : 0;
          sy -= pre; sx += pre * 0.6;
          y -= 800 * E.inBack(seg(o, 0.15, 1), 1.2);
        }
        set(e, T(0, y) + ' ' + S(base[0], base[1], sx, sy), k > 0 ? 1 : 0);
        return sq;
      };
      const dl = drop(st.dotL, HEAD_L, 0.65, 1.55, 760, 3.35, 4.55);
      const dr = drop(st.dotR, HEAD_R, 0.8, 1.7, 820, 3.55, 4.62);
      const di = drop(st.idot, [IDOT[0], IDOT[1] + 26], 2.05, 2.85, 520, 3.75, 4.68);
      return t => {
        const s = E.outElastic(seg(t, 0.12, 1.1)) * (1 - E.inBack(seg(t, 4.95, 5.45), 2.2));
        const sqL = dl(t), sqR = dr(t);
        const j = (sqL + sqR) * 0.12;
        set(st.ringLayer, S(RING_C[0], RING_C[1], Math.max(s, 0)) + ' ' + S(RING_BOTTOM[0], RING_BOTTOM[1], 1 + j * 0.5, 1 - j), 1);
        st.main.forEach((e, i) => {
          const k = seg(t, 1.25 + i * 0.065, 1.85 + i * 0.065);
          const y = 140 * (1 - E.outBack(k, 2.4));
          const sc = 0.6 + 0.4 * E.outBack(k, 2);
          const o = seg(t, 4.5 + i * 0.03, 4.95 + i * 0.03);
          const iBar = e === st.main[6] ? bounceSquash(seg(t, 2.05, 2.85)) * 0.35 : 0;
          set(e, T(0, y + 160 * E.inBack(o, 1.8)) + ' ' + S(e.cx, MAIN_BASE, sc * (1 + iBar * 0.4), sc * (1 - iBar)), Math.min(k * 4, 1) * (1 - E.in3(o)));
        });
        di(t);
        st.sub.forEach((e, i) => {
          const k = seg(t, 2.15 + i * 0.03, 2.6 + i * 0.03);
          const o = seg(t, 4.45, 4.75);
          const sc = Math.max(E.outBack(k, 3), 0) * (1 - o);
          set(e, S(e.cx, SUB_BASE - 30, sc), 1);
        });
      };
    },
  };

  global.LogoMotion = { VB, BG, makeStage, concepts: { A: lineDraw, B: connect, C: breathe, D: bounce } };
})(window);
