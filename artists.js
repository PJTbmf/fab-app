/* ============ 🎨 The Art Gallery: artists and styles ============
   Patrick, 28 Nov: "I want to extend the World Explorers out to Art ... different artistic styles, impressions and figures, i.e. Frida
   Kahlo, Antoni Gaudí, Banksy, Stephen Wiltshire ... feature paintings for their fame, i.e. The Scream and Van Gogh's Sunflowers.
   My thinking is that this area could teach and give tips. Our Make More Fab boxes could, over the course of the year, dispatch
   resources that would support the children ... Children can do their real life art."

   Six rooms. Each room is one short lesson in the usual shape:
     1 Meet (I do)            who, when, where, and three things to look for
     2 Spot the style (we do) three gentle either/or choices; a wrong tap gets a tip, never a cross; Fab can show the answer
     3 Make it (you do)       on screen in the Make More FAB Studio, or for real with things from the Make More FAB box, or both
     4 My gallery card        a finished page with the child's own title and sentence, to keep and print
   Every step is a place to stop. A made piece shows in the Burrow's "Things I made" and ticks off set work.

   What the app does NOT hold: any picture of an artwork or of an artist. Each room has a small "style swatch" drawn by the app to
   show the technique, and links, for teachers, to the museum that holds the real thing (British where there is one; Barcelona for
   Gaudí). Banksy and Stephen Wiltshire are living artists: their rooms teach "in the style of" and nothing is copied.
   Kept gentle: illness, death and the hard parts of the artists' lives are left out of the child's page and flagged to the teacher.
   Saved on this device only (fab-art-<Fab code>). Nothing is sent anywhere. Every fact is a draft for a teacher to check.
   window.FabArt */
