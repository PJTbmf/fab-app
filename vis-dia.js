/* Fab App pictures: hand-drawn diagrams made of named parts.
   Each diagram lists parts with the words that point at them; FabVis lights the part the question is about. */
(function(){
'use strict';
const FV = window.FabVis; if(!FV) return;
const D = FV.dia;
const T = (x, y, s, sz, cls) => `<text class="t ${cls || ''}" x="${x}" y="${y}" font-size="${sz || 18}" text-anchor="middle">${s}</text>`;
const EM = (x, y, e, sz, cls) => `<text class="em ${cls || ''}" x="${x}" y="${y}" font-size="${sz || 40}">${e}</text>`;
const HIT = d => `<path class="hit" d="${d}"/>`;
const sky = (id, a, b) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a || '#BFE3F7'}"/><stop offset="1" stop-color="${b || '#EAF6FB'}"/></linearGradient>`;
const css = `
.fv .hit{ fill:#F3BB17; opacity:0; transition:opacity .5s; pointer-events:none; }
.fv .hit.frame{ fill:none; stroke:#F3BB17; stroke-width:7; } .fv .part.ha .hit.frame{ fill:none; stroke:#3FAE45; } .fv .part.hq .hit.frame,.fv .part.ha .hit.frame{ opacity:1; }
.fv .part.hq .hit{ opacity:.45; } .fv .part.ha .hit{ opacity:.38; fill:#3FAE45; }
.fv .bulboff{ filter:grayscale(1) brightness(.85) opacity(.55); }
.fv .part.only{ opacity:0; } .fv .part.only:not(.hq):not(.ha){ opacity:0 !important; } .fv .part.only.hq,.fv .part.only.ha{ opacity:1 !important; }
.fv .part.hq{ filter:drop-shadow(0 0 6px #F3BB17) drop-shadow(0 0 2px #F3BB17); }
.fv .part.ha{ filter:drop-shadow(0 0 6px #3FAE45) drop-shadow(0 0 2px #3FAE45); }
`;
const st = document.createElement('style'); st.id = 'fv-dia-css'; st.textContent = css; document.head.appendChild(st);

/* ---------- The water cycle ---------- */
D.watercycle = {
  vb:'0 0 800 520', alt:'The water cycle', cap:'The water cycle goes round and round',
  bg:() => `<defs>${sky('wcs')}</defs><rect width="800" height="520" fill="url(#wcs)"/>
   <path d="M260,350 C330,345 380,300 420,235 C450,185 490,160 520,168 C560,178 600,260 650,320 C700,335 760,332 800,334 V520 H260Z" fill="#8FCB6B"/>
   <path d="M260,420 H800 V520 H260Z" fill="#B98B5E"/>
   <path d="M474,172 C492,160 520,160 546,184 C522,178 500,190 474,172Z" fill="#fff"/>
   <rect x="0" y="352" width="262" height="168" fill="#4FB3E8"/>
   <path d="M0,374 q22,-10 44,0 t44,0 t44,0 t44,0 t44,0 t44,0" fill="none" stroke="#fff" stroke-width="3" opacity=".6"/>
   <path d="M0,404 q22,-10 44,0 t44,0 t44,0 t44,0 t44,0 t44,0" fill="none" stroke="#fff" stroke-width="3" opacity=".4"/>`,
  parts:[
    { id:'sea', l:'Sea', names:['sea', 'ocean', 'liquid'], lab:[130, 492], svg:HIT('M0,352 H262 V520 H0Z') },
    { id:'land', l:'Land', names:['land', 'hill', 'mountain', 'ground'], lab:[700, 392], svg:HIT('M260,350 C330,345 380,300 420,235 C450,185 490,160 520,168 C560,178 600,260 650,320 C700,335 760,332 800,334 V420 H260Z') },
    { id:'sun', l:'Sun', names:['sun', 'solar energy', 'sun’s rays'], lab:[80, 128], svg:EM(80, 70, '☀️', 74, 'a-bob') },
    { id:'evaporation', l:'Evaporation', names:['evaporation', 'evaporates', 'evaporate', 'evaporated'], lab:[150, 292], svg:[90, 150, 210].map((x, i) => `<g class="a-rise d${i + 1}"><path d="M${x},340 q14,-22 0,-44 q-14,-22 0,-44" fill="none" stroke="#F4A261" stroke-width="6" stroke-linecap="round"/><path d="M${x - 11},256 L${x},232 L${x + 11},256Z" fill="#F4A261"/></g>`).join('') },
    { id:'vapour', l:'Water vapour', names:['water vapour', 'vapour', 'gas', 'gases'], lab:[200, 118], svg:[[130, 170], [160, 215], [200, 185], [240, 225], [270, 180], [215, 150], [250, 140]].map((p, i) => `<circle class="a-twinkle d${i % 5 + 1}" cx="${p[0]}" cy="${p[1]}" r="8" fill="#fff" stroke="#8EC9EA" stroke-width="2"/>`).join('') },
    { id:'cloud', l:'Cloud', names:['cloud', 'clouds', 'condensation'], lab:[470, 34], svg:`<g class="a-bob"><circle cx="428" cy="94" r="28" fill="#fff" stroke="#C3D8E6" stroke-width="3"/><circle cx="470" cy="76" r="38" fill="#fff" stroke="#C3D8E6" stroke-width="3"/><circle cx="516" cy="92" r="30" fill="#fff" stroke="#C3D8E6" stroke-width="3"/><rect x="428" y="80" width="88" height="44" fill="#fff"/><path d="M428,122 H516" stroke="#C3D8E6" stroke-width="3"/></g>` },
    { id:'precipitation', l:'Precipitation', names:['precipitation', 'rain', 'snow', 'hail', 'sleet'], lab:[545, 128, 'Precipitation', 'start'], svg:[440, 458, 476, 494, 512].map((x, i) => `<line class="a-fall d${i + 1}" x1="${x}" y1="136" x2="${x - 6}" y2="158" stroke="#3E8EDE" stroke-width="5" stroke-linecap="round"/>`).join('') },
    { id:'river', l:'River', names:['river', 'rivers', 'stream'], lab:[392, 250], svg:`<path d="M492,198 C462,232 428,262 404,292 C378,326 320,346 262,356" fill="none" stroke="#3E8EDE" stroke-width="10" stroke-linecap="round"/><path d="M492,198 C462,232 428,262 404,292 C378,326 320,346 262,356" fill="none" stroke="#fff" stroke-width="3" opacity=".8" class="a-flow"/>` },
    { id:'reservoir', l:'Reservoir', names:['reservoir', 'dam', 'lake'], lab:[546, 270, 'Reservoir', 'end'], svg:`<ellipse cx="590" cy="262" rx="32" ry="12" fill="#3E8EDE" stroke="#fff" stroke-width="2"/><rect x="618" y="252" width="9" height="22" rx="2" fill="#8D8F96"/>` },
    { id:'aquifer', l:'Aquifer', names:['aquifer', 'porous rock', 'underground'], lab:[545, 452], svg:`<rect x="300" y="428" width="490" height="52" rx="14" fill="#8EC9EA" stroke="#fff" stroke-width="3"/>${[330, 380, 430, 480, 530, 580, 630, 680, 730].map((x, i) => `<circle cx="${x}" cy="${446 + (i % 2) * 20}" r="6" fill="#B98B5E"/>`).join('')}` },
    { id:'treatment', l:'Treatment works', names:['water treatment works', 'treatment works', 'purified', 'purify', 'purifies'], lab:[664, 256, 'Treatment works'], svg:EM(672, 295, '🏭', 46) },
    { id:'pipeline', l:'Pipeline', names:['pipeline', 'pipelines', 'pipe', 'pipes'], lab:[640, 352], svg:`<path d="M628,268 C654,292 662,324 700,328 L752,328" fill="none" stroke="#7A7F8A" stroke-width="8" stroke-linecap="round"/><path d="M628,268 C654,292 662,324 700,328 L752,328" fill="none" stroke="#fff" stroke-width="2.5" class="a-flow"/>` },
    { id:'house', l:'Building', names:['building', 'buildings', 'house', 'home'], lab:[752, 262, 'House'], svg:EM(752, 300, '🏠', 54) },
    { id:'stopcock', l:'Stopcock', names:['stopcock'], lab:[722, 356], svg:`<g><circle cx="722" cy="328" r="9" fill="#FE4D02" stroke="#fff" stroke-width="2"/><rect x="718" y="312" width="8" height="10" rx="2" fill="#FE4D02"/></g>` },
    { id:'cycle', l:'Water cycle', names:['water cycle', 'cycle', 'process', 'interconnected'], cls:'only', svg:`<ellipse cx="400" cy="225" rx="345" ry="170" fill="none" stroke="#2F7FD0" stroke-width="6" stroke-dasharray="16 12" class="a-flow"/><path d="M742,262 L760,236 L726,238Z" fill="#2F7FD0"/>` },
  ],
};

/* ---------- A river from source to mouth ---------- */
const RIVER = 'M170,125 C240,140 215,200 280,212 C350,225 330,285 400,296 C470,308 480,360 550,372 C620,384 640,418 684,432';
const chev = (x, y, deg) => `<g transform="translate(${x},${y}) rotate(${deg})"><path d="M-9,-9 L7,0 L-9,9" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>`;
D.river = {
  vb:'0 0 800 520', alt:'A river from its source to the sea', cap:'A river flows from its source to its mouth',
  bg:() => `<rect width="800" height="520" fill="#9BD38A"/><path d="M590,520 C610,450 690,415 740,418 C770,420 790,430 800,430 V520Z" fill="#4FB3E8"/><path d="M0,0 H300 C250,40 200,40 140,10 Z" fill="#8FCB6B" opacity=".0"/>${[[60, 70], [120, 50], [105, 105], [190, 70]].map(p => EM(p[0], p[1], '⛰️', 54)).join('')}${[[620, 250], [700, 300], [250, 380], [150, 300], [560, 470], [720, 150]].map(p => EM(p[0], p[1], '🌳', 34)).join('')}`,
  parts:[
    { id:'basin', l:'Drainage basin', names:['drainage basin', 'basin', 'area drained'], lab:[590, 78], svg:`<path class="hit" d="M110,150 C130,60 300,40 420,60 C560,50 640,80 620,170 C600,250 640,320 620,380 C600,440 520,420 440,410 C340,400 300,350 250,300 C190,260 90,240 110,150Z"/><path d="M110,150 C130,60 300,40 420,60 C560,50 640,80 620,170 C600,250 640,320 620,380 C600,440 520,420 440,410 C340,400 300,350 250,300 C190,260 90,240 110,150Z" fill="none" stroke="#7A5A33" stroke-width="3" stroke-dasharray="10 8"/>` },
    { id:'banks', ovHide:true, l:'Banks', names:['banks', 'bank'], lab:[236, 262, 'Banks', 'end'], svg:`<path d="${RIVER}" pathLength="1000" fill="none" stroke="#8B6B3E" stroke-width="28" stroke-linecap="round"/>` },
    { id:'embankment', ovHide:true, l:'Embankment', names:['embankment', 'embankments', 'raised sides'], lab:[640, 360, 'Embankment', 'start'], svg:`<path d="${RIVER}" pathLength="1000" fill="none" stroke="#6B5B47" stroke-width="44" stroke-dasharray="0 700 200 1000" stroke-linecap="butt"/>` },
    { id:'tributary', l:'Tributary', names:['tributary', 'tributaries', 'smaller river'], lab:[470, 156], svg:`<path d="M560,130 C540,190 440,200 340,255" fill="none" stroke="#8B6B3E" stroke-width="18" stroke-linecap="round"/><path d="M560,130 C540,190 440,200 340,255" fill="none" stroke="#3E8EDE" stroke-width="9" stroke-linecap="round"/><circle cx="560" cy="130" r="7" fill="#3E8EDE" stroke="#fff" stroke-width="2"/>` },
    { id:'course', l:'Course', names:['course', 'river', 'rivers'], lab:[470, 278], svg:`<path d="${RIVER}" fill="none" stroke="#3E8EDE" stroke-width="15" stroke-linecap="round"/>` },
    { id:'confluence', l:'Confluence', names:['confluence', 'two rivers meet'], lab:[304, 288, 'Confluence', 'end'], svg:`<circle cx="340" cy="255" r="24" class="hit"/><circle cx="340" cy="255" r="24" fill="none" stroke="#FE4D02" stroke-width="4" stroke-dasharray="6 5"/>` },
    { id:'downstream', ovHide:true, l:'Downstream', names:['downstream'], lab:[560, 336], svg:`<g>${chev(300, 232, 20)}${chev(470, 310, 20)}${chev(612, 396, 25)}</g><path d="${RIVER}" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="14 26" class="a-flow"/>` },
    { id:'transportation', ovHide:true, l:'Transportation', names:['transportation', 'carrying', 'transports', 'transported'], lab:[400, 345, 'Transportation'], svg:`<path d="${RIVER}" fill="none" stroke="#6B4F2A" stroke-width="6" stroke-dasharray="1 24" stroke-linecap="round" class="a-flow"/>` },
    { id:'erosion', ovHide:true, l:'Erosion', names:['erosion', 'erode', 'eroded', 'worn away'], lab:[540, 306, 'Erosion', 'start'], svg:`${[[498, 316, 0], [502, 330, 15], [496, 342, -15]].map(a => `<g transform="translate(${a[0]},${a[1]}) rotate(${a[2]})"><path d="M0,0 H24" stroke="#7A4A1E" stroke-width="5" stroke-linecap="round"/><path d="M18,-8 L30,0 L18,8Z" fill="#7A4A1E"/></g>`).join('')}` },
    { id:'deposition', ovHide:true, l:'Deposition', names:['deposition', 'deposit', 'deposited', 'dropped'], lab:[388, 372, 'Deposition', 'end'], svg:`<path d="M432,334 C446,328 470,334 476,350 C462,362 440,358 432,334Z" fill="#E7CF9B" stroke="#B89B5E" stroke-width="2"/>${[[446, 346], [458, 352], [452, 340], [466, 346]].map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="#B89B5E"/>`).join('')}` },
    { id:'landform', ovHide:true, l:'Landform', names:['landform', 'landforms', 'meander'], lab:[500, 410, 'Landform'], svg:`<circle cx="478" cy="338" r="62" class="hit"/>` },
    { id:'hydro', ovHide:true, l:'Hydro-electricity', names:['hydro-electricity', 'hydroelectricity', 'electricity', 'dam', 'turbine'], lab:[300, 168], svg:`<rect x="264" y="196" width="16" height="42" rx="3" fill="#9AA3AE" stroke="#fff" stroke-width="2" transform="rotate(10 272 216)"/>${EM(318, 200, '⚡', 38, 'a-twinkle')}` },
    { id:'source', l:'Source', names:['source', 'sources'], lab:[215, 108], svg:`<circle cx="170" cy="125" r="13" fill="#3E8EDE" stroke="#fff" stroke-width="3"/><circle class="a-twinkle" cx="170" cy="125" r="22" fill="none" stroke="#fff" stroke-width="3"/>` },
    { id:'mouth', l:'Mouth', names:['mouth', 'sea', 'lake'], lab:[650, 400, 'Mouth'], svg:`<path class="hit" d="M590,520 C610,450 690,415 740,418 C770,420 790,430 800,430 V520Z"/><circle cx="684" cy="432" r="26" fill="none" stroke="#FE4D02" stroke-width="4" stroke-dasharray="6 5"/>` },
  ],
};

/* ---------- Mountains and volcanoes ---------- */
D.volcano = {
  vb:'0 0 800 520', alt:'A mountain and a volcano, cut through to show inside', cap:'Mountains and volcanoes',
  bg:() => `<defs>${sky('vls')}<clipPath id="vlm"><path d="M30,380 L120,240 L170,150 L215,175 L262,205 L330,380Z"/></clipPath></defs><rect width="800" height="520" fill="url(#vls)"/>
   <rect x="0" y="380" width="800" height="140" fill="#B98B5E"/><rect x="0" y="480" width="800" height="40" fill="#F4A261"/>
   <path d="M0,380 H800" stroke="#fff" stroke-width="2" stroke-dasharray="8 6" opacity=".7"/>
   <path d="M30,380 L120,240 L170,150 L215,175 L262,205 L330,380Z" fill="#8D8F96"/><path d="M170,150 L150,190 L164,184 L174,198 L188,182 L215,175Z" fill="#fff"/>
   <path d="M360,380 L520,170 Q560,125 600,170 L760,380Z" fill="#7B5E57"/><path d="M0,380 Q200,360 360,380 Z" fill="#8FCB6B"/><path d="M760,380 Q780,368 800,372 V380Z" fill="#8FCB6B"/>`,
  parts:[
    { id:'mountain', l:'Mountain', names:['mountain', 'mountains'], lab:[110, 320], svg:`<path class="hit" d="M30,380 L120,240 L170,150 L215,175 L262,205 L330,380Z"/>` },
    { id:'peak', l:'Peak', names:['peak', 'peaks', 'summit', 'highest point'], lab:[170, 118], svg:EM(172, 138, '🚩', 36) },
    { id:'arete', l:'Arête', names:['arête', 'arete', 'ridge'], lab:[262, 188, 'Arête'], svg:`<path d="M170,150 L215,175 L262,205" fill="none" stroke="#2F2A28" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>` },
    { id:'altitude', l:'Altitude', names:['altitude', 'height', 'above sea level', 'sea level'], lab:[84, 112, 'Altitude'], svg:`<path d="M20,376 V158" stroke="#FE4D02" stroke-width="5"/><path d="M10,170 L20,148 L30,170Z M10,366 L20,388 L30,366Z" fill="#FE4D02"/><text class="t" x="52" y="372" font-size="15" fill="#fff" text-anchor="start">0 m</text>` },
    { id:'meltwater', ovHide:true, l:'Meltwater', names:['meltwater', 'melt', 'melting', 'snow', 'ice'], lab:[96, 296, 'Meltwater'], svg:`<path d="M160,196 C150,250 164,300 120,380" fill="none" stroke="#3E8EDE" stroke-width="6" stroke-linecap="round"/><path d="M160,196 C150,250 164,300 120,380" fill="none" stroke="#fff" stroke-width="2" class="a-flow"/>` },
    { id:'lahar', l:'Lahar', names:['lahar', 'lahars', 'mudflow'], lab:[420, 270, 'Lahar', 'end'], svg:`<path d="M526,176 C500,236 470,310 420,380" fill="none" stroke="#6B4423" stroke-width="16" stroke-linecap="round"/><path d="M526,176 C500,236 470,310 420,380" fill="none" stroke="#C99A6B" stroke-width="4" stroke-dasharray="3 14" class="a-flow"/>` },
    { id:'lava', l:'Lava', names:['lava'], lab:[696, 300, 'Lava'], svg:`<path d="M572,150 C600,200 610,236 650,296 C672,330 700,350 712,380" fill="none" stroke="#FF6A2A" stroke-width="15" stroke-linecap="round"/><path d="M572,150 C600,200 610,236 650,296 C672,330 700,350 712,380" fill="none" stroke="#FFD43B" stroke-width="5" stroke-dasharray="14 14" class="a-flow"/>` },
    { id:'erupt', l:'Eruption', names:['erupt', 'erupts', 'eruption', 'erupted', 'explode'], lab:[640, 70, 'Eruption'], svg:`<g class="a-bob"><circle cx="560" cy="96" r="26" fill="#6E6A6A"/><circle cx="596" cy="78" r="32" fill="#7C7878"/><circle cx="532" cy="82" r="22" fill="#7C7878"/><circle cx="570" cy="56" r="26" fill="#8D8888"/></g>${[538, 560, 582].map((x, i) => `<circle class="a-rise d${i + 1}" cx="${x}" cy="140" r="6" fill="#FFB020"/>`).join('')}` },
    { id:'magma', l:'Magma', names:['magma', 'molten rock', 'chamber', 'vent'], lab:[560, 462, 'Magma'], svg:`<rect x="548" y="146" width="24" height="270" fill="#FE4D02"/><ellipse cx="560" cy="426" rx="82" ry="40" fill="#FE4D02" stroke="#FFB020" stroke-width="4"/>` },
    { id:'plates', l:'Tectonic plates', names:['tectonic plates', 'tectonic plate', 'plates', 'crust'], lab:[250, 468, 'Tectonic plates'], svg:`<path d="M0,400 H196 L214,420 L190,440 L206,470 H0Z" fill="#A47551" stroke="#fff" stroke-width="3"/><path d="M214,400 H420 V470 H206 L190,440 L214,420Z" fill="#8C6239" stroke="#fff" stroke-width="3"/><path d="M60,436 H150" stroke="#fff" stroke-width="6" stroke-linecap="round"/><path d="M142,424 L162,436 L142,448Z" fill="#fff"/><path d="M360,436 H270" stroke="#fff" stroke-width="6" stroke-linecap="round"/><path d="M278,424 L258,436 L278,448Z" fill="#fff"/>` },
    { id:'minerals', ovHide:true, l:'Minerals', names:['minerals', 'mineral', 'chemical substances'], lab:[490, 408, 'Minerals'], svg:[[40, 424], [112, 452], [236, 430], [330, 452], [420, 424]].map((p, i) => EM(p[0], p[1], '💎', 26, 'a-twinkle d' + (i % 5 + 1))).join('') },
    { id:'geothermal', l:'Geothermal energy', names:['geothermal energy', 'geothermal'], lab:[794, 404, 'Geothermal', 'end'], svg:`${EM(762, 352, '🏭', 40)}${EM(736, 330, '♨️', 26, 'a-bob')}` },
  ],
};

/* ---------- Earth, zones and sunshine ---------- */
(function(){
  const CX = 330, CY = 262, R = 210;
  const half = y => Math.sqrt(Math.max(0, R * R - (y - CY) * (y - CY)));
  const arc = y => `M${CX - half(y)},${y} Q${CX},${y + 18} ${CX + half(y)},${y}`;
  const band = (a, b, fill) => `<rect x="${CX - R}" y="${a}" width="${2 * R}" height="${b - a}" fill="${fill}"/>`;
  D.globe = {
    vb:'0 0 800 520', alt:'The Earth with the sun shining on it', cap:'The Earth, the Equator and the climate zones',
    bg:() => `<defs>${sky('gls', '#10304A', '#1D4E73')}<clipPath id="glc"><circle cx="${CX}" cy="${CY}" r="${R}"/></clipPath></defs><rect width="800" height="520" fill="url(#gls)"/>${[[60, 40], [700, 60], [760, 220], [690, 470], [40, 470], [500, 25], [610, 500]].map((p, i) => `<circle class="a-twinkle d${i % 5 + 1}" cx="${p[0]}" cy="${p[1]}" r="3" fill="#fff"/>`).join('')}
      <g clip-path="url(#glc)">${band(CY - R, 120, '#E3F3FA')}${band(120, 200, '#8FCB6B')}${band(200, 324, '#F2C14E')}${band(324, 404, '#8FCB6B')}${band(404, CY + R, '#E3F3FA')}</g><circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="#fff" stroke-width="3" opacity=".7"/>`,
    parts:[
      { id:'sun', l:'The Sun', names:['sun', 'solar energy', 'sun’s rays', 'rays', 'sunlight'], lab:[104, 392, 'The Sun’s rays'], svg:`${EM(60, 262, '☀️', 80, 'a-bob')}${[200, 262, 324].map(y => `<path class="a-flow" d="M118,${y} L${CX - half(y) - 8},${y}" stroke="#FFD43B" stroke-width="6" stroke-linecap="round"/>`).join('')}` },
      { id:'polar', l:'Polar zones', names:['polar', 'polar zone', 'ice'], lab:[CX, 98, 'Polar zone'], svg:`<path class="hit" d="M${CX - half(120)},120 A${R},${R} 0 0 1 ${CX + half(120)},120Z"/><path class="hit" d="M${CX - half(404)},404 A${R},${R} 0 0 0 ${CX + half(404)},404Z"/>` },
      { id:'temperate', l:'Temperate zones', names:['temperate', 'temperate zone'], lab:[CX, 168, 'Temperate zone'], svg:`<path class="hit" d="M${CX - half(120)},120 H${CX + half(120)} L${CX + half(200)},200 H${CX - half(200)}Z"/><path class="hit" d="M${CX - half(324)},324 H${CX + half(324)} L${CX + half(404)},404 H${CX - half(404)}Z"/>` },
      { id:'tropics', l:'Tropical zone', names:['tropical', 'tropics', 'hot'], lab:[CX, 238, 'Tropical zone'], svg:`<path class="hit" d="M${CX - half(200)},200 H${CX + half(200)} L${CX + half(324)},324 H${CX - half(324)}Z"/>` },
      { id:'zones', l:'Climate zones', names:['climate zone', 'climate zones', 'zone', 'zones'], cls:'only', svg:`${[[CX, 80], [CX, 168], [CX, 262], [CX, 356], [CX, 440]].map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="14" fill="none" stroke="#FE4D02" stroke-width="4" stroke-dasharray="5 4" class="a-twinkle"/>`).join('')}` },
      { id:'latitude', l:'Lines of latitude', names:['latitude', 'lines of latitude'], lab:[566, 112, 'Latitude', 'start'], svg:[120, 200, 324, 404].map(y => `<path d="${arc(y)}" fill="none" stroke="#fff" stroke-width="3.5" stroke-dasharray="8 6"/>`).join('') + `<path d="M${CX + half(120) + 4},120 H556" stroke="#fff" stroke-width="2.5" stroke-dasharray="3 5"/>` },
      { id:'equator', l:'The Equator', names:['equator', 'the equator'], lab:[566, CY + 4, 'The Equator', 'start'], svg:`<path d="${arc(CY)}" fill="none" stroke="#FE4D02" stroke-width="5" stroke-dasharray="10 6" class="a-flow"/><path d="M${CX + R + 4},${CY} H556" stroke="#FE4D02" stroke-width="3" stroke-dasharray="3 5"/>` },
      { id:'poles', l:'The Poles', names:['poles', 'pole', 'north pole', 'south pole'], lab:[CX + 30, CY - R + 4, 'North Pole', 'start'], svg:`<circle cx="${CX}" cy="${CY - R}" r="9" fill="#FE4D02" stroke="#fff" stroke-width="3"/><circle cx="${CX}" cy="${CY + R}" r="9" fill="#FE4D02" stroke="#fff" stroke-width="3"/><text class="t" x="${CX + 30}" y="${CY + R + 4}" font-size="22" text-anchor="start" style="fill:#fff;stroke:#10304A;stroke-width:4px;paint-order:stroke">South Pole</text>` },
      { id:'biome', l:'Biomes', names:['biome', 'biomes'], lab:[CX, 436, 'Biomes'], svg:`${EM(CX + 96, 98, '🐧', 34)}${EM(CX + 138, 164, '🌳', 38)}${EM(CX - 138, 160, '🍂', 28)}${EM(CX - 124, 300, '🌴', 44)}${EM(CX + 116, 296, '🦁', 32)}${EM(CX + 30, 360, '🌳', 38)}${EM(CX + 96, 440, '🐧', 32)}` },
      { id:'temperature', l:'Temperature', names:['temperature'], lab:[722, 310, 'Temperature'], svg:`<g transform="translate(722,400)"><rect x="-12" y="-60" width="24" height="96" rx="12" fill="#fff" stroke="#fff"/><circle cx="0" cy="40" r="22" fill="#FE4D02" stroke="#fff" stroke-width="3"/><rect x="-7" y="-46" width="14" height="86" rx="7" fill="#FE4D02"/>${[-40, -20, 0, 20].map(y => `<path d="M14,${y} h12" stroke="#fff" stroke-width="3"/>`).join('')}</g>` },
      { id:'greenhouse', l:'Greenhouse gases', names:['greenhouse gases', 'greenhouse gas', 'greenhouse'], lab:[196, 30, 'Greenhouse gases'], svg:`<circle cx="${CX}" cy="${CY}" r="${R + 22}" fill="none" stroke="#B7E39A" stroke-width="10" stroke-dasharray="3 12" stroke-linecap="round" opacity=".95"/><path d="M${CX + R - 20},${CY - 150} C${CX + R + 50},${CY - 120} ${CX + R + 50},${CY - 40} ${CX + R - 10},${CY - 10}" fill="none" stroke="#FF8A5C" stroke-width="5" stroke-dasharray="9 7" class="a-flow"/>` },
    ],
  };
})();

