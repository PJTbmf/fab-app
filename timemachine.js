/* timemachine.js — The Time Machine: Explorer worlds, starting with a street in Ancient Rome.
   Four layers: (1) our own Fab-style scene with tap-to-explore spots (Miss Bell explains: I do);
   (2) missions (Fab: You do) that earn stars, a gem and a passport stamp; (3) Meet someone: a scripted
   Roman baker who answers the questions a child taps (no free text, no AI chat); (4) See it for real:
   checked link-outs for the teacher.
   Every fact here is a draft for a teacher to check before children use it.
   Kept gentle on purpose: no gladiators, slavery or the eruption of Vesuvius in this first street.
   Opens from the Learning Hub and from the Time Machine place in Fab Fox World. Loaded after me.js. */
(function(){
  'use strict';
  const h = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const snd = k => { try{ Sound[k](); }catch(e){} };
  const q1 = s => document.querySelector(s);
  const code = () => { try{ return fabLearnerCode() || 'local'; }catch(e){ return 'local'; } };
  const shuffle = a => { const b = a.slice(); for(let i = b.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const INK = '#2B1A12';

  /* ---------- what there is to find ---------- */
  const ERAS = [
    { id:'rome', e:'🏛️', n:'Ancient Rome', when:'About 2,000 years ago', open:true },
    { id:'egypt', e:'🐫', n:'Ancient Egypt', when:'About 4,500 years ago' },
    { id:'maya', e:'🌽', n:'The Maya', when:'About 1,200 years ago' },
    { id:'victorian', e:'🎩', n:'The Victorians', when:'About 150 years ago' },
    { id:'space', e:'🛰️', n:'The Space Station', when:'Right now, high above us' },
    { id:'ocean', e:'🐠', n:'Ocean Explorers', when:'Right now, under the sea' }
  ];
  const SPOTS = [
    { id:'temple', x:280, y:445, e:'🏛️', n:'The temple', t:'This is a temple. Romans believed in many gods and goddesses. Jupiter was the king of the gods.', k:'Temples had tall stone columns at the front, like these.' },
    { id:'cart', x:555, y:655, e:'🏺', n:'The cart of jars', t:'These tall jars are called amphorae. They carried olive oil and wine on carts and ships.', k:'One jar is an amphora. Two or more are amphorae.' },
    { id:'aqueduct', x:700, y:300, e:'💧', n:'The aqueduct', t:'An aqueduct is like a bridge for water. It carried clean water from the hills into the town.', k:'Some aqueducts were many miles long.' },
    { id:'fountain', x:790, y:548, e:'⛲', n:'The fountain', t:'Most homes had no taps. People filled their jugs at fountains like this one in the street.', k:'The water came from the aqueduct.' },
    { id:'bakery', x:1225, y:525, e:'🍞', n:'The bakery', t:'Roman bakers ground wheat into flour with heavy stone mills. Then they baked round loaves in a brick oven.', k:'A loaf was marked into eight pieces, so it was easy to share.' },
    { id:'stones', x:1445, y:712, e:'🪨', n:'The stepping stones', t:'The road could be wet and mucky. Big stepping stones let people cross with clean feet.', k:'Cart wheels fitted through the gaps between the stones.' },
    { id:'thermo', x:1730, y:468, e:'🍲', n:'The hot-food shop', t:'This is a hot-food shop. Many people in Roman towns had no kitchen at home, so they bought hot food here.', k:'Food and drink were kept in big jars set into the counter.' },
    { id:'mosaic', x:2095, y:628, e:'🐕', n:'The mosaic', t:'This picture on the floor is a mosaic. It is made from hundreds of tiny cubes of coloured stone.', k:'The words CAVE CANEM mean “beware of the dog”!' },
    { id:'milestone', x:2292, y:598, e:'🪧', n:'The milestone', t:'Milestones stood beside Roman roads to tell travellers how far they had come.', k:'Romans wrote numbers with letters. I is 1, V is 5 and X is 10. This stone says IX. That is 9.' }
  ];
  const FIND = ['stones', 'mosaic', 'fountain'];
  const SORT = [
    { id:'sandals', e:'👡', n:'sandals', then:true, tip:'Romans wore leather sandals.' },
    { id:'bike', e:'🚲', n:'a bicycle', then:false, tip:'Bicycles were invented about 200 years ago, long after the Romans.' },
    { id:'coins', e:'🪙', n:'coins', then:true, tip:'Romans paid with coins made of bronze, silver and gold.' },
    { id:'phone', e:'📱', n:'a mobile phone', then:false, tip:'Phones need electricity. Romans sent messages by letter.' },
    { id:'bread', e:'🍞', n:'bread', then:true, tip:'Romans ate bread every day.' },
    { id:'bulb', e:'💡', n:'a light bulb', then:false, tip:'Light bulbs came much later. Romans used oil lamps.' },
    { id:'lamp', e:'🪔', n:'an oil lamp', then:true, tip:'Romans lit their homes with little lamps that burned olive oil.' },
    { id:'car', e:'🚗', n:'a car', then:false, tip:'No cars yet! Romans walked, rode horses or used carts.' }
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
  function pass(){ let p = null; try{ p = JSON.parse(localStorage.getItem(PKEY())); }catch(e){} p = p && typeof p === 'object' ? p : {}; p.rome = Object.assign({ seen:[], m:[], asked:[], stamp:0, chat:0 }, p.rome || {}); return p; }
  function savePass(p){ try{ localStorage.setItem(PKEY(), JSON.stringify(p)); }catch(e){} }
  function award(n){ try{ fabWorldAward(n); }catch(e){} }

  const V = { era:null, tab:'explore', hot:null, back:'screen-learn', act:null, sort:null, match:null, ask:null, note:null, stop:false, flash:'' };

  /* ---------- the street, drawn in the app ---------- */
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
  <g fill="#fff" opacity=".9"><ellipse cx="420" cy="120" rx="90" ry="26"/><ellipse cx="480" cy="100" rx="60" ry="24"/><ellipse cx="1380" cy="150" rx="100" ry="26"/><ellipse cx="1450" cy="130" rx="60" ry="22"/><ellipse cx="1930" cy="90" rx="70" ry="20"/></g>
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
    <path d="M790 540 q5 22 0 44" stroke="#7cc7ea" stroke-width="7" fill="none" stroke-linecap="round"/>
    <rect x="722" y="582" width="136" height="54" rx="8" fill="#e9dcc0" stroke="${INK}" stroke-width="3"/><ellipse cx="790" cy="589" rx="58" ry="7" fill="#9bd6f2" stroke="#5aa9cf" stroke-width="2"/></g>
  ${person(884, 640, 1, '#8fb7d9', '#c98d5e', '#3a2414', '<ellipse cx="22" cy="-52" rx="11" ry="14" fill="#cf7a45" stroke="#2B1A12" stroke-width="2.5"/>')}

  <g id="tmBakery"><rect x="900" y="312" width="412" height="290" fill="#f3d58c" stroke="${INK}" stroke-width="3"/>${roof(900, 1312, 264, '#d9703a')}
    <rect x="1010" y="328" width="194" height="42" rx="6" fill="#fff6e6" stroke="${INK}" stroke-width="3"/><text x="1107" y="358" text-anchor="middle" font-family="Aleo, Georgia, serif" font-weight="700" font-size="25" fill="${INK}" letter-spacing="2">PISTRINUM</text>
    <rect x="925" y="390" width="216" height="212" fill="#7a5230" stroke="${INK}" stroke-width="3"/><rect x="935" y="432" width="196" height="8" fill="#c79a5b" stroke="${INK}" stroke-width="2"/>${loaf(962, 416, 15)}${loaf(1000, 416, 15)}
    <g id="tmMarcus"><path d="M1056 520 v-34 q30 -22 60 0 v34 Z" fill="#fff3dc" stroke="${INK}" stroke-width="3"/><path d="M1070 520 v-24 h32 v24 Z" fill="#e8c9a0" stroke="${INK}" stroke-width="2"/><circle cx="1086" cy="456" r="22" fill="#d9a06b" stroke="${INK}" stroke-width="3"/><path d="M1064 452 q22 -30 44 0 q-22 -12 -44 0 Z" fill="#3a2414" stroke="${INK}" stroke-width="2"/><circle cx="1078" cy="458" r="2.6" fill="${INK}"/><circle cx="1094" cy="458" r="2.6" fill="${INK}"/><path d="M1078 467 q8 7 16 0" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/></g>
    <rect x="925" y="516" width="216" height="86" fill="#e9dcc0" stroke="${INK}" stroke-width="3"/><rect x="918" y="504" width="230" height="16" rx="4" fill="#f7ecd4" stroke="${INK}" stroke-width="3"/>${loaf(958, 492, 17)}${loaf(1000, 492, 17)}${loaf(979, 474, 15)}
    <path d="M1160 602 V500 A66 66 0 0 1 1292 500 V602 Z" fill="#c9683c" stroke="${INK}" stroke-width="3"/><path d="M1168 520 H1284 M1162 552 H1290 M1162 580 H1290 M1200 500 V520 M1250 500 V520 M1180 520 V552 M1226 520 V552 M1270 520 V552" stroke="#8f3f1f" stroke-width="2" opacity=".7"/>
    <path d="M1194 602 V548 A32 32 0 0 1 1258 548 V602 Z" fill="#3a2414" stroke="${INK}" stroke-width="3"/><path d="M1206 600 q6 -26 16 -12 q4 -22 14 -2 q8 -12 10 14 Z" fill="#ff9a3c" stroke="#e25c12" stroke-width="2"/><ellipse cx="1226" cy="598" rx="24" ry="6" fill="#ffd66b" opacity=".8"/>
    <g fill="#fff" opacity=".75"><circle cx="1228" cy="238" r="12"/><circle cx="1246" cy="214" r="15"/><circle cx="1232" cy="186" r="18"/></g></g>
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

  /* ---------- screens ---------- */
  const HTML = `<section id="screen-time" class="screen" aria-label="The Time Machine">
  <div class="screen-top"><button type="button" class="btn-back" id="tmBack">← Back</button><h1 class="screen-title">🕰️ The Time Machine</h1></div>
  <div id="tmBody"></div></section>`;

  function stampHTML(p, big){ const got = !!p.rome.stamp; return `<span class="tm-stamp ${got ? 'got' : ''} ${big ? 'big' : ''}" role="img" aria-label="${got ? 'Passport stamp earned: Ancient Rome' : 'Passport stamp for Ancient Rome, not earned yet'}"><b>ROMA</b><i>${got ? '★ explorer ★' : 'not yet'}</i></span>`; }

  function homeHTML(){
    const p = pass();
    return `<div class="me-card tm-home"><div class="fab-say"><span class="fab-char bell" role="img" aria-label="Miss Bell"></span><div class="bubble"><b>Where shall we go?</b>Choose a time and place. We’ll walk down a street, meet someone who lives there, and collect a stamp for your passport.</div></div>
      <div class="tm-eras">${ERAS.map(e => `<button type="button" class="tm-era ${e.open ? '' : 'soon'}" ${e.open ? `data-tm="era" data-id="${e.id}"` : 'disabled'}><span class="tm-era-e" aria-hidden="true">${e.e}</span><b>${h(e.n)}</b><small>${h(e.when)}</small>${e.open ? '<span class="tm-go">Step in ➡️</span>' : '<span class="tm-soon">Coming soon</span>'}</button>`).join('')}</div>
      <div class="tm-passport"><b>🛂 My passport</b>${stampHTML(p)}<span>${p.rome.stamp ? 'You earned the Ancient Rome stamp!' : 'Finish the three Rome missions to earn your first stamp.'}</span></div></div>`;
  }

  function tabsHTML(p){
    const tab = (k, label) => `<button type="button" class="pill-choice ${V.tab === k ? 'selected' : ''}" data-tm="tab" data-id="${k}" aria-pressed="${V.tab === k}">${label}</button>`;
    return `<div class="tm-tabs">${tab('explore', '🔎 Explore')}${tab('missions', `🎯 Missions <small>${p.rome.m.length}/3</small>`)}${tab('marcus', '🗣️ Meet Marcus')}<span class="tm-found" role="status">Found ${p.rome.seen.length} of ${SPOTS.length}</span><button type="button" class="pill-choice tm-stopbtn" data-tm="stop">🌙 Stop here</button></div>`;
  }
  function exploreHTML(){
    const s = SPOTS.find(x => x.id === V.hot);
    if(!s) return `<div class="fab-say"><span class="fab-char bell" role="img" aria-label="Miss Bell"></span><div class="bubble"><b>Welcome to a Roman street!</b>This is a town about 2,000 years ago. Tap a glowing circle to look closer. Use the arrows to walk along the street.</div></div>`;
    return `<div class="fab-say"><span class="fab-char bell" role="img" aria-label="Miss Bell"></span><div class="bubble"><b><span aria-hidden="true">${s.e}</span> ${h(s.n)}</b><span id="tmFact">${h(s.t)}</span><span class="tm-know">💡 ${h(s.k)}</span></div></div>
      <div class="choice-row tm-row">${window.speechSynthesis ? '<button type="button" class="btn small soft" data-tm="say">🔊 Read it to me</button>' : ''}<button type="button" class="btn small leaf" data-tm="nexthot">Next along the street ➡️</button></div>${V.flash ? `<p class="tm-yes" role="status">${h(V.flash)}</p>` : ''}`;
  }
  function missionsHTML(p){
    const done = k => p.rome.m.includes(k);
    if(V.act === 'sort') return sortHTML();
    if(V.act === 'match') return matchHTML();
    const all = p.rome.m.length >= 3;
    const head = all ? `<div class="fab-say"><span class="fab-char elder" role="img" aria-label="Mr Elder, the head teacher"></span><div class="bubble"><b>All three missions done. You’ve earned your Rome stamp!</b><span class="tm-stamprow">${stampHTML(p, true)}<span>A gem and your stars are waiting in Fab Fox World.</span></span></div></div>`
      : `<div class="fab-say"><span class="fab-char fab" role="img" aria-label="Fab"></span><div class="bubble"><b>Three missions, in any order</b>Each one earns 2 stars. Do all three for your passport stamp. You can stop after any of them.</div></div>`;
    return `${head}<ol class="tm-missions">
      <li class="tm-mis ${done(1) ? 'done' : ''}"><b>1. Find three things</b><span>Find them in the street and tap them: ${FIND.map(id => { const s = SPOTS.find(x => x.id === id); return `<span class="tm-chip ${p.rome.seen.includes(id) ? 'got' : ''}">${s.e} ${h(s.n.replace(/^The /, ''))}</span>`; }).join(' ')}</span>${done(1) ? '<em>⭐ Done</em>' : '<button type="button" class="btn small soft" data-tm="tab" data-id="explore">Go and look</button>'}</li>
      <li class="tm-mis ${done(2) ? 'done' : ''}"><b>2. Then or not yet?</b><span>Which things did the Romans have?</span>${done(2) ? '<em>⭐ Done</em>' : ''}<button type="button" class="btn small ${done(2) ? 'soft' : 'leaf'}" data-tm="act" data-id="sort">${done(2) ? 'Play again' : 'Start'}</button></li>
      <li class="tm-mis ${done(3) ? 'done' : ''}"><b>3. What is it for?</b><span>Match each Roman thing to its job.</span>${done(3) ? '<em>⭐ Done</em>' : ''}<button type="button" class="btn small ${done(3) ? 'soft' : 'leaf'}" data-tm="act" data-id="match">${done(3) ? 'Play again' : 'Start'}</button></li></ol>`;
  }
  function noteHTML(){
    const n = V.note; if(!n) return '<div class="tm-notebox" aria-live="polite"></div>';
    if(n.k === 'win') return `<div class="tm-notebox" aria-live="polite"><div class="fab-say"><span class="fab-char elder" role="img" aria-label="Mr Elder, the head teacher"></span><div class="bubble"><b>${h(n.h)}</b>${h(n.t)}</div></div></div>`;
    if(n.k === 'fix') return `<div class="tm-notebox" aria-live="polite"><div class="fab-say doc"><span class="fab-char doc" role="img" aria-label="Doctor McPhee"></span><div class="bubble"><b>${h(n.h)}</b>${h(n.t)}</div></div></div>`;
    return `<div class="tm-notebox" aria-live="polite"><p class="tm-yes">${h(n.t)}</p></div>`;
  }
  function sortHTML(){
    const S = V.sort, left = S.order.filter(id => !(id in S.placed));
    const item = id => { const it = SORT.find(x => x.id === id); return `<button type="button" class="tm-item ${S.sel === id ? 'sel' : ''}" data-tm="pick" data-id="${id}"><span aria-hidden="true">${it.e}</span>${h(it.n)}</button>`; };
    const bin = (k, label, sub) => `<button type="button" class="tm-bin" data-tm="bin" data-id="${k}"><b>${label}</b><small>${sub}</small><span class="tm-in">${S.order.filter(id => S.placed[id] === k).map(id => { const it = SORT.find(x => x.id === id); return `<i title="${h(it.n)}">${it.e}</i>`; }).join('')}</span></button>`;
    return `<div class="tm-act"><div class="tm-act-head"><b>🎯 Then or not yet?</b><span>${left.length ? 'Tap a thing, then tap where it belongs.' : ''}</span><button type="button" class="btn small soft" data-tm="act" data-id="">⬅️ Missions</button></div>
      <div class="tm-tray">${left.map(item).join('') || '<span class="tm-alldone">Everything is sorted!</span>'}</div>
      <div class="tm-bins">${bin('then', '🏛️ The Romans had it', 'about 2,000 years ago')}${bin('now', '⏳ Not invented yet', 'it came much later')}</div>${noteHTML()}</div>`;
  }
  function matchHTML(){
    const M = V.match;
    const obj = it => `<button type="button" class="tm-item ${M.sel === it.id ? 'sel' : ''} ${M.done.includes(it.id) ? 'ok' : ''}" data-tm="mobj" data-id="${it.id}" ${M.done.includes(it.id) ? 'disabled' : ''}><span aria-hidden="true">${it.e}</span>${h(it.n)}</button>`;
    const use = id => { const it = MATCH.find(x => x.id === id); return `<button type="button" class="tm-use ${M.done.includes(id) ? 'ok' : ''}" data-tm="muse" data-id="${id}" ${M.done.includes(id) ? 'disabled' : ''}>${M.done.includes(id) ? '<span aria-hidden="true">' + it.e + '</span> ' : ''}for ${h(it.use)}</button>`; };
    return `<div class="tm-act"><div class="tm-act-head"><b>🎯 What is it for?</b><span>${M.done.length < MATCH.length ? 'Tap a Roman thing, then tap its job.' : ''}</span><button type="button" class="btn small soft" data-tm="act" data-id="">⬅️ Missions</button></div>
      <div class="tm-match"><div class="tm-col">${MATCH.map(obj).join('')}</div><div class="tm-col">${M.uses.map(use).join('')}</div></div>${noteHTML()}</div>`;
  }
  function marcusHTML(p){
    const cur = MARCUS.find(x => x.id === V.ask);
    return `<div class="tm-marcus"><div class="tm-marcus-say"><svg class="tm-face" viewBox="0 0 120 130" role="img" aria-label="Marcus, a Roman baker"><path d="M22 130 v-34 q38 -30 76 0 v34 Z" fill="#fff3dc" stroke="${INK}" stroke-width="4"/><circle cx="60" cy="56" r="34" fill="#d9a06b" stroke="${INK}" stroke-width="4"/><path d="M26 50 q34 -46 68 0 q-34 -18 -68 0 Z" fill="#3a2414" stroke="${INK}" stroke-width="3"/><circle cx="48" cy="58" r="4" fill="${INK}"/><circle cx="72" cy="58" r="4" fill="${INK}"/><path d="M46 72 q14 12 28 0" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/></svg>
      <div class="bubble"><b>${cur ? h(cur.q) : 'Salve! That means hello.'}</b><span id="tmAnswer">${cur ? h(cur.a) : 'I am Marcus, the baker on this street. Tap a question and I will tell you about my life.'}</span></div></div>
      <div class="tm-qs" role="group" aria-label="Questions to ask Marcus">${MARCUS.map(m => `<button type="button" class="tm-q ${p.rome.asked.includes(m.id) ? 'asked' : ''} ${V.ask === m.id ? 'sel' : ''}" data-tm="ask" data-id="${m.id}">${h(m.q)}</button>`).join('')}</div>
      ${cur && window.speechSynthesis ? '<div class="choice-row tm-row"><button type="button" class="btn small soft" data-tm="sayans">🔊 Hear it again</button></div>' : ''}
      ${p.rome.chat ? '<p class="tm-yes">⭐ You asked great questions. That earned a star.</p>' : '<p class="hint">Ask three questions to earn a star. Marcus is a made-up baker. His answers come from what we know about Roman towns.</p>'}</div>`;
  }
  function stopHTML(){
    return `<div class="me-card"><div class="fab-say"><span class="fab-char lark" role="img" aria-label="Mrs Lark"></span><div class="bubble"><b>A lovely place to stop.</b>Everything you found is saved in your passport, and your stars are on their way to Fab Fox World. The street will be here next time.</div></div>
      <div class="choice-row"><button type="button" class="btn leaf" data-tm="leave">Finish for now</button><button type="button" class="btn soft" data-tm="unstop">Keep exploring</button></div></div>`;
  }
  function teachHTML(){
    return `<details class="tm-teach"><summary>🧑‍🏫 For teachers: check before use, links and what’s next</summary>
      <ul><li><b>Draft to check.</b> Every fact and Marcus’s answers are a first draft for a teacher to check before children use this world.</li>
      <li><b>Curriculum.</b> Supports KS2 history: the Roman Empire and its impact on Britain. Check the wording against the National Curriculum programme of study.</li>
      <li><b>Kept gentle.</b> This street leaves out gladiators, slavery and the eruption of Vesuvius. Plan those as teacher-led topics, with a gentler path for any child who needs one.</li>
      <li><b>Practise it.</b> <button type="button" class="btn small soft" data-tm="pack" data-id="history-flightpath-y34" data-step="3">History flightpath: The Romans arrive in Britain</button> <button type="button" class="btn small soft" data-tm="pack" data-id="maths-flightpath-measurement" data-step="15">Maths flightpath: Roman numerals</button></li>
      <li><b>See it for real (teacher-led).</b> Open these yourself first, then share your screen: <a href="https://artsandculture.google.com/story/0QWRsKx1-N2-tA" target="_blank" rel="noopener">Google Arts &amp; Culture: views of Ancient Pompeii</a> · <a href="https://artsandculture.google.com/story/9QUhljZkpHwbJw" target="_blank" rel="noopener">Ancient Roman sites</a>. Pompeii’s story includes the eruption, so decide what to show.</li>
      <li><b>No typing, no AI chat.</b> Children only tap questions. Marcus’s answers are fixed scripts.</li></ul></details>`;
  }
  function panelHTML(){
    const p = pass();
    if(V.stop) return stopHTML();
    return tabsHTML(p) + `<div class="me-card tm-panel">${V.tab === 'missions' ? missionsHTML(p) : V.tab === 'marcus' ? marcusHTML(p) : exploreHTML()}</div>` + teachHTML();
  }

  function render(){
    const box = q1('#tmBody'); if(!box) return;
    if(V.era !== 'rome'){ box.innerHTML = homeHTML(); return; }
    if(!q1('#tmStreet')){
      box.innerHTML = `<div class="tm-streetwrap"><button type="button" class="tm-arrow l" data-tm="scroll" data-id="-1" aria-label="Walk left along the street">◀</button>
        <div class="tm-street" id="tmStreet" tabindex="0" aria-label="The Roman street. Use the arrow buttons or swipe to walk along it."><div class="tm-inner">${street()}${SPOTS.map(s => `<button type="button" class="tm-spot" data-tm="spot" data-id="${s.id}" style="left:${(s.x / 24).toFixed(2)}%;top:${(s.y / 8).toFixed(2)}%" aria-label="Look closer: ${h(s.n)}"><span aria-hidden="true"></span></button>`).join('')}
          <button type="button" class="tm-spot tm-person" data-tm="tab" data-id="marcus" style="left:${(1132 / 24).toFixed(2)}%;top:${(418 / 8).toFixed(2)}%" aria-label="Meet Marcus the baker"><span aria-hidden="true">🗣️</span></button></div></div>
        <button type="button" class="tm-arrow r" data-tm="scroll" data-id="1" aria-label="Walk right along the street">▶</button></div><div id="tmPanel"></div>`;
    }
    const p = pass();
    box.querySelectorAll('.tm-spot[data-tm="spot"]').forEach(b => { b.classList.toggle('seen', p.rome.seen.includes(b.dataset.id)); b.classList.toggle('on', V.hot === b.dataset.id && V.tab === 'explore'); });
    q1('#tmPanel').innerHTML = panelHTML();
  }

  function scrollToSpot(id){
    const st = q1('#tmStreet'), b = st && st.querySelector(`.tm-spot[data-id="${id}"]`); if(!b) return;
    const x = b.offsetLeft - st.clientWidth / 2;
    try{ st.scrollTo({ left:Math.max(0, x), behavior:'smooth' }); }catch(e){ st.scrollLeft = Math.max(0, x); }
  }
  function missionDone(k, p){
    if(p.rome.m.includes(k)) return false;
    p.rome.m.push(k); award(2);
    if(p.rome.m.length >= 3 && !p.rome.stamp){ p.rome.stamp = Date.now(); try{ fabWorldTreasure('💎'); }catch(e){} try{ FabImpact.log('explore', 'rome-stamp'); }catch(e){} }
    savePass(p); snd('jingle'); return true;
  }
  function see(id){
    const p = pass(), s = SPOTS.find(x => x.id === id); if(!s) return;
    V.hot = id; V.tab = 'explore'; V.act = null; V.note = null;
    if(!p.rome.seen.includes(id)){ p.rome.seen.push(id); savePass(p); snd('ding'); } else snd('tick');
    if(FIND.every(f => p.rome.seen.includes(f)) && missionDone(1, p)) V.flash = '⭐ You found all three things! Mission 1 is done, and 2 stars are on their way to Fab Fox World.';
  }
  function openPack(id, step){
    const pack = (typeof Learn !== 'undefined' ? Learn.all() : []).find(x => x.id === id); if(!pack) return;
    const i = pack.screens.findIndex(s => s.type === 'pathway');
    learnOpen(pack);
    if(i >= 0){ Learn.step = i; const st = Learn.state[i] = Learn.state[i] || {}; if(!(st.kids && st.kids[pwMe()])) pwStart(pack.screens[i], st, pwMe(), Math.min(step, pack.screens[i].steps.length - 1)); learnRender(); }
  }
  function leave(){
    try{ window.speechSynthesis && window.speechSynthesis.cancel(); }catch(e){}
    const b = V.back || 'screen-learn'; V.stop = false;
    showScreen(b);
    if(b === 'screen-world'){ try{ const wf = document.querySelector('iframe[data-game="world"]'); if(wf && wf.contentWindow){ wf.contentWindow.postMessage('fabworld-wake', '*'); wf.contentWindow.postMessage('fabworld-refresh', '*'); } }catch(e){} }
  }

  function onClick(e){
    const b = e.target.closest('[data-tm]'); if(!b) return;
    const a = b.dataset.tm, id = b.dataset.id, p = pass(); V.flash = '';
    if(a === 'era'){ V.era = id; V.tab = 'explore'; V.hot = null; V.act = null; V.note = null; snd('jingle'); const body = q1('#tmBody'); body.innerHTML = ''; render(); return; }
    if(a === 'scroll'){ const st = q1('#tmStreet'); if(st){ const d = Number(id) * st.clientWidth * .6; try{ st.scrollBy({ left:d, behavior:'smooth' }); }catch(err){ st.scrollLeft += d; } } return; }
    if(a === 'spot'){ see(id); render(); const pn = q1('#tmPanel'); if(pn) try{ pn.scrollIntoView({ block:'nearest', behavior:'smooth' }); }catch(err){} return; }
    if(a === 'tab'){ V.tab = id; V.act = null; V.note = null; if(id === 'marcus') scrollToSpot('bakery'); snd('tick'); render(); return; }
    if(a === 'say'){ const s = SPOTS.find(x => x.id === V.hot); if(s && window.fabReadAloud) fabReadAloud(s.n + '. ' + s.t + ' ' + s.k); return; }
    if(a === 'nexthot'){ const i = SPOTS.findIndex(x => x.id === V.hot), n = SPOTS[(i + 1) % SPOTS.length]; see(n.id); render(); scrollToSpot(n.id); return; }
    if(a === 'act'){
      V.act = id || null; V.note = null;
      if(id === 'sort') V.sort = { order:shuffle(SORT.map(x => x.id)), placed:{}, sel:null };
      if(id === 'match') V.match = { uses:shuffle(MATCH.map(x => x.id)), done:[], sel:null };
      snd('tick'); render(); return; }
    if(a === 'pick'){ V.sort.sel = V.sort.sel === id ? null : id; V.note = null; snd('tick'); render(); return; }
    if(a === 'bin'){
      const S = V.sort; if(!S.sel){ V.note = { k:'say', t:'Tap one of the things first.' }; render(); return; }
      const it = SORT.find(x => x.id === S.sel);
      if((id === 'then') === it.then){ S.placed[it.id] = id; S.sel = null; V.note = { k:'say', t:'Yes! ' + it.tip }; snd('ding');
        if(Object.keys(S.placed).length === SORT.length){ const first = missionDone(2, p); V.note = { k:'win', h:'Sorted, every one!', t:first ? 'That earned 2 stars for Fab Fox World.' : 'You know your Romans.' }; } }
      else { S.sel = null; V.note = { k:'fix', h:'Not that one. Have another think.', t:it.tip }; snd('gentle'); }
      render(); return; }
    if(a === 'mobj'){ V.match.sel = V.match.sel === id ? null : id; V.note = null; snd('tick'); render(); return; }
    if(a === 'muse'){
      const M = V.match; if(!M.sel){ V.note = { k:'say', t:'Tap a Roman thing first.' }; render(); return; }
      const it = MATCH.find(x => x.id === M.sel);
      if(M.sel === id){ M.done.push(id); M.sel = null; V.note = { k:'say', t:'Yes! ' + it.n.charAt(0).toUpperCase() + it.n.slice(1) + ' is for ' + it.use + '.' }; snd('ding');
        if(M.done.length === MATCH.length){ const first = missionDone(3, p); V.note = { k:'win', h:'Every one matched!', t:first ? 'That earned 2 stars for Fab Fox World.' : 'Brilliant matching.' }; } }
      else { M.sel = null; V.note = { k:'fix', h:'Not quite. Try a different job.', t:'Think about what ' + it.n + ' looks like, and where you saw it in the street.' }; snd('gentle'); }
      render(); return; }
    if(a === 'ask'){
      V.ask = id; const m = MARCUS.find(x => x.id === id);
      if(!p.rome.asked.includes(id)){ p.rome.asked.push(id); if(p.rome.asked.length >= 3 && !p.rome.chat){ p.rome.chat = 1; award(1); snd('jingle'); } else snd('tick'); savePass(p); } else snd('tick');
      render(); if(m && window.fabReadAloud) fabReadAloud(m.a); return; }
    if(a === 'sayans'){ const m = MARCUS.find(x => x.id === V.ask); if(m && window.fabReadAloud) fabReadAloud(m.a); return; }
    if(a === 'stop'){ V.stop = true; snd('gentle'); render(); return; }
    if(a === 'unstop'){ V.stop = false; snd('tick'); render(); return; }
    if(a === 'leave'){ leave(); return; }
    if(a === 'pack'){ openPack(id, Number(b.dataset.step) || 0); return; }
  }

  function open(back){
    if(!q1('#screen-time')) return false;
    V.back = back || 'screen-learn'; V.stop = false; V.note = null;
    if(V.back === 'screen-world'){ try{ fabWorldFull(false); }catch(e){} try{ const wf = document.querySelector('iframe[data-game="world"]'); wf && wf.contentWindow && wf.contentWindow.postMessage('fabworld-sleep', '*'); }catch(e){} }
    showScreen('screen-time'); const body = q1('#tmBody'); if(body && V.era !== 'rome') body.innerHTML = ''; render();
    return true;
  }

  const CSS = `
body:has(#screen-time.active) main{max-width:1240px}
.tm-eras{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px;margin:14px 0}
.tm-era{display:flex;flex-direction:column;align-items:flex-start;gap:4px;text-align:left;background:#fff;border:3px solid var(--ink,#2B1A12);border-radius:20px;padding:14px;font:inherit;color:var(--ink,#2B1A12);cursor:pointer;min-height:150px;box-shadow:0 4px 0 rgba(43,26,18,.16)}
.tm-era:hover,.tm-era:focus-visible{background:var(--sunshine,#FFD483);outline:none}
.tm-era.soon{opacity:.6;cursor:default;border-style:dashed;box-shadow:none}
.tm-era-e{font-size:2.6rem;line-height:1}.tm-era b{font-family:var(--disp);font-size:var(--t-lead,1.2rem)}.tm-era small{font-size:var(--t-small,.95rem);opacity:.85}
.tm-go{margin-top:auto;font-weight:700;color:var(--flame-dark,#C93C00)}.tm-soon{margin-top:auto;font-weight:700;opacity:.8}
.tm-passport{display:flex;flex-wrap:wrap;align-items:center;gap:12px;background:#fffdf6;border-radius:16px;padding:10px 14px}
.tm-stamp{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;width:92px;height:92px;border-radius:50%;border:4px dashed #b9a781;color:#b9a781;transform:rotate(-8deg);font-family:var(--disp);line-height:1.05;text-align:center;flex:none;background:#fff}
.tm-stamp b{font-size:1.2rem;letter-spacing:2px}.tm-stamp i{font-style:normal;font-size:.68rem;font-family:var(--body)}
.tm-stamp.got{border:4px double var(--flame-dark,#C93C00);color:var(--flame-dark,#C93C00);box-shadow:inset 0 0 0 4px rgba(254,77,2,.12)}
.tm-stamp.big{margin:6px 0 2px}
.tm-stamprow{display:flex;align-items:center;gap:14px}
.tm-streetwrap{position:relative;border:4px solid var(--ink,#2B1A12);border-radius:24px;overflow:hidden;background:#fdf3dc;box-shadow:0 5px 0 rgba(43,26,18,.16)}
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
.tm-notebox{min-height:10px;margin-top:10px}.tm-yes{margin:0;background:#e8f6dc;border-radius:12px;padding:8px 12px;font-weight:700}
.tm-marcus-say{display:flex;gap:12px;align-items:flex-start}.tm-face{width:92px;flex:none}
.tm-marcus-say .bubble{background:#fff;border:3px solid var(--ink,#2B1A12);border-radius:18px;padding:10px 14px;flex:1;font-size:var(--t-lead,1.12rem)}
.tm-qs{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 6px}
.tm-q{border:3px solid var(--ink,#2B1A12);background:var(--cream,#FFF6E6);border-radius:999px;padding:8px 16px;font:700 var(--t-body,1.05rem) var(--body,Aleo),Georgia,serif;color:var(--ink,#2B1A12);cursor:pointer;min-height:52px}
.tm-q.asked{background:#eef7e6}.tm-q.asked::after{content:' ✓'}.tm-q.sel{background:var(--sunshine,#FFD483)}
.tm-teach{background:var(--cream,#FFF6E6);border:2px dashed var(--cream-deep,#f0dfbd);border-radius:16px;padding:10px 14px;margin-top:12px}
.tm-teach summary{font-weight:700;cursor:pointer}.tm-teach li{margin:6px 0}
@media (max-width:640px){.tm-bins,.tm-match{grid-template-columns:1fr}.tm-arrow{width:46px;height:60px}.tm-found{margin-left:0}}
@media (prefers-reduced-motion:reduce){.tm-spot{animation:none}}
`;

  function init(){
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const main = q1('main'); if(main && !q1('#screen-time')) main.insertAdjacentHTML('beforeend', HTML);
    const scr = q1('#screen-time'); if(!scr) return;
    scr.addEventListener('click', onClick);
    q1('#tmBack').addEventListener('click', () => { snd('tick'); if(V.stop){ V.stop = false; render(); return; } if(V.era){ if(V.act){ V.act = null; V.note = null; render(); return; } V.era = null; q1('#tmBody').innerHTML = ''; render(); return; } leave(); });
    scr.addEventListener('keydown', e => { const stt = e.target.closest && e.target.closest('#tmStreet'); if(!stt) return; if(e.key === 'ArrowRight'){ stt.scrollBy({ left:160 }); e.preventDefault(); } if(e.key === 'ArrowLeft'){ stt.scrollBy({ left:-160 }); e.preventDefault(); } });
    const tools = q1('#learnTools');
    if(tools && !q1('#learnTimeBtn')){ tools.insertAdjacentHTML('beforeend', '<button type="button" class="lt-card" id="learnTimeBtn"><i aria-hidden="true">🕰️</i><b>Time Machine</b><span>Walk down a street in Ancient Rome</span></button>'); q1('#learnTimeBtn').addEventListener('click', () => { snd('tick'); open('screen-learn'); }); }
  }
  window.fabOpenTime = open;
  window.FabTime = { open, state:V, pass, SPOTS, MARCUS, SORT, MATCH };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
