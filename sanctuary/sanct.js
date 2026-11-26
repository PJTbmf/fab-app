/* Fab's Sanctuary: a first playable draft (26 Nov 2026). Patrick's idea: children build up their own animal sanctuary over time,
   and learn how money works along the way (money in and out, needs before wants, a budget, saving up, and sharing).
   - Berries are the one money in Fab Fox World. A child can move berries from Fab's basket into the sanctuary's money box (their choice),
     and each day the sanctuary opens, visitors leave a thank-you berry in Fab's basket (up to 3 a day, so it never becomes a grind).
   - Wellbeing first: no debt, never below zero, nothing closes down. If the money box runs short, the Friends of the Sanctuary pay
     for the animals' needs. Animals are always fed, safe and happy. No timers, scores or ranking; no real money, adverts or random prizes.
   - Animals come to find a home (a hedge was cut back, an old tree came down). No vets, illness or injury.
   - One friend, one job: Fab runs the sanctuary and talks it through, Doctor McPhee gives a tip, Mr Elder celebrates.
   - Three levels of number work (Years 1–2, 3–4, 5–6). Every question has "Work it out for me", and "Do the rounds for me" runs a whole day in one tap.
   - Nothing about a child is kept: progress is saved on this device under their Fab code (or "local").
   The drawings are first drafts drawn in code, for Andrew to redraw. Facts, money wording and curriculum links are drafts for a teacher to check.
   Tests drive it through window.FabSanct. */