/* ---------- A compass rose ---------- */
(function(){
  const CX = 300, CY = 262;
  const pt = (deg, r) => [CX + r * Math.sin(deg * Math.PI / 180), CY - r * Math.cos(deg * Math.PI / 180)];
  const kite = (deg, len, w, fill) => { const tip = pt(deg, len), a = pt(deg - 90, w), b = pt(deg + 90, w), c = pt(deg + 180, 14);
    return `<path d="M${tip[0].toFixed(1)},${tip[1].toFixed(1)} L${(CX + (a[0] - CX) + 0).toFixed(1)},${(CY + (a[1] - CY)).toFixed(1)} L${c[0].toFixed(1)},${c[1].toFixed(1)} L${b[0].toFixed(1)},${b[1].toFixed(1)}Z" fill="${fill}" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>`; };
  const dir = (id, l, names, deg, len, w, fill, labR, anchor) => { const p = pt(deg, labR); return { id, l, names, lab:[p[0].toFixed(0), (p[1] + 8).toFixed(0), l, anchor || 'middle'], svg:kite(deg, len, w, fill) }; };
  D.compass = {
    vb:'0 0 600 552', alt:'A compass rose', cap:'The points of a compass',
    bg:() => `<rect width="600" height="552" fill="#FFF8E6"/><circle cx="${CX}" cy="${CY}" r="206" fill="#fff" stroke="#3F6A8C" stroke-width="6"/><circle cx="${CX}" cy="${CY}" r="196" fill="none" stroke="#3F6A8C" stroke-width="2" stroke-dasharray="3 6"/>`,
    parts:[
      dir('NE', 'North-east', ['north-east', 'north east', 'northeast'], 45, 118, 20, '#F3BB17', 250),
      dir('SE', 'South-east', ['south-east', 'south east', 'southeast'], 135, 118, 20, '#F3BB17', 250),
      dir('SW', 'South-west', ['south-west', 'south west', 'southwest'], 225, 118, 20, '#F3BB17', 250),
      dir('NW', 'North-west', ['north-west', 'north west', 'northwest'], 315, 118, 20, '#F3BB17', 250),
      dir('N', 'North', ['north'], 0, 184, 26, '#FE4D02', 222),
      dir('E', 'East', ['east'], 90, 184, 26, '#3F6A8C', 218, 'start'),
      dir('S', 'South', ['south'], 180, 184, 26, '#3F6A8C', 226),
      dir('W', 'West', ['west'], 270, 184, 26, '#3F6A8C', 218, 'end'),
      { id:'compass', l:'Compass', names:['compass'], lab:[CX, 542, 'A compass'], svg:`<circle cx="${CX}" cy="${CY}" r="206" class="hit"/><circle cx="${CX}" cy="${CY}" r="12" fill="#fff" stroke="#3F6A8C" stroke-width="4"/>` },
      { id:'opposite', l:'Opposite', names:['opposite'], cls:'only', svg:`<path d="M${CX},${CY - 190} V${CY + 190} M${CX - 190},${CY} H${CX + 190}" stroke="#FE4D02" stroke-width="5" stroke-dasharray="10 8" class="a-flow"/>` },
      { id:'mnemonic', l:'Never Eat Shredded Wheat', names:['never eat shredded wheat'], cls:'only', svg:`<g fill="#FE4D02" font-family="Georgia,serif" font-weight="700" font-size="24" text-anchor="middle"><text x="${CX}" y="${CY - 84}">Never</text><text x="${CX + 96}" y="${CY + 8}">Eat</text><text x="${CX}" y="${CY + 96}">Shredded</text><text x="${CX - 96}" y="${CY + 8}">Wheat</text></g>` },
      { id:'sun', l:'Sunrise', names:['sun rises', 'sunrise', 'sun'], cls:'only', lab:[CX + 150, CY - 70, 'The sun rises in the east', 'middle'], svg:EM(CX + 238, CY - 34, '🌅', 56, 'a-bob') },
    ],
  };
})();

