/* booklets.js — Booklets: a second kind of learning beside the flightpaths (first version, 27 Nov 2026, late evening).
   Patrick, 23:10, with twelve of BMF's own resources attached: "I would not like to lose the power of this kind of teaching and
   learning. It demonstrates excellent pedagogy from AfL strategies, scaffolding, adaptive teaching and using rich resources. So now is
   the time to ensure there is a place for this type of learning within or as well as the Flightpath model".
   What a booklet is here:
     - a short run of PAGES, each a different kind of thinking (rate your confidence, watch a model then try its twin, quick questions,
       a hinge question, spot the mistake, choose your challenge, always-sometimes-never, an exit ticket);
     - never marked in front of the child: no ticks, no crosses, no timer, no score. The child answers and moves on;
     - read by the TEACHER afterwards (Teachers' area, View task progress): confidence before and after, which hinge letter was chosen and
       the misconception that letter points to, and draft next steps. That is the assessment for learning.
   Two booklets are rebuilt as pages in the app (the Four Operations Check-Ins). The others are listed in the library with their pages, so
   one part can be set as a task and opened on the board from the teacher's own files, until BMF decides the files can sit in the app.
   Everything a child types stays in their own viewer, under their Fab code. Fab codes only. Drafts for a teacher to check.
   The pupil who makes the mistakes on "Spot the Mistake" is Pip, from Fab Fox World, so it can never share a name with a child.
   Loaded before burrow.js. */