(() => {
  'use strict';
  const q1 = s => document.querySelector(s);
  const h = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const code = () => { try{ return fabLearnerCode() || 'local'; }catch(e){ return 'local'; } };
  const KEY = () => 'fab-art-' + code();
  const load = () => { try{ return JSON.parse(localStorage.getItem(KEY()) || '{}') || {}; }catch(e){ return {}; } };
  const save = d => { try{ localStorage.setItem(KEY(), JSON.stringify(d)); }catch(e){} };
  const snd = k => { try{ window.FabExplore.snd(k); }catch(e){} };
  const clean = (s, n) => String(s == null ? '' : s).replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
  const INK = '#2B1A12';
  const BOX = 'Watercolours, a brush, a white crayon and paper';

  /* ---------- the rooms (plain data; drafts for a teacher to check) ---------- */
  const ROOMS = [
    { id:'vangogh', n:'Vincent van Gogh', short:'Van Gogh', e:'🌻', work:'Sunflowers', tag:'Thick paint and bold brush marks', mine:'My sunflowers',
      about:['Vincent van Gogh was a painter from the Netherlands. He lived about 140 years ago.', 'He painted Sunflowers in 1888, in the south of France, to brighten a room for a friend who was coming to stay.', 'The real painting hangs in the National Gallery in London.'],
      look:['Thick paint that stands up from the canvas', 'Short brush marks you can see, going different ways', 'Lots of different yellows, with a little green and blue'],
      spot:[['Short, thick dabs of paint', 'Paint so smooth you cannot see a brush mark', 'Van Gogh wanted you to see every brush mark.'], ['Many yellows side by side', 'Only black and white', 'His sunflowers glow because he used so many yellows.'], ['Flowers in a simple vase', 'A city full of tiny windows', 'Van Gogh painted everyday things, like flowers, a chair and his bedroom.']],
      screen:'In the style of Van Gogh: paint a vase of flowers with short dabs. Use three different yellows.',
      real:{ need:BOX, steps:['Draw big flower heads and a vase with the white crayon. Press hard. You will hardly see it yet!', 'Paint over the flowers with your lightest yellow. The crayon lines stay white.', 'Dab on a darker yellow and a little orange while the paint is still damp.', 'Paint the vase and the table. Leave the background until last.'], low:'Paint just one big sunflower.' },
      word:['brush mark', 'the shape a brush leaves behind'], starters:['I used short dabs like Van Gogh.', 'I mixed lots of yellows.', 'My favourite part is'],
      teach:['<b>The painting.</b> Sunflowers (1888) is in the National Gallery, London. The painting is out of copyright, but the Gallery’s photograph has its own terms, so show it from the Gallery’s page rather than copying it.', '<b>Kept gentle.</b> The room stays with the painting. Van Gogh’s illness and death are left out.'],
      links:[['National Gallery, London: Sunflowers', 'https://www.nationalgallery.org.uk/paintings/vincent-van-gogh-sunflowers']] },
    { id:'munch', n:'Edvard Munch', short:'Munch', e:'🌀', work:'The Scream', tag:'Lines and colours that show a feeling', mine:'My feeling sky',
      about:['Edvard Munch was a painter from Norway. He painted The Scream in 1893.', 'He wanted to show what a big feeling is like, not just what a place looks like. Art like this is called Expressionism.', 'The picture shows a big, wobbly feeling. Everybody has big feelings sometimes, and art is one way to let them out.'],
      look:['Wavy, swirling lines', 'Strong colours chosen for a feeling, not to look real', 'Simple shapes with very little detail'],
      spot:[['Swirling, wavy lines', 'Neat, straight lines drawn with a ruler', 'Munch let his lines wobble and swirl to show a feeling.'], ['A sky in colours that match a feeling', 'A sky that is always plain blue', 'An Expressionist chooses colours for the feeling.'], ['Simple shapes', 'Hundreds of tiny details', 'Munch kept his shapes simple, so the feeling comes first.']],
      screen:'In the style of Munch: choose a feeling, like calm, excited or grumpy. Paint a sky with wavy lines in colours that match it.',
      real:{ need:BOX, steps:['Choose a feeling. Calm? Excited? Grumpy? Any feeling is fine.', 'Draw wavy lines across your paper with the white crayon.', 'Wet the paper, then sweep on colours that match your feeling. Watch the wavy lines appear.', 'Add a simple hill, a path or some water at the bottom.'], low:'Paint just the sky.' },
      word:['Expressionism', 'art that shows a feeling more than how things really look'], starters:['My sky feels', 'I chose these colours because', 'I used wavy lines like Munch.'],
      teach:['<b>Handle with care.</b> The Scream shows worry. The child’s page says only that it shows “a big, wobbly feeling”, and the child chooses any feeling to paint, calm ones included. Please don’t ask a child to paint their own worries; if a child chooses to, follow your usual wellbeing approach.', '<b>The painting.</b> The 1893 version is in the National Museum of Norway in Oslo, and another is in the Munch Museum there. Munch’s work is out of copyright. No British museum holds the painting, so these links go to Oslo.'],
      links:[['National Museum of Norway: The Scream', 'https://www.nasjonalmuseet.no/en/collection/object/NG.M.00939'], ['Munch Museum: photos of Munch’s art', 'https://www.munchmuseet.no/en/our-collection/photos-of-edvard-munchs-art']] },
    { id:'kahlo', n:'Frida Kahlo', short:'Frida Kahlo', e:'🌺', work:'Self-portraits', tag:'Portraits full of the things she loved', mine:'My portrait',
      about:['Frida Kahlo was a painter from Mexico. She was born in 1907.', 'She painted many self-portraits. A self-portrait is a picture an artist makes of themselves.', 'Around herself she painted things she loved: bright flowers, big green leaves and her pets, which included monkeys and parrots.'],
      look:['The artist herself, looking straight out at you', 'Leaves, flowers and animals all around her', 'Bold, bright colours and traditional Mexican clothes'],
      spot:[['A portrait with pets and plants all around', 'A portrait with a plain grey background', 'Kahlo filled the space around her with things she loved.'], ['Bold, bright colours', 'Only pale, faded colours', 'Her colours are strong and bright.'], ['A picture that tells you about the artist', 'A picture of an empty street', 'A self-portrait tells you who the artist is and what matters to them.']],
      screen:'In the style of Frida Kahlo: draw yourself, or Fab Fox if you prefer, in the middle. All around, add things you love: a pet, a plant, a favourite toy.',
      real:{ need:BOX, steps:['Draw a big oval in the middle for a face: yours, or Fab Fox’s if you prefer.', 'With the white crayon, draw the veins on big leaves all around the edge.', 'Paint the leaves green. The veins stay white!', 'Add two or three things you love, then finish the portrait.'], low:'Paint a frame of leaves and flowers, and leave the middle for another day.' },
      word:['self-portrait', 'a picture an artist makes of themselves'], starters:['I put this in my picture because I love it:', 'I used bold colours like Frida Kahlo.', 'The leaves were fun because'],
      teach:['<b>Handle with care.</b> Kahlo was unwell for much of her life and often painted from her bed. That is left out of the child’s page. For some children it may be a comfort to hear; for others it is too close to home. Share it only if you judge it right for your group.', '<b>Self-portraits.</b> A child may not want to draw themselves at the moment, so the room always offers Fab Fox instead.', '<b>The paintings.</b> Kahlo died in 1954, so her work has been out of copyright in the UK since January 2025. Elsewhere a trust still manages it, and photographs of the paintings have their own terms, so nothing is copied into the app. The Museo Frida Kahlo in Mexico City was her home.'],
      links:[['Museo Frida Kahlo, Mexico City', 'https://www.museofridakahlo.org.mx/?lang=en']] },
    { id:'gaudi', n:'Antoni Gaudí', short:'Gaudí', e:'🦎', work:'Park Güell', tag:'Curvy buildings covered in broken-tile mosaic', mine:'My mosaic creature',
      about:['Antoni Gaudí was an architect from Catalonia, in Spain. An architect designs buildings.', 'He worked in the city of Barcelona more than 100 years ago. His buildings curve like waves, trees and shells.', 'In Park Güell he covered benches, roofs and a famous dragon in trencadís: mosaic made from broken tiles.'],
      look:['Curves instead of straight lines', 'Shapes borrowed from nature: waves, bones, leaves and shells', 'Bright mosaic made from broken tiles, called trencadís'],
      spot:[['A wavy roof like a dragon’s back', 'A plain box with a flat roof', 'Gaudí copied the curves he saw in nature.'], ['Mosaic made from broken tiles', 'Wallpaper with printed stripes', 'Trencadís is mosaic made from broken tiles. Gaudí used it everywhere.'], ['Pillars shaped like tree trunks', 'Plain square posts', 'Gaudí borrowed his shapes from trees, shells and bones.']],
      screen:'In the style of Gaudí: draw a curvy creature or building. Fill it with small patches of colour, like broken tiles, and leave thin gaps between them.',
      real:{ need:BOX, steps:['Draw a big curvy creature with the white crayon: a lizard, a fish or a snail.', 'Still with the crayon, criss-cross it with wobbly lines to make “broken tiles”.', 'Paint each tile a different bright colour. The crayon lines stay white, like the gaps in a mosaic.', 'Paint the background in one calm colour.'], low:'Make a mosaic pattern with no creature: just crayon lines and three colours.' },
      word:['trencadís', 'mosaic made from broken tiles (say “tren-ka-DEES”)'], starters:['My mosaic creature is a', 'I used broken-tile shapes like Gaudí.', 'I chose curves because'],
      teach:['<b>The buildings.</b> Gaudí (1852 to 1926) is out of copyright. His buildings are in Barcelona, so the links are to Barcelona museums.', '<b>Link it.</b> The Romans world has a mosaic tile to design and a poster explaining how a mosaic was made.', '<b>Kept gentle.</b> How Gaudí died is left out.'],
      links:[['Barcelona History Museum: Park Güell', 'https://www.barcelona.cat/museuhistoria/en/heritages/museum-spaces/park-guell'], ['Gaudí House Museum, Park Güell', 'https://sagradafamilia.org/en/web/guest/gaudi-house-museum']] },
    { id:'banksy', n:'Banksy', short:'Banksy', e:'✂️', work:'Street art', tag:'Stencil pictures with a message', mine:'My stencil picture',
      about:['Banksy is a street artist from Bristol, in England. Banksy is still making art today.', 'Nobody is sure who Banksy is. The name is kept a secret!', 'Banksy cuts shapes out of card to make stencils, then sprays paint through them. The pictures often make people smile and think.'],
      rule:'Banksy paints on walls outdoors. We always use paper, and we only draw on things that are ours.',
      look:['Clear, simple shapes made with a stencil', 'Mostly black and white, with one splash of colour', 'A picture with a message'],
      spot:[['A crisp black shape made with a stencil', 'A soft, blurry watercolour', 'A stencil gives a crisp, clear edge.'], ['Black and white with one splash of colour', 'Every colour in the paint box', 'One bright colour makes your eye go straight to it.'], ['A picture with a message', 'A pattern with no meaning', 'Street art often has something to say.']],
      screen:'In the style of Banksy: draw one simple black shape, like a star or a bird. Add one splash of bright colour. What kind message could it send?',
      real:{ need:'Card, safe scissors, a sponge or scrunched paper, paint and paper', steps:['Fold a piece of card in half and cut a simple shape from the fold: a star, a leaf or a bird. Ask a grown-up to help with the cutting.', 'Open the card. The hole is your stencil.', 'Hold the stencil flat on your paper and dab paint through it with the sponge.', 'Lift the stencil carefully. Add one splash of bright colour and a kind message.'], low:'Use the stencil once and add one word.' },
      word:['stencil', 'a shape cut out of card, so paint goes only through the hole'], starters:['My message is', 'I used one splash of colour like Banksy.', 'I chose this shape because'],
      teach:['<b>Living artist.</b> Banksy’s work is in copyright, so the app shows none of it and teaches “in the style of” only. Please don’t ask children to copy one of the pictures.', '<b>Choose examples in advance.</b> Many Banksy works carry political or grown-up messages. If you show any, pick them beforehand.', '<b>Walls.</b> The child’s page says that we always use paper and only draw on things that are ours.', '<b>See one in Britain.</b> Paint-Pot Angel has stood in the entrance hall of Bristol Museum &amp; Art Gallery since 2009.'],
      links:[['Visit Bristol: Paint-Pot Angel at Bristol Museum & Art Gallery', 'https://visitbristol.co.uk/things-to-do/banksy-graffiti-paint-pot-angel-p1870833']] },
    { id:'wiltshire', n:'Stephen Wiltshire', short:'Stephen Wiltshire', e:'🏙️', work:'City skylines', tag:'Whole cities drawn from memory', mine:'My city from memory',
      about:['Stephen Wiltshire is a British artist. He was born in London in 1974 and is still drawing today.', 'He looks at a city for a short time, sometimes from a helicopter, and then draws it from memory.', 'His drawings are full of detail: bridges, towers and hundreds of windows.'],
      look:['Fine black lines', 'Buildings packed close together along a skyline', 'Lots of tiny details, such as windows, drawn from memory'],
      spot:[['A city drawn in fine lines', 'A city made of big splodges of paint', 'Stephen Wiltshire draws with careful, fine lines.'], ['Drawing from memory after a good look', 'Tracing over a photograph', 'He looks hard, then draws what he remembers.'], ['Rows and rows of tiny windows', 'Buildings with no windows or doors', 'The details are what make his cities feel real.']],
      screen:'In the style of Stephen Wiltshire: look out of a window, or at a picture of a street, for one minute. Then look away and draw what you remember with the pencil.',
      real:{ need:'A pencil or a fine pen, and paper', steps:['Choose something to look at: the view from a window, a picture of a street or a toy town.', 'Look carefully for one minute. Notice the tallest thing, the shapes of the roofs and where the windows are.', 'Turn away and draw the skyline first: one long line for the tops of the buildings.', 'Add the windows, doors and details you remember. Then look back. What did you remember well?'], low:'Look at one building for a minute and draw only that.' },
      word:['skyline', 'the outline of buildings against the sky'], starters:['I remembered', 'I drew fine lines like Stephen Wiltshire.', 'Next time I will look for'],
      teach:['<b>Living artist.</b> His work is in copyright, so the app shows none of it. His own website has a gallery you can open on the board.', '<b>His story.</b> Stephen Wiltshire is autistic and did not speak as a young child; drawing was how he first communicated. He was made an MBE for services to art in 2006. This is on his own website; it is left out of the child’s page for you to share if it suits your group.', '<b>Sketching pencils.</b> When a Make More FAB box brings sketching pencils, this is the room to use them in.'],
      links:[['Stephen Wiltshire: biography and gallery', 'https://www.stephenwiltshire.co.uk/biography']] }
  ];
  const roomOf = id => ROOMS.find(r => r.id === id);
  const STEPS = ['Meet', 'Spot the style', 'Make it', 'My gallery card'];
  const A = { room:null, step:0, back:'screen-learn', round:0, flip:[], note:null, wait:null, real:false };
  const mine = (d, id) => (d[id] = d[id] || {});
  const isMade = m => !!(m && (m.screen || m.real));

  /* ---------- style swatches: little drawings of the technique, made by the app. Not copies of any artwork. ---------- */
  const rnd = seed => () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const f1 = n => n.toFixed(1);
  const SW = {
    vangogh(){ const r = rnd(7), c = ['#F0B913', '#F0B913', '#F6D08F', '#E08A1E', '#FE4D02', '#8DB26A', '#3F6A8C']; let s = '<rect width="240" height="150" fill="#FBE7A8"/>';
      for(let i = 0; i < 130; i++){ const x = r() * 240, y = r() * 150, a = Math.atan2(y - 75, x - 120) * 57.3 + 90 + (r() * 30 - 15);
        s += `<rect x="${f1(x - 8)}" y="${f1(y - 3)}" width="16" height="6" rx="3" fill="${c[Math.floor(r() * c.length)]}" stroke="${INK}" stroke-width="1.1" transform="rotate(${a.toFixed(0)} ${f1(x)} ${f1(y)})"/>`; }
      return s; },
    munch(){ const c = ['#FE4D02', '#F0B913', '#E08A1E', '#F6D08F', '#FE4D02', '#5aa9e6', '#3F6A8C', '#7a5bb5', '#3F6A8C']; let s = '<rect width="240" height="150" fill="#F6D08F"/>';
      c.forEach((col, k) => { const y = 8 + k * 17, w = k % 2 ? 14 : -14; s += `<path d="M-10 ${y} C 40 ${y - w}, 80 ${y + w}, 120 ${y} S 200 ${y - w}, 250 ${y}" fill="none" stroke="${col}" stroke-width="13" stroke-linecap="round"/><path d="M-10 ${y + 8} C 40 ${y + 8 - w}, 80 ${y + 8 + w}, 120 ${y + 8} S 200 ${y + 8 - w}, 250 ${y + 8}" fill="none" stroke="${INK}" stroke-width="1.2" opacity=".55"/>`; });
      return s; },
    kahlo(){ const r = rnd(11); let s = '<rect width="240" height="150" fill="#2A9D8F"/>';
      for(let i = 0; i < 26; i++){ const t = i / 26 * Math.PI * 2, x = 120 + Math.cos(t) * (96 + r() * 16), y = 75 + Math.sin(t) * (52 + r() * 14), a = t * 57.3 + 90;
        s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="9" ry="22" fill="${i % 2 ? '#8DB26A' : '#4F7A2E'}" stroke="${INK}" stroke-width="1.6" transform="rotate(${a.toFixed(0)} ${f1(x)} ${f1(y)})"/>`; }
      [[36, 30], [204, 34], [30, 118], [208, 120], [120, 14]].forEach(([x, y]) => { for(let k = 0; k < 5; k++){ const t = k / 5 * Math.PI * 2; s += `<circle cx="${f1(x + Math.cos(t) * 8)}" cy="${f1(y + Math.sin(t) * 8)}" r="6.5" fill="#ff8fab" stroke="${INK}" stroke-width="1.4"/>`; } s += `<circle cx="${x}" cy="${y}" r="5" fill="#F0B913" stroke="${INK}" stroke-width="1.4"/>`; });
      return s + `<ellipse cx="120" cy="77" rx="46" ry="52" fill="#FFF6E6" stroke="${INK}" stroke-width="3"/><text x="120" y="84" text-anchor="middle" font-family="Aleo,Georgia,serif" font-style="italic" font-weight="700" font-size="20" fill="${INK}">you</text>`; },
    gaudi(){ const r = rnd(5), c = ['#FE4D02', '#F0B913', '#2A9D8F', '#5aa9e6', '#7a5bb5', '#8DB26A', '#ff8fab', '#3F6A8C'], nx = 9, ny = 6, P = []; let s = '<rect width="240" height="150" fill="#FFFDF7"/>';
      for(let j = 0; j <= ny; j++) for(let i = 0; i <= nx; i++) P.push([i * 240 / nx + (i && i < nx ? r() * 14 - 7 : 0), j * 150 / ny + (j && j < ny ? r() * 12 - 6 : 0)]);
      const pt = (i, j) => P[j * (nx + 1) + i];
      for(let j = 0; j < ny; j++) for(let i = 0; i < nx; i++){ const q = [pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)], cx = (q[0][0] + q[2][0]) / 2, cy = (q[0][1] + q[2][1]) / 2;
        s += `<polygon points="${q.map(p => f1(cx + (p[0] - cx) * .84) + ',' + f1(cy + (p[1] - cy) * .84)).join(' ')}" fill="${c[Math.floor(r() * c.length)]}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>`; }
      return s; },
    banksy(){ let s = '<rect width="240" height="150" fill="#E9E1D3"/>';
      for(let j = 0; j < 6; j++){ s += `<path d="M0 ${j * 25} H240" stroke="#cdbfa8" stroke-width="2"/>`; for(let i = 0; i < 5; i++) s += `<path d="M${i * 60 + (j % 2 ? 30 : 0)} ${j * 25} v25" stroke="#cdbfa8" stroke-width="2"/>`; }
      const star = []; for(let k = 0; k < 10; k++){ const t = -Math.PI / 2 + k * Math.PI / 5, R = k % 2 ? 22 : 52; star.push(f1(112 + Math.cos(t) * R) + ',' + f1(72 + Math.sin(t) * R)); }
      return s + `<circle cx="170" cy="40" r="17" fill="#F0B913"/><circle cx="188" cy="56" r="6" fill="#F0B913"/><circle cx="152" cy="26" r="4" fill="#F0B913"/><polygon points="${star.join(' ')}" fill="#1c1c1c"/><rect x="90" y="96" width="5" height="26" rx="2.5" fill="#1c1c1c"/><rect x="128" y="100" width="4" height="16" rx="2" fill="#1c1c1c"/>`; },
    wiltshire(){ const r = rnd(3); let s = `<rect width="240" height="150" fill="#fff"/><path d="M0 132 H240" stroke="${INK}" stroke-width="1.6"/>`, x = 6;
      while(x < 228){ const w = 14 + Math.floor(r() * 18), hh = 34 + Math.floor(r() * 80), y = 132 - hh; s += `<rect x="${x}" y="${y}" width="${w}" height="${hh}" fill="#fff" stroke="${INK}" stroke-width="1.3"/>`;
        for(let yy = y + 6; yy < 126; yy += 8) for(let xx = x + 4; xx < x + w - 3; xx += 6) s += `<path d="M${xx} ${yy} v3.5" stroke="${INK}" stroke-width="1"/>`;
        if(r() < .3) s += `<path d="M${x + w / 2} ${y} v-14" stroke="${INK}" stroke-width="1.3"/>`; else if(r() < .25) s += `<path d="M${x} ${y} Q ${x + w / 2} ${y - 16} ${x + w} ${y}" fill="#fff" stroke="${INK}" stroke-width="1.3"/>`;
        x += w + (r() < .3 ? 5 : 0); }
      return s + `<path d="M0 141 q 15 -4 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0" fill="none" stroke="${INK}" stroke-width="1"/>`; }
  };
  const swatch = (r, cls) => `<svg class="art-sw ${cls || ''}" viewBox="0 0 240 150" role="img" aria-label="A style swatch for ${h(r.short)}, drawn for this app">${SW[r.id]()}<rect x="1.5" y="1.5" width="237" height="147" rx="8" fill="none" stroke="${INK}" stroke-width="3"/></svg>`;

  /* ---------- the child's Studio pictures (Fab Fox World keeps the last twelve) ---------- */
  const worldMakes = () => { try{ const W = JSON.parse(localStorage.getItem('fabworld-v2-' + code()) || 'null') || {}; return Array.isArray(W.makes) ? W.makes.filter(m => m && m.d) : []; }catch(e){ return []; } };
  const picOf = m => { if(!m || !m.screen || !m.screen.t) return ''; const p = worldMakes().find(x => x.t === m.screen.t); return p ? p.d : ''; };
  function finish(d, r, how, t){
    const m = mine(d, r.id), first = !isMade(m);
    if(how === 'real') m.real = 1; else m.screen = { t:t || (m.screen && m.screen.t) || 0 };
    m.when = m.when || (window.FabProud ? window.FabProud.stamp() : ''); save(d);
    if(first){ try{ fabWorldAward(1); }catch(e){} snd('jingle'); try{ if(window.FabBurrow && FabBurrow.codeRe.test(code())) FabBurrow.actDone(code(), 'art:' + r.id); }catch(e){}
      A.note = { k:'win', h:'You made it!', t:'That earned a star for Fab Fox World. Your gallery card is ready when you are.' }; }
    else { snd('ding'); if(t) A.note = { k:'win', h:'Kept!', t:'Your new picture is on your gallery card.' }; }
  }
  /* back from the Studio: was a new picture kept while the child was there? */
  function checkKept(){
    const w = A.wait; if(!w) return; A.wait = null; const r = roomOf(w.id); if(!r) return;
    const got = worldMakes().find(x => x.t >= w.t && x.k === 'create'); if(got) finish(load(), r, 'screen', got.t);
  }
  function toStudio(r){
    A.wait = { id:r.id, t:Date.now() }; window.fabArtIdea = r.screen;
    window.fabArtBack = () => { window.fabArtBack = null; window.fabArtIdea = ''; open(A.back, r.id, 2); };
    window.fabWorldOpen = 'studiocreate';
    if(A.back !== 'screen-world') window.fabWorldFrom = 'screen-art';
    showScreen('screen-world');
    try{ const wf = q1('iframe[data-game="world"]'); if(wf && wf.contentWindow){ wf.contentWindow.postMessage('fabworld-wake', '*'); wf.contentWindow.postMessage('fabworld-open', '*'); } }catch(e){}
  }

  /* ---------- pages ---------- */
  const say = (who, name, b, t) => `<div class="fab-say"><span class="fab-char ${who}" role="img" aria-label="${name}"></span><div class="bubble"><b>${h(b)}</b>${h(t)}</div></div>`;
  const note = n => n ? say(n.k === 'win' ? 'elder' : 'doc', n.k === 'win' ? 'Mr Elder' : 'Doctor McPhee', n.h, n.t) : '';
  const linksHTML = r => r.links.map(l => `<a href="${h(l[1])}" target="_blank" rel="noopener">${h(l[0])}</a>`).join(' · ');
  function homeHTML(){
    const d = load(), n = ROOMS.filter(r => isMade(d[r.id])).length;
    const card = r => { const m = d[r.id] || {}, pic = picOf(m);
      return `<button type="button" class="art-room ${isMade(m) ? 'done' : ''}" data-art="room" data-id="${r.id}">${pic ? `<img class="art-sw" src="${h(pic)}" alt="My picture in the style of ${h(r.short)}">` : swatch(r)}<b>${h(r.n)}</b><small>${h(r.tag)}</small><span class="art-go">${isMade(m) ? '★ I made one ➡️' : m.spot ? 'Carry on ➡️' : 'Step in ➡️'}</span></button>`; };
    return `<div class="me-card art-home">${say('bell', 'Miss Bell', 'Welcome to the Art Gallery.', 'Every room has an artist and a style. Look closely, spot the style, then make your own: on screen, or with real paint and paper.')}
      <div class="art-rooms">${ROOMS.map(card).join('')}</div>
      <p class="art-count">${n ? `You have made art in ${n} of ${ROOMS.length} rooms.` : 'Choose any room. There is no order, and you can stop whenever you like.'}</p>
      <details class="art-tip"><summary>🖍️ Art tip from your Make More FAB box: wax resist</summary><ol><li>Draw with the white crayon first. Press hard.</li><li>Paint over it with watery paint.</li><li>The wax pushes the paint away, so your crayon lines stay white.</li></ol><p>Try it for petals, wavy skies, leaf veins and the gaps in a mosaic.</p></details>
      <details class="art-tip"><summary>✏️ Art tip for a set of sketching pencils</summary><p>The letters and numbers on a pencil tell you how hard or soft it is.</p><ol><li><b>H pencils</b> (2H, H) are hard: light, fine lines. Use them for the first outline, like Stephen Wiltshire’s skylines.</li><li><b>HB</b> is in the middle: good for everyday drawing and writing.</li><li><b>B pencils</b> (2B, 4B, 6B) are soft: dark, smudgy lines. The higher the number, the darker. Use them for shadows.</li><li>Shade from light to dark: press gently with an H, then go darker with a B. Smudge soft pencil with a fingertip for a soft shadow.</li></ol><p>Look for this when a Make More FAB box brings sketching pencils.</p></details></div>
      <details class="tm-teach"><summary>🧑‍🏫 For teachers: check before use, what’s left out, and links</summary><ul>
        <li><b>Draft to check.</b> Every fact in the gallery is a first draft for a teacher to check before children use it.</li>
        <li><b>No artworks in the app.</b> Each room shows a small “style swatch” drawn by the app, not the artist’s work. Open the real thing on the board from the museum links in each room. Paintings by Van Gogh, Munch and Kahlo and buildings by Gaudí are out of copyright in the UK, but museum photographs have their own terms. Banksy and Stephen Wiltshire are living artists, so their rooms teach “in the style of” only.</li>
        <li><b>Kept gentle.</b> Illness, death and the hard parts of the artists’ lives are left out of the children’s pages. Each room’s note says what was left out, so you can decide what to share. The Scream and Frida Kahlo rooms need the most care.</li>
        <li><b>Each room is one short lesson.</b> Meet (I do), Spot the style (we do), Make it (you do), My gallery card. Every step is a place to stop, and each make has a low-energy version.</li>
        <li><b>For real.</b> The makes use the first Make More FAB box: watercolours and a white crayon. A child ticks “I made it for real” themselves. Photos cannot be added inside the app yet: a photo of the artwork (never of a child) can go on the Pencil board.</li>
        <li><b>Set it.</b> Each room can be set from Assign work or Plan a week, under Activities. A made piece ticks it off in the child’s Burrow and shows in Things I made.</li>
        <li><b>Saved on this device only.</b> Nothing is sent anywhere.</li></ul></details>`;
  }
  function meetHTML(r){
    return `${say('bell', 'Miss Bell', 'Meet ' + r.n + '.', 'Read about the artist, then look for three things.')}
      <div class="art-meet"><figure class="art-fig">${swatch(r, 'big')}<figcaption>A style swatch drawn for this app. Ask your teacher to show you the real thing.</figcaption></figure>
        <div>${window.fabReadAloud ? '<button type="button" class="btn small soft art-sayb" data-art="say">🔊 Read it to me</button>' : ''}<ul class="art-about">${r.about.map(t => `<li>${h(t)}</li>`).join('')}</ul>${r.rule ? `<p class="art-rule">☝️ ${h(r.rule)}</p>` : ''}</div></div>
      <h3 class="mk-group">Look for</h3><ol class="mk-howsteps art-look">${r.look.map(t => `<li>${h(t)}</li>`).join('')}</ol>
      <p class="art-word"><b>Art word:</b> ${h(r.word[0])} = ${h(r.word[1])}.</p>
      <div class="choice-row tm-row"><button type="button" class="btn leaf" data-art="step" data-id="1">Next: spot the style ➡️</button></div>
      <p class="art-stop">🌱 Tired? Looking is enough for today. This is a good place to stop.</p>`;
  }
  function spotHTML(r, m){
    if(A.round >= r.spot.length) return `${note(A.note) || say('elder', 'Mr Elder', 'You can spot the style!', 'You know what to look for. Now it is your turn to make something.')}
      <ol class="mk-howsteps art-look">${r.look.map(t => `<li>${h(t)}</li>`).join('')}</ol>
      <div class="choice-row tm-row"><button type="button" class="btn leaf" data-art="step" data-id="2">Next: make it ➡️</button><button type="button" class="btn small soft" data-art="again">Play again</button></div>
      <p class="art-stop">🌱 This is a good place to stop, too.</p>`;
    const s = r.spot[A.round], flip = A.flip[A.round], two = [`<button type="button" class="art-pick" data-art="pick" data-id="1">${h(s[0])}</button>`, `<button type="button" class="art-pick" data-art="pick" data-id="0">${h(s[1])}</button>`];
    return `<h3 class="mk-h">🔎 Spot the style</h3><p class="mk-ask">Which one is in the style of ${h(r.short)}? <small>(${A.round + 1} of ${r.spot.length})</small></p>
      <div class="art-picks">${flip ? two[1] + two[0] : two[0] + two[1]}</div>
      <div class="tm-notebox" role="status">${note(A.note)}</div>
      <div class="choice-row tm-row"><button type="button" class="btn small soft" data-art="show">Tired? Show me</button></div>`;
  }
  function makeHTML(r, m){
    const pic = picOf(m);
    return `<div class="tm-notebox" role="status">${note(A.note)}</div>
      <p class="mk-ask">Make your own, in the style of ${h(r.short)}. On screen, for real, or both: you choose.</p>
      <div class="art-ways">
        <section class="art-way ${m.screen ? 'done' : ''}"><h3>🖥️ On screen</h3><p>${h(r.screen.replace(/^In the style of [^:]+: /, '').replace(/^./, c => c.toUpperCase()))}</p>
          ${pic ? `<img class="art-mine" src="${h(pic)}" alt="My picture in the style of ${h(r.short)}">` : ''}
          <div class="choice-row tm-row"><button type="button" class="btn leaf" data-art="studio">${m.screen ? 'Make another in the Studio' : 'Open the Studio paper ➡️'}</button>${m.screen ? '' : '<button type="button" class="btn small soft" data-art="screendone">I made it on screen ✔</button>'}</div>
          <p class="hint">${m.screen ? '✅ Made on screen.' : 'Tap “Keep it” when your picture is finished, then “Back” to come back here.'}</p></section>
        <section class="art-way ${m.real ? 'done' : ''}"><h3>✂️ For real</h3><p><b>You will need:</b> ${h(r.real.need)}.</p>
          ${A.real || m.real ? `<ol class="mk-howsteps">${r.real.steps.map(t => `<li>${h(t)}</li>`).join('')}</ol><p class="art-stop">🌱 Tired? ${h(r.real.low)}</p>
            <div class="choice-row tm-row">${m.real ? '' : '<button type="button" class="btn leaf" data-art="realdone">I made it for real ⭐</button>'}</div><p class="hint">${m.real ? '✅ Made for real. Hold it up to show your teacher!' : 'Take your time. You can finish it after the session.'}</p>`
            : '<div class="choice-row tm-row"><button type="button" class="btn leaf" data-art="realopen">Show me the steps</button></div>'}</section>
      </div>
      <div class="choice-row tm-row">${isMade(m) ? '<button type="button" class="btn leaf" data-art="step" data-id="3">See my gallery card ➡️</button>' : ''}</div>`;
  }
  function cardHTML(r, m){
    if(!isMade(m)) return `${say('lark', 'Mrs Lark', 'Your gallery card is waiting.', 'Make something first, on screen or for real, and your card will appear here.')}<div class="choice-row tm-row"><button type="button" class="btn leaf" data-art="step" data-id="2">Go to Make it</button></div>`;
    const pic = picOf(m), how = m.screen && m.real ? 'On screen, and for real with my own hands.' : m.real ? 'For real, with my own hands.' : 'On screen, in the Make More FAB Studio.';
    const cards = []; if(pic) cards.push({ h:'My picture', pic:{ src:pic, alt:'My picture in the style of ' + r.short } });
    if(m.label) cards.push({ h:'In my own words', text:m.label });
    cards.push({ h:'I looked for', html:`<ul class="art-lookfor">${r.look.map(t => `<li>${h(t)}</li>`).join('')}</ul>`, wide:!pic && !m.label });
    cards.push({ h:'How I made it', text:how });
    return `<div class="tm-notebox" role="status">${note(A.note)}</div>
      ${window.FabProud ? window.FabProud.page({ theme:'fab', cls:'mk-paper mk-final art-card', kicker:'In the style of ' + r.n, title:m.title || r.mine, lead:'', cards, fact:{ label:'Art word', text:(r.word[0] + ': ' + r.word[1] + '.').replace(/^./, c => c.toUpperCase()) }, when:m.when, seal:'Finished!' }) : ''}
      <div class="art-label"><label for="artTitleIn">My title</label><input id="artTitleIn" class="mk-in" maxlength="40" value="${h(m.title || r.mine)}">
        <label for="artLabelIn">Stretch: one sentence about my art</label><div class="art-starters" role="group" aria-label="Sentence starters">${r.starters.map((t, i) => `<button type="button" class="mk-chip" data-art="starter" data-id="${i}">${h(t)}</button>`).join('')}</div>
        <input id="artLabelIn" class="mk-in" maxlength="120" value="${h(m.label || '')}"><button type="button" class="btn small leaf" data-art="savelabel">Put it on my card</button></div>
      <div class="choice-row tm-row"><button type="button" class="btn small leaf" data-art="print">🖨️ Print my card</button><button type="button" class="btn small soft" data-art="home">⬅ Back to the gallery</button></div>`;
  }
  function roomHTML(r){
    const d = load(), m = mine(d, r.id);
    const nav = `<div class="art-steps" role="group" aria-label="Steps">${STEPS.map((t, i) => `<button type="button" class="art-step ${A.step === i ? 'on' : ''} ${(i === 1 && m.spot) || (i === 2 && isMade(m)) || (i === 3 && isMade(m) && m.label) ? 'ok' : ''}" data-art="step" data-id="${i}" ${A.step === i ? 'aria-current="step"' : ''}>${i + 1}. ${t}</button>`).join('')}</div>`;
    return `<div class="me-card art-roompage" data-room="${r.id}">${nav}${[meetHTML, spotHTML, makeHTML, cardHTML][A.step](r, m)}</div>
      <details class="tm-teach"><summary>🧑‍🏫 For teachers: ${h(r.n)}</summary><ul><li><b>Draft to check.</b> Please check the facts in this room before children use it.</li>${r.teach.map(t => `<li>${t}</li>`).join('')}<li><b>Show the real thing.</b> ${linksHTML(r)}</li></ul></details>`;
  }
  function render(){
    const body = q1('#artBody'); if(!body) return; const r = roomOf(A.room);
    body.innerHTML = r ? roomHTML(r) : homeHTML();
    const t = q1('#artTitle'); if(t) t.textContent = r ? '🎨 ' + r.n + ': ' + r.work : '🎨 The Art Gallery';
    const bk = q1('#artBack'); if(bk) bk.textContent = r ? '← The gallery' : '← Back';
  }
  function setRoom(id, step){ const r = roomOf(id); A.room = r ? r.id : null; A.step = r ? Math.max(0, Math.min(3, Number(step) || 0)) : 0; A.round = 0; A.note = null; A.real = false; A.flip = r ? r.spot.map(() => Math.random() < .5) : []; }
  function leave(){
    const b = A.back || 'screen-learn'; showScreen(b);
    if(b === 'screen-world'){ try{ const wf = q1('iframe[data-game="world"]'); if(wf && wf.contentWindow){ wf.contentWindow.postMessage('fabworld-wake', '*'); wf.contentWindow.postMessage('fabworld-refresh', '*'); } }catch(e){} }
  }
  function onClick(e){ if(!e.target.closest('[data-art="say"]')){ try{ window.speechSynthesis && speechSynthesis.cancel(); }catch(err){} }
    const b = e.target.closest('[data-art]'); if(!b) return;
    const a = b.dataset.art, id = b.dataset.id, r = roomOf(A.room), d = load();
    if(a === 'room'){ setRoom(id, 0); snd('jingle'); render(); window.scrollTo(0, 0); return; }
    if(a === 'home'){ setRoom(null); snd('tick'); render(); return; }
    if(!r) return; const m = mine(d, r.id);
    if(a === 'step'){ A.step = Math.max(0, Math.min(3, Number(id) || 0)); A.note = null; if(A.step === 1){ A.round = m.spot ? r.spot.length : 0; } snd('tick'); render(); window.scrollTo(0, 0); return; }
    if(a === 'again'){ A.round = 0; A.note = null; A.flip = r.spot.map(() => Math.random() < .5); snd('tick'); return render(); }
    if(a === 'pick' || a === 'show'){ const s = r.spot[A.round]; if(!s) return;
      if(a === 'show' || id === '1'){ A.round++; A.note = a === 'show' ? { k:'fix', h:'It was “' + s[0] + '”.', t:s[2] } : (A.round < r.spot.length ? { k:'win', h:'Yes!', t:s[2] } : null); snd('ding');
        if(A.round >= r.spot.length && !m.spot){ m.spot = 1; save(d); } }
      else { A.note = { k:'fix', h:'Have another look.', t:s[2] }; snd('gentle'); }
      return render(); }
    if(a === 'say'){ const t = r.about.join(' ') + ' Look for: ' + r.look.join('. ') + '.'; try{ if(window.speechSynthesis && speechSynthesis.speaking){ speechSynthesis.cancel(); return; } window.fabReadAloud(t); }catch(err){} return; }
    if(a === 'studio'){ snd('tick'); return toStudio(r); }
    if(a === 'screendone'){ A.note = null; finish(d, r, 'screen'); return render(); }
    if(a === 'realopen'){ A.real = true; snd('tick'); return render(); }
    if(a === 'realdone'){ A.note = null; finish(d, r, 'real'); return render(); }
    if(a === 'starter'){ const el = q1('#artLabelIn'), t = r.starters[Number(id)]; if(el && t){ el.value = t + (/\.$/.test(t) ? '' : ' '); el.focus(); } return; }
    if(a === 'savelabel'){ const t = q1('#artTitleIn'), l = q1('#artLabelIn'); m.title = clean(t ? t.value : '', 40); m.label = clean(l ? l.value : '', 120); save(d); A.note = { k:'win', h:'On your card.', t:'Your own words make it yours.' }; snd('ding'); return render(); }
    if(a === 'print'){ document.body.classList.add('mk-printing'); const done = () => { document.body.classList.remove('mk-printing'); window.removeEventListener('afterprint', done); }; window.addEventListener('afterprint', done); try{ window.print(); }catch(err){ done(); } setTimeout(done, 60000); return; }
  }

  function open(back, id, step){
    if(!q1('#screen-art')) return false;
    A.back = back || A.back || 'screen-learn'; if(A.back === 'screen-art') A.back = 'screen-learn';
    if(id !== undefined || !A.room) setRoom(id, step);
    if(A.back === 'screen-world'){ try{ fabWorldFull(false); }catch(e){} try{ const wf = q1('iframe[data-game="world"]'); wf && wf.contentWindow && wf.contentWindow.postMessage('fabworld-sleep', '*'); }catch(e){} }
    showScreen('screen-art'); checkKept(); render(); window.scrollTo(0, 0);
    return true;
  }
  /* for the Burrow's "Things I made" */
  function made(c){ let d = {}; try{ d = JSON.parse(localStorage.getItem('fab-art-' + c) || '{}') || {}; }catch(e){}
    let makes = []; try{ const W = JSON.parse(localStorage.getItem('fabworld-v2-' + c) || 'null') || {}; makes = Array.isArray(W.makes) ? W.makes : []; }catch(e){}
    return ROOMS.filter(r => isMade(d[r.id])).map(r => { const m = d[r.id], p = m.screen && m.screen.t ? makes.find(x => x && x.t === m.screen.t) : null;
      return { id:r.id, t:m.title || r.mine, s:'In the style of ' + r.short + (m.screen && m.real ? ' · on screen and for real' : m.real ? ' · made for real' : ' · made on screen'), pic:p && p.d ? p.d : '' }; }); }
  const doorHTML = () => `<section class="art-door" aria-label="The Art Gallery"><h2><span aria-hidden="true">🎨</span> The Art Gallery <small>Artists and styles to look at, then try yourself</small></h2>
    <button type="button" class="art-doorbtn" data-tm="art">${swatch(ROOMS[0])}${swatch(ROOMS[3])}${swatch(ROOMS[5])}<span><b>Step into the gallery</b><small>${ROOMS.map(r => h(r.short)).join(' · ')}</small></span><span class="tm-go">Step in ➡️</span></button></section>`;

  const CSS = `
body:has(#screen-art.active) main{max-width:1240px}
.art-rooms{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;margin:14px 0 8px}
.art-room{display:grid;gap:6px;text-align:left;background:#FFFDF7;border:3px solid ${INK};border-radius:18px 24px 20px 26px / 24px 18px 26px 20px;padding:10px 12px 12px;font:inherit;color:inherit;cursor:pointer}
.art-room:hover,.art-room:focus-visible{background:#FFF1CF}.art-room.done{background:#EEF6DF}
.art-room b{font-size:1.2rem}.art-room small{font-size:1rem;line-height:1.3}.art-go{font-weight:700;margin-top:2px}
.art-sw{display:block;width:100%;height:auto;border-radius:8px}img.art-sw{aspect-ratio:240/150;object-fit:cover;border:3px solid ${INK}}
.art-count{margin:8px 0;font-size:1.05rem}
.art-tip{background:#FFF6E6;border:2.5px solid ${INK};border-radius:14px;padding:8px 14px;margin-top:10px}.art-tip summary{font-weight:700;cursor:pointer}.art-tip ol{margin:8px 0 4px;padding-left:1.4em}.art-tip p{margin:4px 0}
.art-steps{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px}
.art-step{font:inherit;font-weight:700;background:#fff;border:2.5px solid ${INK};border-radius:999px;padding:6px 14px;cursor:pointer;min-height:44px}
.art-step.on{background:#F0B913}.art-step.ok::after{content:" ✓"}
.art-meet{display:grid;grid-template-columns:minmax(200px,340px) minmax(0,1fr);gap:18px;align-items:start;margin:10px 0}
.art-fig{margin:0}.art-fig figcaption{font-size:.92rem;font-style:italic;margin-top:4px;line-height:1.3}
.art-about{margin:0;padding-left:1.2em;display:grid;gap:8px;font-size:1.15rem;line-height:1.45}
.art-sayb{margin:0 0 8px}
.art-rule{background:#CFE7F2;border:2.5px solid ${INK};border-radius:12px;padding:8px 12px;margin:10px 0 0;font-weight:700}
.art-word{margin:10px 0;font-size:1.08rem}.art-stop{margin:10px 0 0;font-size:1rem;opacity:.9}
.art-picks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:10px 0}
.art-pick{font:inherit;font-size:1.2rem;line-height:1.35;background:#fff;border:3px solid ${INK};border-radius:18px;padding:22px 16px;min-height:110px;cursor:pointer}
.art-pick:hover,.art-pick:focus-visible{background:#FFF1CF}
.art-ways{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin:10px 0;align-items:start}
.art-way{background:#FFFDF7;border:3px solid ${INK};border-radius:18px;padding:12px 14px}.art-way.done{background:#EEF6DF}
.art-way h3{margin:0 0 6px}.art-way p{margin:6px 0;font-size:1.08rem;line-height:1.4}.art-mine{display:block;max-width:240px;width:100%;border:3px solid ${INK};border-radius:10px;margin:6px 0}
.art-label{display:grid;gap:6px;margin:14px 0;max-width:720px}.art-label label{font-weight:700}.art-starters{display:flex;flex-wrap:wrap;gap:8px}
.art-lookfor{margin:0;padding-left:1.2em;display:grid;gap:4px;text-align:left;font-size:1.08rem}
.art-door{margin:14px 0 4px}.art-door h2{margin:0 0 8px;font-size:var(--t-head,1.5rem)}.art-door h2 small{font:400 var(--t-body,1.05rem) var(--body,Aleo),Georgia,serif;opacity:.8;margin-left:6px}
.art-doorbtn{display:grid;grid-template-columns:repeat(3,minmax(70px,130px)) minmax(0,1fr) auto;gap:12px;align-items:center;width:100%;text-align:left;font:inherit;color:inherit;background:#FFFDF7;border:3px solid ${INK};border-radius:18px 24px 20px 26px / 24px 18px 26px 20px;padding:10px 14px;cursor:pointer}
.art-doorbtn:hover,.art-doorbtn:focus-visible{background:#FFF1CF}.art-doorbtn b{display:block;font-size:1.2rem}.art-doorbtn small{display:block;font-size:.98rem;line-height:1.3}
@media (max-width:760px){.art-meet,.art-picks,.art-ways{grid-template-columns:1fr}.art-doorbtn{grid-template-columns:repeat(3,minmax(0,1fr))}.art-doorbtn > span{grid-column:1 / -1}}`;

  function init(){
    const main = q1('main'); if(!main || q1('#screen-art')) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    main.insertAdjacentHTML('beforeend', `<section id="screen-art" class="screen" aria-label="The Art Gallery"><div class="screen-top"><button type="button" class="btn-back" id="artBack">← Back</button><h1 class="screen-title" id="artTitle">🎨 The Art Gallery</h1></div><div id="artBody"></div></section>`);
    const scr = q1('#screen-art'); scr.addEventListener('click', onClick);
    q1('#artBack').addEventListener('click', () => { snd('tick'); if(A.room){ setRoom(null); render(); return; } leave(); });
    /* coming back from Fab Fox World by its own way out lands here too: look for a kept picture and redraw */
    try{ new MutationObserver(() => { if(scr.classList.contains('active') && A.wait){ window.fabArtBack = null; window.fabArtIdea = ''; checkKept(); render(); } }).observe(scr, { attributes:true, attributeFilter:['class'] }); }catch(e){}
  }
  /* each room can be set as work from the Teachers' area, like any other activity: this file loads before burrow.js, which adds these to its list */
  const acts = ROOMS.map(r => ({ id:'art:' + r.id, n:'Art Gallery: ' + r.n, ic:'canvas', e:'🎨' }));
  window.FabArt = { open, render, rooms:ROOMS, room:roomOf, state:A, made, doorHTML, load, swatch, acts };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