/* ---------- Reading a map: key, scale, north, contours ---------- */
D.mapskills = {
  vb:'0 0 800 520', alt:'A simple map with a key, a scale bar, a north arrow and contour lines', cap:'Reading a map',
  bg:() => `<rect width="800" height="520" fill="#FFF8E6"/><rect x="20" y="20" width="550" height="480" rx="10" fill="#B9E0A0" stroke="#3F6A8C" stroke-width="5"/>
   <path d="M20,330 C140,310 200,360 300,350 C400,340 440,380 570,372 V500 H20Z" fill="#CFEAB3"/>
   <path d="M40,60 C140,120 120,200 220,230 C320,260 360,330 440,380 C480,410 520,420 570,420" fill="none" stroke="#3E8EDE" stroke-width="12" stroke-linecap="round"/>
   <ellipse cx="390" cy="170" rx="60" ry="32" fill="#4FB3E8" stroke="#fff" stroke-width="3"/>
   ${EM(270, 110, '🏘️', 42)}${EM(380, 250, '⛪', 36)}${EM(270, 420, '🌲', 34)}${EM(320, 440, '🌲', 34)}${EM(240, 452, '🌲', 34)}
   <path d="M60,290 H540" stroke="#7A5A33" stroke-width="4" stroke-dasharray="14 8"/>`,
  parts:[
    { id:'contour', l:'Contour lines', names:['contour lines', 'contour line', 'contour', 'height'], lab:[150, 126, 'Contour lines'], svg:[[1, 78, 52], [2, 58, 38], [3, 38, 24], [4, 18, 10]].map(r => `<ellipse cx="150" cy="200" rx="${r[1] + 20}" ry="${r[2] + 14}" fill="${['none', '#D9C79A', '#CDB57E', '#BFA365'][r[0] - 1]}" stroke="#8B6B3E" stroke-width="3"/>`).join('') },
    { id:'trig', l:'Trig point', names:['trig point', 'trig points'], lab:[236, 196, 'Trig point', 'start'], svg:`<path d="M150,176 L161,198 H139Z" fill="#fff" stroke="#2B1A12" stroke-width="3"/><circle cx="150" cy="193" r="2.5" fill="#2B1A12"/>` },
    { id:'north', l:'North', names:['north', 'north points', 'up the page', 'up'], lab:[520, 112, 'North'], svg:`<g transform="translate(520,70)"><path d="M0,-34 L16,14 L0,4 L-16,14Z" fill="#FE4D02" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></g>` },
    { id:'scale', l:'Scale', names:['scale', 'scale bar'], lab:[130, 494, 'Scale'], svg:`<g transform="translate(60,466)"><path d="M0,0 H140" stroke="#2B1A12" stroke-width="5"/><path d="M0,-9 V9 M70,-6 V6 M140,-9 V9" stroke="#2B1A12" stroke-width="4"/><text class="t" x="0" y="-14" font-size="15" text-anchor="middle" stroke="none">0</text><text class="t" x="140" y="-14" font-size="15" text-anchor="middle" stroke="none">1 km</text></g>` },
    { id:'compass', l:'Compass', names:['compass'], lab:[520, 228, 'Compass'], svg:EM(520, 176, '🧭', 44, 'a-bob') },
    { id:'key', l:'Map key', names:['map key', 'key', 'symbols', 'symbol', 'map symbols'], lab:[680, 52, 'Map key'], svg:`<rect x="590" y="70" width="190" height="236" rx="12" fill="#fff" stroke="#3F6A8C" stroke-width="4"/><text class="t" x="685" y="100" font-size="20" stroke="none">KEY</text>${[['⛪', 'Church', 134], ['🌲', 'Wood', 166], ['🏘️', 'Village', 198]].map(k => `${EM(620, k[2], k[0], 26)}<text class="t" x="650" y="${k[2] + 6}" font-size="16" text-anchor="start" stroke="none">${k[1]}</text>`).join('')}<path d="M606,226 H636" stroke="#3E8EDE" stroke-width="8" stroke-linecap="round"/><text class="t" x="650" y="232" font-size="16" text-anchor="start" stroke="none">River</text><path d="M606,262 H636" stroke="#7A5A33" stroke-width="4" stroke-dasharray="7 4"/><text class="t" x="650" y="268" font-size="16" text-anchor="start" stroke="none">Path</text><path d="M621,282 L631,298 H611Z" fill="#fff" stroke="#2B1A12" stroke-width="2.5"/><text class="t" x="650" y="296" font-size="16" text-anchor="start" stroke="none">Trig point</text>` },
  ],
};

