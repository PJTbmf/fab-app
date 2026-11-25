/* explorer-worlds.js — More Explorer Worlds: Ancient Egypt, the Victorians and the Space Station.
   Each world is data for the engine in timemachine.js: a scene drawn here, spots, three missions, a made-up person
   with fixed answers, teacher notes, and (at the bottom) real photographs and Street View viewpoints for every world.
   Every fact is a draft for a teacher to check before children use it.
   Loaded after timemachine.js. */
(function(){
  'use strict';
  const X = window.FabExplore; if(!X) return;
  const { INK, wrap, face, person, loaf } = X.kit;
  const F = 'font-family="Aleo, Georgia, serif" font-weight="700"';

  /* =====================================================================
     ANCIENT EGYPT: beside the Nile, about 3,300 years ago
     ===================================================================== */
  function egypt(){
    const palm = (x, y, s) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M0 0 q10 -70 -6 -140" stroke="#8a5a2c" stroke-width="13" fill="none" stroke-linecap="round"/><g class="tm-sway">${[[-95, 10], [-70, -28], [-30, -48], [30, -48], [70, -28], [95, 10]].map(([dx, dy]) => `<path d="M-6 -140 q${dx * .5} ${dy - 30} ${dx} ${dy}" stroke="#3f7a35" stroke-width="10" fill="none" stroke-linecap="round"/>`).join('')}<circle cx="-12" cy="-132" r="6" fill="#a8482a"/><circle cx="2" cy="-128" r="6" fill="#a8482a"/></g></g>`;
    const pyr = (x, base, hgt) => `<polygon points="${x - base / 2},560 ${x},${560 - hgt} ${x + base / 2},560" fill="#eccd90" stroke="#c9a25e" stroke-width="2.5"/><polygon points="${x},${560 - hgt} ${x + base / 2},560 ${x + base * .14},560" fill="#d6b06c"/>`;
    const G = [
      '<path d="M0 10 l4.5 -5 l4.5 5 l4.5 -5 l4.5 5" fill="none"/>',
      '<circle cx="9" cy="9" r="7" fill="#e7b43a"/><circle cx="9" cy="9" r="1.6" fill="#7a4a2a"/>',
      '<path d="M9 18 V4 q8 3 0 9" fill="#5f9a45"/>',
      '<ellipse cx="9" cy="9" rx="8" ry="4" fill="#c4472d"/>',
      '<ellipse cx="9" cy="5" rx="4" ry="5" fill="none"/><path d="M9 10 V18 M3 12 H15" fill="none"/>',
      '<path d="M3 14 q2 -9 9 -8 q4 0 3 4 l-3 0 q-1 5 -6 5 Z" fill="#3f6ea8"/>',
      '<path d="M1 9 q8 -8 16 0 q-8 7 -16 0 Z" fill="#fff"/><circle cx="9" cy="9" r="2.6" fill="#7a4a2a"/>',
      '<path d="M2 6 h14 q-1 9 -7 9 q-6 0 -7 -9 Z" fill="#3f8a6a"/>'
    ];
    const glyphs = (x0, y0, cols, rows, seed) => { let s = ''; for(let r = 0; r < rows; r++) for(let c = 0; c < cols; c++) s += `<g transform="translate(${x0 + c * 24},${y0 + r * 30})" stroke="#7a4a2a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${G[(r * 3 + c * 5 + seed) % G.length]}</g>`; return s; };
    let wheat = ''; for(let x = 50; x < 420; x += 22) wheat += `<path d="M${x} 636 v-44" stroke="#b79a3a" stroke-width="3"/><ellipse cx="${x}" cy="586" rx="4.5" ry="10" fill="#e3c14e" stroke="#b79a3a" stroke-width="1.5"/>`;
    let ripples = ''; [[80, 700], [300, 760], [470, 690], [980, 744], [1180, 700], [1400, 770], [1600, 712], [1850, 752], [2060, 700], [2260, 764], [640, 780], [1280, 742]].forEach(([x, y]) => { ripples += `<path d="M${x} ${y} q12 -7 24 0 t24 0 t24 0" stroke="#c9ebf7" stroke-width="3" fill="none" opacity=".75" stroke-linecap="round"/>`; });
    let reeds = ''; [960, 978, 1000, 1022, 1040].forEach((x, i) => { const dx = (i - 2) * 9, top = 572 + (i % 2) * 14; reeds += `<path d="M${x} 668 q${dx * .3} -50 ${dx} ${top - 668}" stroke="#5f9a45" stroke-width="5" fill="none" stroke-linecap="round"/><g transform="translate(${x + dx},${top})">${[-60, -35, -12, 12, 35, 60].map(a => `<line x1="0" y1="0" x2="${Math.sin(a * Math.PI / 180) * 20}" y2="${-Math.cos(a * Math.PI / 180) * 20}" stroke="#8cc468" stroke-width="3" stroke-linecap="round"/>`).join('')}</g>`; });
    let bricks = ''; for(let y = 452; y < 640; y += 22) bricks += `<path d="M1242 ${y} H1498" stroke="#c28a50" stroke-width="2"/>`;
    let senet = ''; for(let i = 1; i < 10; i++) senet += `<line x1="${1852 + i * 8.8}" y1="596" x2="${1852 + i * 8.8}" y2="612" stroke="${INK}" stroke-width="1"/>`;
    let pieces = ''; for(let i = 0; i < 6; i++) pieces += `<path d="M${1858 + i * 14} 596 l5 -12 l5 12 Z" fill="${i % 2 ? '#3f6ea8' : '#fff6e0'}" stroke="${INK}" stroke-width="1.5"/>`;
    return wrap('The bank of the River Nile in Ancient Egypt: pyramids and the Sphinx far away, a shaduf, a sailing boat, papyrus reeds, a mud-brick house, a cat, a game of senet and a temple covered in hieroglyphs', `
  <defs><linearGradient id="egSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd0f0"/><stop offset="1" stop-color="#fdebbd"/></linearGradient>
  <linearGradient id="egNile" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6cc0e2"/><stop offset="1" stop-color="#3c8cba"/></linearGradient></defs>
  <rect width="2400" height="600" fill="url(#egSky)"/>
  <circle cx="2180" cy="120" r="78" fill="#ffe9a8" opacity=".6"/><circle cx="2180" cy="120" r="48" fill="#ffd66b"/>
  <g class="tm-drift" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" opacity=".6"><path d="M1300 150 q10 -10 20 0 q10 -10 20 0"/><path d="M1370 120 q8 -8 16 0 q8 -8 16 0"/><path d="M1240 110 q8 -8 16 0 q8 -8 16 0"/></g>
  <path d="M0 520 Q300 468 620 508 T1250 490 T1900 515 T2400 478 V600 H0 Z" fill="#f4e0ae"/>
  ${pyr(300, 330, 250)}${pyr(540, 250, 190)}${pyr(700, 150, 112)}
  <g id="egSphinx"><rect x="792" y="542" width="70" height="18" rx="8" fill="#ddb878" stroke="#b08a4e" stroke-width="2.5"/><path d="M846 560 V528 q0 -10 14 -10 h78 q26 0 30 42 Z" fill="#ddb878" stroke="#b08a4e" stroke-width="2.5"/><path d="M830 534 l10 -48 h36 l10 48 Z" fill="#e8c88a" stroke="#b08a4e" stroke-width="2.5"/><circle cx="858" cy="500" r="15" fill="#ddb878" stroke="#b08a4e" stroke-width="2.5"/><circle cx="853" cy="498" r="1.8" fill="#6b4a22"/><circle cx="863" cy="498" r="1.8" fill="#6b4a22"/><path d="M853 507 h10" stroke="#6b4a22" stroke-width="1.6" stroke-linecap="round"/></g>
  <rect x="0" y="560" width="2400" height="104" fill="#ecd29a"/><rect x="0" y="606" width="2400" height="42" fill="#e2c383"/>
  ${palm(170, 566, 1)}${palm(650, 562, .72)}${palm(1210, 604, 1.08)}${palm(1596, 566, .9)}${palm(1996, 604, 1.02)}
  <rect x="30" y="566" width="402" height="76" rx="8" fill="#c7dd86" stroke="#9db85a" stroke-width="2.5"/>${wheat}
  <path d="M432 626 h60" stroke="#6cc0e2" stroke-width="8" stroke-linecap="round"/>

  <rect x="0" y="660" width="2400" height="140" fill="url(#egNile)"/><path d="M0 661 H2400" stroke="#c9a868" stroke-width="6"/>${ripples}

  <g id="egShaduf"><rect x="500" y="520" width="10" height="126" fill="#8a5a2c" stroke="${INK}" stroke-width="2.5"/><rect x="532" y="520" width="10" height="126" fill="#8a5a2c" stroke="${INK}" stroke-width="2.5"/><rect x="494" y="514" width="54" height="10" rx="4" fill="#a9743f" stroke="${INK}" stroke-width="2.5"/>
    <line x1="452" y1="478" x2="616" y2="588" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><line x1="452" y1="478" x2="616" y2="588" stroke="#c99a5e" stroke-width="5" stroke-linecap="round"/>
    <circle cx="450" cy="476" r="19" fill="#9a7a56" stroke="${INK}" stroke-width="3"/><line x1="616" y1="588" x2="616" y2="664" stroke="${INK}" stroke-width="2.5"/><path d="M602 664 h28 l-4 26 h-20 Z" fill="#c9954e" stroke="${INK}" stroke-width="3"/></g>
  ${person(572, 652, .9, '#fff6e0', '#b9774a', '#1d1410')}

  <g class="tm-bob"><path d="M650 706 q20 34 60 36 h120 q40 -2 62 -40 q-24 18 -52 18 h-140 q-28 0 -50 -14 Z" fill="#b9813f" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <line x1="770" y1="724" x2="770" y2="556" stroke="${INK}" stroke-width="5"/><path d="M704 574 h132 l-8 98 h-116 Z" fill="#fff6e0" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M712 606 h118 M714 640 h114" stroke="#c4472d" stroke-width="3" opacity=".7"/>
    <line x1="698" y1="574" x2="842" y2="574" stroke="#8a5a2c" stroke-width="6" stroke-linecap="round"/><line x1="872" y1="690" x2="908" y2="764" stroke="#8a5a2c" stroke-width="6" stroke-linecap="round"/>
    <circle cx="856" cy="690" r="9" fill="#b9774a" stroke="${INK}" stroke-width="2.5"/><path d="M846 722 q10 -24 20 0 Z" fill="#fff6e0" stroke="${INK}" stroke-width="2.5"/></g>

  ${reeds}

  <g id="egScribe"><line x1="1066" y1="650" x2="1066" y2="524" stroke="#8a5a2c" stroke-width="6"/><line x1="1184" y1="650" x2="1184" y2="524" stroke="#8a5a2c" stroke-width="6"/><path d="M1054 520 h142 l-8 24 h-126 Z" fill="#fff6e0" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M1080 520 l-4 24 M1110 520 l-2 24 M1140 520 l2 24 M1170 520 l4 24" stroke="#c4472d" stroke-width="5"/>
    <ellipse cx="1125" cy="652" rx="66" ry="10" fill="#c9a25e" stroke="#a8843f" stroke-width="2"/>
    <path d="M1086 650 q39 -26 78 0 q-39 12 -78 0 Z" fill="#fff6e0" stroke="${INK}" stroke-width="3"/><path d="M1108 636 q0 -44 17 -46 q17 2 17 46 Z" fill="#b9774a" stroke="${INK}" stroke-width="3"/>
    <circle cx="1125" cy="574" r="15" fill="#b9774a" stroke="${INK}" stroke-width="3"/><path d="M1109 574 q-2 -20 16 -20 q18 0 16 20 q-16 -12 -32 0 Z" fill="#1d1410"/><circle cx="1120" cy="576" r="1.8" fill="${INK}"/><circle cx="1130" cy="576" r="1.8" fill="${INK}"/>
    <rect x="1098" y="624" width="56" height="15" rx="4" fill="#f3e2b3" stroke="${INK}" stroke-width="2.5"/><line x1="1146" y1="622" x2="1160" y2="600" stroke="#5f9a45" stroke-width="3" stroke-linecap="round"/></g>

  <g id="egHouse"><rect x="1240" y="430" width="260" height="212" fill="#d9a066" stroke="${INK}" stroke-width="3"/>${bricks}<rect x="1232" y="418" width="276" height="16" fill="#e2b077" stroke="${INK}" stroke-width="3"/>
    <path d="M1252 418 v-46 M1340 418 v-46" stroke="${INK}" stroke-width="4"/><rect x="1244" y="364" width="104" height="11" fill="#c4472d" stroke="${INK}" stroke-width="2.5"/>
    <rect x="1338" y="540" width="58" height="102" fill="#6b4226" stroke="${INK}" stroke-width="3"/><rect x="1266" y="470" width="36" height="26" fill="#5a3a22" stroke="${INK}" stroke-width="3"/><rect x="1436" y="470" width="36" height="26" fill="#5a3a22" stroke="${INK}" stroke-width="3"/>
    <path d="M1516 644 L1490 424 M1546 644 L1514 424" stroke="#8a5a2c" stroke-width="6" stroke-linecap="round"/>${[610, 570, 530, 490, 452].map((y, i) => `<line x1="${1513 - i * 4.8}" y1="${y}" x2="${1541 - i * 5.9}" y2="${y}" stroke="#8a5a2c" stroke-width="5"/>`).join('')}</g>

  <g id="egCat"><path d="M1560 644 q-8 -36 14 -42 q22 6 14 42 Z" fill="#c9954e" stroke="${INK}" stroke-width="3"/><circle cx="1574" cy="596" r="13" fill="#c9954e" stroke="${INK}" stroke-width="3"/><path d="M1563 588 l2 -13 l9 9 Z M1585 588 l-2 -13 l-9 9 Z" fill="#c9954e" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/><circle cx="1569" cy="596" r="1.9" fill="${INK}"/><circle cx="1579" cy="596" r="1.9" fill="${INK}"/><path d="M1588 642 q20 -4 15 -26" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/><path d="M1564 608 h20" stroke="#f0b913" stroke-width="3"/></g>

  <g id="egStall"><line x1="1634" y1="644" x2="1634" y2="504" stroke="#8a5a2c" stroke-width="6"/><line x1="1794" y1="644" x2="1794" y2="504" stroke="#8a5a2c" stroke-width="6"/>
    ${person(1716, 644, .84, '#fff6e0', '#a9683f', '#1d1410')}
    <path d="M1618 500 h192 l10 30 h-212 Z" fill="#fff6e0" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M1650 500 l-4 30 M1690 500 l-2 30 M1730 500 l2 30 M1770 500 l4 30" stroke="#3f6ea8" stroke-width="7"/>
    <rect x="1626" y="592" width="176" height="14" fill="#a9743f" stroke="${INK}" stroke-width="3"/><path d="M1638 606 v38 M1790 606 v38" stroke="${INK}" stroke-width="4"/>
    ${loaf(1652, 578, 13)}${loaf(1682, 578, 13)}<path d="M1706 592 q0 -20 22 -20 q22 0 22 20 Z" fill="#c9a25e" stroke="${INK}" stroke-width="2.5"/><circle cx="1720" cy="574" r="5" fill="#6b3a6b"/><circle cx="1730" cy="570" r="5" fill="#6b3a6b"/><circle cx="1738" cy="576" r="5" fill="#6b3a6b"/>
    <path d="M1758 582 q14 -10 26 0 q-12 10 -26 0 Z M1784 582 l9 -6 v12 Z" fill="#9bb7c9" stroke="${INK}" stroke-width="2"/></g>

  <g id="egSenet">${person(1822, 644, .6, '#fff6e0', '#b9774a', '#1d1410')}${person(1972, 644, .6, '#fff6e0', '#a9683f', '#1d1410')}
    <rect x="1846" y="612" width="100" height="10" fill="#8a5a2c" stroke="${INK}" stroke-width="2.5"/><path d="M1856 622 v22 M1936 622 v22" stroke="${INK}" stroke-width="4"/>
    <rect x="1852" y="596" width="88" height="16" fill="#f3e2b3" stroke="${INK}" stroke-width="2.5"/>${senet}${pieces}</g>

  <g id="egTemple"><polygon points="2010,644 2032,330 2140,330 2140,644" fill="#f0deb0" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><polygon points="2180,644 2180,330 2288,330 2310,644" fill="#f0deb0" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <rect x="2024" y="314" width="124" height="18" fill="#e6d2a0" stroke="${INK}" stroke-width="3"/><rect x="2172" y="314" width="124" height="18" fill="#e6d2a0" stroke="${INK}" stroke-width="3"/>
    <rect x="2140" y="450" width="40" height="194" fill="#5a4630"/><rect x="2132" y="430" width="56" height="22" fill="#e6d2a0" stroke="${INK}" stroke-width="3"/><circle cx="2160" cy="441" r="7" fill="#e7b43a" stroke="${INK}" stroke-width="2"/>
    ${glyphs(2046, 356, 4, 4, 0)}${glyphs(2192, 356, 4, 4, 3)}
    <path d="M2018 560 H2140 M2180 560 H2302" stroke="#c4472d" stroke-width="6"/><path d="M2016 578 H2140 M2180 578 H2304" stroke="#3f6ea8" stroke-width="6"/>
    <line x1="1990" y1="644" x2="1990" y2="250" stroke="#8a5a2c" stroke-width="6"/><path class="tm-sway" d="M1990 252 h46 l-12 9 l12 9 h-46 Z" fill="#c4472d" stroke="${INK}" stroke-width="2"/>
    <polygon points="2338,644 2344,300 2358,300 2364,644" fill="#eccd90" stroke="${INK}" stroke-width="3"/><polygon points="2344,300 2351,276 2358,300" fill="#f0b913" stroke="${INK}" stroke-width="2.5"/></g>`);
  }

  X.add({ id:'egypt', door:'past', e:'🐫', n:'Ancient Egypt', when:'About 3,300 years ago', stamp:'KEMET', where:'the picture', next:'Next along the river ➡️',
    aria:'The bank of the River Nile in Ancient Egypt',
    hello:{ h:'Welcome to the River Nile!', t:'This is Egypt about 3,300 years ago. Almost everyone lives close to the river. Tap a glowing circle to look closer, and use the arrows to walk along the bank.' },
    scene:egypt,
    spots:[
      { id:'pyramids', snd:'wind', x:300, y:400, e:'🔺', n:'The pyramids', t:'Far away you can see the pyramids. They were built for the pharaohs, the kings of Egypt. They are already more than 1,000 years old!', k:'The biggest is the Great Pyramid. It is made from more than two million blocks of stone.' },
      { id:'shaduf', snd:'splash', x:520, y:470, e:'🪣', n:'The shaduf', t:'This is a shaduf. The farmer pulls the bucket down into the river. The heavy weight on the other end helps to lift the water up.', k:'Farmers use it to water their fields.' },
      { id:'boat', snd:'stream', x:770, y:626, e:'⛵', n:'The sailing boat', t:'Boats are the best way to travel in Egypt. The Nile is like a long, watery road.', k:'The wind blows boats up the river, and the flowing water carries them back down.' },
      { id:'sphinx', snd:'chisel', x:915, y:470, e:'🦁', n:'The Sphinx', t:'This giant statue is the Sphinx. It has the body of a lion and the head of a person.', k:'It was carved out of one enormous rock.' },
      { id:'papyrus', snd:'scratch', x:1000, y:596, e:'🌿', n:'The papyrus reeds', t:'These tall reeds are papyrus. Egyptians press strips of it together to make sheets for writing on.', k:'Our word “paper” comes from “papyrus”.' },
      { id:'house', snd:'steps', x:1372, y:486, e:'🧱', n:'The mud-brick house', t:'Houses are built from mud bricks. People mix river mud with straw, shape the bricks and leave them to dry in the sun.', k:'On hot nights, families often sleep up on the flat roof.' },
      { id:'cat', snd:'purr', x:1586, y:560, e:'🐈', n:'The cat', t:'Egyptians love cats. Cats keep mice and snakes away from the grain.', k:'One goddess, Bastet, is shown with the head of a cat.' },
      { id:'senet', snd:'tink', x:1896, y:556, e:'🎲', n:'The game of senet', t:'This board game is called senet. Two players race their pieces along thirty squares.', k:'Players throw flat sticks, not dice, to see how far to move.' },
      { id:'hiero', snd:'harp', x:2086, y:420, e:'𓂀', n:'The hieroglyphs', t:'This temple wall is covered in hieroglyphs. That is Egyptian picture-writing. Each little picture stands for a sound or a word.', k:'There are more than 700 different signs to learn!' }
    ],
    find:['cat', 'boat', 'senet'],
    sort:{ h:'Then or not yet?', ask:'Which things did the Egyptians have?', a:['🐫 The Egyptians had it', 'about 3,300 years ago'], b:['⏳ Not invented yet', 'it came much later'], items:[
      { id:'bread', e:'🍞', n:'bread', a:true, tip:'Egyptians baked bread every day.' },
      { id:'coins', e:'🪙', n:'coins', a:false, tip:'No coins yet! People swapped things, like grain for fish.' },
      { id:'boats', e:'⛵', n:'sailing boats', a:true, tip:'Boats sailed up and down the Nile.' },
      { id:'bike', e:'🚲', n:'a bicycle', a:false, tip:'Bicycles were invented about 200 years ago.' },
      { id:'games', e:'🎲', n:'board games', a:true, tip:'Egyptians played senet and other board games.' },
      { id:'book', e:'📖', n:'a book with pages', a:false, tip:'Books with pages came much later. Egyptians rolled their writing into scrolls.' },
      { id:'scroll', e:'📜', n:'scrolls', a:true, tip:'Scribes wrote on long scrolls of papyrus.' },
      { id:'fridge', e:'🧊', n:'a fridge', a:false, tip:'No fridges! Food was dried or salted to keep it good to eat.' }
    ] },
    match:{ h:'What is it for?', ask:'Match each Egyptian thing to its job.', pick:'Tap an Egyptian thing, then tap its job.', items:[
      { id:'shaduf', e:'🪣', n:'a shaduf', use:'lifting water from the river' },
      { id:'papyrus', e:'🌿', n:'papyrus', use:'making sheets to write on' },
      { id:'bricks', e:'🧱', n:'mud bricks', use:'building houses' },
      { id:'boat', e:'⛵', n:'a boat', use:'travelling along the Nile' }
    ] },
    who:{ n:'Nakht', voice:'m', role:'an Egyptian scribe', at:[1125, 470], spot:'papyrus', hello:{ h:'Welcome, friend!', t:'I am Nakht, a scribe. Tap a question and I will tell you about my life beside the river.' },
      note:'Nakht is a made-up scribe. His answers come from what we know about life in Ancient Egypt.',
      face:face({ alt:'Nakht, an Egyptian scribe', top:'#fff6e0', skin:'#b9774a', hair:`<path d="M22 66 q-6 -58 38 -60 q44 2 38 60 l-10 0 q4 -38 -28 -40 q-32 2 -28 40 Z" fill="#1d1410" stroke="${INK}" stroke-width="3"/>`, extra:`<path d="M34 100 q26 16 52 0" fill="none" stroke="#3f6ea8" stroke-width="7"/><path d="M36 108 q24 14 48 0" fill="none" stroke="#e7b43a" stroke-width="5"/>` }),
      qs:[
        { id:'job', q:'What is your job?', a:'I am a scribe. I write things down for people: letters, lists, and how much grain is in the store. Not many people can read and write, so it is an important job.' },
        { id:'learn', q:'How did you learn to write?', a:'I went to scribe school when I was a boy. It took years! We practised on broken bits of pot, because papyrus is too precious to waste.' },
        { id:'pen', q:'What do you write with?', a:'A pen made from a reed, and two colours of ink. The black ink is made from soot, and the red ink from a red earth called ochre.' },
        { id:'eat', q:'What do you eat?', a:'Bread every day, with onions, beans, figs and dates. And fresh fish from the river.' },
        { id:'river', q:'Why is the river so important?', a:'Every year the Nile floods and leaves rich, dark mud on the fields. That mud helps our wheat to grow. We call our country Kemet, the black land, after that dark mud.' },
        { id:'fun', q:'What do you do for fun?', a:'I play senet with my friends. The children here love ball games, swimming and playing with their wooden toys.' },
        { id:'hot', q:'How do you keep cool?', a:'We wear light clothes made of linen, and we rest in the shade at the hottest time of the day.' }
      ] },
    teach:[
      '<b>Curriculum.</b> Supports KS2 history: the achievements of the earliest civilizations, with Ancient Egypt as the depth study. Check the wording against the National Curriculum programme of study.',
      '<b>Kept gentle.</b> This riverbank does not say that pyramids were tombs, and it leaves out mummies, the afterlife and who did the building work. Those are central to most Egypt units, so plan them as teacher-led, with a gentler path for any child who needs one.',
      '<b>When is this?</b> The scene is set in the New Kingdom, about 1300 BC. The pyramids at Giza were built about 1,200 years earlier.'
    ],
    packs:[{ id:'history-flightpath-y34', step:2, label:'History flightpath: Ancient Egypt' }],
    real:[]
  });

  /* =====================================================================
     THE VICTORIANS: a British street in 1897
     ===================================================================== */
  function victorian(){
    let arches = '<g opacity=".95"><rect x="430" y="270" width="1130" height="26" fill="#cfae98" stroke="#8f6f5c" stroke-width="2.5"/>';
    for(let x = 430; x < 1560; x += 113){ arches += `<rect x="${x}" y="296" width="30" height="308" fill="#c39a80" stroke="#8f6f5c" stroke-width="2.5"/>`; if(x + 113 < 1560) arches += `<path d="M${x + 30} 296 H${x + 113} V342 A41.5 41.5 0 0 0 ${x + 30} 342 Z" fill="#cfae98" stroke="#8f6f5c" stroke-width="2.5"/>`; }
    arches += '</g>';
    let train = '';
    for(let k = 0; k < 3; k++){ const x = 934 + k * 150; train += `<rect x="${x}" y="224" width="140" height="42" rx="6" fill="#7a2f2f" stroke="${INK}" stroke-width="3"/>${[0, 1, 2, 3].map(i => `<rect x="${x + 12 + i * 31}" y="233" width="22" height="16" rx="2" fill="#ffe9a8" stroke="${INK}" stroke-width="2"/>`).join('')}<circle cx="${x + 28}" cy="268" r="9" fill="#3a3f46" stroke="${INK}" stroke-width="2.5"/><circle cx="${x + 112}" cy="268" r="9" fill="#3a3f46" stroke="${INK}" stroke-width="2.5"/>`; }
    train += `<rect x="772" y="232" width="112" height="32" rx="14" fill="#2f6b3a" stroke="${INK}" stroke-width="3"/><rect x="872" y="212" width="48" height="54" rx="4" fill="#2f6b3a" stroke="${INK}" stroke-width="3"/><rect x="884" y="222" width="24" height="18" rx="2" fill="#ffe9a8" stroke="${INK}" stroke-width="2"/>
      <rect x="788" y="204" width="17" height="30" fill="#2b1a12"/><rect x="784" y="200" width="25" height="8" rx="2" fill="#2b1a12"/><circle cx="834" cy="232" r="10" fill="#f0b913" stroke="${INK}" stroke-width="2.5"/>
      ${[794, 830, 866].map(x => `<circle cx="${x}" cy="264" r="14" fill="#c4472d" stroke="${INK}" stroke-width="3"/><circle cx="${x}" cy="264" r="3" fill="${INK}"/>`).join('')}<path d="M794 264 H866" stroke="${INK}" stroke-width="4"/><path d="M772 262 l-16 6 h16 Z" fill="#c4472d" stroke="${INK}" stroke-width="2.5"/>
      <g fill="#fff" opacity=".85"><circle class="tm-smoke" cx="797" cy="186" r="12"/><circle class="tm-smoke" style="animation-delay:-1.1s" cx="812" cy="160" r="16"/><circle class="tm-smoke" style="animation-delay:-2.2s" cx="834" cy="132" r="20"/></g>`;
    const sash = (x, y, w, hh) => `<rect x="${x}" y="${y}" width="${w}" height="${hh}" fill="#dff0fa" stroke="#fff6e0" stroke-width="5"/><path d="M${x} ${y + hh / 2} h${w} M${x + w / 2} ${y} v${hh}" stroke="#fff6e0" stroke-width="3"/><rect x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${hh + 6}" fill="none" stroke="${INK}" stroke-width="2.5"/>`;
    let terrace = `<rect x="944" y="300" width="432" height="62" fill="#5d6470" stroke="${INK}" stroke-width="3"/><path d="M944 320 H1376 M944 341 H1376" stroke="#474d57" stroke-width="2"/>`;
    ['#2f5a8a', '#3f6a3a', '#7a2f2f'].forEach((door, i) => { const x = 950 + i * 140;
      terrace += `<rect x="${x}" y="360" width="140" height="244" fill="url(#vcBrick)" stroke="${INK}" stroke-width="3"/>${sash(x + 18, 388, 38, 56)}${sash(x + 84, 388, 38, 56)}${sash(x + 16, 492, 48, 66)}
        <rect x="${x + 84}" y="496" width="42" height="100" fill="${door}" stroke="${INK}" stroke-width="3"/><path d="M${x + 84} 496 a21 16 0 0 1 42 0" fill="#dff0fa" stroke="${INK}" stroke-width="3"/><circle cx="${x + 118}" cy="552" r="3.5" fill="#f0b913"/><rect x="${x + 78}" y="596" width="54" height="10" fill="#e3d8c0" stroke="${INK}" stroke-width="2.5"/>
        <rect x="${x + 52}" y="252" width="36" height="52" fill="#a9553c" stroke="${INK}" stroke-width="3"/><rect x="${x + 56}" y="238" width="12" height="16" fill="#d9703a" stroke="${INK}" stroke-width="2.5"/><rect x="${x + 72}" y="238" width="12" height="16" fill="#d9703a" stroke="${INK}" stroke-width="2.5"/>
        <circle class="tm-smoke" style="animation-delay:-${i * 1.1}s" cx="${x + 66}" cy="220" r="11" fill="#fff" opacity=".7"/>`; });
    let jars = ''; const JC = ['#e85d2f', '#f0b913', '#7fbf5f', '#c8102e', '#8a5ad6', '#f7b6c8'];
    for(let r = 0; r < 2; r++) for(let c = 0; c < 6; c++){ const x = 1534 + c * 30, y = 492 + r * 46; jars += `<rect x="${x}" y="${y + 6}" width="22" height="28" rx="5" fill="${JC[(c + r * 2) % 6]}" stroke="${INK}" stroke-width="2"/><rect x="${x + 3}" y="${y}" width="16" height="7" rx="2" fill="#3a3f46"/>`; }
    jars += `<path d="M1522 534 H1718 M1522 580 H1718" stroke="#8a5a2c" stroke-width="4"/>`;
    let spokes = ''; for(let i = 0; i < 12; i++){ const a = i * Math.PI / 6; spokes += `<line x1="1985" y1="588" x2="${(1985 + Math.cos(a) * 58).toFixed(1)}" y2="${(588 + Math.sin(a) * 58).toFixed(1)}" stroke="${INK}" stroke-width="1.5"/>`; }
    let bunting = ''; for(let i = 0; i < 16; i++){ const x = 1906 + i * 30, y = 318 + Math.sin(i / 15 * Math.PI) * 26; bunting += `<path d="M${x} ${y.toFixed(1)} l12 26 l12 -26 Z" fill="${['#c8102e', '#fff6e0', '#2f5a8a'][i % 3]}" stroke="${INK}" stroke-width="2"/>`; }
    let flags = ''; for(let x = 80; x < 2400; x += 80) flags += `<path d="M${x} 604 v50" stroke="#aaa294" stroke-width="2"/>`;
    return wrap('A British street in Victorian times: a school with a bell, a gas lamp, a child with a hoop, a water pump, a row of houses, a red pillar box, a sweet shop, a penny-farthing bicycle and a steam train on a bridge', `
  <defs><linearGradient id="vcSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b6d2e6"/><stop offset="1" stop-color="#f6ecd9"/></linearGradient>
  <pattern id="vcBrick" width="40" height="20" patternUnits="userSpaceOnUse"><rect width="40" height="20" fill="#b9583f"/><path d="M0 10 H40 M0 20 H40 M20 0 V10 M0 10 V20 M40 10 V20" stroke="#8f3f2c" stroke-width="1.5" opacity=".6"/></pattern>
  <pattern id="vcSett" width="64" height="36" patternUnits="userSpaceOnUse"><rect width="64" height="36" fill="#8f8a82"/><path d="M0 18 H64 M0 36 H64 M32 0 V18 M0 18 V36 M64 18 V36" stroke="#6f6a63" stroke-width="3" opacity=".7"/></pattern></defs>
  <rect width="2400" height="620" fill="url(#vcSky)"/>
  <g class="tm-drift" fill="#fff" opacity=".85"><ellipse cx="300" cy="110" rx="100" ry="26"/><ellipse cx="370" cy="92" rx="60" ry="22"/><ellipse cx="1750" cy="130" rx="110" ry="28"/><ellipse cx="1830" cy="110" rx="60" ry="22"/><ellipse cx="2240" cy="90" rx="70" ry="20"/></g>
  <path d="M0 540 Q300 500 600 530 T1300 520 T2000 530 T2400 510 V620 H0 Z" fill="#cdd9cf"/>
  ${[[1640, 180], [1730, 230], [2330, 200], [40, 220]].map(([x, top], i) => `<rect x="${x}" y="${top}" width="22" height="${604 - top}" fill="#a98576" stroke="#8f6f5c" stroke-width="2"/><rect x="${x - 4}" y="${top - 8}" width="30" height="10" fill="#8f6f5c"/><circle class="tm-smoke" style="animation-delay:-${i * .8}s" cx="${x + 11}" cy="${top - 26}" r="16" fill="#d9d9d9" opacity=".8"/>`).join('')}
  ${arches}<g id="vcTrain">${train}</g>

  <g id="vcSchool"><polygon points="64,332 516,332 470,262 110,262" fill="#5d6470" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <rect x="80" y="330" width="420" height="274" fill="url(#vcBrick)" stroke="${INK}" stroke-width="3"/>
    <rect x="262" y="196" width="56" height="70" fill="#b9583f" stroke="${INK}" stroke-width="3"/><path d="M272 264 V228 a18 18 0 0 1 36 0 V264 Z" fill="#f6ecd9" stroke="${INK}" stroke-width="2.5"/>
    <g class="tm-sway"><path d="M279 254 q0 -24 11 -24 q11 0 11 24 Z" fill="#f0b913" stroke="${INK}" stroke-width="2.5"/><circle cx="290" cy="258" r="4" fill="${INK}"/></g>
    <polygon points="254,196 326,196 290,158" fill="#5d6470" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <rect x="186" y="344" width="208" height="36" rx="4" fill="#f7ecd4" stroke="${INK}" stroke-width="3"/><text x="290" y="369" text-anchor="middle" ${F} font-size="22" fill="${INK}" letter-spacing="2">BOARD SCHOOL</text>
    ${[108, 396].map(x => `<path d="M${x} 540 V430 a34 34 0 0 1 68 0 V540 Z" fill="#dff0fa" stroke="#fff6e0" stroke-width="6"/><path d="M${x + 34} 398 V540 M${x} 470 h68" stroke="#fff6e0" stroke-width="4"/><path d="M${x - 3} 543 V430 a37 37 0 0 1 74 0 V543 Z" fill="none" stroke="${INK}" stroke-width="2.5"/>`).join('')}
    <path d="M256 604 V468 a34 34 0 0 1 68 0 V604 Z" fill="#3f5a3a" stroke="${INK}" stroke-width="3"/><path d="M290 436 V604" stroke="${INK}" stroke-width="2.5"/><circle cx="282" cy="530" r="4" fill="#f0b913"/>
    <rect x="262" y="398" width="56" height="22" rx="3" fill="#f7ecd4" stroke="${INK}" stroke-width="2.5"/><text x="290" y="415" text-anchor="middle" ${F} font-size="14" fill="${INK}">1885</text></g>


  <rect x="0" y="602" width="2400" height="56" fill="#d3ccbe"/>${flags}<rect x="0" y="652" width="2400" height="10" fill="#a9a294"/>
  <rect x="0" y="662" width="2400" height="138" fill="url(#vcSett)"/>
  <g id="vcSlate"><rect x="96" y="622" width="120" height="10" fill="#8a5a2c" stroke="${INK}" stroke-width="2.5"/><path d="M106 632 v20 M206 632 v20" stroke="${INK}" stroke-width="4"/>
    <g transform="rotate(-8 156 590)"><rect x="118" y="556" width="78" height="62" rx="3" fill="#3a3f46" stroke="#a9743f" stroke-width="7"/><text x="157" y="596" text-anchor="middle" font-family="Georgia, serif" font-size="19" fill="#f4f4f4">2×4=8</text></g><line x1="202" y1="618" x2="222" y2="612" stroke="#d9d9d9" stroke-width="4" stroke-linecap="round"/></g>

  ${person(400, 650, .86, '#5a6fa8', '#f1c9a5', '#8a5a2c', `<path d="M-11 -66 h22 l5 54 h-32 Z" fill="#fff" stroke="${INK}" stroke-width="2"/><path d="M-15 -90 q-8 16 -3 30 M15 -90 q8 16 3 30" stroke="#8a5a2c" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="-17" cy="-62" r="4" fill="#c8102e"/><circle cx="17" cy="-62" r="4" fill="#c8102e"/>`)}

  <g id="vcLamp"><circle cx="590" cy="408" r="44" fill="#ffe9a8" opacity=".4"/><rect x="585" y="430" width="10" height="220" fill="#2f3a36" stroke="${INK}" stroke-width="2"/><rect x="576" y="632" width="28" height="20" rx="3" fill="#2f3a36" stroke="${INK}" stroke-width="2"/><line x1="568" y1="448" x2="612" y2="448" stroke="#2f3a36" stroke-width="6" stroke-linecap="round"/>
    <path d="M571 430 l9 -46 h20 l9 46 Z" fill="#fff3c4" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M575 384 h30 l-15 -18 Z" fill="#2f3a36" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/><path class="tm-flame" d="M590 426 q-8 -13 0 -26 q8 13 0 26 Z" fill="#ff9a3c" stroke="#e25c12" stroke-width="1.5"/></g>

  <g id="vcHoop">${person(690, 650, .74, '#7a5a3a', '#e8b98f', '#3a2414', `<path d="M-18 -106 q18 -14 36 0 l8 2 h-52 Z" fill="#4a4f58" stroke="${INK}" stroke-width="2.5"/>`)}<circle cx="752" cy="614" r="34" fill="none" stroke="${INK}" stroke-width="8"/><circle cx="752" cy="614" r="34" fill="none" stroke="#b9813f" stroke-width="4"/><line x1="702" y1="600" x2="742" y2="606" stroke="#8a5a2c" stroke-width="5" stroke-linecap="round"/></g>

  <g id="vcPump"><rect x="812" y="636" width="96" height="16" rx="3" fill="#b9b0a0" stroke="${INK}" stroke-width="3"/><rect x="850" y="540" width="24" height="100" rx="4" fill="#3d5a50" stroke="${INK}" stroke-width="3"/><circle cx="862" cy="536" r="14" fill="#3d5a50" stroke="${INK}" stroke-width="3"/>
    <path d="M864 548 q42 -8 54 40" stroke="${INK}" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M850 580 h-20 v10" stroke="${INK}" stroke-width="12" fill="none"/><path d="M850 580 h-20 v10" stroke="#3d5a50" stroke-width="7" fill="none"/>
    <path class="tm-flow" d="M830 592 v26" stroke="#7cc7ea" stroke-width="5"/><path d="M814 640 l5 -26 h24 l5 26 Z" fill="#c9c2b2" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/></g>

  <g id="vcTerrace">${terrace}</g>

  <g id="vcPost"><rect x="1400" y="634" width="52" height="18" rx="3" fill="#2b1a12"/><rect x="1404" y="522" width="44" height="116" fill="#c8102e" stroke="${INK}" stroke-width="3"/><path d="M1398 524 q28 -26 56 0 Z" fill="#c8102e" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><rect x="1412" y="544" width="28" height="7" rx="2" fill="#2b1a12"/><text x="1426" y="596" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="21" fill="#f0b913">VR</text></g>

  <g id="vcShop"><rect x="1494" y="250" width="412" height="56" fill="#5d6470" stroke="${INK}" stroke-width="3"/><rect x="1500" y="304" width="400" height="300" fill="#d8bfa6" stroke="${INK}" stroke-width="3"/>
    ${sash(1540, 330, 46, 66)}${sash(1677, 330, 46, 66)}${sash(1814, 330, 46, 66)}
    <rect x="1494" y="420" width="412" height="48" fill="#1f4d3a" stroke="${INK}" stroke-width="3"/><text x="1700" y="454" text-anchor="middle" ${F} font-size="27" fill="#f6e3a8" letter-spacing="2">J. GREEN · SWEETS</text>
    <rect x="1500" y="468" width="400" height="136" fill="#1f4d3a" stroke="${INK}" stroke-width="3"/>
    <rect x="1520" y="482" width="200" height="104" fill="#eaf6fb" stroke="${INK}" stroke-width="3"/>${jars}
    <rect x="1744" y="482" width="58" height="122" fill="#2c6a50" stroke="${INK}" stroke-width="3"/><rect x="1753" y="492" width="40" height="52" fill="#eaf6fb" stroke="${INK}" stroke-width="2.5"/><circle cx="1794" cy="556" r="3.5" fill="#f0b913"/><circle cx="1773" cy="476" r="7" fill="#f0b913" stroke="${INK}" stroke-width="2.5"/>
    <rect x="1822" y="482" width="60" height="104" fill="#eaf6fb" stroke="${INK}" stroke-width="3"/><rect x="1830" y="492" width="44" height="30" fill="#f7ecd4" stroke="${INK}" stroke-width="2"/><text x="1852" y="512" text-anchor="middle" ${F} font-size="12" fill="${INK}">1d a bag</text><rect x="1830" y="532" width="44" height="42" fill="#f7b6c8" stroke="${INK}" stroke-width="2"/></g>

  <g id="vcBike"><circle cx="1985" cy="588" r="58" fill="none" stroke="${INK}" stroke-width="6"/>${spokes}<circle cx="1985" cy="588" r="6" fill="${INK}"/><circle cx="2076" cy="630" r="18" fill="none" stroke="${INK}" stroke-width="5"/><circle cx="2076" cy="630" r="3" fill="${INK}"/>
    <path d="M1985 588 V516 M1985 532 q64 4 91 98" stroke="${INK}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M1963 512 h44" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M1998 526 h34" stroke="#8a5a2c" stroke-width="9" stroke-linecap="round"/><path d="M1985 588 l16 22 h12" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/></g>

  <g id="vcJubilee"><line x1="2130" y1="652" x2="2130" y2="330" stroke="#8a5a2c" stroke-width="6"/><line x1="2370" y1="652" x2="2370" y2="330" stroke="#8a5a2c" stroke-width="6"/>${bunting}
    <rect x="2140" y="372" width="220" height="62" rx="4" fill="#fff6e0" stroke="${INK}" stroke-width="3"/><text x="2250" y="398" text-anchor="middle" ${F} font-size="20" fill="#c8102e" letter-spacing="1">60 YEARS</text><text x="2250" y="422" text-anchor="middle" ${F} font-size="20" fill="#2f5a8a" letter-spacing="1">OUR QUEEN</text>
    <rect x="2244" y="540" width="14" height="66" fill="#8a5a2c" stroke="${INK}" stroke-width="2.5"/><circle cx="2250" cy="500" r="56" fill="#5f8f4a" stroke="#3f6a35" stroke-width="3"/><circle cx="2214" cy="524" r="30" fill="#5f8f4a" stroke="#3f6a35" stroke-width="3"/><circle cx="2288" cy="524" r="30" fill="#5f8f4a" stroke="#3f6a35" stroke-width="3"/>
    <rect x="2180" y="618" width="140" height="10" fill="#3d5a50" stroke="${INK}" stroke-width="2.5"/><path d="M2192 628 v24 M2308 628 v24 M2180 618 v-22 h140 v22" stroke="${INK}" stroke-width="3" fill="none"/></g>`);
  }

  X.add({ id:'victorian', door:'past', e:'🎩', n:'The Victorians', when:'About 130 years ago', stamp:'V · R', where:'the street', next:'Next along the street ➡️',
    aria:'A British street in Victorian times',
    hello:{ h:'Welcome to a Victorian street!', t:'This is Britain in 1897. Victoria has been queen for sixty years, so people living now are called Victorians. Tap a glowing circle to look closer.' },
    scene:victorian,
    spots:[
      { id:'slate', snd:'scratch', x:250, y:570, e:'✏️', n:'The slate', t:'Children write on a slate with a slate pencil. When the slate is full, they wipe it clean and start again.', k:'Paper costs too much to use for everyday work.' },
      { id:'bell', snd:'bell', x:345, y:222, e:'🔔', n:'The school bell', t:'This is the school bell. When it rings, the children line up in the yard, ready to go in.', k:'In 1880 a new law said every child aged five to ten must go to school.' },
      { id:'lamp', snd:'gas', x:590, y:506, e:'🏮', n:'The gas lamp', t:'Street lamps burn gas. Every evening a lamplighter walks along with a long pole to light each one.', k:'In the morning he comes back to put them out.' },
      { id:'hoop', snd:'hoop', x:770, y:548, e:'⭕', n:'The hoop and stick', t:'This is a hoop and stick. Children run along the street, tapping the hoop to keep it rolling.', k:'Other favourite games are marbles, skipping and hopscotch.' },
      { id:'train', snd:'train', x:712, y:226, e:'🚂', n:'The steam train', t:'Steam trains have changed everything. People can travel across the country in hours, not days.', k:'Trains even bring fresh milk and fish into the towns each morning.' },
      { id:'pump', snd:'pump', x:912, y:500, e:'🚰', n:'The water pump', t:'Many homes have no taps. Families carry water home in buckets from a pump in the street.', k:'More and more houses are having water pipes put in.' },
      { id:'post', snd:'post', x:1426, y:470, e:'📮', n:'The pillar box', t:'This is a pillar box for posting letters. The letters VR stand for Victoria Regina. Regina means queen.', k:'The first stick-on stamp in the world was the Penny Black, in 1840. It cost one penny.' },
      { id:'shop', snd:'shop', x:1773, y:556, e:'🍬', n:'The sweet shop', t:'The corner shop sells sweets from big glass jars. The shopkeeper weighs them on scales and tips them into a paper bag.', k:'Humbugs, pear drops and liquorice are favourites.' },
      { id:'bike', snd:'bike', x:2046, y:514, e:'🚲', n:'The penny-farthing', t:'This bicycle is a penny-farthing. The front wheel is huge and the back wheel is tiny.', k:'It is named after two coins: the big penny and the little farthing.' }
    ],
    find:['slate', 'bike', 'lamp'],
    sort:{ h:'Then or not yet?', ask:'Which things did the Victorians have?', a:['🎩 The Victorians had it', 'by the end of Victoria’s time'], b:['⏳ Not invented yet', 'it came later'], items:[
      { id:'train', e:'🚂', n:'steam trains', a:true, tip:'Victorians built railways all over Britain.' },
      { id:'tv', e:'📺', n:'television', a:false, tip:'Television came about thirty years after Victorian times.' },
      { id:'stamp', e:'✉️', n:'postage stamps', a:true, tip:'The Penny Black was the first stamp, in 1840.' },
      { id:'plane', e:'✈️', n:'aeroplanes', a:false, tip:'The first aeroplane flew in 1903, just after Queen Victoria’s time.' },
      { id:'camera', e:'📷', n:'cameras', a:true, tip:'Victorians loved photographs. You had to keep very still!' },
      { id:'computer', e:'💻', n:'computers', a:false, tip:'Computers like ours came many years later.' },
      { id:'phone', e:'☎️', n:'the telephone', a:true, tip:'The telephone was invented in 1876. Only a few people had one.' },
      { id:'biro', e:'🖊️', n:'ballpoint pens', a:false, tip:'Not yet! Victorians dipped their pens in ink.' }
    ] },
    match:{ h:'What is it for?', ask:'Match each Victorian thing to its job.', pick:'Tap a Victorian thing, then tap its job.', items:[
      { id:'slate', e:'✏️', n:'a slate', use:'writing in class' },
      { id:'lamp', e:'🏮', n:'a gas lamp', use:'lighting the street' },
      { id:'pump', e:'🚰', n:'the pump', use:'fetching water' },
      { id:'post', e:'📮', n:'a pillar box', use:'posting letters' }
    ] },
    who:{ n:'Ada', voice:'g', role:'a Victorian schoolgirl', at:[400, 506], spot:'slate', hello:{ h:'Good morning!', t:'I’m Ada and I’m nine. Tap a question and I’ll tell you about my school and my street.' },
      note:'Ada is a made-up schoolgirl. Her answers come from what we know about Victorian childhood.',
      face:face({ alt:'Ada, a Victorian schoolgirl', top:'#5a6fa8', skin:'#f1c9a5', hair:`<path d="M26 56 q0 -48 34 -48 q34 0 34 48 q-12 -24 -34 -24 q-22 0 -34 24 Z" fill="#8a5a2c" stroke="${INK}" stroke-width="3"/><path d="M27 60 q-10 24 -3 44 M93 60 q10 24 3 44" stroke="#8a5a2c" stroke-width="10" fill="none" stroke-linecap="round"/><circle cx="23" cy="104" r="6" fill="#c8102e" stroke="${INK}" stroke-width="2"/><circle cx="97" cy="104" r="6" fill="#c8102e" stroke="${INK}" stroke-width="2"/>`, extra:`<path d="M42 102 h36 v28 h-36 Z" fill="#fff" stroke="${INK}" stroke-width="3"/>` }),
      qs:[
        { id:'school', q:'What is school like?', a:'There are sixty children in my class! We sit in rows and chant our times tables together. We learn the three Rs: reading, writing and arithmetic.' },
        { id:'write', q:'What do you write with?', a:'A slate and a slate pencil. The older children use a pen that they dip in an inkwell. You have to be careful not to make blots!' },
        { id:'games', q:'What games do you play?', a:'Hoop and stick, marbles, skipping and hopscotch. We play out in the street. There are horses and carts, but hardly any motor cars.' },
        { id:'home', q:'Where do you live?', a:'In a little house in a long row called a terrace. A coal fire keeps us warm, and we fetch our water from the pump.' },
        { id:'eat', q:'What do you eat?', a:'Bread and butter, porridge, and stew with potatoes. On Saturdays, if I have a farthing, I buy sweets from the corner shop!' },
        { id:'light', q:'How do you see when it is dark?', a:'We have candles and an oil lamp at home. Outside, the lamplighter lights the gas lamps in the street.' },
        { id:'queen', q:'Who is the queen?', a:'Queen Victoria! She has been queen for sixty years. That is why people call us Victorians. Her picture is on every stamp and every coin.' }
      ] },
    teach:[
      '<b>Curriculum.</b> Supports KS2 history: a study of an aspect or theme in British history beyond 1066, and local history. At KS1 it links to changes in national life and significant individuals such as Queen Victoria. Check the wording against the National Curriculum programme of study.',
      '<b>Kept gentle.</b> This street leaves out child labour, workhouses, the cane and the dunce’s cap, illness and how poor many families were. Plan those as teacher-led topics, with a gentler path for any child who needs one.',
      '<b>When is this?</b> The street is set in 1897, the year of Queen Victoria’s Diamond Jubilee. She reigned from 1837 to 1901.'
    ],
    packs:[{ id:'topic-flightpath-explorers-y34', step:5, label:'Explorers flightpath: Victorian Britain' }, { id:'christmas-flightpath', step:6, label:'Christmas flightpath: Dickens and Victorian London' }],
    real:[]
  });

  /* =====================================================================
     THE SPACE STATION: right now, about 400 km above the Earth
     ===================================================================== */
  function space(){
    let sd = 11; const R = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
    let stars = ''; for(let i = 0; i < 110; i++){ const x = R() * 2400, y = R() * 600, r = .8 + R() * 2.2, tw = R() < .3; stars += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}" fill="#fff" ${tw ? `class="tm-twinkle" style="animation-delay:-${(R() * 2.6).toFixed(1)}s"` : 'opacity=".8"'}/>`; }
    const wing = x => { let s = ''; [[70, 150], [276, 150]].forEach(([y, hh]) => { s += `<rect x="${x}" y="${y}" width="190" height="${hh}" fill="#27509a" stroke="#f0b913" stroke-width="4"/>`; for(let i = 1; i < 5; i++) s += `<line x1="${x + i * 38}" y1="${y}" x2="${x + i * 38}" y2="${y + hh}" stroke="#f0b913" stroke-width="1.5" opacity=".8"/>`; for(let j = 1; j < 4; j++) s += `<line x1="${x}" y1="${y + j * hh / 4}" x2="${x + 190}" y2="${y + j * hh / 4}" stroke="#7fa3e0" stroke-width="1.5" opacity=".7"/>`; }); return s + `<rect x="${x + 88}" y="220" width="14" height="56" fill="#b8bec9" stroke="${INK}" stroke-width="2.5"/>`; };
    let truss = `<rect x="240" y="236" width="1920" height="24" fill="#c6ccd6" stroke="${INK}" stroke-width="3"/>`; for(let x = 240; x < 2160; x += 48) truss += `<path d="M${x} 236 l24 24 l24 -24" stroke="#8d95a3" stroke-width="2" fill="none"/>`;
    const mod = (x, w, fill) => `<rect x="${x}" y="310" width="${w}" height="190" rx="28" fill="#dfe3ea" stroke="${INK}" stroke-width="4"/><rect x="${x + 12}" y="322" width="${w - 24}" height="166" rx="18" fill="${fill || '#f6f1e7'}" stroke="#b8bec9" stroke-width="2"/><rect x="${x + w / 2 - 7}" y="260" width="14" height="50" fill="#b8bec9" stroke="${INK}" stroke-width="2.5"/>`;
    const collar = x => `<rect x="${x}" y="360" width="16" height="90" fill="#9aa3b2" stroke="${INK}" stroke-width="3"/>`;
    const land = '<path d="M250 800 q60 -92 230 -86 q150 6 210 86 Z M850 800 q40 -124 270 -134 q190 -6 310 42 q90 40 130 92 Z M1650 800 q70 -104 250 -98 q170 6 310 98 Z" fill="#5fae6a" opacity=".9"/>';
    return wrap('The International Space Station above the Earth, cut open so you can see inside: a visiting spacecraft, a spacesuit, a sleeping bag, the kitchen, a space garden, a running machine, the toilet and the Cupola window, with big solar panels and a robot arm outside', `
  <defs><linearGradient id="spSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050a22"/><stop offset="1" stop-color="#14245e"/></linearGradient>
  <radialGradient id="spEarth" cx=".5" cy="0" r=".25"><stop offset="0" stop-color="#58a8ea"/><stop offset="1" stop-color="#1f66b8"/></radialGradient>
  <clipPath id="spClip"><circle cx="1200" cy="4610" r="4000"/></clipPath></defs>
  <rect width="2400" height="800" fill="url(#spSky)"/>${stars}
  <circle cx="1960" cy="104" r="42" fill="#e9e6da"/><circle cx="1947" cy="93" r="8" fill="#d3cfc0"/><circle cx="1973" cy="118" r="11" fill="#d3cfc0"/><circle cx="1975" cy="86" r="5" fill="#d3cfc0"/>
  <circle cx="1200" cy="4610" r="4014" fill="#9fd8ff" opacity=".35"/><circle cx="1200" cy="4610" r="4000" fill="url(#spEarth)"/>
  <g clip-path="url(#spClip)">${land}<g class="tm-drift" fill="#fff" opacity=".8"><ellipse cx="420" cy="720" rx="150" ry="16"/><ellipse cx="1130" cy="660" rx="190" ry="14"/><ellipse cx="1280" cy="690" rx="120" ry="12"/><ellipse cx="1900" cy="700" rx="170" ry="15"/><ellipse cx="760" cy="770" rx="140" ry="14"/><ellipse cx="2200" cy="770" rx="120" ry="12"/></g></g>

  ${wing(40)}${wing(2170)}${truss}
  <g id="spArm"><path d="M1020 236 L944 128 L1092 66" stroke="${INK}" stroke-width="22" fill="none" stroke-linejoin="round" stroke-linecap="round"/><path d="M1020 236 L944 128 L1092 66" stroke="#f4f6fa" stroke-width="14" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="1020" cy="236" r="15" fill="#c6ccd6" stroke="${INK}" stroke-width="3"/><circle cx="944" cy="128" r="14" fill="#c6ccd6" stroke="${INK}" stroke-width="3"/><rect x="1086" y="48" width="30" height="34" rx="6" fill="#f0b913" stroke="${INK}" stroke-width="3" transform="rotate(-22 1100 66)"/></g>

  <g id="spCraft"><path d="M470 348 v114 h-64 q-78 -22 -78 -57 q0 -35 78 -57 Z" fill="#f4f6fa" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><circle cx="410" cy="405" r="15" fill="#7fc4f0" stroke="${INK}" stroke-width="3"/><path d="M440 356 v98" stroke="#b8bec9" stroke-width="3"/><rect x="452" y="372" width="18" height="66" fill="#3a3f46" stroke="${INK}" stroke-width="2.5"/></g>
  ${collar(470)}${mod(486, 204)}${collar(690)}${mod(706, 194)}${collar(900)}${mod(916, 214)}${collar(1130)}${mod(1146, 254)}${collar(1400)}${mod(1416, 224)}${collar(1640)}${mod(1656, 164)}${collar(1820)}${mod(1836, 244)}

  <g id="spSuit"><circle cx="512" cy="405" r="20" fill="#c6ccd6" stroke="${INK}" stroke-width="3"/><circle cx="512" cy="405" r="8" fill="#9aa3b2"/>
    <rect x="566" y="398" width="68" height="62" rx="12" fill="#fff" stroke="${INK}" stroke-width="3"/><rect x="556" y="404" width="14" height="50" rx="7" fill="#fff" stroke="${INK}" stroke-width="3"/><rect x="630" y="404" width="14" height="50" rx="7" fill="#fff" stroke="${INK}" stroke-width="3"/>
    <rect x="574" y="456" width="22" height="30" rx="8" fill="#fff" stroke="${INK}" stroke-width="3"/><rect x="604" y="456" width="22" height="30" rx="8" fill="#fff" stroke="${INK}" stroke-width="3"/>
    <circle cx="600" cy="374" r="28" fill="#fff" stroke="${INK}" stroke-width="3"/><ellipse cx="600" cy="374" rx="19" ry="15" fill="#f0b913" stroke="${INK}" stroke-width="3"/><path d="M590 368 q8 -6 16 -2" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
    <rect x="584" y="412" width="32" height="20" rx="4" fill="#e8ecf2" stroke="${INK}" stroke-width="2"/><circle cx="592" cy="422" r="3" fill="#c8102e"/><circle cx="602" cy="422" r="3" fill="#2f5a8a"/></g>

  <g id="spSleep"><rect x="752" y="336" width="70" height="144" rx="28" fill="#4f9a6a" stroke="${INK}" stroke-width="3"/><path d="M752 400 h70 M752 440 h70" stroke="#3a7a52" stroke-width="5"/><circle cx="787" cy="362" r="20" fill="#e8b98f" stroke="${INK}" stroke-width="3"/><path d="M768 356 q19 -24 38 0 q-19 -10 -38 0 Z" fill="#3a2414"/><path d="M777 364 q4 4 8 0 M790 364 q4 4 8 0" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <g class="tm-float"><text x="832" y="360" ${F} font-size="20" fill="#7a86a8">z</text><text x="846" y="344" ${F} font-size="26" fill="#7a86a8">z</text></g>
    <rect x="842" y="430" width="38" height="28" rx="3" fill="#fff3c4" stroke="${INK}" stroke-width="2.5"/><circle cx="854" cy="442" r="5" fill="#e8b98f"/><circle cx="868" cy="442" r="5" fill="#b9774a"/></g>

  <g id="spFood"><rect x="956" y="436" width="140" height="12" rx="4" fill="#b8bec9" stroke="${INK}" stroke-width="3"/><rect x="1020" y="448" width="12" height="38" fill="#9aa3b2" stroke="${INK}" stroke-width="2.5"/>
    <rect x="968" y="400" width="28" height="36" rx="5" fill="#e98b5a" stroke="${INK}" stroke-width="2.5"/><line x1="988" y1="400" x2="996" y2="384" stroke="${INK}" stroke-width="3"/><rect x="1004" y="406" width="28" height="30" rx="5" fill="#7fbf5f" stroke="${INK}" stroke-width="2.5"/>
    <ellipse cx="1066" cy="428" rx="24" ry="7" fill="#f0d9a0" stroke="${INK}" stroke-width="2.5"/>
    <g class="tm-float"><ellipse cx="1076" cy="366" rx="17" ry="15" fill="#9bd6f2" stroke="#5aa9cf" stroke-width="3" opacity=".92"/><ellipse cx="1070" cy="360" rx="5" ry="4" fill="#fff" opacity=".8"/><circle cx="1104" cy="388" r="7" fill="#9bd6f2" stroke="#5aa9cf" stroke-width="2.5"/></g>
    <g class="tm-float" style="animation-delay:-3s"><path d="M950 356 l26 -8" stroke="#8d95a3" stroke-width="5" stroke-linecap="round"/><ellipse cx="982" cy="346" rx="8" ry="6" fill="#c6ccd6" stroke="${INK}" stroke-width="2"/></g></g>

  <g id="spGarden"><rect x="1172" y="352" width="116" height="122" rx="8" fill="#2b1a3a" stroke="${INK}" stroke-width="3"/><rect x="1180" y="360" width="100" height="106" rx="5" fill="#ff7bd0" opacity=".4"/><rect x="1184" y="442" width="92" height="22" rx="4" fill="#5a3a22"/>
    ${[1204, 1230, 1256].map((x, i) => `<path d="M${x} 444 q-16 -18 -8 -34 q10 6 8 34 q-2 -28 10 -36 q10 16 -10 36 Z" fill="${i % 2 ? '#7fbf5f' : '#5fae6a'}" stroke="#2f6b3a" stroke-width="2"/>`).join('')}
    <rect x="1186" y="364" width="88" height="7" rx="3" fill="#ffd0ee"/></g>
  <g class="tm-float" style="animation-delay:-2s" id="spZara"><rect x="1310" y="418" width="70" height="38" rx="14" fill="#2f5aa8" stroke="${INK}" stroke-width="3" transform="rotate(-14 1345 437)"/><path d="M1374 424 l34 -6 M1376 440 l34 4" stroke="#d8c9a8" stroke-width="13" stroke-linecap="round"/><path d="M1318 440 l-20 16 M1330 428 l-16 -22" stroke="#8a5a3c" stroke-width="9" stroke-linecap="round"/>
    <circle cx="1304" cy="424" r="19" fill="#8a5a3c" stroke="${INK}" stroke-width="3"/><circle cx="1290" cy="410" r="11" fill="#1d1410"/><circle cx="1304" cy="402" r="12" fill="#1d1410"/><circle cx="1318" cy="408" r="10" fill="#1d1410"/><circle cx="1298" cy="426" r="2" fill="${INK}"/><circle cx="1310" cy="424" r="2" fill="${INK}"/><path d="M1298 433 q6 5 12 1" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/></g>

  <g id="spGym"><rect x="1440" y="466" width="160" height="14" rx="6" fill="#3a3f46" stroke="${INK}" stroke-width="3"/><path d="M1590 466 v-76 h-22" stroke="${INK}" stroke-width="6" fill="none" stroke-linecap="round"/><rect x="1556" y="380" width="26" height="18" rx="3" fill="#7fc4f0" stroke="${INK}" stroke-width="2.5"/>
    ${person(1512, 468, .8, '#e85d2f', '#f1c9a5', '#3a2414')}<path d="M1500 428 L1456 468 M1524 428 L1560 468" stroke="#f0b913" stroke-width="4" stroke-linecap="round"/></g>

  <g id="spLoo"><path d="M1672 326 h46 q-10 80 4 158 h-50 Z" fill="#7a9ac8" stroke="${INK}" stroke-width="3"/><path d="M1686 330 q-6 76 2 150 M1702 330 q-6 76 4 150" stroke="#5a7aa8" stroke-width="3" fill="none"/>
    <rect x="1736" y="424" width="62" height="58" rx="8" fill="#eef1f5" stroke="${INK}" stroke-width="3"/><ellipse cx="1767" cy="424" rx="24" ry="9" fill="#fff" stroke="${INK}" stroke-width="3"/><ellipse cx="1767" cy="424" rx="12" ry="4" fill="#3a3f46"/>
    <path d="M1798 446 q20 -6 14 -50 q-4 -24 -22 -22" stroke="#f0b913" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M1780 366 l12 14 l-16 4 Z" fill="#f0b913" stroke="${INK}" stroke-width="2"/></g>

  <g id="spCupola"><rect x="1866" y="346" width="52" height="42" rx="6" fill="#fff" stroke="${INK}" stroke-width="2.5"/><rect x="1930" y="340" width="60" height="52" rx="6" fill="#e98b5a" stroke="${INK}" stroke-width="2.5"/><rect x="2002" y="350" width="46" height="40" rx="6" fill="#7fbf5f" stroke="${INK}" stroke-width="2.5"/>
    <path d="M1894 500 h128 l30 66 q-94 40 -188 0 Z" fill="#dfe3ea" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M1904 512 h32 l-10 44 q-22 -4 -40 -12 Z M1944 512 h28 l6 48 q-20 2 -40 0 Z M1980 512 h32 l18 32 q-18 8 -40 12 Z" fill="#7fc4f0" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M1912 520 l-8 22 M1952 520 l-2 28 M1990 520 l10 22" stroke="#fff" stroke-width="3" opacity=".7" stroke-linecap="round"/></g>`);
  }

  X.add({ id:'space', door:'space', e:'🛰️', n:'The Space Station', when:'Right now, high above us', stamp:'I S S', where:'the station', next:'Next around the station ➡️',
    aria:'The International Space Station above the Earth, cut open so you can see inside',
    hello:{ h:'Welcome aboard the Space Station!', t:'The International Space Station is flying around the Earth right now, about 400 kilometres above our heads. People live and work here. Tap a glowing circle to look closer.' },
    scene:space,
    spots:[
      { id:'solar', snd:'solar', x:140, y:240, e:'☀️', n:'The solar panels', t:'These huge wings are solar panels. They turn sunlight into electricity for the whole station.', k:'The station is as long as a football pitch.' },
      { id:'craft', snd:'dock', x:392, y:330, e:'🚀', n:'The visiting spacecraft', t:'Astronauts fly up in a small spacecraft like this one. It stays joined on, ready to take them home again.', k:'The trip up can take less than a day.' },
      { id:'suit', snd:'radio', x:660, y:372, e:'🧑‍🚀', n:'The spacesuit', t:'This is a spacesuit for going outside. It gives the astronaut air to breathe and keeps them at the right temperature.', k:'A trip outside is called a spacewalk.' },
      { id:'sleep', snd:'zip', x:862, y:388, e:'💤', n:'The sleeping bag', t:'There is no up or down here, so astronauts sleep in a sleeping bag fixed to the wall.', k:'Each astronaut has a tiny cabin, about the size of a phone box.' },
      { id:'arm', snd:'servo', x:1010, y:128, e:'🦾', n:'The robot arm', t:'This is the station’s robot arm. Astronauts use it to move heavy things and to catch visiting cargo ships.', k:'It is as long as about four cars, and it was built in Canada.' },
      { id:'food', snd:'bubble', x:1022, y:366, e:'🌯', n:'The kitchen', t:'Food comes in pouches. Astronauts use wraps, not bread, because floating crumbs could get into the machines.', k:'Water floats in wobbly balls, so drinks come in pouches with a straw.' },
      { id:'garden', snd:'beep', x:1196, y:336, e:'🥬', n:'The space garden', t:'Astronauts grow plants up here, under special lights. They have grown lettuce, radishes and even chilli peppers.', k:'Scientists want to learn how to grow food for long trips into space.' },
      { id:'gym', snd:'treadmill', x:1606, y:352, e:'🏃', n:'The running machine', t:'With no weight on their legs, astronauts’ muscles and bones get weaker. So they exercise for about two hours every day.', k:'Stretchy straps hold them down on the running machine.' },
      { id:'toilet', snd:'whoosh', x:1790, y:372, e:'🚽', n:'The space toilet', t:'Yes, there is a toilet! Nothing falls downwards here, so it uses moving air, a bit like a vacuum cleaner.', k:'The station cleans and reuses nearly all of its water.' },
      { id:'cupola', snd:'shutter', x:1958, y:584, e:'🌍', n:'The Cupola', t:'This is the Cupola. It has seven windows for looking down at the Earth.', k:'The station goes round the Earth about every 90 minutes, so astronauts see 16 sunrises every day!' }
    ],
    find:['suit', 'garden', 'cupola'],
    sort:{ h:'Up here or down there?', ask:'Which things belong on the space station, and which only happen on Earth?', a:['🛰️ On the space station', 'up in orbit'], b:['🌍 Only down on Earth', 'not on the station'], items:[
      { id:'sunrise', e:'🌅', n:'16 sunrises in one day', a:true, tip:'The station circles the Earth 16 times a day, so there are 16 sunrises.' },
      { id:'shower', e:'🚿', n:'a shower', a:false, tip:'No showers! The water would float everywhere. Astronauts wash with wet cloths.' },
      { id:'bag', e:'💤', n:'a sleeping bag on the wall', a:true, tip:'Astronauts zip themselves in so they don’t drift about in their sleep.' },
      { id:'candle', e:'🕯️', n:'a candle', a:false, tip:'No candles. Fire is far too dangerous on the station.' },
      { id:'blob', e:'💧', n:'water that floats in balls', a:true, tip:'With nothing pulling it down, water pulls itself into wobbly balls.' },
      { id:'bread', e:'🍞', n:'crumbly bread', a:false, tip:'Crumbs would float into the machines. Astronauts use wraps.' },
      { id:'straps', e:'🏃', n:'running with stretchy straps', a:true, tip:'The straps hold the runner down on the running machine.' },
      { id:'rain', e:'🌧️', n:'rain', a:false, tip:'There is no weather inside! But astronauts can see storms far below on Earth.' }
    ] },
    match:{ h:'What is it for?', ask:'Match each part of the station to its job.', pick:'Tap a part of the station, then tap its job.', items:[
      { id:'solar', e:'☀️', n:'the solar panels', use:'making electricity' },
      { id:'suit', e:'🧑‍🚀', n:'a spacesuit', use:'going outside safely' },
      { id:'arm', e:'🦾', n:'the robot arm', use:'moving heavy things' },
      { id:'gym', e:'🏃', n:'the running machine', use:'keeping muscles and bones strong' }
    ] },
    who:{ n:'Zara', voice:'f', role:'an astronaut', at:[1340, 372], spot:'garden', hello:{ h:'Hello from space!', t:'I’m Zara, and I live on the space station for six months. Tap a question and I’ll tell you what it’s like.' },
      note:'Zara is a made-up astronaut. Her answers come from what real astronauts have told us about living on the station.',
      face:face({ alt:'Zara, an astronaut', top:'#2f5aa8', skin:'#8a5a3c', hair:`<g fill="#1d1410"><circle cx="38" cy="30" r="17"/><circle cx="60" cy="18" r="19"/><circle cx="82" cy="30" r="17"/><circle cx="27" cy="50" r="12"/><circle cx="93" cy="50" r="12"/></g>`, extra:`<circle cx="82" cy="114" r="8" fill="#f0b913" stroke="${INK}" stroke-width="2.5"/>` }),
      qs:[
        { id:'float', q:'Why do you float?', a:'The station is falling around the Earth all the time, and we are falling with it. When everything falls together, everything floats! Scientists call it microgravity.' },
        { id:'sleep', q:'How do you sleep?', a:'I zip myself into a sleeping bag on the wall of my little cabin, so I don’t drift away. It’s very cosy.' },
        { id:'eat', q:'What do you eat?', a:'Lots of things! Pasta, curry, fruit and nuts. My favourite is a wrap with peanut butter. I have to catch my food before it floats off!' },
        { id:'wash', q:'How do you wash?', a:'With wet cloths and a shampoo that doesn’t need rinsing. And I swallow my toothpaste, because there is no sink to spit into!' },
        { id:'work', q:'What do you do all day?', a:'Science experiments, mending things and keeping the station clean. And two hours of exercise every single day.' },
        { id:'see', q:'What can you see from the window?', a:'The whole Earth turning below us: blue seas, white clouds, and at night the twinkling lights of cities. It never stops being beautiful.' },
        { id:'family', q:'How do you talk to your family?', a:'We have video calls, and I can send messages too. I love showing them my floating tricks.' },
        { id:'fast', q:'How fast are you going?', a:'About 28,000 kilometres an hour! That is fast enough to go all the way round the Earth in an hour and a half.' }
      ] },
    teach:[
      '<b>Curriculum.</b> Supports Year 5 science: Earth and space, and forces (gravity). Check the wording against the National Curriculum programme of study.',
      '<b>A common mix-up.</b> Astronauts do not float because there is no gravity. Gravity at the station’s height is nearly as strong as on the ground. They float because the station and everyone in it are falling around the Earth together. Zara’s answer says this in child-friendly words.',
      '<b>Kept gentle.</b> This world leaves out accidents and the dangers of spaceflight. The facts were checked in November 2026; crew numbers and spacecraft change, so the wording avoids them.'
    ],
    packs:[{ id:'science-flightpath-y56', step:1, label:'Science flightpath: Earth and space' }, { id:'science-flightpath-y56', step:2, label:'Science flightpath: Forces' }],
    real:[]
  });

  /* =====================================================================
     Real photographs (free to reuse; credit shown under each) and Street View viewpoints.
     Keys are world/spot. Added by FabExplore.media().
     ===================================================================== */
  const PHOTOS = {
    'rome/stones':{ src:'explore/rome-stones.jpg', alt:'Big flat stepping stones set across a paved Roman street, with raised pavements at the sides', cap:'Stepping stones across a street in Pompeii, in Italy.', by:'Gary Todd, public domain, via Wikimedia Commons' },
    'rome/thermo':{ src:'explore/rome-thermo.jpg', alt:'A stone shop counter with round holes in the top, beside a paved street', cap:'The counter of a hot-food shop in Pompeii. Big jars of food sat in the round holes.', by:'Carole Raddato, CC BY-SA 2.0, via Wikimedia Commons' },
    'rome/aqueduct':{ src:'explore/rome-aqueduct.jpg', alt:'A very tall stone bridge with three rows of arches crossing a river between wooded hills', cap:'The Pont du Gard in France. It is a Roman aqueduct with three rows of arches.', by:'Benh Lieu Song, CC BY-SA 3.0, via Wikimedia Commons' },
    'rome/bakery':{ src:'explore/rome-bakery.jpg', alt:'Three hourglass-shaped stone mills standing in the ruins of a bakery, with a brick oven on the left', cap:'A Roman bakery in Pompeii. The stone mills ground wheat into flour. The oven is on the left.', by:'Isaac Harjo of ProWalk Tours, CC BY-SA 4.0, via Wikimedia Commons' },
    'rome/fountain':{ src:'explore/rome-fountain.jpg', alt:'A square stone water trough at the side of a paved street, with a worn carved face where the water came out', cap:'A street fountain in Pompeii. Water ran out of the carved face into the stone trough.', by:'Bernard Gagnon, CC BY 4.0, via Wikimedia Commons' },
    'rome/mosaic':{ src:'explore/rome-mosaic.jpg', alt:'The corner of a mosaic floor with wave and plait patterns made from small coloured stones', cap:'Part of a Roman mosaic floor from Italy. It is about 2,000 years old.', by:'The Cleveland Museum of Art' },
    'egypt/pyramids':{ src:'explore/egypt-pyramids.jpg', alt:'Three huge pyramids and three small ones standing in a sandy desert under a blue sky', cap:'The pyramids at Giza, in Egypt.', by:'Ricardo Liberato, CC BY-SA 2.0, via Wikimedia Commons' },
    'egypt/shaduf':{ src:'explore/egypt-shaduf.jpg', alt:'An old tinted postcard of two people beside a river, working long poles that have a bucket on one end', cap:'An old postcard of people lifting water from the river with a shaduf.', by:'B. Livadas & Coutsicos (postcard), TIMEA, CC BY-SA 2.5, via Wikimedia Commons' },
    'egypt/boat':{ src:'explore/egypt-boat.jpg', alt:'A painted wooden model of a boat with a mast, a big steering oar and a crew of small wooden figures', cap:'A wooden model of a Nile boat and its crew. It is more than 3,500 years old.', by:'The Cleveland Museum of Art' },
    'egypt/papyrus':{ src:'explore/egypt-papyrus.jpg', alt:'Tall green papyrus stems, each topped with a spray of fine green threads like a firework', cap:'Papyrus plants. The tall stems were cut into strips to make sheets for writing on.', by:'Krzysztof Ziarnek (Kenraiz), CC BY-SA 4.0, via Wikimedia Commons' },
    'egypt/cat':{ src:'explore/egypt-cat.jpg', alt:'A small dark metal statue of a sitting cat wearing a gold earring', cap:'A bronze cat with a gold earring. It was made in Egypt more than 2,000 years ago.', by:'The Cleveland Museum of Art' },
    'egypt/senet':{ src:'explore/egypt-senet.jpg', alt:'A long wooden game box with a grid of squares on top and a set of small carved playing pieces beside it', cap:'A game box for playing senet, with its playing pieces. It is about 3,500 years old.', by:'The Metropolitan Museum of Art, Rogers Fund, 1916, CC BY-SA 4.0, via Wikimedia Commons' },
    'egypt/hiero':{ src:'explore/egypt-hiero.jpg', alt:'Columns of hieroglyphs carved into pale stone above the heads of four people', cap:'Hieroglyphs carved into stone about 3,300 years ago.', by:'The Cleveland Museum of Art' },
    'victorian/bell':{ src:'explore/victorian-bell.jpg', alt:'A hand bell with a dark wooden handle, standing on a table', cap:'A hand bell with a wooden handle, like the ones rung in school playgrounds.', by:'Auckland Museum, CC BY 4.0, via Wikimedia Commons' },
    'victorian/lamp':{ src:'explore/victorian-lamp.jpg', alt:'A glass street lantern glowing among bare winter branches at dusk', cap:'A gas street lamp glowing in Malvern, in England. A few towns still have them.', by:'Horep, CC BY-SA 4.0, via Wikimedia Commons' },
    'victorian/train':{ src:'explore/victorian-train.jpg', alt:'A bright green steam engine with one enormous driving wheel, inside a museum hall', cap:'A Victorian steam engine built in 1870. It is kept at the National Railway Museum in York.', by:'Alan King, public domain, via Wikimedia Commons' },
    'victorian/pump':{ src:'explore/victorian-pump.jpg', alt:'A tall green iron water pump on a stone base with flowers around it, in a village square', cap:'The village pump in Grassington, in Yorkshire.', by:'Bill Harrison, CC BY-SA 2.0, via Wikimedia Commons' },
    'victorian/post':{ src:'explore/victorian-post.jpg', alt:'A red six-sided pillar box with a pointed top, standing beside a hedge', cap:'A six-sided Victorian pillar box in Rothesay, in Scotland.', by:'DeFacto, CC BY-SA 4.0, via Wikimedia Commons' },
    'victorian/bike':{ src:'explore/victorian-bike.jpg', alt:'A penny-farthing bicycle with one huge spoked wheel and one tiny wheel, on display in a museum', cap:'A real penny-farthing in a museum. The rider sat right on top of the big wheel.', by:'Auckland Museum, CC BY 4.0, via Wikimedia Commons' },
    'space/solar':{ src:'explore/space-solar.jpg', alt:'The whole Space Station seen from outside, with long rows of flat solar panels against black space', cap:'The whole Space Station, photographed from a visiting spacecraft in 2021.', by:'NASA' },
    'space/craft':{ src:'explore/space-craft.jpg', alt:'A white cone-shaped spacecraft with its nose open, floating in black space', cap:'A Dragon spacecraft arriving at the Space Station with supplies in 2026.', by:'NASA' },
    'space/suit':{ src:'explore/space-suit.jpg', alt:'Two white spacesuits facing each other inside a small room packed with equipment', cap:'Two spacesuits waiting in the airlock, the room where spacewalks begin.', by:'NASA' },
    'space/arm':{ src:'explore/space-arm.jpg', alt:'A long white robot arm reaching out from the Space Station, high above the blue Earth', cap:'The station’s robot arm, with the Earth far below.', by:'NASA' },
    'space/food':{ src:'explore/space-food.jpg', alt:'A metal meal tray holding a drink can and tubs of food, in front of a spacecraft control panel', cap:'A space meal on a tray. This photo was taken on the Space Shuttle in 1983.', by:'NASA' },
    'space/garden':{ src:'explore/space-garden.jpg', alt:'Leafy green and red plants growing inside a small clear-sided box on the Space Station', cap:'Lettuce and mustard leaves growing on the Space Station in 2017.', by:'NASA' },
    'space/toilet':{ src:'explore/space-toilet.jpg', alt:'A small white toilet seat on top of a metal tank, with a hose beside it, in a tiny cubicle', cap:'The real toilet on the Space Station.', by:'NASA' },
    'space/cupola':{ src:'explore/space-cupola.jpg', alt:'Seven windows arranged like the petals of a flower, with white clouds and blue sea showing through them', cap:'The seven windows of the Cupola, looking down at the Earth.', by:'NASA' }
  };
  /* Street View viewpoints: Google's own photographs (not visitors' uploads), each one checked on screen on 25 Nov 2026.
     pano = Google's id for the photograph; h = which way to face (degrees); p = tilt up; z = zoom. */
  const REAL = {
    rome:[
      { id:'pompeii', e:'🛣️', n:'A real Roman street', t:'This is a street in Pompeii, a Roman town in Italy that you can still walk around today. Can you see the big paving stones and the raised pavements at the sides?', pano:'DZ3foTcro2lOGp5tnBcNWg', lat:40.7492898, lng:14.4874624, h:0, p:-5, z:0.6 },
      { id:'forum', e:'🏛️', n:'The town square', t:'This is the edge of the forum in Pompeii. The forum was the busy main square in the middle of a Roman town. Look for the tall stone columns.', pano:'UkVrp-mx8Gu9uSP4pY4KSw', lat:40.7488689, lng:14.4853978, h:265, p:0, z:0.6 },
      { id:'colosseum', e:'🏟️', n:'The Colosseum', t:'This is the Colosseum in the city of Rome. It was a giant stadium. About 50,000 people could sit inside to watch the shows.', pano:'arjiKrb_1JTA26lfJamS7Q', lat:41.889268, lng:12.4929446, h:330, p:5, z:0.6 },
      { id:'aqueduct', e:'🌉', n:'An aqueduct still standing', t:'This aqueduct is in Segovia, in Spain. The Romans built it from big blocks of stone to carry water into the town. It is still standing, about 2,000 years later.', pano:'CD3TLIHsjwfwpu2pywtNwg', lat:40.9475281, lng:-4.1186159, h:62, p:8, z:1.6 }
    ],
    egypt:[
      { id:'khafre', e:'🔺', n:'A pyramid up close', t:'This is one of the three great pyramids at Giza, in Egypt. Look right at the top. Can you see where some of the smooth outer stones are still in place?', pano:'HcABubGcxsuNXc2WkPiw7w', lat:29.9776721, lng:31.1322923, h:205, p:8, z:0.6 },
      { id:'great', e:'🏜️', n:'The Great Pyramid', t:'Turn around from the same spot and here is the Great Pyramid, the biggest of them all. It is made from more than two million blocks of stone.', pano:'HcABubGcxsuNXc2WkPiw7w', lat:29.9776721, lng:31.1322923, h:47, p:18, z:0.6 },
      { id:'sphinx', e:'🦁', n:'The Sphinx', t:'Here is the Great Sphinx, with a pyramid behind it. It was carved out of the rock of the hillside. It has the body of a lion and the head of a person.', pano:'iWYXQcmie8C8t5_1QifUnQ', lat:29.9749994, lng:31.1377382, h:0, p:5, z:0.6 }
    ],
    victorian:[
      { id:'towerbridge', e:'🌉', n:'Tower Bridge', t:'Tower Bridge in London opened in 1894, when Victoria was queen. The road in the middle lifts up to let tall ships sail through.', pano:'wrJ52xfcUs6xpkEMZWj3fA', lat:51.5069149, lng:-0.0743788, h:190, p:10, z:0.6 },
      { id:'saltaire', e:'🏘️', n:'A Victorian village', t:'This is Saltaire, in Yorkshire. A mill owner built the whole village in Victorian times for the people who worked in his wool mill. Families lived in stone houses like these.', pano:'gZvzSFvpoba5ElV7qhCWlQ', lat:53.8376947, lng:-1.7905397, h:0, p:0, z:0.6 }
    ],
    space:[
      { id:'cupola', e:'🌍', n:'Look out of the Cupola', t:'You are inside the real Cupola on the Space Station. That is the Earth outside the windows! An astronaut took these photographs in 2017.', pano:'zChzPIAn4RIAAAQvxgbyEg', lat:29.5602853, lng:-95.0853915, h:302.9, p:54.8, z:0.6 },
      { id:'hatch', e:'🚪', n:'Through the hatch', t:'Now look back up through the hatch. It leads into a room called Tranquility, where the crew keep an exercise machine. Every wall is covered in equipment.', pano:'zChzPIAn4RIAAAQvxgbyEg', lat:29.5602853, lng:-95.0853915, h:10, p:0, z:0.6 },
      { id:'tranquility', e:'🛰️', n:'Float along Tranquility', t:'This is inside Tranquility. There is no floor and no ceiling in space, so the astronauts use every side of the room.', pano:'w1qTq9UucpkAAAQvxgbyEA', lat:29.5603242, lng:-95.0853684, h:20, p:10, z:0.6 }
    ]
  };
  function media(photos, real){
    Object.keys(photos || {}).forEach(k => { const [w, s] = k.split('/'); const sp = X.worlds[w] && X.worlds[w].spots.find(x => x.id === s); if(sp) sp.photo = photos[k]; });
    Object.keys(real || {}).forEach(w => { if(X.worlds[w]) X.worlds[w].real = real[w]; });
  }
  X.media = media;
  media(PHOTOS, REAL);
})();