(function(){
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const clamp = (a, v, b) => Math.max(a, Math.min(b, v));
  const INK = '#2B1A12', CREAM = '#FFF6E6', PAPER = '#FFFDF7', GOLD = '#F0B913', ORANGE = '#FE4D02', MID = '#EF8247', AMBER = '#FF9416', GRASS = '#BFD88E',
    LEAF = '#8DBA5E', HEDGE = '#7FAA52', GLASS = '#CFE7F2', WATER = '#A9D6EA', SAND = '#F6D08F', WOOD = '#C98A5C', DARKWOOD = '#9C6440', STONE = '#E3C9A0',
    EARTH = '#DCC48F', PINK = '#F4B58F', ROSE = '#E98A8A', GREY = '#B8B2AA';
  const root = $('sn');
  const Q = (() => { try{ return new URLSearchParams(location.search); }catch(e){ return new URLSearchParams(''); } })();
  const EMBED = Q.get('embed') === '1';
  /* Where Back goes when the sanctuary sits inside something else: Fab Fox World (the default) or the Games page */
  const BACKTO = Q.get('back') || 'world';
  const BACKLABEL = { world:'Back to Fab Fox World', games:'Back to Games', app:'Back to the Fab App' }[BACKTO] || 'Back';
  const REDUCED = (() => { try{ return matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } })();

  /* ---------- light or dark, and sounds: shared with the Fab App, Fab Fox World and Fox Blocks on this device ---------- */
  const THEMEKEY = 'fab-theme', SNDKEY = 'bmf_sound', SND = { ctx:null, n:0 };
  const themeNow = () => { try{ return localStorage.getItem(THEMEKEY) === 'dark' ? 'dark' : 'light'; }catch(e){ return 'light'; } };
  const soundOn = () => { try{ return localStorage.getItem(SNDKEY) !== 'off'; }catch(e){ return true; } };
  function tone(f, d, type, vol, at, f2){
    if(!soundOn()) return;
    try{ const Cx = SND.ctx || (SND.ctx = new (window.AudioContext || window.webkitAudioContext)()); if(Cx.state === 'suspended') Cx.resume();
      const t = Cx.currentTime + (at || 0), o = Cx.createOscillator(), g = Cx.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if(f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol || .1, t + .015); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g); g.connect(Cx.destination); o.start(t); o.stop(t + d + .03); SND.n++; }catch(e){}
  }
  const SFX = {
    pop:() => tone(620, .08, 'triangle', .06),
    coin:() => { tone(988, .07, 'sine', .07); tone(1319, .11, 'sine', .06, .06); },
    pay:() => tone(520, .12, 'triangle', .07, 0, 420),
    step:() => tone(430 + Math.random() * 60, .06, 'triangle', .035),
    build:() => [392, 523, 659].forEach((f, i) => tone(f, .18, 'triangle', .08, i * .1)),
    arrive:() => tone(380, .3, 'sine', .07, 0, 760),
    soft:() => tone(440, .18, 'sine', .05, 0, 520),
    win:() => [523, 659, 784, 1047].forEach((f, i) => tone(f, .24, 'triangle', .08, .1 + i * .11)),
  };

  /* ---------- whose sanctuary: the Fab code on this device (never a name) ---------- */
  const clean = r => String(r || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 20);
  const who = (() => { const q = clean(Q.get('learner')); if(q) return q; try{ return clean(localStorage.getItem('fab-me')); }catch(e){ return ''; } })();
  const ME = who || 'local';
  const KEY = 'fabsanct-v1-' + ME;
  /* Fab's basket lives in Fab Fox World's save. The sanctuary never writes that save: berries moved out wait in "fabworld-spend",
     thank-you berries wait in "fabworld-pending", and Fab Fox World settles both the next time it opens or wakes. */
  const WORLDK = 'fabworld-v2-' + ME, PENDK = 'fabworld-pending-' + ME, SPENDK = 'fabworld-spend-' + ME;
  const num = k => { try{ return parseInt(localStorage.getItem(k), 10) || 0; }catch(e){ return 0; } };
  const bump = (k, n) => { try{ localStorage.setItem(k, String(num(k) + n)); }catch(e){} };
  const world = () => { try{ return JSON.parse(localStorage.getItem(WORLDK) || 'null') || {}; }catch(e){ return {}; } };
  const basket = () => { const w = world(); return Math.max(0, Math.floor((typeof w.spk === 'number' ? w.spk : 0) + num(PENDK) - num(SPENDK))); };
  const todayStr = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };

  const fresh = () => ({ v:1, level:2, box:20, jar:0, goal:null, shared:0, day:0, homes:{}, names:{}, extras:{}, price:3, tries:[], last:null,
    week:{ inn:0, out:0, n:0 }, thanks:{ d:'', n:0 }, visitors:0, helped:0, moved:0, goalsMet:0, started:false, cele:{} });
  let S = fresh();
  try{ const j = JSON.parse(localStorage.getItem(KEY) || 'null'); if(j && j.v === 1){ S = Object.assign(fresh(), j); S.week = Object.assign(fresh().week, j.week || {}); S.thanks = Object.assign(fresh().thanks, j.thanks || {}); } }catch(e){}
  const save = () => { try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} };

  /* ---------- what can be built ---------- */
  const HOMES = [
    { k:'hedgehog', n:'Hedgehog house', a:'hedgehog', cost:10, need:1, names:['Conker', 'Prickles', 'Acorn'],
      why:'A hedge near a farm was cut back, so a hedgehog needs a new place to snuffle.', fact:'Hedgehogs snuffle for beetles and worms, mostly at night.' },
    { k:'rabbit', n:'Rabbit run', a:'rabbit', cost:15, need:2, names:['Clover', 'Bobbin', 'Daisy'],
      why:'A rabbit’s old hutch was too small, so a rabbit is looking for a roomy run.', fact:'Rabbits love to hop, dig and munch grass and hay.' },
    { k:'owl', n:'Owl box', a:'owl', cost:18, need:2, names:['Hoot', 'Moonbeam', 'Twig'],
      why:'An old tree came down in a storm, so an owl is looking for a cosy box.', fact:'Owls mostly hunt at night, so in the day this one likes a doze.' },
    { k:'duck', n:'Duck pond', a:'duck', cost:20, need:2, names:['Puddle', 'Splash', 'Dabble'],
      why:'A farm pond was filled in, so a duck and her duckling need a new pond to paddle in.', fact:'Ducks have waterproof feathers. They keep them oiled by preening.' },
    { k:'tortoise', n:'Tortoise garden', a:'tortoise', cost:24, need:2, names:['Pebble', 'Shelly', 'Sage'],
      why:'A tortoise’s family moved to a flat with no garden, so she needs a sunny garden.', fact:'Tortoises can live for a very long time, often more than 50 years.' },
    { k:'otter', n:'Otter pond', a:'otter', cost:40, need:3, names:['Ripple', 'Otis', 'Bubbles'], big:true,
      why:'A river bank was built on, so an otter needs a pond with a slide.', fact:'Otters have thick fur that keeps them warm in cold water.' },
  ];
  const EXTRAS = [
    { k:'flowers', n:'Flower beds', cost:5, kind:'want', vis:1, d:'Bright flowers by the path. Brings 1 more visitor a day.' },
    { k:'bunting', n:'Bunting', cost:6, kind:'want', vis:1, d:'Flags across the sanctuary. Brings 1 more visitor a day.' },
    { k:'bench', n:'A bench', cost:8, kind:'want', vis:1, d:'Somewhere to sit and watch. Brings 1 more visitor a day.' },
    { k:'cafe', n:'The café', cost:25, kind:'make', d:'One visitor in every two buys a drink: 1 berry each.' },
    { k:'stall', n:'The gift stall', cost:30, kind:'make', d:'One visitor in every three buys a badge: 1 berry each.' },
  ];
  const H = k => HOMES.find(h => h.k === k), X = k => EXTRAS.find(x => x.k === k);
  const thing = k => H(k) || X(k);
  /* six plots: four along the top path, two beside the main path; filled in this order unless a plot is chosen */
  const PLOTS = [ { id:'a', x:170, y:165 }, { id:'b', x:450, y:165 }, { id:'c', x:750, y:165 }, { id:'d', x:1030, y:165 }, { id:'e', x:325, y:490 }, { id:'f', x:875, y:490 } ];
  const PLOTORDER = ['e', 'f', 'b', 'c', 'a', 'd'];
  const homeAt = id => S.homes[id] ? H(S.homes[id]) : null;
  const built = k => Object.values(S.homes).includes(k) || !!S.extras[k];
  const homesBuilt = () => Object.values(S.homes).map(H).filter(Boolean);
  const freePlot = () => PLOTORDER.find(id => !S.homes[id]) || null;
  const nameOf = k => S.names[k] || '';
    const LEVELWORD = { 1:'Years 1–2', 2:'Years 3–4', 3:'Years 5–6' };
  const priceFor = () => S.level === 1 ? 1 : S.level === 2 ? 2 : clamp(1, S.price || 3, 5);
  const needsToday = () => homesBuilt().reduce((a, h) => a + h.need, 0);

  /* ---------- drawing (first drafts drawn in code, in the Fab Fox World look) ---------- */
  const f1 = n => Math.round(n * 10) / 10;
  const pt = p => f1(p[0]) + ' ' + f1(p[1]);
  function rng(seed){ let s = (Math.floor(seed * 7919) + 1) % 4294967296; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; }
  function smooth(pts, closed){
    const N = pts.length, g = i => closed ? pts[(i + N) % N] : pts[clamp(0, i, N - 1)];
    let d = 'M' + pt(pts[0]);
    for(let i = 0; i < (closed ? N : N - 1); i++){
      const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
      d += 'C' + pt([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]) + ' ' + pt([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]) + ' ' + pt(p2);
    }
    return d + (closed ? 'Z' : '');
  }
  function blob(cx, cy, rx, ry, seed, n, j){ n = n || 12; j = j == null ? .06 : j; const r = rng(seed || 1), p = []; for(let i = 0; i < n; i++){ const a = i / n * Math.PI * 2, k = 1 + (r() - .5) * 2 * j; p.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); } return smooth(p, true); }
  const SW = 4.5;
  const P = (d, fill, w, more) => `<path d="${d}" fill="${fill || 'none'}"${more && / stroke="/.test(more) ? '' : ` stroke="${INK}"`} stroke-width="${w == null ? SW : w}" stroke-linejoin="round" stroke-linecap="round"${more || ''}/>`;
  const E = (cx, cy, rx, ry, fill, w, more) => `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="${fill || 'none'}" stroke="${INK}" stroke-width="${w == null ? SW : w}"${more || ''}/>`;
  const C = (cx, cy, r, fill, w, more) => E(cx, cy, r, r, fill, w, more);
  const R = (x, y, w, h, rx, fill, sw, more) => `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="${rx || 0}" fill="${fill || 'none'}" stroke="${INK}" stroke-width="${sw == null ? SW : sw}" stroke-linejoin="round"${more || ''}/>`;
  const dot = (x, y, r) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${r || 3.4}" fill="${INK}"/>`;
  const T = (x, y, s, txt, more) => `<text x="${f1(x)}" y="${f1(y)}" font-size="${s}" text-anchor="middle" font-family="Aleo,Georgia,serif" font-style="italic" font-weight="700" fill="${INK}"${more || ''}>${esc(txt)}</text>`;
  /* round shapes with one outline round the outside: hedges, trees, leaf piles */
  function clump(cs, fill, w){ w = w == null ? SW : w; return cs.map(c => `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${f1(c[2] + w / 2)}" fill="${INK}"/>`).join('') + cs.map(c => `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${f1(c[2] - w / 2)}" fill="${fill}"/>`).join(''); }
  const g = (x, y, inner, more) => `<g transform="translate(${f1(x)} ${f1(y)})"${more || ''}>${inner}</g>`;
  function berryDot(x, y, r){ return C(x, y, r, '#7A4FA0', 2.4) + `<circle cx="${f1(x - r * .35)}" cy="${f1(y - r * .35)}" r="${f1(r * .28)}" fill="#fff" opacity=".7"/>`; }

  /* the animals: each stands on (0,0), about 100 wide */
  const ANIMAL = {
    hedgehog:() => {
      const spikes = []; for(let i = 0; i <= 16; i++){ const a = Math.PI * (1.02 + i / 16 * .98), r = i % 2 ? 50 : 40; spikes.push([-4 + Math.cos(a) * r * 1.05, -18 + Math.sin(a) * r * .78]); }
      return E(0, -4, 34, 5, 'rgba(43,26,18,.15)', 0) + P('M-46 -14' + spikes.map(p => 'L' + pt(p)).join('') + 'L44 -14 C40 -2 -40 -2 -46 -14Z', '#8A5A3C') +
        P('M20 -30 C34 -34 52 -26 58 -14 C50 -6 30 -4 18 -10 Z', SAND) + dot(58, -15, 4.2) + dot(34, -22, 3.4) + P('M-26 -4v6M-6 -3v6M14 -4v6', 'none', 4);
    },
    rabbit:() => E(0, -4, 34, 6, 'rgba(43,26,18,.15)', 0) +
      `<g transform="rotate(-8 22 -78)">${E(16, -80, 8, 24, '#C9B8A6')}${E(16, -80, 3.6, 15, PINK, 0)}</g><g transform="rotate(10 34 -78)">${E(32, -80, 8, 24, '#C9B8A6')}${E(32, -80, 3.6, 15, PINK, 0)}</g>` +
      E(-4, -28, 34, 26, '#C9B8A6') + C(-36, -30, 10, CREAM) + C(26, -50, 19, '#C9B8A6') + dot(32, -54, 3.6) + P('M42 -46l3 2-3 2z', ROSE, 2) + P('M-20 -4h14M8 -4h14', 'none', 4.5),
    owl:() => E(0, -4, 30, 6, 'rgba(43,26,18,.15)', 0) + P('M-27 -70L-25 -98L-8 -82Z', WOOD, 4) + P('M27 -70L25 -98L8 -82Z', WOOD, 4) +
      P('M-30 -60C-34 -92 34 -92 30 -60C32 -26 22 -6 0 -6C-22 -6 -32 -26 -30 -60Z', WOOD) + P('M-16 -46C-18 -26 18 -26 16 -46C14 -58 -14 -58 -16 -46Z', SAND, 3.4) +
      P('M-7 -44l3 3 3-3M3 -38l3 3 3-3M-9 -34l3 3 3-3', 'none', 2.6) + C(-12, -70, 11, CREAM, 3.6) + C(12, -70, 11, CREAM, 3.6) +
      P('M-19 -70Q-12 -64 -5 -70M5 -70Q12 -64 19 -70', 'none', 3.4) + P('M-4 -62l4 7 4-7z', GOLD, 2.8) + P('M-10 -6v6M10 -6v6', 'none', 4),
    duck:(col) => P('M-50 -2Q0 10 50 -2', 'none', 3, ' opacity=".5"') +
      P('M-44 -22C-46 -6 30 4 40 -14C46 -26 28 -30 14 -26L-30 -30Z', col || '#FFFBF2') + P('M-44 -22L-54 -34L-30 -30', col || '#FFFBF2') + P('M-14 -22Q2 -12 18 -22', 'none', 3.4) +
      C(24, -42, 16, col || '#FFFBF2') + P('M38 -46Q54 -44 52 -38Q46 -34 37 -38Z', AMBER, 3.4) + dot(27, -46, 3.4),
    tortoise:() => E(0, -2, 44, 6, 'rgba(43,26,18,.15)', 0) +
      E(-36, -4, 11, 8, '#C9BF86', 4) + E(-12, -2, 10, 7, '#C9BF86', 4) + E(14, -2, 10, 7, '#C9BF86', 4) + E(36, -4, 11, 8, '#C9BF86', 4) +
      P('M40 -20C52 -30 70 -24 66 -12C62 -4 46 -6 40 -12Z', '#C9BF86') + dot(58, -18, 3.2) +
      P('M-46 -12C-44 -56 44 -56 46 -12Z', '#9DAF63') + P('M-46 -12H46', 'none', 5) + P('M-22 -12L-14 -34H14L22 -12M-14 -34L-30 -26M14 -34L30 -26M-8 -48L-14 -34M8 -48L14 -34', 'none', 3),
    otter:() => P('M-60 -8Q-20 4 40 -6', 'none', 3, ' opacity=".5"') + P('M-58 -14C-74 -10 -82 -20 -76 -24C-66 -24 -60 -20 -50 -20Z', '#7B4E33') +
      P('M-52 -22C-50 -38 26 -40 38 -24C40 -10 -46 -6 -52 -22Z', '#8A5A3C') + P('M-30 -30C-18 -38 14 -38 24 -30C14 -26 -18 -24 -30 -30Z', SAND, 3) +
      C(44, -30, 17, '#8A5A3C') + C(33, -44, 5.5, '#8A5A3C', 3.4) + C(53, -45, 5.5, '#8A5A3C', 3.4) + E(52, -24, 8, 6, SAND, 3) + dot(55, -27, 3.2) + dot(42, -34, 3.2) + dot(52, -34, 0) +
      P('M60 -24l12-3M60 -20l12 1', 'none', 2) + P('M-8 -40C-10 -48 4 -50 4 -40', '#8A5A3C', 3.4) + P('M10 -40C8 -48 22 -50 22 -40', '#8A5A3C', 3.4),
  };
  const an = (x, y, k, sc, col) => g(x, y, `<g class="an" data-a="${k}">${sc ? `<g transform="scale(${sc})">${ANIMAL[k](col)}</g>` : ANIMAL[k](col)}</g>`);
  /* the homes: each centred on its plot, inside about 240 by 170 */
  const HOME = {
    hedgehog:() => P(blob(0, 8, 110, 72, 3), '#D8C58F') + clump([[60, -40, 16], [76, -30, 14], [48, -26, 13]], '#E1A15A', 4) + clump([[-92, 40, 12], [-78, 52, 11]], '#C9884A', 4) +
      P('M-96 0L-50 -62L-4 0Z', DARKWOOD) + P('M-84 0V44H-16V0', WOOD) + P('M-80 -12L-50 -48L-20 -12M-70 -26h40', 'none', 3) + P('M-62 44V22a12 12 0 0 1 24 0V44Z', INK, 3) +
      an(48, 54, 'hedgehog'),
    rabbit:() => P(blob(0, 8, 112, 72, 4), '#CDE3A4') + P('M-104 -10L-62 -52L-20 -10Z', DARKWOOD) + R(-98, -12, 72, 54, 4, WOOD) + R(-88, 0, 28, 30, 3, '#5B3A26', 3) + P('M-60 0v30M-88 15h28', 'none', 2.4, ` stroke="${CREAM}"`) +
      R(-16, -38, 112, 84, 6, 'rgba(255,255,255,.25)') + P('M6 -38V46M28 -38V46M50 -38V46M72 -38V46M-16 -16H96M-16 6H96M-16 28H96', 'none', 1.8) +
      an(32, 40, 'rabbit'),
    owl:() => P(blob(0, 10, 110, 70, 5), '#D8C58F') + R(-72, -36, 18, 110, 3, DARKWOOD) + R(-104, -98, 82, 70, 6, WOOD) + P('M-110 -98L-63 -124L-16 -98Z', DARKWOOD) + C(-63, -64, 15, INK, 3) +
      P('M-30 30C-10 18 70 18 96 30C86 44 -18 46 -30 30Z', '#A9784F') + an(40, 28, 'owl'),
    duck:() => P(blob(0, 6, 112, 74, 6), '#CDE3A4') + P(blob(10, 12, 92, 54, 7, 14, .05), WATER) + P(blob(10, 14, 70, 36, 8), '#BFE2F1', 0) +
      P('M-88 -14v-40M-78 -10v-48M-96 -8v-30', 'none', 4.2, ` stroke="#5E8C3A"`) + E(-88, -58, 4, 10, DARKWOOD, 2.6) + E(-78, -62, 4, 10, DARKWOOD, 2.6) +
      P('M60 34a14 9 0 1 0 1 0Z', LEAF, 3) + an(-6, 30, 'duck') + an(58, 4, 'duck', .55, '#F7DC7A'),
    tortoise:() => P(blob(0, 8, 112, 72, 9), '#EBD39A') + P(blob(-70, -30, 26, 18, 10), STONE) + P(blob(-40, -46, 18, 13, 11), STONE) + P(blob(86, -16, 20, 15, 12), STONE) +
      clump([[70, 36, 13], [86, 30, 12], [80, 46, 11]], '#9CC46A', 4) + clump([[-84, 40, 12], [-70, 46, 11]], '#9CC46A', 4) + P('M74 34q6 -6 10 0M-82 42q6 -6 10 0', 'none', 2.4) +
      an(-6, 40, 'tortoise'),
    otter:() => P(blob(0, 6, 114, 76, 13), '#CDE3A4') + P(blob(14, 16, 96, 54, 14, 14, .05), WATER) + P(blob(16, 20, 72, 34, 15), '#BFE2F1', 0) +
      P(blob(-84, -40, 30, 24, 16), GREY) + P(blob(-56, -54, 26, 20, 17), '#C9C3BA') + P('M-70 -64C-40 -40 -30 -10 -10 2', 'none', 22, ` stroke="${INK}"`) + P('M-70 -64C-40 -40 -30 -10 -10 2', 'none', 13, ` stroke="#E2F2FA"`) + P('M-66 -60C-40 -38 -30 -12 -14 -2', 'none', 2.4, ` stroke="${WATER}"`) +
      an(24, 30, 'otter'),
  };
  const EMPTY = () => P(blob(0, 8, 104, 68, 21), '#E6D3A4', 4, ' stroke-dasharray="14 12"') + R(-6, -12, 12, 62, 3, DARKWOOD) +
    P('M-74 -58H74L70 -6H-70Z', PAPER) + T(0, -38, 22, 'A home for') + T(0, -14, 22, 'an animal') + C(0, 44, 15, GOLD, 3.6) + P('M0 36v16M-8 44h16', 'none', 3.6);
  const SPOT = label => P(blob(0, 0, 100, 60, 23), '#E6D3A4', 4, ' stroke-dasharray="14 12"') + R(-5, -6, 10, 46, 3, DARKWOOD) + P('M-86 -48H86L82 -6H-82Z', PAPER) + T(0, -20, 21, label);
  const CAFE = () => P(blob(0, 4, 112, 66, 31), '#EBD39A') + R(-90, -54, 150, 70, 6, CREAM) + R(-70, -36, 40, 30, 4, GLASS, 3.4) + R(-14, -40, 30, 56, 3, WOOD, 3.4) + R(28, -36, 26, 26, 4, GLASS, 3.4) +
    P('M-100 -54H70L64 -84H-94Z', ORANGE) + P('M-77 -54L-73 -84M-52 -54L-50 -84M-27 -54L-27 -84M-2 -54L-4 -84M23 -54L19 -84M48 -54L42 -84', 'none', 9, ` stroke="${CREAM}"`) + P('M-100 -54H70L64 -84H-94Z', 'none') +
    P('M-100 -54q12 12 24 0q12 12 24 0q12 12 24 0q12 12 24 0q12 12 24 0q12 12 24 0q12 12 22 0', 'none', 4) + R(-46, -110, 74, 26, 5, GOLD, 3.6) + T(-9, -90, 20, 'Café') +
    E(84, 30, 18, 8, WOOD, 3.4) + P('M84 30V8', 'none', 3.4) + P('M62 8C66 -14 102 -14 106 8Z', GOLD, 3.4) + E(-70, 38, 16, 7, WOOD, 3.4);
  const STALL = () => P(blob(0, 4, 112, 66, 33), '#EBD39A') + P('M-78 -64V30M78 -64V30', 'none', 6) + R(-86, -8, 172, 40, 5, WOOD) +
    P('M-92 -64H92L82 -96H-82Z', GOLD) + P('M-62 -64L-58 -96M-26 -64L-22 -96M10 -64L10 -96M44 -64L40 -96M76 -64L70 -96', 'none', 10, ` stroke="${CREAM}"`) + P('M-92 -64H92L82 -96H-82Z', 'none') +
    C(-56, -18, 10, ORANGE, 3) + C(-28, -20, 10, GLASS, 3) + C(0, -18, 10, GOLD, 3) + C(28, -20, 10, GRASS, 3) + C(56, -18, 10, PINK, 3) + R(-40, 4, 80, 20, 4, PAPER, 3) + T(0, 20, 17, 'Gifts');
  const FLOWERS = seed => { const r = rng(seed); let s = P(blob(0, 0, 62, 30, seed), '#B48A5E'); const cols = [ORANGE, GOLD, PINK, GLASS, '#FFFBF2', ROSE];
    for(let i = 0; i < 9; i++){ const x = -44 + (i % 5) * 22 + (r() - .5) * 8, y = -10 + Math.floor(i / 5) * 18 + (r() - .5) * 6, c = cols[i % cols.length];
      s += P(`M${f1(x)} ${f1(y + 4)}l${f1(-6 + r() * 4)} 14`, 'none', 3, ` stroke="#5E8C3A"`) + [0, 72, 144, 216, 288].map(a => E(x + Math.cos(a / 57.3) * 6, y + Math.sin(a / 57.3) * 6, 5, 5, c, 2.2)).join('') + C(x, y, 3.6, GOLD, 2); }
    return s; };
  const BENCH = () => E(0, 30, 60, 8, 'rgba(43,26,18,.15)', 0) + P('M-48 28V6M48 28V6M-40 -6V-34M40 -6V-34', 'none', 6) + R(-58, -2, 116, 12, 4, WOOD, 4) + R(-54, -40, 108, 12, 4, WOOD, 4) + R(-54, -22, 108, 10, 4, WOOD, 4);
  const TREE = (s, seed) => { const r = rng(seed); const cs = []; for(let i = 0; i < 7; i++){ const a = i / 7 * Math.PI * 2; cs.push([Math.cos(a) * 34 * s, -90 * s + Math.sin(a) * 26 * s, (26 + r() * 10) * s]); } cs.push([0, -96 * s, 34 * s]);
    return R(-12 * s, -50 * s, 24 * s, 54 * s, 4, WOOD) + clump(cs, LEAF) + P(`M${f1(-18 * s)} ${f1(-100 * s)}q10 -8 20 0M${f1(8 * s)} ${f1(-78 * s)}q10 -8 20 0`, 'none', 3); };

  /* visitors: woodland neighbours who come to see the animals (generic, not real people) */
  const VIS = [
    sc => g(0, 0, E(0, -2, 16, 4, 'rgba(43,26,18,.15)', 0) + E(0, -22, 16, 20, '#A8A4A0', 3.4) + C(0, -48, 13, '#FFFBF2', 3.4) + P('M-4 -60v18M4 -60v18', 'none', 4.5) + C(-10, -58, 4.5, '#A8A4A0', 2.6) + C(10, -58, 4.5, '#A8A4A0', 2.6) + dot(0, -38, 3) + P('M-14 -26h28', 'none', 6, ` stroke="${sc}"`)),
    sc => g(0, 0, E(0, -2, 16, 4, 'rgba(43,26,18,.15)', 0) + P('M-8 -14C-34 -10 -36 -44 -18 -52C-8 -56 -2 -44 -12 -40', '#D9773A', 3.4) + E(2, -22, 13, 18, '#E08A4A', 3.4) + C(4, -46, 12, '#E08A4A', 3.4) + P('M-4 -56l2-10 6 8M8 -56l4-10 4 10', '#E08A4A', 2.6) + dot(8, -48, 2.8) + P('M-10 -28h24', 'none', 6, ` stroke="${sc}"`)),
    sc => g(0, 0, E(0, -2, 14, 4, 'rgba(43,26,18,.15)', 0) + P('M-10 -8C-26 -6 -30 -16 -22 -20', 'none', 2.6) + E(0, -18, 12, 16, '#B59B85', 3.4) + C(0, -40, 11, '#B59B85', 3.4) + C(-10, -50, 7, '#B59B85', 2.8) + C(10, -50, 7, '#B59B85', 2.8) + C(-10, -50, 3, PINK, 0) + C(10, -50, 3, PINK, 0) + dot(4, -40, 2.6) + dot(10, -36, 2.4) + P('M-10 -26h20', 'none', 5, ` stroke="${sc}"`)),
  ];
  const SCARF = [ORANGE, GOLD, '#7FB069', '#5DA9D6', ROSE];

  /* the whole park, from above */
  function sceneSVG(){
    let s = `<rect width="1200" height="820" fill="${GRASS}"/>`;
    const r = rng(5);
    for(let i = 0; i < 26; i++){ const x = r() * 1200, y = 60 + r() * 720; s += `<path d="M${f1(x)} ${f1(y)}l4 -10 3 10M${f1(x + 9)} ${f1(y)}l3 -8 3 8" fill="none" stroke="#93B866" stroke-width="2.6" stroke-linecap="round"/>`; }
    /* the hedge along the top */
    const hs = []; for(let x = -30; x <= 1240; x += 52){ hs.push([x, 14 + (Math.floor(x / 52) % 2) * 8, 34 + ((x / 52) % 3) * 3]); }
    s += clump(hs, HEDGE);
    /* the paths: one up from the gate, one across, two short ones to the lower homes */
    const segs = [[[600, 860], [606, 720], [596, 600], [604, 440], [600, 300]], [[86, 300], [300, 292], [600, 302], [900, 294], [1114, 300]],
      [[600, 488], [520, 484], [436, 490]], [[600, 488], [690, 492], [764, 486]]], W = [84, 74, 54, 54], ds = segs.map(p => smooth(p, false));
    s += ds.map((d, i) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${W[i] + 2 * SW}" stroke-linecap="round" stroke-linejoin="round"/>`).join('') +
      ds.map((d, i) => `<path d="${d}" fill="none" stroke="${SAND}" stroke-width="${W[i]}" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
    [[580, 680], [622, 560], [585, 400], [300, 306], [880, 290], [1040, 304], [180, 296], [700, 300], [510, 488], [700, 494]].forEach((p, i) => { s += E(p[0], p[1], 7 + (i % 3) * 2, 5, STONE, 2.4); });
    /* trees at the sides */
    s += g(70, 520, TREE(1, 2)) + g(1135, 520, TREE(.95, 3)) + g(40, 820, TREE(1.1, 4)) + g(1165, 830, TREE(1.05, 6));
    /* bunting (a want) */
    if(S.extras.bunting){ const pts = [[40, 66], [300, 96], [600, 70], [900, 96], [1160, 66]]; s += P(smooth(pts, false), 'none', 3);
      const cols = [ORANGE, GOLD, GLASS, GRASS, PINK]; let k = 0;
      for(let i = 0; i < 4; i++){ const a = pts[i], b = pts[i + 1]; for(let t = .08; t < 1; t += .17){ const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t + Math.sin(t * Math.PI) * 10; s += `<g class="flag">${P(`M${f1(x - 12)} ${f1(y)}L${f1(x + 12)} ${f1(y)}L${f1(x)} ${f1(y + 26)}Z`, cols[k++ % 5], 3)}</g>`; } } }
    /* the homes */
    PLOTS.forEach(p => { const h = homeAt(p.id); s += g(p.x, p.y, h ? HOME[h.k]() : EMPTY(), ` data-plot="${p.id}"`); });
    /* the café and the gift stall, or the spots waiting for them */
    s += g(250, 690, S.extras.cafe ? CAFE() : SPOT('Café spot')) + g(950, 690, S.extras.stall ? STALL() : SPOT('Gift stall spot'));
    if(S.extras.flowers) s += g(478, 632, FLOWERS(41)) + g(724, 632, FLOWERS(43));
    if(S.extras.bench) s += g(702, 418, BENCH());
    /* the fence and the gate, with the hut where visitors pay */
    const fence = (x0, x1) => { let f = R(x0, 772, x1 - x0, 10, 3, WOOD, 3.6) + R(x0, 794, x1 - x0, 10, 3, WOOD, 3.6); for(let x = x0 + 14; x < x1; x += 44) f += R(x - 6, 760, 12, 62, 3, DARKWOOD, 3.6); return f; };
    s += fence(-10, 532) + fence(668, 1210);
    s += R(412, 712, 104, 86, 6, WOOD) + P('M402 714L464 674L526 714Z', ORANGE) + R(426, 728, 76, 34, 4, CREAM, 3.4) + P('M440 752h48l-5 9h-38z', WOOD, 3) + berryDot(454, 746, 6.5) + berryDot(468, 746, 6.5) + berryDot(461, 737, 6.5) + R(428, 772, 72, 20, 3, GOLD, 3) + T(464, 788, 15, 'Pay here');
    s += '<g id="snVis"></g>';
    s += R(534, 700, 22, 122, 4, STONE) + R(644, 700, 22, 122, 4, STONE) + P('M526 704C560 672 640 672 674 704', 'none', 14) + P('M526 704C560 672 640 672 674 704', 'none', 7, ` stroke="${WOOD}"`) +
      R(500, 642, 200, 46, 8, GOLD) + T(600, 673, 22, 'Fab’s Sanctuary');
    s += '<g id="snPop"></g>';
    return s;
  }
  /* a small picture of one thing for the build sheet */
  function thumb(k){
    const h = H(k); let inner = '';
    if(h) inner = HOME[k]();
    else if(k === 'cafe') inner = CAFE(); else if(k === 'stall') inner = STALL();
    else if(k === 'flowers') inner = g(0, 10, `<g transform="scale(1.5)">${FLOWERS(41)}</g>`);
    else if(k === 'bench') inner = g(0, 10, `<g transform="scale(1.4)">${BENCH()}</g>`);
    else if(k === 'bunting') inner = P('M-110 -30C-50 10 50 10 110 -30', 'none', 3) + [-80, -40, 0, 40, 80].map((x, i) => P(`M${x - 14} ${-12 + Math.abs(x) * -.18}L${x + 14} ${-12 + Math.abs(x) * -.18}L${x} ${18 + Math.abs(x) * -.18}Z`, [ORANGE, GOLD, GLASS, GRASS, PINK][i], 3)).join('');
    return `<svg class="thumb" viewBox="-144 -128 288 204" aria-hidden="true"><rect x="-144" y="-128" width="288" height="204" fill="${GRASS}"/>${inner}</svg>`;
  }
  const visFace = i => `<svg viewBox="-24 -70 48 74" aria-hidden="true">${VIS[i % 3](SCARF[i % 5])}</svg>`;

  /* hand-drawn icons for the panel (ink outline, flat fill) */
  const ICON = {
    back:P('M24.5 8L12 20l12.5 12', 'none', 3),
    soundon:P('M6 15h6l8-7v24l-8-7H6z', GOLD, 3) + P('M25 14.5c2.4 3 2.4 8 0 11M29.5 10.5c4.6 5.4 4.6 13.6 0 19', 'none', 3),
    soundoff:P('M6 15h6l8-7v24l-8-7H6z', CREAM, 3) + P('M25.5 15.5l9 9M34.5 15.5l-9 9', 'none', 3),
    moon:P('M25 5.5A15 15 0 1 0 35 25.5 11.5 11.5 0 1 1 25 5.5z', GOLD, 3),
    sun:C(20, 20, 7.5, GOLD, 2.6) + P('M20 3.5v5M20 31.5v5M3.5 20h5M31.5 20h5M8.3 8.3l3.5 3.5M28.2 28.2l3.5 3.5M8.3 31.7l3.5-3.5M28.2 11.8l3.5-3.5', 'none', 3),
    box:R(6, 14, 28, 20, 3, WOOD, 3) + P('M6 20h28', 'none', 3) + R(15, 17, 10, 3, 1, INK, 0) + berryDot(30, 11, 5),
    jar:P('M11 9h18v4c4 2 6 6 6 10v9a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-9c0-4 2-8 6-10z', '#E9F3D6', 3) + R(10, 4, 20, 6, 2, WOOD, 3) + P('M5 24c8 4 22 4 30 0v8a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z', GOLD, 3),
    share:P('M20 34C8 26 4 20 4 14a7.5 7.5 0 0 1 16-4 7.5 7.5 0 0 1 16 4c0 6-4 12-16 20z', PINK, 3),
    spend:R(5, 12, 30, 22, 4, WOOD, 3) + P('M5 19h30', 'none', 3) + berryDot(14, 9, 5) + berryDot(24, 7, 5),
    build:P('M7 33l15-15 4 4-15 15z', WOOD, 3) + P('M22 14l6-8 8 8-8 6z', GREY, 3),
    gate:P('M6 36V12M34 36V12', 'none', 4.5) + P('M4 12C12 4 28 4 36 12', 'none', 4) + R(11, 18, 18, 16, 2, WOOD, 3) + P('M17 18v16M23 18v16', 'none', 2.4),
    rounds:C(20, 20, 15, GRASS, 3) + P('M20 10v10l7 4', 'none', 3) + P('M30 6l4 4-5 2', 'none', 3),
    basket:P('M6 17h28l-3.5 17h-21z', WOOD, 3) + P('M11 17c0-8 18-8 18 0', 'none', 3) + berryDot(15, 14, 4.5) + berryDot(24, 13, 4.5) + P('M13 22v8M20 22v8M27 22v8', 'none', 2.2),
    heart:P('M20 34C8 26 4 20 4 14a7.5 7.5 0 0 1 16-4 7.5 7.5 0 0 1 16 4c0 6-4 12-16 20z', ORANGE, 3),
    tick:C(20, 20, 15, GRASS, 3) + P('M12.5 20.5l5 5 10-11', 'none', 3.4),
    eye:P('M3 20c8-11 26-11 34 0-8 11-26 11-34 0z', CREAM, 3) + C(20, 20, 6, GLASS, 3) + dot(20, 20, 2.4),
    flower:[0, 72, 144, 216, 288].map(a => E(20 + Math.cos(a / 57.3) * 8, 18 + Math.sin(a / 57.3) * 8, 6.5, 6.5, PINK, 2.6)).join('') + C(20, 18, 5, GOLD, 2.6) + P('M20 25v12', 'none', 3),
    sign:R(5, 7, 30, 18, 3, PAPER, 3) + P('M20 25v12', 'none', 4) + P('M10 13h20M10 19h12', 'none', 2.4),
    stop:R(4, 10, 32, 20, 5, GOLD, 3) + P('M11 20h18', 'none', 3),
    week:R(5, 8, 30, 27, 4, PAPER, 3) + P('M5 15h30M12 5v6M28 5v6', 'none', 3) + dot(13, 22, 2.4) + dot(20, 22, 2.4) + dot(27, 22, 2.4) + dot(13, 29, 2.4),
  };
  const svg = (k, cls) => `<svg viewBox="0 0 40 40" class="${cls || 'ic'}" aria-hidden="true">${ICON[k] || ''}</svg>`;
  const BERRY = '<img class="berry" src="world/berry.png" alt="" draggable="false">';
  const bry = n => n + ' ' + (n === 1 ? 'berry' : 'berries');
  const B = n => `<b>${BERRY}${n}</b>`;

  /* ---------- the page ---------- */
  function paintTheme(){ const d = themeNow() === 'dark'; root.classList.toggle('dark', d); document.documentElement.classList.toggle('dark', d);
    const b = $('snTheme'); b.innerHTML = svg(d ? 'sun' : 'moon') + '<span>' + (d ? 'Light' : 'Dark') + '</span>'; b.setAttribute('aria-label', d ? 'Switch to light' : 'Switch to dark'); b.setAttribute('aria-pressed', String(d)); }
  function paintSound(){ const on = soundOn(), b = $('snSound'); b.innerHTML = svg(on ? 'soundon' : 'soundoff') + '<span>' + (on ? 'Sounds on' : 'Sounds off') + '</span>'; b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-label', on ? 'Sounds are on. Turn them off' : 'Sounds are off. Turn them on'); }
  window.addEventListener('storage', e => { if(e.key === SNDKEY) paintSound(); if(e.key === THEMEKEY) paintTheme(); });
  const live = t => { $('snLive').textContent = ''; setTimeout(() => { $('snLive').textContent = t; }, 30); };

  function paintMoney(){
    const goal = S.goal && thing(S.goal);
    $('snMoney').innerHTML = `<span class="sn-chip" title="Money box">${svg('box')}<small>Money box</small> ${S.box}</span>` +
      `<span class="sn-chip" title="Savings jar">${svg('jar')}<small>Savings</small> ${S.jar}${goal ? ' of ' + goal.cost : ''}</span>`;
    $('snMoney').setAttribute('aria-label', 'Money box ' + bry(S.box) + '. Savings jar ' + bry(S.jar) + (goal ? ' of ' + goal.cost + ' for the ' + goal.n.toLowerCase() : '') + '.');
  }
  function paintScene(){
    $('snSvg').innerHTML = sceneSVG();
    const hot = $('snHot'); hot.innerHTML = '';
    const spot = (x, y, w, h, label, fn) => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', label);
      b.style.left = ((x - w / 2) / 12) + '%'; b.style.top = ((y - h / 2) / 8.2) + '%'; b.style.width = (w / 12) + '%'; b.style.height = (h / 8.2) + '%'; b.onclick = fn; hot.appendChild(b); };
    PLOTS.forEach(p => { const h = homeAt(p.id);
      spot(p.x, p.y + 4, 236, 168, h ? h.n + (nameOf(h.k) ? ': ' + nameOf(h.k) + ' the ' + h.a + ' lives here' : '') : 'A home for an animal: build here', () => h ? meet(h, p) : buildSheet('homes', p.id)); });
    spot(250, 686, 220, 140, S.extras.cafe ? 'The café' : 'The café spot: build the café', () => S.extras.cafe ? say('fab', 'The café is busy. One visitor in every two buys a drink, so it brings in more berries every day.') : buildSheet('make'));
    spot(950, 686, 220, 140, S.extras.stall ? 'The gift stall' : 'The gift stall spot: build the gift stall', () => S.extras.stall ? say('fab', 'The gift stall sells badges. One visitor in every three buys one.') : buildSheet('make'));
    spot(600, 735, 150, 150, 'The gate: open for the day', () => { if(!DAY) startDay(); });
  }
  /* tap a home: say hello to the animal */
  function meet(h, p){
    SFX.pop(); const el = $('snSvg').querySelector(`[data-plot="${p.id}"] .an`); if(el){ el.classList.remove('hop'); void el.getBBox(); el.classList.add('hop'); setTimeout(() => el.classList.remove('hop'), 700); }
    const nm = nameOf(h.k) || 'The ' + h.a;
    const lines = { hedgehog:'is snuffling about in the leaves', rabbit:'is hopping round the run', owl:'is having a doze in the owl box', duck:'and her duckling are paddling round the pond', tortoise:'is warming up in the sun', otter:'is floating on her back' };
    if(!DAY) side('home', `<b>${esc(nm)}</b> ${lines[h.k]}. Happy and safe. ${esc(h.fact)}`);
    else live(nm + ' ' + lines[h.k] + '.');
  }

  /* ---------- talking: one friend at a time ---------- */
  const SAYCLS = { fab:'', doc:' tip', elder:' cheer' };
  const sayHTML = (w, html) => `<div class="sn-say${SAYCLS[w] || ''}"><div class="sn-who ${w}" role="img" aria-label="${w === 'fab' ? 'Fab' : w === 'doc' ? 'Doctor McPhee' : 'Mr Elder'}"></div><div class="sn-bubble">${html}</div></div>`;
  function say(w, html){ if(DAY){ live(String(html).replace(/<[^>]+>/g, '')); return; } side('home', html, w); }

  /* ---------- the panel ---------- */
  let DAY = null, VIEW = 'home';
  function side(view, line, w){
    VIEW = view || VIEW; const el = $('snSide'); let h = '';
    if(VIEW === 'home') h = homePanel(line, w);
    else if(DAY) h = dayPanel();
    el.innerHTML = h; el.scrollTop = 0; paintMoney(); wire(el);
  }
  function moneyBox(){
    const goal = S.goal && thing(S.goal), pc = goal ? Math.min(100, Math.round(S.jar / goal.cost * 100)) : 0;
    return `<div class="sn-box"><h2>${svg('box')} The sanctuary’s money</h2><ul class="sn-lines">
      <li><span>Money box (to spend)</span>${B(S.box)}</li>
      <li><span>Savings jar${goal ? ' for the ' + esc(goal.n.toLowerCase()) : ''}</span>${B(S.jar)}${goal ? ' <span>of ' + goal.cost + '</span>' : ''}</li>
      ${goal ? `<li><span class="sn-bar" style="flex:1" role="img" aria-label="${pc} percent saved"><i class="${pc >= 100 ? 'full' : ''}" style="width:${pc}%"></i></span></li>` : ''}
      <li><span>Shared with the Friends of the Sanctuary</span>${B(S.shared)}</li>
      ${S.day ? `<li><span>Days open · visitors so far</span><b>${S.day} · ${S.visitors}</b></li>` : ''}</ul>
      <button type="button" class="sn-b wide sky" data-a="basket">${svg('basket')}<span>Add berries from Fab’s basket</span></button></div>`;
  }
  function homePanel(line, w){
    const homes = homesBuilt(), first = !S.started && !homes.length, goal = S.goal && thing(S.goal), ready = goal && S.jar >= goal.cost && !built(goal.k);
    if(!line){
      if(first) line = 'Welcome to <b>Fab’s Sanctuary</b>! Animals come here to find a safe, cosy home. The Friends of the Sanctuary have given us 20 berries to start. Shall we build a home for an animal?';
      else if(ready) line = `You have saved enough for the <b>${esc(goal.n.toLowerCase())}</b>! Tap Build and make it lovely to build it with your savings.`;
      else if(!homes.length) line = 'No animals live here yet. A hedgehog house costs 10 berries. Shall we build one?';
      else line = 'Hello again! ' + listNames(homes) + (homes.length === 1 ? ' is' : ' are') + ' happy and safe. What shall we do today?';
    }
    const acts = first ? `<button type="button" class="sn-b big gold wide" data-a="buildhomes">${svg('build')}<span>Build a home for an animal</span></button>
        <button type="button" class="sn-b wide" data-a="look">${svg('eye')}<span>Have a look around first</span></button>`
      : `<button type="button" class="sn-b big gold wide" data-a="day">${svg('gate')}<span>Open for the day</span></button>
        <button type="button" class="sn-b wide leaf" data-a="rounds">${svg('rounds')}<span>Do the rounds for me</span></button>
        <button type="button" class="sn-b wide" data-a="build">${svg('build')}<span>Build and make it lovely</span></button>`;
    return sayHTML(w || 'fab', line) + `<div class="sn-box"><span class="sn-plaque">What next?</span><div class="sn-acts">${acts}${EMBED ? `<button type="button" class="sn-b wide" data-a="leave">${svg('back')}<span>${esc(BACKLABEL)}</span></button>` : ''}</div></div>` +
      moneyBox() +
      `<div class="sn-box"><h3>Number work</h3><div class="sn-level" role="group" aria-label="Number work">${[1, 2, 3].map(l => `<button type="button" data-lv="${l}" aria-pressed="${S.level === l}">${LEVELWORD[l]}</button>`).join('')}</div>
        <p class="sn-note">${S.level === 1 ? 'Count the visitors and tap to pay. Visitors pay 1 berry each.' : S.level === 2 ? 'Add the money in and work out what’s left. Visitors pay 2 berries each.' : 'Plan for a week and choose the gate price yourself.'}</p></div>` +
      teacherNote() + (EMBED ? '' : '<p class="sn-foot">A first draft of Fab’s Sanctuary. <a href="index.html">Back to the Fab App</a></p>');
  }
  const listNames = hs => { const n = hs.map(h => nameOf(h.k) ? '<b>' + esc(nameOf(h.k)) + '</b>' : 'the ' + h.a); return n.length === 1 ? n[0].replace(/^the/, 'The') : n.slice(0, -1).join(', ') + ' and ' + n[n.length - 1]; };
  function teacherNote(){
    return `<details class="sn-box sn-note"><summary>For teachers: what this teaches</summary>
      <p>A first draft. The money wording, animal facts and curriculum links are for a teacher to check.</p>
      <ul><li><b>Maths</b> (statutory): counting and money in Years 1–2, adding and subtracting amounts and what’s left in Years 3–4, multiplying and planning a budget in Years 5–6. Berries stand in for coins; a teacher can link back to £ and p.</li>
      <li><b>Citizenship</b>: financial literacy (budgeting, saving, spending, needs and wants) becomes statutory in primary from September 2028.</li>
      <li><b>PSHE</b> (economic wellbeing, non-statutory): spending, saving and sharing; making choices; how charities raise money.</li></ul>
      <p>Oak National Academy units that sit nearby: Year 2 <i>Money: recognise coins and use £ and p symbols</i>; Year 4 <i>Money: apply efficient strategies when calculating with money</i>. Contains public sector information licensed under the Open Government Licence v3.0.</p>
      <p>Wellbeing: no debt, nothing is lost, animals are always looked after, no timers or scores. Every question has “Work it out for me”, and “Do the rounds for me” runs a whole day in one tap.</p></details>`;
  }

  /* ---------- a day at the sanctuary: needs first, open the gate, then spend, save or share ---------- */
  function startDay(){
    if(DAY) return; SFX.pop();
    const needs = needsToday();
    DAY = { step:'needs', needs, paid:0, friends:0, q:null, done:{}, visitors:0, price:priceFor(), gate:0, cafe:0, stall:0, box:0, total:0, save:0, share:0, auto:false };
    if(!homesBuilt().length) DAY.done.needs = true;
    else if(S.box < needs){ DAY.friends = needs - S.box; DAY.paid = S.box; S.box = 0; S.helped += DAY.friends; DAY.done.needs = true; save(); }
    else DAY.q = needsQ();
    S.started = true; save(); paintScene(); side('day');
  }
  const STEPS = [['needs', 'Needs'], ['gate', 'Gate'], ['jars', 'Jars']];
  function stepBar(){ const D = DAY, i = D.step === 'needs' ? 0 : D.step === 'gate' || D.step === 'walk' || D.step === 'money' ? 1 : 2;
    const done = j => j < i || D.step === 'end' || (j === 0 && D.done.needs) || (j === 1 && D.done.money);
    return `<ol class="sn-steps" aria-label="Today">${STEPS.map((s, j) => `<li class="${done(j) ? 'done' : j === i ? 'now' : ''}"${j === i && D.step !== 'end' ? ' aria-current="step"' : ''}>${j + 1}. ${s[1]}</li>`).join('')}</ol>`; }
  function dayPanel(){
    const D = DAY; let h = stepBar();
    if(D.step === 'needs'){
      const hs = homesBuilt();
      h += `<div class="sn-box"><span class="sn-plaque leaf">1. Needs first</span>`;
      if(!hs.length) h += `<p>No animals live here yet, so there are no needs to pay today. Visitors still like to see the garden.</p>`;
      else {
        h += `<p>Every day the animals need food and fresh bedding. Needs come before wants.</p><ul class="sn-lines">` +
          hs.map(x => `<li><span>${nameOf(x.k) ? esc(nameOf(x.k)) + ' (' + esc(x.a === 'duck' ? 'duck and duckling' : x.a) + ')' : esc(x.a === 'duck' ? 'The duck and duckling' : 'The ' + x.a)}</span>${B(x.need)}</li>`).join('') + `<li class="total"><span>Needs today</span>${B(D.needs)}</li></ul>`;
        if(D.friends) h += `</div>` + sayHTML('fab', `The money box had ${bry(D.paid)}, and food and bedding cost ${D.needs} today. The <b>Friends of the Sanctuary</b> paid the other ${D.friends}, so every animal has what it needs. Animals here are always looked after.`) + `<div class="sn-box">`;
        else if(!D.done.needs) h += qHTML(D.q);
        else h += `<p><b>${bry(D.needs)} paid.</b> Every animal has food and fresh bedding.</p>`;
      }
      h += `</div>`;
      if(D.done.needs) h += `<button type="button" class="sn-b big gold wide" data-a="togate">${svg('gate')}<span>Next: the gate</span></button>`;
    }
    else if(D.step === 'gate'){
      h += `<div class="sn-box"><span class="sn-plaque leaf">2. Open the gate</span>`;
      if(S.level === 3){
        h += `<p>You choose the gate price. A lower price brings more visitors; a higher price brings fewer. Try different prices on different days and see what happens.</p>
          <div class="sn-row"><div class="sn-step"><button type="button" data-a="pricedown" aria-label="Lower the price" ${D.price <= 1 ? 'disabled' : ''}>−</button></div><b style="font-size:1.4em">${BERRY} ${D.price} each</b><div class="sn-step"><button type="button" data-a="priceup" aria-label="Raise the price" ${D.price >= 5 ? 'disabled' : ''}>+</button></div></div>`;
        const tr = (S.tries || []).slice(-3).reverse();
        if(tr.length) h += `<ul class="sn-lines">${tr.map(t => `<li><span>Day ${t.d}: ${t.p} each, ${t.v} visitors</span>${B(t.g)}</li>`).join('')}</ul>`;
      } else h += `<p>Visitors pay <b>${bry(D.price)}</b> each at the gate to see the animals.</p>`;
      h += `</div><button type="button" class="sn-b big gold wide" data-a="open">${svg('gate')}<span>Open the gate</span></button>`;
    }
    else if(D.step === 'walk'){
      h += `<div class="sn-box"><span class="sn-plaque leaf">2. Open the gate</span><p>Visitors are arriving…</p></div><button type="button" class="sn-b wide" data-a="skip">Skip to the money</button>`;
    }
    else if(D.step === 'money'){
      h += `<div class="sn-box"><span class="sn-plaque leaf">Money in</span><ul class="sn-lines">` +
        `<li><span>Gate: ${D.visitors} visitors × ${D.price}</span>${B(D.gate)}</li>` +
        (S.extras.cafe ? `<li><span>Café drinks</span>${B(D.cafe)}</li>` : '') + (S.extras.stall ? `<li><span>Gift stall badges</span>${B(D.stall)}</li>` : '') +
        `<li><span>Friends of the Sanctuary box</span>${B(D.box)}</li>` + (D.done.money ? `<li class="total"><span>Money in today</span>${B(D.total)}</li>` : '') + `</ul>`;
      if(!D.done.money) h += (S.level === 1 ? `<div class="sn-faces" aria-hidden="true">${Array.from({ length:D.visitors }, (_, i) => visFace(i)).join('')}</div>` : '') + qHTML(D.q);
      h += `</div>`;
      if(D.done.money) h += `<button type="button" class="sn-b big gold wide" data-a="tojars">${svg('jar')}<span>Next: spend, save or share</span></button>`;
    }
    else if(D.step === 'jars'){
      const spend = D.total - D.save - D.share, goal = S.goal && thing(S.goal);
      h += sayHTML('fab', `Where shall today’s <b>${bry(D.total)}</b> go? There’s no wrong answer.`) +
        `<div class="sn-jars">
          <div class="sn-jar">${svg('spend')}<h4>Spend</h4><span class="n">${spend}</span><small>Money box: for homes and things that make it lovely</small></div>
          <div class="sn-jar">${svg('jar')}<h4>Save</h4><span class="n">${D.save}</span><small>${goal ? 'Savings jar: ' + (S.jar + D.save) + ' of ' + goal.cost + ' for the ' + esc(goal.n.toLowerCase()) : 'Savings jar: for something big'}</small>
            <div class="sn-step"><button type="button" data-a="saveless" aria-label="Save one less" ${D.save <= 0 ? 'disabled' : ''}>−</button><button type="button" data-a="savemore" aria-label="Save one more" ${spend <= 0 ? 'disabled' : ''}>+</button></div></div>
          <div class="sn-jar">${svg('share')}<h4>Share</h4><span class="n">${D.share}</span><small>Friends of the Sanctuary: they help animals everywhere find a home</small>
            <div class="sn-step"><button type="button" data-a="shareless" aria-label="Share one less" ${D.share <= 0 ? 'disabled' : ''}>−</button><button type="button" data-a="sharemore" aria-label="Share one more" ${spend <= 0 ? 'disabled' : ''}>+</button></div></div>
        </div>` + (S.level === 3 && goal && S.jar < goal.cost ? `<p class="sn-note">Saving ${Math.max(1, D.save)} a day, the ${esc(goal.n.toLowerCase())} takes about ${Math.ceil((goal.cost - S.jar) / Math.max(1, D.save))} days.</p>` : '') +
        (goal ? '' : `<button type="button" class="sn-b wide" data-a="pickgoal">${svg('jar')}<span>Choose something to save for</span></button>`) +
        `<button type="button" class="sn-b big gold wide" data-a="putaway">${svg('tick')}<span>Put them away</span></button>`;
    }
    else if(D.step === 'end') h += endHTML();
    return h;
  }
  /* the end of the day: the budget card, the thank-you, a celebration, and a good place to stop */
  function endHTML(){
    const D = DAY, out = D.needs - D.friends, left = D.total - out;
    let h = `<div class="sn-box"><h2>${svg('sign')} Today’s budget card</h2><ul class="sn-lines">
      <li><span>Money in</span>${B(D.total)}</li><li><span>Money out (needs)</span>${B(out)}</li><li class="total"><span>What’s left</span>${B(left)}</li></ul>
      <p>${D.total - D.save - D.share} to spend, ${D.save} saved, ${D.share} shared.${D.friends ? ' The Friends of the Sanctuary helped with ' + bry(D.friends) + ' of the needs.' : ''}</p>
      <p>${D.thank ? 'Visitors left a <b>thank-you berry</b> in Fab’s basket.' : 'Fab’s basket has had its three thank-you berries today.'}</p></div>`;
    if(D.weekCard) h += `<div class="sn-box"><h2>${svg('week')} Your week</h2><ul class="sn-lines"><li><span>Money in this week</span>${B(D.weekCard.inn)}</li><li><span>Money out this week</span>${B(D.weekCard.out)}</li><li class="total"><span>What’s left this week</span>${B(D.weekCard.inn - D.weekCard.out)}</li></ul></div>`;
    h += D.cheer ? sayHTML('elder', D.cheer) : sayHTML('fab', D.auto ? 'I did the rounds: the animals are fed, the gate was open and today’s berries are in the money box.' : 'What a lovely day. The animals are fed, safe and happy.');
    h += `<div class="sn-box"><span class="sn-plaque sky">A good place to stop</span><p>Everything is saved. The animals will be happy and safe until you come back.</p></div>
      <div class="sn-box"><span class="sn-plaque">What next?</span><div class="sn-acts">
      <button type="button" class="sn-b wide gold" data-a="build">${svg('build')}<span>Build and make it lovely</span></button>
      <button type="button" class="sn-b wide leaf" data-a="again">${svg('gate')}<span>Open another day</span></button>
      <button type="button" class="sn-b wide" data-a="home">${svg('eye')}<span>Look around the sanctuary</span></button>
      ${EMBED ? `<button type="button" class="sn-b wide" data-a="leave">${svg('back')}<span>${esc(BACKLABEL)}</span></button>` : ''}</div></div>`;
    return h;
  }

  /* ---------- questions (three levels), always with a way through ---------- */
  function opts(right, wrongs){ const set = [right]; wrongs.forEach(w => { if(w >= 0 && !set.includes(w) && set.length < 3) set.push(w); }); let k = 1; while(set.length < 3){ const w = right + k * (k % 2 ? 1 : -1) * 2; if(w >= 0 && !set.includes(w)) set.push(w); k++; }
    const r = rng(S.day * 31 + right * 7 + S.level); for(let i = set.length - 1; i > 0; i--){ const j = Math.floor(r() * (i + 1)); [set[i], set[j]] = [set[j], set[i]]; } return set; }
  function needsQ(){
    const n = needsToday(), b = S.box;
    if(S.level === 1) return { kind:'tap', n, tapped:0, ask:`Tap ${bry(n)} to pay for food and bedding.`, show:`${n} berries paid.` };
    if(S.level === 2) return { kind:'pick', right:b - n, opts:opts(b - n, [b - n + 1, b - n - 1, b + n]), ask:`You have ${bry(b)}. Food and bedding cost ${n}. How many berries will be left?`,
      tip:n <= 5 ? `Try counting back ${n} from ${b}: ${Array.from({ length:n }, (_, i) => b - i - 1).join(', ')}.` : `Take away the tens first, then the ones.`, show:`${b} − ${n} = ${b - n}. There will be ${bry(b - n)} left.` };
    return { kind:'pick', right:n * 7, opts:opts(n * 7, [n * 7 + n, n + 7, n * 7 - n]), ask:`Food and bedding cost ${bry(n)} a day. How much is that for a whole week (7 days)?`,
      tip:`Seven lots of ${n}. Try counting in ${n}s: ${n}, ${n * 2}, ${n * 3} … or work out ${n} × 7.`, show:`${n} × 7 = ${n * 7}. That’s ${bry(n * 7)} for the week. Today we pay ${n}.` };
  }
  function moneyQ(){
    const D = DAY;
    if(S.level === 1) return { kind:'pick', right:D.visitors, opts:opts(D.visitors, [D.visitors + 1, D.visitors - 1]), ask:'How many visitors came today?', tip:'Point to each visitor and count them one by one.', show:`${D.visitors} visitors came. Each paid 1 berry.` };
    if(S.level === 2){ const parts = [D.gate, D.cafe, D.stall, D.box].filter((v, i) => i === 0 || i === 3 || (i === 1 && S.extras.cafe) || (i === 2 && S.extras.stall));
      return { kind:'pick', right:D.total, opts:opts(D.total, [D.total + 1, D.total - 2, D.total + 10]), ask:'How many berries came in altogether?', tip:'Start with the biggest number, then count on the others.', show:parts.join(' + ') + ' = ' + D.total + '.' }; }
    return { kind:'pick', right:D.gate, opts:opts(D.gate, [D.gate + D.price, D.visitors + D.price, D.gate - D.price]), ask:`${D.visitors} visitors paid ${bry(D.price)} each at the gate. How many berries is that?`,
      tip:`${D.visitors} lots of ${D.price}. Try ${D.price} × ${D.visitors}.`, show:`${D.visitors} × ${D.price} = ${D.gate} at the gate, and ${D.total} came in altogether.` };
  }
  function qHTML(q){
    if(!q) return '';
    if(q.kind === 'tap') return `<div class="sn-q"><p class="sn-ask">${esc(q.ask)}</p><div class="sn-tap">${Array.from({ length:q.n }, (_, i) => `<button type="button" data-tap="${i}" class="${i < q.tapped ? 'paid' : ''}" aria-label="Berry ${i + 1}${i < q.tapped ? ', paid' : ''}">${BERRY}</button>`).join('')}</div>
      <p class="sn-count" aria-live="polite">${q.tapped ? Array.from({ length:q.tapped }, (_, i) => i + 1).join(', ') : ''}</p><button type="button" class="sn-b wide leaf" data-a="workout">${svg('rounds')}<span>Pay for me</span></button></div>`;
    return `<div class="sn-q"><p class="sn-ask">${esc(q.ask)}</p><div class="sn-opts">${q.opts.map(o => `<button type="button" data-pick="${o}" class="${(q.tried || []).includes(o) ? 'tried' : ''}" ${(q.tried || []).includes(o) ? 'aria-disabled="true"' : ''}>${o}</button>`).join('')}</div>
      ${q.tip && (q.tried || []).length ? sayHTML('doc', esc(q.tip)) : ''}<button type="button" class="sn-b wide leaf" data-a="workout">${svg('rounds')}<span>Work it out for me</span></button></div>`;
  }
  function answer(v){
    const D = DAY, q = D && D.q; if(!q || q.kind !== 'pick') return false;
    if(v === q.right){ SFX.coin(); finishQ(q.show, true); return true; }
    q.tried = q.tried || []; if(!q.tried.includes(v)) q.tried.push(v); SFX.soft(); side(); live('Have another go. Doctor McPhee has a tip.'); return false;
  }
  function finishQ(show, byChild){
    const D = DAY;
    if(D.step === 'needs'){ D.done.needs = true; D.paid = D.needs; S.box -= D.needs; SFX.pay(); save(); live(show + ' Food and bedding paid.'); }
    else if(D.step === 'money'){ D.done.money = true; live(show + ' Money in today: ' + bry(D.total) + '.'); }
    D.q = null; D.shown = show; side();
  }
  function tapBerry(i){ const q = DAY && DAY.q; if(!q || q.kind !== 'tap') return; if(i !== q.tapped) i = q.tapped; q.tapped = i + 1; SFX.coin(); if(q.tapped >= q.n) finishQ(q.show, true); else side(); }

  /* the gate: how many come, and what they pay */
  function visitorsFor(price){
    const homes = homesBuilt().length, wants = ['flowers', 'bunting', 'bench'].filter(k => S.extras[k]).length, w = world(), fromWorld = Math.min(3, Math.floor((w.missions || 0) / 5));
    const r = rng(S.day * 13 + 7), base = homes ? 2 + homes * 2 + wants + fromWorld + Math.floor(r() * 2) : 1 + wants + Math.floor(r() * 2);
    const k = [1, .9, .75, .55, .35][clamp(1, price, 5) - 1];
    return Math.max(1, Math.min(24, Math.round(base * k)));
  }
  function openGate(){
    const D = DAY; if(!D || D.step !== 'gate') return;
    D.visitors = visitorsFor(D.price); D.gate = D.visitors * D.price; D.cafe = S.extras.cafe ? Math.floor(D.visitors / 2) : 0; D.stall = S.extras.stall ? Math.floor(D.visitors / 3) : 0;
    D.box = 1 + Math.floor(D.visitors / 6); D.total = D.gate + D.cafe + D.stall + D.box;
    if(S.level === 3){ S.tries = (S.tries || []).concat([{ d:S.day + 1, p:D.price, v:D.visitors, g:D.gate }]).slice(-12); S.price = D.price; save(); }
    D.step = 'walk'; side(); walkIn(D.visitors, () => { if(DAY === D && D.step === 'walk') toMoney(); });
  }
  function toMoney(){ const D = DAY; stopWalk(true); D.step = 'money'; D.q = moneyQ(); side(); }

  /* visitors walk in through the gate, pay at the hut, and go to see an animal */
  let WALK = null;
  function stopWalk(keep){ const w = WALK; if(w){ cancelAnimationFrame(w.raf); WALK = null; }
    if(keep && w && w.list) w.list.forEach(v => { const p = v.way[v.way.length - 1]; v.el.setAttribute('transform', `translate(${p[0]} ${p[1]})`); });
    const v = $('snVis'); if(v && !keep) v.innerHTML = ''; const p = $('snPop'); if(p) p.innerHTML = ''; }
  function walkIn(n, done){
    stopWalk(); const vis = $('snVis'), pop = $('snPop'); if(!vis){ done(); return; }
    const plots = PLOTS.filter(p => S.homes[p.id]); const targets = plots.length ? plots : [{ x:420, y:165 }, { x:780, y:165 }];
    const list = []; const gap = REDUCED ? 0 : Math.max(.22, Math.min(.5, 3.2 / n));
    const XS = [-50, 50, -10, 90, -90, 30, -60, 70];
    for(let i = 0; i < n; i++){ const t = targets[i % targets.length], j = Math.floor(i / targets.length) % 8, low = t.y > 400, y = (low ? 506 : 318) + (j % 2) * 12;
      const x = low ? (t.x < 600 ? 470 + j * 15 : 730 - j * 15) : t.x + XS[j];
      const way = [[600, 870], [600, 752], [600, low ? 500 : 314], [x, y]];
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'g'), inner = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      inner.setAttribute('transform', `scale(${x > 600 ? -1.35 : 1.35} 1.35)`); inner.innerHTML = VIS[i % 3](SCARF[i % 5]); el.appendChild(inner); vis.appendChild(el); list.push({ el, way, t0:i * gap, paid:false }); }
    const speed = 330, start = performance.now();
    const segLen = w => { let L = [0]; for(let i = 1; i < w.length; i++) L.push(L[i - 1] + Math.hypot(w[i][0] - w[i - 1][0], w[i][1] - w[i - 1][1])); return L; };
    list.forEach(v => { v.L = segLen(v.way); });
    const popAt = (x, y, txt) => { const t = document.createElementNS('http://www.w3.org/2000/svg', 'g'); t.innerHTML = `<text x="${x}" y="${y}" font-size="30" text-anchor="middle" font-family="Aleo,Georgia,serif" font-weight="700" font-style="italic" fill="${INK}" stroke="${CREAM}" stroke-width="6" paint-order="stroke">${esc(txt)}</text>`; pop.appendChild(t); t._t = performance.now(); };
    if(REDUCED){ list.forEach(v => { const p = v.way[v.way.length - 1]; v.el.setAttribute('transform', `translate(${p[0]} ${p[1]})`); }); SFX.coin(); setTimeout(done, 900); WALK = { raf:0 }; return; }
    const tick = now => {
      const t = (now - start) / 1000; let all = true;
      list.forEach(v => { const d = Math.max(0, (t - v.t0) * speed), L = v.L, end = L[L.length - 1];
        if(d < end) all = false; const dd = Math.min(d, end); let i = 1; while(i < L.length - 1 && L[i] < dd) i++;
        const a = v.way[i - 1], b = v.way[i], k = (dd - L[i - 1]) / ((L[i] - L[i - 1]) || 1), x = a[0] + (b[0] - a[0]) * k, y = a[1] + (b[1] - a[1]) * k;
        const bob = d > 0 && d < end ? Math.abs(Math.sin(d / 14)) * -5 : 0;
        v.el.setAttribute('transform', `translate(${f1(x)} ${f1(y + bob)})`);
        if(!v.paid && d >= L[1]){ v.paid = true; popAt(464, 660, '+' + DAY.price); SFX.coin(); } });
      [...pop.children].forEach(c => { const a = (now - c._t) / 1000; c.setAttribute('transform', `translate(0 ${f1(-a * 60)})`); c.setAttribute('opacity', String(Math.max(0, 1 - a))); if(a > 1) c.remove(); });
      if(all && !pop.children.length){ WALK = null; setTimeout(done, 350); return; }
      if(WALK) WALK.raf = requestAnimationFrame(tick);
    };
    WALK = { raf:requestAnimationFrame(tick), list };
  }

  /* jars, then the end of the day */
  function putAway(){
    const D = DAY; if(!D || D.step !== 'jars') return;
    const spend = D.total - D.save - D.share; S.box += spend; S.jar += D.save; S.shared += D.share;
    S.day += 1; S.visitors += D.visitors; S.last = { d:S.day, inn:D.total, out:D.needs - D.friends, v:D.visitors };
    S.week.inn += D.total; S.week.out += D.needs - D.friends; S.week.n += 1;
    if(S.week.n >= 7){ D.weekCard = { inn:S.week.inn, out:S.week.out }; S.week = { inn:0, out:0, n:0 }; S.weeks = (S.weeks || 0) + 1; }
    D.thank = thankYou();
    D.cheer = celebrate([['day1', S.day === 1, 'Your first day open! Visitors came, the animals were fed, and you looked after the money. That’s real enterprise.'],
      ['share1', D.share > 0, 'Sharing is a kind thing to do. The Friends of the Sanctuary say thank you: your berries will help other animals find a home.'],
      ['week1', !!D.weekCard, 'A whole week of running the sanctuary! Look at your week card: money in, money out and what’s left.'],
      ['goal' + (S.goal || ''), !!(S.goal && S.jar >= thing(S.goal).cost), S.goal ? `You saved enough for the ${thing(S.goal).n.toLowerCase()}! Saving takes patience, and you did it.` : '']]);
    D.step = 'end'; save(); SFX.coin(); side(); paintMoney();
  }
  function thankYou(){ const d = todayStr(); if(S.thanks.d !== d) S.thanks = { d, n:0 }; if(S.thanks.n >= 3) return 0; S.thanks.n += 1; bump(PENDK, 1); return 1; }
  function celebrate(list){ for(const [k, on, txt] of list){ if(on && txt && !S.cele[k]){ S.cele[k] = 1; save(); setTimeout(() => SFX.win(), 200); return txt; } } return ''; }

  /* "Do the rounds for me": the low-energy day, all in one tap */
  function doRounds(){
    if(DAY && DAY.step !== 'needs') return; if(!DAY) startDay();
    const D = DAY; D.auto = true;
    if(!D.done.needs){ D.done.needs = true; D.paid = D.needs; S.box -= D.needs; D.q = null; }
    D.step = 'gate'; D.price = priceFor();
    D.visitors = visitorsFor(D.price); D.gate = D.visitors * D.price; D.cafe = S.extras.cafe ? Math.floor(D.visitors / 2) : 0; D.stall = S.extras.stall ? Math.floor(D.visitors / 3) : 0;
    D.box = 1 + Math.floor(D.visitors / 6); D.total = D.gate + D.cafe + D.stall + D.box; D.done.money = true; D.step = 'jars'; D.save = 0; D.share = 0;
    putAway(); walkIn(D.visitors, () => {});
  }
  function endDay(){ stopWalk(); DAY = null; side('home'); }

  /* ---------- building ---------- */
  let SHEET = null;
  function openSheet(html, small){ const s = $('snSheet'), c = $('snCard'); c.className = 'sn-card' + (small ? ' small' : ''); c.innerHTML = html; s.hidden = false; wire(c); setTimeout(() => { const f = c.querySelector('[data-first]') || c.querySelector('button'); f && f.focus(); }, 30); }
  function closeSheet(){ $('snSheet').hidden = true; $('snCard').innerHTML = ''; SHEET = null; }
  function afford(cost){
    const b = S.box, ok = b >= cost;
    if(S.level === 1) return `<p class="sum">You have ${bry(b)}. It costs ${cost}. ${ok ? '<b>You have enough!</b>' : 'Not yet: keep saving.'}</p>`;
    return `<p class="sum">${ok ? `${b} − ${cost} = <b>${b - cost}</b> left in the money box` : `You have ${b}. You need <b>${cost - b} more</b>.`}</p>`;
  }
  function itemCard(k, plot){
    const h = H(k), x = X(k), it = h || x, done = built(k), isGoal = S.goal === k, jarOK = isGoal && S.jar >= it.cost;
    const tag = h ? `<span class="tag goal">A home${h.big ? ': a big goal' : ''}</span>` : x.kind === 'want' ? '<span class="tag want">A want</span>' : '<span class="tag make">Brings in more</span>';
    let btns = '';
    if(done) btns = `<p>${svg('tick')} Built</p>`;
    else {
      if(jarOK) btns += `<button type="button" class="sn-b gold" data-build="${k}" data-from="jar"${plot ? ` data-plot="${plot}"` : ''}>${svg('jar')}<span>Build it with your savings</span></button>`;
      btns += `<button type="button" class="sn-b ${jarOK ? '' : 'gold'}" data-build="${k}"${plot ? ` data-plot="${plot}"` : ''} ${S.box >= it.cost ? '' : 'disabled'}>${svg('build')}<span>Build it</span></button>`;
      if(!isGoal) btns += `<button type="button" class="sn-b" data-goal="${k}">${svg('jar')}<span>Save up for it</span></button>`;
      else if(!jarOK) btns += `<p>${svg('jar')} Your savings goal: ${S.jar} of ${it.cost}</p>`;
    }
    return `<div class="sn-item${done ? ' built' : ''}">${thumb(k)}<div class="in">${tag}<h3>${esc(it.n)}</h3><span class="cost">${BERRY} ${it.cost} berries</span>
      <p>${h ? `For ${esc(h.a === 'duck' ? 'a duck and her duckling' : (/^[aeiou]/.test(h.a) ? 'an ' : 'a ') + h.a)}. Needs ${bry(h.need)} a day for food and bedding.` : esc(x.d)}</p>${done ? '' : afford(it.cost)}${btns}</div></div>`;
  }
  function buildSheet(which, plot){
    SFX.pop(); SHEET = { which, plot };
    const free = plot || freePlot();
    let h = `<div class="sn-cardtop"><h2 id="snCardTitle">${which === 'goal' ? 'Choose something to save for' : 'Build and make it lovely'}</h2><button type="button" class="sn-b" data-a="close" data-first>${svg('back')}<span>Close</span></button></div>`;
    h += `<p>Money box: ${B(S.box)} · Savings jar: ${B(S.jar)}${S.goal ? ' for the ' + esc(thing(S.goal).n.toLowerCase()) : ''}</p>`;
    if(which !== 'make'){ h += `<h3 class="sn-sec">${svg('build')} Homes for animals <small>${free ? 'Each home brings an animal looking for somewhere safe.' : 'Every plot has an animal living in it.'}</small></h3><div class="sn-items">` + HOMES.map(x => itemCard(x.k, plot)).join('') + `</div>`; }
    if(which !== 'homes'){ h += `<h3 class="sn-sec">${svg('flower')} Make it lovely <small>Wants: nice to have, after the needs.</small></h3><div class="sn-items">` + EXTRAS.filter(x => x.kind === 'want').map(x => itemCard(x.k)).join('') + `</div>`;
      h += `<h3 class="sn-sec">${svg('spend')} Bring in more berries</h3><div class="sn-items">` + EXTRAS.filter(x => x.kind === 'make').map(x => itemCard(x.k)).join('') + `</div>`; }
    if(which === 'homes') h += `<button type="button" class="sn-b wide" data-a="buildall">${svg('flower')}<span>See things that make it lovely</span></button>`;
    openSheet(h);
  }
  function build(k, plot, fromJar){
    const h = H(k), x = X(k), it = h || x; if(!it || built(k)) return false;
    const pay = fromJar ? 'jar' : 'box'; if(S[pay] < it.cost) return false;
    if(h){ plot = plot && !S.homes[plot] ? plot : freePlot(); if(!plot) return false; S.homes[plot] = k; } else S.extras[k] = 1;
    S[pay] -= it.cost; if(S.goal === k){ S.goal = null; if(fromJar) S.goalsMet = (S.goalsMet || 0) + 1; }
    S.started = true; save(); SFX.build(); closeSheet(); paintScene(); paintMoney();
    if(h) arrive(h, plot); else side('home', x.kind === 'want' ? `The ${esc(x.n.toLowerCase())} look${k === 'bench' ? 's' : ''} lovely! Wants make the sanctuary nicer, and a nicer sanctuary brings more visitors.` : `The ${esc(x.n.replace(/^The /, '').toLowerCase())} is open! ${esc(x.d)}`);
    return true;
  }
  /* a new animal arrives through the gate and walks to its home, then the child chooses its name */
  function arrive(h, plot){
    const p = PLOTS.find(q => q.id === plot), el = $('snSvg').querySelector(`[data-plot="${plot}"] .an`);
    const ask = () => nameSheet(h);
    if(!el || REDUCED){ ask(); return; }
    SFX.arrive(); el.style.opacity = '0';
    const vis = $('snVis'), walker = document.createElementNS('http://www.w3.org/2000/svg', 'g'); walker.innerHTML = `<g transform="scale(.8)">${ANIMAL[h.a]()}</g>`; vis.appendChild(walker);
    const way = [[600, 860], [600, p.y > 400 ? 488 : 300], [p.x, p.y > 400 ? 488 : 300], [p.x + 40, p.y + 40]], L = [0]; for(let i = 1; i < way.length; i++) L.push(L[i - 1] + Math.hypot(way[i][0] - way[i - 1][0], way[i][1] - way[i - 1][1]));
    const t0 = performance.now(), sp = 420;
    const tick = now => { const d = (now - t0) / 1000 * sp, end = L[L.length - 1], dd = Math.min(d, end); let i = 1; while(i < L.length - 1 && L[i] < dd) i++;
      const a = way[i - 1], b = way[i], k = (dd - L[i - 1]) / ((L[i] - L[i - 1]) || 1); walker.setAttribute('transform', `translate(${f1(a[0] + (b[0] - a[0]) * k)} ${f1(a[1] + (b[1] - a[1]) * k + Math.abs(Math.sin(d / 16)) * -6)})`);
      if(d < end) requestAnimationFrame(tick); else { walker.remove(); el.style.opacity = ''; ask(); } };
    requestAnimationFrame(tick);
  }
  function nameSheet(h){
    const word = h.a === 'duck' ? 'a duck and her duckling have' : (/^[aeiou]/.test(h.a) ? 'an ' : 'a ') + h.a + ' has';
    openSheet(`<div class="sn-cardtop"><h2 id="snCardTitle">${esc(word.charAt(0).toUpperCase() + word.slice(1))} come to find a home</h2></div>
      <div class="sn-item">${thumb(h.k)}<div class="in"><p>${esc(h.why)}</p><p><b>What shall we call ${h.a === 'duck' ? 'the mother duck' : 'this ' + h.a}?</b></p>
      <div class="sn-names">${h.names.map((n, i) => `<button type="button" class="sn-b ${['gold', 'leaf', 'sky'][i]}" data-name="${esc(n)}"${i ? '' : ' data-first'}>${esc(n)}</button>`).join('')}</div></div></div>`, true);
    SHEET = { name:h.k };
  }
  function setName(n){
    const k = SHEET && SHEET.name, h = k && H(k); if(!h) return; S.names[k] = n; save(); closeSheet(); paintScene();
    const cheer = celebrate([['first', homesBuilt().length === 1, `Wonderful! <b>${esc(n)}</b> has a safe, cosy home because of you. ${esc(h.fact)}`],
      ['all', homesBuilt().length === HOMES.length, 'Every home has an animal in it. What a sanctuary!']]);
    side('home', cheer || `<b>${esc(n)}</b> has moved in! ${esc(h.fact)} Remember: every animal needs ${h.need === 1 ? 'a berry' : bry(h.need)} a day for food and bedding.`, cheer ? 'elder' : 'fab');
  }
  /* berries from Fab's basket: the child's choice */
  let MOVE = 5;
  function basketSheet(){
    SFX.pop(); const have = basket(); MOVE = clamp(have ? 1 : 0, Math.min(5, have), have);
    const body = have ? `<p>Fab’s basket has ${B(have)} berries. You can move some into the sanctuary’s money box. Berries you move stay at the sanctuary to help the animals. It’s your choice.</p>
      <div class="sn-row" style="justify-content:center"><div class="sn-step"><button type="button" data-a="moveless" aria-label="One fewer">−</button></div><b style="font-size:1.6em">${BERRY} <span id="snMoveN">${MOVE}</span></b><div class="sn-step"><button type="button" data-a="movemore" aria-label="One more">+</button></div></div>
      <div class="sn-acts two"><button type="button" class="sn-b gold" data-a="moveok" data-first>${svg('basket')}<span>Move them</span></button><button type="button" class="sn-b" data-a="close">Not now</button></div>`
      : `<p>Fab’s basket is empty just now. Stars from lessons turn into berries, and so do treasures in Fab Fox World.</p><button type="button" class="sn-b" data-a="close" data-first>${svg('back')}<span>Close</span></button>`;
    openSheet(`<div class="sn-cardtop"><h2 id="snCardTitle">Berries from Fab’s basket</h2></div>${body}`, true);
  }
  function moveBerries(n){ n = Math.min(n, basket()); if(n <= 0) return 0; bump(SPENDK, n); S.box += n; S.moved += n; save(); paintMoney(); return n; }

  /* ---------- one place for every button ---------- */
  function wire(el){
    el.querySelectorAll('[data-lv]').forEach(b => b.onclick = () => { S.level = +b.dataset.lv; save(); SFX.pop(); side('home', `Number work is set to <b>${LEVELWORD[S.level]}</b>.`); });
    el.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => { if(b.classList.contains('tried')) return; answer(+b.dataset.pick); });
    el.querySelectorAll('[data-tap]').forEach(b => b.onclick = () => tapBerry(+b.dataset.tap));
    el.querySelectorAll('[data-build]').forEach(b => b.onclick = () => build(b.dataset.build, b.dataset.plot || null, b.dataset.from === 'jar'));
    el.querySelectorAll('[data-goal]').forEach(b => b.onclick = () => { S.goal = b.dataset.goal; save(); SFX.pop(); const it = thing(S.goal); closeSheet(); paintMoney();
      if(DAY && DAY.step === 'jars') side(); else side('home', `Your savings goal is the <b>${esc(it.n.toLowerCase())}</b>: ${bry(it.cost)}. Put a little in the savings jar at the end of each day.`); });
    el.querySelectorAll('[data-name]').forEach(b => b.onclick = () => setName(b.dataset.name));
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if(!b || !root.contains(b)) return; const a = b.dataset.a, D = DAY;
    if(a === 'sound'){ try{ localStorage.setItem(SNDKEY, soundOn() ? 'off' : 'on'); }catch(_){} paintSound(); try{ window.parent.fabSoundSync && window.parent.fabSoundSync(); }catch(_){} if(soundOn()) SFX.coin(); }
    else if(a === 'theme'){ try{ localStorage.setItem(THEMEKEY, themeNow() === 'dark' ? 'light' : 'dark'); }catch(_){} paintTheme(); }
    else if(a === 'leave') leave();
    else if(a === 'build') buildSheet('all');
    else if(a === 'buildall') buildSheet('make');
    else if(a === 'buildhomes') buildSheet('homes');
    else if(a === 'pickgoal') buildSheet('goal');
    else if(a === 'close') closeSheet();
    else if(a === 'look'){ S.started = true; save(); side('home', 'Have a look around: tap a sign to build a home, or tap the gate to open for the day.'); }
    else if(a === 'basket') basketSheet();
    else if(a === 'moveless' || a === 'movemore'){ MOVE = clamp(1, MOVE + (a === 'movemore' ? 1 : -1), Math.max(1, basket())); const n = $('snMoveN'); if(n) n.textContent = MOVE; SFX.pop(); }
    else if(a === 'moveok'){ const n = moveBerries(MOVE); closeSheet(); SFX.coin(); side('home', n ? `${bry(n)} moved into the money box. Thank you, Fab!` : 'Fab’s basket is empty just now.'); }
    else if(a === 'day') startDay();
    else if(a === 'rounds') doRounds();
    else if(a === 'again'){ endDay(); startDay(); }
    else if(a === 'home') endDay();
    else if(!D) return;
    else if(a === 'workout'){ if(!D.q) return; if(D.q.kind === 'tap') D.q.tapped = D.q.n; finishQ(D.q.show, false); }
    else if(a === 'togate'){ D.step = 'gate'; SFX.pop(); side(); }
    else if(a === 'pricedown' || a === 'priceup'){ D.price = clamp(1, D.price + (a === 'priceup' ? 1 : -1), 5); SFX.pop(); side(); }
    else if(a === 'open') openGate();
    else if(a === 'skip') toMoney();
    else if(a === 'tojars'){ D.step = 'jars'; SFX.pop(); side(); }
    else if(a === 'savemore' || a === 'saveless' || a === 'sharemore' || a === 'shareless'){ const k = a.startsWith('save') ? 'save' : 'share', up = a.endsWith('more');
      if(up && D.total - D.save - D.share <= 0) return; if(!up && D[k] <= 0) return; D[k] += up ? 1 : -1; SFX.pop(); side(); const f = $('snSide').querySelector(`[data-a="${a}"]`); f && f.focus(); }
    else if(a === 'putaway') putAway();
  });
  $('snSheet').addEventListener('click', e => { if(e.target === $('snSheet') && !(SHEET && SHEET.name)) closeSheet(); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && !$('snSheet').hidden && !(SHEET && SHEET.name)) closeSheet(); });
  function leave(){ save(); stopWalk(); try{ if(window.parent && window.parent !== window && window.parent.fabSanctBack){ window.parent.fabSanctBack(); return; } }catch(e){} location.href = 'index.html'; }

  /* ---------- every size follows the window ---------- */
  function lay(){
    const w = window.innerWidth, h = window.innerHeight, tall = w / h < 1.15;
    root.classList.toggle('tall', tall); root.classList.toggle('small', w < 620);
    const fs = tall ? clamp(12, Math.min(w * .024, h * .0175), 34) : clamp(12, Math.min(w * .0112, h * .0215), 40);
    root.style.fontSize = fs.toFixed(2) + 'px';
    const park = $('snPark'), sc = $('snScene');
    if(tall){ sc.style.width = '100%'; sc.style.height = ''; park.style.height = ''; const ph = Math.min(park.clientWidth * 820 / 1200, h * .46); sc.style.width = (ph * 1200 / 820) + 'px'; }
    else { const pw = park.clientWidth, ph = park.clientHeight, k = Math.min(pw / 1200, ph / 820); sc.style.width = (1200 * k) + 'px'; }
  }
  let layT = 0; window.addEventListener('resize', () => { lay(); clearTimeout(layT); layT = setTimeout(lay, 120); });

  /* ---------- start ---------- */
  const back = $('snBack'); back.hidden = !EMBED; back.dataset.a = 'leave'; back.innerHTML = svg('back') + '<span>' + esc(BACKLABEL) + '</span>';
  paintTheme(); paintSound(); paintScene(); side('home'); lay(); requestAnimationFrame(lay);

  /* for the tests */
  window.FabSanct = {
    state:() => JSON.parse(JSON.stringify(S)), day:() => DAY && JSON.parse(JSON.stringify(Object.assign({}, DAY))), view:() => VIEW,
    open:startDay, rounds:doRounds, answer, right:() => DAY && DAY.q ? DAY.q.right : null, q:() => DAY && DAY.q ? JSON.parse(JSON.stringify(DAY.q)) : null,
    workout:() => { const D = DAY; if(D && D.q){ if(D.q.kind === 'tap') D.q.tapped = D.q.n; finishQ(D.q.show, false); } }, tap:tapBerry,
    toGate:() => { if(DAY){ DAY.step = 'gate'; side(); } }, price:p => { if(DAY){ DAY.price = clamp(1, p, 5); side(); } }, gate:openGate, skip:() => { if(DAY && DAY.step === 'walk') toMoney(); },
    toJars:() => { if(DAY){ DAY.step = 'jars'; side(); } }, jars:(sv, sh) => { if(DAY){ DAY.save = sv; DAY.share = sh; side(); } }, putAway, end:endDay,
    build, goal:k => { S.goal = k; save(); paintMoney(); }, name:setName, level:l => { S.level = l; save(); side('home'); }, basket, move:moveBerries,
    visitorsFor, sounds:() => SND.n, sheet:() => !$('snSheet').hidden, reset:() => { S = fresh(); save(); DAY = null; closeSheet(); paintScene(); side('home'); },
  };
})();