(function(){
  'use strict';
  const h = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const snd = k => { try{ Sound[k](); }catch(e){} };
  const ls = { json(k, f){ try{ const v = JSON.parse(localStorage.getItem(k)); return v == null ? f : v; }catch(e){ return f; } }, set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} } };
  const CODE_RE = /^[a-z]{2,12}-\d{3}$/;
  const ic = (name, emoji) => { try{ if(window.FabIcon && FabIcon.names.includes(name)) return FabIcon.svg(name); }catch(e){} return `<span aria-hidden="true">${emoji}</span>`; };
  const OPS = { add:{ s:'+', n:'Adding', c:'#3F7D3A' }, sub:{ s:'−', n:'Subtracting', c:'#3F8FC4' }, mul:{ s:'×', n:'Multiplying', c:'#D9772B' }, div:{ s:'÷', n:'Dividing', c:'#8A5FB0' } };
  const OPK = ['add', 'sub', 'mul', 'div'];
  const SCALE = ['Not yet', 'A bit', 'Getting there', 'Confident', 'I could teach it!'];
  const LINE = 'line';

  /* ---------- the pages of the two check-ins (BMF's own booklets, rebuilt as pages) ---------- */
  const conf = (k, t, strap) => ({ kind:k === 'c1' ? 'conf' : 'exit', k, t, strap });
  const quick = (strap, rows) => ({ kind:'quick', t:'Quick Fire', strap, items:rows.map(r => ({ id:r[0], op:r[1], q:r[2], a:r[3] })) });
  const hinge = (n, rows) => ({ kind:'hinge', t:'Which Is Right? (' + n + ')', strap:'Choose A, B, C or D. Be ready to explain why!', items:rows.map(r => ({ op:r[0], q:r[1], opts:r[2], ok:r[3], why:r[4] })) });
  const levels = (M, S, H) => ({ kind:'levels', t:'Choose Your Challenge', strap:'Pick the level that feels right. You can move up or down!', lv:{ Mild:M, Spicy:S, Hot:H } });
  const asn = rows => ({ kind:'asn', t:'Always, Sometimes or Never?', strap:'Decide, then prove it with an example.', items:rows.map(r => ({ q:r[0], a:r[1], why:r[2] })) });
  const model = (op, t, ido, col, steps, you, a) => ({ kind:'model', t:'Watch Me: ' + t, strap:'Follow the steps. Then try the one on the right.', op, ido, col, steps, you, a });
  const NEXT = [
    ['over', 'Confident at the start but not yet right', 'Over-confident: check understanding before speed; ask “prove it”.'],
    ['under', 'Right answers but low confidence', 'Under-confident: praise specifically; nudge up a challenge level.'],
    ['hard', 'Slips only on the harder questions', 'Secure facts; focus on written methods (exchanging, carrying).'],
    ['facts', 'Slips on × and ÷ facts', 'Times-table gap: target 2, 5, 10, then 3, 4, 8.'],
    ['found', 'Slips on the easier + and − questions', 'Go back to the foundations before column methods: the My Number Toolkit booklet (counting on and counting back first).'],
    ['hinge', 'A hinge letter that is not the right one', 'Look at what that letter tells you (above). The same letter from several children means re-teach that misconception as a group, with place value counters.']
  ];
  const Y34 = { afl:true, harder:'four-ops-y56', id:'four-ops-y34', t:'Four Operations Check-In: Year 3/4', short:'Four Operations Check-In (Y3/4)', sub:'Maths', st:['lks2'], app:true, time:'About 30 minutes',
    about:'Assessment for learning in eight short pages: confidence, quick questions, hinge questions, spot the mistake, choose your challenge and an exit ticket. Pages 1 and 8 bookend the session, so you can compare confidence before and after.',
    pages:[
      conf('c1', 'Four Operations Check-In', 'How confident do you feel? Tap a number for each one.'),
      quick('Have a go at all eight. It’s fine to leave one if you’re stuck!', [['A', 'add', '46 + 23', 69], ['B', 'add', '264 + 158', 422], ['C', 'sub', '85 − 32', 53], ['D', 'sub', '503 − 246', 257], ['E', 'mul', '6 × 4', 24], ['F', 'mul', '32 × 3', 96], ['G', 'div', '24 ÷ 3', 8], ['H', 'div', '96 ÷ 3', 32]]),
      hinge(1, [['add', '358 + 167', ['415', '525', '425', '625'], 'B', ['No carrying at all', 'Correct', 'Carried to tens, not to hundreds', 'Carried too much']],
        ['sub', '402 − 157', ['355', '345', '245', '255'], 'C', ['Smaller digit from larger in each column', 'Exchanged but didn’t reduce the hundreds', 'Correct', 'Exchanged for the ones but didn’t reduce the tens']]]),
      hinge(2, [['mul', '23 × 4', ['812', '82', '27', '92'], 'D', ['8 and 12 written side by side (place value)', 'Multiplied the tens, added the ones', 'Added instead of multiplied', 'Correct']],
        ['div', '84 ÷ 4', ['336', '21', '20', '80'], 'B', ['Multiplied instead of divided', 'Correct', 'Divided the tens, missed the ones', 'Subtracted instead of divided']]]),
      { kind:'mistake', t:'Spot the Mistake', strap:'Pip has made a mistake in each one. Can you find it and fix it?', items:[
        { id:'m1', head:'Pip’s working', col:[['', '2', '4', '7'], ['+', '1', '3', '5'], LINE, { bad:['', '3', '7', '2'] }], fix:'247 + 135 = 382 (Pip forgot to carry the 1 ten)' },
        { id:'m2', head:'Pip’s answers', lines:[['6 × 7 = ', '48'], ['56 ÷ 7 = ', '9']], fix:'6 × 7 = 42 (Pip did 6 × 8) · 56 ÷ 7 = 8' }] },
      levels([['34 + 25', 59], ['68 − 23', 45], ['5 × 3', 15], ['20 ÷ 5', 4]], [['368 + 145', 513], ['563 − 248', 315], ['7 × 8', 56], ['72 ÷ 6', 12]], [['2,476 + 1,385', 3861], ['5,003 − 1,267', 3736], ['46 × 7', 322], ['96 ÷ 4', 24]]),
      asn([['If you add two odd numbers, the answer is odd.', 'never', 'it is always even'], ['Multiplying makes a number bigger.', 'sometimes', 'not × 1 or × 0'], ['You can add numbers in any order.', 'always', ''], ['Half of an even number is even.', 'sometimes', 'half of 6 is 3']]),
      conf('c8', 'Exit Ticket', 'How do you feel now? Tap again, then answer the questions below.')
    ],
    run:{ head:['Page', 'Activity', 'Time', 'What it tells you', 'How to run it'], rows:[
      ['1', 'Confidence check-in', '2 min', 'Self-belief per operation', 'Private: in the app each child taps on their own viewer'],
      ['2', 'Quick Fire', '6 min', 'Accuracy, easy (A C E G) vs harder (B D F H)', 'Scan, don’t mark'],
      ['3–4', 'Which Is Right? (hinge questions)', '5 min', 'The exact misconception, from the letter chosen', 'All choose A–D at once on 3, 2, 1'],
      ['5', 'Spot the Mistake', '4 min', 'Can they reason, not just calculate?', 'Talk partners, then share'],
      ['6', 'Choose Your Challenge', '8 min', 'Where they place themselves; accuracy at that level', 'Let them choose; nudge up or down'],
      ['7', 'Always, Sometimes, Never', '3 min', 'Depth: reasoning and proof', 'Early finishers or whole-class talk'],
      ['8', 'Exit ticket', '2 min', 'Confidence change; what they want help with', 'Private; compare with page 1']] } };
  const Y56 = { afl:true, id:'four-ops-y56', t:'Four Operations Check-In: Year 5/6', short:'Four Operations Check-In (Y5/6)', sub:'Maths', st:['uks2'], app:true, time:'About 30 to 40 minutes',
    about:'The same check-in for older children, with four Watch Me pages (I do, we do, you do) for column addition and subtraction, long multiplication and short division. You won’t need every page: use the confidence check to choose which Watch Me pages to start with.',
    pages:[
      conf('c1', 'Four Operations Check-In', 'How confident do you feel? Tap a number for each one.'),
      model('add', 'Column Addition', '4,786 + 2,357', [['', '4', '7', '8', '6'], ['+', '2', '3', '5', '7'], LINE, { ans:['', '7', '1', '4', '3'] }, { small:['', '1', '1', '1', ''] }],
        ['Line up the digits: ones under ones.', 'Start with the ones: 6 + 7 = 13. Write 3, carry 1 under the tens.', 'Tens: 8 + 5 + 1 = 14. Write 4, carry 1.', 'Hundreds: 7 + 3 + 1 = 11. Write 1, carry 1.', 'Thousands: 4 + 2 + 1 = 7. Answer: 7,143'], '3,568 + 2,475', 6043),
      model('sub', 'Column Subtraction', '6,042 − 2,758', [{ small:['', '5', '9', '13', '12'] }, { strike:['', '6', '0', '4', '2'] }, ['−', '2', '7', '5', '8'], LINE, { ans:['', '3', '2', '8', '4'] }],
        ['Ones: 2 − 8? Not enough. Exchange 1 ten: 2 becomes 12, 4 tens becomes 3.', 'Tens: 3 − 5? Not enough. The hundreds is 0, so exchange from the thousands: 6 becomes 5, 0 hundreds becomes 10.', 'Exchange 1 hundred into tens: 10 becomes 9, 3 tens becomes 13.', 'Now subtract: 12 − 8 = 4, 13 − 5 = 8, 9 − 7 = 2, 5 − 2 = 3. Answer: 3,284'], '5,031 − 1,846', 3185),
      model('mul', 'Long Multiplication', '34 × 26', [['', '', '3', '4'], ['×', '', '2', '6'], LINE, ['', '2', '0', '4'], ['', '6', '8', '0'], LINE, { ans:['', '8', '8', '4'] }],
        ['Multiply by the ones (6): 34 × 6 = 204.', 'Multiply by the tens (20): put a 0 in the ones first, then 34 × 2 = 68. Row: 680.', 'Add the two rows: 204 + 680 = 884.', 'Check: 34 × 26 is about 30 × 30 = 900. Close!'], '43 × 25', 1075),
      model('div', 'Short Division', '1,365 ÷ 5', [{ ans:['', '0', '2', '7', '3'] }, { bus:['5', '1', ['1', '3'], ['3', '6'], ['1', '5']] }],
        ['How many 5s in 1? 0. Carry the 1 to the next digit: 13.', 'How many 5s in 13? 2 (10), remainder 3. Carry 3: 36.', 'How many 5s in 36? 7 (35), remainder 1. Carry 1: 15.', 'How many 5s in 15? 3. Answer: 273. Check: 273 × 5 = 1,365.'], '2,184 ÷ 6', 364),
      quick('Have a go at all eight. Use the Watch Me pages if you need them!', [['A', 'add', '3,456 + 2,138', 5594], ['B', 'add', '48,275 + 16,947', 65222], ['C', 'sub', '8,764 − 3,421', 5343], ['D', 'sub', '50,006 − 18,457', 31549], ['E', 'mul', '243 × 6', 1458], ['F', 'mul', '47 × 36', 1692], ['G', 'div', '852 ÷ 4', 213], ['H', 'div', '2,415 ÷ 7', 345]]),
      hinge(1, [['add', '6,758 + 3,476', ['9,124', '10,234', '10,134', '9,234'], 'B', ['No carrying at all', 'Correct', 'Missed the carry into the hundreds', 'Missed the carry into the thousands']],
        ['sub', '7,003 − 2,467', ['5,464', '4,536', '5,536', '4,646'], 'B', ['Smaller digit from larger in each column', 'Correct', 'Exchanged but didn’t reduce the thousands', 'Made each zero a 10, not a 9']]]),
      hinge(2, [['mul', '46 × 23', ['230', '1,058', '818', '69'], 'B', ['Missed the placeholder zero (138 + 92)', 'Correct', 'Tens × tens and ones × ones only', 'Added instead']],
        ['div', '1,365 ÷ 5', ['211', '6,825', '273', '1,360'], 'C', ['Dropped the remainders', 'Multiplied instead', 'Correct', 'Subtracted instead']]]),
      { kind:'mistake', t:'Spot the Mistake', strap:'Pip has made a mistake in each one. Can you find it and fix it?', items:[
        { id:'m1', head:'Pip’s working', col:[['', '', '3', '4'], ['×', '', '2', '6'], LINE, ['', '2', '0', '4'], { bad:['', '', '6', '8'] }, LINE, { bad:['', '2', '7', '2'] }], fix:'34 × 26: the second row should be 680 (Pip missed the zero), so 884' },
        { id:'m2', head:'Pip’s answers', lines:[['7,000 − 1 = ', '6,000'], ['0.5 × 10 = ', '0.50']], fix:'7,000 − 1 = 6,999 · 0.5 × 10 = 5' }] },
      levels([['2,345 + 1,432', 3777], ['5,678 − 2,345', 3333], ['34 × 5', 170], ['96 ÷ 4', 24]], [['37,486 + 25,768', 63254], ['40,005 − 16,738', 23267], ['324 × 7', 2268], ['1,728 ÷ 6', 288]], [['3.7 + 12.48', 16.18], ['10 − 3.46', 6.54], ['156 × 47', 7332], ['4,536 ÷ 12', 378]]),
      asn([['Odd number × odd number gives an odd answer.', 'always', ''], ['Multiplying by 10 just adds a zero.', 'sometimes', '0.5 × 10 = 5'], ['Dividing makes a number smaller.', 'sometimes', 'not ÷ 1 or ÷ 0.5'], ['Two odd numbers add to make an odd number.', 'never', '']]),
      conf('c8', 'Exit Ticket', 'How do you feel now? Tap again, then answer below.')
    ],
    run:{ head:['Page', 'Activity', 'Use it to…'], rows:[
      ['1', 'Confidence check-in', 'Spot any operation rated 1–2: start with that Watch Me page'],
      ['2–5', 'Watch Me models: column +, column −, long ×, short ÷', 'I do (talk through the steps) → We do (start the twin together) → You do (finish alone)'],
      ['6', 'Quick Fire', 'Check accuracy: A C E G easier, B D F H harder'],
      ['7–8', 'Which Is Right?', 'Diagnose the misconception from the letter chosen'],
      ['9', 'Spot the Mistake', 'Check reasoning: can they explain why Pip is wrong?'],
      ['10', 'Choose Your Challenge', 'See where they place themselves; Hot adds decimals'],
      ['11', 'Always, Sometimes, Never', 'Stretch and reasoning; good for confident moments'],
      ['12', 'Exit ticket', 'Compare confidence with page 1']],
      say:[['Estimate first, every time', '“Roughly how big will the answer be?” (gives them a way to check)'], ['Narrate your thinking on the Watch Me page', '“I always start with the ones. 6 add 7 is 13…”'], ['Do the first step of the twin together', '“You tell me the ones, I’ll write it.”'], ['Let them finish alone; praise the method, not just the answer', '“You exchanged really carefully there.”']] } };

  /* ---------- the library: BMF's booklets. Those not yet rebuilt as pages are opened on the board from the teacher's own files ---------- */
  const board = (id, t, sub, st, pages, about, care) => ({ id, t, short:t, sub, st, app:false, about, care:care || '', parts:pages });
  /* My Number Toolkit, rebuilt as pages (Patrick, 28 Nov: "Yes"). Watch me → Let's do it together → My turn, one strategy at a time. */
  const W = 'Watch me', G = 'Let’s do it together', M = 'My turn';
  const TOOLS = ['Ten frame', 'Count on', 'Count back', 'Part-whole', 'Count up'], FACES = ['Tricky', 'Getting there', 'Got it'];
  const TOOLKIT = { id:'number-toolkit', t:'My Number Toolkit: tools to add and take away', short:'My Number Toolkit', sub:'Maths', st:['ks1', 'lks2'], app:true, time:'Two or three pages a session',
    about:'Back to the foundations, one strategy at a time: Watch me → Let’s do it together → My turn. For any class where counting is not yet secure. Pages 3 and 4 (counting on and counting back) are the priority.',
    notes:['Watch me: you model and say every step aloud. Together: share the pen. My turn: they finish alone; one question is enough on a low-energy day.', 'Use real objects beside the screen: fingers, counters, bricks, coins.', 'Say teen numbers as “ten and two” for 12, so the 1 (the ten) is written first. Praise noticing and fixing a reversal.', 'Note which tool they choose on page 8: it shows the strategy they trust.', 'Next steps, only when secure: number bonds to 10 and 20 recalled, not counted; bridging through 10 (8 + 5 = 8 + 2 + 3); tens and ones; then column methods, with real objects first.'],
    pages:[
      { kind:'steps', t:'Counting Warm-Up', strap:'Say each number out loud as you point to it.', s:'Counting', parts:[
        { h:G, say:'Count forwards. Fill in the missing numbers.', seq:[0, 1, 2, 3, '_4', 5, 6, 7, '_8', 9, 10, '_11', 12, 13, 14, '_15', 16, 17, 18, '_19', 20] },
        { h:M, say:'Count backwards. Say them as you go: twenty, nineteen, eighteen…', seq:[20, 19, 18, '_17', 16, 15, 14, '_13', 12, 11, 10, '_9', 8, 7, '_6', 5, 4, 3, '_2', 1, 0] },
        { h:M, say:'Tap the right one. Read it out loud first!', items:[{ q:'twelve', a:'12', opts:['12', '21'] }, { q:'thirteen', a:'13', opts:['31', '13'] }, { q:'fifteen', a:'15', opts:['15', '51'] }] }] },
      { kind:'steps', t:'Ten Frames', strap:'How many dots? How many more to make 10?', s:'Number bonds to 10', parts:[
        { h:W, aid:{ type:'frame', n:7 }, say:'I can see 7 dots. There are 3 empty spaces. So 7 + 3 = 10. Say: “5 on the top row, and 2 more makes 7.”' },
        { h:G, aid:{ type:'frame', n:6 }, items:[{ q:'How many dots?', a:6 }, { q:'How many more to make 10?', a:4 }] },
        { h:G, aid:{ type:'frame', n:9 }, items:[{ q:'How many dots?', a:9 }, { q:'How many more to make 10?', a:1 }] },
        { h:M, say:'Finish the sums. You can draw the dots on paper first.', items:[{ q:'4 + ? = 10', a:6 }, { q:'8 + ? = 10', a:2 }] }] },
      { kind:'steps', t:'Counting On', strap:'Start at the bigger number. Hop forwards.', s:'Counting on', parts:[
        { h:W, aid:{ type:'line', from:0, to:10, at:5, hop:3 }, say:'5 + 3: I put 5 in my head, then hop on 3: 6, 7, 8. So 5 + 3 = 8' },
        { h:G, aid:{ type:'line', from:0, to:10, at:6, hop:1 }, say:'6 + 4: We start at 6. I’ve done the first hop. Can you do the rest?', items:[{ q:'6 + 4', a:10 }] },
        { h:M, aid:{ type:'line', from:0, to:12 }, items:[{ q:'7 + 2', a:9 }, { q:'9 + 3', a:12 }] }] },
      { kind:'steps', t:'Counting Back', strap:'Take away means hop backwards. Count the hops.', s:'Counting back', parts:[
        { h:W, aid:{ type:'line', from:0, to:10, at:9, hop:-3 }, say:'9 − 3: I start on 9. I hop back 3 times: 8, 7, 6. So 9 − 3 = 6' },
        { h:G, aid:{ type:'line', from:0, to:20 }, say:'12 − 3: Put your finger on 12. Hold up 3 fingers and fold one down for each hop.', items:[{ q:'12 − 3', a:9 }] },
        { h:M, aid:{ type:'line', from:0, to:17 }, items:[{ q:'10 − 3', a:7 }, { q:'7 − 3', a:4 }, { q:'15 − 3', a:12 }] }] },
      { kind:'steps', t:'Jumping Back in 3s', strap:'Every jump goes back 3. Use your fingers to help.', s:'Counting back', parts:[
        { h:W, aid:{ type:'line', from:0, to:20, at:20, hop:-3 }, say:'Start at 20. Count back 3 each time: 19, 18, 17. Land on 17! Then again from 17…' },
        { h:G, say:'Keep jumping back 3. Fill in where we land.', seq:[20, 17, 14, '_11', '_8', '_5', '_2'] },
        { h:M, say:'Which number is 3 less?', items:[{ q:'3 less than 6', a:3 }, { q:'3 less than 10', a:7 }, { q:'3 less than 13', a:10 }] },
        { h:'Ready for more?', say:'What do you notice? 20, 17, 14, 11… Can you see a pattern? Tell your teacher.' }] },
      { kind:'steps', t:'Part-Whole', strap:'Two parts make the whole. One picture, four number sentences!', s:'Part-whole', parts:[
        { h:W, aid:{ type:'pw', w:10, a:7, b:3 }, say:'7 + 3 = 10 · 3 + 7 = 10 · 10 − 3 = 7 · 10 − 7 = 3' },
        { h:G, aid:{ type:'pw', w:9, a:6, b:'?' }, say:'What is the missing part? Use your fingers: 6 and how many more make 9?', items:[{ q:'9 − 6', a:3 }] },
        { h:M, aid:{ type:'pw', w:8, a:5, b:'?' }, say:'Find the missing part. Then write the four number sentences.', items:[{ q:'The missing part', a:3 }, { q:'5 + 3', a:8 }, { q:'3 + 5', a:8 }, { q:'8 − 5', a:3 }, { q:'8 − 3', a:5 }] }] },
      { kind:'steps', t:'Counting Up', strap:'When the numbers are close together, count up from the smaller one.', s:'Counting up', parts:[
        { h:W, aid:{ type:'line', from:0, to:15, at:9, hop:2 }, say:'11 − 9: 9 and 11 are close! I start on 9 and count up to 11: 10, 11. That’s 2 hops. So 11 − 9 = 2' },
        { h:G, aid:{ type:'line', from:0, to:15 }, say:'13 − 10: Start on 10. Hop up until you reach 13. Count the hops together.', items:[{ q:'13 − 10', a:3 }] },
        { h:M, aid:{ type:'line', from:10, to:20 }, items:[{ q:'15 − 12', a:3 }, { q:'20 − 17', a:3 }] }] },
      { kind:'steps', t:'Choose Your Tool', strap:'Pick the tool that helps you most. There’s no wrong choice!', parts:[
        { h:'Warm', items:[{ q:'6 + 3', a:9 }, { q:'My tool for 6 + 3', opts:TOOLS }, { q:'8 − 3', a:5 }, { q:'My tool for 8 − 3', opts:TOOLS }] },
        { h:'Warmer', items:[{ q:'14 − 3', a:11 }, { q:'My tool for 14 − 3', opts:TOOLS }, { q:'7 + 5', a:12 }, { q:'My tool for 7 + 5', opts:TOOLS }] },
        { h:'Hot', items:[{ q:'16 − 13', a:3 }, { q:'My tool for 16 − 13', opts:TOOLS }, { q:'12 − 4', a:8 }, { q:'My tool for 12 − 4', opts:TOOLS }] }] },
      { kind:'steps', t:'How Did I Get On?', strap:'Tap the words that match how you feel.', parts:[
        { h:'How it felt', items:['Counting forwards and back', 'Ten frames', 'Counting on', 'Counting back', 'Part-whole', 'Counting up'].map(q => ({ q, opts:FACES })) },
        { h:'In my own words', items:[{ q:'My favourite tool is…' }, { q:'Something I want to practise again:' }] }] }
    ] };
  const LIB = [Y34, Y56,
    TOOLKIT,
    board('year4-challenge', 'Year 4 Challenge Booklet: maths and English', ['Maths', 'English'], ['lks2'], ['Page 2: Number Detective', 'Page 3: Multiplication Masters', 'Page 4: Fraction & Decimal Challenge', 'Page 5: Shape Investigator', 'Page 6: Logic Lab', 'Page 7: Dickens’ Foggy Street (reading)', 'Page 8: Reading Detective', 'Page 9: Grammar Workshop', 'Page 10: Writer’s Challenge'],
      'Every page starts with a Quick start, then a Challenge and a Stretch. Each box is a natural stopping point, and the maths ends with a planned break. Stretch boxes go beyond Year 4.'),
    board('victorian-schools', 'Victorian Schools (Adventurers)', 'Topic', ['lks2'], ['Page 1: Victorian Schools (starter, who went to school?)', 'Page 2: In the Classroom (same or different, choose your challenge)'],
      'History, two pages: rank the school day, who went to school, then Mild, Spicy or Hot sentences. Goes with the Victorians Explorer World.'),
    board('victorian-work', 'Victorian Children at Work (Pioneers)', 'Topic', ['uks2'], ['Page 1: Victorian Children at Work (rank the jobs)', 'Page 2: Things Begin to Change (new laws, then and now)'],
      'History, two pages: the jobs children did, the laws that changed things, and Dickens. Goes with the Victorians Explorer World.', 'This one is about hard lives and dangerous work for children. Choose it with care, and keep the ending on how things got better.'),
    board('rex-duck', 'Rex and the Duck: Weekly Reader 2', 'Phonics', ['eyfs', 'ks1'], ['First read', 'Second read', 'Third read, then the story questions'], 'A short decodable story to read three times across a session or a week, with a reading record for the teacher.'),
    board('warm-up-3', 'Warm-Up Cards 3: sounds, tricky words, sentences', 'Phonics', ['eyfs', 'ks1'], ['Card 1: Sound Spotter', 'Card 2: Tricky Words', 'Card 3: Read It!'], 'Three quick cards to open a reading session: say the sounds, spot the tricky bit, read a sentence.'),
    board('maths-cards-3', 'Maths Cards 3: counting', 'Maths', ['eyfs', 'ks1'], ['Card 1: Count with Me', 'Card 2: Count and Match', 'Card 3: Give Me…', 'Card 4: Did Rex Count Right?'], 'Counting each object once and knowing the last number tells you how many. Card 4 is the stretch: can they spot the mistake?')
  ];
  /* booklets a teacher has added in this browser, or that arrived in a child's link (made with Claude from the booklet brief) */
  const DK = 'fab-booklet-defs';
  const mine = () => { const v = ls.json(DK, []); return Array.isArray(v) ? v.filter(d => d && d.id && Array.isArray(d.pages)) : []; };
  const all = () => LIB.concat(mine());
  const byId = id => all().find(b => b.id === id) || null;
  /* how the Burrow sees a booklet task: 'bk:<id>' or 'bk:<id>:<page number>' */
  function act(actId){ const b = byId(String(actId || '').split(':')[1]); return b ? { id:'bk:' + b.id, n:'Booklet: ' + (b.short || b.t), ic:'books', e:'📚', show:b.app ? '' : 'Your teacher will open this booklet with you.' } : null; }

  /* ---------- answers: kept in the child's own viewer, under their Fab code ---------- */
  const KEY = (id, code) => 'fab-booklet-' + id + '-' + code;
  const read = (id, code) => { const v = CODE_RE.test(code) ? ls.json(KEY(id, code), null) : null; return v && typeof v === 'object' && v.a ? v : { a:{}, p:0, t:0 }; };
  const S = { b:null, i:0, code:'', back:'screen-hub', teach:false, A:{}, lv:'' };
  function save(){ if(S.b && CODE_RE.test(S.code)) ls.set(KEY(S.b.id, S.code), { a:S.A, p:S.i, t:Date.now(), n:S.b.pages.length }); }
  function known(code){ return all().filter(b => b.app).map(b => ({ b, d:read(b.id, code) })).filter(x => x.d.t); }
  function codes(){ const out = new Set(); try{ for(let i = 0; i < localStorage.length; i++){ const m = /^fab-booklet-.+-([a-z]{2,12}-\d{3})$/.exec(localStorage.key(i) || ''); if(m) out.add(m[1]); } }catch(e){} return [...out]; }
  const num = v => { const s = String(v == null ? '' : v).replace(/[\s,]/g, ''); return s === '' || isNaN(Number(s)) ? null : Number(s); };
  const right = (v, a) => { const n = num(v); return n == null ? null : Math.abs(n - a) < 1e-9; };

  /* ---------- drawing a page ---------- */
  const opDot = op => `<span class="bk-op" style="background:${OPS[op].c}" aria-hidden="true">${OPS[op].s}</span>`;
  const box = (k, label, wide) => `<input class="bk-in ${wide ? 'wide' : ''}" type="text" ${wide ? '' : 'inputmode="decimal"'} autocomplete="off" data-k="${h(k)}" value="${h(S.A[k] || '')}" aria-label="${h(label)}" maxlength="${wide ? 120 : 12}">`;
  function colHTML(rows){
    const cell = c => Array.isArray(c) ? `<td><sup>${h(c[0])}</sup>${h(c[1])}</td>` : `<td>${h(c)}</td>`;
    return `<table class="bk-col" role="img" aria-label="The written working">${rows.map(r => r === LINE ? '<tr class="rule"><td colspan="9"></td></tr>' : Array.isArray(r) ? `<tr>${r.map(cell).join('')}</tr>` : `<tr class="${Object.keys(r)[0]}">${r[Object.keys(r)[0]].map(cell).join('')}</tr>`).join('')}</table>`;
  }
  function confHTML(p){
    return `<div class="bk-card"><table class="bk-conf"><thead><tr><th></th>${SCALE.map(s => `<th>${s}</th>`).join('')}</tr></thead><tbody>${OPK.map(o => `<tr><th>${opDot(o)} ${OPS[o].n}</th>${SCALE.map((s, i) => { const k = p.k + '.' + o, on = String(S.A[k]) === String(i + 1);
      return `<td><button type="button" class="bk-num ${on ? 'on' : ''}" data-k="${k}" data-v="${i + 1}" aria-pressed="${on}" aria-label="${OPS[o].n}: ${i + 1}, ${s}">${i + 1}</button></td>`; }).join('')}</tr>`).join('')}</tbody></table></div>
      ${p.kind === 'exit' ? `<div class="bk-card bk-lines"><label><span>One thing I can do now:</span>${box('x.can', 'One thing I can do now', true)}</label><label><span>One thing I’d like help with:</span>${box('x.help', 'One thing I would like help with', true)}</label></div>` : ''}`;
  }
  function pageHTML(p){
    if(p.kind === 'conf' || p.kind === 'exit') return confHTML(p);
    if(p.kind === 'quick') return `<div class="bk-grid2">${p.items.map(q => `<div class="bk-card bk-q"><b class="bk-letter">${h(q.id)}</b>${q.op ? opDot(q.op) : ''}<span class="bk-sum">${h(q.q)} =</span>${box('q.' + q.id, q.q)}</div>`).join('')}</div>`;
    if(p.kind === 'hinge') return `<div class="bk-grid2">${p.items.map(q => `<div class="bk-card bk-h"><p class="bk-sum">${q.op ? opDot(q.op) + ' ' : ''}${h(q.q)}${q.op ? ' = ?' : ''}</p><div class="bk-opts">${q.opts.map((o, i) => { const L = 'ABCD'[i], k = 'h.' + (q.id || q.op), on = S.A[k] === L;
      return `<button type="button" class="bk-opt ${on ? 'on' : ''}" data-k="${k}" data-v="${L}" aria-pressed="${on}"><b>${L}</b> ${h(o)}</button>`; }).join('')}</div></div>`).join('')}</div>`;
    if(p.kind === 'mistake') return `<div class="bk-grid2">${p.items.map(m => `<div class="bk-card"><h3>${h(m.head)}:</h3>${m.col ? colHTML(m.col) : `<div class="bk-wrong">${m.lines.map(l => `<p>${h(l[0])}<b>${h(l[1])}</b></p>`).join('')}</div>`}
      <label class="bk-lines"><span>Pip’s mistake was…</span>${box(m.id, 'Pip’s mistake was', true)}</label></div>`).join('')}</div>`;
    if(p.kind === 'levels'){ const cur = S.A.lv || '';
      return `<div class="bk-levels">${Object.keys(p.lv).map(L => `<button type="button" class="bk-lv ${L.toLowerCase()} ${cur === L ? 'on' : ''}" data-k="lv" data-v="${L}" aria-pressed="${cur === L}">${L}</button>`).join('')}</div>
        ${cur ? `<div class="bk-card bk-lvq">${p.lv[cur].map((q, i) => `<div class="bk-q"><span class="bk-sum">${h(q[0])} =</span>${box('lv.' + cur + '.' + i, q[0])}</div>`).join('')}</div><p class="bk-soft">Want a change? Tap another level at any time.</p>` : '<p class="bk-soft">Tap a level to see its four questions.</p>'}`; }
    if(p.kind === 'asn') return `<div class="bk-card bk-asn">${p.items.map((q, i) => `<div class="bk-asnrow"><p>${h(q.q)}</p><div class="bk-opts three">${['always', 'sometimes', 'never'].map(v => { const k = 'asn.' + i, on = S.A[k] === v;
      return `<button type="button" class="bk-opt ${on ? 'on' : ''}" data-k="${k}" data-v="${v}" aria-pressed="${on}">${v}</button>`; }).join('')}</div>${box('asn.' + i + '.why', 'Prove it with an example', true).replace('<input', '<input placeholder="Prove it with an example"')}</div>`).join('')}</div>`;
    if(p.kind === 'model') return `<div class="bk-watch"><div class="bk-card"><h3>${opDot(p.op)} I do: ${h(p.ido)}</h3><div class="bk-ido">${colHTML(p.col)}<ol>${p.steps.map(s => `<li>${h(s)}</li>`).join('')}</ol></div></div>
      <div class="bk-card bk-you"><h3>You do:</h3><p class="bk-sum">${h(p.you)} =</p>${box('m.' + p.op, p.you)}<p class="bk-soft">Use paper or the board for your working. Your teacher can start it with you.</p></div></div>`;
    if(p.kind === 'steps') return stepsHTML(p, S.i);
    if(p.kind === 'text') return `<div class="bk-card bk-text">${(p.body || []).map(x => `<p>${h(x)}</p>`).join('')}${(p.words || []).length ? `<div class="bk-words"><b>Word bank</b>${p.words.map(w => `<span><i>${h(w[0])}</i> ${h(w[1])}</span>`).join('')}</div>` : ''}</div>`;
    return '';
  }
  function tnoteHTML(i){
    const r = S.b.run || { rows:[], head:[] }, p = S.b.pages[i], n = i + 1;
    const row = r.rows.find(x => { const m = String(x[0]).split('–').map(Number); return m.length === 1 ? m[0] === n : n >= m[0] && n <= m[1]; });
    let extra = '';
    if(p.kind === 'hinge') extra = p.items.map(q => `<p><b>${h(q.q)}</b>: ${q.opts.map((o, k) => `${'ABCD'[k]} ${h(o)}: ${h(q.why[k])}`).join(' · ')}</p>`).join('');
    else if(p.kind === 'quick') extra = `<p>Answers: ${p.items.map(q => q.id + ' ' + q.a.toLocaleString('en-GB')).join(' · ')}</p>`;
    else if(p.kind === 'mistake') extra = p.items.map(m => `<p>${h(m.fix)}</p>`).join('');
    else if(p.kind === 'levels') extra = `<p>Answers: ${Object.keys(p.lv).map(L => L + ' ' + p.lv[L].map(q => q[1].toLocaleString('en-GB')).join(' · ')).join(' | ')}</p>`;
    else if(p.kind === 'asn') extra = `<p>${p.items.map(q => h(q.q) + ' <b>' + q.a + '</b>' + (q.why ? ' (' + h(q.why) + ')' : '')).join(' · ')}</p>`;
    else if(p.kind === 'model') extra = `<p>You do: ${h(p.you)} = ${p.a.toLocaleString('en-GB')}</p>`;
    else if(p.kind === 'steps') extra = `<p>Answers: ${markItems({ pages:[p] }, {}).map(x => h(x.label === 'gap' ? '' : x.label + ' ') + '<b>' + h([].concat(x.a).join(' or ')) + '</b>').join(' · ') || 'nothing on this page is marked'}</p>${i === 0 && S.b.notes ? S.b.notes.map(x => `<p>${h(x)}</p>`).join('') : ''}`;
    return `<details class="bk-tnote"><summary>For the teacher: this page</summary>${row ? `<p>${row.slice(1).map((c, k) => `<b>${h(r.head[k + 1].replace(/…$/, ''))}:</b> ${h(c)}`).join(' · ')}</p>` : ''}${extra}<p>Nothing on these pages is marked in front of the child. Their answers are read in the Teachers’ area, under View task progress.</p></details>`;
  }
  function render(){
    const box = document.getElementById('bookletBody'); if(!box || !S.b) return;
    const N = S.b.pages.length; S.i = Math.max(0, Math.min(N, S.i));
    document.querySelector('#screen-booklet .screen-title').textContent = S.b.short;
    if(S.i === N){ box.innerHTML = `<div class="bk-page"><div class="bk-band"><h2>All done!</h2></div><div class="fab-say"><span class="fab-char fab" role="img" aria-label="Fab"></span><div class="bubble"><b>Handed in. Brilliant thinking!</b>That is the whole booklet. Your teacher will look at it with you.</div></div>
      <div class="st-row bk-nav"><button type="button" class="btn soft" data-bkgo="${N - 1}">◀ Look back</button><button type="button" class="btn leaf" data-bkstop>${S.teach ? 'Back to the Teachers’ area' : 'Back to my Burrow'}</button></div></div>`; wire(box); return; }
    const p = S.b.pages[S.i];
    box.innerHTML = `<div class="bk-page" data-kind="${p.kind}"><div class="bk-band"><h2>${h(p.t)}</h2></div><p class="bk-strap">${h(p.strap)}</p>
      ${pageHTML(p)}
      ${S.teach ? tnoteHTML(S.i) : ''}
      <div class="st-row bk-nav">${S.i ? `<button type="button" class="btn soft" data-bkgo="${S.i - 1}">◀ Back a page</button>` : ''}<span class="bk-count">Page ${S.i + 1} of ${N}</span><button type="button" class="btn leaf" data-bkgo="${S.i + 1}">${S.i === N - 1 ? 'Hand it in ⭐' : 'Next page ▶'}</button></div>
      <p class="bk-rest"><button type="button" class="btn small soft" data-bkstop>Stop here for today</button> <span>It is fine to stop after any page. Your place is kept${CODE_RE.test(S.code) ? '' : ' only while this page is open'}.</span></p></div>`;
    wire(box);
  }
  function wire(box){
    box.querySelectorAll('input[data-k]').forEach(el => el.addEventListener('input', () => { S.A[el.dataset.k] = el.value.slice(0, 120); save(); }));
    box.querySelectorAll('button[data-k]').forEach(b => b.addEventListener('click', () => { const k = b.dataset.k; S.A[k] = S.A[k] === b.dataset.v && k !== 'lv' ? '' : b.dataset.v; snd('tick'); save(); render(); }));
    box.querySelectorAll('[data-bkgo]').forEach(b => b.addEventListener('click', () => { const to = Number(b.dataset.bkgo), N = S.b.pages.length; S.i = to; save();
      if(to === N){ snd('jingle'); if(!S.teach && CODE_RE.test(S.code)){ S.A.done = Date.now(); save(); try{ FabBurrow.actDone(S.code, 'bk:' + S.b.id); }catch(e){} } } else snd('tick');
      render(); try{ window.scrollTo(0, 0); }catch(e){} }));
    box.querySelectorAll('[data-bkstop]').forEach(b => b.addEventListener('click', () => { save(); snd('tick'); close(); }));
  }
  function close(){ const back = S.back; try{ showScreen(back); }catch(e){} }
  /* open a booklet: for a child from their Burrow (answers kept), or for a teacher to look inside (nothing kept) */
  function open(id, page, opt){
    const b = byId(id); if(!b || !b.app) return false; opt = opt || {}; build();
    S.b = b; S.teach = !!opt.teach; S.code = S.teach ? '' : String(opt.code || ''); S.back = opt.back || 'screen-hub';
    const d = read(b.id, S.code); S.A = S.teach ? {} : d.a;
    S.i = page != null && page !== '' && !isNaN(Number(page)) ? Number(page) - 1 : (d.p >= b.pages.length ? 0 : d.p || 0);
    const bk = document.querySelector('#screen-booklet .btn-back'); if(bk) bk.dataset.go = S.back;
    showScreen('screen-booklet'); render(); return true;
  }

  /* ---------- the teacher's reading of a booklet: assessment for learning ---------- */
  function afl(b, A){
    const quickP = b.pages.find(p => p.kind === 'quick'), hinges = [].concat(...b.pages.filter(p => p.kind === 'hinge').map(p => p.items)), models = b.pages.filter(p => p.kind === 'model');
    const ops = OPK.map(o => { const qs = quickP.items.filter(q => q.op === o), hq = hinges.find(x => x.op === o), mp = models.find(m => m.op === o);
      const easy = right(A['q.' + qs[0].id], qs[0].a), hard = right(A['q.' + qs[1].id], qs[1].a), L = A['h.' + o] || '', hOK = L ? L === hq.ok : null, twin = mp ? right(A['m.' + o], mp.a) : null;
      const ev = [easy, hard, hOK, twin].filter(v => v != null), c1 = Number(A['c1.' + o]) || 0, c8 = Number(A['c8.' + o]) || 0;
      const light = ev.length < 2 ? '' : ev.every(Boolean) ? 'G' : (easy === false && !ev.some(Boolean)) ? 'R' : 'A';
      return { o, c1, c8, easy, hard, L, hOK, why:L ? hq.why['ABCD'.indexOf(L)] : '', twin, hasTwin:!!mp, ev, light }; });
    const steps = new Set();
    ops.forEach(x => { if(x.c1 >= 4 && x.ev.some(v => v === false)) steps.add('over'); if(x.c1 && x.c1 <= 2 && x.ev.length >= 2 && x.ev.every(Boolean)) steps.add('under');
      if(x.easy === true && x.hard === false) steps.add('hard'); if(x.hOK === false) steps.add('hinge'); });
    if(ops[2].easy === false || ops[3].easy === false) steps.add('facts');
    if(ops[0].easy === false && ops[1].easy === false) steps.add('found');
    const lvP = b.pages.find(p => p.kind === 'levels'), lv = A.lv || '', lvQ = lv ? lvP.lv[lv].map((q, i) => right(A['lv.' + lv + '.' + i], q[1])) : [];
    const asnP = b.pages.find(p => p.kind === 'asn'), an = asnP.items.map((q, i) => ({ q:q.q, a:q.a, v:A['asn.' + i] || '', why:A['asn.' + i + '.why'] || '' }));
    const mk = b.pages.find(p => p.kind === 'mistake').items.map(m => ({ head:m.head, v:A[m.id] || '', fix:m.fix }));
    return { ops, steps:NEXT.filter(n => steps.has(n[0])), lv, lvOK:lvQ.filter(v => v === true).length, lvDone:lvQ.filter(v => v != null).length, an, mk, can:A['x.can'] || '', help:A['x.help'] || '' };
  }
  const tick = v => v == null ? '<span class="bk-na">–</span>' : v ? '<b class="bk-yes">✓</b>' : '<b class="bk-no">✗</b>';
  function teacherHTML(code, id){
    const b = byId(id), d = read(id, code); if(!b || !b.app) return '';
    if(!b.afl) return marksHTML(code, b, d);
    const R = afl(b, d.a), LIGHT = { G:'Secure', A:'Developing', R:'Needs support' };
    return `<div class="bk-afl" data-bkafl="${h(id)}"><h3>${ic('books', '📚')} ${h(b.t)} <small>${h(code)}${d.t ? ' · last opened ' + h(new Date(d.t).toLocaleDateString('en-GB', { day:'numeric', month:'short' })) + ' · reached page ' + Math.min(b.pages.length, (d.p || 0) + 1) + ' of ' + b.pages.length : ' · not opened yet'}</small></h3>
      ${marksLine(b, d)}
      <div style="overflow-x:auto"><table class="st-table bk-atable"><thead><tr><th>Operation</th><th>Confidence before</th>${R.ops[0].hasTwin ? '<th>You do (after the model)</th>' : ''}<th>Quick Fire, easier</th><th>Quick Fire, harder</th><th>Hinge letter and what it tells you</th><th>Confidence after</th><th>Draft traffic light</th></tr></thead><tbody>
      ${R.ops.map(x => `<tr><td class="bk-opn">${opDot(x.o)} ${OPS[x.o].n}</td><td>${x.c1 || '–'}</td>${x.hasTwin ? `<td>${tick(x.twin)}</td>` : ''}<td>${tick(x.easy)}</td><td>${tick(x.hard)}</td><td>${x.L ? `<b>${x.L}</b> ${x.hOK ? '<b class="bk-yes">✓</b> ' : ''}${h(x.why)}` : '–'}</td><td>${x.c8 ? x.c8 + (x.c1 ? (x.c8 > x.c1 ? ' ▲' : x.c8 < x.c1 ? ' ▼' : ' =') : '') : '–'}</td><td>${x.light ? `<span class="bk-light ${x.light}">${LIGHT[x.light]}</span>` : '–'}</td></tr>`).join('')}</tbody></table></div>
      <div class="bk-two"><div><b>Spot the Mistake</b> (can they reason, not just calculate?)${R.mk.map(m => `<p>${h(m.head)}: ${m.v ? '“' + h(m.v) + '”' : '<span class="bk-na">nothing written</span>'}<br><small>${h(m.fix)}</small></p>`).join('')}</div>
        <div><b>Choose Your Challenge</b><p>${R.lv ? `Chose <b>${R.lv}</b>: ${R.lvDone ? R.lvOK + ' right of ' + R.lvDone + ' answered.' : 'no answers yet.'}` : '<span class="bk-na">No level chosen yet.</span>'}</p>
        <b>Always, Sometimes, Never</b>${R.an.map(q => `<p>${h(q.q)} ${q.v ? `<b>${q.v}</b> ${q.v === q.a ? '✓' : '(it is ' + q.a + ')'}` : '<span class="bk-na">–</span>'}${q.why ? '<br><small>“' + h(q.why) + '”</small>' : ''}</p>`).join('')}</div></div>
      <p><b>One thing I can do now:</b> ${R.can ? '“' + h(R.can) + '”' : '<span class="bk-na">–</span>'} &nbsp; <b>One thing I’d like help with:</b> ${R.help ? '“' + h(R.help) + '”' : '<span class="bk-na">–</span>'}</p>
      <div class="bk-next"><b>Turning it into next steps</b> (drafts: you know the child)${R.steps.length ? `<ul>${R.steps.map(s => `<li><i>${h(s[1])}.</i> ${h(s[2])}</li>`).join('')}</ul>` : '<p class="bk-na">Nothing flagged yet. More answers will give a clearer picture.</p>'}</div>
      <details class="bk-run"><summary>How to run this booklet</summary><div style="overflow-x:auto"><table class="st-table"><thead><tr>${b.run.head.map(c => `<th>${h(c)}</th>`).join('')}</tr></thead><tbody>${b.run.rows.map(r => `<tr>${r.map(c => `<td>${h(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
        ${b.run.say ? `<p><b>Modelling for a child with low confidence</b></p><ul>${b.run.say.map(r => `<li>${h(r[0])}: ${h(r[1])}</li>`).join('')}</ul>` : ''}</details>
      <p class="hint">The traffic light and next steps are worked out from the answers on this device only, as a starting point for your own judgement. Nothing here is shown to the child.</p></div>`;
  }

  /* ---------- pages made of parts: Watch me, together, my turn (the shape a teacher-made booklet uses most) ---------- */
  function aidHTML(a){
    if(!a) return '';
    if(a.type === 'frame'){ const n = Math.max(0, Math.min(10, Number(a.n) || 0)); let g = '';
      for(let i = 0; i < 10; i++){ const x = 6 + (i % 5) * 44, y = 6 + Math.floor(i / 5) * 44; g += `<rect x="${x}" y="${y}" width="44" height="44" fill="#fff" stroke="#2B1A12" stroke-width="2.5"/>${i < n ? `<circle cx="${x + 22}" cy="${y + 22}" r="15" fill="#E8432D" stroke="#2B1A12" stroke-width="2"/>` : ''}`; }
      return `<svg class="bk-aid frame" viewBox="0 0 232 100" role="img" aria-label="A ten frame with ${n} dots">${g}</svg>`; }
    if(a.type === 'line'){ const f = Number(a.from) || 0, t = Math.max(f + 1, Math.min(f + 30, Number(a.to) || 10)), n = t - f, w = 640, x = v => 20 + (v - f) * (w - 40) / n; let g = `<line x1="14" y1="54" x2="${w - 14}" y2="54" stroke="#2B1A12" stroke-width="3"/>`;
      for(let v = f; v <= t; v++) g += `<line x1="${x(v)}" y1="46" x2="${x(v)}" y2="62" stroke="#2B1A12" stroke-width="2.5"/><text x="${x(v)}" y="82" text-anchor="middle" font-size="${n > 16 ? 15 : 18}" fill="#2B1A12">${v}</text>`;
      const hop = Number(a.hop) || 0, at = Number(a.at);
      for(let k = 0; k < Math.abs(hop) && !isNaN(at); k++){ const v0 = at + Math.sign(hop) * k, v1 = v0 + Math.sign(hop); if(v0 < f || v0 > t || v1 < f || v1 > t) break; g += `<path d="M${x(v0)},44 Q${(x(v0) + x(v1)) / 2},8 ${x(v1)},44" fill="none" stroke="#E8432D" stroke-width="3"/>`; }
      if(!isNaN(at) && at >= f && at <= t) g += `<circle cx="${x(at)}" cy="54" r="8" fill="#FFD483" stroke="#2B1A12" stroke-width="2.5"/>`;
      return `<svg class="bk-aid line" viewBox="0 0 ${w} 92" role="img" aria-label="A number line from ${f} to ${t}">${g}</svg>`; }
    if(a.type === 'pw'){ const c = (cx, cy, v) => `<circle cx="${cx}" cy="${cy}" r="30" fill="#fff" stroke="#2F5458" stroke-width="3.5"/><text x="${cx}" y="${cy + 8}" text-anchor="middle" font-size="24" font-weight="700" fill="#2B1A12">${h(v)}</text>`;
      return `<svg class="bk-aid pw" viewBox="0 0 220 170" role="img" aria-label="A part-whole picture: the whole is ${h(a.w)}, the parts are ${h(a.a)} and ${h(a.b)}"><line x1="110" y1="40" x2="52" y2="128" stroke="#2F5458" stroke-width="3.5"/><line x1="110" y1="40" x2="168" y2="128" stroke="#2F5458" stroke-width="3.5"/>${c(110, 38, a.w)}${c(52, 130, a.a)}${c(168, 130, a.b)}</svg>`; }
    return '';
  }
  const isSum = q => /^[\d.,]+ [+−×÷] [\d.,]+$/.test(q);
  function stepsHTML(p, i){
    let n = 0; const tone = hd => hd === W ? 'w' : hd === G ? 'g' : hd === M ? 'm' : '';
    return (p.parts || []).map(pt => `<div class="bk-card bk-part ${tone(pt.h)}">${pt.h ? `<h3>${h(pt.h)}</h3>` : ''}${pt.say ? `<p class="bk-say">${h(pt.say)}</p>` : ''}${aidHTML(pt.aid)}
      ${pt.seq ? `<div class="bk-seq">${pt.seq.map(x => typeof x === 'string' && x[0] === '_' ? box('p' + i + '.' + (n++), 'A missing number').replace('class="bk-in ', 'class="bk-in gap ') : `<span>${h(x)}</span>`).join('')}</div>` : ''}
      ${(pt.items || []).map(q => { const k = 'p' + i + '.' + (n++);
        if(q.opts) return `<div class="bk-item"><p>${h(q.q)}</p><div class="bk-opts many">${q.opts.map(o => { const on = S.A[k] === String(o); return `<button type="button" class="bk-opt ${on ? 'on' : ''}" data-k="${k}" data-v="${h(o)}" aria-pressed="${on}">${h(o)}</button>`; }).join('')}</div></div>`;
        const numeric = q.a != null && !Array.isArray(q.a) && num(q.a) != null;
        return `<div class="bk-item bk-q"><span class="bk-sum ${numeric ? '' : 'words'}">${h(q.q)}${isSum(q.q) ? ' =' : ''}</span>${box(k, q.q, !numeric)}</div>`; }).join('')}</div>`).join('');
  }

  /* ---------- marking: done when the booklet is handed in or opened by the teacher, never in front of the child ---------- */
  const strandOf = q => q.op && OPS[q.op] ? OPS[q.op].n : (m => m ? { '+':'Adding', '−':'Subtracting', '×':'Multiplying', '÷':'Dividing' }[m[1]] : '')(/^[\d.,]+ ([+−×÷]) [\d.,]+$/.exec(q.q || ''));
  const norm = v => String(v == null ? '' : v).toLowerCase().replace(/[\s,]+/g, ' ').trim();
  const same = (v, a) => [].concat(a).some(x => num(x) != null && num(v) != null ? Math.abs(num(v) - num(x)) < 1e-9 : norm(v) === norm(x));
  function markItems(b, A){
    const out = [], sub = [].concat(b.sub || '')[0] || '';
    b.pages.forEach((p, i) => { const add = (k, label, a, s) => out.push({ i, k, label, a, s:s || '', v:A[k] == null ? '' : String(A[k]) });
      if(p.kind === 'quick') p.items.forEach(q => add('q.' + q.id, q.q, q.a, q.s || strandOf(q)));
      else if(p.kind === 'model') add('m.' + p.op, p.you, p.a, OPS[p.op].n);
      else if(p.kind === 'hinge') p.items.forEach(q => add('h.' + (q.id || q.op), q.q, q.ok, q.s || strandOf(q)));
      else if(p.kind === 'levels'){ const L = A.lv; if(L && p.lv[L]) p.lv[L].forEach((q, n) => add('lv.' + L + '.' + n, q[0], q[1], strandOf({ q:q[0] }))); }
      else if(p.kind === 'asn') p.items.forEach((q, n) => add('asn.' + n, q.q, q.a, 'Reasoning'));
      else if(p.kind === 'steps'){ let n = 0; (p.parts || []).forEach(pt => { (pt.seq || []).forEach(x => { if(typeof x === 'string' && x[0] === '_') add('p' + i + '.' + (n++), 'gap', x.slice(1), pt.s || p.s); });
        (pt.items || []).forEach(q => { const k = 'p' + i + '.' + (n++); if(q.a != null) add(k, q.q, q.a, q.s || pt.s || p.s || strandOf(q)); }); }); } });
    return out.map(it => Object.assign(it, { s:it.s || sub, ok:it.v === '' ? null : same(it.v, it.a) }));
  }
  /* what a child wrote that only a person can read (open questions and choices with no right answer) */
  function openItems(b, A){
    const out = []; b.pages.forEach((p, i) => { if(p.kind !== 'steps') return; let n = 0; (p.parts || []).forEach(pt => { (pt.seq || []).forEach(x => { if(typeof x === 'string' && x[0] === '_') n++; });
      (pt.items || []).forEach(q => { const k = 'p' + i + '.' + (n++); if(q.a == null && A[k]) out.push({ i, label:q.q, v:String(A[k]) }); }); }); });
    return out;
  }
  function mark(b, A){
    const items = markItems(b, A), strands = {}, pages = {};
    items.forEach(it => { const S1 = strands[it.s] = strands[it.s] || { got:0, tried:0, of:0 }, P = pages[it.i] = pages[it.i] || { got:0, tried:0, of:0 };
      [S1, P].forEach(x => { x.of++; if(it.ok != null) x.tried++; if(it.ok) x.got++; }); });
    return { items, strands, pages, of:items.length, tried:items.filter(x => x.ok != null).length, got:items.filter(x => x.ok).length };
  }
  const BANDS = { G:'Secure', A:'Developing', R:'Needs support' };
  const band = x => x.tried < 2 ? '' : x.got / x.tried >= .8 ? 'G' : x.got / x.tried >= .5 ? 'A' : 'R';
  const when = t => new Date(t).toLocaleDateString('en-GB', { day:'numeric', month:'short' });
  function marksLine(b, d){ const m = mark(b, d.a); return `<p class="bk-marks"><b>Marks: ${m.got} of ${m.tried} answered</b> (${m.of} questions are marked by the app) · ${d.a.done ? 'handed in ' + h(when(d.a.done)) : 'not handed in yet'}</p>`; }
  function marksHTML(code, b, d){
    const m = mark(b, d.a), open = openItems(b, d.a);
    return `<div class="bk-afl" data-bkafl="${h(b.id)}"><h3>${ic('books', '📚')} ${h(b.t)} <small>${h(code)}${d.t ? ' · last opened ' + h(when(d.t)) + ' · reached page ' + Math.min(b.pages.length, (d.p || 0) + 1) + ' of ' + b.pages.length : ' · not opened yet'}</small></h3>
      ${marksLine(b, d)}
      <div style="overflow-x:auto"><table class="st-table bk-atable"><thead><tr><th>Page</th><th>Marks</th><th>Answers (the child’s answer, then the right one where it differs)</th></tr></thead><tbody>
      ${b.pages.map((p, i) => { const P = m.pages[i], its = m.items.filter(x => x.i === i); return P ? `<tr><td>${i + 1}. ${h(p.t)}</td><td>${P.got} of ${P.tried}${P.tried < P.of ? ' <small>(' + (P.of - P.tried) + ' left)</small>' : ''}</td><td>${its.filter(x => x.ok != null).map(x => `<span class="bk-ans">${x.label === 'gap' ? '' : h(x.label) + ': '}<b>${h(x.v)}</b> ${x.ok ? '<b class="bk-yes">✓</b>' : '<b class="bk-no">✗</b> <small>(' + h([].concat(x.a).join(' or ')) + ')</small>'}</span>`).join(' ') || '<span class="bk-na">–</span>'}</td></tr>` : ''; }).join('')}</tbody></table></div>
      ${open.length ? `<div class="bk-next"><b>In the child’s own words and choices</b> (for you to read)<ul>${open.map(o => `<li>${h(o.label)} <b>${h(o.v)}</b></li>`).join('')}</ul></div>` : ''}
      <p class="hint">Marks are worked out on this device from the answers kept in this viewer. Nothing here is shown to the child.</p></div>`;
  }
  /* an assessment profile for one Fab code: every booklet on this device, strand by strand, with a draft next step */
  const NEXTFOR = { Adding:'maths-flightpath-addition-subtraction', Subtracting:'maths-flightpath-addition-subtraction', Multiplying:'maths-flightpath-multiplication-division', Dividing:'maths-flightpath-multiplication-division',
    Counting:'maths-flightpath-place-value', 'Number bonds to 10':'maths-flightpath-addition-subtraction', 'Counting on':'maths-flightpath-addition-subtraction', 'Counting back':'maths-flightpath-addition-subtraction', 'Part-whole':'maths-flightpath-addition-subtraction', 'Counting up':'maths-flightpath-addition-subtraction' };
  function profile(code){
    const rows = {}, books = [];
    known(code).forEach(x => { const m = mark(x.b, x.d.a), sub = [].concat(x.b.sub || '')[0] || 'Other';
      books.push({ id:x.b.id, t:x.b.short || x.b.t, got:m.got, tried:m.tried, of:m.of, done:x.d.a.done || 0, last:x.d.t });
      Object.keys(m.strands).forEach(s => { const key = sub + '|' + s, r = rows[key] = rows[key] || { sub, s, got:0, tried:0, of:0, from:[], harder:'' }; const v = m.strands[s];
        r.got += v.got; r.tried += v.tried; r.of += v.of; if(v.tried) r.from.push(x.b.short || x.b.t); if(x.b.harder && byId(x.b.harder)) r.harder = x.b.harder; }); });
    const list = Object.keys(rows).map(k => { const r = rows[k], bd = band(r), fp = NEXTFOR[r.s] || '', next = [];
      if(bd === 'R'){ if(fp) next.push({ k:'p:' + fp, l:'Support: the flightpath, from an earlier step' }); if(/^(Adding|Subtracting)$/.test(r.s)) next.push({ k:'b:L:number-toolkit', l:'Support: My Number Toolkit' }); }
      else if(bd === 'A'){ if(fp) next.push({ k:'p:' + fp, l:'Practice: the flightpath' }); }
      else if(bd === 'G'){ if(r.harder) next.push({ k:'b:L:' + r.harder, l:'Challenge: ' + byId(r.harder).short }); else if(fp) next.push({ k:'p:' + fp, l:'Challenge: the flightpath, from a later step' }); }
      return Object.assign(r, { band:bd, bandName:BANDS[bd] || 'Not enough yet', next }); });
    return { code, rows:list, books };
  }

  /* ---------- booklets made by teachers with Claude: checked here before they are kept ---------- */
  const IMPORT_KINDS = ['conf', 'exit', 'quick', 'hinge', 'levels', 'asn', 'steps', 'text'];
  const calc = q => { const m = /^([\d.,]+) ([+−×÷]) ([\d.,]+)$/.exec(String(q || '')); if(!m) return null; const a = Number(m[1].replace(/,/g, '')), b = Number(m[3].replace(/,/g, '')); return Math.round((m[2] === '+' ? a + b : m[2] === '−' ? a - b : m[2] === '×' ? a * b : a / b) * 1000) / 1000; };
  function check(d){
    const E = [], str = (v, n) => typeof v === 'string' && v.trim().length > 0 && v.length <= n, arr = v => Array.isArray(v) ? v : [];
    if(!d || typeof d !== 'object' || Array.isArray(d)) return { ok:false, errors:['This is not a booklet file. It should start with { and have a title and pages.'] };
    if(!str(d.t, 80)) E.push('The booklet needs a title ("t"), up to 80 letters.');
    if(!Array.isArray(d.pages) || !d.pages.length || d.pages.length > 24) E.push('The booklet needs between 1 and 24 pages.');
    let big = 0; try{ big = JSON.stringify(d).length; }catch(e){ big = 1e9; } if(big > 40000) E.push('The booklet is too big to keep. Split it into two shorter booklets.');
    const sum = (q, a, where) => { const c = calc(q); if(c != null && num(a) != null && Math.abs(c - num(a)) > 1e-9) E.push(`${where}: “${q}” is ${c}, not ${a}.`); };
    arr(d.pages).forEach((p, i) => { const at = 'Page ' + (i + 1);
      if(!p || typeof p !== 'object'){ E.push(at + ' is empty.'); return; }
      if(!IMPORT_KINDS.includes(p.kind)){ E.push(`${at}: the kind “${String(p.kind).slice(0, 20)}” is not one the app knows. Use ${IMPORT_KINDS.join(', ')}.`); return; }
      if(!str(p.t, 60)) E.push(at + ' needs a title ("t"), up to 60 letters.');
      if(p.kind === 'conf' || p.kind === 'exit'){ p.k = p.kind === 'conf' ? 'c1' : 'c8'; }
      if(p.kind === 'quick'){ if(!arr(p.items).length || p.items.length > 12) E.push(at + ' needs 1 to 12 questions.'); arr(p.items).forEach((q, n) => { if(!q || !str(q.q, 60) || num(q.a) == null) E.push(`${at}, question ${n + 1} needs words ("q") and a number answer ("a").`); else { q.id = 'ABCDEFGHIJKL'[n]; q.a = num(q.a); if(q.op && !OPS[q.op]) delete q.op; sum(q.q, q.a, at); } }); }
      if(p.kind === 'hinge'){ if(!arr(p.items).length || p.items.length > 4) E.push(at + ' needs 1 to 4 questions.'); arr(p.items).forEach((q, n) => { const o = arr(q && q.opts).map(String), ok = 'ABCD'.indexOf(q && q.ok);
        if(!q || !str(q.q, 120) || o.length < 2 || o.length > 4 || ok < 0 || ok >= o.length) E.push(`${at}, question ${n + 1} needs words, 2 to 4 options and the right letter ("ok").`); else { q.opts = o; q.id = 'i' + i + 'n' + n; if(q.op && !OPS[q.op]) delete q.op; q.why = o.map((x, k) => k === ok ? 'Correct' : String(arr(q.why)[k] || 'Not yet right').slice(0, 120)); const c = calc(q.q); if(c != null && num(o[ok]) != null && Math.abs(c - num(o[ok])) > 1e-9) E.push(`${at}: “${q.q}” is ${c}, but option ${q.ok} says ${o[ok]}.`); } }); }
      if(p.kind === 'levels'){ const L = p.lv && typeof p.lv === 'object' ? Object.keys(p.lv) : []; if(L.length < 2 || L.length > 3) E.push(at + ' needs two or three levels.'); L.forEach(k => { if(!/^[A-Za-z ]{1,12}$/.test(k) || !arr(p.lv[k]).length || p.lv[k].length > 6) E.push(`${at}: the level “${k}” needs a short name and 1 to 6 questions.`); arr(p.lv[k]).forEach(q => { if(!Array.isArray(q) || !str(q[0], 60) || num(q[1]) == null) E.push(`${at}, level ${k}: each question is ["words", number].`); else { q[1] = num(q[1]); sum(q[0], q[1], at); } }); }); }
      if(p.kind === 'asn'){ if(!arr(p.items).length || p.items.length > 6) E.push(at + ' needs 1 to 6 statements.'); arr(p.items).forEach((q, n) => { if(!q || !str(q.q, 140) || !['always', 'sometimes', 'never'].includes(q.a)) E.push(`${at}, statement ${n + 1} needs words and an answer: always, sometimes or never.`); }); }
      if(p.kind === 'text'){ if(!arr(p.body).length || !arr(p.body).every(x => str(x, 900))) E.push(at + ' needs one or more paragraphs ("body").'); p.words = arr(p.words).filter(w => Array.isArray(w) && str(w[0], 40) && str(w[1], 120)).slice(0, 14); }
      if(p.kind === 'steps'){ if(!arr(p.parts).length || p.parts.length > 8) E.push(at + ' needs 1 to 8 parts.'); arr(p.parts).forEach((pt, n) => { const w = `${at}, part ${n + 1}`;
        if(!pt || typeof pt !== 'object'){ E.push(w + ' is empty.'); return; }
        ['h', 'say', 's'].forEach(f => { if(pt[f] != null && !str(pt[f], f === 'say' ? 400 : 40)) E.push(`${w}: “${f}” is too long or empty.`); });
        if(pt.aid != null && !(pt.aid && ['frame', 'line', 'pw'].includes(pt.aid.type))) E.push(w + ': a picture ("aid") is a frame, a line or pw.');
        if(pt.seq != null && !(Array.isArray(pt.seq) && pt.seq.length <= 24 && pt.seq.every(x => typeof x === 'number' || /^_-?[\d.]+$/.test(x)))) E.push(w + ': a sequence is numbers, with "_7" for a gap whose answer is 7.');
        arr(pt.items).forEach((q, k) => { if(!q || !str(q.q, 140)){ E.push(`${w}, question ${k + 1} needs words ("q").`); return; }
          if(q.opts != null){ q.opts = arr(q.opts).map(String).slice(0, 6); if(q.opts.length < 2) E.push(`${w}, question ${k + 1}: choices need at least two options.`); else if(q.a != null && !q.opts.includes(String(q.a))) E.push(`${w}, question ${k + 1}: the answer must be one of the options.`); }
          if(q.a != null && !Array.isArray(q.a)) sum(q.q, q.a, w); });
        if(arr(pt.items).length > 10) E.push(w + ' has more than 10 questions.'); }); } });
    return { ok:!E.length, errors:E.slice(0, 12) };
  }
  const STK = ['eyfs', 'ks1', 'lks2', 'uks2'], SUBS = ['Maths', 'English', 'Phonics', 'Science', 'Topic'];
  function add(d){
    let v; try{ v = JSON.parse(JSON.stringify(d)); }catch(e){ return { ok:false, errors:['This file could not be read.'] }; }
    const c = check(v); if(!c.ok) return c;
    const t = String(v.t).replace(/[<>]/g, '').trim(), id = 't-' + (t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'booklet');
    if(LIB.some(b => b.id === id)) return { ok:false, errors:['A booklet with that name is already built into the app.'] };
    const def = { id, t, short:t.slice(0, 42), sub:SUBS.includes(v.sub) ? v.sub : '', st:(Array.isArray(v.st) ? v.st : []).filter(x => STK.includes(x)), app:true, mine:true, time:String(v.time || '').slice(0, 40), about:String(v.about || 'A booklet made by a BMF teacher.').slice(0, 400), care:String(v.care || '').slice(0, 200), notes:(Array.isArray(v.notes) ? v.notes : []).filter(x => typeof x === 'string').map(x => x.slice(0, 400)).slice(0, 8), pages:v.pages };
    const L = mine().filter(b => b.id !== id); L.push(def); ls.set(DK, L.slice(-20)); return { ok:true, id, def };
  }
  function remove(id){ ls.set(DK, mine().filter(b => b.id !== id)); }
  /* a teacher-made booklet is not on the app's site, so it travels to the child after the # in their link (never sent to any server) */
  const enc = o => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const dec = s0 => { try{ let x = String(s0).replace(/-/g, '+').replace(/_/g, '/'); while(x.length % 4) x += '='; return JSON.parse(decodeURIComponent(escape(atob(x)))); }catch(e){ return null; } };
  function hashFor(id){ const b = mine().find(x => x.id === id); return b ? '#bk=' + enc({ t:b.t, sub:b.sub, st:b.st, time:b.time, about:b.about, care:b.care, notes:b.notes, pages:b.pages }) : ''; }
  function fromHash(){ try{ const m = /[#&]bk=([A-Za-z0-9_-]+)/.exec(location.hash || ''); if(!m) return; const d = dec(m[1]); if(d) add(d); history.replaceState(null, '', location.pathname + location.search); }catch(e){} }
  /* what a teacher gives Claude (in the Teaching Studio) to get a booklet file back */
  const BRIEF = `Please write a BMF booklet as a JSON file for the Fab App.

Who it is for: [year group or class], [subject], [the gap or goal]. Describe the group only, never a child.

BMF rules: wellbeing first; short pages a tired child can finish; British English; no timers or scores in the wording; start with early success; every sum checked.

The file is one JSON object:
{ "t": "Title", "sub": "Maths | English | Phonics | Science | Topic", "st": ["eyfs" | "ks1" | "lks2" | "uks2"], "time": "About 20 minutes", "about": "One or two sentences for the teacher", "notes": ["How to run it", "What to look for"], "pages": [ ... up to 12 pages ... ] }

Page kinds (each page has "kind", "t" (title) and "strap" (one line for the child)):
- "conf": How confident do you feel? (first page). "exit": the same again plus two sentences (last page).
- "steps": { "s": "strand name, e.g. Fractions", "parts": [ { "h": "Watch me", "say": "the model, step by step" }, { "h": "Let’s do it together", "say": "...", "items": [ { "q": "6 + 4", "a": 10 } ] }, { "h": "My turn", "items": [ { "q": "7 + 2", "a": 9 }, { "q": "Which is a noun?", "a": "fox", "opts": ["ran", "fox", "quickly"] }, { "q": "Tell me how you know." } ] } ] }
  A part may also have "seq": [20, 17, 14, "_11", "_8"] (a gap is "_answer") or "aid": { "type": "line", "from": 0, "to": 10, "at": 5, "hop": 3 } | { "type": "frame", "n": 7 } | { "type": "pw", "w": 10, "a": 7, "b": "?" }.
  A question with "a" is marked by the app; with no "a" it is for the teacher to read. "a" may be a list of accepted answers.
- "quick": { "items": [ { "q": "46 + 23", "a": 69 } ] } up to 12 quick questions with number answers.
- "hinge": { "items": [ { "q": "358 + 167", "opts": ["415", "525", "425", "625"], "ok": "B", "why": ["No carrying at all", "Correct", "Carried to tens, not hundreds", "Carried too much"] } ] } each wrong option stands for one misconception.
- "levels": { "lv": { "Mild": [["34 + 25", 59]], "Spicy": [["368 + 145", 513]], "Hot": [["2,476 + 1,385", 3861]] } } the child chooses.
- "asn": { "items": [ { "q": "Multiplying makes a number bigger.", "a": "sometimes", "why": "not × 1 or × 0" } ] } always, sometimes or never.
- "text": { "body": ["A paragraph to read."], "words": [["bleak", "cold, grey and miserable"]] } for reading; public-domain texts only.

Write sums with spaces and these signs: + − × ÷. Give me the JSON only, in a code block, so I can save it as a .json file.`;

  /* ---------- the screen ---------- */
  function build(){
    if(document.getElementById('screen-booklet')) return true;
    const hub = document.getElementById('screen-hub'); if(!hub) return false;
    hub.parentNode.insertAdjacentHTML('beforeend', `<section id="screen-booklet" class="screen" aria-label="Booklet"><div class="screen-top"><button class="btn-back" data-go="screen-hub">← Back</button><h1 class="screen-title">Booklet</h1></div><div id="bookletBody"></div></section>`);
    const st = document.createElement('style'); st.textContent = `
.bk-page{max-width:900px;margin:0 auto;text-align:left}
.bk-band{background:#2F5458;border-radius:16px;padding:10px 18px;text-align:center}.bk-band h2{margin:0;color:#fff;font-size:1.7rem}
.bk-strap{text-align:center;margin:10px 0 14px;font-size:1.1rem}
.bk-card{background:#fff;border:3px solid #2F5458;border-radius:16px;padding:14px 16px;margin:0 0 14px}.bk-card h3{margin:0 0 8px;color:#2F5458;display:flex;align-items:center;gap:8px}
.bk-grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.bk-grid2 .bk-card{margin:0}
@media (max-width:640px){.bk-grid2,.bk-watch{grid-template-columns:1fr !important}}
.bk-op{display:inline-grid;place-items:center;width:1.7em;height:1.7em;flex:none;border-radius:50%;color:#fff;font-weight:700}
.bk-q{display:flex;flex-wrap:wrap;align-items:center;gap:10px}.bk-letter{font-size:1.2rem;color:#2F5458}.bk-sum{font-size:1.35rem;font-variant-numeric:tabular-nums;margin:0}
.bk-in{font:inherit;font-size:1.3rem;width:6.2em;border:2.5px solid #2F5458;border-radius:10px;padding:6px 10px;background:#FFFDF6;box-sizing:border-box}.bk-in.wide{width:100%;font-size:1.05rem}
.bk-lines{display:grid;gap:10px}.bk-lines label,label.bk-lines{display:grid;gap:4px}.bk-lines span{font-weight:700;color:#2F5458}
.bk-conf{width:100%;border-collapse:collapse}.bk-conf th{font-weight:700;font-size:.9rem;padding:6px 4px;text-align:center}.bk-conf tbody th{text-align:left;font-size:1.1rem;white-space:nowrap}
.bk-conf td{text-align:center;padding:5px 2px}
.bk-num{font:inherit;font-size:1.2rem;width:2.4em;height:2.4em;border-radius:50%;border:2.5px solid #2F5458;background:#fff;cursor:pointer}.bk-num.on{background:#2F5458;color:#fff;box-shadow:0 0 0 3px #FFD483}
.bk-opts{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}.bk-opts.three{grid-template-columns:repeat(3,1fr);margin:4px 0 8px}
.bk-opt{font:inherit;font-size:1.15rem;text-align:left;border:2.5px solid #2F5458;border-radius:12px;background:#fff;padding:8px 12px;cursor:pointer}.bk-opts.three .bk-opt{text-align:center}
.bk-opt.on{background:#2F5458;color:#fff;box-shadow:0 0 0 3px #FFD483}.bk-opt b{margin-right:8px}
.bk-col{border-collapse:collapse;margin:4px 0 10px;font-size:1.45rem;font-variant-numeric:tabular-nums}.bk-col td{width:1.5em;height:1.5em;text-align:center;border:1px solid #D7E3E1;padding:0}
.bk-col tr.rule td{height:0;border:0;border-top:3px solid #2B1A12}.bk-col tr.ans td{color:#3F7D3A;font-weight:700}.bk-col tr.bad td,.bk-wrong b{color:#D8402B}
.bk-col tr.small td{font-size:.6em;color:#D8402B;height:1.6em}.bk-col tr.strike td{text-decoration:line-through;text-decoration-color:#D8402B}.bk-col tr.strike td:first-child{text-decoration:none}
.bk-col tr.bus td{border-top:3px solid #2B1A12}.bk-col tr.bus td:first-child{border-top:1px solid #D7E3E1;border-right:3px solid #2B1A12}.bk-col sup{font-size:.5em;color:#D8402B;margin-right:1px}
.bk-wrong p{font-size:1.5rem;margin:6px 0}
.bk-watch{display:grid;grid-template-columns:2fr 1fr;gap:14px}.bk-watch .bk-card{margin:0}.bk-ido{display:flex;flex-wrap:wrap;gap:8px 18px;align-items:flex-start}.bk-ido ol{flex:1 1 240px;margin:0;padding-left:1.3em;display:grid;gap:6px}
.bk-you{background:#FFF1D6}
.bk-levels{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-bottom:12px}
.bk-lv{font:inherit;font-size:1.3rem;font-weight:700;border:3px solid #2B1A12;border-radius:14px;padding:10px 26px;cursor:pointer;background:#DDF0CF}.bk-lv.spicy{background:#FFD483}.bk-lv.hot{background:#F6B6A6}.bk-lv.on{box-shadow:0 4px 0 #2B1A12;transform:translateY(-2px)}
.bk-lvq{display:grid;gap:12px}.bk-soft{opacity:.85;font-style:italic;margin:6px 0;text-align:center}.bk-you .bk-soft{text-align:left}
.bk-asnrow{border-bottom:1px dashed #C9D9D6;padding:8px 0}.bk-asnrow:last-child{border:0}.bk-asnrow p{margin:0;font-size:1.15rem}
.bk-nav{justify-content:center;align-items:center;margin-top:16px}.bk-count{font-weight:700;padding:0 8px}
.bk-rest{text-align:center;margin:12px 0 0;font-size:.95rem}
.bk-tnote,.bk-run{background:#EAF3F1;border:2px dashed #2F5458;border-radius:12px;padding:8px 12px;margin:12px 0}.bk-tnote summary,.bk-run summary{cursor:pointer;font-weight:700}
.bk-afl{border:3px solid #2F5458;border-radius:16px;background:#fff;padding:12px 14px;margin:10px 0;text-align:left}.bk-afl h3{margin:0 0 8px;color:#2F5458;display:flex;flex-wrap:wrap;align-items:center;gap:8px}.bk-afl h3 svg{width:1.3em;height:1.3em}.bk-afl h3 small{font-weight:400;color:#4A2A18}
.bk-atable td{vertical-align:middle}.bk-opn{white-space:nowrap}.bk-atable .bk-op{font-size:.85em}.bk-yes{color:#3F7D3A}.bk-no{color:#D8402B}.bk-na{opacity:.6}
.bk-light{border:2px solid #2B1A12;border-radius:999px;padding:1px 10px;font-weight:700;white-space:nowrap}.bk-light.G{background:#BFE3A8}.bk-light.A{background:#FFD483}.bk-light.R{background:#F6B6A6}
.bk-two{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:6px 22px;margin:10px 0}.bk-two p{margin:4px 0}

.bk-part h3{display:inline-block;background:#DDF0CF;border:2px solid #2F5458;border-radius:999px;padding:1px 14px;font-size:1rem}.bk-part.w h3{background:#CFE7F2}.bk-part.g h3{background:#FFE7B0}
.bk-say{font-size:1.15rem;margin:6px 0 8px}.bk-aid{display:block;max-width:100%;margin:6px 0 10px}.bk-aid.frame{width:232px}.bk-aid.line{width:640px}.bk-aid.pw{width:200px}
.bk-seq{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:6px 0 10px}.bk-seq span{display:grid;place-items:center;min-width:2.3em;height:2.3em;border:2px solid #C9D9D6;border-radius:8px;background:#F4F8F7;font-size:1.2rem;font-variant-numeric:tabular-nums}
.bk-in.gap{width:2.9em;padding:4px 4px;text-align:center;font-size:1.2rem;height:2.3em}
.bk-item{margin:8px 0}.bk-item p{margin:0 0 4px;font-size:1.15rem}.bk-sum.words{font-size:1.15rem;flex:1 1 100%}.bk-opts.many{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}.bk-opts.many .bk-opt{text-align:center}
.bk-text p{font-size:1.2rem;line-height:1.55;margin:0 0 10px}.bk-words{display:grid;gap:4px;background:#EAF3F1;border-radius:12px;padding:8px 12px}.bk-words span i{font-weight:700;font-style:normal;margin-right:6px}
.bk-marks{margin:4px 0 8px}.bk-ans{display:inline-block;margin:0 10px 2px 0;white-space:nowrap}
.bk-next{background:#FFF6E6;border:2px solid #E3C9A0;border-radius:12px;padding:8px 12px}.bk-next ul{margin:6px 0 0;padding-left:1.2em}`;
    document.head.appendChild(st); return true;
  }
  fromHash();
  window.FabBooklets = { all, byId, act, open, read, known, codes, afl, teacherHTML, state:S, render, mark, profile, check, add, remove, mine, hashFor, brief:BRIEF, bands:BANDS };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
