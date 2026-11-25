/* timemachine.js — Explorer Worlds. (It began as the Time Machine, and the file keeps that name.)
   Three ways to travel: the Time Machine (long ago), the Rocket (out in space) and the Submarine (under the sea, later).
   Every world has the same four layers:
   (1) a scene drawn in the app, with tap-to-explore spots (Miss Bell explains: I do). A spot can have a sound made
       by the app and a real photograph that is free to reuse (the credit is under the photo);
   (2) three missions (Fab: You do) that earn stars, a gem and a passport stamp;
   (3) Meet someone: a made-up person who answers the questions a child taps. Fixed scripts: no typing, no AI chat;
   (4) See it for real: Google Street View at viewpoints we have checked. Nothing loads from Google until a place is
       tapped, and staff can switch this layer off on a device.
   Every fact is a draft for a teacher to check before children use it. Each world's "For teachers" notes say what
   was left out on purpose. This file holds the engine and Ancient Rome; explorer-worlds.js adds the other worlds.
   Opens from the Learning Hub and from the Explorer Station in Fab Fox World. Loaded after me.js. */
(function(){
  'use strict';
  const h = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const snd = k => { try{ Sound[k](); }catch(e){} };
  const q1 = s => document.querySelector(s);
  const code = () => { try{ return fabLearnerCode() || 'local'; }catch(e){ return 'local'; } };
  const shuffle = a => { const b = a.slice(); for(let i = b.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const INK = '#2B1A12';
  const NAME = 'Explorer Worlds';

  /* ---------- three ways to travel, and the worlds ---------- */
  const DOORS = [
    { id:'past', e:'🕰️', n:'The Time Machine', sub:'travel to long ago' },
    { id:'space', e:'🚀', n:'The Rocket', sub:'travel out into space' },
    { id:'sea', e:'🤿', n:'The Submarine', sub:'travel under the sea' }
  ];
  const SOON = [
    { door:'past', e:'🌽', n:'The Maya', when:'About 1,200 years ago' },
    { door:'sea', e:'🐠', n:'Ocean Explorers', when:'Right now, under the sea' }
  ];
  const WORLDS = {}, ORDER = [];
  const V = { era:null, tab:'explore', hot:null, back:'screen-learn', act:null, sort:null, match:null, ask:null, note:null, stop:false, flash:'', photo:false, real:null, turn:0, own:false, ownq:'', miss:'' };
  const W = () => WORLDS[V.era] || null;
  function add(w){ WORLDS[w.id] = w; if(!ORDER.includes(w.id)) ORDER.push(w.id); try{ if(!V.era && q1('#screen-time') && q1('#screen-time').classList.contains('active')) render(); }catch(e){} }

  const SPOTS = [
    { id:'temple', snd:'lyre', x:280, y:445, e:'🏛️', n:'The temple', t:'This is a temple. Romans believed in many gods and goddesses. Jupiter was the king of the gods.', k:'Temples had tall stone columns at the front, like these.' },
    { id:'cart', snd:'cart', x:555, y:655, e:'🏺', n:'The cart of jars', t:'These tall jars are called amphorae. They carried olive oil and wine on carts and ships.', k:'One jar is an amphora. Two or more are amphorae.' },
    { id:'aqueduct', snd:'stream', x:700, y:300, e:'💧', n:'The aqueduct', t:'An aqueduct is like a bridge for water. It carried clean water from the hills into the town.', k:'Some aqueducts were many miles long.' },
    { id:'fountain', snd:'water', x:790, y:548, e:'⛲', n:'The fountain', t:'Most homes had no taps. People filled their jugs at fountains like this one in the street.', k:'The water came from the aqueduct.' },
    { id:'bakery', snd:'fire', x:1225, y:525, e:'🍞', n:'The bakery', t:'Roman bakers ground wheat into flour with heavy stone mills. Then they baked round loaves in a brick oven.', k:'A loaf was marked into eight pieces, so it was easy to share.' },
    { id:'stones', snd:'steps', x:1445, y:712, e:'🪨', n:'The stepping stones', t:'The road could be wet and mucky. Big stepping stones let people cross with clean feet.', k:'Cart wheels fitted through the gaps between the stones.' },
    { id:'thermo', snd:'bubble', x:1730, y:468, e:'🍲', n:'The hot-food shop', t:'This is a hot-food shop. Many people in Roman towns had no kitchen at home, so they bought hot food here.', k:'Food and drink were kept in big jars set into the counter.' },
    { id:'mosaic', snd:'tink', x:2095, y:628, e:'🐕', n:'The mosaic', t:'This picture on the floor is a mosaic. It is made from hundreds of tiny cubes of coloured stone.', k:'The words CAVE CANEM mean “beware of the dog”!' },
    { id:'milestone', snd:'hooves', x:2292, y:598, e:'🪧', n:'The milestone', t:'Milestones stood beside Roman roads to tell travellers how far they had come.', k:'Romans wrote numbers with letters. I is 1, V is 5 and X is 10. This stone says IX. That is 9.' }
  ];
  const FIND = ['stones', 'mosaic', 'fountain'];
  const SORT = [
    { id:'sandals', e:'👡', n:'sandals', a:true, tip:'Romans wore leather sandals.' },
    { id:'bike', e:'🚲', n:'a bicycle', a:false, tip:'Bicycles were invented about 200 years ago, long after the Romans.' },
    { id:'coins', e:'🪙', n:'coins', a:true, tip:'Romans paid with coins made of bronze, silver and gold.' },
    { id:'phone', e:'📱', n:'a mobile phone', a:false, tip:'Phones need electricity. Romans sent messages by letter.' },
    { id:'bread', e:'🍞', n:'bread', a:true, tip:'Romans ate bread every day.' },
    { id:'bulb', e:'💡', n:'a light bulb', a:false, tip:'Light bulbs came much later. Romans used oil lamps.' },
    { id:'lamp', e:'🪔', n:'an oil lamp', a:true, tip:'Romans lit their homes with little lamps that burned olive oil.' },
    { id:'car', e:'🚗', n:'a car', a:false, tip:'No cars yet! Romans walked, rode horses or used carts.' }
  ];
  const MATCH = [
    { id:'amphora', e:'🏺', n:'an amphora', use:'carrying olive oil and wine' },
    { id:'stylus', e:'✍️', n:'a stylus and wax tablet', use:'writing' },
    { id:'tesserae', e:'🟫', n:'tiny stone cubes', use:'making a mosaic' },
    { id:'aqueduct', e:'💧', n:'an aqueduct', use:'bringing water to the town' }
  ];
  const MARCUS = [
    { id:'job', q:'What is your job?', a:'I am a baker. I get up before the sun to light the oven. By morning the whole street smells of fresh bread.' },
    { id:'eat', q:'What do you eat?', a:'Bread, of course! With olives, cheese, figs and beans. On special days we might have fish.' },
    { id:'home', q:'Where do you live?', a:'My family lives in the rooms above the bakery. It is lovely and warm in winter, because the oven is just below us.' },
    { id:'school', q:'Do children go to school?', a:'Some do. They write on wax tablets with a pointed stick called a stylus. If they make a mistake, they smooth the wax and try again.' },
    { id:'fun', q:'What do you do for fun?', a:'We play board games and games with dice. And we love going to the public baths to wash, chat and relax.' },
    { id:'count', q:'How do you count your loaves?', a:'With Roman numerals. I is one, V is five and X is ten. Today I baked eight loaves, so I write VIII.' },
    { id:'money', q:'What is your money like?', a:'We use coins. A small bronze coin is called an as, and a silver coin is called a denarius.' }
  ];

  /* ---------- passport (kept on this device, by Fab code) ---------- */
  const PKEY = () => 'fab-passport-' + code();
  function pass(){ let p = null; try{ p = JSON.parse(localStorage.getItem(PKEY())); }catch(e){} p = p && typeof p === 'object' ? p : {}; ORDER.forEach(id => { p[id] = Object.assign({ seen:[], m:[], asked:[], stamp:0, chat:0 }, p[id] || {}); }); return p; }
  function savePass(p){ try{ localStorage.setItem(PKEY(), JSON.stringify(p)); }catch(e){} }
  function award(n){ try{ fabWorldAward(n); }catch(e){} }
  const realOn = () => { try{ return localStorage.getItem('fab-explore-real') !== 'off'; }catch(e){ return true; } };
  const roamOn = () => { try{ return localStorage.getItem('fab-explore-roam') === 'on'; }catch(e){ return false; } };

  /* ---------- sounds made by the app (no recordings) ---------- */
  const Snd = (function(){
    let nb = null, live = [];
    const ctx = () => { try{ if(typeof Sound === 'undefined' || !Sound.enabled) return null; const c = Sound.ensure(); if(c && c.state === 'suspended') c.resume(); return c; }catch(e){ return null; } };
    const buf = c => { if(nb && nb.sampleRate === c.sampleRate) return nb; nb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate); const d = nb.getChannelData(0); for(let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return nb; };
    /* n: a stretch of filtered noise · hit: a short burst · tn: a note that dies away · st: a held note */
    function n(c, d, t, dur, type, f, q, vol, f2){ const s = c.createBufferSource(); s.buffer = buf(c); s.loop = true; const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t); if(f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur); fl.Q.value = q || 1; const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(.08, dur * .3)); g.gain.setValueAtTime(vol, t + dur * .7); g.gain.linearRampToValueAtTime(0.0001, t + dur); s.connect(fl); fl.connect(g); g.connect(d); s.start(t, Math.random()); s.stop(t + dur + .05); }
    function hit(c, d, t, type, f, q, vol, dec){ const s = c.createBufferSource(); s.buffer = buf(c); const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q || 1; const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dec); s.connect(fl); fl.connect(g); g.connect(d); s.start(t, Math.random()); s.stop(t + dec + .05); }
    function tn(c, d, t, f, type, vol, dec, f2){ const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); if(f2) o.frequency.exponentialRampToValueAtTime(f2, t + dec); const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .012); g.gain.exponentialRampToValueAtTime(0.0001, t + dec); o.connect(g); g.connect(d); o.start(t); o.stop(t + dec + .05); }
    function st(c, d, t, dur, f, type, vol, f2){ const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); if(f2) o.frequency.linearRampToValueAtTime(f2, t + dur); const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + .08); g.gain.setValueAtTime(vol, t + dur - .12); g.gain.linearRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(d); o.start(t); o.stop(t + dur + .05); }
    const R = {
      water(c, d, t){ n(c, d, t, 3.6, 'bandpass', 1500, .8, .09); n(c, d, t, 3.6, 'highpass', 4200, .5, .025); for(let i = 0; i < 24; i++){ const f = rnd(500, 1300); tn(c, d, t + rnd(0, 3.4), f, 'sine', .05, .09, f * 2); } },
      stream(c, d, t){ n(c, d, t, 3.8, 'lowpass', 700, .6, .13); n(c, d, t, 3.8, 'bandpass', 2200, .7, .035); for(let i = 0; i < 9; i++){ const f = rnd(400, 900); tn(c, d, t + rnd(0, 3.5), f, 'sine', .04, .1, f * 1.8); } },
      fire(c, d, t){ n(c, d, t, 3.6, 'lowpass', 380, .7, .09); for(let i = 0; i < 44; i++) hit(c, d, t + rnd(0, 3.5), 'highpass', rnd(1800, 5000), 1, rnd(.05, .16), .03); },
      cart(c, d, t){ n(c, d, t, 3.6, 'lowpass', 150, .7, .22); for(let i = 0; i < 14; i++) hit(c, d, t + i * .25 + rnd(0, .05), 'bandpass', rnd(220, 400), 2, .16, .07); },
      hooves(c, d, t){ for(let i = 0; i < 7; i++){ const b = t + i * .5; hit(c, d, b, 'bandpass', 950, 6, .34, .05); hit(c, d, b + .17, 'bandpass', 760, 6, .26, .05); } },
      steps(c, d, t){ for(let i = 0; i < 6; i++){ hit(c, d, t + i * .55, 'lowpass', 300, 1, .4, .09); hit(c, d, t + i * .55 + .02, 'bandpass', 1800, 2, .06, .03); } },
      bubble(c, d, t){ n(c, d, t, 3.6, 'lowpass', 300, .7, .05); for(let i = 0; i < 28; i++){ const f = rnd(180, 420); tn(c, d, t + rnd(0, 3.4), f, 'sine', .12, .12, f * 1.8); } },
      tink(c, d, t){ for(let i = 0; i < 12; i++){ const b = t + i * .28 + rnd(0, .06); tn(c, d, b, rnd(1800, 3200), 'triangle', .1, .12); hit(c, d, b, 'highpass', 5000, 1, .04, .02); } },
      lyre(c, d, t){ [392, 523, 440, 587, 659, 523, 784, 659, 523].forEach((f, i) => { tn(c, d, t + i * .38, f, 'triangle', .16, .9); tn(c, d, t + i * .38, f * 2, 'sine', .05, .5); }); },
      harp(c, d, t){ [294, 349, 440, 392, 523, 440, 587, 523, 440].forEach((f, i) => { tn(c, d, t + i * .4, f, 'triangle', .16, 1.1); tn(c, d, t + i * .4 + .01, f * 3, 'sine', .03, .4); }); },
      chisel(c, d, t){ for(let i = 0; i < 8; i++){ hit(c, d, t + i * .42, 'bandpass', 2400, 8, .3, .04); tn(c, d, t + i * .42, 3100, 'square', .03, .05); } },
      scratch(c, d, t){ for(let i = 0; i < 9; i++) n(c, d, t + i * .38, rnd(.14, .26), 'bandpass', rnd(2500, 4200), 3, .07); },
      wind(c, d, t){ n(c, d, t, 3.8, 'bandpass', 300, .6, .16, 700); n(c, d, t + .6, 3, 'bandpass', 650, .8, .08, 350); },
      splash(c, d, t){ for(let i = 0; i < 4; i++){ n(c, d, t + i * .95, .6, 'bandpass', 900, .7, .16, 400); for(let k = 0; k < 4; k++){ const f = rnd(600, 1200); tn(c, d, t + i * .95 + .35 + rnd(0, .4), f, 'sine', .04, .08, f * 1.9); } } },
      purr(c, d, t){ for(let i = 0; i < 78; i++) hit(c, d, t + i * .045, 'lowpass', 190, 1, .16 + .1 * Math.sin(i / 6), .035); },
      bell(c, d, t){ for(let k = 0; k < 5; k++){ const b = t + k * .6; [880, 1333, 2217, 2960].forEach((f, j) => tn(c, d, b, f, 'sine', .13 / (j + 1), .55)); } },
      gas(c, d, t){ hit(c, d, t, 'bandpass', 600, 2, .22, .1); n(c, d, t + .1, 3.4, 'highpass', 6000, .5, .035); },
      train(c, d, t){ let b = t, gap = .44; for(let i = 0; i < 13; i++){ hit(c, d, b, 'lowpass', 900, .8, .45, .12); b += gap; gap = Math.max(.2, gap * .93); } st(c, d, t + 2.5, 1.1, 740, 'square', .04); st(c, d, t + 2.5, 1.1, 932, 'square', .03); },
      post(c, d, t){ n(c, d, t, .28, 'bandpass', 3000, 2, .06); hit(c, d, t + .38, 'lowpass', 260, 1, .45, .14); tn(c, d, t + .39, 170, 'sine', .1, .22); },
      bike(c, d, t){ [0, .32].forEach(o => { tn(c, d, t + o, 2100, 'sine', .15, .6); tn(c, d, t + o + .01, 3150, 'sine', .06, .4); }); for(let i = 0; i < 16; i++) hit(c, d, t + .95 + i * .16, 'highpass', 3500, 2, .08, .015); },
      shop(c, d, t){ tn(c, d, t, 1568, 'sine', .16, 1); tn(c, d, t + .02, 2349, 'sine', .08, .8); tn(c, d, t + .3, 1318, 'sine', .14, 1); for(let i = 0; i < 6; i++) tn(c, d, t + 1.4 + i * .14 + rnd(0, .05), rnd(3200, 4800), 'triangle', .07, .08); },
      hoop(c, d, t){ n(c, d, t, 3.2, 'bandpass', 1200, 5, .03); for(let i = 0; i < 10; i++) tn(c, d, t + i * .31, rnd(900, 1100), 'triangle', .08, .05); },
      pump(c, d, t){ for(let i = 0; i < 3; i++){ const b = t + i * 1.2; st(c, d, b, .32, 300, 'sawtooth', .035, 430); st(c, d, b + .36, .3, 430, 'sawtooth', .035, 300); n(c, d, b + .5, .6, 'bandpass', 1300, .8, .14); } },
      hum(c, d, t){ n(c, d, t, 3.8, 'lowpass', 240, .5, .1); n(c, d, t, 3.8, 'bandpass', 120, 9, .16); n(c, d, t, 3.8, 'bandpass', 2000, .5, .012); },
      beep(c, d, t){ n(c, d, t, 3, 'lowpass', 240, .5, .06); [880, 880, 1175, 880, 1319].forEach((f, i) => tn(c, d, t + .2 + i * .5, f, 'square', .045, .12)); },
      radio(c, d, t){ tn(c, d, t, 2525, 'sine', .07, .28); n(c, d, t + .3, 1.7, 'bandpass', 1800, 1, .03); tn(c, d, t + 2.1, 2475, 'sine', .07, .28); },
      whoosh(c, d, t){ n(c, d, t, 2.2, 'bandpass', 300, 1.2, .16, 2400); n(c, d, t + 2.1, 1.1, 'bandpass', 2400, 1.2, .1, 400); },
      treadmill(c, d, t){ n(c, d, t, 3.7, 'lowpass', 500, .7, .05); for(let i = 0; i < 10; i++) hit(c, d, t + i * .36, 'lowpass', 220, 1, .42, .08); },
      servo(c, d, t){ st(c, d, t, 1.4, 90, 'sawtooth', .05, 180); st(c, d, t + 1.6, 1.2, 180, 'sawtooth', .05, 110); hit(c, d, t + 2.9, 'bandpass', 1400, 4, .2, .05); },
      zip(c, d, t){ n(c, d, t, .7, 'bandpass', 1500, 3, .09, 4500); n(c, d, t + 1, 2.6, 'lowpass', 240, .5, .07); },
      dock(c, d, t){ hit(c, d, t, 'lowpass', 180, 1, .6, .3); tn(c, d, t, 70, 'sine', .2, .4); for(let i = 0; i < 6; i++) hit(c, d, t + .7 + i * .2, 'bandpass', 1500, 5, .16, .03); },
      shutter(c, d, t){ n(c, d, t, 3, 'lowpass', 240, .5, .05); for(let i = 0; i < 3; i++){ const b = t + .3 + i * .9; hit(c, d, b, 'highpass', 4000, 1, .22, .02); hit(c, d, b + .08, 'bandpass', 2500, 2, .2, .04); } },
      solar(c, d, t){ [523, 659, 784, 1047, 1319].forEach((f, i) => { tn(c, d, t + i * .3, f, 'sine', .1, 1.4); tn(c, d, t + i * .3, f * 2.01, 'sine', .03, .9); }); }
    };
    function stop(){ live.forEach(g => { try{ g.gain.setTargetAtTime(0, g.context.currentTime, .04); setTimeout(() => { try{ g.disconnect(); }catch(e){} }, 400); }catch(e){} }); live = []; }
    function play(name){ stop(); const c = ctx(); if(!c || !R[name]) return false; const g = c.createGain(); g.gain.value = 1; g.connect(c.destination); live.push(g); try{ R[name](c, g, c.currentTime + .04); }catch(e){ return false; } return true; }
    return { play, stop, has:k => !!R[k], names:() => Object.keys(R) };
  })();

  /* ---------- drawing kit, and the Roman street ---------- */
  const wrap = (aria, inner) => `<svg class="tm-svg" viewBox="0 0 2400 800" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${h(aria)}">${inner}</svg>`;
  function face(o){ return `<svg class="tm-face" viewBox="0 0 120 130" role="img" aria-label="${h(o.alt)}"><path d="M22 130 v-34 q38 -30 76 0 v34 Z" fill="${o.top}" stroke="${INK}" stroke-width="4"/><circle cx="60" cy="56" r="34" fill="${o.skin}" stroke="${INK}" stroke-width="4"/>${o.hair || ''}<circle cx="48" cy="58" r="4" fill="${INK}"/><circle cx="72" cy="58" r="4" fill="${INK}"/><path d="M46 72 q14 12 28 0" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>${o.extra || ''}</svg>`; }
  function loaf(x, y, r){ let s = `<circle cx="${x}" cy="${y}" r="${r}" fill="#e0a758" stroke="${INK}" stroke-width="2.5"/>`; for(let i = 0; i < 4; i++){ const a = i * Math.PI / 4, dx = Math.cos(a) * r * .8, dy = Math.sin(a) * r * .8; s += `<line x1="${(x - dx).toFixed(1)}" y1="${(y - dy).toFixed(1)}" x2="${(x + dx).toFixed(1)}" y2="${(y + dy).toFixed(1)}" stroke="#a8743a" stroke-width="2"/>`; } return s; }
  function column(x, y0, y1, w){ return `<rect x="${x - w / 2 - 6}" y="${y0}" width="${w + 12}" height="12" rx="3" fill="#f3e6c9" stroke="${INK}" stroke-width="3"/><rect x="${x - w / 2}" y="${y0 + 12}" width="${w}" height="${y1 - y0 - 24}" fill="#f7ecd4" stroke="${INK}" stroke-width="3"/><line x1="${x - 5}" y1="${y0 + 18}" x2="${x - 5}" y2="${y1 - 16}" stroke="#d9c9a3" stroke-width="3"/><line x1="${x + 5}" y1="${y0 + 18}" x2="${x + 5}" y2="${y1 - 16}" stroke="#d9c9a3" stroke-width="3"/><rect x="${x - w / 2 - 6}" y="${y1 - 12}" width="${w + 12}" height="12" rx="3" fill="#f3e6c9" stroke="${INK}" stroke-width="3"/>`; }
  function amphora(x, y, s){ return `<g transform="translate(${x},${y}) scale(${s})"><path d="M-9 0 h18 v10 c16 10 16 44 0 70 l-9 14 l-9 -14 c-16 -26 -16 -60 0 -70 Z" fill="#cf7a45" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M-9 6 c-14 0 -14 22 -6 24 M9 6 c14 0 14 22 6 24" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/></g>`; }
  function person(x, y, s, tunic, skin, hair, extra){ return `<g transform="translate(${x},${y}) scale(${s})"><line x1="-8" y1="-8" x2="-8" y2="0" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><line x1="8" y1="-8" x2="8" y2="0" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M-17 -72 q17 -14 34 0 l7 64 h-48 Z" fill="${tunic}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><circle cx="0" cy="-93" r="16" fill="${skin}" stroke="${INK}" stroke-width="3"/><path d="M-16 -96 q16 -22 32 0 q-16 -10 -32 0 Z" fill="${hair}" stroke="${INK}" stroke-width="2"/>${extra || ''}</g>`; }
  function roof(x0, x1, y, c){ let s = `<polygon points="${x0 - 16},${y + 48} ${x1 + 16},${y + 48} ${x1 - 8},${y} ${x0 + 8},${y}" fill="${c}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`; for(let x = x0 + 14; x < x1; x += 26) s += `<line x1="${x}" y1="${y + 6}" x2="${x - 4}" y2="${y + 44}" stroke="#a8482a" stroke-width="2.5" opacity=".7"/>`; return s; }
  function cypress(x, hgt){ return `<ellipse cx="${x}" cy="${600 - hgt / 2}" rx="${hgt * .16}" ry="${hgt / 2}" fill="#4d7a39" stroke="#35592a" stroke-width="2.5"/>`; }
  function street(){
    let aq = '<g opacity=".92"><rect x="520" y="252" width="1060" height="30" fill="#eadfc4" stroke="#b9a781" stroke-width="2.5"/>';
    for(let x = 520; x < 1580; x += 106){ aq += `<rect x="${x}" y="282" width="28" height="320" fill="#e2d5b5" stroke="#b9a781" stroke-width="2.5"/>`; if(x + 106 < 1580) aq += `<path d="M${x + 28} 282 H${x + 106} V326 A39 39 0 0 0 ${x + 28} 326 Z" fill="#eadfc4" stroke="#b9a781" stroke-width="2.5"/>`; }
    aq += '</g>';
    let awn = ''; for(let i = 0; i < 10; i++) awn += `<path d="M${1575 + i * 31} 372 h31 v34 a15.5 12 0 0 1 -31 0 Z" fill="${i % 2 ? '#fff3dc' : '#ef8a3c'}" stroke="${INK}" stroke-width="2.5"/>`;
    let marble = ''; [[1612, 548, '#c98a6b'], [1668, 566, '#8fb0a0'], [1712, 540, '#e7c36a'], [1770, 572, '#a9a9c9'], [1822, 546, '#c98a6b'], [1640, 584, '#e7c36a'], [1800, 588, '#8fb0a0'], [1736, 584, '#c98a6b']].forEach(([x, y, c]) => { marble += `<polygon points="${x},${y} ${x + 22},${y - 8} ${x + 34},${y + 6} ${x + 14},${y + 14}" fill="${c}" stroke="#8d7c5f" stroke-width="1.5"/>`; });
    let tess = ''; const dog = ['..##....', '.####..#', '.#######', '..#####.', '..#..#..']; dog.forEach((row, r) => [...row].forEach((ch, c) => { if(ch === '#') tess += `<rect x="${2052 + c * 9 + r * 1.2}" y="${609 + r * 5.2}" width="8" height="4.6" fill="#3a2a20"/>`; }));
    return `<svg class="tm-svg" viewBox="0 0 2400 800" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A street in a Roman town: a temple, an aqueduct, a fountain, a bakery, a hot-food shop and a house with a mosaic">
  <defs><linearGradient id="tmSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9daf0"/><stop offset="1" stop-color="#fdf3dc"/></linearGradient>
  <pattern id="tmPave" width="150" height="100" patternUnits="userSpaceOnUse"><rect width="150" height="100" fill="#b9af9d"/><path d="M0 30 L40 14 L92 28 L150 30 M0 78 L50 70 L104 80 L150 78 M40 14 L50 70 M92 28 L104 80 M50 70 L44 100 M44 0 L40 14 M104 80 L112 100 M112 0 L92 28" stroke="#8f8676" stroke-width="3" fill="none" stroke-linecap="round"/></pattern></defs>
  <rect width="2400" height="620" fill="url(#tmSky)"/>
  <circle cx="2230" cy="120" r="74" fill="#ffe9a8" opacity=".6"/><circle cx="2230" cy="120" r="46" fill="#ffd66b"/>
  <g class="tm-drift" fill="#fff" opacity=".9"><ellipse cx="420" cy="120" rx="90" ry="26"/><ellipse cx="480" cy="100" rx="60" ry="24"/><ellipse cx="1380" cy="150" rx="100" ry="26"/><ellipse cx="1450" cy="130" rx="60" ry="22"/><ellipse cx="1930" cy="90" rx="70" ry="20"/></g>
  <path d="M0 470 Q300 380 620 450 T1250 430 T1900 450 T2400 420 V620 H0 Z" fill="#d3e5ab"/>
  <path d="M0 530 Q400 470 800 520 T1600 510 T2400 500 V620 H0 Z" fill="#bcd692"/>
  ${aq}
  ${cypress(540, 190)}${cypress(880, 230)}${cypress(1345, 170)}${cypress(1520, 220)}${cypress(1930, 240)}${cypress(2350, 200)}
  <rect x="0" y="600" width="2400" height="52" fill="#dccfb3"/><rect x="0" y="646" width="2400" height="10" fill="#bfb39a"/>
  <rect x="0" y="656" width="2400" height="144" fill="url(#tmPave)"/>
  <path d="M0 702 H2400 M0 752 H2400" stroke="#6f6657" stroke-width="7" opacity=".28"/>

  <g id="tmTemple"><rect x="130" y="340" width="300" height="212" fill="#e6d2a8" stroke="${INK}" stroke-width="3"/><rect x="246" y="410" width="68" height="142" fill="#6b4226" stroke="${INK}" stroke-width="3"/>
    ${column(120, 330, 552, 30)}${column(227, 330, 552, 30)}${column(333, 330, 552, 30)}${column(440, 330, 552, 30)}
    <rect x="92" y="300" width="376" height="32" fill="#f3e6c9" stroke="${INK}" stroke-width="3"/>
    <polygon points="82,300 478,300 280,204" fill="#d9703a" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><polygon points="130,291 430,291 280,222" fill="#f7ecd4" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/><circle cx="280" cy="266" r="12" fill="#f0b913" stroke="${INK}" stroke-width="2.5"/>
    <rect x="84" y="552" width="392" height="24" fill="#efe2c4" stroke="${INK}" stroke-width="3"/><rect x="66" y="576" width="428" height="26" fill="#e9dbb9" stroke="${INK}" stroke-width="3"/></g>

  <g id="tmCart"><rect x="468" y="676" width="176" height="44" rx="6" fill="#a9743f" stroke="${INK}" stroke-width="3"/><line x1="644" y1="700" x2="700" y2="690" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    ${amphora(505, 596, 1)}${amphora(556, 590, 1.06)}${amphora(607, 596, 1)}
    <rect x="462" y="668" width="188" height="14" rx="5" fill="#8a5a2c" stroke="${INK}" stroke-width="3"/>
    ${[506, 606].map(x => `<circle cx="${x}" cy="742" r="34" fill="#c99a5e" stroke="${INK}" stroke-width="4"/><circle cx="${x}" cy="742" r="7" fill="${INK}"/><path d="M${x - 34} 742 H${x + 34} M${x} 708 V776 M${x - 24} 718 L${x + 24} 766 M${x + 24} 718 L${x - 24} 766" stroke="${INK}" stroke-width="2.5"/>`).join('')}</g>

  <g id="tmFountain"><rect x="768" y="500" width="44" height="86" rx="6" fill="#e3d6ba" stroke="${INK}" stroke-width="3"/><circle cx="790" cy="530" r="13" fill="#d2bf96" stroke="${INK}" stroke-width="2.5"/><circle cx="785" cy="527" r="2" fill="${INK}"/><circle cx="795" cy="527" r="2" fill="${INK}"/>
    <path class="tm-flow" d="M790 540 q5 22 0 44" stroke="#7cc7ea" stroke-width="7" fill="none"/>
    <rect x="722" y="582" width="136" height="54" rx="8" fill="#e9dcc0" stroke="${INK}" stroke-width="3"/><ellipse cx="790" cy="589" rx="58" ry="7" fill="#9bd6f2" stroke="#5aa9cf" stroke-width="2"/></g>
  ${person(884, 640, 1, '#8fb7d9', '#c98d5e', '#3a2414', '<ellipse cx="22" cy="-52" rx="11" ry="14" fill="#cf7a45" stroke="#2B1A12" stroke-width="2.5"/>')}

  <g id="tmBakery"><rect x="900" y="312" width="412" height="290" fill="#f3d58c" stroke="${INK}" stroke-width="3"/>${roof(900, 1312, 264, '#d9703a')}
    <rect x="1010" y="328" width="194" height="42" rx="6" fill="#fff6e6" stroke="${INK}" stroke-width="3"/><text x="1107" y="358" text-anchor="middle" font-family="Aleo, Georgia, serif" font-weight="700" font-size="25" fill="${INK}" letter-spacing="2">PISTRINUM</text>
    <rect x="925" y="390" width="216" height="212" fill="#7a5230" stroke="${INK}" stroke-width="3"/><rect x="935" y="432" width="196" height="8" fill="#c79a5b" stroke="${INK}" stroke-width="2"/>${loaf(962, 416, 15)}${loaf(1000, 416, 15)}
    <g id="tmMarcus"><path d="M1056 520 v-34 q30 -22 60 0 v34 Z" fill="#fff3dc" stroke="${INK}" stroke-width="3"/><path d="M1070 520 v-24 h32 v24 Z" fill="#e8c9a0" stroke="${INK}" stroke-width="2"/><circle cx="1086" cy="456" r="22" fill="#d9a06b" stroke="${INK}" stroke-width="3"/><path d="M1064 452 q22 -30 44 0 q-22 -12 -44 0 Z" fill="#3a2414" stroke="${INK}" stroke-width="2"/><circle cx="1078" cy="458" r="2.6" fill="${INK}"/><circle cx="1094" cy="458" r="2.6" fill="${INK}"/><path d="M1078 467 q8 7 16 0" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/></g>
    <rect x="925" y="516" width="216" height="86" fill="#e9dcc0" stroke="${INK}" stroke-width="3"/><rect x="918" y="504" width="230" height="16" rx="4" fill="#f7ecd4" stroke="${INK}" stroke-width="3"/>${loaf(958, 492, 17)}${loaf(1000, 492, 17)}${loaf(979, 474, 15)}
    <path d="M1160 602 V500 A66 66 0 0 1 1292 500 V602 Z" fill="#c9683c" stroke="${INK}" stroke-width="3"/><path d="M1168 520 H1284 M1162 552 H1290 M1162 580 H1290 M1200 500 V520 M1250 500 V520 M1180 520 V552 M1226 520 V552 M1270 520 V552" stroke="#8f3f1f" stroke-width="2" opacity=".7"/>
    <path d="M1194 602 V548 A32 32 0 0 1 1258 548 V602 Z" fill="#3a2414" stroke="${INK}" stroke-width="3"/><path class="tm-flame" d="M1206 600 q6 -26 16 -12 q4 -22 14 -2 q8 -12 10 14 Z" fill="#ff9a3c" stroke="#e25c12" stroke-width="2"/><ellipse cx="1226" cy="598" rx="24" ry="6" fill="#ffd66b" opacity=".8"/>
    <g class="tm-smoke" fill="#fff" opacity=".75"><circle cx="1228" cy="238" r="12"/><circle cx="1246" cy="214" r="15"/><circle cx="1232" cy="186" r="18"/></g></g>
  <g id="tmMill"><rect x="1300" y="548" width="92" height="10" rx="4" fill="#9a6a3a" stroke="${INK}" stroke-width="2.5"/><path d="M1324 602 L1336 560 L1324 520 H1368 L1356 560 L1368 602 Z" fill="#b9b0a0" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/></g>

  <g id="tmStones">${[664, 712, 760].map(y => `<ellipse cx="1447" cy="${y + 22}" rx="44" ry="8" fill="#6f6657" opacity=".35"/><rect x="1405" y="${y - 16}" width="84" height="34" rx="13" fill="#e3d8c0" stroke="${INK}" stroke-width="3"/>`).join('')}</g>

  <g id="tmThermo"><rect x="1560" y="322" width="342" height="280" fill="#f6e7c8" stroke="${INK}" stroke-width="3"/><rect x="1560" y="522" width="342" height="80" fill="#c4472d" stroke="${INK}" stroke-width="3"/>${roof(1560, 1902, 274, '#cf6634')}
    <rect x="1612" y="330" width="238" height="36" rx="6" fill="#fff6e6" stroke="${INK}" stroke-width="3"/><text x="1731" y="356" text-anchor="middle" font-family="Aleo, Georgia, serif" font-weight="700" font-size="22" fill="${INK}" letter-spacing="1.5">THERMOPOLIUM</text>
    <rect x="1590" y="404" width="282" height="198" fill="#7a5230" stroke="${INK}" stroke-width="3"/><rect x="1604" y="456" width="254" height="8" fill="#c79a5b" stroke="${INK}" stroke-width="2"/>
    ${[1630, 1676, 1790, 1836].map(x => `<path d="M${x - 9} 456 v-16 q-6 -10 3 -14 h12 q9 4 3 14 v16 Z" fill="#cf7a45" stroke="${INK}" stroke-width="2.5"/>`).join('')}
    ${awn}
    <rect x="1590" y="512" width="282" height="90" fill="#efe6d2" stroke="${INK}" stroke-width="3"/>${marble}
    <rect x="1582" y="498" width="298" height="18" rx="4" fill="#fbf4e2" stroke="${INK}" stroke-width="3"/>${[1640, 1731, 1822].map(x => `<ellipse cx="${x}" cy="507" rx="25" ry="6" fill="#3a2414"/><path d="M${x - 8} 494 q-8 -12 0 -24 M${x + 8} 494 q8 -12 0 -24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".75"/>`).join('')}</g>
  ${person(1936, 642, .78, '#f0b913', '#8a5a3c', '#2b1a12')}

  <g id="tmHouse"><rect x="1966" y="332" width="268" height="270" fill="#f6e7c8" stroke="${INK}" stroke-width="3"/><rect x="1966" y="500" width="268" height="102" fill="#b8432b" stroke="${INK}" stroke-width="3"/>${roof(1966, 2234, 284, '#d9703a')}
    <rect x="2180" y="380" width="30" height="34" fill="#7a5230" stroke="${INK}" stroke-width="3"/>
    <rect x="2040" y="404" width="112" height="198" fill="#f3e6c9" stroke="${INK}" stroke-width="3"/><rect x="2052" y="416" width="88" height="186" fill="#5a3a22" stroke="${INK}" stroke-width="3"/><rect x="2052" y="416" width="40" height="186" fill="#8a5a2c" stroke="${INK}" stroke-width="3"/><circle cx="2084" cy="512" r="4" fill="#f0b913"/>
    <polygon points="2026,604 2170,604 2186,646 2010,646" fill="#f7ecd4" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><polygon points="2034,608 2163,608 2175,642 2021,642" fill="none" stroke="#c4472d" stroke-width="2.5" stroke-dasharray="5 4"/>
    ${tess}<text x="2098" y="640" text-anchor="middle" font-family="Aleo, Georgia, serif" font-weight="700" font-size="9.5" fill="#3a2a20" letter-spacing="1">CAVE CANEM</text></g>

  <g id="tmMile"><path d="M2266 650 V574 a26 26 0 0 1 52 0 V650 Z" fill="#d8ccb4" stroke="${INK}" stroke-width="3"/><text x="2292" y="608" text-anchor="middle" font-family="Aleo, Georgia, serif" font-weight="700" font-size="26" fill="${INK}">IX</text></g>
</svg>`;
  }

  add({ id:'rome', door:'past', e:'🏛️', n:'Ancient Rome', when:'About 2,000 years ago', stamp:'ROMA', where:'the street', next:'Next along the street ➡️',
    aria:'A street in a Roman town: a temple, an aqueduct, a fountain, a bakery, a hot-food shop and a house with a mosaic',
    hello:{ h:'Welcome to a Roman street!', t:'This is a town about 2,000 years ago. Tap a glowing circle to look closer. Use the arrows to walk along the street.' },
    scene:street, spots:SPOTS, find:FIND,
    sort:{ h:'Then or not yet?', ask:'Which things did the Romans have?', a:['🏛️ The Romans had it', 'about 2,000 years ago'], b:['⏳ Not invented yet', 'it came much later'], items:SORT },
    match:{ h:'What is it for?', ask:'Match each Roman thing to its job.', pick:'Tap a Roman thing, then tap its job.', items:MATCH },
    who:{ n:'Marcus', voice:'m', role:'a Roman baker', at:[1132, 418], spot:'bakery', hello:{ h:'Salve! That means hello.', t:'I am Marcus, the baker on this street. Tap a question and I will tell you about my life.' }, qs:MARCUS,
      note:'Marcus is a made-up baker. His answers come from what we know about Roman towns.',
      face:face({ alt:'Marcus, a Roman baker', top:'#fff3dc', skin:'#d9a06b', hair:`<path d="M26 50 q34 -46 68 0 q-34 -18 -68 0 Z" fill="#3a2414" stroke="${INK}" stroke-width="3"/>` }) },
    teach:[
      '<b>Curriculum.</b> Supports KS2 history: the Roman Empire and its impact on Britain. Check the wording against the National Curriculum programme of study.',
      '<b>Kept gentle.</b> This street leaves out gladiators, slavery and the eruption of Vesuvius. Plan those as teacher-led topics, with a gentler path for any child who needs one. The photos and real views show Pompeii and the Colosseum, and their captions leave those things out too.',
      '<b>More to explore (teacher-led).</b> Open these yourself first, then share your screen: <a href="https://artsandculture.google.com/story/0QWRsKx1-N2-tA" target="_blank" rel="noopener">Google Arts &amp; Culture: views of Ancient Pompeii</a> · <a href="https://artsandculture.google.com/story/9QUhljZkpHwbJw" target="_blank" rel="noopener">Ancient Roman sites</a>. Pompeii’s story includes the eruption, so decide what to show.'
    ],
    packs:[{ id:'history-flightpath-y34', step:3, label:'History flightpath: The Romans arrive in Britain' }, { id:'maths-flightpath-measurement', step:15, label:'Maths flightpath: Roman numerals' }],
    real:[]
  });

  /* ---------- screens ---------- */
  const HTML = `<section id="screen-time" class="screen" aria-label="${NAME}">
  <div class="screen-top"><button type="button" class="btn-back" id="tmBack">← Back</button><h1 class="screen-title" id="tmTitle">🧭 ${NAME}</h1></div>
  <div id="tmBody"></div></section>`;

  function stampHTML(w, p, big){ const got = !!p[w.id].stamp; return `<span class="tm-stamp ${got ? 'got' : ''} ${big ? 'big' : ''}" role="img" aria-label="${got ? 'Passport stamp earned: ' + h(w.n) : 'Passport stamp for ' + h(w.n) + ', not earned yet'}"><b>${h(w.stamp)}</b><i>${got ? '★ explorer ★' : 'not yet'}</i></span>`; }

  function homeHTML(){
    const p = pass(), got = ORDER.filter(id => p[id].stamp).length;
    const card = w => `<button type="button" class="tm-era" data-tm="era" data-id="${w.id}"><span class="tm-era-e" aria-hidden="true">${w.e}</span><b>${h(w.n)}</b><small>${h(w.when)}</small><span class="tm-go">${p[w.id].stamp ? '★ Stamp earned ➡️' : p[w.id].seen.length ? 'Carry on ➡️' : 'Step in ➡️'}</span></button>`;
    const soon = s => `<button type="button" class="tm-era soon" disabled><span class="tm-era-e" aria-hidden="true">${s.e}</span><b>${h(s.n)}</b><small>${h(s.when)}</small><span class="tm-soon">Coming soon</span></button>`;
    const door = d => { const ws = ORDER.map(id => WORLDS[id]).filter(w => w.door === d.id), so = SOON.filter(s => s.door === d.id); if(!ws.length && !so.length) return '';
      return `<section class="tm-door" aria-label="${h(d.n)}"><h2><span aria-hidden="true">${d.e}</span> ${h(d.n)} <small>${h(d.sub)}</small></h2><div class="tm-eras">${ws.map(card).join('')}${so.map(soon).join('')}</div></section>`; };
    return `<div class="me-card tm-home"><div class="fab-say"><span class="fab-char bell" role="img" aria-label="Miss Bell"></span><div class="bubble"><b>Where shall we explore?</b>Choose a way to travel, then a place. You’ll look around, meet someone who lives there, and collect a stamp for your passport.</div></div>
      ${DOORS.map(door).join('')}
      <div class="tm-passport"><b>🛂 My passport</b><span class="tm-stamps">${ORDER.map(id => stampHTML(WORLDS[id], p)).join('')}</span><span>${got ? `You have ${got} of ${ORDER.length} stamps.` : 'Finish the three missions in a world to earn its stamp.'}</span></div></div>`;
  }

  function tabsHTML(w, p){
    const tab = (k, label) => `<button type="button" class="pill-choice ${V.tab === k ? 'selected' : ''}" data-tm="tab" data-id="${k}" aria-pressed="${V.tab === k}">${label}</button>`;
    return `<div class="tm-tabs">${tab('explore', '🔎 Explore')}${tab('missions', `🎯 Missions <small>${p[w.id].m.length}/3</small>`)}${tab('who', '🗣️ Meet ' + h(w.who.n))}${(w.real || []).length && realOn() ? tab('real', '🌍 See it for real') : ''}${w.make && window.FabMake ? tab('make', '🎨 Make and do') : ''}<span class="tm-found" role="status">Found ${p[w.id].seen.length} of ${w.spots.length}</span><button type="button" class="pill-choice tm-stopbtn" data-tm="stop">🌙 Stop here</button></div>`;
  }
  function exploreHTML(w){
    const s = w.spots.find(x => x.id === V.hot);
    if(!s) return `<div class="fab-say"><span class="fab-char bell" role="img" aria-label="Miss Bell"></span><div class="bubble"><b>${h(w.hello.h)}</b>${h(w.hello.t)}</div></div>`;
    const ph = s.photo && V.photo ? `<figure class="tm-photo"><img src="${h(s.photo.src)}" alt="${h(s.photo.alt)}" loading="lazy" decoding="async"><figcaption>${h(s.photo.cap)} <small>Photo: ${h(s.photo.by)}</small></figcaption></figure>` : '';
    return `<div class="fab-say"><span class="fab-char bell" role="img" aria-label="Miss Bell"></span><div class="bubble"><b><span aria-hidden="true">${s.e}</span> ${h(s.n)}</b><span id="tmFact">${h(s.t)}</span><span class="tm-know">💡 ${h(s.k)}</span></div></div>
      <div class="choice-row tm-row">${Say.ok ? `<button type="button" class="btn small soft" data-tm="say" data-saykey="spot:${s.id}" data-idle="🔊 Read it to me">${Say.label('spot:' + s.id, '🔊 Read it to me')}</button>` : ''}${s.snd && Snd.has(s.snd) ? '<button type="button" class="btn small soft" data-tm="hear">👂 Listen</button>' : ''}${s.photo ? `<button type="button" class="btn small soft" data-tm="photo" aria-expanded="${!!V.photo}">${V.photo ? '📷 Hide the photo' : '📷 See a real one'}</button>` : ''}<button type="button" class="btn small leaf" data-tm="nexthot">${h(w.next || 'Next one ➡️')}</button></div>${ph}${V.flash ? `<p class="tm-yes" role="status">${h(V.flash)}</p>` : ''}`;
  }
  function missionsHTML(w, p){
    const me = p[w.id], done = k => me.m.includes(k);
    if(V.act === 'sort') return sortHTML(w);
    if(V.act === 'match') return matchHTML(w);
    const all = me.m.length >= 3;
    const head = all ? `<div class="fab-say"><span class="fab-char elder" role="img" aria-label="Mr Elder, the head teacher"></span><div class="bubble"><b>All three missions done. You’ve earned your ${h(w.n)} stamp!</b><span class="tm-stamprow">${stampHTML(w, p, true)}<span>A gem and your stars are waiting in Fab Fox World.</span></span></div></div>`
      : `<div class="fab-say"><span class="fab-char fab" role="img" aria-label="Fab"></span><div class="bubble"><b>Three missions, in any order</b>Each one earns 2 stars. Do all three for your passport stamp. You can stop after any of them.</div></div>`;
    return `${head}<ol class="tm-missions">
      <li class="tm-mis ${done(1) ? 'done' : ''}"><b>1. Find three things</b><span>Find them in ${h(w.where || 'the picture')} and tap them: ${w.find.map(id => { const s = w.spots.find(x => x.id === id); return `<span class="tm-chip ${me.seen.includes(id) ? 'got' : ''}">${s.e} ${h(s.n.replace(/^The /, ''))}</span>`; }).join(' ')}</span>${done(1) ? '<em>⭐ Done</em>' : '<button type="button" class="btn small soft" data-tm="tab" data-id="explore">Go and look</button>'}</li>
      <li class="tm-mis ${done(2) ? 'done' : ''}"><b>2. ${h(w.sort.h)}</b><span>${h(w.sort.ask)}</span>${done(2) ? '<em>⭐ Done</em>' : ''}<button type="button" class="btn small ${done(2) ? 'soft' : 'leaf'}" data-tm="act" data-id="sort">${done(2) ? 'Play again' : 'Start'}</button></li>
      <li class="tm-mis ${done(3) ? 'done' : ''}"><b>3. ${h(w.match.h)}</b><span>${h(w.match.ask)}</span>${done(3) ? '<em>⭐ Done</em>' : ''}<button type="button" class="btn small ${done(3) ? 'soft' : 'leaf'}" data-tm="act" data-id="match">${done(3) ? 'Play again' : 'Start'}</button></li></ol>`;
  }
  function noteHTML(){
    const n = V.note; if(!n) return '<div class="tm-notebox" aria-live="polite"></div>';
    if(n.k === 'win') return `<div class="tm-notebox" aria-live="polite"><div class="fab-say"><span class="fab-char elder" role="img" aria-label="Mr Elder, the head teacher"></span><div class="bubble"><b>${h(n.h)}</b>${h(n.t)}</div></div></div>`;
    if(n.k === 'fix') return `<div class="tm-notebox" aria-live="polite"><div class="fab-say doc"><span class="fab-char doc" role="img" aria-label="Doctor McPhee"></span><div class="bubble"><b>${h(n.h)}</b>${h(n.t)}</div></div></div>`;
    return `<div class="tm-notebox" aria-live="polite"><p class="tm-yes">${h(n.t)}</p></div>`;
  }
  function sortHTML(w){
    const S = V.sort, items = w.sort.items, left = S.order.filter(id => !(id in S.placed));
    const item = id => { const it = items.find(x => x.id === id); return `<button type="button" class="tm-item ${S.sel === id ? 'sel' : ''}" data-tm="pick" data-id="${id}"><span aria-hidden="true">${it.e}</span>${h(it.n)}</button>`; };
    const bin = (k, lab) => `<button type="button" class="tm-bin" data-tm="bin" data-id="${k}"><b>${h(lab[0])}</b><small>${h(lab[1])}</small><span class="tm-in">${S.order.filter(id => S.placed[id] === k).map(id => { const it = items.find(x => x.id === id); return `<i title="${h(it.n)}">${it.e}</i>`; }).join('')}</span></button>`;
    return `<div class="tm-act"><div class="tm-act-head"><b>🎯 ${h(w.sort.h)}</b><span>${left.length ? 'Tap a thing, then tap where it belongs.' : ''}</span><button type="button" class="btn small soft" data-tm="act" data-id="">⬅️ Missions</button></div>
      <div class="tm-tray">${left.map(item).join('') || '<span class="tm-alldone">Everything is sorted!</span>'}</div>
      <div class="tm-bins">${bin('a', w.sort.a)}${bin('b', w.sort.b)}</div>${noteHTML()}</div>`;
  }
  function matchHTML(w){
    const M = V.match, items = w.match.items;
    const obj = it => `<button type="button" class="tm-item ${M.sel === it.id ? 'sel' : ''} ${M.done.includes(it.id) ? 'ok' : ''}" data-tm="mobj" data-id="${it.id}" ${M.done.includes(it.id) ? 'disabled' : ''}><span aria-hidden="true">${it.e}</span>${h(it.n)}</button>`;
    const use = id => { const it = items.find(x => x.id === id); return `<button type="button" class="tm-use ${M.done.includes(id) ? 'ok' : ''}" data-tm="muse" data-id="${id}" ${M.done.includes(id) ? 'disabled' : ''}>${M.done.includes(id) ? '<span aria-hidden="true">' + it.e + '</span> ' : ''}for ${h(it.use)}</button>`; };
    return `<div class="tm-act"><div class="tm-act-head"><b>🎯 ${h(w.match.h)}</b><span>${M.done.length < items.length ? h(w.match.pick || 'Tap a thing, then tap its job.') : ''}</span><button type="button" class="btn small soft" data-tm="act" data-id="">⬅️ Missions</button></div>
      <div class="tm-match"><div class="tm-col">${items.map(obj).join('')}</div><div class="tm-col">${M.uses.map(use).join('')}</div></div>${noteHTML()}</div>`;
  }
  function whoHTML(w, p){
    const who = w.who, cur = who.qs.find(x => x.id === V.ask), me = p[w.id];
    const dunno = who.dunno || 'What a good question! I do not know the answer to that one. Ask your teacher. They would love to find out with you.';
    const head = V.miss ? '“' + h(V.miss) + '”' : cur ? (V.ownq ? 'You asked: “' + h(V.ownq) + '”' : h(cur.q)) : h(who.hello.h);
    const body = V.miss ? h(dunno) : cur ? (V.ownq ? `<small class="tm-heard">${h(who.n)} hears: ${h(cur.q)}</small>` : '') + h(cur.a) : h(who.hello.t);
    const k = V.miss ? 'ans:miss' : cur ? 'ans:' + cur.id : '';
    return `<div class="tm-marcus"><div class="tm-marcus-say">${who.face}
      <div class="bubble"><b>${head}</b><span id="tmAnswer">${body}</span></div></div>
      <div class="tm-qs" role="group" aria-label="Questions to ask ${h(who.n)}">${who.qs.map(m => `<button type="button" class="tm-q ${me.asked.includes(m.id) ? 'asked' : ''} ${V.ask === m.id ? 'sel' : ''}" data-tm="ask" data-id="${m.id}">${h(m.q)}</button>`).join('')}<button type="button" class="tm-q tm-ownbtn ${V.own ? 'sel' : ''}" data-tm="own" aria-expanded="${!!V.own}">✏️ Ask your own question</button></div>
      ${V.own ? `<form class="tm-own" data-tmform="own"><label for="tmOwn">Type your question for ${h(who.n)}</label><div class="tm-ownrow"><input id="tmOwn" type="text" maxlength="90" autocomplete="off" autocapitalize="sentences" enterkeyhint="send" placeholder="What would you like to know?"><button type="submit" class="btn small leaf">Ask</button></div></form>` : ''}
      ${k && Say.ok ? `<div class="choice-row tm-row"><button type="button" class="btn small soft" data-tm="sayans" data-saykey="${k}" data-idle="🔊 Hear it again">${Say.label(k, '🔊 Hear it again')}</button></div>` : ''}
      ${me.chat ? '<p class="tm-yes">⭐ You asked great questions. That earned a star.</p>' : `<p class="hint">Ask three questions to earn a star. ${h(who.note)}</p>`}</div>`;
  }
  /* Street View without a key: the same address Google Maps gives under Share › Embed a map */
  function svUrl(r){ return 'https://www.google.com/maps/embed?pb=' + ['!4v1764000000000', '!6m8', '!1m7', '!1s' + r.pano, '!2m2', '!1d' + r.lat, '!2d' + r.lng, '!3f' + (r.h || 0), '!4f' + (r.p || 0), '!5f' + (r.z || 0.78)].join(''); }
  function svView(cur){ return Object.assign({}, cur, { h:(((cur.h || 0) + V.turn) % 360 + 360) % 360 }); }
  function realHTML(w){
    const cur = (w.real || []).find(r => r.id === V.real);
    const roam = roamOn();
    return `<div class="tm-real"><div class="fab-say"><span class="fab-char bell" role="img" aria-label="Miss Bell"></span><div class="bubble"><b>See it for real</b>${h(w.realIntro || 'These are real places you can visit today.')} ${roam ? 'Tap one, then drag the picture to look all around.' : 'Tap one, then use the arrows to turn and look around.'}</div></div>
      <div class="tm-qs" role="group" aria-label="Real places to look at">${w.real.map(r => `<button type="button" class="tm-q ${V.real === r.id ? 'sel' : ''}" data-tm="real" data-id="${r.id}"><span aria-hidden="true">${r.e || '🌍'}</span> ${h(r.n)}</button>`).join('')}</div>
      ${cur ? `<div class="tm-sv ${roam ? 'roam' : ''}"><iframe id="tmSv" title="A real view: ${h(cur.n)}" src="${h(svUrl(svView(cur)))}" referrerpolicy="no-referrer" ${roam ? 'allowfullscreen sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"' : 'tabindex="-1" inert sandbox="allow-scripts allow-same-origin"'}></iframe>${roam ? '' : '<div class="tm-svshield" aria-hidden="true"></div>'}<div class="tm-svwait" id="tmSvWait" hidden>Turning…</div></div>
        <p class="tm-svcap"><b>${h(cur.n)}.</b> ${h(cur.t)}</p>
        <div class="choice-row tm-row">${roam ? '' : '<button type="button" class="btn small soft" data-tm="turn" data-id="-45" aria-label="Turn left">⬅️ Turn left</button><button type="button" class="btn small soft" data-tm="turn" data-id="45" aria-label="Turn right">Turn right ➡️</button><button type="button" class="btn small soft" data-tm="turn" data-id="0">↩️ Look back at the start</button>'}<button type="button" class="btn small leaf" data-tm="real" data-id="">Close the view</button></div>` : ''}
      <p class="hint">These are real photographs from Google Street View. Nothing loads from Google until you tap a place.</p></div>`;
  }
  function stopHTML(w){
    return `<div class="me-card"><div class="fab-say"><span class="fab-char lark" role="img" aria-label="Mrs Lark"></span><div class="bubble"><b>A lovely place to stop.</b>Everything you found is saved in your passport, and your stars are on their way to Fab Fox World. ${h(w.n)} will be here next time.</div></div>
      <div class="choice-row"><button type="button" class="btn leaf" data-tm="leave">Finish for now</button><button type="button" class="btn soft" data-tm="unstop">Keep exploring</button></div></div>`;
  }
  function teachHTML(w){
    return `<details class="tm-teach"><summary>🧑‍🏫 For teachers: check before use, what’s left out, and links</summary>
      <ul><li><b>Draft to check.</b> Every fact and ${h(w.who.n)}’s answers are a first draft for a teacher to check before children use this world.</li>
      ${w.teach.map(t => `<li>${t}</li>`).join('')}
      ${(w.packs || []).length ? `<li><b>Practise it.</b> ${w.packs.map(k => `<button type="button" class="btn small soft" data-tm="pack" data-id="${k.id}" data-step="${k.step}">${h(k.label)}</button>`).join(' ')}</li>` : ''}
      <li><b>Sounds and photos.</b> The sounds are made by the app to give the idea; they are not recordings. Each photo is free to reuse and has its credit underneath; the full list with links is in <a href="explore/CREDITS.html" target="_blank" rel="noopener">photo credits</a>.</li>
      ${(w.real || []).length ? `<li><b>Real-world views.</b> “See it for real” shows Google’s own Street View photographs at viewpoints we have checked. Children can turn to look around but cannot walk away from the viewpoint or open Google Maps. The photographs show real places, so passers-by may appear (Google blurs faces). Google receives the device’s internet address when a view opens; nothing loads until a place is tapped. <button type="button" class="btn small soft" data-tm="realtoggle">${realOn() ? 'Switch real-world views off on this device' : 'Switch real-world views on for this device'}</button> <button type="button" class="btn small soft" data-tm="roamtoggle" aria-pressed="${roamOn()}">${roamOn() ? 'Free look is on: switch back to arrows only' : 'Teacher screen-share: switch on free look'}</button></li>` : ''}
      ${w.make ? '<li><b>Make and do.</b> A timeline or ordering task, a design task, and a report at three levels: built with taps (the low-energy way), with sentence starters, or on my own. The child’s timeline and design slot into the report, which can be printed. Their work is saved on this device only. Please check the dates.</li>' : ''}<li><b>No AI chat.</b> ${h(w.who.n)}’s answers are fixed scripts. Children tap a question, or type one of their own: the app matches it to one of the fixed answers, or ${h(w.who.n)} suggests asking you. Typed questions are not saved and are not sent anywhere.</li><li><b>Voices.</b> The app uses the best matching voice on this device (a woman’s, man’s or girl’s voice where the device has one). ⏸️ Pause stops at the end of a sentence, for talking points.</li></ul></details>`;
  }
  function panelHTML(w){
    const p = pass();
    if(V.stop) return stopHTML(w);
    if(V.tab === 'real' && !((w.real || []).length && realOn())) V.tab = 'explore';
    return tabsHTML(w, p) + `<div class="me-card tm-panel">${V.tab === 'missions' ? missionsHTML(w, p) : V.tab === 'who' ? whoHTML(w, p) : V.tab === 'real' ? realHTML(w) : V.tab === 'make' && w.make && window.FabMake ? FabMake.html(w) : exploreHTML(w)}</div>` + teachHTML(w);
  }

  function render(){
    const box = q1('#tmBody'); if(!box) return;
    const w = W(), ttl = q1('#tmTitle'); if(ttl) ttl.textContent = w ? w.e + ' ' + w.n : '🧭 ' + NAME;
    if(!w){ box.innerHTML = homeHTML(); return; }
    const st = q1('#tmStreet');
    if(!st || st.dataset.world !== w.id){
      box.innerHTML = `<div class="tm-streetwrap tm-w-${w.id}"><button type="button" class="tm-arrow l" data-tm="scroll" data-id="-1" aria-label="Move left">◀</button>
        <div class="tm-street" id="tmStreet" data-world="${w.id}" tabindex="0" aria-label="${h(w.aria)}. Use the arrow buttons or swipe to move along."><div class="tm-inner">${w.scene()}${w.spots.map(s => `<button type="button" class="tm-spot" data-tm="spot" data-id="${s.id}" style="left:${(s.x / 24).toFixed(2)}%;top:${(s.y / 8).toFixed(2)}%" aria-label="Look closer: ${h(s.n)}"><span aria-hidden="true"></span></button>`).join('')}
          <button type="button" class="tm-spot tm-person" data-tm="tab" data-id="who" style="left:${(w.who.at[0] / 24).toFixed(2)}%;top:${(w.who.at[1] / 8).toFixed(2)}%" aria-label="Meet ${h(w.who.n)}, ${h(w.who.role)}"><span aria-hidden="true">🗣️</span></button></div></div>
        <button type="button" class="tm-arrow r" data-tm="scroll" data-id="1" aria-label="Move right">▶</button></div><div id="tmPanel"></div>`;
    }
    const p = pass();
    box.querySelectorAll('.tm-spot[data-tm="spot"]').forEach(b => { b.classList.toggle('seen', p[w.id].seen.includes(b.dataset.id)); b.classList.toggle('on', V.hot === b.dataset.id && V.tab === 'explore'); });
    q1('#tmPanel').innerHTML = panelHTML(w);
    if(V.tab === 'make' && w.make && window.FabMake) FabMake.mount(w);
  }

  function scrollToSpot(id){
    const st = q1('#tmStreet'), b = st && st.querySelector(`.tm-spot[data-id="${id}"]`); if(!b) return;
    const x = b.offsetLeft - st.clientWidth / 2;
    try{ st.scrollTo({ left:Math.max(0, x), behavior:'smooth' }); }catch(e){ st.scrollLeft = Math.max(0, x); }
  }
  function missionDone(w, k, p){
    const me = p[w.id];
    if(me.m.includes(k)) return false;
    me.m.push(k); award(2);
    if(me.m.length >= 3 && !me.stamp){ me.stamp = Date.now(); try{ fabWorldTreasure('💎'); }catch(e){} try{ FabImpact.log('explore', w.id + '-stamp'); }catch(e){} }
    savePass(p); snd('jingle'); return true;
  }
  function see(w, id){
    const p = pass(), s = w.spots.find(x => x.id === id); if(!s) return;
    V.hot = id; V.tab = 'explore'; V.act = null; V.note = null; V.photo = false; Snd.stop();
    if(!p[w.id].seen.includes(id)){ p[w.id].seen.push(id); savePass(p); snd('ding'); } else snd('tick');
    if(w.find.every(f => p[w.id].seen.includes(f)) && missionDone(w, 1, p)) V.flash = '⭐ You found all three things! Mission 1 is done, and 2 stars are on their way to Fab Fox World.';
  }
  function openPack(id, step){
    const pack = (typeof Learn !== 'undefined' ? Learn.all() : []).find(x => x.id === id); if(!pack) return;
    const i = pack.screens.findIndex(s => s.type === 'pathway');
    learnOpen(pack);
    if(i >= 0){ Learn.step = i; const st = Learn.state[i] = Learn.state[i] || {}; if(!(st.kids && st.kids[pwMe()])) pwStart(pack.screens[i], st, pwMe(), Math.min(step, pack.screens[i].steps.length - 1)); learnRender(); }
  }
  /* ---------- voices: the device's best matching voice, spoken a sentence at a time so it can pause ---------- */
  const Say = (() => {
    const S = window.speechSynthesis; let q = [], i = 0, st = 'idle', opt = {}, tok = 0, key = '';
    const FEM = /female|sonia|libby|maisie|hazel|susan|kate|serena|martha|stephanie|samantha|karen|moira|tessa|fiona|zira|jenny|aria|emma|amy|olivia|abbi|bella|hollie|catherine|victoria/i;
    const MALE = /\bmale\b|ryan|thomas|george|daniel|arthur|oliver|david|mark\b|\bguy\b|brian|alfie|elliot|ethan|noah|rishi|james|gordon|aaron|\bfred\b/i;
    const isF = v => FEM.test(v.name), isM = v => MALE.test(v.name) && !/female/i.test(v.name);
    function pick(g, list){
      const vs = (list || (S ? S.getVoices() : []) || []).filter(v => /^en/i.test(v.lang || '')); if(!vs.length) return null;
      const want = g === 'm' ? isM : isF, not = g === 'm' ? isF : isM;
      const sc = v => (want(v) ? 8 : 0) - (not(v) ? 8 : 0) + (/en[-_]GB/i.test(v.lang) ? 4 : 0) + (/natural|neural|online/i.test(v.name) ? 3 : 0) + (/google/i.test(v.name) ? 1 : 0) + (g === 'g' && /maisie/i.test(v.name) ? 2 : 0);
      return vs.slice().sort((a, b) => sc(b) - sc(a))[0];
    }
    function pitch(v, g){ const right = v && (g === 'm' ? isM(v) : isF(v)); return g === 'm' ? (right ? 1 : .8) : g === 'g' ? (right ? 1.25 : 1.4) : (right ? 1.05 : 1.25); }
    const split = t => (String(t).match(/[^.!?]+[.!?]+["’”)]*\s*|[^.!?]+$/g) || []).map(x => x.trim()).filter(Boolean);
    function paint(){ document.querySelectorAll('[data-saykey]').forEach(b => { b.textContent = label(b.dataset.saykey, b.dataset.idle); b.setAttribute('aria-pressed', String(key === b.dataset.saykey && st !== 'idle')); }); }
    function label(k, idle){ return key === k && st === 'speaking' ? '⏸️ Pause' : key === k && st === 'paused' ? '▶️ Carry on' : idle; }
    function next(){
      if(st !== 'speaking') return; if(i >= q.length){ st = 'idle'; key = ''; paint(); return; }
      const u = new SpeechSynthesisUtterance(q[i]), v = pick(opt.g); if(v){ u.voice = v; u.lang = v.lang; } else u.lang = 'en-GB';
      u.rate = .92; u.pitch = pitch(v, opt.g); const my = tok;
      u.onend = () => { if(my !== tok) return; i++; setTimeout(next, 160); }; u.onerror = () => { if(my !== tok) return; i++; next(); };
      try{ S.speak(u); }catch(e){ st = 'idle'; key = ''; paint(); }
    }
    function speak(text, o){ if(!S) return; tok++; try{ S.cancel(); }catch(e){} opt = o || {}; key = opt.key || ''; q = split(text); i = 0; st = 'speaking'; paint(); next(); }
    function pause(){ if(st !== 'speaking') return; tok++; try{ S.cancel(); }catch(e){} st = 'paused'; paint(); }
    function resume(){ if(st !== 'paused') return; tok++; st = 'speaking'; paint(); next(); }
    function stop(){ tok++; try{ S && S.cancel(); }catch(e){} q = []; i = 0; st = 'idle'; key = ''; paint(); }
    function toggle(k, text, g){ if(key === k && st === 'speaking') return pause(); if(key === k && st === 'paused') return resume(); speak(text, { g, key:k }); }
    try{ if(S){ S.getVoices(); S.addEventListener && S.addEventListener('voiceschanged', () => S.getVoices()); } }catch(e){}
    return { speak, pause, resume, stop, toggle, label, pick, split, pitch, state:() => ({ st, key, i, n:q.length }), ok:!!S };
  })();
  /* ---------- a child's own question: matched to one of the guide's fixed answers, never stored, never sent ---------- */
  const Own = (() => {
    const STOP = new Set('a an the is are am was were do does did you your yours i me my we our it its to of in on at for with and or but what when where who why how can could would will have has had there this that they them he she his her be been much many any some like get got go going about from up into as by so if not no yes please tell ever really very all day'.split(' '));
    const SYN = { food:'eat', dinner:'eat', lunch:'eat', breakfast:'eat', meal:'eat', hungry:'eat', drink:'eat', bed:'sleep', night:'sleep', tired:'sleep', dream:'sleep', job:'work', lesson:'school', learn:'school', teacher:'school', class:'school', game:'play', toy:'play', fun:'play', hobby:'play', mum:'family', dad:'family', mother:'family', father:'family', brother:'family', sister:'family', parent:'family', friend:'family', home:'live', house:'live', quick:'fast', speed:'fast', wear:'clothes', dress:'clothes', bath:'wash', shower:'wash', clean:'wash', toilet:'wash', teeth:'wash', number:'count', maths:'count', read:'write', pen:'write', pencil:'write', gravity:'float', weightless:'float', fly:'float', coin:'money', pay:'money', buy:'money', cost:'money', dark:'light', lamp:'light', candle:'light', nile:'river', water:'river', window:'see', look:'see', view:'see', earth:'see', cool:'hot', sun:'hot', weather:'hot', victoria:'queen', king:'queen' };
    const KEYS = { job:'work', eat:'eat bread', home:'live', school:'school', fun:'play', games:'play', count:'count', money:'money', learn:'school write', pen:'write ink', write:'write ink slate', river:'river boat flood', hot:'hot', light:'light', queen:'queen', float:'float fall', sleep:'sleep', wash:'wash hair', work:'work science experiment', see:'see', family:'family miss phone call', fast:'fast far high' };
    const stem = x => x.length > 4 ? x.replace(/(ing|ed|es|s)$/, '') : x.length > 3 ? x.replace(/s$/, '') : x;
    const toks = t => [...new Set(String(t).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(x => x && !STOP.has(x)).map(stem).map(x => SYN[x] || x))];
    function match(text, qs){
      const u = toks(text); if(!u.length) return null;
      const sets = qs.map(m => toks(m.q + ' ' + (KEYS[m.id] || '') + ' ' + (m.k || '')));
      const df = {}; sets.forEach(k => k.forEach(x => { df[x] = (df[x] || 0) + 1; }));
      let best = null, bs = 0; sets.forEach((k, n) => { const sc = u.filter(x => k.includes(x) && df[x] < 3).length; if(sc > bs){ bs = sc; best = qs[n]; } });
      return bs >= 1 ? best : null;
    }
    return { match, toks };
  })();
  function quiet(){ Snd.stop(); Say.stop(); }
  function leave(){
    quiet();
    const b = V.back || 'screen-learn'; V.stop = false; V.real = null;
    showScreen(b);
    if(b === 'screen-world'){ try{ const wf = document.querySelector('iframe[data-game="world"]'); if(wf && wf.contentWindow){ wf.contentWindow.postMessage('fabworld-wake', '*'); wf.contentWindow.postMessage('fabworld-refresh', '*'); } }catch(e){} }
  }

  function onClick(e){
    const b = e.target.closest('[data-tm]'); if(!b) return;
    const a = b.dataset.tm, id = b.dataset.id, p = pass(), w = W(); V.flash = '';
    if(a === 'era'){ if(!WORLDS[id]) return; V.era = id; V.tab = 'explore'; V.hot = null; V.act = null; V.note = null; V.ask = null; V.real = null; V.photo = false; snd('jingle'); q1('#tmBody').innerHTML = ''; render(); return; }
    if(!w) return;
    const me = p[w.id];
    if(a === 'scroll'){ const st = q1('#tmStreet'); if(st){ const d = Number(id) * st.clientWidth * .6; try{ st.scrollBy({ left:d, behavior:'smooth' }); }catch(err){ st.scrollLeft += d; } } return; }
    if(a === 'spot'){ see(w, id); render(); const pn = q1('#tmPanel'); if(pn) try{ pn.scrollIntoView({ block:'nearest', behavior:'smooth' }); }catch(err){} return; }
    if(a === 'tab'){ quiet(); if(id === 'make' && window.FabMake) FabMake.home(); V.tab = id; V.act = null; V.note = null; V.real = null; V.own = false; V.miss = ''; V.ownq = ''; if(id === 'who') scrollToSpot(w.who.spot); snd('tick'); render(); return; }
    if(a === 'say'){ const s = w.spots.find(x => x.id === V.hot); Snd.stop(); if(s) Say.toggle('spot:' + s.id, s.n + '. ' + s.t + ' ' + s.k, 'f'); return; }
    if(a === 'hear'){ const s = w.spots.find(x => x.id === V.hot); Say.stop(); if(s) Snd.play(s.snd); return; }
    if(a === 'photo'){ V.photo = !V.photo; snd('tick'); render(); return; }
    if(a === 'nexthot'){ const i = w.spots.findIndex(x => x.id === V.hot), n = w.spots[(i + 1) % w.spots.length]; see(w, n.id); render(); scrollToSpot(n.id); return; }
    if(a === 'act'){
      V.act = id || null; V.note = null;
      if(id === 'sort') V.sort = { order:shuffle(w.sort.items.map(x => x.id)), placed:{}, sel:null };
      if(id === 'match') V.match = { uses:shuffle(w.match.items.map(x => x.id)), done:[], sel:null };
      snd('tick'); render(); return; }
    if(a === 'pick'){ V.sort.sel = V.sort.sel === id ? null : id; V.note = null; snd('tick'); render(); return; }
    if(a === 'bin'){
      const S = V.sort; if(!S.sel){ V.note = { k:'say', t:'Tap one of the things first.' }; render(); return; }
      const it = w.sort.items.find(x => x.id === S.sel);
      if((id === 'a') === !!it.a){ S.placed[it.id] = id; S.sel = null; V.note = { k:'say', t:'Yes! ' + it.tip }; snd('ding');
        if(Object.keys(S.placed).length === w.sort.items.length){ const first = missionDone(w, 2, p); V.note = { k:'win', h:'Sorted, every one!', t:first ? 'That earned 2 stars for Fab Fox World.' : 'You really know this world.' }; } }
      else { S.sel = null; V.note = { k:'fix', h:'Not that one. Have another think.', t:it.tip }; snd('gentle'); }
      render(); return; }
    if(a === 'mobj'){ V.match.sel = V.match.sel === id ? null : id; V.note = null; snd('tick'); render(); return; }
    if(a === 'muse'){
      const M = V.match; if(!M.sel){ V.note = { k:'say', t:'Tap one of the things on the left first.' }; render(); return; }
      const it = w.match.items.find(x => x.id === M.sel);
      if(M.sel === id){ M.done.push(id); M.sel = null; V.note = { k:'say', t:'Yes! ' + it.n.charAt(0).toUpperCase() + it.n.slice(1) + ' is for ' + it.use + '.' }; snd('ding');
        if(M.done.length === w.match.items.length){ const first = missionDone(w, 3, p); V.note = { k:'win', h:'Every one matched!', t:first ? 'That earned 2 stars for Fab Fox World.' : 'Brilliant matching.' }; } }
      else { M.sel = null; V.note = { k:'fix', h:'Not quite. Try a different job.', t:'Think about what ' + it.n + ' looks like, and where you saw it.' }; snd('gentle'); }
      render(); return; }
    if(a === 'ask' || a === 'ownask'){
      let m = null;
      if(a === 'ownask'){ const el = q1('#tmOwn'), text = el ? el.value.replace(/\s+/g, ' ').trim().slice(0, 90) : ''; if(!text){ if(el) el.focus(); return; }
        m = Own.match(text, w.who.qs); V.own = false;
        if(!m){ V.ask = null; V.ownq = ''; V.miss = text; Snd.stop(); snd('gentle'); render(); Say.speak(w.who.dunno || 'What a good question! I do not know the answer to that one. Ask your teacher. They would love to find out with you.', { g:w.who.voice || 'f', key:'ans:miss' }); return; }
        V.ownq = text; }
      else { m = w.who.qs.find(x => x.id === id); V.ownq = ''; }
      if(!m) return; V.ask = m.id; V.miss = ''; Snd.stop();
      if(!me.asked.includes(m.id)){ me.asked.push(m.id); if(me.asked.length >= 3 && !me.chat){ me.chat = 1; award(1); snd('jingle'); } else snd('tick'); savePass(p); } else snd('tick');
      render(); Say.speak(m.a, { g:w.who.voice || 'f', key:'ans:' + m.id }); return; }
    if(a === 'own'){ V.own = !V.own; snd('tick'); render(); const el = q1('#tmOwn'); if(el) el.focus(); return; }
    if(a === 'sayans'){ const m = w.who.qs.find(x => x.id === V.ask), dn = w.who.dunno || 'What a good question! I do not know the answer to that one. Ask your teacher. They would love to find out with you.'; if(V.miss) Say.toggle('ans:miss', dn, w.who.voice || 'f'); else if(m) Say.toggle('ans:' + m.id, m.a, w.who.voice || 'f'); return; }
    if(a === 'real'){ V.real = id || null; V.turn = 0; snd('tick'); render(); const sv = q1('.tm-sv'); if(sv) try{ sv.scrollIntoView({ block:'nearest', behavior:'smooth' }); }catch(err){} return; }
    if(a === 'turn'){ const cur = (w.real || []).find(r => r.id === V.real), f = q1('#tmSv'); if(!cur || !f) return; const d = +id || 0; V.turn = d ? V.turn + d : 0; snd('tick');
      const wait = q1('#tmSvWait'); if(wait){ wait.hidden = false; const off = () => { setTimeout(() => { wait.hidden = true; }, 700); f.removeEventListener('load', off); }; f.addEventListener('load', off); setTimeout(() => { wait.hidden = true; }, 6000); }
      f.src = svUrl(svView(cur)); return; }
    if(a === 'roamtoggle'){ try{ if(roamOn()) localStorage.removeItem('fab-explore-roam'); else localStorage.setItem('fab-explore-roam', 'on'); }catch(err){} V.real = null; V.turn = 0; snd('tick'); render(); const d = q1('.tm-teach'); if(d) d.open = true; return; }
    if(a === 'realtoggle'){ try{ if(realOn()) localStorage.setItem('fab-explore-real', 'off'); else localStorage.removeItem('fab-explore-real'); }catch(err){} V.real = null; snd('tick'); render(); const d = q1('.tm-teach'); if(d) d.open = true; return; }
    if(a === 'stop'){ quiet(); V.stop = true; V.real = null; snd('gentle'); render(); return; }
    if(a === 'unstop'){ V.stop = false; snd('tick'); render(); return; }
    if(a === 'leave'){ leave(); return; }
    if(a === 'pack'){ quiet(); openPack(id, Number(b.dataset.step) || 0); return; }
  }

  function open(back, world){
    if(!q1('#screen-time')) return false;
    V.back = back || 'screen-learn'; V.stop = false; V.note = null;
    if(world && WORLDS[world] && V.era !== world){ V.era = world; V.tab = 'explore'; V.hot = null; V.act = null; V.real = null; }
    if(V.back === 'screen-world'){ try{ fabWorldFull(false); }catch(e){} try{ const wf = document.querySelector('iframe[data-game="world"]'); wf && wf.contentWindow && wf.contentWindow.postMessage('fabworld-sleep', '*'); }catch(e){} }
    showScreen('screen-time'); const st = q1('#tmStreet'); if(st && (!W() || st.dataset.world !== V.era)) q1('#tmBody').innerHTML = ''; render();
    return true;
  }

  const CSS = `
body:has(#screen-time.active) main{max-width:1240px}
.tm-door{margin:14px 0 4px}.tm-door h2{margin:0 0 8px;font-size:var(--t-head,1.5rem)}.tm-door h2 small{font:400 var(--t-body,1.05rem) var(--body,Aleo),Georgia,serif;opacity:.8;margin-left:6px}
.tm-eras{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px;margin:0 0 6px}
.tm-era{display:flex;flex-direction:column;align-items:flex-start;gap:4px;text-align:left;background:#fff;border:3px solid var(--ink,#2B1A12);border-radius:20px;padding:14px;font:inherit;color:var(--ink,#2B1A12);cursor:pointer;min-height:150px;box-shadow:0 4px 0 rgba(43,26,18,.16)}
.tm-era:hover,.tm-era:focus-visible{background:var(--sunshine,#FFD483);outline:none}
.tm-era.soon{opacity:.6;cursor:default;border-style:dashed;box-shadow:none}
.tm-era-e{font-size:2.6rem;line-height:1}.tm-era b{font-family:var(--disp);font-size:var(--t-lead,1.2rem)}.tm-era small{font-size:var(--t-small,.95rem);opacity:.85}
.tm-go{margin-top:auto;font-weight:700;color:var(--flame-dark,#C93C00)}.tm-soon{margin-top:auto;font-weight:700;opacity:.8}
.tm-passport{display:flex;flex-wrap:wrap;align-items:center;gap:12px;background:#fffdf6;border-radius:16px;padding:10px 14px;margin-top:12px}
.tm-stamps{display:flex;flex-wrap:wrap;gap:10px}
.tm-stamp{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;width:92px;height:92px;border-radius:50%;border:4px dashed #b9a781;color:#b9a781;transform:rotate(-8deg);font-family:var(--disp);line-height:1.05;text-align:center;flex:none;background:#fff}
.tm-stamp:nth-child(even){transform:rotate(6deg)}
.tm-stamp b{font-size:1.15rem;letter-spacing:2px}.tm-stamp i{font-style:normal;font-size:.68rem;font-family:var(--body)}
.tm-stamp.got{border:4px double var(--flame-dark,#C93C00);color:var(--flame-dark,#C93C00);box-shadow:inset 0 0 0 4px rgba(254,77,2,.12)}
.tm-stamp.big{margin:6px 0 2px}
.tm-stamprow{display:flex;align-items:center;gap:14px}
.tm-streetwrap{position:relative;border:4px solid var(--ink,#2B1A12);border-radius:24px;overflow:hidden;background:#fdf3dc;box-shadow:0 5px 0 rgba(43,26,18,.16)}
.tm-streetwrap.tm-w-space{background:#0b1437}
.tm-street{overflow-x:auto;overflow-y:hidden;height:clamp(260px,46vh,480px);-webkit-overflow-scrolling:touch;scrollbar-width:thin}
.tm-inner{position:relative;height:100%;aspect-ratio:3/1}
.tm-svg{display:block;height:100%;width:100%}
.tm-spot{position:absolute;transform:translate(-50%,-50%);width:54px;height:54px;border-radius:50%;border:4px solid #fff;background:rgba(254,77,2,.9);box-shadow:0 0 0 0 rgba(254,77,2,.55);cursor:pointer;animation:tmpulse 2.2s ease-out infinite;padding:0;display:grid;place-items:center;font-size:1.3rem;color:#fff}
.tm-spot span::before{content:'?';font:700 1.5rem var(--disp),Georgia,serif}
.tm-spot.seen{background:rgba(79,122,46,.92);animation:none}.tm-spot.seen span::before{content:'✓'}
.tm-spot.on{outline:5px solid var(--golden,#F3BB17);outline-offset:3px}
.tm-spot.tm-person{background:var(--sky,#3F6A8C);animation:none}.tm-spot.tm-person span::before{content:''}
.tm-spot:focus-visible{outline:5px solid var(--golden,#F3BB17);outline-offset:3px}
@keyframes tmpulse{0%{box-shadow:0 0 0 0 rgba(254,77,2,.55)}100%{box-shadow:0 0 0 20px rgba(254,77,2,0)}}
.tm-arrow{position:absolute;top:50%;transform:translateY(-50%);z-index:3;width:56px;height:72px;border:3px solid var(--ink,#2B1A12);background:var(--cream,#FFF6E6);border-radius:16px;font-size:1.5rem;cursor:pointer;color:var(--ink,#2B1A12);box-shadow:0 3px 0 rgba(43,26,18,.25)}
.tm-arrow.l{left:8px}.tm-arrow.r{right:8px}.tm-arrow:hover{background:var(--sunshine,#FFD483)}
.tm-tabs{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:12px 0 8px}
.tm-tabs .pill-choice small{font-weight:400;margin-left:4px}
.tm-found{margin-left:auto;font-weight:700;background:#fff;border-radius:999px;padding:6px 14px;border:2px solid var(--cream-deep,#f0dfbd)}
.tm-panel.me-card,.tm-home.me-card{max-width:none}
.tm-panel .bubble b{display:block;margin-bottom:2px}
.tm-know{display:block;margin-top:6px;background:var(--sunshine,#FFD483);border-radius:12px;padding:5px 10px}
.tm-row{justify-content:flex-start;margin-top:8px}
.tm-photo{margin:12px 0 0;display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end}
.tm-photo img{display:block;max-width:min(100%,520px);max-height:360px;border:4px solid #fff;border-radius:14px;box-shadow:0 3px 10px rgba(43,26,18,.3);background:#eee}
.tm-photo figcaption{flex:1 1 200px;font-weight:700}.tm-photo figcaption small{display:block;font-weight:400;font-size:.82rem;opacity:.8;margin-top:4px}
.tm-sv{position:relative;margin-top:10px;border:4px solid var(--ink,#2B1A12);border-radius:18px;overflow:hidden;background:#222;aspect-ratio:16/9;max-height:62vh}
.tm-svshield{position:absolute;left:0;right:0;top:0;bottom:26px;z-index:2}
.tm-svwait{position:absolute;inset:0;z-index:3;display:grid;place-items:center;background:rgba(34,26,20,.72);color:#fff;font-weight:800;font-size:1.3rem}
.tm-svwait[hidden]{display:none}
/* reading size: the words we read together are big */
#screen-time{--t-small:1.08rem;--t-body:1.25rem;--t-lead:1.45rem;--t-head:1.75rem}
#screen-time .tm-panel{font-size:1.25rem;line-height:1.5}
#screen-time .fab-say{max-width:940px}#screen-time .fab-say .fab-char{width:108px}
#screen-time .bubble{font-size:1.5rem;line-height:1.5;padding:14px 22px}#screen-time .bubble b{font-size:1.6rem}
#screen-time .tm-know{font-size:1.35rem;padding:8px 14px;margin-top:10px}
#screen-time .tm-q{font-size:1.3rem;min-height:58px;padding:10px 20px}
#screen-time .hint{font-size:1.1rem}#screen-time .tm-yes{font-size:1.3rem}
#screen-time .tm-svcap,#screen-time .tm-photo figcaption{font-size:1.4rem;line-height:1.45}#screen-time .tm-photo figcaption small{font-size:.95rem}
#screen-time .pill-choice{font-size:1.2rem}#screen-time .btn.small{font-size:1.2rem;min-height:52px}
#screen-time .tm-heard{font-size:1.05rem}#screen-time .tm-teach{font-size:1.05rem;line-height:1.45}#screen-time .tm-face{width:108px}
@media (max-width:640px){#screen-time .bubble{font-size:1.3rem}#screen-time .bubble b{font-size:1.4rem}#screen-time .tm-panel{font-size:1.15rem}}
.tm-ownbtn{border-style:dashed}
.tm-own{margin:12px 0 0;display:grid;gap:6px}.tm-own label{font-weight:800}.tm-ownrow{display:flex;gap:10px;flex-wrap:wrap}.tm-own input{flex:1 1 260px;min-height:52px;font:inherit;font-size:1.15rem;padding:8px 14px;border:3px solid var(--ink,#2B1A12);border-radius:14px;background:#fff}.tm-own input:focus-visible{outline:4px solid var(--sky,#5aa9e6);outline-offset:2px}
.tm-heard{display:block;font-size:.9rem;opacity:.8;margin-bottom:4px}
.tm-sv iframe{display:block;width:100%;height:100%;border:0}
.tm-svcap{margin:8px 0 0}
.tm-missions{list-style:none;margin:12px 0 0;padding:0;display:grid;gap:10px}
.tm-mis{display:flex;flex-wrap:wrap;align-items:center;gap:10px;background:#fff;border:3px solid var(--cream-deep,#f0dfbd);border-radius:18px;padding:10px 14px}
.tm-mis b{font-size:var(--t-lead,1.15rem);flex:0 0 100%}.tm-mis > span{flex:1 1 240px}.tm-mis em{font-style:normal;font-weight:700;color:#2f6b1f}
.tm-mis.done{border-color:#b9d8a3;background:#f4fbee}
.tm-chip{display:inline-block;background:#f3ecd9;border-radius:999px;padding:3px 10px;margin:2px;font-weight:700}.tm-chip.got{background:#dff0d0}.tm-chip.got::after{content:' ✓'}
.tm-act-head{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:10px}.tm-act-head b{font-size:var(--t-lead,1.2rem)}.tm-act-head span{flex:1 1 200px}
.tm-tray{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;min-height:66px;margin-bottom:12px}
.tm-item,.tm-use{border:3px solid var(--ink,#2B1A12);background:var(--cream,#FFF6E6);border-radius:16px;padding:8px 14px;font:700 var(--t-body,1.05rem) var(--body,Aleo),Georgia,serif;color:var(--ink,#2B1A12);cursor:pointer;display:flex;align-items:center;gap:8px;min-height:58px;box-shadow:0 3px 0 rgba(43,26,18,.18);text-align:left}
.tm-item span{font-size:1.7rem}.tm-item.sel{background:var(--sunshine,#FFD483);box-shadow:0 0 0 4px rgba(254,77,2,.45)}
.tm-item.ok,.tm-use.ok{background:#e8f6dc;border-color:#3e9b3a;box-shadow:none;cursor:default;opacity:.95}
.tm-bins{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.tm-bin{display:flex;flex-direction:column;gap:2px;align-items:center;border:4px dashed var(--leaf,#4F7A2E);background:#fff;border-radius:20px;padding:12px;min-height:130px;font:inherit;color:var(--ink,#2B1A12);cursor:pointer}
.tm-bin:nth-child(2){border-color:var(--sky,#3F6A8C)}.tm-bin b{font-size:var(--t-lead,1.15rem)}.tm-bin small{opacity:.8}
.tm-in{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:8px;font-size:1.8rem}.tm-in i{font-style:normal}
.tm-alldone{font-weight:700;align-self:center}
.tm-match{display:grid;grid-template-columns:1fr 1fr;gap:14px}.tm-col{display:grid;gap:10px;align-content:start}
.tm-use{background:#fff}
.tm-notebox{min-height:10px;margin-top:10px}.tm-yes{margin:8px 0 0;background:#e8f6dc;border-radius:12px;padding:8px 12px;font-weight:700}
.tm-marcus-say{display:flex;gap:12px;align-items:flex-start}.tm-face{width:92px;flex:none}
.tm-marcus-say .bubble{background:#fff;border:3px solid var(--ink,#2B1A12);border-radius:18px;padding:10px 14px;flex:1;font-size:var(--t-lead,1.12rem)}
.tm-qs{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 6px}
.tm-q{border:3px solid var(--ink,#2B1A12);background:var(--cream,#FFF6E6);border-radius:999px;padding:8px 16px;font:700 var(--t-body,1.05rem) var(--body,Aleo),Georgia,serif;color:var(--ink,#2B1A12);cursor:pointer;min-height:52px}
.tm-q.asked{background:#eef7e6}.tm-q.asked::after{content:' ✓'}.tm-q.sel{background:var(--sunshine,#FFD483)}
.tm-teach{background:var(--cream,#FFF6E6);border:2px dashed var(--cream-deep,#f0dfbd);border-radius:16px;padding:10px 14px;margin-top:12px}
.tm-teach summary{font-weight:700;cursor:pointer}.tm-teach li{margin:6px 0}
/* scenes that move a little */
@keyframes tmflick{0%,100%{transform:scale(1,1)}50%{transform:scale(.93,1.2)}}
.tm-flame{transform-box:fill-box;transform-origin:50% 100%;animation:tmflick .55s ease-in-out infinite}
@keyframes tmrise{0%{transform:translateY(8px);opacity:0}25%{opacity:.8}100%{transform:translateY(-44px);opacity:0}}
.tm-smoke{transform-box:fill-box;animation:tmrise 3.4s linear infinite}
@keyframes tmbob{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-7px) rotate(1deg)}}
.tm-bob{transform-box:fill-box;transform-origin:50% 100%;animation:tmbob 3.4s ease-in-out infinite}
@keyframes tmdrift{from{transform:translateX(-30px)}to{transform:translateX(110px)}}
.tm-drift{animation:tmdrift 46s ease-in-out infinite alternate}
@keyframes tmspin{to{transform:rotate(360deg)}}
.tm-spin{transform-box:fill-box;transform-origin:center;animation:tmspin 7s linear infinite}
@keyframes tmflow{to{stroke-dashoffset:-28}}
.tm-flow{stroke-dasharray:10 8;animation:tmflow 1s linear infinite}
@keyframes tmtwinkle{0%,100%{opacity:.25}50%{opacity:1}}
.tm-twinkle{animation:tmtwinkle 2.6s ease-in-out infinite}
@keyframes tmfloat{0%,100%{transform:translate(0,0) rotate(-5deg)}50%{transform:translate(8px,-14px) rotate(6deg)}}
.tm-float{transform-box:fill-box;transform-origin:center;animation:tmfloat 7s ease-in-out infinite}
@keyframes tmsway{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
.tm-sway{transform-box:fill-box;transform-origin:50% 100%;animation:tmsway 4s ease-in-out infinite}
@media (max-width:640px){.tm-bins,.tm-match{grid-template-columns:1fr}.tm-arrow{width:46px;height:60px}.tm-found{margin-left:0}}
@media (prefers-reduced-motion:reduce){.tm-spot,.tm-flame,.tm-smoke,.tm-bob,.tm-drift,.tm-spin,.tm-flow,.tm-twinkle,.tm-float,.tm-sway{animation:none}}
`;

  function init(){
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const main = q1('main'); if(main && !q1('#screen-time')) main.insertAdjacentHTML('beforeend', HTML);
    const scr = q1('#screen-time'); if(!scr) return;
    scr.addEventListener('click', onClick);
    scr.addEventListener('submit', e => { const f = e.target.closest('[data-tmform]'); if(!f) return; e.preventDefault(); onClick({ target:{ closest:() => ({ dataset:{ tm:'ownask' } }) } }); });
    q1('#tmBack').addEventListener('click', () => { snd('tick'); if(V.stop){ V.stop = false; render(); return; } if(V.era){ if(V.act){ V.act = null; V.note = null; render(); return; } quiet(); V.era = null; V.real = null; q1('#tmBody').innerHTML = ''; render(); return; } leave(); });
    scr.addEventListener('keydown', e => { const stt = e.target.closest && e.target.closest('#tmStreet'); if(!stt) return; if(e.key === 'ArrowRight'){ stt.scrollBy({ left:160 }); e.preventDefault(); } if(e.key === 'ArrowLeft'){ stt.scrollBy({ left:-160 }); e.preventDefault(); } });
    const tools = q1('#learnTools');
    if(tools && !q1('#learnTimeBtn')){ tools.insertAdjacentHTML('beforeend', `<button type="button" class="lt-card" id="learnTimeBtn"><i aria-hidden="true">🧭</i><b>${NAME}</b><span>Rome, Egypt, the Victorians, space</span></button>`); q1('#learnTimeBtn').addEventListener('click', () => { snd('tick'); open('screen-learn'); }); }
  }
  window.fabOpenTime = window.fabOpenExplore = open;
  window.FabExplore = window.FabTime = { open, add, state:V, pass, worlds:WORLDS, order:ORDER, world:W, sounds:Snd, say:Say, own:Own, render, code, snd, svUrl, kit:{ INK, h, wrap, face, person, loaf, column, amphora, roof, cypress } };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