/* ---------- A Roman town in Britain ---------- */
D.romantown = {
  vb:'0 0 800 520', alt:'A Roman town in Britain with a Celtic hillfort nearby', cap:'Roman Britain',
  bg:() => `<defs>${sky('rts')}</defs><rect width="800" height="520" fill="url(#rts)"/><rect x="0" y="330" width="800" height="190" fill="#8FCB6B"/><path d="M0,330 Q90,230 200,330Z" fill="#7DB55B"/>`,
  parts:[
    { id:'hillfort', l:'Hillfort', names:['hillfort', 'hillforts', 'celtic fort'], lab:[100, 214], svg:`<path class="hit" d="M0,330 Q90,230 200,330Z"/><path d="M40,266 V240 M60,258 V232 M80,250 V224 M100,246 V220 M120,250 V224 M140,258 V232 M160,270 V244" stroke="#7A5A33" stroke-width="7" stroke-linecap="round"/>${EM(70, 308, '🛖', 36)}${EM(130, 312, '🛖', 36)}` },
    { id:'thatched', l:'Thatched roof', names:['thatched', 'thatch', 'straw'], lab:[160, 392, 'Thatched roof'], svg:`<g transform="translate(160,350)"><rect x="-34" y="0" width="68" height="30" fill="#E7CF9B" stroke="#B89B5E" stroke-width="3"/><path d="M-46,2 L0,-34 L46,2Z" fill="#D9A93B" stroke="#B07A1A" stroke-width="3"/>${[-26, -12, 2, 16, 28].map(x => `<path d="M${x},-2 l-6,-14" stroke="#B07A1A" stroke-width="2"/>`).join('')}</g>` },
    { id:'wattle', l:'Wattle and daub', names:['wattle and daub', 'wattle', 'daub'], lab:[92, 506, 'Wattle and daub'], svg:`<g transform="translate(20,410)"><rect width="110" height="80" fill="#E2C79B" stroke="#8B6B3E" stroke-width="3"/>${[10, 30, 50, 70, 90].map(x => `<path d="M${x},0 V80" stroke="#8B6B3E" stroke-width="4"/>`).join('')}${[14, 34, 54, 74].map(y => `<path d="M0,${y} q14,-8 28,0 t28,0 t28,0 t26,0" fill="none" stroke="#A67C45" stroke-width="4"/>`).join('')}<path d="M70,20 h30 v20 h-30Z M12,50 h28 v18 h-28Z" fill="#C9A06B" opacity=".85"/></g>` },
    { id:'aqueduct', l:'Aqueduct', names:['aqueduct', 'aqueducts'], lab:[395, 224], svg:`<rect x="230" y="256" width="330" height="74" fill="#D8C7A3" stroke="#B89B5E" stroke-width="3"/>${[0, 1, 2, 3, 4, 5].map(i => `<path d="M${236 + i * 54},330 V304 a21,21 0 0 1 42,0 V330Z" fill="#EAF6FB"/>`).join('')}<rect x="226" y="238" width="338" height="20" rx="4" fill="#B89B5E"/><rect x="232" y="242" width="326" height="11" rx="5" fill="#4FB3E8"/><path d="M232,247 H558" stroke="#fff" stroke-width="2.5" stroke-dasharray="10 12" class="a-flow"/>` },
    { id:'amphitheatre', l:'Amphitheatre', names:['amphitheatre', 'amphitheater'], lab:[360, 490], svg:`<ellipse cx="360" cy="420" rx="104" ry="40" fill="#E7CFA3" stroke="#B98B5E" stroke-width="7"/><ellipse cx="360" cy="420" rx="76" ry="26" fill="#F0E0B8" stroke="#B98B5E" stroke-width="3"/><ellipse cx="360" cy="420" rx="46" ry="14" fill="#F4D58A"/>${EM(332, 416, '⚔️', 20)}` },
    { id:'forum', l:'Forum', names:['forum', 'fora'], lab:[540, 482], svg:`<rect x="470" y="396" width="150" height="70" rx="6" fill="#EAD9B6" stroke="#B98B5E" stroke-width="3"/>${EM(545, 400, '🏛️', 70)}${EM(490, 450, '🧑‍🌾', 24)}${EM(600, 452, '🛒', 24)}` },
    { id:'hypocaust', l:'Hypocaust system', names:['hypocaust system', 'hypocaust', 'underfloor heating'], lab:[705, 482, 'Hypocaust system'], svg:`<path d="M636,350 L706,300 L776,350Z" fill="#C0583A" stroke="#7A3320" stroke-width="3"/><rect x="644" y="350" width="124" height="46" fill="#F1D9A8" stroke="#B98B5E" stroke-width="3"/><rect x="644" y="396" width="124" height="14" fill="#B89B5E"/>${[656, 690, 724, 752].map(x => `<rect x="${x}" y="410" width="12" height="32" fill="#B98B5E"/>`).join('')}<rect x="644" y="442" width="124" height="10" fill="#8B6B3E"/>${EM(634, 432, '🔥', 30, 'a-twinkle')}${[672, 710, 742].map((x, i) => `<path class="a-rise d${i + 1}" d="M${x},436 q6,-8 0,-16" stroke="#F4A261" stroke-width="4" fill="none" stroke-linecap="round"/>`).join('')}` },
    { id:'wall', l:'Hadrian’s Wall', names:['hadrian’s wall', 'hadrian wall', 'wall'], lab:[690, 160, 'Hadrian’s Wall'], svg:`<path d="M560,222 L640,206 L720,196 L800,178" fill="none" stroke="#8D8F96" stroke-width="16" stroke-linecap="round"/><path d="M560,222 L640,206 L720,196 L800,178" fill="none" stroke="#D3D6DA" stroke-width="5" stroke-dasharray="10 8"/>${[[610, 208], [680, 199], [760, 186]].map(p => `<rect x="${p[0] - 8}" y="${p[1] - 28}" width="16" height="26" fill="#8D8F96" stroke="#fff" stroke-width="2"/>`).join('')}` },
    { id:'town', ovHide:true, l:'Roman town', names:['romano-british', 'roman town', 'town'], lab:[560, 372, 'Roman town'], svg:`<path class="hit" d="M440,360 H800 V510 H440Z"/>` },
  ],
};

