/* Fox Blocks: the coding area, junior level. A first playable draft. (The file names and the saving key keep the working title, "Fab Code".)
   Built on Blockly (lib/blockly, Apache 2.0): the blocks, the snapping, the palette and the saving are Blockly's; the blocks themselves,
   the stage, the puzzles and the look are ours.
   - Picture blocks snap under "Go". Press Go and Fab does exactly what the blocks say, one block at a time, top to bottom.
   - Dad sets the task (he is the workshop friend), Doctor McPhee gives the tip, Mr Elder celebrates, Fab is the one who does it.
   - Wellbeing first: no timer, no scores, no "wrong". If Fab ends up somewhere else, the block he stopped on lights up and a tip says what to look at.
     "Show me the way" shows a model to aim for; "Add the next block for me" is the low-energy route; every puzzle is a place to stop.
   - Nothing about a child is kept: progress is saved on this device under their Fab code (or "local"). Each puzzle earns one star the first time,
     which turns into a berry in Fab Fox World, the same way lesson stars do.
   In Fab Fox World it opens in a frame (?embed=1) from Dad's Workshop and the STEM Den; the world collects the stars when the frame closes.
   Tests drive it through window.FabCode. */
(function(){
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const clamp = (a, v, b) => Math.max(a, Math.min(b, v));
  const INK = '#2B1A12', CREAM = '#FFF6E6', GOLD = '#F0B913', ORANGE = '#FE4D02', GRASS = '#BFD88E', GLASS = '#CFE7F2', SAND = '#F6D08F', WOOD = '#C98A5C', STONE = '#E3C9A0';
  const root = $('fc');
  const EMBED = (() => { try{ return new URLSearchParams(location.search).get('embed') === '1'; }catch(e){ return false; } })();
  root.classList.toggle('embed', EMBED);

  /* ---------- hand-drawn icons (ink outline, flat fill) ---------- */
  const P = (d, fill) => `<path d="${d}" fill="${fill || 'none'}" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  const ARROW = 'M5 15.5h15.5V8.5L35 20 20.5 31.5v-7H5z';
  const ICON = {
    right:P(ARROW, CREAM), left:`<g transform="rotate(180 20 20)">${P(ARROW, CREAM)}</g>`, up:`<g transform="rotate(-90 20 20)">${P(ARROW, CREAM)}</g>`, down:`<g transform="rotate(90 20 20)">${P(ARROW, CREAM)}</g>`,
    hop:P('M6 31C8 9 27 7 31 24') + P('M25 20.5l6.4 4.6 3-7.4', CREAM) + P('M4 35.5h32'),
    spin:P('M31.5 13.5A13 13 0 1 0 33 23') + P('M33.5 5.5v9h-9', CREAM),
    wiggle:P('M13 9c-6 6-6 16 0 22M27 9c6 6 6 16 0 22') + `<circle cx="20" cy="20" r="4.6" fill="${CREAM}" stroke="${INK}" stroke-width="3"/>`,
    grow:`<circle cx="20" cy="20" r="14.5" fill="${CREAM}" stroke="${INK}" stroke-width="3"/>` + P('M20 12.5v15M12.5 20h15'),
    shrink:`<circle cx="20" cy="20" r="14.5" fill="${CREAM}" stroke="${INK}" stroke-width="3"/>` + P('M12.5 20h15'),
    say:P('M6 8.5h28a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H19l-8 7.5v-7.5H6a2 2 0 0 1-2-2v-14a2 2 0 0 1 2-2z', CREAM) + P('M11 15h18M11 20.5h11'),
    wait:`<circle cx="20" cy="20" r="14.5" fill="${CREAM}" stroke="${INK}" stroke-width="3"/>` + P('M20 11v9.5l6 3.5'),
    repeat:P('M8.5 17A12 12 0 0 1 30 12.5') + P('M31.5 4.5v9h-9', CREAM) + P('M31.5 23A12 12 0 0 1 10 27.5') + P('M8.5 35.5v-9h9', CREAM),
    go:`<circle cx="20" cy="20" r="16" fill="${CREAM}" stroke="${INK}" stroke-width="3"/>` + P('M15.5 12.5l12 7.5-12 7.5z', '#7FB069'),
    stop:`<rect x="8" y="8" width="24" height="24" rx="5" fill="${CREAM}" stroke="${INK}" stroke-width="3"/>`,
    home:P('M5 20L20 6.5 35 20M9.5 17.5V34h21V17.5', CREAM) + P('M17 34v-9h6v9'),
    back:P('M24.5 8L12 20l12.5 12'),
    reset:P('M9 20a11.5 11.5 0 1 0 3.5-8.2') + P('M7.5 5.5v8h8', CREAM),
    bin:P('M10 12.5h20l-1.8 21H11.8z', CREAM) + P('M6.5 12.5h27M15.5 12V7h9v5M16.5 18v10M23.5 18v10'),
    eye:P('M3.5 20C9 10.5 31 10.5 36.5 20 31 29.5 9 29.5 3.5 20z', CREAM) + `<circle cx="20" cy="20" r="5" fill="${INK}"/>`,
    plus:P('M7 9.5h26v21H7z', CREAM) + P('M20 14v12M14 20h12'),
    next:P(ARROW, CREAM),
    tick:P('M7 21l8.5 9L33 10'),
    star:P('M20 4.5l4.7 9.8 10.6 1.4-7.8 7.5 2 10.6L20 28.6l-9.5 5.2 2-10.6-7.8-7.5 10.6-1.4z', GOLD),
    again:P('M9 20a11.5 11.5 0 1 0 3.5-8.2') + P('M7.5 5.5v8h8', CREAM),
    kick:P('M3 13h7M2 20h5M3 27h7') + `<circle cx="24" cy="20" r="12" fill="${CREAM}" stroke="${INK}" stroke-width="3"/>` + P('M24 13.5l6 4.4-2.3 7h-7.4L18 17.9z', INK),
    jump:P('M4 31C8 7 27 7 33 25') + P('M26.5 22.5l6.6 4 2.5-7.5', CREAM) + P('M14 35l4.5-10 4.5 10z', ORANGE),
    until:P('M8.5 17A12 12 0 0 1 30 12.5') + P('M31.5 4.5v9h-9', CREAM) + P('M31.5 23A12 12 0 0 1 10 27.5') + P('M8.5 35.5v-9h9', CREAM) + `<circle cx="20" cy="20" r="3.4" fill="${ORANGE}" stroke="${INK}" stroke-width="2"/>`,
    fork:P('M20 37V23M20 23L9 11M20 23l11-12') + `<circle cx="8.5" cy="9" r="4.6" fill="${GOLD}" stroke="${INK}" stroke-width="3"/><circle cx="31.5" cy="9" r="4.6" fill="${GLASS}" stroke="${INK}" stroke-width="3"/>`
  };
  const svg = k => `<svg viewBox="0 0 40 40" aria-hidden="true">${ICON[k] || ''}</svg>`;
  const uri = k => 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">${ICON[k]}</svg>`);
  const btn = (k, text, cls, attr) => `<button type="button" class="fc-b ${cls || ''}" ${attr || ''}>${svg(k)}<span>${text}</span></button>`;

  /* ---------- the projects ---------- */
  const DIRS = { right:[1, 0], left:[-1, 0], up:[0, -1], down:[0, 1] };
  const FOUR = ['right', 'left', 'up', 'down'], K = w => `<span class="k">${w}</span>`;
  const PROJECTS = [
    { id:'bush', name:'To the bramble bush', about:'Give Fab code to walk to the ripe berries. Six puzzles, from one block to your first loop.', levels:[
      { id:'b1', name:'Straight there', cols:6, rows:4, start:[0, 2], goal:[4, 2], path:[[1, 2], [2, 2], [3, 2]], walls:[[1, 0, 'pond'], [4, 0, 'stone'], [2, 3, 'log']], blocks:['right', 'left'],
        say:'Fab can smell ripe berries! Give him code to walk along the path to the bramble bush.',
        steps:[`Drag ${K('right')} and snap it under ${K('Go')}.`, 'Count the squares to the bush. Tap the number on your block and choose it.', `Press ${K('Go')} and watch Fab.`],
        sol:[['right', 4]], win:'A list of instructions like yours is called an algorithm.' },
      { id:'b2', name:'Round the corner', cols:6, rows:5, start:[0, 4], goal:[4, 1], path:[[1, 4], [2, 4], [2, 3], [2, 2], [2, 1], [3, 1]], walls:[[0, 0, 'stone'], [4, 3, 'pond']], blocks:FOUR,
        say:'The path turns a corner. Code runs from the top block down, one block at a time.',
        steps:['Snap the blocks together in the order Fab should move.', 'You will need more than one block.', `Press ${K('Go')}. If Fab goes somewhere else, change a block and try again.`],
        sol:[['right', 2], ['up', 3], ['right', 2]], win:'Blocks in the right order are called a sequence.' },
      { id:'b3', name:'Mind the pond', cols:6, rows:5, start:[0, 2], goal:[4, 2], walls:[[2, 2, 'pond'], [2, 3, 'pond'], [2, 4, 'pond'], [4, 0, 'stone'], [0, 4, 'log']], blocks:FOUR,
        say:'There is a pond in the way, and no path this time. Plan a way round before you build.',
        steps:['Trace a way round the pond with your finger.', 'Build it one block at a time.', `Press ${K('Go')}. An orange edge shows the block where Fab got stuck.`],
        sol:[['up', 1], ['right', 3], ['down', 1], ['right', 1]], win:'Finding and fixing a mistake in code is called debugging. Every coder does it.' },
      { id:'b4', name:'Berry picking', cols:6, rows:5, start:[0, 4], goal:[4, 4], berries:[[0, 2], [2, 2], [2, 4]], walls:[[1, 3, 'stone'], [3, 0, 'log'], [5, 2, 'pond']], blocks:FOUR,
        say:'Three ripe berries are lying on the grass. Pick them all up on the way to the bush.',
        steps:['Find a way that passes every berry.', 'Build it one block at a time.', `Press ${K('Go')}. Fab picks up a berry when he walks over it.`],
        sol:[['up', 2], ['right', 2], ['down', 2], ['right', 2]], win:'You planned a route and then coded it. That is how coders work.' },
      { id:'b5', name:'Up the steps', cols:6, rows:5, start:[0, 4], goal:[4, 1], path:[[1, 4], [1, 3], [2, 3], [2, 2], [3, 2], [3, 1]], blocks:[...FOUR, 'repeat'],
        say:'Right, up, right, up: the same two moves again and again. The repeat block does that for you.',
        steps:[`Snap ${K('repeat')} under ${K('Go')}.`, `Put ${K('right')} and ${K('up')} inside its mouth.`, `Choose how many times, add one last block, and press ${K('Go')}.`],
        sol:[['repeat', 3, [['right', 1], ['up', 1]]], ['right', 1]], win:'A repeat block is a loop: code that runs again and again.' },
      { id:'b6', name:'Berry lane', cols:6, rows:5, start:[0, 4], goal:[4, 0], berries:[[2, 4], [2, 2], [4, 2]], blocks:[...FOUR, 'repeat'],
        say:'Can you spot the pattern in the berries? Use repeat to keep your code short.',
        steps:['Say the moves out loud until you hear the pattern.', `Put the moves that repeat inside ${K('repeat')}.`, `Press ${K('Go')}.`],
        sol:[['repeat', 2, [['right', 2], ['up', 2]]]], win:'Spotting a pattern and using a loop is real computer science.' }
    ] },
    { id:'dance', name:'Fab’s dance', about:'Make Fab hop, spin and wiggle. Three little challenges, then a dance of your own.', levels:[
      { id:'d1', name:'Hop and spin', cols:5, rows:4, start:[2, 2], blocks:['hop', 'spin', 'wiggle', 'say'],
        say:'Fab loves to dance. Make him hop, and then spin.',
        steps:[`Snap ${K('hop')} under ${K('Go')}.`, `Snap ${K('spin')} under it.`, `Press ${K('Go')}.`],
        sol:[['hop'], ['spin']], win:'Two blocks, two moves, in order.',
        check:r => r.trace.indexOf('hop') >= 0 && r.trace.indexOf('spin', r.trace.indexOf('hop')) > 0 ? null : 'Fab needs to hop first, and then spin. Put hop above spin.' },
      { id:'d2', name:'Four hops, two blocks', cols:5, rows:4, start:[2, 2], blocks:['hop', 'spin', 'wiggle', 'say', 'repeat'],
        say:'Make Fab hop 4 times. Can you do it with only 2 blocks?',
        steps:[`Snap ${K('repeat')} under ${K('Go')}.`, `Put ${K('hop')} inside its mouth.`, 'Choose 4 times, then press Go.'],
        sol:[['repeat', 4, [['hop']]]], win:'One loop did the work of four blocks.',
        check:r => { const h = r.trace.filter(t => t === 'hop').length; return h !== 4 ? `Fab hopped ${h} time${h === 1 ? '' : 's'}. He needs to hop 4 times.` : r.blocks > 2 ? 'Four hops! Now try it with repeat, so it only takes 2 blocks.' : null; } },
      { id:'d3', name:'My own dance', cols:5, rows:4, start:[2, 2], blocks:['hop', 'spin', 'wiggle', 'grow', 'shrink', 'say', 'wait', ...FOUR, 'repeat'],
        say:'Now make up a dance of your own: 5 moves or more, with at least 3 different kinds.',
        steps:['Try each block to see what it does.', 'Build your dance. A repeat makes a good chorus.', 'Press Go and dance along.'],
        sol:[['repeat', 2, [['hop'], ['wiggle']]], ['spin'], ['say', 'Hooray!']], win:'You are a choreographer and a coder.',
        check:r => { const kinds = new Set(r.trace).size; return r.trace.length >= 5 && kinds >= 3 ? null : `That dance had ${r.trace.length} move${r.trace.length === 1 ? '' : 's'} of ${kinds} kind${kinds === 1 ? '' : 's'}. Try for 5 moves and 3 different kinds.`; } }
    ] },
    /* The next level: the code has to look before it moves. ballAt / conesAt list the places things can be; one is picked afresh on every Go,
       and a puzzle only counts as done when the code would score wherever they land. */
    { id:'goal', name:'Score a goal', about:'Walk up to the ball and kick it into the net. Then teach Fab to look before he moves.', levels:[
      { id:'g1', kind:'goal', name:'Kick!', cols:8, rows:3, start:[0, 1], ball:[3, 1], blocks:['right', 'left', 'kick'],
        say:'I have put up a goal for you. Walk Fab to the square just before the ball, then kick.',
        steps:['Count the squares to the ball. Stop one square before it.', `Snap ${K('kick')} on the end.`, `Press ${K('Go')}.`],
        sol:[['right', 2], ['kick']], win:'Walk, then kick: two blocks in order.' },
      { id:'g2', kind:'goal', name:'Find the ball', cols:8, rows:3, start:[0, 1], ballAt:[[3, 1], [4, 1], [5, 1], [6, 1]], blocks:['right', 'left', 'kick', 'until'],
        say:'This time the ball lands in a different place every time you press Go. Counting squares will not work!',
        steps:[`Snap ${K('repeat until')} under ${K('Go')}. It keeps going until something is true.`, `Put ${K('right')} inside its mouth.`, `Add ${K('kick')} underneath, then press ${K('Go')} a few times.`],
        sol:[['until', 'ball', [['right', 1]]], ['kick']], win:'Your code looks before it moves. Coders call that sensing.',
        every:'the ball lands somewhere new each time. Try “repeat until”, so Fab keeps walking until he is next to it.' },
      { id:'g3', kind:'goal', name:'Cone drill', cols:8, rows:3, start:[0, 1], ball:[6, 1], cones:[[2, 1], [4, 1]], blocks:['right', 'jump', 'kick', 'repeat'],
        say:'Cones on the pitch! Fab cannot walk through a cone, but he can jump over one.',
        steps:[`${K('jump')} takes Fab two squares on, over whatever is in between.`, 'Work out where each jump starts.', `Finish with ${K('kick')}.`],
        sol:[['right', 1], ['jump'], ['jump'], ['kick']], win:'You read the pitch and planned each move.' },
      { id:'g4', kind:'goal', name:'Mixed-up cones', cols:8, rows:3, start:[0, 1], ball:[6, 1], conesAt:[[[2, 1], [4, 1]], [[2, 1]], [[4, 1]], [[3, 1]], []], blocks:['ifelse', 'jump', 'right', 'kick', 'until'], begin:[['until', 'ball', []], ['kick']],
        say:'Now the cones move every time, so Fab has to decide at each step. I have started the code for you.',
        steps:[`Put ${K('if')} inside the mouth of ${K('repeat until')}.`, `If a cone is ahead, then ${K('jump')}. Else, ${K('right')}.`, `Press ${K('Go')} a few times. The cones move each time.`],
        sol:[['until', 'ball', [['ifelse', 'cone', [['jump']], [['right', 1]]]]], ['kick']], win:'If and else: your code makes its own decisions.',
        every:'the cones move each time. Try “if a cone is ahead” inside “repeat until”.' }
    ] }
  ];
  const WORDS = ['Hello!', 'Yum!', 'Hooray!', 'Yip yip!'];

  /* ---------- saving (this device only, under the Fab code) ---------- */
  const who = (() => { const clean = r => String(r || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 20);
    try{ const q = clean(new URLSearchParams(location.search).get('learner')); if(q) return q; }catch(e){}
    try{ return clean(localStorage.getItem('fab-me')); }catch(e){ return ''; } })();
  const KEY = 'fabcode-v1-' + (who || 'local');
  let SAVE = { done:{}, code:{} };
  try{ const j = JSON.parse(localStorage.getItem(KEY) || 'null'); if(j && typeof j === 'object') SAVE = { done:j.done || {}, code:j.code || {} }; }catch(e){}
  const store = () => { try{ localStorage.setItem(KEY, JSON.stringify(SAVE)); }catch(e){} };
  /* one star for Fab Fox World: the same waiting pot the lessons use (index.html, fabWorldAward) */
  const star = () => { try{ const k = 'fabworld-pending-' + (who || 'local'); localStorage.setItem(k, String((parseInt(localStorage.getItem(k), 10) || 0) + 1)); }catch(e){} };

  /* ---------- Blockly: our blocks, our look ---------- */
  const B = window.Blockly;
  const img = k => ({ type:'field_image', src:uri(k), width:34, height:34, alt:k });
  const nums = (a, b) => Array.from({ length:b - a + 1 }, (_, i) => [String(a + i), String(a + i)]);
  const stack = { previousStatement:null, nextStatement:null };
  function defineBlocks(){
    const defs = [{ type:'fab_go', message0:'%1 Go', args0:[img('go')], nextStatement:null, style:'fab_event', tooltip:'Your code starts here when you press Go.' }];
    FOUR.forEach(d => defs.push(Object.assign({ type:'fab_' + d, message0:`%1 ${d} %2`, args0:[img(d), { type:'field_dropdown', name:'N', options:nums(1, 6) }], style:'fab_move', tooltip:`Fab walks ${d} this many squares.` }, stack)));
    [['hop', 'Fab hops on the spot.'], ['spin', 'Fab spins round once.'], ['wiggle', 'Fab wiggles from side to side.'], ['grow', 'Fab gets a bit bigger.'], ['shrink', 'Fab gets a bit smaller.'], ['wait', 'Fab waits for a moment.']]
      .forEach(([t, tip]) => defs.push(Object.assign({ type:'fab_' + t, message0:`%1 ${t}`, args0:[img(t)], style:t === 'wait' ? 'fab_loop' : 'fab_look', tooltip:tip }, stack)));
    defs.push(Object.assign({ type:'fab_say', message0:'%1 say %2', args0:[img('say'), { type:'field_dropdown', name:'T', options:WORDS.map(w => [w, w]) }], style:'fab_look', tooltip:'Fab says this.' }, stack));
    defs.push(Object.assign({ type:'fab_repeat', message0:'%1 repeat %2', args0:[img('repeat'), { type:'field_dropdown', name:'N', options:nums(2, 6) }], message1:'%1', args1:[{ type:'input_statement', name:'DO' }], style:'fab_loop', tooltip:'Everything inside runs this many times.' }, stack));
    [['jump', 'Fab jumps two squares to the right, over whatever is in between.'], ['kick', 'Fab kicks the ball, if it is on the next square.']]
      .forEach(([t, tip]) => defs.push(Object.assign({ type:'fab_' + t, message0:`%1 ${t}`, args0:[img(t)], style:'fab_move', tooltip:tip }, stack)));
    const CONDS = [['next to the ball', 'ball'], ['a cone is ahead', 'cone'], ['the way is clear', 'clear']];
    defs.push(Object.assign({ type:'fab_until', message0:'%1 repeat until %2', args0:[img('until'), { type:'field_dropdown', name:'C', options:CONDS }], message1:'%1', args1:[{ type:'input_statement', name:'DO' }], style:'fab_loop', tooltip:'Everything inside runs again and again until this is true.' }, stack));
    defs.push(Object.assign({ type:'fab_ifelse', message0:'%1 if %2', args0:[img('fork'), { type:'field_dropdown', name:'C', options:[CONDS[1], CONDS[0], CONDS[2]] }], message1:'%1', args1:[{ type:'input_statement', name:'DO' }], message2:'else', message3:'%1', args3:[{ type:'input_statement', name:'ELSE' }], style:'fab_logic', tooltip:'If this is true, the top part runs. If not, the else part runs.' }, stack));
    B.common.defineBlocksWithJsonArray(defs);
  }
  function makeTheme(){
    const st = (a, b, c, hat) => Object.assign({ colourPrimary:a, colourSecondary:b, colourTertiary:c }, hat ? { hat:'cap' } : {});
    return B.Theme.defineTheme('fabfox', { name:'fabfox', base:B.Themes.Zelos || B.Themes.Classic,
      blockStyles:{ fab_event:st(GOLD, '#F7D873', '#D9A30F', true), fab_move:st('#F4A46E', '#FBD9BF', '#E88A4C'), fab_look:st(GLASS, '#EAF5FA', '#A6D2E4'), fab_loop:st(GRASS, '#DFEDC6', '#A2C76C'), fab_logic:st(SAND, '#FBE7BE', '#E0B26A') },
      componentStyles:{ workspaceBackgroundColour:CREAM, toolboxBackgroundColour:'#FFD483', flyoutBackgroundColour:'#FFD483', flyoutOpacity:1, scrollbarColour:INK, scrollbarOpacity:.28, insertionMarkerColour:INK, insertionMarkerOpacity:.28, cursorColour:ORANGE },
      fontStyle:{ family:'Aleo, Georgia, serif', weight:'700', size:13 }, startHats:true });
  }
  let ws = null;
  const toolbox = L => ({ kind:'flyoutToolbox', contents:L.blocks.map(t => ({ kind:'block', type:'fab_' + t })) });
  function inject(L){
    ws = B.inject('fcBlockly', { toolbox:toolbox(L), renderer:'zelos', theme:makeTheme(), media:'lib/blockly/media/', trashcan:true, sounds:false, comments:false, collapse:false, disable:false,
      zoom:{ controls:false, wheel:false, pinch:false, startScale:1 }, move:{ scrollbars:true, drag:true, wheel:true } });
    ws.addChangeListener(B.Events.disableOrphans);
    ws.addChangeListener(e => { if(e.isUiEvent || !LV || RUN.on || loading) return; saveCode(); if(e.type === B.Events.BLOCK_MOVE || e.type === B.Events.BLOCK_CHANGE || e.type === B.Events.BLOCK_DELETE || e.type === B.Events.BLOCK_CREATE) edited(); });
  }
  let loading = false;
  const chain = list => { let first = null, prev = null; (list || []).forEach(it => { const b = blockJSON(it); if(prev) prev.next = { block:b }; else first = b; prev = b; }); return first; };
  function blockJSON(it){
    const [t, n, body] = Array.isArray(it) ? it : [it.t, it.n, it.body], b = { type:'fab_' + t };
    if(DIRS[t] || t === 'repeat') b.fields = { N:String(n || (t === 'repeat' ? 2 : 1)) };
    if(t === 'say') b.fields = { T:WORDS.includes(n) ? n : WORDS[0] };
    if(t === 'until' || t === 'ifelse') b.fields = { C:n || (t === 'until' ? 'ball' : 'cone') };
    if((t === 'repeat' || t === 'until' || t === 'ifelse') && body && body.length) b.inputs = { DO:{ block:chain(body) } };
    const other = Array.isArray(it) ? it[3] : it.other;
    if(t === 'ifelse' && other && other.length) (b.inputs = b.inputs || {}).ELSE = { block:chain(other) };
    return b;
  }
  const fresh = list => { const go = { type:'fab_go', x:24, y:24, deletable:false, movable:false, editable:false }, c = chain(list); if(c) go.next = { block:c }; return { blocks:{ languageVersion:0, blocks:[go] } }; };
  function loadState(state){
    /* loading is our doing, not the child's: no change events, so a tip on screen is not wiped by it */
    loading = true; B.Events.disable();
    try{ ws.clear(); B.serialization.workspaces.load(state, ws, { recordUndo:false }); if(!ws.getBlocksByType('fab_go', false).length) B.serialization.workspaces.load(fresh([]), ws, { recordUndo:false }); }
    catch(e){ try{ ws.clear(); B.serialization.workspaces.load(fresh([]), ws, { recordUndo:false }); }catch(e2){} }
    B.Events.enable(); loading = false;
    try{ ws.scroll(0, 0); }catch(e){}
  }
  function setProgram(list){ loadState(fresh(list)); saveCode(); panel(null); lit(null); }
  function readList(block){
    const out = [];
    for(let b = block; b; b = b.getNextBlock()){
      if(typeof b.isEnabled === 'function' && !b.isEnabled()) continue;
      const t = b.type.slice(4), it = { t, id:b.id };
      if(DIRS[t] || t === 'repeat') it.n = clamp(1, parseInt(b.getFieldValue('N'), 10) || 1, 9);
      if(t === 'say') it.n = b.getFieldValue('T');
      if(t === 'until' || t === 'ifelse') it.n = b.getFieldValue('C');
      if(t === 'repeat' || t === 'until' || t === 'ifelse') it.body = readList(b.getInputTargetBlock('DO'));
      if(t === 'ifelse') it.other = readList(b.getInputTargetBlock('ELSE'));
      out.push(it);
    }
    return out;
  }
  const program = () => { const go = ws && ws.getBlocksByType('fab_go', false)[0]; return go ? readList(go.getNextBlock()) : []; };
  const plain = list => list.map(it => it.t === 'ifelse' ? [it.t, it.n, plain(it.body || []), plain(it.other || [])] : it.t === 'repeat' || it.t === 'until' ? [it.t, it.n, plain(it.body || [])] : it.n != null ? [it.t, it.n] : [it.t]);
  const fromPlain = list => (list || []).map(([t, n, body, other]) => ({ t, n, body:body ? fromPlain(body) : undefined, other:other ? fromPlain(other) : undefined }));
  const count = list => list.reduce((a, it) => a + 1 + (it.body ? count(it.body) : 0) + (it.other ? count(it.other) : 0), 0);
  const saveCode = () => { if(!LV || !ws) return; try{ SAVE.code[LV.id] = B.serialization.workspaces.save(ws); store(); }catch(e){} };
  let litId = null;
  function lit(id){
    try{ if(litId){ const o = ws.getBlockById(litId); if(o && o.getSvgRoot()) o.getSvgRoot().classList.remove('fc-lit'); } litId = id || null;
      if(id){ const b = ws.getBlockById(id); if(b && b.getSvgRoot()) b.getSvgRoot().classList.add('fc-lit'); } }catch(e){}
  }

  /* ---------- the stage ---------- */
  const IMG = {}; let need = true;
  [['fab', 'code/fab.png'], ['bush', 'code/bramble-bush.png'], ['berry', 'world/berry.png'], ['paw', 'world/paw.png']].forEach(([k, src]) => { const im = new Image(); im.onload = () => { need = true; if(root.dataset.view === 'home') homeArt(); }; im.src = src; IMG[k] = im; });
  const ok = im => im && im.complete && im.naturalWidth > 0;
  const rnd = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  let PJ = null, LV = null, LI = 0, FAB = null, VIEW = { way:null, wayT:0, pops:[] };
  const RUN = { on:false, stop:false, count:0, trace:[], bump:null, passed:false };
  const FC = { speed:1 };
  function resetFab(L){
    L = L || LV; if(!L) return;
    const lay = L.kind === 'goal' ? (LAYNOW || (LAYNOW = pickLay(L))) : null;
    FAB = { x:L.start[0], y:L.start[1], px:L.start[0], py:L.start[1], lift:0, rot:0, sx:1, size:1, say:null, prints:[], got:{}, shake:0,
      ball:lay && lay.ball ? { x:lay.ball[0], y:lay.ball[1], px:lay.ball[0], py:lay.ball[1], spin:0 } : null, cones:lay ? lay.cones : [] };
    RUN.bump = null; RUN.passed = false; RUN.scored = false; need = true;
  }
  /* every place the ball and the cones can be in a puzzle, and one of them picked for this go */
  let LAYNOW = null;
  function layouts(L){ const Bs = L.ballAt || (L.ball ? [L.ball] : [null]), Cs = L.conesAt || [L.cones || []], out = []; Bs.forEach(b => Cs.forEach(c => out.push({ ball:b, cones:c }))); return out; }
  function pickLay(L){ const all = layouts(L), r = typeof FC.rand === 'function' ? FC.rand() : Math.random(); let i = Math.min(all.length - 1, Math.floor(r * all.length));
    if(all.length > 1 && LAYNOW && JSON.stringify(all[i]) === JSON.stringify(LAYNOW)) i = (i + 1) % all.length;   /* never the same place twice running */
    return all[i]; }
  const coneAt = (x, y) => !!FAB && FAB.cones.some(c => c[0] === x && c[1] === y), ballAt = (x, y) => !!FAB && !!FAB.ball && FAB.ball.x === x && FAB.ball.y === y;
  const cond = c => c === 'ball' ? ballAt(FAB.x + 1, FAB.y) : c === 'cone' ? coneAt(FAB.x + 1, FAB.y) : !(coneAt(FAB.x + 1, FAB.y) || ballAt(FAB.x + 1, FAB.y) || FAB.x + 1 >= LV.cols);
  /* the same rules with no pictures: would this code score with things laid out like this? */
  function simGoal(L, list, lay){
    let x = L.start[0], y = L.start[1], bx = lay.ball[0], by = lay.ball[1], n = 0, scored = false; const cone = (a, b) => lay.cones.some(c => c[0] === a && c[1] === b);
    const test = c => c === 'ball' ? (bx === x + 1 && by === y) : c === 'cone' ? cone(x + 1, y) : !(cone(x + 1, y) || (bx === x + 1 && by === y) || x + 1 >= L.cols);
    const run = l => { for(const it of l){ if(++n > 400) throw 0; const [t, v, body, other] = it;
      if(t === 'repeat'){ for(let i = 0; i < v; i++) run(body || []); }
      else if(t === 'until'){ let g = 0; while(!test(v)){ if(++g > 40 || !(body || []).length) throw 0; run(body); } }
      else if(t === 'ifelse') run(test(v) ? (body || []) : (other || []));
      else if(DIRS[t]){ for(let i = 0; i < v; i++){ const nx = x + DIRS[t][0], ny = y + DIRS[t][1]; if(nx < 0 || ny < 0 || nx >= L.cols || ny >= L.rows || cone(nx, ny) || (nx === bx && ny === by)) throw 0; x = nx; y = ny; } }
      else if(t === 'jump'){ const nx = x + 2; if(nx >= L.cols || cone(nx, y) || (nx === bx && y === by)) throw 0; x = nx; }
      else if(t === 'kick'){ if(!(bx === x + 1 && by === y)) throw 0; while(bx + 1 < L.cols && !cone(bx + 1, by)) bx++; if(bx === L.cols - 1) scored = true; } } };
    try{ run(list); }catch(e){ return false; }
    return scored;
  }
  const wallAt = (L, x, y) => (L.walls || []).find(w => w[0] === x && w[1] === y);
  const isGoal = (L, x, y) => !!L.goal && y === L.goal[1] && (x === L.goal[0] || x === L.goal[0] + 1);
  const WHAT = { pond:'the pond', stone:'the stone', log:'the log', edge:'the edge of the grass', cone:'a cone', ball:'the ball' };

  function wobbly(g, pts){ g.beginPath(); const n = pts.length; for(let i = 0; i < n; i++){ const a = pts[i], b = pts[(i + 1) % n], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; if(!i) g.moveTo(mx, my); else g.quadraticCurveTo(a[0], a[1], mx, my); } const a = pts[0], b = pts[1]; g.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); g.closePath(); }
  function blob(g, cx, cy, rx, ry, seed, n){ n = n || 9; const pts = []; for(let i = 0; i < n; i++){ const a = i / n * Math.PI * 2, r = 1 + (rnd(seed + i) - .5) * .2; pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]); } wobbly(g, pts); }
  function tileRect(g, x, y, T, inset, seed){ const j = k => (rnd(seed + k) - .5) * T * .05, a = x * T + inset, b = y * T + inset, c = (x + 1) * T - inset, d = (y + 1) * T - inset, r = T * .16;
    g.beginPath(); g.moveTo(a + r + j(1), b + j(2)); g.lineTo(c - r + j(3), b + j(4)); g.quadraticCurveTo(c + j(5), b + j(6), c + j(7), b + r); g.lineTo(c + j(8), d - r); g.quadraticCurveTo(c + j(9), d + j(10), c - r, d + j(11)); g.lineTo(a + r, d + j(12)); g.quadraticCurveTo(a + j(13), d + j(14), a + j(15), d - r); g.lineTo(a + j(16), b + r); g.quadraticCurveTo(a + j(17), b + j(18), a + r + j(1), b + j(2)); g.closePath(); }
  /* everything on the stage, for any puzzle at any tile size: the home cards use it too */
  function scene(g, L, T, F, V){
    const W = L.cols * T, H = L.rows * T, lw = Math.max(2, T * .032);
    g.clearRect(0, 0, W, H); g.fillStyle = GRASS; g.fillRect(0, 0, W, H); g.lineJoin = g.lineCap = 'round';
    for(let y = 0; y < L.rows; y++) for(let x = 0; x < L.cols; x++){ tileRect(g, x, y, T, T * .045, x * 31 + y * 17); g.strokeStyle = 'rgba(43,26,18,.17)'; g.lineWidth = lw * .7; g.stroke();
      const s = x * 13 + y * 7; if(rnd(s) > .45 && !wallAt(L, x, y)){ const tx = (x + .2 + rnd(s + 1) * .6) * T, ty = (y + .25 + rnd(s + 2) * .55) * T, u = T * .05; g.beginPath(); g.moveTo(tx - u, ty - u * 1.5); g.lineTo(tx, ty); g.lineTo(tx + u, ty - u * 1.7); g.strokeStyle = 'rgba(43,26,18,.3)'; g.lineWidth = lw * .55; g.stroke(); } }
    (L.path || []).forEach(([x, y], i) => { tileRect(g, x, y, T, T * .07, i * 11 + 5); g.fillStyle = SAND; g.fill(); g.strokeStyle = 'rgba(43,26,18,.6)'; g.lineWidth = lw * .8; g.stroke(); });
    (L.walls || []).forEach(([x, y, k], i) => { const cx = (x + .5) * T, cy = (y + .5) * T; g.strokeStyle = INK; g.lineWidth = lw;
      if(k === 'pond'){ blob(g, cx, cy, T * .43, T * .38, i * 9 + 2); g.fillStyle = GLASS; g.fill(); g.stroke(); g.beginPath(); g.arc(cx - T * .08, cy - T * .04, T * .13, Math.PI * 1.1, Math.PI * 1.75); g.moveTo(cx + T * .2, cy + T * .1); g.arc(cx + T * .1, cy + T * .1, T * .1, 0, Math.PI * .7); g.lineWidth = lw * .6; g.strokeStyle = 'rgba(43,26,18,.5)'; g.stroke(); }
      else if(k === 'stone'){ blob(g, cx, cy + T * .06, T * .36, T * .28, i * 5 + 40, 7); g.fillStyle = STONE; g.fill(); g.stroke(); g.beginPath(); g.moveTo(cx - T * .12, cy - T * .06); g.lineTo(cx - T * .02, cy + T * .04); g.lineTo(cx + T * .1, cy); g.lineWidth = lw * .6; g.stroke(); }
      else { g.save(); g.translate(cx, cy + T * .05); g.rotate(-.12); g.beginPath(); g.roundRect(-T * .4, -T * .17, T * .8, T * .34, T * .15); g.fillStyle = WOOD; g.fill(); g.stroke(); g.beginPath(); g.ellipse(T * .3, 0, T * .07, T * .13, 0, 0, Math.PI * 2); g.fillStyle = '#E3B58F'; g.fill(); g.lineWidth = lw * .7; g.stroke(); g.beginPath(); g.moveTo(-T * .28, -T * .05); g.lineTo(-T * .02, -T * .05); g.moveTo(-T * .2, T * .06); g.lineTo(T * .1, T * .06); g.stroke(); g.restore(); } });
    F.prints.forEach(p => { if(!ok(IMG.paw)) return; const s = T * .3; g.save(); g.translate((p.x + .5) * T, (p.y + .62) * T); g.rotate(p.a); g.globalAlpha = .62; g.drawImage(IMG.paw, -s / 2, -s / 2, s, s); g.restore(); });
    if(V && V.way && V.way.length > 1){ g.save(); g.setLineDash([T * .13, T * .13]); g.strokeStyle = ORANGE; g.lineWidth = lw * 1.5; g.beginPath(); V.way.forEach(([x, y], i) => { const X = (x + .5) * T, Y = (y + .5) * T; if(i) g.lineTo(X, Y); else g.moveTo(X, Y); }); g.stroke(); g.setLineDash([]);
      V.way.forEach(([x, y], i) => { g.beginPath(); g.arc((x + .5) * T, (y + .5) * T, T * (i === V.way.length - 1 ? .1 : .055), 0, Math.PI * 2); g.fillStyle = i === V.way.length - 1 ? ORANGE : CREAM; g.fill(); g.strokeStyle = INK; g.lineWidth = lw * .7; g.stroke(); }); g.restore(); }
    if(L.goal && ok(IMG.bush)){ const w = T * 1.96, h = w * IMG.bush.naturalHeight / IMG.bush.naturalWidth; g.drawImage(IMG.bush, L.goal[0] * T + T * .02, (L.goal[1] + 1) * T - h - T * .1, w, h); }
    (L.berries || []).forEach(([x, y], i) => { if(F.got[i] || !ok(IMG.berry)) return; const s = T * .46; g.drawImage(IMG.berry, (x + .5) * T - s / 2, (y + .56) * T - s / 2, s, s); });
    if(V) V.pops.forEach(p => { if(!ok(IMG.berry)) return; const s = T * .4 * (1 - p.k * .3); g.save(); g.globalAlpha = 1 - p.k; g.drawImage(IMG.berry, (p.x + .5) * T - s / 2, (p.y + .3 - p.k * .7) * T - s / 2, s, s); g.restore(); });
    if(L.kind === 'goal'){ const x0 = (L.cols - 1) * T + T * .14, w = T * .78; g.fillStyle = 'rgba(255,253,247,.8)'; g.strokeStyle = INK; g.lineWidth = lw; g.beginPath(); g.roundRect(x0, T * .12, w, H - T * .24, T * .1); g.fill(); g.stroke();
      g.lineWidth = lw * .45; g.strokeStyle = 'rgba(43,26,18,.4)'; g.beginPath(); for(let i = 1; i < 4; i++){ g.moveTo(x0 + w * i / 4, T * .12); g.lineTo(x0 + w * i / 4, H - T * .12); } for(let yy = T * .37; yy < H - T * .14; yy += T * .25){ g.moveTo(x0, yy); g.lineTo(x0 + w, yy); } g.stroke(); }
    (F.cones || []).forEach(([x, y]) => { const cx = (x + .5) * T, by = (y + .88) * T; g.strokeStyle = INK; g.lineWidth = lw; g.fillStyle = ORANGE;
      g.beginPath(); g.moveTo(cx, by - T * .62); g.lineTo(cx + T * .25, by - T * .03); g.lineTo(cx - T * .25, by - T * .03); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.roundRect(cx - T * .33, by - T * .06, T * .66, T * .11, T * .04); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(cx - T * .12, by - T * .32); g.lineTo(cx + T * .12, by - T * .32); g.strokeStyle = CREAM; g.lineWidth = lw * 1.7; g.stroke(); });
    if(F.ball){ const bx = (F.ball.px + .5) * T, by = (F.ball.py + .74) * T, br = T * .17; g.save(); g.translate(bx, by); g.rotate(F.ball.spin || 0); g.beginPath(); g.arc(0, 0, br, 0, Math.PI * 2); g.fillStyle = '#FFFDF7'; g.strokeStyle = INK; g.lineWidth = lw; g.fill(); g.stroke();
      g.fillStyle = INK; g.beginPath(); for(let i = 0; i < 5; i++){ const a = -Math.PI / 2 + i * Math.PI * 2 / 5; g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * br * .45, Math.sin(a) * br * .45); } g.closePath(); g.fill(); g.restore(); }
    if(ok(IMG.fab)){ const h = T * 1.08 * F.size, w = h * IMG.fab.naturalWidth / IMG.fab.naturalHeight, fx = (F.px + .5) * T + Math.sin(F.shake * 30) * F.shake * T * .12, fy = (F.py + .93) * T - F.lift * T;
      g.save(); g.translate(fx, fy); g.rotate(F.rot); g.scale(F.sx, 1); g.drawImage(IMG.fab, -w / 2, -h, w, h); g.restore();
      if(F.say){ g.font = `italic 700 ${Math.round(T * .2)}px Aleo, Georgia, serif`; const tw = g.measureText(F.say).width, bw = tw + T * .3, bh = T * .36, bx = clamp(lw, fx - bw / 2, W - bw - lw), by = Math.max(lw, fy - h - bh - T * .06);
        g.beginPath(); g.roundRect(bx, by, bw, bh, T * .12); g.fillStyle = '#fff'; g.fill(); g.strokeStyle = INK; g.lineWidth = lw; g.stroke(); g.fillStyle = INK; g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillText(F.say, bx + bw / 2, by + bh / 2 + T * .01); } }
  }
  const cv = $('fcStage'); let TILE = 60, DPR = 1;
  function sizeStage(){
    if(!LV) return; const wrap = $('fcWrap'), W = wrap.clientWidth - 8, H = wrap.clientHeight - 8; if(W < 20 || H < 20) return;
    TILE = Math.max(18, Math.floor(Math.min(W / LV.cols, H / LV.rows))); DPR = Math.min(3, window.devicePixelRatio || 1);
    cv.style.width = TILE * LV.cols + 'px'; cv.style.height = TILE * LV.rows + 'px'; cv.width = Math.round(TILE * LV.cols * DPR); cv.height = Math.round(TILE * LV.rows * DPR); need = true;
  }
  function frame(){
    if(need && LV && FAB && root.dataset.view === 'work'){ need = false; const g = cv.getContext('2d'); g.setTransform(DPR, 0, 0, DPR, 0, 0); scene(g, LV, TILE, FAB, VIEW); }
    if(VIEW.way && performance.now() > VIEW.wayT){ VIEW.way = null; need = true; }
    requestAnimationFrame(frame);
  }
  const STOP = { stop:true };
  /* run fn(0..1) for ms; Stop ends it at once */
  function anim(ms, fn){
    ms = ms / Math.max(.05, FC.speed);
    return new Promise((res, rej) => { const t0 = performance.now(); const tick = () => { if(RUN.stop) return rej(STOP); const k = clamp(0, (performance.now() - t0) / ms, 1); fn(k); need = true; if(k < 1) requestAnimationFrame(tick); else res(); }; tick(); });
  }
  const ease = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  async function move(d){
    const [dx, dy] = DIRS[d], nx = FAB.x + dx, ny = FAB.y + dy, off = nx < 0 || ny < 0 || nx >= LV.cols || ny >= LV.rows, wall = off ? null : wallAt(LV, nx, ny), hit = off ? 'edge' : wall ? wall[2] : coneAt(nx, ny) ? 'cone' : ballAt(nx, ny) ? 'ball' : null;
    if(hit){ await anim(360, k => { const s = Math.sin(k * Math.PI); FAB.px = FAB.x + dx * s * .22; FAB.py = FAB.y + dy * s * .22; FAB.shake = (1 - k) * .5; }); FAB.shake = 0; throw { bump:hit }; }
    const ox = FAB.x, oy = FAB.y;
    await anim(400, k => { const e = ease(k); FAB.px = ox + dx * e; FAB.py = oy + dy * e; FAB.lift = Math.sin(k * Math.PI) * .13; });
    FAB.prints.push({ x:ox, y:oy, a:Math.atan2(dy, dx) + Math.PI / 2 }); FAB.x = nx; FAB.y = ny; FAB.px = nx; FAB.py = ny; FAB.lift = 0;
    (LV.berries || []).forEach(([bx, by], i) => { if(bx === nx && by === ny && !FAB.got[i]){ FAB.got[i] = 1; const p = { x:bx, y:by, k:0 }; VIEW.pops.push(p); anim(500, k => { p.k = k; }).catch(() => {}).then(() => { VIEW.pops = VIEW.pops.filter(q => q !== p); need = true; }); } });
    if(isGoal(LV, nx, ny)) RUN.passed = true;
  }
  async function act(it){
    const t = it.t;
    if(DIRS[t]){ for(let i = 0; i < it.n; i++) await move(t); }
    else if(t === 'hop') await anim(460, k => { FAB.lift = Math.sin(k * Math.PI) * .42; });
    else if(t === 'spin') await anim(620, k => { FAB.sx = Math.cos(k * Math.PI * 2); });
    else if(t === 'wiggle') await anim(620, k => { FAB.rot = Math.sin(k * Math.PI * 4) * .2; });
    else if(t === 'grow'){ const a = FAB.size, b = clamp(.6, a + .2, 1.6); await anim(340, k => { FAB.size = a + (b - a) * ease(k); }); }
    else if(t === 'shrink'){ const a = FAB.size, b = clamp(.6, a - .2, 1.6); await anim(340, k => { FAB.size = a + (b - a) * ease(k); }); }
    else if(t === 'say'){ FAB.say = it.n; await anim(1100, () => {}); FAB.say = null; }
    else if(t === 'wait') await anim(600, () => {});
    else if(t === 'jump'){ const nx = FAB.x + 2, y = FAB.y, hit = nx >= LV.cols ? 'edge' : coneAt(nx, y) ? 'cone' : ballAt(nx, y) ? 'ball' : wallAt(LV, nx, y) ? wallAt(LV, nx, y)[2] : null;
      if(hit){ await anim(360, k => { FAB.lift = Math.sin(k * Math.PI) * .3; FAB.shake = (1 - k) * .5; }); FAB.shake = 0; FAB.lift = 0; throw { bump:hit }; }
      const ox = FAB.x; await anim(520, k => { FAB.px = ox + 2 * ease(k); FAB.lift = Math.sin(k * Math.PI) * .7; }); FAB.prints.push({ x:ox, y, a:Math.PI / 2 }); FAB.x = nx; FAB.px = nx; }
    else if(t === 'kick'){ const b = FAB.ball;
      if(!b || b.x !== FAB.x + 1 || b.y !== FAB.y){ await anim(300, k => { FAB.rot = Math.sin(k * Math.PI) * .18; }); FAB.rot = 0; throw { miss:true }; }
      await anim(220, k => { FAB.px = FAB.x + Math.sin(k * Math.PI) * .28; }); FAB.px = FAB.x;
      let tx = b.x; while(tx + 1 < LV.cols && !coneAt(tx + 1, b.y)) tx++; const ox = b.x;
      await anim(150 * (tx - ox) + 120, k => { b.px = ox + (tx - ox) * ease(k); b.spin = k * (tx - ox) * 2.6; }); b.x = tx; b.px = tx; if(tx === LV.cols - 1) RUN.scored = true; }
    FAB.lift = 0; FAB.rot = 0; FAB.sx = 1;
    if(t !== 'repeat') RUN.trace.push(t);
  }
  async function runList(list){
    for(const it of list){
      if(RUN.stop) throw STOP;
      if(++RUN.count > 400) throw { limit:true };
      lit(it.id);
      if(it.t === 'repeat'){ for(let i = 0; i < it.n; i++){ await runList(it.body || []); lit(it.id); } }
      else if(it.t === 'until'){ let g = 0; while(!cond(it.n)){ if(++g > 40 || !(it.body || []).length) throw { limit:true }; await runList(it.body); lit(it.id); } }
      else if(it.t === 'ifelse'){ await anim(170, () => {}); await runList(cond(it.n) ? (it.body || []) : (it.other || [])); }
      else await act(it);
    }
  }
  /* run a list of blocks on the stage. model = true plays the model answer ("Show me") without judging it */
  async function play(list, model){
    if(RUN.on) return null;
    RUN.on = true; RUN.stop = false; RUN.count = 0; RUN.trace = []; VIEW.way = null;
    if(LV.kind === 'goal' && !model && layouts(LV).length > 1) LAYNOW = pickLay(LV);   /* things land somewhere new on every Go */
    resetFab(); panel(null); controls();
    let res = { ok:false, blocks:count(list), trace:RUN.trace, plain:plain(list) };
    try{ await runList(list); res.end = true; }
    catch(e){ if(e === STOP) res.stopped = true; else if(e && e.bump){ res.bump = e.bump; RUN.bump = e.bump; } else if(e && e.limit) res.limit = true; else if(e && e.miss) res.miss = true; else { RUN.on = false; controls(); throw e; } }
    FAB.lift = 0; FAB.rot = 0; FAB.sx = 1; FAB.say = null; FAB.shake = 0; need = true;
    if(!res.bump) lit(null);
    RUN.on = false; controls();
    if(model){ lit(null); return res; }
    return judge(res);
  }
  function judge(res){
    const L = LV; res.x = FAB.x; res.y = FAB.y;
    if(res.stopped){ live('Stopped.'); return res; }
    let tip = null;
    if(!res.blocks) tip = `There is no code yet. Drag a block and snap it under Go, then press Go.`;
    else if(res.limit) tip = L.kind === 'goal' ? 'Fab went round and round. Look at what your repeat is waiting for, and what is inside it.' : 'That is a very long dance! Fab needs a rest. Try a smaller number in repeat.';
    else if(res.bump === 'cone') tip = 'Fab bumped into a cone. A cone needs jumping over. Look at the block with the orange edge.';
    else if(res.bump === 'ball') tip = 'Fab walked into the ball. Stop on the square before it, then kick.';
    else if(res.bump) tip = `Fab bumped into ${WHAT[res.bump]}. Look at the block with the orange edge. Should it be a different way, or a smaller number?`;
    else if(res.miss) tip = 'Fab kicked, but the ball was not on the next square. Walk up to it first, then kick.';
    else if(L.kind === 'goal'){
      if(!RUN.scored) tip = RUN.trace.includes('kick') ? 'The ball stopped before the net. What is in its way?' : 'The ball has not gone in yet. Finish with a kick.';
      else if(!layouts(L).every(lay => simGoal(L, res.plain, lay))){ res.lucky = true; tip = 'Goal! But ' + (L.every || 'things will be somewhere else next time. Will your code still work?'); }
    }
    else if(L.goal){
      const left = (L.berries || []).filter((b, i) => !FAB.got[i]).length, on = isGoal(L, FAB.x, FAB.y);
      if(on && left) tip = `Fab found the bush, but ${left === 1 ? 'one berry is' : left + ' berries are'} still on the grass. Can he pick ${left === 1 ? 'it' : 'them'} up on the way?`;
      else if(!on && RUN.passed) tip = 'Fab walked right past the bush. Try a smaller number on the last block.';
      else if(!on){ const d = Math.min(Math.abs(L.goal[0] - FAB.x), Math.abs(L.goal[0] + 1 - FAB.x)) + Math.abs(L.goal[1] - FAB.y); tip = `Fab stopped ${d} square${d === 1 ? '' : 's'} from the bush. Add a block, or change a number, and press Go again.`; }
    } else if(L.check) tip = L.check(res);
    if(tip){ res.tip = tip; panel('tip', tip); live(tip); return res; }
    res.ok = true; const first = !SAVE.done[L.id]; SAVE.done[L.id] = 1; store(); if(first) star(); res.first = first;
    cheer(); panel('win', res); dots(); return res;
  }
  function cheer(){ const a = () => anim(420, k => { FAB.lift = Math.sin(k * Math.PI) * .4; }); RUN.stop = false; a().then(a).catch(() => {}).then(() => { if(FAB){ FAB.lift = 0; need = true; } }); }
  /* where the model answer walks, for "Show me the way" */
  function route(L){
    let x = L.start[0], y = L.start[1]; const pts = [[x, y]];
    const walk = list => list.forEach(([t, n, body]) => { if(t === 'repeat') for(let i = 0; i < n; i++) walk(body); else if(DIRS[t]) for(let i = 0; i < n; i++){ x += DIRS[t][0]; y += DIRS[t][1]; pts.push([x, y]); } });
    walk(L.sol); return pts;
  }

  /* ---------- the page ---------- */
  const live = t => { $('fcLive').textContent = t; };
  let tipNow = null, clearArmed = 0;
  function edited(){ if(RUN.on) return; if(tipNow){ panel(null); } lit(null); }
  function brief(){
    const L = LV, dance = !L.goal, show = L.goal ? 'Show me the way' : L.kind === 'goal' ? 'Show me how' : 'Show me the dance';
    $('fcBrief').innerHTML = `<div class="fc-say"><span class="fc-who dad" role="img" aria-label="Dad"></span><div class="fc-bubble"><b>Dad says</b>${esc(L.say)}</div></div>
      <div id="fcPanel"></div>
      <ol class="fc-steps">${L.steps.map(s => `<li>${s}</li>`).join('')}</ol>
      <div class="fc-help">${btn('eye', show, 'sky', 'data-a="way"')}${btn('plus', 'Tired? Add the next block for me', 'leaf', 'data-a="next"')}</div>`;
  }
  function panel(kind, data){
    const el = $('fcPanel'); if(!el) return; tipNow = kind; $('fcBrief').classList.toggle('won', kind === 'win'); $('fcBrief').classList.toggle('tipped', kind === 'tip');
    if(!kind){ el.innerHTML = ''; relay(); return; }
    relay();
    if(kind === 'tip'){ $('fcBrief').scrollTop = 0; el.innerHTML = `<div class="fc-tip"><span class="fc-who doc" role="img" aria-label="Doctor McPhee"></span><div class="fc-bubble"><b>Doctor McPhee’s tip</b>${esc(data)}</div></div>`; return; }
    const L = LV, last = LI === PJ.levels.length - 1, other = PROJECTS[(PROJECTS.indexOf(PJ) + 1) % PROJECTS.length], n = data.blocks;
    const line = (L.goal ? `Fab reached the bramble bush${(L.berries || []).length ? ' and picked every berry' : ''} with ${n} block${n === 1 ? '' : 's'}.` : L.kind === 'goal' ? `Goal! Fab scored with ${n} block${n === 1 ? '' : 's'}${layouts(L).length > 1 ? ', wherever things landed' : ''}.` : `Fab danced with ${n} block${n === 1 ? '' : 's'}.`) + ' ' + L.win;
    el.innerHTML = `<div class="fc-win"><div class="fc-say"><span class="fc-who elder" role="img" aria-label="Mr Elder, the head teacher"></span><div class="fc-bubble"><b>You did it!</b>${esc(line)}${data.first ? ' You earned a star. It turns into a berry for Fab’s basket.' : ''}</div></div>
      <h3>What next?</h3>
      ${last ? btn('next', esc('Next project: ' + other.name), '', `data-a="project" data-p="${other.id}"`) : btn('next', 'Next puzzle', '', 'data-a="nextlevel"')}
      ${btn('again', 'Try it another way', '', 'data-a="another"')}
      ${btn('home', 'All projects', '', 'data-a="home"')}
      <p style="margin:0;font-size:.95em">Or stop here. This is a good place to finish.</p></div>`;
    live('You did it! ' + line); $('fcBrief').scrollTop = 0;
  }
  function controls(){
    $('fcCtrl').innerHTML = (RUN.on ? btn('stop', 'Stop', 'peach big', 'data-a="stop"') : btn('go', 'Go', 'gold big', 'data-a="go"'))
      + btn('reset', 'Fab back to the start', '', `data-a="reset" ${RUN.on ? 'disabled' : ''}`) + btn('bin', clearArmed ? 'Tap again to clear' : 'Clear my blocks', clearArmed ? 'peach' : '', `data-a="clear" ${RUN.on ? 'disabled' : ''}`);
  }
  function dots(){
    $('fcDots').innerHTML = PJ ? PJ.levels.map((l, i) => `<li><button type="button" class="${SAVE.done[l.id] ? 'done' : ''} ${i === LI ? 'now' : ''}" data-level="${i}" aria-label="Puzzle ${i + 1}: ${esc(l.name)}${SAVE.done[l.id] ? ', done' : ''}" ${i === LI ? 'aria-current="true"' : ''}>${SAVE.done[l.id] && i !== LI ? svg('tick') : i + 1}</button></li>`).join('') : '';
  }
  function open(pid, li){
    const p = PROJECTS.find(x => x.id === pid) || PROJECTS[0]; if(RUN.on){ RUN.stop = true; RUN.on = false; }
    if(li == null){ li = p.levels.findIndex(l => !SAVE.done[l.id]); if(li < 0) li = 0; }
    PJ = p; LI = clamp(0, li | 0, p.levels.length - 1); LV = p.levels[LI];
    root.dataset.view = 'work'; $('fcHome').hidden = true; $('fcWork').hidden = false; $('fcBack').hidden = false; $('fcBack').innerHTML = svg('back') + '<span>All projects</span>'; $('fcBack').dataset.a = 'home';
    $('fcWhere').textContent = `${p.name} · ${LI + 1}. ${LV.name}`; document.title = `${LV.name} · Fox Blocks`;
    cv.setAttribute('aria-label', LV.goal ? 'Fab on the grass, with a bramble bush to reach' : LV.kind === 'goal' ? 'Fab on the pitch, with a ball and a net' : 'Fab on the grass, ready to dance');
    VIEW = { way:null, wayT:0, pops:[] }; clearArmed = 0; LAYNOW = null; brief(); dots(); controls(); resetFab();
    if(!ws) inject(LV); else ws.updateToolbox(toolbox(LV));
    lay(); loadState(SAVE.code[LV.id] || fresh(LV.begin || [])); lit(null); need = true;
  }
  function home(){
    if(RUN.on) RUN.stop = true; saveCode(); PJ = null; LV = null;
    root.dataset.view = 'home'; $('fcHome').hidden = false; $('fcWork').hidden = true; $('fcBack').hidden = true; $('fcWhere').textContent = ''; $('fcDots').innerHTML = ''; document.title = 'Fox Blocks · BeMoreFab Virtual School';
    $('fcHome').innerHTML = `<div class="fc-hello"><span class="fc-who dad" role="img" aria-label="Dad"></span><div class="fc-bubble"><b>Welcome to my coding corner</b>Code is a list of instructions. Snap the blocks together, press Go, and Fab does exactly what they say. There is no timer, and you can stop whenever you like.</div></div>
      <div class="fc-cards">${PROJECTS.map(p => { const d = p.levels.filter(l => SAVE.done[l.id]).length; return `<button type="button" class="fc-card" data-a="project" data-p="${p.id}"><canvas data-art="${p.id}" width="640" height="320" aria-hidden="true"></canvas><h2>${esc(p.name)}</h2><p>${esc(p.about)}</p><p class="fc-prog">${d ? svg(d === p.levels.length ? 'star' : 'tick') : ''}${d ? `${d} of ${p.levels.length} done` : `${p.levels.length} puzzles`}</p></button>`; }).join('')}</div>
      <p class="fc-foot">A first draft of Fox Blocks, built with Blockly.${EMBED ? ' Close with the cross to go back to Fab Fox World.' : ' <a href="index.html">Back to the Fab App</a>'}</p>`;
    homeArt(); lay();
  }
  function homeArt(){
    document.querySelectorAll('canvas[data-art]').forEach(c => { const p = PROJECTS.find(x => x.id === c.dataset.art), L = p.id === 'bush' ? Object.assign({}, p.levels[0], { rows:3, start:[0, 1], goal:[4, 1], path:[[1, 1], [2, 1], [3, 1]], walls:[[1, 0, 'pond'], [3, 2, 'log']], berries:[[2, 1]] }) : p.id === 'goal' ? Object.assign({}, p.levels[3], { cols:7, ball:[5, 1] }) : Object.assign({}, p.levels[0], { cols:6, rows:3, start:[2, 1], walls:[[5, 0, 'stone'], [0, 2, 'pond']] }), g = c.getContext('2d'), T = c.width / L.cols;
      g.setTransform(1, 0, 0, 1, 0, 0); g.save(); g.translate(0, -(L.rows * T - c.height) / 2);
      scene(g, L, T, { px:L.start[0], py:L.start[1], lift:p.id === 'dance' ? .3 : 0, rot:p.id === 'dance' ? .15 : 0, sx:1, size:1, say:p.id === 'dance' ? 'Hooray!' : null, prints:[], got:{}, shake:0, ball:L.kind === 'goal' ? { px:L.ball[0], py:L.ball[1] } : null, cones:L.kind === 'goal' ? [[2, 1], [4, 1]] : [] }, null); g.restore(); });
  }
  function addNext(){
    if(RUN.on) return; const sol = LV.sol, cur = plain(program()); let k = 0;
    while(k < cur.length && k < sol.length && JSON.stringify(cur[k]) === JSON.stringify(sol[k])) k++;
    if(k >= sol.length && cur.length === sol.length){ panel('tip', 'Your code matches the model now. Press Go!'); return; }
    const swapped = cur.length > k; setProgram(sol.slice(0, Math.min(sol.length, k + 1)));
    const msg = swapped ? 'I changed your code from the first block that was different, and added the next one. Press Go to see what it does.' : k + 1 >= sol.length ? 'That is the last block. Press Go!' : 'I added the next block. Press Go to see what it does, or ask me again.';
    panel('tip', msg); live(msg);
  }
  function showWay(){
    if(RUN.on) return;
    if(LV.goal){ resetFab(); VIEW.way = route(LV); VIEW.wayT = performance.now() + 7000 / Math.max(.05, FC.speed); need = true; live('The orange dots show one way to the bush.'); }
    else play(fromPlain(LV.sol), true).then(() => { resetFab(); live('That was one way to do it. Now build yours.'); });
  }
  root.addEventListener('click', e => {
    const lv = e.target.closest('[data-level]'); if(lv){ saveCode(); open(PJ.id, +lv.dataset.level); return; }
    const b = e.target.closest('[data-a]'); if(!b || b.disabled) return; const a = b.dataset.a;
    if(a !== 'clear' && clearArmed){ clearArmed = 0; }
    if(a === 'project') open(b.dataset.p);
    else if(a === 'home') home();
    else if(a === 'go') play(program());
    else if(a === 'stop'){ RUN.stop = true; }
    else if(a === 'reset'){ resetFab(); lit(null); panel(null); }
    else if(a === 'clear'){ if(clearArmed){ clearArmed = 0; setProgram(LV.begin || []); resetFab(); panel(null); live(LV.begin ? 'Back to the starting blocks.' : 'Blocks cleared.'); } else { clearArmed = 1; setTimeout(() => { if(clearArmed){ clearArmed = 0; if(!RUN.on && LV) controls(); } }, 3500); } controls(); }
    else if(a === 'way') showWay();
    else if(a === 'next') addNext();
    else if(a === 'nextlevel'){ saveCode(); open(PJ.id, LI + 1); }
    else if(a === 'another'){ panel(null); resetFab(); }
  });

  /* every size follows the window: a phone, a laptop and a very big screen all get a full page */
  function lay(){
    const w = window.innerWidth, h = window.innerHeight, tall = w / h < 1.05, work = root.dataset.view === 'work';
    const narrow = tall && w < 700; root.classList.toggle('tall', tall); root.classList.toggle('narrow', narrow); root.classList.toggle('small', w < 560);
    root.classList.toggle('long', !tall && work && !!LV && LV.cols / LV.rows >= 2.5);   /* a long, low stage sits across the top */
    const fs = narrow ? clamp(12, Math.min(w * .036, h * .019), 24) : tall ? clamp(12, Math.min(w * .022, h * .0175), 34) : clamp(12, Math.min(w * .0128, h * .0232), 42);
    root.style.fontSize = fs.toFixed(2) + 'px';
    if(ws && work){ try{ const s = clamp(.55, Math.min(fs / (tall ? 17 : 19), $('fcBlockly').clientWidth / (LV && LV.blocks.some(b => b === 'until' || b === 'ifelse') ? 600 : 440)) * (root.classList.contains('long') ? .9 : 1), 2.3); if(Math.abs(ws.getScale() - s) > .01) ws.setScale(s); B.svgResize(ws); }catch(e){} }
    if(work) sizeStage();
  }
  function relay(){ if(root.classList.contains('narrow')) requestAnimationFrame(() => { if(ws) try{ B.svgResize(ws); }catch(e){} sizeStage(); }); }
  let layT = 0; window.addEventListener('resize', () => { lay(); clearTimeout(layT); layT = setTimeout(lay, 120); });

  defineBlocks(); home(); requestAnimationFrame(frame);
  try{ document.fonts.ready.then(() => { need = true; lay(); }); }catch(e){}
  try{ const q = new URLSearchParams(location.search), p = q.get('project'); if(p) open(p, q.get('puzzle') ? +q.get('puzzle') - 1 : null); }catch(e){}

  window.FabCode = window.FoxBlocks = FC;
  Object.assign(FC, { open, home, projects:PROJECTS, setProgram, program:() => plain(program()), run:() => play(program()), stop:() => { RUN.stop = true; }, addNext, showWay, route,
    state:() => ({ view:root.dataset.view, project:PJ && PJ.id, level:LV && LV.id, x:FAB && FAB.x, y:FAB && FAB.y, running:RUN.on, done:Object.assign({}, SAVE.done), got:FAB ? Object.keys(FAB.got).length : 0, ball:FAB && FAB.ball ? [FAB.ball.x, FAB.ball.y] : null, cones:FAB ? FAB.cones.length : 0, prints:FAB ? FAB.prints.length : 0, tile:TILE, way:!!VIEW.way, panel:tipNow }),
    ws:() => ws, key:KEY });
})();
