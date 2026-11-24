/* ============ 🧰 Modelling tools for the Learning Board ============
   Guiding principle: the tools on the board suit the subject and the age group.
   Maths gets place-value grids, number lines, bar models, column methods and fraction tools; English gets writing frames,
   sentence stems and sound buttons; history and geography get timelines, map grids and a compass; science gets tables,
   Venn diagrams and life cycles. Reception and Year 1 get very big, simple versions. (Secondary tools come later.)
   Each tool is a board page drawn as ordinary board items marked lock:true, so children write on top, the rubber only
   rubs out their own marks, and "Clear page" keeps the template. */
(function(){
  'use strict';
  const INK = '#2b2f3a', SOFT = '#7a8578', FLAME = '#FE4D02', BLUE = '#2f6fed', LEAF = '#4F7A2E';
  const TINT = { o:'#FFE9D6', t:'#E3F1F8', h:'#E8F3DE', th:'#F3E8FA', k:'#FFF3C4', d:'#FDE2E2' };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  /* ---------- drawing helpers (page is 1600 × 1000) ---------- */
  const L = (x0, y0, x1, y1, w, c) => ({ t:'s', m:'pen', c:c || INK, w:w || 6, p:[x0, y0, x1, y1], lock:true });
  const P = (pts, w, c) => ({ t:'s', m:'pen', c:c || INK, w:w || 6, p:pts, lock:true });
  const R = (x, y, w, h, o) => Object.assign({ t:'r', x, y, w, h, c:INK, lw:5, lock:true }, o || {});
  const tw = (txt, s) => String(txt).length * s * 0.5;
  const T = (txt, x, y, s, c) => ({ t:'x', x, y, s, c:c || INK, txt:String(txt), lock:true });
  const TC = (txt, cx, y, s, c) => T(txt, Math.round(cx - tw(txt, s) / 2), y, s, c);
  function circle(cx, cy, r, w, c, n){ n = n || 72; const p = []; for(let i = 0; i <= n; i++){ const a = i / n * Math.PI * 2; p.push(Math.round(cx + r * Math.cos(a)), Math.round(cy + r * Math.sin(a))); } return P(p, w, c); }
  function arrow(x0, y0, x1, y1, w, c){ const a = Math.atan2(y1 - y0, x1 - x0), h = 26 + (w || 6) * 2;
    return [L(x0, y0, x1, y1, w, c), P([Math.round(x1 - h * Math.cos(a - .45)), Math.round(y1 - h * Math.sin(a - .45)), x1, y1, Math.round(x1 - h * Math.cos(a + .45)), Math.round(y1 - h * Math.sin(a + .45))], w, c)]; }
  function dashed(x0, y0, x1, y1, w, c){ const out = [], n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 34));
    for(let i = 0; i < n; i += 2){ const a = i / n, b = Math.min(1, (i + 1) / n); out.push(L(Math.round(x0 + (x1 - x0) * a), Math.round(y0 + (y1 - y0) * a), Math.round(x0 + (x1 - x0) * b), Math.round(y0 + (y1 - y0) * b), w, c)); } return out; }

  /* ---------- the tools ---------- */
  const TOOLS = {
    /* Maths */
    tenFrame:{ icon:'🔟', name:'Ten frame', subj:'maths', ages:[0, 2], make(o){
      const s = 230, x0 = (1600 - s * 5) / 2, y0 = 260, out = [R(x0, y0, s * 5, s * 2, { lw:10 })];
      for(let i = 1; i < 5; i++) out.push(L(x0 + s * i, y0, x0 + s * i, y0 + s * 2, 8));
      out.push(L(x0, y0 + s, x0 + s * 5, y0 + s, 8));
      out.push(TC('Put counters in. How many? How many more to make 10?', 800, 800, 52, SOFT));
      return { bg:'plain', items:out, tip:'Use ⭐ Stickers as counters.' }; } },
    numberTrack:{ icon:'👣', name:'Number track', subj:'maths', ages:[0, 1], make(o){
      const n = o.year === 0 ? 10 : 20, per = 10, s = 140, x0 = (1600 - s * per) / 2, out = [];
      for(let r = 0; r < n / per; r++) for(let i = 0; i < per; i++){ const v = r * per + i + 1, x = x0 + i * s, y = 260 + r * 220;
        out.push(R(x, y, s, s, { lw:6, f:v % 5 === 0 ? TINT.k : '#fff' })); out.push(TC(v, x + s / 2, y + 34, 70)); }
      return { bg:'plain', items:out, tip:'Hop along with the pen, or put a sticker on a number.' }; } },
    numberLine:{ icon:'📏', name:'Number line', subj:'maths', ages:[0, 6], make(o){
      const y = 480, x0 = 120, x1 = 1480, out = [L(x0 - 40, y, x1 + 40, y, 8)];
      const top = o.year <= 2 ? 10 : o.year <= 4 ? 100 : 1, step = o.year <= 2 ? 1 : o.year <= 4 ? 10 : 0.1;
      const n = Math.round(top / step), big = o.year === 0 ? 72 : 56;
      for(let i = 0; i <= n; i++){ const x = x0 + (x1 - x0) * i / n, lab = o.year >= 5 ? (i / 10).toFixed(1).replace(/\.0$/, '') : String(Math.round(i * step));
        out.push(L(x, y - 34, x, y + 34, 6)); out.push(TC(lab, x, y + 56, big)); }
      out.push(TC(o.year >= 5 ? 'Tenths between 0 and 1' : o.year >= 3 ? 'Count in tens' : 'Count on, count back', 800, 760, 48, SOFT));
      return { bg:'plain', items:out, tip:'Draw jumps with the pen.' }; } },
    blankLine:{ icon:'↔️', name:'Empty number line', subj:'maths', ages:[2, 6], make(){
      return { bg:'plain', items:[L(100, 520, 1500, 520, 8), L(100, 486, 100, 554, 6), L(1500, 486, 1500, 554, 6), TC('Mark your start and your jumps', 800, 700, 48, SOFT)] }; } },
    placeValue:{ icon:'🏛️', name:'Place value grid', subj:'maths', ages:[1, 6], make(o){
      const cols = o.year <= 2 ? ['Tens', 'Ones'] : o.year === 3 ? ['Hundreds', 'Tens', 'Ones'] : o.year === 4 ? ['Thousands', 'Hundreds', 'Tens', 'Ones'] : ['Ten thousands', 'Thousands', 'Hundreds', 'Tens', 'Ones', 'Tenths', 'Hundredths'];
      const short = { 'Ten thousands':'TTh', Thousands:'Th', Hundreds:'H', Tens:'T', Ones:'O', Tenths:'Tth', Hundredths:'Hth' };
      const tints = { 'Ten thousands':TINT.th, Thousands:TINT.th, Hundreds:TINT.h, Tens:TINT.t, Ones:TINT.o, Tenths:TINT.k, Hundredths:TINT.d };
      const w = Math.min(340, Math.floor(1440 / cols.length)), x0 = (1600 - w * cols.length) / 2, y0 = 120, hh = 120, rows = 3, rh = 200, out = [];
      cols.forEach((c, i) => { const x = x0 + i * w; out.push(R(x, y0, w, hh + rows * rh, { f:tints[c], lw:5 })); out.push(TC(cols.length > 4 ? short[c] : c, x + w / 2, y0 + 30, cols.length > 4 ? 64 : 54)); });
      out.push(L(x0, y0 + hh, x0 + w * cols.length, y0 + hh, 6));
      for(let r = 1; r < rows; r++) out.push(...dashed(x0, y0 + hh + r * rh, x0 + w * cols.length, y0 + hh + r * rh, 3, SOFT));
      if(cols.includes('Tenths')){ const xd = x0 + w * cols.indexOf('Tenths'); out.push({ t:'k', e:'⚫', x:xd, y:y0 + hh + rows * rh / 2, s:40, lock:true }); }
      return { bg:'plain', items:out, tip:'Write digits, or use stickers as counters.' }; } },
    columnMethod:{ icon:'➕', name:'Column method', subj:'maths', ages:[3, 6], make(o){
      const cols = o.year >= 5 ? ['Th', 'H', 'T', 'O'] : ['H', 'T', 'O'], G = 100, x0 = 1100 - G * cols.length, out = [];
      cols.forEach((c, i) => out.push(TC(c, x0 + i * G + G / 2, 130, 56, FLAME)));
      out.push(L(x0 - G, 500, x0 + G * cols.length + 20, 500, 7), L(x0 - G, 640, x0 + G * cols.length + 20, 640, 7));
      out.push(T('One digit in each square. Start with the ones.', 120, 820, 44, SOFT));
      return { bg:'squares', items:out }; } },
    barModel:{ icon:'📊', name:'Bar model', subj:'maths', ages:[1, 6], make(){
      const x0 = 200, w = 1200, out = [R(x0, 200, w, 160, { f:TINT.t, lw:6 }), R(x0, 400, w * .6, 160, { f:TINT.o, lw:6 }), R(x0 + w * .6, 400, w * .4, 160, { f:TINT.k, lw:6 })];
      out.push(TC('whole', 800, 245, 60), TC('part', x0 + w * .3, 445, 60), TC('part', x0 + w * .8, 445, 60));
      out.push(...dashed(x0, 600, x0, 660, 4, SOFT), ...dashed(x0 + w, 600, x0 + w, 660, 4, SOFT));
      out.push(TC('Write the numbers in. Put ? where the missing number goes.', 800, 760, 46, SOFT));
      return { bg:'plain', items:out }; } },
    fractions:{ icon:'🍫', name:'Fraction wall', subj:'maths', ages:[1, 6], make(o){
      const dens = o.year <= 2 ? [1, 2, 4] : o.year <= 4 ? [1, 2, 3, 4, 5, 6, 8] : [1, 2, 3, 4, 5, 6, 8, 10, 12];
      const x0 = 160, w = 1280, h = Math.min(130, Math.floor(820 / dens.length)), out = [];
      const tint = [TINT.o, TINT.t, TINT.h, TINT.th, TINT.k, TINT.d];
      dens.forEach((d, r) => { const y = 90 + r * h; for(let i = 0; i < d; i++){ const x = x0 + w * i / d; out.push(R(x, y, w / d, h, { f:tint[r % tint.length], lw:4 }));
        const lab = d === 1 ? '1' : `1/${d}`, s = Math.min(54, h * .5, (w / d) * .5); out.push(TC(lab, x + w / d / 2, y + h / 2 - s / 2, s)); } });
      return { bg:'plain', items:out, tip:'Colour parts with the highlighter.' }; } },
    fractionCircles:{ icon:'🥧', name:'Fraction circles', subj:'maths', ages:[1, 4], make(o){
      const dens = o.year <= 2 ? [2, 4] : [2, 3, 4], out = [], r = 220;
      dens.forEach((d, k) => { const cx = 1600 * (k + 1) / (dens.length + 1), cy = 470; out.push(circle(cx, cy, r, 7));
        for(let i = 0; i < d; i++){ const a = -Math.PI / 2 + i / d * Math.PI * 2; out.push(L(cx, cy, Math.round(cx + r * Math.cos(a)), Math.round(cy + r * Math.sin(a)), 6)); }
        out.push(TC(`${d} equal parts`, cx, cy + r + 40, 44, SOFT)); });
      return { bg:'plain', items:out, tip:'Shade parts with the highlighter.' }; } },
    array:{ icon:'🔵', name:'Array', subj:'maths', ages:[1, 6], make(){
      const out = []; for(let r = 0; r < 6; r++) for(let c = 0; c < 10; c++) out.push(circle(240 + c * 112, 170 + r * 112, 34, 5, SOFT, 28));
      out.push(TC('Ring the groups. How many rows? How many in each row?', 800, 870, 46, SOFT));
      return { bg:'plain', items:out }; } },
    coordGrid:{ icon:'📍', name:'Coordinate grid', subj:'maths', ages:[4, 6], make(){
      const x0 = 520, y0 = 900, s = 80, n = 10, out = [];
      for(let i = 0; i <= n; i++){ out.push(L(x0 + i * s, y0, x0 + i * s, y0 - n * s, i ? 2 : 7, i ? '#b9c4d6' : INK)); out.push(L(x0, y0 - i * s, x0 + n * s, y0 - i * s, i ? 2 : 7, i ? '#b9c4d6' : INK)); }
      for(let i = 0; i <= n; i++){ out.push(TC(i, x0 + i * s, y0 + 14, 36)); if(i) out.push(T(i, x0 - 48, y0 - i * s - 20, 36)); }
      out.push(T('x', x0 + n * s + 26, y0 - 30, 48, FLAME), T('y', x0 - 14, y0 - n * s - 70, 48, FLAME), T('Across, then up.', 80, 200, 46, SOFT));
      return { bg:'plain', items:out }; } },
    /* English */
    soundButtons:{ icon:'🔤', name:'Sound buttons', subj:'english', ages:[0, 2], make(o){
      const n = o.year === 0 ? 3 : 4, s = o.year === 0 ? 300 : 250, x0 = (1600 - s * n - 30 * (n - 1)) / 2, out = [];
      for(let i = 0; i < n; i++){ const x = x0 + i * (s + 30); out.push(R(x, 200, s, s, { f:'#fff', lw:8 })); out.push(circle(x + s / 2, 200 + s + 60, 22, 8, FLAME, 24)); }
      out.push(L(250, 800, 1350, 800, 6), TC('Write a sound in each box. Press the buttons and blend.', 800, 860, 44, SOFT));
      return { bg:'plain', items:out }; } },
    letterLines:{ icon:'✍️', name:'Handwriting lines', subj:'english', ages:[0, 3], make(o){
      const big = o.year <= 1, gap = big ? 260 : 190, out = [];
      for(let r = 0, y = 170; y + gap * .6 < 960; r++, y += gap){ out.push(L(80, y + gap * .55, 1520, y + gap * .55, 6)); out.push(...dashed(80, y + gap * .3, 1520, y + gap * .3, 3, '#9fb3d1')); out.push(L(80, y, 1520, y, 2, '#d2dbe8')); }
      return { bg:'plain', items:out, tip:'Sit the letters on the dark line.' }; } },
    writingFrame:{ icon:'🪜', name:'Writing frame', subj:'english', ages:[1, 6], make(o){
      const heads = o.year <= 2 ? ['First,', 'Next,', 'Then,', 'Finally,'] : ['Opening', 'Build-up', 'Problem', 'Resolution', 'Ending'];
      const h = Math.floor(880 / heads.length), out = [];
      heads.forEach((t, i) => { const y = 70 + i * h; out.push(R(80, y, 1440, h - 18, { f:[TINT.o, TINT.t, TINT.h, TINT.th, TINT.k][i], lw:4 })); out.push(T(t, 104, y + 14, 50, FLAME)); });
      return { bg:'plain', items:out }; } },
    storyMountain:{ icon:'⛰️', name:'Story mountain', subj:'english', ages:[2, 6], make(){
      const pts = [120, 860, 460, 520, 800, 200, 1140, 520, 1480, 860], out = [P(pts, 10)];
      [['Opening', 140, 890], ['Build-up', 300, 560], ['Problem', 700, 120], ['Resolution', 1150, 560], ['Ending', 1330, 890]].forEach(t => out.push(T(t[0], t[1], t[2], 46, FLAME)));
      return { bg:'plain', items:out }; } },
    stems:{ icon:'💬', name:'Sentence stems', subj:'english', ages:[1, 6], make(o){
      const list = o.year <= 2 ? ['I can see…', 'I think… because…', 'It is… and…', 'My favourite part is…'] : ['I think… because…', 'This shows that…', 'In my opinion,…', 'The author uses… to…', 'I noticed that…'];
      const h = Math.floor(860 / list.length), out = [];
      list.forEach((t, i) => { const y = 90 + i * h; out.push(T(t, 90, y, 54, BLUE)); out.push(L(90, y + h - 36, 1510, y + h - 36, 3, '#9fb3d1')); });
      return { bg:'plain', items:out }; } },
    sentenceBuilder:{ icon:'🧩', name:'Sentence builder', subj:'english', ages:[1, 4], make(){
      const heads = ['Who?', 'Did what?', 'Where?', 'When?'], w = 340, out = [];
      heads.forEach((t, i) => { const x = 120 + i * (w + 20); out.push(R(x, 180, w, 560, { f:[TINT.o, TINT.t, TINT.h, TINT.th][i], lw:5 })); out.push(TC(t, x + w / 2, 200, 54, FLAME)); });
      out.push(L(120, 860, 1480, 860, 4, '#9fb3d1'), T('My sentence:', 120, 790, 44, SOFT));
      return { bg:'plain', items:out }; } },
    wordBank:{ icon:'📚', name:'Word bank', subj:'english', ages:[0, 6], make(){
      const out = [R(80, 80, 1440, 840, { f:TINT.k, lw:6 }), T('Word bank', 110, 100, 60, FLAME)];
      for(let r = 0; r < 4; r++) for(let c = 0; c < 3; c++) out.push(R(120 + c * 460, 230 + r * 170, 420, 130, { f:'#fff', lw:3 }));
      return { bg:'plain', items:out }; } },
    /* History and geography */
    timeline:{ icon:'🕰️', name:'Timeline', subj:'humanities', ages:[0, 6], make(o){
      const y = 520, out = arrow(100, y, 1500, y, 10);
      const n = o.year <= 2 ? 3 : 6;
      for(let i = 0; i < n; i++){ const x = 180 + i * 1220 / (n - 1); out.push(L(x, y - 40, x, y + 40, 6)); if(o.year >= 3) out.push(R(x - 90, i % 2 ? y + 80 : y - 230, 180, 150, { f:'#fff', lw:3 })); }
      out.push(T(o.year <= 2 ? 'Long ago' : 'Earlier', 100, y + 120, 50, FLAME), T(o.year <= 2 ? 'Now' : 'Later', 1330, y + 120, 50, FLAME));
      return { bg:'plain', items:out, tip:'Write dates or draw pictures in order.' }; } },
    thenNow:{ icon:'⏳', name:'Then and now', subj:'humanities', ages:[0, 4], make(){
      return { bg:'plain', items:[R(80, 120, 700, 800, { f:TINT.th, lw:6 }), R(820, 120, 700, 800, { f:TINT.h, lw:6 }), TC('Then', 430, 140, 70, FLAME), TC('Now', 1170, 140, 70, FLAME)] }; } },
    mapGrid:{ icon:'🗺️', name:'Map grid', subj:'humanities', ages:[2, 6], make(){
      const x0 = 300, y0 = 120, s = 160, n = 5, out = [R(x0, y0, s * n, s * n, { f:'#EAF4E1', lw:6 })];
      for(let i = 1; i < n; i++){ out.push(L(x0 + i * s, y0, x0 + i * s, y0 + n * s, 2, '#9fb3a0'), L(x0, y0 + i * s, x0 + n * s, y0 + i * s, 2, '#9fb3a0')); }
      'ABCDE'.split('').forEach((c, i) => out.push(TC(c, x0 + i * s + s / 2, y0 + n * s + 14, 48)));
      for(let i = 0; i < n; i++) out.push(T(n - i, x0 - 54, y0 + i * s + s / 2 - 24, 48));
      const cx = 1340, cy = 300; out.push(...arrow(cx, cy + 110, cx, cy - 110, 7, FLAME), L(cx - 100, cy, cx + 100, cy, 5), TC('N', cx, cy - 190, 56, FLAME), TC('S', cx, cy + 120, 44), T('W', cx - 150, cy - 24, 44), T('E', cx + 112, cy - 24, 44));
      return { bg:'plain', items:out, tip:'Use stickers for places. Give the square: letter, then number.' }; } },
    compass:{ icon:'🧭', name:'Compass', subj:'humanities', ages:[1, 6], make(o){
      const cx = 800, cy = 500, r = 330, out = [circle(cx, cy, r, 6, SOFT)];
      out.push(...arrow(cx, cy + r - 20, cx, cy - r + 20, 9, FLAME), ...arrow(cx - r + 20, cy, cx + r - 20, cy, 7));
      out.push(TC('N', cx, cy - r - 90, 70, FLAME), TC('S', cx, cy + r + 14, 64), T('W', cx - r - 80, cy - 34, 64), T('E', cx + r + 24, cy - 34, 64));
      if(o.year >= 3){ const d = r * .72; out.push(...dashed(cx - d, cy - d, cx + d, cy + d, 3, SOFT), ...dashed(cx + d, cy - d, cx - d, cy + d, 3, SOFT)); out.push(T('NE', cx + d, cy - d - 70, 44), T('NW', cx - d - 80, cy - d - 70, 44), T('SE', cx + d, cy + d + 6, 44), T('SW', cx - d - 80, cy + d + 6, 44)); }
      return { bg:'plain', items:out }; } },
    /* Science and everything */
    table:{ icon:'📋', name:'Results table', subj:'any', ages:[1, 6], make(o){
      const cols = o.year <= 2 ? 2 : 3, rows = 5, x0 = 120, w = 1360, rh = 140, out = [];
      for(let c = 0; c < cols; c++) out.push(R(x0 + c * w / cols, 120, w / cols, rh, { f:TINT.t, lw:5 }));
      for(let r = 1; r <= rows; r++) for(let c = 0; c < cols; c++) out.push(R(x0 + c * w / cols, 120 + r * rh, w / cols, rh, { f:'#fff', lw:3 }));
      return { bg:'plain', items:out, tip:'Write the headings in the blue row.' }; } },
    venn:{ icon:'⭕', name:'Venn diagram', subj:'any', ages:[1, 6], make(){
      return { bg:'plain', items:[circle(620, 520, 380, 8, BLUE), circle(980, 520, 380, 8, FLAME), T('Both', 740, 120, 46, SOFT)] }; } },
    lifeCycle:{ icon:'🔁', name:'Life cycle', subj:'science', ages:[1, 6], make(){
      const cx = 800, cy = 500, R0 = 330, pts = [[cx, cy - R0], [cx + R0, cy], [cx, cy + R0], [cx - R0, cy]], out = [];
      pts.forEach(p => out.push(circle(p[0], p[1], 120, 6, LEAF)));
      for(let i = 0; i < 4; i++){ const a = pts[i], b = pts[(i + 1) % 4], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = (b[0] - a[0]) * .18, dy = (b[1] - a[1]) * .18; out.push(...arrow(Math.round(mx - dx), Math.round(my - dy), Math.round(mx + dx), Math.round(my + dy), 6, SOFT)); }
      return { bg:'plain', items:out, tip:'Draw or write each stage in a circle.' }; } },
    labelDiagram:{ icon:'🏷️', name:'Label it', subj:'science', ages:[0, 6], make(){
      const out = [R(500, 220, 600, 560, { f:'#fff', lw:4, c:SOFT })];
      [[200, 260], [200, 520], [200, 780], [1400, 260], [1400, 520], [1400, 780]].forEach(([x, y], i) => { out.push(R(i < 3 ? 60 : 1240, y - 50, 300, 100, { f:TINT.k, lw:3 })); out.push(L(i < 3 ? 360 : 1240, y, i < 3 ? 500 : 1100, y, 4, SOFT)); });
      return { bg:'plain', items:out, tip:'Add a picture in the middle (🖼️ Picture) or draw one.' }; } },
    mindMap:{ icon:'🕸️', name:'Mind map', subj:'any', ages:[1, 6], make(){
      const cx = 800, cy = 500, out = [circle(cx, cy, 150, 8, FLAME)];
      for(let i = 0; i < 6; i++){ const a = -Math.PI / 2 + i / 6 * Math.PI * 2, x = cx + 470 * Math.cos(a) * 1.15, y = cy + 330 * Math.sin(a);
        out.push(L(Math.round(cx + 150 * Math.cos(a)), Math.round(cy + 150 * Math.sin(a)), Math.round(x - 120 * Math.cos(a)), Math.round(y - 80 * Math.sin(a)), 5, SOFT));
        out.push(R(Math.round(x - 150), Math.round(y - 70), 300, 140, { f:'#fff', lw:4 })); }
      return { bg:'plain', items:out }; } },
    /* Very big, simple tools for the youngest */
    bigLines:{ icon:'〰️', name:'Big pattern lines', subj:'eyfs', ages:[0, 1], make(){
      const out = [];
      [220, 500, 780].forEach((y, k) => { const p = []; for(let x = 120; x <= 1480; x += 20){ const t = (x - 120) / 160 * Math.PI; p.push(x, Math.round(y + (k === 0 ? 80 * Math.sin(t) : k === 1 ? 70 - 140 * Math.abs(((x - 120) / 160) % 2 - 1) : 70 * Math.abs(Math.sin(t)) * -1 + 35))); } out.push(...dashedPoly(p, 7, '#9fb3d1')); });
      return { bg:'plain', items:out, tip:'Trace over the dotted lines with the pen.' }; } },
    bigShapes:{ icon:'🔺', name:'Big shapes', subj:'eyfs', ages:[0, 1], make(){
      const out = [circle(330, 480, 220, 10, BLUE), R(620, 260, 420, 420, { lw:10, c:FLAME }), L(1340, 250, 1560, 700, 10, LEAF), L(1560, 700, 1120, 700, 10, LEAF), L(1120, 700, 1340, 250, 10, LEAF)];
      out.push(TC('circle', 330, 760, 60), TC('square', 830, 760, 60), TC('triangle', 1340, 760, 60));
      return { bg:'plain', items:out }; } },
  };
  function dashedPoly(p, w, c){ const out = []; for(let i = 0; i + 3 < p.length; i += 4) out.push(P([p[i], p[i + 1], p[i + 2], p[i + 3]], w, c)); return out; }

  /* Which tools suit this subject and age? */
  function subjOf(info){
    const s = (info.subject + ' ' + info.topic).toLowerCase();
    if(/math/.test(s)) return 'maths';
    if(/english|phonic|reading|writing|grammar|spelling|word/.test(s)) return 'english';
    if(/history|geograph|christmas/.test(s)) return 'humanities';
    if(/science/.test(s)) return 'science';
    return 'any';
  }
  function suits(key, subj, year){
    const t = TOOLS[key]; if(!t) return false;
    const age = year >= t.ages[0] && year <= t.ages[1];
    if(subj === 'any') return age && (t.subj === 'any' || t.subj === 'eyfs' && year <= 1);
    if(t.subj === 'eyfs') return age && year <= 1;
    return age && (t.subj === subj || t.subj === 'any' || (subj === 'humanities' && t.subj === 'any'));
  }
  function pick(info){
    const subj = subjOf(info), year = info.year;
    const mine = Object.keys(TOOLS).filter(k => suits(k, subj, year));
    const other = Object.keys(TOOLS).filter(k => !mine.includes(k) && year >= TOOLS[k].ages[0] && year <= TOOLS[k].ages[1]);
    return { subj, mine, other };
  }
  const SUBJ_NAME = { maths:'Maths', english:'English', humanities:'History and geography', science:'Science', any:'Every subject' };
  const yearName = y => y === 0 ? 'Reception' : 'Year ' + y;

  /* ---------- the panel ---------- */
  function open(info){
    const st = window.FabBoard && FabBoard.state(); if(!st || !st.el) return;
    const desk = st.el.querySelector('#bdDesk'); if(!desk) return;
    close();
    const { subj, mine, other } = pick(info);
    const tile = k => `<button type="button" class="bk-tile" data-kit="${k}"><i aria-hidden="true">${TOOLS[k].icon}</i><span>${esc(TOOLS[k].name)}</span></button>`;
    const el = document.createElement('div'); el.className = 'bd-kit'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Modelling tools');
    el.innerHTML = `<div class="bk-head"><h2>🧰 Tools for ${esc(SUBJ_NAME[subj])} · ${esc(yearName(info.year))}</h2><button type="button" class="bk-x" aria-label="Close the tools">✕</button></div>
      <p class="bk-sub">Each tool opens on a new page. Write and draw on top; the rubber and Clear page leave the tool in place.</p>
      <div class="bk-grid">${mine.map(tile).join('')}</div>
      ${other.length ? `<details class="bk-more"><summary>More tools from other subjects</summary><div class="bk-grid">${other.map(tile).join('')}</div></details>` : ''}`;
    desk.appendChild(el);
    el.querySelector('.bk-x').onclick = close;
    el.querySelectorAll('[data-kit]').forEach(b => b.onclick = () => { add(b.dataset.kit, info); close(); });
    const first = el.querySelector('[data-kit]'); if(first) try{ first.focus({ preventScroll:true }); }catch(e){}
  }
  function close(){ document.querySelectorAll('.bd-kit').forEach(e => e.remove()); }
  function add(key, info){
    const t = TOOLS[key]; if(!t) return;
    const o = { year:info.year, subject:info.subject };
    let made; try{ made = t.make(o); }catch(e){ return; }
    FabBoard.addModelPage({ tool:key, title:'', prompt:made.tip || '', bg:made.bg || 'plain', items:made.items });
  }
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && document.querySelector('.bd-kit')){ e.preventDefault(); close(); } });
  window.FabModelKit = { open, close, add, pick, tools:TOOLS };
})();