/* ---------- A plant ---------- */
D.plant = {
  vb:'0 0 800 520', alt:'A plant with roots, stem, leaves and a flower', cap:'The parts of a plant',
  bg:() => `<defs>${sky('pls')}</defs><rect width="800" height="520" fill="url(#pls)"/><rect x="0" y="330" width="800" height="190" fill="#B98B5E"/><rect x="0" y="322" width="800" height="14" fill="#6DBE67"/>${[[90, 400], [220, 470], [600, 420], [720, 480], [520, 500], [40, 480]].map(p => `<ellipse cx="${p[0]}" cy="${p[1]}" rx="14" ry="7" fill="#9C6F45"/>`).join('')}`,
  parts:[
    { id:'sun', l:'Light', names:['sun', 'light', 'sunlight'], lab:[110, 150, 'Sunlight'], svg:`${EM(100, 76, '☀️', 74, 'a-bob')}<path d="M160,110 C230,140 290,190 332,240" fill="none" stroke="#FFD43B" stroke-width="6" stroke-dasharray="12 10" stroke-linecap="round" class="a-flow"/>` },
    { id:'air', l:'Air', names:['air', 'wind'], lab:[640, 150, 'Air'], svg:`${EM(590, 120, '💨', 44, 'a-bob')}${EM(660, 190, '💨', 40, 'a-bob d2')}` },
    { id:'soil', l:'Soil', names:['soil', 'ground'], lab:[160, 372, 'Soil'], svg:`<path class="hit" d="M0,336 H800 V520 H0Z"/>` },
    { id:'water', l:'Water', names:['water'], lab:[560, 462, 'Water'], svg:`${EM(300, 436, '💧', 38, 'a-bob')}${EM(510, 440, '💧', 38, 'a-bob d2')}<path d="M300,420 C320,400 340,390 372,380 M510,424 C490,404 460,392 430,382" fill="none" stroke="#3E8EDE" stroke-width="5" stroke-dasharray="10 8" stroke-linecap="round" class="a-flow"/>` },
    { id:'roots', l:'Roots', names:['roots', 'root', 'anchors', 'anchor'], lab:[470, 500, 'Roots', 'start'], svg:`<g fill="none" stroke="#7A4A1E" stroke-width="7" stroke-linecap="round"><path d="M400,332 C400,390 382,420 340,462"/><path d="M400,332 C406,392 430,424 470,462"/><path d="M400,338 C380,372 332,382 296,396"/><path d="M400,338 C430,368 470,372 506,386"/><path d="M400,332 V490"/></g>` },
    { id:'stem', l:'Stem', names:['stem', 'stems'], lab:[440, 300, 'Stem', 'start'], svg:`<path d="M400,332 V190" stroke="#4C9A3D" stroke-width="16" stroke-linecap="round"/><path d="M400,300 V210" stroke="#7BC36B" stroke-width="4" stroke-dasharray="6 8" class="a-flow"/>` },
    { id:'leaves', l:'Leaves', names:['leaves', 'leaf'], lab:[262, 252, 'Leaves'], svg:`<path d="M400,278 C340,256 304,292 292,306 C346,318 390,308 400,278Z" fill="#6DBE67" stroke="#3E8A3A" stroke-width="3"/><path d="M400,246 C462,220 500,260 510,272 C454,286 410,276 400,246Z" fill="#6DBE67" stroke="#3E8A3A" stroke-width="3"/><path d="M400,278 L304,300 M400,246 L500,268" stroke="#3E8A3A" stroke-width="2.5"/>` },
    { id:'flower', l:'Flower', names:['flower', 'flowers', 'petals', 'petal'], lab:[400, 94, 'Flower'], svg:`${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<circle cx="${(400 + 36 * Math.cos(a * Math.PI / 180)).toFixed(1)}" cy="${(166 + 36 * Math.sin(a * Math.PI / 180)).toFixed(1)}" r="21" fill="#EF915E" stroke="#fff" stroke-width="2"/>`).join('')}<circle cx="400" cy="166" r="20" fill="#F3BB17" stroke="#fff" stroke-width="2"/>` },
    { id:'insect', l:'Insects', names:['insects', 'insect', 'bee'], lab:[520, 102, 'Insect'], svg:EM(500, 150, '🐝', 40, 'a-bob') },
    { id:'seed', l:'Seeds', names:['seed', 'seeds', 'new plant'], lab:[690, 392, 'Seeds'], svg:`${EM(660, 352, '🌰', 38)}${EM(730, 352, '🌱', 44, 'a-sway')}` },
  ],
};

/* ---------- A skeleton and muscles ---------- */
(function(){
  const bone = '#F5F0E6', line = '#8A8478';
  const rib = (y, s) => `<path d="M400,${y} C${400 + s * 70},${y - 6} ${400 + s * 80},${y + 26} ${400 + s * 40},${y + 36}" fill="none" stroke="${line}" stroke-width="6" stroke-linecap="round"/>`;
  D.skeleton = {
    vb:'0 0 800 520', alt:'A human skeleton with a muscle in the arm', cap:'Bones and muscles',
    bg:() => `<defs>${sky('sks', '#EAF6FB', '#EAF6FB')}</defs><rect width="800" height="520" fill="#EAF6FB"/>${[[400, 90]].map(() => '').join('')}
      <g stroke="${line}" stroke-width="3" fill="${bone}" stroke-linecap="round" stroke-linejoin="round">
       <path d="M346,152 L300,250 M300,250 L268,344" stroke-width="14" fill="none"/><path d="M454,152 L500,250 M500,250 L532,344" stroke-width="14" fill="none"/>
       <path d="M378,312 L362,420 M362,420 L350,500" stroke-width="16" fill="none"/><path d="M422,312 L438,420 M438,420 L450,500" stroke-width="16" fill="none"/>
       <ellipse cx="400" cy="318" rx="56" ry="24"/></g>`,
    parts:[
      { id:'bones', l:'Bones', names:['skeleton', 'bones', 'bone', 'vertebrates', 'vertebrate'], lab:[640, 92, 'Skeleton'], svg:`<path class="hit" d="M270,40 H530 V510 H270Z"/>` },
      { id:'skull', l:'Skull', names:['skull', 'brain', 'head'], lab:[400, 36, 'Skull'], svg:`<circle cx="400" cy="92" r="40" fill="${bone}" stroke="${line}" stroke-width="4"/><rect x="376" y="118" width="48" height="26" rx="8" fill="${bone}" stroke="${line}" stroke-width="4"/><circle cx="385" cy="90" r="9" fill="#3A3633"/><circle cx="415" cy="90" r="9" fill="#3A3633"/>` },
      { id:'spine', l:'Spine', names:['spine', 'back', 'backbone'], lab:[466, 340, 'Spine', 'start'], svg:`<path d="M400,146 V296" stroke="${line}" stroke-width="3"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => `<rect x="390" y="${150 + i * 17}" width="20" height="13" rx="5" fill="${bone}" stroke="${line}" stroke-width="3"/>`).join('')}` },
      { id:'ribs', l:'Ribs', names:['ribs', 'rib', 'heart', 'lungs'], lab:[330, 168, 'Ribs', 'end'], svg:[158, 176, 194, 212, 230].map(y => rib(y, -1) + rib(y, 1)).join('') },
      { id:'joint', l:'Joints', names:['joint', 'joints', 'elbow', 'knee'], lab:[250, 266, 'Joint', 'end'], svg:`${[[300, 250], [500, 250], [362, 420], [438, 420]].map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="14" fill="#E7B66B" stroke="#fff" stroke-width="3"/>`).join('')}` },
      { id:'muscle', l:'Muscles', names:['muscles', 'muscle', 'move'], lab:[530, 186, 'Muscle', 'start'], svg:`<g transform="rotate(-25 480 204)"><ellipse cx="480" cy="204" rx="17" ry="50" fill="#D2483B" stroke="#8E241B" stroke-width="3"/><path d="M475,160 V248 M485,160 V248" stroke="#E8776C" stroke-width="2.5"/></g>` },
      { id:'snail', l:'Snail', names:['snail', 'snails'], lab:[690, 200, 'Snail'], svg:EM(690, 160, '🐌', 54) },
      { id:'crab', l:'Crab', names:['crab', 'shell'], lab:[690, 372, 'Crab'], svg:EM(690, 330, '🦀', 54) },
    ],
  };
})();

/* ---------- Light and shadows ---------- */
D.shadow = {
  vb:'0 0 800 520', alt:'Light from the Sun is blocked by an object and makes a shadow', cap:'Light and shadows',
  bg:() => `<defs>${sky('shs', '#BFE3F7', '#EAF6FB')}</defs><rect width="800" height="520" fill="url(#shs)"/><path d="M0,430 H800 V520 H0Z" fill="#8FCB6B"/>`,
  parts:[
    { id:'sun', l:'Light source', names:['light source', 'the sun', 'sun', 'torch', 'lamp'], lab:[90, 164, 'Light source'], svg:EM(90, 96, '☀️', 80, 'a-bob') },
    { id:'rays', l:'Light rays', names:['light', 'straight lines', 'rays'], lab:[360, 190, 'Light travels in straight lines'], svg:`${[[150, 125, 300, 336], [150, 130, 300, 372], [150, 135, 300, 408]].map((r, i) => `<path d="M${r[0]},${r[1]} L${r[2]},${r[3]}" stroke="#FFD43B" stroke-width="5" stroke-dasharray="14 10" stroke-linecap="round" class="a-flow"/>`).join('')}<path d="M150,140 L260,428" stroke="#FFD43B" stroke-width="0"/>` },
    { id:'brick', l:'Opaque object', names:['opaque', 'brick', 'book', 'object', 'objects'], lab:[372, 352, 'Opaque object', 'start'], svg:`<rect x="300" y="320" width="64" height="110" rx="6" fill="#B5543A" stroke="#7A3320" stroke-width="3"/><path d="M300,357 H364 M300,393 H364 M332,320 V357 M316,357 V393 M348,357 V393" stroke="#7A3320" stroke-width="2"/>` },
    { id:'shadow', l:'Shadow', names:['shadow', 'shadows', 'blocked'], lab:[500, 510, 'Shadow'], svg:`<path d="M364,432 L640,432 L610,486 L340,486Z" fill="#2F3E46" opacity=".6"/>` },
    { id:'low', l:'Low sun', names:['low in the sky', 'low', 'longest'], cls:'only', lab:[200, 400, 'A low Sun makes a long shadow'], svg:`${EM(60, 392, '🌇', 58)}<path d="M364,432 L760,432 L728,488 L338,488Z" fill="#2F3E46" opacity=".55"/>` },
    { id:'glass', l:'Transparent', names:['transparent', 'clear glass', 'window', 'clear plastic', 'glass'], lab:[560, 304, 'Transparent'], svg:`<rect x="538" y="326" width="44" height="104" rx="4" fill="#BFE9F7" stroke="#6BB3D1" stroke-width="3" opacity=".85"/><path d="M546,346 L562,334 M546,374 L574,350" stroke="#fff" stroke-width="4" stroke-linecap="round"/><path d="M300,336 L440,356 M510,360 L640,380" stroke="#FFD43B" stroke-width="4" stroke-dasharray="10 8" class="a-flow" opacity="0"/>` },
    { id:'mirror', l:'Mirror', names:['mirror', 'bounce', 'bounces'], lab:[650, 196, 'Mirror'], svg:`<rect x="640" y="214" width="14" height="96" rx="4" fill="#CFE7F2" stroke="#6BB3D1" stroke-width="3" transform="rotate(-18 647 262)"/><path d="M540,160 L640,258" stroke="#FFD43B" stroke-width="5" stroke-dasharray="12 9" class="a-flow"/><path d="M640,258 L720,170" stroke="#FFD43B" stroke-width="5" stroke-dasharray="12 9" class="a-flow"/>` },
    { id:'eye', l:'Your eyes', names:['eyes', 'eye', 'see', 'seen'], lab:[722, 134, 'Your eyes'], svg:`${EM(724, 82, '👁️', 56)}<path d="M690,186 L722,112" stroke="#FFD43B" stroke-width="5" stroke-dasharray="10 8" class="a-flow" opacity="0"/>` },
  ],
};

/* ---------- Forces and magnets ---------- */
D.magnets = {
  vb:'0 0 800 520', alt:'Magnets attracting and repelling, friction, and gravity', cap:'Forces and magnets',
  bg:() => `<rect width="800" height="520" fill="#FFF8E6"/><path d="M400,20 V500" stroke="#EADBB6" stroke-width="3" stroke-dasharray="8 8"/><path d="M20,260 H780" stroke="#EADBB6" stroke-width="3" stroke-dasharray="8 8"/>`,
  parts:[
    { id:'attract', l:'Attract', names:['attract', 'attracts', 'attracted', 'north and south'], lab:[190, 34, 'Opposite poles attract'], svg:`<g transform="translate(14,60)"><rect width="80" height="50" rx="8" fill="#FE4D02"/><rect x="80" width="80" height="50" rx="8" fill="#3F6A8C"/><text class="t" x="40" y="34" font-size="26" style="fill:#fff">N</text><text class="t" x="120" y="34" font-size="26" style="fill:#fff">S</text></g><g transform="translate(184,60)"><rect width="80" height="50" rx="8" fill="#FE4D02"/><rect x="80" width="80" height="50" rx="8" fill="#3F6A8C"/><text class="t" x="40" y="34" font-size="26" style="fill:#fff">N</text><text class="t" x="120" y="34" font-size="26" style="fill:#fff">S</text></g><path d="M174,126 L184,126" stroke="#3FAE45" stroke-width="0"/>` },
    { id:'repel', l:'Repel', names:['push apart', 'repel', 'repels', 'north poles', 'two north poles'], lab:[190, 168, 'Like poles push apart'], svg:`<g transform="translate(14,184)"><rect width="80" height="50" rx="8" fill="#3F6A8C"/><rect x="80" width="80" height="50" rx="8" fill="#FE4D02"/><text class="t" x="40" y="34" font-size="26" style="fill:#fff">S</text><text class="t" x="120" y="34" font-size="26" style="fill:#fff">N</text></g><g transform="translate(214,184)"><rect width="80" height="50" rx="8" fill="#FE4D02"/><rect x="80" width="80" height="50" rx="8" fill="#3F6A8C"/><text class="t" x="40" y="34" font-size="26" style="fill:#fff">N</text><text class="t" x="120" y="34" font-size="26" style="fill:#fff">S</text></g><path d="M188,209 H200 M200,209 L194,203 M200,209 L194,215 M214,209 H202" stroke="#FE4D02" stroke-width="3" stroke-linecap="round" fill="none"/>` },
    { id:'poles', l:'Poles', names:['poles', 'pole', 'ends of a magnet', 'north', 'south'], svg:`<path class="hit" d="M8,54 H350 V116 H8Z M8,178 H390 V240 H8Z"/>` },
    { id:'metal', l:'Magnetic', names:['iron nail', 'nail', 'steel paper clip', 'paper clip', 'metal', 'metals', 'iron', 'steel'], lab:[600, 30, 'Magnets pull on some metals'], svg:`${EM(520, 100, '🧲', 56, 'a-bob')}${EM(600, 165, '🔩', 40, 'a-wiggle')}${EM(676, 120, '📎', 40, 'a-wiggle d2')}${EM(724, 160, '🔩', 36, 'a-wiggle d3')}` },
    { id:'nonmetal', l:'Not magnetic', names:['wooden spoon', 'plastic cup', 'rubber', 'paper', 'wood', 'plastic'], lab:[620, 252, 'Not magnetic'], svg:`${EM(560, 214, '🥄', 34)}${EM(620, 214, '🥤', 34)}${EM(680, 214, '🧽', 34)}` },
    { id:'friction', l:'Friction', names:['friction', 'slows things down', 'surface', 'carpet', 'ice', 'polished glass', 'rub'], lab:[200, 296, 'Friction slows things down'], svg:`<rect x="60" y="400" width="260" height="30" rx="6" fill="#B5543A"/><path d="M70,414 l8,-6 l8,6 l8,-6 l8,6 l8,-6 l8,6 l8,-6 l8,6 l8,-6 l8,6 l8,-6 l8,6 l8,-6 l8,6 l8,-6 l8,6 l8,-6 l8,6 l8,-6 l8,6" fill="none" stroke="#7A3320" stroke-width="3"/><rect x="150" y="350" width="60" height="50" rx="6" fill="#F3BB17" stroke="#B88A00" stroke-width="3"/><path d="M290,380 H230" stroke="#FE4D02" stroke-width="6" stroke-linecap="round"/><path d="M240,368 L222,380 L240,392Z" fill="#FE4D02"/><path d="M110,380 H70" stroke="#3F6A8C" stroke-width="5" stroke-dasharray="8 7"/><rect x="60" y="446" width="260" height="22" rx="6" fill="#CFEAF7"/><text class="t" x="190" y="463" font-size="15" style="fill:#3F6A8C">Ice: very little friction</text><text class="t" x="190" y="340" font-size="15" stroke="none">Carpet: lots of friction</text>` },
    { id:'gravity', l:'Gravity', names:['gravity', 'pull of the earth', 'earth'], lab:[600, 296, 'Gravity pulls things down'], svg:`${EM(600, 470, '🌍', 80)}${EM(600, 350, '🍎', 40, 'a-fall')}<path d="M650,340 V420" stroke="#FE4D02" stroke-width="6" stroke-linecap="round"/><path d="M638,410 L650,432 L662,410Z" fill="#FE4D02"/>` },
    { id:'force', l:'Forces', names:['force', 'forces', 'push', 'pull'], svg:`<path class="hit" d="M226,362 H300 V398 H226Z M634,336 H666 V438 H634Z"/>` },
  ],
};

/* ---------- Solid, liquid, gas ---------- */
D.states = {
  vb:'0 0 800 520', alt:'Particles in a solid, a liquid and a gas', cap:'Solids, liquids and gases',
  bg:() => `<rect width="800" height="520" fill="#EAF6FB"/>${[0, 1, 2].map(i => `<rect x="${24 + i * 262}" y="150" width="236" height="250" rx="18" fill="#fff" stroke="#BFE3F7" stroke-width="4"/>`).join('')}`,
  parts:[
    { id:'solid', l:'Solid', names:['solid', 'solids', 'pencil', 'brick', 'ice'], lab:[142, 432, 'Solid'], svg:`<path class="hit" d="M24,150 H260 V400 H24Z"/>${[0, 1, 2, 3, 4].map(r => [0, 1, 2, 3, 4].map(c => `<circle cx="${68 + c * 32}" cy="${210 + r * 32}" r="14" fill="#4F8FD9" stroke="#fff" stroke-width="2"/>`).join('')).join('')}` },
    { id:'liquid', l:'Liquid', names:['liquid', 'liquids', 'water', 'milk', 'juice', 'container'], lab:[404, 432, 'Liquid'], svg:`<path class="hit" d="M286,150 H522 V400 H286Z"/><path d="M296,290 H512 V390 H296Z" fill="#BFE3F7" opacity=".7"/>${[[330, 320], [376, 336], [420, 318], [468, 338], [350, 364], [402, 372], [452, 366], [334, 300], [490, 312]].map((p, i) => `<circle class="a-wiggle d${i % 5 + 1}" cx="${p[0]}" cy="${p[1]}" r="13" fill="#4F8FD9" stroke="#fff" stroke-width="2"/>`).join('')}` },
    { id:'gas', l:'Gas', names:['gas', 'gases', 'steam', 'air', 'water vapour'], lab:[666, 432, 'Gas'], svg:`<path class="hit" d="M548,150 H784 V400 H548Z"/>${[[580, 190], [700, 200], [640, 250], [750, 280], [590, 320], [690, 350], [760, 190], [610, 380]].map((p, i) => `<circle class="a-bob d${i % 5 + 1}" cx="${p[0]}" cy="${p[1]}" r="13" fill="#4F8FD9" stroke="#fff" stroke-width="2"/>`).join('')}` },
    { id:'melting', l:'Melting', names:['melts', 'melting', 'melt', 'heated'], lab:[272, 98, 'Melting'], svg:`<path d="M170,128 C220,100 300,100 380,128" fill="none" stroke="#FE4D02" stroke-width="6" stroke-linecap="round" stroke-dasharray="12 9" class="a-flow"/><path d="M366,114 L388,130 L360,140Z" fill="#FE4D02"/>${EM(262, 62, '🔥', 34, 'a-twinkle')}` },
    { id:'evaporation', l:'Evaporation', names:['evaporation', 'evaporates', 'evaporate'], lab:[534, 98, 'Evaporation'], svg:`<path d="M430,128 C480,100 560,100 640,128" fill="none" stroke="#FE4D02" stroke-width="6" stroke-linecap="round" stroke-dasharray="12 9" class="a-flow"/><path d="M626,114 L648,130 L620,140Z" fill="#FE4D02"/>${EM(524, 62, '☀️', 34, 'a-twinkle')}` },
    { id:'freezing', l:'Freezing', names:['freezes', 'freezing', 'freeze', 'cooled'], lab:[272, 512, 'Freezing'], svg:`<path d="M380,452 C320,482 220,482 150,452" fill="none" stroke="#3E8EDE" stroke-width="6" stroke-linecap="round" stroke-dasharray="12 9" class="a-flow"/><path d="M164,468 L142,450 L170,442Z" fill="#3E8EDE"/>` },
    { id:'condensation', l:'Condensation', names:['condensation', 'cooling', 'drops'], lab:[534, 512, 'Condensation'], svg:`<path d="M640,452 C580,482 480,482 410,452" fill="none" stroke="#3E8EDE" stroke-width="6" stroke-linecap="round" stroke-dasharray="12 9" class="a-flow"/><path d="M424,468 L402,450 L430,442Z" fill="#3E8EDE"/>` },
    { id:'precipitation', l:'Precipitation', names:['precipitation', 'rain', 'snow', 'hail'], lab:[666, 62, 'Precipitation'], svg:`${EM(666, 100, '🌧️', 54, 'a-bob')}` },
  ],
};

/* ---------- Sound ---------- */
D.sound = {
  vb:'0 0 800 520', alt:'A bell makes vibrations that travel through the air to an ear', cap:'How sound travels',
  bg:() => `<rect width="800" height="520" fill="#FFF8E6"/><rect x="20" y="300" width="760" height="200" rx="16" fill="#fff" stroke="#EADBB6" stroke-width="3"/>`,
  parts:[
    { id:'source', l:'Source', names:['source', 'bell', 'speaker'], lab:[110, 262, 'The sound source'], svg:`<g class="a-shake">${EM(110, 170, '🔔', 90)}</g>` },
    { id:'vibration', l:'Vibrations', names:['vibrations', 'vibration', 'vibrate', 'vibrates', 'vibrating'], lab:[110, 76, 'Vibrations'], svg:`<path d="M52,120 q-18,48 0,96 M168,120 q18,48 0,96" fill="none" stroke="#FE4D02" stroke-width="6" stroke-linecap="round" class="a-twinkle"/><path d="M34,130 q-24,38 0,76 M186,130 q24,38 0,76" fill="none" stroke="#FE4D02" stroke-width="5" stroke-linecap="round" class="a-twinkle d2"/>` },
    { id:'travel', l:'Sound travels', names:['sound travels', 'travels', 'air', 'distance', 'further away', 'waves'], lab:[420, 76, 'Sound travels as waves'], svg:`${[0, 1, 2, 3].map(i => `<path d="M${230 + i * 90},${120 - i * 6} q${30 + i * 6},${60 + i * 6} 0,${120 + i * 12}" fill="none" stroke="#3E8EDE" stroke-width="${7 - i}" stroke-linecap="round" opacity="${1 - i * 0.2}" class="a-twinkle d${i + 1}"/>`).join('')}` },
    { id:'ear', l:'Ear', names:['ear', 'ears', 'hear', 'hearing'], lab:[700, 262, 'Your ear hears it'], svg:EM(700, 170, '👂', 90) },
    { id:'pitch', l:'Pitch', names:['pitch', 'higher pitch', 'faster vibration', 'slower vibration', 'high', 'low'], lab:[210, 330, 'Pitch: how high or low'], svg:`<path d="M40,420 q12,-34 24,0 t24,0 t24,0 t24,0 t24,0 t24,0 t24,0 t24,0" fill="none" stroke="#FE4D02" stroke-width="5"/><text class="t" x="130" y="466" font-size="17" stroke="none">High pitch: fast</text><path d="M240,420 q36,-34 72,0 t72,0 t72,0" fill="none" stroke="#3E8EDE" stroke-width="5"/><text class="t" x="330" y="466" font-size="17" stroke="none">Low pitch: slow</text>` },
    { id:'volume', l:'Volume', names:['louder', 'loud', 'quieter', 'quiet', 'volume', 'bigger vibration', 'smaller vibration'], lab:[640, 330, 'Volume: how loud'], svg:`<path d="M470,420 q16,-60 32,0 t32,0 t32,0" fill="none" stroke="#FE4D02" stroke-width="5"/><text class="t" x="518" y="466" font-size="17" stroke="none">Loud: big</text><path d="M630,420 q16,-18 32,0 t32,0 t32,0" fill="none" stroke="#3E8EDE" stroke-width="5"/><text class="t" x="680" y="466" font-size="17" stroke="none">Quiet: small</text>` },
  ],
};

/* ---------- An electric circuit ---------- */
D.circuit = {
  vb:'0 0 800 520', alt:'A complete circuit lights a bulb; a broken circuit does not', cap:'Electric circuits',
  bg:() => `<rect width="800" height="520" fill="#FFF8E6"/><path d="M400,30 V490" stroke="#EADBB6" stroke-width="3" stroke-dasharray="8 8"/>`,
  parts:[
    { id:'wire', l:'Wires', names:['wire', 'wires', 'copper wire', 'copper', 'metal key', 'conductor', 'conductors'], lab:[96, 186, 'Wires', 'end'], svg:`<g fill="none" stroke="#C97B2D" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"><path d="M110,230 V130 H190 M270,130 H310 V230 V340 H260 M200,340 H110 V270"/></g>` },
    { id:'battery', l:'Battery', names:['battery', 'cell', 'power'], lab:[110, 296, 'Battery'], svg:`<g transform="translate(78,226)"><rect width="64" height="46" rx="8" fill="#3F6A8C"/><rect x="64" y="14" width="8" height="18" fill="#3F6A8C"/><text class="t" x="32" y="31" font-size="22" style="fill:#fff">+ −</text></g>` },
    { id:'bulb', l:'Bulb', names:['bulb', 'lamp', 'light up', 'lights up', 'light'], lab:[230, 64, 'Bulb'], svg:`${EM(230, 128, '💡', 56, 'a-twinkle')}${[[170, 84], [290, 84]].map(p => `<path d="M${p[0]},${p[1]} l${(p[0] - 230) / 6},${(p[1] - 112) / 6}" stroke="#FFD43B" stroke-width="5" stroke-linecap="round"/>`).join('')}` },
    { id:'switch', l:'Switch', names:['switch', 'switches'], lab:[230, 392, 'Switch (closed)'], svg:`<circle cx="200" cy="340" r="9" fill="#3F6A8C"/><circle cx="260" cy="340" r="9" fill="#3F6A8C"/><path d="M200,340 L258,338" stroke="#FE4D02" stroke-width="8" stroke-linecap="round"/>` },
    { id:'complete', l:'Complete circuit', names:['complete', 'closed', 'whole loop'], lab:[230, 440, 'Complete circuit: the bulb is on'], svg:`<rect class="hit frame" rx="22" x="84" y="104" width="256" height="264"/>` },
    { id:'broken', l:'Broken circuit', names:['broken', 'break', 'breaks', 'off', 'open', 'wet'], lab:[600, 440, 'Broken circuit: the bulb is off'], svg:`<g fill="none" stroke="#C97B2D" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"><path d="M510,230 V130 H590 M670,130 H710 V230 V340 H690 M620,340 H510 V270"/></g><g transform="translate(478,226)"><rect width="64" height="46" rx="8" fill="#3F6A8C"/><rect x="64" y="14" width="8" height="18" fill="#3F6A8C"/></g>${EM(630, 128, '💡', 56, 'bulboff')}<circle cx="600" cy="340" r="9" fill="#3F6A8C"/><circle cx="660" cy="340" r="9" fill="#3F6A8C"/><path d="M600,340 L650,306" stroke="#FE4D02" stroke-width="8" stroke-linecap="round"/><rect class="hit frame" rx="22" x="484" y="104" width="256" height="264"/>` },
    { id:'insulator', l:'Insulator', names:['insulator', 'insulators', 'plastic', 'rubber', 'wool'], lab:[420, 500, 'Insulators stop electricity'], svg:`${EM(236, 492, '🧤', 28)}` },
    { id:'mains', l:'Mains electricity', names:['mains electricity', 'mains', 'dangerous', 'danger'], lab:[400, 22, 'Mains electricity is dangerous'], svg:`${EM(386, 60, '⚠️', 30)}` },
  ],
};
window.FAB_VIS_DIA_LOADED = true;
})();
