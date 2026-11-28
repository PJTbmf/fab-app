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
  /* ---------- A Christmas Carol, Year 3/4 (Adventurers): sessions 1 and 2 of a 12-session unit. Patrick, 28 Nov: "imagine having a
     group of Y3/4s ... around 12 English sessions a half term ... a booklet on A Christmas Carol". The text is Dickens's own (1843, out
     of copyright), cut down but not rewritten. Kept gentle: these two sessions use only the description of Scrooge and the scene in the
     counting-house. Marley's death, the ghosts and Tiny Tim's illness come later in the unit and are flagged in the outline. ---------- */
  const CC_ROWS = ['Reading an old story', 'Finding answers in the text', 'Describing a character'];
  const CC_LOW = 'Tired? One sentence is plenty. Or say it aloud and your teacher will write it for you.';
  const CAROL = { id:'christmas-carol-y34', t:'A Christmas Carol: Meet Scrooge (sessions 1 and 2)', short:'A Christmas Carol: Meet Scrooge', sub:'English', st:['lks2'], app:true, time:'Two English sessions of about 25 minutes',
    about:'The first two of twelve sessions on A Christmas Carol for Year 3/4. Each session has a warm start, a short piece of Dickens’s own words with a word bank, questions at three levels that the child chooses, a short piece of writing with starters and a checklist, and a clear place to stop. The 12-session outline is in the teacher notes.',
    care:'These two sessions stay with Scrooge and his nephew. The famous opening line about Marley is left out of the child’s text. Later sessions meet ghosts, a lonely childhood and Tiny Tim’s illness: the outline flags each one and gives a gentler path.',
    notes:['Session 1 is pages 1 to 5 and session 2 is pages 6 to 10. Each session ends on a page that says it is a good place to stop.', 'Read the text aloud first (I do), read it again together (we do), then let each child choose their questions (you do). “Read it to me” reads the page for a child working alone.', 'The three question levels are Find it (facts in the text), Think about it (working things out) and Dig deeper (why Dickens wrote it that way). Any level is a good choice; children can change level.', 'Writing is never marked by the app. You read it under View task progress, with the checklist the child ticked.'],
    run:{ head:['Page', 'What it is', 'What to look for'], rows:[
      ['1', 'Confidence before', 'A child who marks 1 or 2 for reading an old story: read every extract aloud to them'],
      ['2', 'Old words before we read', 'Counting-house, clerk and humbug are needed for both sessions'],
      ['3', 'Read: Scrooge', 'Can they tell what Scrooge looks like (Find it) from what he is like (Think about it)?'],
      ['4', 'Write: describe Scrooge', 'One sentence is success. Look for a describing word lifted from Dickens'],
      ['5', 'What do we know so far?', 'End of session 1. The prediction is a guess: every answer is welcome'],
      ['6', 'Remember Scrooge?', 'A warm, easy start to session 2. Good for a child who missed session 1: read page 3 together first'],
      ['7', 'Read: in the counting-house', 'Do they see that Scrooge will not spend money even on coal?'],
      ['8', 'Say it like Scrooge', 'Reading aloud in two voices. A tired child can listen and choose'],
      ['9', 'Write: what is Scrooge thinking?', 'Does the thought sound like Scrooge? This is early inference of a character’s thoughts'],
      ['10', 'Confidence after', 'End of session 2. Compare with page 1'] ] },
    unit:{ head:['Session', 'What happens', 'Reading or writing focus (National Curriculum, Year 3/4: please check the wording)', 'A piece to keep', 'With care'], rows:[
      ['1', 'Meet Scrooge: Dickens’s description', 'Drawing inferences about characters; discussing words and phrases that capture the reader’s interest', 'Two or three sentences describing Scrooge', 'Opening line about Marley left out'],
      ['2', 'The counting-house: “Bah! Humbug!”', 'Inferring characters’ feelings, thoughts and motives from their actions; reading aloud with intonation', 'What Scrooge is thinking', '–'],
      ['3', 'The two gentlemen, and Bob Cratchit asks for Christmas Day', 'Justifying inferences with evidence', '“Scrooge at the start”: a character profile', 'Leave out Scrooge’s line about the “surplus population”'],
      ['4', 'A visit from Marley: a warning from an old friend', 'Predicting what might happen from details stated and implied', 'A prediction, and a paper chain of kind links (Studio: Kindness chain)', 'A ghost, and a friend who has died. Tell it as a warning given out of friendship; keep the chains, drop the wailing phantoms'],
      ['5', 'Christmas Past: young Scrooge, and Fezziwig’s party', 'Identifying main ideas and summarising', 'Three sentences: what Scrooge sees and how he feels', 'A boy left alone at school at Christmas may feel close to home. Move quickly to Fezziwig’s party'],
      ['6', 'Writing: Fezziwig’s party', 'Creating settings; expanded noun phrases; fronted adverbials', 'A setting description using the senses', '–'],
      ['7', 'Christmas Present: the Cratchits’ dinner', 'Inferring feelings; comparing characters', 'Same but different: Scrooge’s Christmas and the Cratchits’', 'Tiny Tim is unwell and uses a crutch. Tell the children early that Dickens says Tiny Tim “did NOT die”. Leave out Scrooge’s question about whether he will live'],
      ['8', 'Writing: talk at the Cratchits’ table', 'Using and punctuating direct speech with inverted commas', 'Four lines of conversation', '–'],
      ['9', 'Christmas Yet to Come: a future nobody wants', 'Predicting; discussing how a character feels', 'Scrooge’s promise, in one sentence', 'This part has a death in the family and a gravestone. Gentler path: you tell it in two sentences (“The last spirit shows Scrooge a sad future. He begs for the chance to change”) and go straight to the morning'],
      ['10', 'Christmas morning: Scrooge changes', 'Identifying how language contributes to meaning; evidence for how a character has changed', 'Then and now: a two-column chart of Scrooge', '–'],
      ['11', 'Outcome piece: plan and draft', 'Discussing similar writing; composing and rehearsing sentences orally; organising paragraphs around a theme', 'Choose one: Scrooge’s diary for Christmas morning; a letter to his nephew; or a before-and-after poster with captions (the low-energy choice)', '–'],
      ['12', 'Finish, check and share', 'Proofreading; assessing their own writing; reading their writing aloud', 'The finished outcome piece, read or shown to the group', 'Sharing is a choice. A child can ask you to read theirs'] ],
      note:'Twelve sessions is about two a week for a half term. A child who misses sessions still has a finished piece from every session they attend, and sessions 1, 2, 7 and 10 on their own tell the whole story. Only sessions 1 and 2 are built as pages so far.' },
    pages:[
      { kind:'conf', k:'c1', t:'How confident do you feel?', strap:'There are no wrong answers. Tap a number for each line.', rows:CC_ROWS },
      { kind:'steps', t:'Old words before we read', strap:'This story is nearly 200 years old, so some of its words are old too.', s:'Vocabulary', parts:[
        { h:W, say:'This story is called A Christmas Carol. Charles Dickens wrote it in 1843, in Victorian times. It is set in London, in a cold winter. Let’s meet three old words first.' },
        { h:G, say:'Choose what each word means.', items:[
          { q:'A counting-house is…', opts:['an office where money is counted', 'a house with lots of rooms', 'a shop that sells clocks'], a:'an office where money is counted' },
          { q:'A clerk is…', opts:['a kind of coat', 'someone who writes and keeps records in an office', 'a cold wind'], a:'someone who writes and keeps records in an office' },
          { q:'“Humbug!” means…', opts:['Nonsense!', 'Hooray!', 'Hello!'], a:'Nonsense!' } ] } ] },
      { kind:'read', t:'Read: Scrooge', strap:'Listen first, then read it together. What kind of man is Scrooge?', src:'From A Christmas Carol by Charles Dickens, 1843 (made shorter).',
        body:['Oh! But he was a tight-fisted hand at the grindstone, Scrooge! A squeezing, wrenching, grasping, scraping, clutching, covetous old sinner!', 'Hard and sharp as flint, secret, and self-contained, and solitary as an oyster.', 'The cold within him froze his old features, nipped his pointed nose, shrivelled his cheek, made his eyes red, his thin lips blue.', 'He carried his own low temperature always about with him, and didn’t thaw it one degree at Christmas.', 'Nobody ever stopped him in the street to say, with gladsome looks, “My dear Scrooge, how are you?”'],
        words:[['tight-fisted', 'mean with money'], ['covetous', 'always wanting more'], ['flint', 'a very hard stone'], ['solitary', 'alone'], ['shrivelled', 'dried up and wrinkled'], ['thaw', 'warm up and melt'], ['gladsome', 'cheerful']],
        lv:{ 'Find it':[ { q:'What colour were Scrooge’s thin lips?', opts:['red', 'blue', 'white'], a:'blue', s:'Reading: finding facts' }, { q:'Which creature is Scrooge compared to?', opts:['an oyster', 'a fox', 'a robin'], a:'an oyster', s:'Reading: finding facts' }, { q:'Did people stop Scrooge in the street to say hello?', opts:['Yes', 'No'], a:'No', s:'Reading: finding facts' } ],
          'Think about it':[ { q:'“Tight-fisted” tells us that Scrooge…', opts:['does not like to share his money', 'has strong hands', 'likes to fight'], a:'does not like to share his money', s:'Reading: working things out' }, { q:'Why does nobody stop to talk to Scrooge?', opts:['He is cold and unfriendly to people', 'He walks too fast', 'Nobody knows him'], a:'He is cold and unfriendly to people', s:'Reading: working things out' }, { q:'Which word tells us Scrooge likes to be alone?', opts:['solitary', 'gladsome', 'thaw'], a:'solitary', s:'Reading: working things out' } ],
          'Dig deeper':[ { q:'Dickens says the cold is “within” Scrooge. What is cold about him?', opts:['His feelings towards other people', 'His dinner', 'Only his house'], a:'His feelings towards other people', s:'Reading: the writer’s choices' }, { q:'Why do you think Dickens chose an oyster? Tell me your idea.' }, { q:'Which describing word is your favourite, and why?' } ] } },
      { kind:'write', t:'Write: describe Scrooge', strap:'Now you are the writer. A sentence is enough to begin.', task:'Write two or three sentences to describe Scrooge. What does he look like? What is he like inside?',
        model:['Scrooge is a cold, mean old man. His nose is pointed and his thin lips are blue. He is as solitary as an oyster because he does not want any friends.'],
        stems:['Scrooge is', 'He looks', 'His face is', 'He is as solitary as', 'Nobody talks to him because'], bank:['mean', 'cold', 'grumpy', 'solitary', 'tight-fisted', 'pointed nose', 'thin lips', 'unfriendly'],
        sc:['I wrote about how Scrooge looks', 'I wrote about what Scrooge is like', 'I used a word from the word bank', 'I checked my capital letters and full stops'], low:CC_LOW },
      { kind:'steps', t:'What do we know so far?', strap:'This is the end of session 1. A good place to stop.', s:'Reading: working things out', fin:'If you finish: open the Make More FAB Studio and draw Scrooge with his pointed nose and thin blue lips.', parts:[
        { h:M, say:'Two quick things, then you are done for today.', items:[ { q:'Which word best describes Scrooge so far?', opts:['kind', 'mean', 'jolly'], a:'mean' }, { q:'What do you think might happen to Scrooge? It is only a guess, so any idea is a good one.' } ] } ] },
      { kind:'steps', t:'Remember Scrooge?', strap:'Welcome back. Let’s warm up with what we already know.', s:'Remembering', parts:[
        { h:G, say:'Last time we met Scrooge. What do you remember?', items:[ { q:'Scrooge was as solitary as an…', opts:['oyster', 'owl', 'otter'], a:'oyster' }, { q:'Who wrote A Christmas Carol?', opts:['Charles Dickens', 'Queen Victoria', 'Fab Fox'], a:'Charles Dickens' }, { q:'Tell me one thing you remember about Scrooge.' } ] } ] },
      { kind:'read', t:'Read: in the counting-house', strap:'It is Christmas Eve. Listen for two very different voices.', src:'From A Christmas Carol by Charles Dickens, 1843 (made shorter).',
        body:['Once upon a time, of all the good days in the year, on Christmas Eve, old Scrooge sat busy in his counting-house. It was cold, bleak, biting weather.', 'The door of Scrooge’s counting-house was open that he might keep his eye upon his clerk, who in a dismal little cell beyond was copying letters. Scrooge had a very small fire, but the clerk’s fire was so very much smaller that it looked like one coal.', '“A merry Christmas, uncle!” cried a cheerful voice. It was the voice of Scrooge’s nephew.', '“Bah!” said Scrooge. “Humbug!”', '“Christmas a humbug, uncle!” said Scrooge’s nephew. “You don’t mean that, I am sure?”', '“I do,” said Scrooge. “Merry Christmas! What right have you to be merry? You’re poor enough.”', '“Come, then,” returned the nephew gaily. “What right have you to be dismal? You’re rich enough.”', '“Don’t be angry, uncle. Come! Dine with us to-morrow.”', '“Good afternoon,” said Scrooge.'],
        words:[['bleak', 'cold and miserable'], ['dismal', 'gloomy and sad'], ['cell', 'a tiny room'], ['nephew', 'the son of your brother or sister'], ['gaily', 'cheerfully'], ['dine', 'eat dinner']],
        lv:{ 'Find it':[ { q:'What day is it in the story?', opts:['Christmas Eve', 'Christmas Day', 'New Year’s Day'], a:'Christmas Eve', s:'Reading: finding facts' }, { q:'Who comes to visit Scrooge?', opts:['his nephew', 'his clerk', 'a robin'], a:'his nephew', s:'Reading: finding facts' }, { q:'What does Scrooge say about Christmas?', opts:['“Bah! Humbug!”', '“A merry Christmas!”', '“Dine with us!”'], a:'“Bah! Humbug!”', s:'Reading: finding facts' } ],
          'Think about it':[ { q:'The clerk’s fire looks like one coal. What does that tell us about Scrooge?', opts:['He will not spend money to keep his clerk warm', 'He likes small fires', 'He has run out of coal'], a:'He will not spend money to keep his clerk warm', s:'Reading: working things out' }, { q:'How does the nephew feel about Christmas?', opts:['He loves it', 'He does not like it', 'He has forgotten it'], a:'He loves it', s:'Reading: working things out' }, { q:'Scrooge says “Good afternoon.” What does he really mean?', opts:['Please go away', 'Please stay for tea', 'What a lovely day'], a:'Please go away', s:'Reading: working things out' } ],
          'Dig deeper':[ { q:'The nephew is poor but merry. Scrooge is rich but dismal. What is Dickens showing us?', opts:['Money does not make you happy', 'Rich people are always sad', 'Poor people are always happy'], a:'Money does not make you happy', s:'Reading: the writer’s choices' }, { q:'Why does Scrooge keep his door open? What does that tell you about him?' }, { q:'If you were the nephew, what would you say to Scrooge next?' } ] } },
      { kind:'steps', t:'Say it like Scrooge', strap:'Scrooge is low and grumpy. His nephew is bright and cheerful.', s:'Reading aloud', parts:[
        { h:W, say:'Listen to how your teacher reads Scrooge, low and grumpy, and then the nephew, bright and cheerful.' },
        { h:G, say:'Read each line aloud in the right voice. Then choose who said it. Tired? Listen, and just choose.', items:[ { q:'“What right have you to be merry?”', opts:['Scrooge', 'The nephew'], a:'Scrooge' }, { q:'“Don’t be angry, uncle. Come! Dine with us to-morrow.”', opts:['Scrooge', 'The nephew'], a:'The nephew' }, { q:'“Bah! Humbug!”', opts:['Scrooge', 'The nephew'], a:'Scrooge' } ] } ] },
      { kind:'write', t:'Write: what is Scrooge thinking?', strap:'Step inside Scrooge’s head for a moment.', task:'The nephew has just said “A merry Christmas, uncle!” Write what Scrooge might be thinking.',
        model:['“Christmas again!” thinks Scrooge. “Everybody wants a day off and a big dinner. What a waste of money! I wish they would all leave me alone with my work.”'],
        stems:['Scrooge thinks', '“Humbug!” thinks Scrooge.', 'He wishes', 'He does not like Christmas because'], bank:['humbug', 'waste of money', 'leave me alone', 'dismal', 'cross', 'nephew', 'work', 'cold'],
        sc:['I wrote what Scrooge is thinking', 'It sounds like grumpy Scrooge', 'I used a word from the word bank', 'I checked my capital letters and full stops'], low:CC_LOW },
      { kind:'exit', k:'c8', t:'How do you feel now?', strap:'This is the end of session 2. Tap a number for each line, then tell me two things.', rows:CC_ROWS, fin:'If you finish: write the nephew’s reply to Scrooge’s “Good afternoon.” What would he say?' }
    ] };
  /* ---------- A Christmas Carol, sessions 3 and 4: the two gentlemen, Bob Cratchit's Christmas Eve, and Marley's warning. Dickens's own
     words, cut down. With care: Scrooge's line about the "surplus population" is left out; Marley is met as an old friend with a warning,
     and the wailing phantoms at the window are left out. ---------- */
  const CAROL2 = { id:'christmas-carol-2-y34', t:'A Christmas Carol: Christmas Eve and Marley’s warning (sessions 3 and 4)', short:'A Christmas Carol: Marley’s warning', sub:'English', st:['lks2'], app:true, time:'Two English sessions of about 25 minutes',
    about:'Sessions 3 and 4 of the twelve. Session 3: two gentlemen ask Scrooge to give to the poor, and Bob Cratchit asks for Christmas Day; the piece to keep is a character profile of Scrooge. Session 4: Jacob Marley’s warning and his chain; the piece to keep is a prediction.',
    care:'Session 4 meets a ghost: Marley, Scrooge’s old business partner, who has died. The child’s page calls him a ghost who comes with a warning out of friendship, and leaves out the wailing phantoms. You may prefer to tell this part yourself in two sentences and go straight to the questions.',
    notes:['Session 3 is pages 1 to 5 and session 4 is pages 6 to 10.', 'A child who missed sessions 1 and 2 can start here: page 1 is a short recap of Scrooge.'],
    run:{ head:['Page', 'What it is', 'What to look for'], rows:[
      ['1', 'Remember Scrooge?', 'A warm, easy start. Good for a child who missed sessions 1 and 2'],
      ['2', 'Read: the two gentlemen', 'Do they see that Scrooge chooses to give nothing?'],
      ['3', 'Read: Bob’s Christmas Eve', 'Can they compare Bob and Scrooge using a detail from each?'],
      ['4', 'Write: Scrooge at the start', 'The character profile is the piece to keep. Three facts with evidence is success'],
      ['5', 'Before next time', 'End of session 3'],
      ['6', 'Old words', 'Knocker, ledger and forged are needed for the extract'],
      ['7', 'Read: Marley’s warning', 'Do they understand why the chain is made of cash-boxes and purses?'],
      ['8', 'Think about the chain', 'Early inference about a symbol. Every reasonable answer is welcome'],
      ['9', 'Write: what will happen?', 'The prediction is the piece to keep. Any idea that fits the story is a good one'],
      ['10', 'How do you feel now?', 'End of session 4. Compare with session 2’s answers'] ] },
    pages:[
      { kind:'steps', t:'Remember Scrooge?', strap:'Welcome back. Let’s warm up with what we know.', s:'Remembering', parts:[
        { h:G, say:'Scrooge is a mean old man who works in a counting-house in London. On Christmas Eve his nephew wished him a merry Christmas, and Scrooge said “Bah! Humbug!”', items:[
          { q:'What did Scrooge say about Christmas?', opts:['“Bah! Humbug!”', '“Hooray!”', '“Let’s have a party!”'], a:'“Bah! Humbug!”' },
          { q:'Scrooge’s clerk had a fire so small it looked like…', opts:['one coal', 'a bonfire', 'a candle'], a:'one coal' } ] } ] },
      { kind:'read', t:'Read: the two gentlemen', strap:'Two kind gentlemen are collecting money for people who are poor. What will Scrooge give?', src:'From A Christmas Carol by Charles Dickens, 1843 (made shorter).',
        body:['“At this festive season of the year, Mr. Scrooge,” said the gentleman, taking up a pen, “it is more than usually desirable that we should make some slight provision for the Poor and destitute, who suffer greatly at the present time.”', '“What shall I put you down for?”', '“Nothing!” Scrooge replied.', '“You wish to be anonymous?”', '“I wish to be left alone,” said Scrooge.'],
        words:[['festive', 'happy and full of celebration'], ['provision', 'help, such as food and warm things'], ['destitute', 'with no money or home'], ['anonymous', 'not giving your name']],
        lv:{ 'Find it':[ { q:'What are the gentlemen collecting for?', opts:['the poor', 'a new office', 'a party'], a:'the poor', s:'Reading: finding facts' }, { q:'How much does Scrooge give?', opts:['nothing', 'a little', 'a lot'], a:'nothing', s:'Reading: finding facts' } ],
          'Think about it':[ { q:'Scrooge says “I wish to be left alone.” How does he feel?', opts:['annoyed', 'excited', 'sleepy'], a:'annoyed', s:'Reading: working things out' }, { q:'What does this tell us about Scrooge?', opts:['He does not care about people who are poor', 'He has no money', 'He is very kind'], a:'He does not care about people who are poor', s:'Reading: working things out' } ],
          'Dig deeper':[ { q:'Why do you think Dickens put this scene at Christmas time?' }, { q:'What would you say to Scrooge if you were one of the gentlemen?' } ] } },
      { kind:'read', t:'Read: Bob’s Christmas Eve', strap:'Bob Cratchit is Scrooge’s clerk. Listen for how different he is.', src:'From A Christmas Carol by Charles Dickens, 1843 (made shorter).',
        body:['“You’ll want all day to-morrow, I suppose?” said Scrooge.', '“If quite convenient, sir.”', '“It’s not convenient,” said Scrooge, “and it’s not fair. But I suppose you must have the whole day. Be here all the earlier next morning.”', 'The clerk promised that he would; and Scrooge walked out with a growl.', 'The clerk, with the long ends of his white comforter dangling below his waist (for he boasted no great-coat), went down a slide twenty times, in honour of its being Christmas Eve, and then ran home to Camden Town as hard as he could pelt, to play at blindman’s-buff.'],
        words:[['convenient', 'easy for you, causing no trouble'], ['comforter', 'a long woolly scarf'], ['pelt', 'run very fast'], ['blindman’s-buff', 'a game where one person wears a blindfold and tries to catch the others']],
        lv:{ 'Find it':[ { q:'What does Bob ask for?', opts:['Christmas Day off', 'more coal', 'a new coat'], a:'Christmas Day off', s:'Reading: finding facts' }, { q:'What game does Bob run home to play?', opts:['blindman’s-buff', 'hide and seek', 'football'], a:'blindman’s-buff', s:'Reading: finding facts' } ],
          'Think about it':[ { q:'Bob has no great-coat. What does that tell us?', opts:['He does not have much money', 'He likes the cold', 'He lost it'], a:'He does not have much money', s:'Reading: working things out' }, { q:'Bob goes down a slide twenty times. How does he feel about Christmas?', opts:['happy and excited', 'grumpy', 'worried'], a:'happy and excited', s:'Reading: working things out' } ],
          'Dig deeper':[ { q:'Bob is poor but joyful. Scrooge is rich but grumpy. Why do you think Dickens shows us both?' }, { q:'Find one word that shows Scrooge is cross. Why did you choose it?' } ] } },
      { kind:'write', t:'Write: Scrooge at the start', strap:'A character profile tells the reader what someone is like, with evidence.', task:'Write three facts about Scrooge. For each one, say how you know.',
        model:['Scrooge is mean. I know because he gives nothing to the poor.', 'Scrooge is unfriendly. I know because he tells the gentlemen to leave him alone.'],
        stems:['Scrooge is', 'I know because', 'He does not', 'This shows that'], bank:['mean', 'grumpy', 'unfriendly', 'selfish', 'cold', 'gives nothing', 'growl', 'left alone'],
        sc:['I wrote three facts about Scrooge', 'I said how I know for each one', 'I used “because”', 'I checked my capital letters and full stops'], low:'Tired? One fact and how you know is plenty. Or say it and your teacher will write it.' },
      { kind:'steps', t:'Before next time', strap:'This is the end of session 3. A good place to stop.', s:'Reading: working things out', parts:[
        { h:M, items:[ { q:'Who is kinder?', opts:['Bob Cratchit', 'Scrooge'], a:'Bob Cratchit' }, { q:'Next time, Scrooge has a surprise visitor. Who do you think it might be?' } ] } ], fin:'If you finish: open the Make More FAB Studio and draw Bob sliding home in his long white scarf.' },
      { kind:'steps', t:'Old words', strap:'Three old words to know before we read.', s:'Vocabulary', parts:[
        { h:W, say:'Tonight Scrooge goes home alone. Something strange happens at his front door.' },
        { h:G, say:'Choose what each word means.', items:[
          { q:'A door knocker is…', opts:['a metal handle you bang to knock on a door', 'a person who knocks things over', 'a kind of bell'], a:'a metal handle you bang to knock on a door' },
          { q:'A ledger is…', opts:['a book where money is written down', 'a ladder', 'a coat'], a:'a book where money is written down' },
          { q:'Forged means…', opts:['made by hammering metal', 'forgotten', 'found'], a:'made by hammering metal' } ] } ] },
      { kind:'read', t:'Read: Marley’s warning', strap:'Scrooge’s old business partner, Jacob Marley, comes back as a ghost with a warning.', src:'From A Christmas Carol by Charles Dickens, 1843 (made shorter).',
        body:['Scrooge, having his key in the lock of the door, saw in the knocker Marley’s face. It had a dismal light about it, like a bad lobster in a dark cellar.', 'Later that night, the ghost of Marley came in. The chain he drew was clasped about his middle. It was long, and wound about him like a tail; and it was made of cash-boxes, keys, padlocks, ledgers, deeds, and heavy purses wrought in steel.', '“I wear the chain I forged in life,” replied the Ghost. “I made it link by link, and yard by yard.”', '“I am here to-night to warn you, that you have yet a chance and hope of escaping my fate. A chance and hope of my procuring, Ebenezer.”', '“You will be haunted,” resumed the Ghost, “by Three Spirits.”'],
        words:[['dismal', 'gloomy'], ['cash-box', 'a metal box for keeping money'], ['wrought', 'made, shaped'], ['fate', 'what will happen to you'], ['procuring', 'getting something for someone'], ['Ebenezer', 'Scrooge’s first name']],
        lv:{ 'Find it':[ { q:'Where does Scrooge first see Marley’s face?', opts:['in the door knocker', 'in the window', 'in a mirror'], a:'in the door knocker', s:'Reading: finding facts' }, { q:'How many spirits will visit Scrooge?', opts:['three', 'one', 'ten'], a:'three', s:'Reading: finding facts' } ],
          'Think about it':[ { q:'Marley says Scrooge has “a chance and hope”. A chance to do what?', opts:['to change and be kinder', 'to earn more money', 'to move house'], a:'to change and be kinder', s:'Reading: working things out' }, { q:'Is Marley trying to help Scrooge or frighten him?', opts:['help him', 'frighten him'], a:'help him', s:'Reading: working things out' } ],
          'Dig deeper':[ { q:'Dickens compares the face to “a bad lobster in a dark cellar”. What picture does that put in your head?' }, { q:'Why do you think Marley came back to warn his old friend?' } ] } },
      { kind:'steps', t:'Think about the chain', strap:'Marley’s chain is made of things. What do they tell us?', s:'Reading: the writer’s choices', parts:[
        { h:W, say:'Marley’s chain is made of cash-boxes, keys, padlocks, ledgers and purses. These are all things to do with money. Marley says he made the chain himself, link by link, while he was alive.' },
        { h:G, items:[ { q:'All the things on the chain are about…', opts:['money', 'food', 'toys'], a:'money' }, { q:'What do you think each link stands for?', opts:['a time he chose money over people', 'a present he gave', 'a friend he made'], a:'a time he chose money over people' } ] },
        { h:M, items:[ { q:'If Scrooge does not change, what might happen to his chain? Tell me your idea.' } ] } ] },
      { kind:'write', t:'Write: what will happen?', strap:'Make a prediction. Any idea that fits the story is a good one.', task:'Three spirits are coming. Write what you think will happen, and why.',
        model:['I think the spirits will show Scrooge how unkind he has been, because Marley wants him to change before it is too late.'],
        stems:['I think', 'because', 'The spirits might', 'Maybe Scrooge will'], bank:['spirits', 'change', 'kinder', 'warning', 'chain', 'Christmas', 'chance', 'hope'],
        sc:['I wrote what I think will happen', 'I gave a reason with “because”', 'I used a word from the word bank', 'I checked my capital letters and full stops'], low:'Tired? One sentence is plenty. Or say it and your teacher will write it.' },
      { kind:'exit', k:'c8', t:'How do you feel now?', strap:'This is the end of session 4. Tap a number for each line, then tell me two things.', rows:CC_ROWS }
    ] };
  /* catch-up notes to sit beside each session's recording, and a short note for the child's own school (no child's details: the
     teacher sends it with their own cover note) */
  CAROL.catchup = [
    ['Session 1: Meet Scrooge', 'We met Ebenezer Scrooge, a mean, cold old man in Victorian London, from Charles Dickens’s own description. We learned three old words (counting-house, clerk, humbug) and wrote sentences describing Scrooge.', 'Watch the first part of the recording, read page 3 of the booklet with “Read it to me”, then write one sentence: “Scrooge is…”.'],
    ['Session 2: The counting-house', 'On Christmas Eve, Scrooge’s nephew wished him a merry Christmas and Scrooge said “Bah! Humbug!”. We read it in two voices and wrote what Scrooge might be thinking.', 'Read page 7 with “Read it to me”, then try the “Say it like Scrooge” page.'],
    ['Session 3: Two gentlemen and Bob Cratchit', 'Scrooge gave nothing to two gentlemen collecting for the poor, then grudgingly gave Bob Cratchit Christmas Day off. Bob ran home happily. We wrote a character profile of Scrooge with evidence.', 'Read the two short extracts, then write one fact about Scrooge and how you know.'],
    ['Session 4: Marley’s warning', 'Scrooge’s old business partner, Jacob Marley, came back as a ghost wearing a chain made of cash-boxes and purses, to warn Scrooge to change. Three spirits will visit. We wrote predictions.', 'Read the extract (or ask a grown-up to tell this part), then write one prediction with “because”.']
  ];
  CAROL.school = 'This half term in English our Year 3/4 group is reading A Christmas Carol by Charles Dickens, in short extracts of Dickens’s own words. The unit covers drawing inferences about characters’ feelings and motives, justifying them with evidence from the text, predicting, discussing words and phrases that capture the reader’s interest, and reading aloud with intonation. In writing, children are describing a character, writing a character’s thoughts, a character profile and a prediction, working towards a longer outcome piece (a diary, a letter or a before-and-after poster). Sessions are short and recorded, with three levels of questions so each child can work at a level that suits them.';
  CAROL2.unit = CAROL.unit; CAROL2.catchup = CAROL.catchup; CAROL2.school = CAROL.school;

  /* ---------- Victorian Schools (Adventurers): the teacher's two-page history sheet, rebuilt as pages in the app ---------- */
  const VSCHOOL = { id:'victorian-schools-app', t:'Victorian Schools: what was it like to go to school? (in the app)', short:'Victorian Schools', sub:'Topic', st:['lks2'], app:true, time:'About 25 minutes',
    about:'History, two parts. A starter ranking six things from a Victorian school day, who went to school and when, then classroom facts with a same-or-different chart and sentences at three levels. Goes with the Victorians Explorer World, which has a same-but-different chart of a school day.',
    notes:['The ranking has no right answer: it is for talk. “Talk about it” on page 2 is for you to lead.', 'The sentences at three levels are open: you read them under View task progress.'],
    pages:[
      { kind:'rank', t:'A Victorian school day', strap:'Tap them in order: the one you would enjoy least first, the one you would enjoy most last.', items:[['Slate writing', 'Copying letters and words with chalk on a small slate board.'], ['Washing clothes', 'Girls learned to wash clothes, while boys did woodwork or drawing.'], ['Nature drawing', 'Carefully drawing leaves, flowers and other things from nature.'], ['Arithmetic', 'Counting with an abacus and chanting times tables out loud.'], ['Drill', 'Strict exercises, standing in neat rows and moving all together.'], ['Poems and prayers', 'Learning poems and prayers off by heart, word for word.']] },
      { kind:'read', t:'Who went to school?', strap:'Read how it changed during Queen Victoria’s time.', body:['Early Victorian times: only children from richer families could afford school. Many poor children worked instead.', 'Middle Victorian times: new laws helped more children learn. Ragged Schools were set up for poorer children.', '1880: a new law said all children aged 5 to 10 had to go to school.'],
        lv:{ 'Find it':[ { q:'In 1880, who had to go to school?', opts:['all children aged 5 to 10', 'only rich children', 'only boys'], a:'all children aged 5 to 10', s:'History: finding facts' } ], 'Think about it':[ { q:'Why did many poor children not go to school in early Victorian times?', opts:['They had to work', 'They did not like school', 'There were no teachers'], a:'They had to work', s:'History: working things out' } ], 'Dig deeper':[ { q:'Talk about it: is anything here surprising? Which part would you find hardest?' } ] } },
      { kind:'write', t:'In the Classroom: same or different?', strap:'Read the facts, then write or draw one thing in each box.', task:'Classes were big, sometimes more than 50 children. Children sat in long rows facing the teacher, practised writing on slates, and learned reading, writing and arithmetic. Teachers were very strict. Now write one thing in each box.', boxes:['Victorian school', 'Both', 'My school'], low:'Tired? Fill in just one box.' },
      { kind:'read', t:'Finish the sentences', strap:'Choose your challenge. Every level is a good choice.', body:['Boys and girls were often taught some things separately. Teachers were very strict, and children had to sit still and stay quiet.'],
        lv:{ 'Mild':[ { q:'One lesson Victorian children had was…' }, { q:'Classrooms were different because…' } ], 'Spicy':[ { q:'One lesson Victorian children had was…' }, { q:'Classrooms were different because…' }, { q:'Boys and girls did some things separately, such as…' } ], 'Hot':[ { q:'Would you rather go to a Victorian school or your school? Give two reasons using the facts.' } ] } }
    ] };
  const LIB = [Y34, Y56, CAROL, CAROL2, VSCHOOL,
    TOOLKIT,
    board('year4-challenge', 'Year 4 Challenge Booklet: maths and English', ['Maths', 'English'], ['lks2'], ['Page 2: Number Detective', 'Page 3: Multiplication Masters', 'Page 4: Fraction & Decimal Challenge', 'Page 5: Shape Investigator', 'Page 6: Logic Lab', 'Page 7: Dickens’ Foggy Street (reading)', 'Page 8: Reading Detective', 'Page 9: Grammar Workshop', 'Page 10: Writer’s Challenge'],
      'Every page starts with a Quick start, then a Challenge and a Stretch. Each box is a natural stopping point, and the maths ends with a planned break. Stretch boxes go beyond Year 4.'),
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
  const S = { b:null, i:0, code:'', back:'screen-hub', teach:false, A:{}, lv:'', pad:{}, padOpen:false, part:0 };
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
  /* ---------- "How confident do you feel?" asks about what the booklet is about (it used to ask every booklet about the four operations) ---------- */
  const ENG_ROWS = ['Reading the text', 'Answering questions about it', 'Writing my own sentences'];
  function confRows(p, b){
    b = b || S.b || {};
    if(Array.isArray(p.rows) && p.rows.length) return p.rows.slice(0, 6).map((t, n) => ({ k:p.k + '.r' + n, n:String(t), dot:'' }));
    const sub = [].concat(b.sub || '')[0] || '';
    if(b.afl || sub === 'Maths') return OPK.map(o => ({ k:p.k + '.' + o, n:OPS[o].n, dot:opDot(o) }));
    return (sub === 'English' ? ENG_ROWS : ['The work in this booklet']).map((t, n) => ({ k:p.k + '.r' + n, n:t, dot:'' }));
  }
  function confHTML(p){
    return `<div class="bk-card"><table class="bk-conf"><thead><tr><th></th>${SCALE.map(s => `<th>${s}</th>`).join('')}</tr></thead><tbody>${confRows(p).map(r => `<tr><th>${r.dot} ${h(r.n)}</th>${SCALE.map((s, i) => { const k = r.k, on = String(S.A[k]) === String(i + 1);
      return `<td><button type="button" class="bk-num ${on ? 'on' : ''}" data-k="${h(k)}" data-v="${i + 1}" aria-pressed="${on}" aria-label="${h(r.n)}: ${i + 1}, ${s}">${i + 1}</button></td>`; }).join('')}</tr>`).join('')}</tbody></table></div>
      ${p.kind === 'exit' ? `<div class="bk-card bk-lines"><label><span>One thing I can do now:</span>${box('x.can', 'One thing I can do now', true)}</label><label><span>One thing I’d like help with:</span>${box('x.help', 'One thing I would like help with', true)}</label></div>` : ''}`;
  }
  /* ---------- read it to me: Miss Bell's recording if there is one for these words, otherwise the device's voice. Tap again to stop. ---------- */
  let saying = '';
  function sayStop(){ try{ window.speechSynthesis && speechSynthesis.cancel(); }catch(e){} try{ window.FabVoice && FabVoice.bellStop(); }catch(e){} saying = ''; }
  const sayBtn = text => text && window.fabReadAloud ? `<button type="button" class="btn small soft bk-sayb" data-bksay="${h(text)}">${saying === text ? '⏹ Stop reading' : '🔊 Read it to me'}</button>` : '';
  /* one question: choices to tap, a number box, or a line to write on */
  function itemHTML(q, k){
    if(q.opts) return `<div class="bk-item"><p>${h(q.q)}</p><div class="bk-opts many">${q.opts.map(o => { const on = S.A[k] === String(o); return `<button type="button" class="bk-opt ${on ? 'on' : ''}" data-k="${h(k)}" data-v="${h(o)}" aria-pressed="${on}">${h(o)}</button>`; }).join('')}</div></div>`;
    const numeric = q.a != null && !Array.isArray(q.a) && num(q.a) != null;
    return `<div class="bk-item bk-q"><span class="bk-sum ${numeric ? '' : 'words'}">${h(q.q)}${isSum(q.q) ? ' =' : ''}</span>${box(k, q.q, !numeric)}</div>`;
  }
  const wordsHTML = p => (p.words || []).length ? `<div class="bk-words"><b>Word bank</b>${p.words.map(w => `<span><i>${h(w[0])}</i> ${h(w[1])}</span>`).join('')}</div>` : '';
  /* ---------- a reading page: a short text, a word bank, then questions at up to three levels. The child chooses the level. ---------- */
  function readHTML(p, i){
    const L = Object.keys(p.lv || {}), lk = 'r' + i + '.lv', cur = S.A[lk] || '';
    return `<div class="bk-card bk-text bk-read bk-seg">${sayBtn((p.body || []).join(' '))}${(p.body || []).map(x => `<p>${h(x)}</p>`).join('')}${p.src ? `<p class="bk-src">${h(p.src)}</p>` : ''}${wordsHTML(p)}</div>
      ${L.length ? `<div class="bk-seg"><p class="bk-soft bk-pick">Now choose your questions. Every level is a good choice.</p><div class="bk-levels">${L.map((k, n) => `<button type="button" class="bk-lv ${['mild', 'spicy', 'hot'][n] || ''} ${cur === k ? 'on' : ''}" data-k="${h(lk)}" data-v="${h(k)}" aria-pressed="${cur === k}">${h(k)}</button>`).join('')}</div>
        ${cur && p.lv[cur] ? `<div class="bk-card bk-lvq bk-rq">${p.lv[cur].map((q, n) => itemHTML(q, 'r' + i + '.' + cur + '.' + n)).join('')}</div><p class="bk-soft">Want a change? Tap another level at any time.</p>` : ''}</div>` : ''}`;
  }
  /* ---------- a writing page: a model to read first, the task, sentence starters and a word bank to tap in, a box to write in, and a
     checklist the child ticks for themselves. The writing is never marked by the app: the teacher reads it. ---------- */
  function writeHTML(p, i){
    const k = 'w' + i;
    return `${(p.model || []).length ? `<div class="bk-card bk-part w bk-seg"><h3>Read mine first</h3>${sayBtn(p.model.join(' '))}${p.model.map(x => `<p class="bk-model">${h(x)}</p>`).join('')}</div>` : ''}
      <div class="bk-card bk-part m bk-write bk-seg"><h3>${M}</h3><p class="bk-say">${h(p.task)}</p>
        ${(p.stems || []).length ? `<div class="bk-chips" role="group" aria-label="Sentence starters"><b>Sentence starters</b>${p.stems.map(s => `<button type="button" class="bk-chip" data-bkins="${h(s)}" data-for="bkW${i}">${h(s)}</button>`).join('')}</div>` : ''}
        ${(p.bank || []).length ? `<div class="bk-chips bank" role="group" aria-label="Word bank"><b>Word bank</b>${p.bank.map(s => `<button type="button" class="bk-chip" data-bkins="${h(s)}" data-for="bkW${i}">${h(s)}</button>`).join('')}</div>` : ''}
        ${(p.boxes || []).length ? `<div class="bk-boxes">${p.boxes.map((bx, n) => `<label><span>${h(bx)}</span><textarea class="bk-ta small" data-kt="${k}.b${n}" rows="4" maxlength="300">${h(S.A[k + '.b' + n] || '')}</textarea></label>`).join('')}</div>`
          : `<label class="sr-only" for="bkW${i}">My writing</label><textarea id="bkW${i}" class="bk-ta" data-kt="${k}.text" rows="5" maxlength="700" placeholder="Write here. One sentence is enough to begin.">${h(S.A[k + '.text'] || '')}</textarea>`}
        ${p.low ? `<p class="bk-soft">🌱 ${h(p.low)}</p>` : ''}</div>
      ${(p.sc || []).length ? `<div class="bk-card bk-sc bk-seg"><h3>Check my writing</h3><p class="bk-soft">Tick what you did. This is just for you and your teacher.</p>${p.sc.map((s, n) => { const kk = k + '.sc' + n, on = S.A[kk] === '1';
        return `<button type="button" class="bk-opt bk-tickb ${on ? 'on' : ''}" data-k="${kk}" data-v="1" aria-pressed="${on}"><b>${on ? '✓' : '○'}</b> ${h(s)}</button>`; }).join('')}</div>` : ''}`;
  }
  /* ---------- a ranking with no right answer: tap the cards in order; tap one again to take it out ---------- */
  const rankOf = i => String(S.A['k' + i] || '').split(',').filter(x => x !== '').map(Number);
  function rankHTML(p, i){
    const R = rankOf(i);
    return `<div class="bk-rank">${p.items.map((it, n) => { const at = R.indexOf(n); return `<button type="button" class="bk-rankc ${at >= 0 ? 'on' : ''}" data-bkrank="${n}" aria-pressed="${at >= 0}"><span class="bk-rankn">${at >= 0 ? at + 1 : ''}</span><b>${h(it[0])}</b><small>${h(it[1])}</small></button>`; }).join('')}</div>
      <p class="bk-soft">${R.length === p.items.length ? 'All in order. There is no right answer: be ready to say why.' : R.length ? 'Keep going. Tap a card again to take it out.' : 'Tap the one you would enjoy least first.'}</p>`;
  }
  /* ---------- a space to work things out, beside the questions (maths pages). It is for the child and the teacher to see while the
     booklet is open; it is not kept afterwards. ---------- */
  const wantsPad = p => ['quick', 'hinge', 'levels', 'model', 'steps', 'mistake'].includes(p.kind) && [].concat((S.b && S.b.sub) || '')[0] === 'Maths';
  const padHTML = () => `<details class="bk-pad" id="bkPadBox" ${S.padOpen ? 'open' : ''}><summary>✏️ Working out</summary><canvas id="bkPad" width="1000" height="320" aria-label="A space to work things out. Draw with a finger, a pen or the mouse."></canvas>
    <div class="st-row"><button type="button" class="btn small soft" id="bkPadClear">Rub it all out</button><span class="bk-soft">For you and your teacher to see. It is not kept when you close the booklet.</span></div></details>`;
  function padWire(box){
    const dt = box.querySelector('#bkPadBox'), cv = box.querySelector('#bkPad'); if(!dt || !cv) return;
    dt.addEventListener('toggle', () => { S.padOpen = dt.open; });
    const ctx = cv.getContext('2d'); ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#2B1A12';
    const keep = S.pad[S.i]; if(keep){ const im = new Image(); im.onload = () => { try{ ctx.drawImage(im, 0, 0); }catch(e){} }; im.src = keep; }
    let down = false; const at = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; };
    cv.addEventListener('pointerdown', e => { down = true; try{ cv.setPointerCapture(e.pointerId); }catch(err){} const [x, y] = at(e); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + .1, y + .1); ctx.stroke(); e.preventDefault(); });
    cv.addEventListener('pointermove', e => { if(!down) return; const [x, y] = at(e); ctx.lineTo(x, y); ctx.stroke(); });
    const up = () => { if(!down) return; down = false; try{ S.pad[S.i] = cv.toDataURL('image/png'); }catch(e){} };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); cv.addEventListener('pointerleave', up);
    box.querySelector('#bkPadClear').addEventListener('click', () => { ctx.clearRect(0, 0, cv.width, cv.height); delete S.pad[S.i]; snd('tick'); });
  }
  /* catch-up notes to sit beside the recordings, and a short note for the child's own school */
  function notesHTML(b){
    if(!b || (!b.catchup && !b.school)) return '';
    return `${b.catchup ? `<details class="bk-run bk-catch"><summary>Catch-up notes: one per session, to sit beside the recording</summary><div class="bk-printme" id="bkCatch-${h(b.id)}"><h3>${h(b.short)}: catch-up notes</h3>${b.catchup.map(c => `<div class="bk-cnote"><b>${h(c[0])}</b><p>${h(c[1])}</p><p><i>To catch up:</i> ${h(c[2])}</p></div>`).join('')}<p class="bk-soft">Sessions are recorded and kept for 90 days.</p></div>
      <div class="st-row"><button type="button" class="btn small soft" data-bkprint="bkCatch-${h(b.id)}">🖨️ Print the catch-up notes</button></div></details>` : ''}
      ${b.school ? `<details class="bk-run bk-school"><summary>A short note for the child’s own school</summary><p class="bk-schooltxt">${h(b.school)}</p><div class="st-row"><button type="button" class="btn small soft" data-bkcopy="${h(b.school)}">Copy the note</button></div><p class="hint">It names no child. Add your own cover note when you send it.</p></details>` : ''}`;
  }
  /* print one part of the page, or copy a note (wired wherever these notes appear) */
  function notesWire(root){
    (root || document).querySelectorAll('[data-bkprint]').forEach(b => { if(b._bk) return; b._bk = 1; b.addEventListener('click', () => { const el = document.getElementById(b.dataset.bkprint); if(!el) return;
      el.classList.add('bk-print-on'); document.body.classList.add('bk-printing'); const done = () => { el.classList.remove('bk-print-on'); document.body.classList.remove('bk-printing'); window.removeEventListener('afterprint', done); }; window.addEventListener('afterprint', done); try{ window.print(); }catch(e){ done(); } setTimeout(done, 60000); }); });
    (root || document).querySelectorAll('[data-bkcopy]').forEach(b => { if(b._bk) return; b._bk = 1; b.addEventListener('click', () => { const ok = () => { b.textContent = 'Copied'; }; try{ navigator.clipboard.writeText(b.dataset.bkcopy).then(ok, ok); }catch(e){ ok(); } }); });
  }
  /* a well done for this booklet, from the marks (Patrick's stress test: "nothing comes back to the child after handing in") */
  const praiseBtn = (code, b) => `<div class="st-row"><button type="button" class="btn small leaf" data-bkpraise="${h(code)}|${h(b.short || b.t)}">⭐ Send a well done for this booklet</button></div>`;
  /* the unit a booklet belongs to, session by session, for the teacher */
  const unitHTML = b => b && b.unit ? `<details class="bk-run bk-unit"><summary>The whole unit: ${b.unit.rows.length} sessions</summary><div style="overflow-x:auto"><table class="st-table"><thead><tr>${b.unit.head.map(c => `<th>${h(c)}</th>`).join('')}</tr></thead><tbody>${b.unit.rows.map(r => `<tr>${r.map(c => `<td>${h(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${b.unit.note ? `<p>${h(b.unit.note)}</p>` : ''}<p class="hint">A draft for a teacher to check and adapt. The curriculum wording needs checking against the National Curriculum programme of study.</p></details>` : '';
  const EXTRA_CSS = `
.bk-sayb{float:right;margin:0 0 6px 10px}.bk-src{font-size:.95rem;font-style:italic;opacity:.85}.bk-read p{font-size:1.25rem;line-height:1.6}.bk-pick{margin:12px 0 6px}
.bk-rq .bk-item p{font-size:1.15rem;margin:0 0 4px}.bk-opts.many{grid-template-columns:repeat(auto-fit,minmax(180px,1fr))}
.bk-model{font-size:1.2rem;line-height:1.55;background:#fff;border-left:6px solid #3F8FC4;border-radius:8px;padding:8px 12px;margin:6px 0}
.bk-chips{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0}.bk-chips b{font-size:1rem;margin-right:2px}
.bk-chip{font:inherit;font-size:1.05rem;background:#FFF6E6;border:2.5px solid #2B1A12;border-radius:999px;padding:6px 14px;min-height:42px;cursor:pointer}.bk-chips.bank .bk-chip{background:#DDF0CF;border-radius:12px}
.bk-ta{display:block;width:100%;box-sizing:border-box;font:inherit;font-size:1.25rem;line-height:1.6;border:3px solid #2B1A12;border-radius:14px;padding:10px 14px;background:#fff;margin-top:6px}
.bk-sc{display:grid;gap:8px}.bk-sc h3{margin:0}.bk-tickb{text-align:left}.bk-tickb b{display:inline-block;width:1.4em}
.bk-pad{background:#FFFDF7;border:2.5px dashed #2F5458;border-radius:14px;padding:8px 12px;margin:12px 0}.bk-pad summary{font-weight:700;cursor:pointer}
#bkPad{display:block;width:100%;height:auto;background:#fff;border:2.5px solid #2B1A12;border-radius:10px;margin:8px 0;touch-action:none;cursor:crosshair}
.bk-unit td{font-size:.95rem;vertical-align:top}
.bk-rank{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
.bk-rankc{position:relative;display:grid;gap:4px;text-align:left;font:inherit;background:#fff;border:3px solid #2F5458;border-radius:16px;padding:12px 14px 12px 58px;min-height:96px;cursor:pointer}
.bk-rankc b{font-size:1.2rem}.bk-rankc small{font-size:1rem;line-height:1.35}.bk-rankc.on{background:#EAF4EC}
.bk-rankn{position:absolute;left:10px;top:12px;width:36px;height:36px;border-radius:50%;border:3px solid #2B1A12;background:#fff;display:grid;place-items:center;font-weight:700;font-size:1.2rem}.bk-rankc.on .bk-rankn{background:#F0B913}
.bk-boxes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:8px}.bk-boxes label{display:grid;gap:4px}.bk-boxes span{font-weight:700;text-align:center}.bk-ta.small{font-size:1.1rem;min-height:110px}
@media (max-width:700px){.bk-boxes{grid-template-columns:1fr}}
.bk-fin{background:#FFF1CF;border-color:#E8B64C}.bk-fin b{margin-right:4px}
.bk-cnote{border-top:2px dashed #cbbfa8;padding-top:8px;margin-top:8px}.bk-cnote p{margin:4px 0}.bk-schooltxt{background:#fff;border-radius:10px;padding:10px 12px;line-height:1.5}
body.bk-printing *{visibility:hidden!important}body.bk-printing .bk-print-on,body.bk-printing .bk-print-on *{visibility:visible!important}body.bk-printing .bk-print-on{position:absolute;left:0;top:0;width:100%}`;
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
    if(p.kind === 'read') return readHTML(p, S.i);
    if(p.kind === 'write') return writeHTML(p, S.i);
    if(p.kind === 'rank') return rankHTML(p, S.i);
    if(p.kind === 'text') return `<div class="bk-card bk-text">${sayBtn((p.body || []).join(' '))}${(p.body || []).map(x => `<p>${h(x)}</p>`).join('')}${(p.words || []).length ? `<div class="bk-words"><b>Word bank</b>${p.words.map(w => `<span><i>${h(w[0])}</i> ${h(w[1])}</span>`).join('')}</div>` : ''}</div>`;
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
    else if(p.kind === 'read') extra = `<p>Answers: ${Object.keys(p.lv || {}).map(L => '<b>' + h(L) + '</b> ' + p.lv[L].map(q => q.a != null ? h(String(q.a)) : '(for you to read)').join(' · ')).join(' | ')}</p>`;
    else if(p.kind === 'write') extra = '<p>The writing and the ticked checklist are for you to read, under View task progress. The app does not mark writing.</p>';
    if(i === 0) extra += (p.kind !== 'steps' && S.b.notes ? S.b.notes.map(x => `<p>${h(x)}</p>`).join('') : '') + unitHTML(S.b) + notesHTML(S.b);
    return `<details class="bk-tnote"><summary>For the teacher: this page</summary>${row ? `<p>${row.slice(1).map((c, k) => `<b>${h(r.head[k + 1].replace(/…$/, ''))}:</b> ${h(c)}`).join(' · ')}</p>` : ''}${extra}<p>Nothing on these pages is marked in front of the child. Their answers are read in the Teachers’ area, under View task progress.</p></details>`;
  }
  function render(){
    const box = document.getElementById('bookletBody'); if(!box || !S.b) return;
    const N = S.b.pages.length; S.i = Math.max(0, Math.min(N, S.i));
    document.querySelector('#screen-booklet .screen-title').textContent = S.b.short;
    if(S.i === N){ box.innerHTML = `<div class="bk-page"><div class="bk-band"><h2>All done!</h2></div><div class="fab-say"><span class="fab-char fab" role="img" aria-label="Fab"></span><div class="bubble"><b>Handed in. Brilliant thinking!</b>That is the whole booklet. Your teacher will look at it with you.</div></div>${S.b.fin ? `<div class="bk-card bk-fin"><b>⭐ If you finish</b> ${h(S.b.fin)}</div>` : ''}
      <div class="st-row bk-nav"><button type="button" class="btn soft" data-bkgo="${N - 1}">◀ Look back</button><button type="button" class="btn leaf" data-bkstop>${S.teach ? 'Back to the Teachers’ area' : 'Back to my Burrow'}</button></div></div>`; wire(box); return; }
    const p = S.b.pages[S.i];
    box.innerHTML = `<div class="bk-page" data-kind="${p.kind}"><div class="bk-band"><h2>${h(p.t)}</h2></div><p class="bk-strap">${h(p.strap)}</p>
      ${pageHTML(p)}
      ${wantsPad(p) ? padHTML() : ''}
      ${p.fin ? `<div class="bk-card bk-fin"><b>⭐ If you finish</b> ${h(p.fin)}</div>` : ''}
      ${S.teach ? tnoteHTML(S.i) : ''}
      <div class="st-row bk-nav">${S.i ? `<button type="button" class="btn soft" data-bkgo="${S.i - 1}">◀ Back a page</button>` : ''}<span class="bk-count">Page ${S.i + 1} of ${N}</span><button type="button" class="btn leaf" data-bkgo="${S.i + 1}">${S.i === N - 1 ? 'Hand it in ⭐' : 'Next page ▶'}</button></div>
      <p class="bk-rest"><button type="button" class="btn small soft" data-bkstop>Stop here for today</button> <button type="button" class="btn small soft" data-bkone aria-pressed="${oneOn()}">${oneOn() ? 'Show the whole page' : 'One part at a time'}</button> <span>It is fine to stop after any page. Your place is kept${CODE_RE.test(S.code) ? '' : ' only while this page is open'}.</span></p></div>`;
    wire(box);
  }
  /* one part at a time: a long page in a small viewer shows one part, with "Next part" (stress test: "one part per screen") */
  const oneOn = () => { const v = ls.json('fab-bk-one', null); return v == null ? (window.innerHeight < 720 || window.innerWidth < 900) : !!v; };
  function oneApply(box){
    const segs = [...box.querySelectorAll('.bk-seg')], nx = box.querySelector('.bk-nav [data-bkgo]:last-child'), bk = box.querySelector('.bk-nav [data-bkgo]:first-child');
    if(!oneOn() || segs.length < 2){ S.part = 0; return; }
    S.part = Math.max(0, Math.min(segs.length - 1, S.part || 0)); segs.forEach((el, n) => { el.hidden = n !== S.part; });
    const cnt = box.querySelector('.bk-count'); if(cnt) cnt.textContent += ` · part ${S.part + 1} of ${segs.length}`;
    if(nx && S.part < segs.length - 1){ nx.removeAttribute('data-bkgo'); nx.dataset.bkpart = S.part + 1; nx.textContent = 'Next part ▶'; }
    if(bk && bk !== nx && S.part > 0){ bk.removeAttribute('data-bkgo'); bk.dataset.bkpart = S.part - 1; bk.textContent = '◀ Back a part'; }
  }
  function wire(box){
    oneApply(box);
    box.querySelectorAll('[data-bkpart]').forEach(b => b.addEventListener('click', () => { S.part = Number(b.dataset.bkpart); snd('tick'); sayStop(); render(); try{ window.scrollTo(0, 0); }catch(e){} }));
    box.querySelectorAll('[data-bkone]').forEach(b => b.addEventListener('click', () => { ls.set('fab-bk-one', !oneOn()); S.part = 0; snd('tick'); render(); }));
    box.querySelectorAll('[data-bkrank]').forEach(b => b.addEventListener('click', () => { const R = rankOf(S.i), n = Number(b.dataset.bkrank), at = R.indexOf(n); if(at >= 0) R.splice(at, 1); else R.push(n); S.A['k' + S.i] = R.join(','); snd('tick'); save(); render(); }));
    box.querySelectorAll('textarea[data-kt]').forEach(el => el.addEventListener('input', () => { S.A[el.dataset.kt] = el.value.slice(0, 700); save(); }));
    box.querySelectorAll('[data-bkins]').forEach(b => b.addEventListener('click', () => { const el = document.getElementById(b.dataset.for); if(!el) return; const v = el.value;
      el.value = (v + (v && !/\s$/.test(v) ? ' ' : '') + b.dataset.bkins + ' ').slice(0, 700); S.A[el.dataset.kt] = el.value; save(); snd('tick'); try{ el.focus(); el.setSelectionRange(el.value.length, el.value.length); }catch(e){} }));
    box.querySelectorAll('[data-bksay]').forEach(b => b.addEventListener('click', () => { const t = b.dataset.bksay, was = saying === t; sayStop(); if(!was){ saying = t; try{ window.fabReadAloud(t); }catch(e){} }
      box.querySelectorAll('[data-bksay]').forEach(x => { x.textContent = saying && x.dataset.bksay === saying ? '⏹ Stop reading' : '🔊 Read it to me'; }); }));
    padWire(box); notesWire(box);
    box.querySelectorAll('input[data-k]').forEach(el => el.addEventListener('input', () => { S.A[el.dataset.k] = el.value.slice(0, 120); save(); }));
    box.querySelectorAll('button[data-k]').forEach(b => b.addEventListener('click', () => { const k = b.dataset.k; S.A[k] = S.A[k] === b.dataset.v && k !== 'lv' ? '' : b.dataset.v; snd('tick'); save(); render(); }));
    box.querySelectorAll('[data-bkgo]').forEach(b => b.addEventListener('click', () => { const to = Number(b.dataset.bkgo), N = S.b.pages.length; S.part = to < S.i ? 99 : 0; S.i = to; save(); sayStop();
      if(to === N){ snd('jingle'); if(!S.teach && CODE_RE.test(S.code)){ S.A.done = Date.now(); save(); try{ FabBurrow.actDone(S.code, 'bk:' + S.b.id); }catch(e){} } } else snd('tick');
      render(); try{ window.scrollTo(0, 0); }catch(e){} }));
    box.querySelectorAll('[data-bkstop]').forEach(b => b.addEventListener('click', () => { save(); snd('tick'); close(); }));
  }
  function close(){ sayStop(); const back = S.back; try{ showScreen(back); }catch(e){} }
  /* open a booklet: for a child from their Burrow (answers kept), or for a teacher to look inside (nothing kept) */
  function open(id, page, opt){
    const b = byId(id); if(!b || !b.app) return false; opt = opt || {}; build();
    S.pad = {}; S.padOpen = false; S.part = 0; sayStop();
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
      ${praiseBtn(code, b)}<p class="hint">The traffic light and next steps are worked out from the answers on this device only, as a starting point for your own judgement. Nothing here is shown to the child.</p></div>`;
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
    return (p.parts || []).map(pt => `<div class="bk-card bk-part bk-seg ${tone(pt.h)}">${pt.h ? `<h3>${h(pt.h)}</h3>` : ''}${pt.say ? sayBtn(pt.say) + `<p class="bk-say">${h(pt.say)}</p>` : ''}${aidHTML(pt.aid)}
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
      else if(p.kind === 'read'){ const L = A['r' + i + '.lv']; if(L && p.lv && p.lv[L]) p.lv[L].forEach((q, n) => { if(q.a != null) add('r' + i + '.' + L + '.' + n, q.q, q.a, q.s || p.s || 'Reading'); }); }
      else if(p.kind === 'steps'){ let n = 0; (p.parts || []).forEach(pt => { (pt.seq || []).forEach(x => { if(typeof x === 'string' && x[0] === '_') add('p' + i + '.' + (n++), 'gap', x.slice(1), pt.s || p.s); });
        (pt.items || []).forEach(q => { const k = 'p' + i + '.' + (n++); if(q.a != null) add(k, q.q, q.a, q.s || pt.s || p.s || strandOf(q)); }); }); } });
    return out.map(it => Object.assign(it, { s:it.s || sub, ok:it.v === '' ? null : same(it.v, it.a) }));
  }
  /* what a child wrote that only a person can read (open questions and choices with no right answer) */
  function openItems(b, A){
    const out = []; b.pages.forEach((p, i) => {
      if(p.kind === 'steps'){ let n = 0; (p.parts || []).forEach(pt => { (pt.seq || []).forEach(x => { if(typeof x === 'string' && x[0] === '_') n++; });
        (pt.items || []).forEach(q => { const k = 'p' + i + '.' + (n++); if(q.a == null && A[k]) out.push({ i, label:q.q, v:String(A[k]) }); }); }); }
      else if(p.kind === 'read'){ const L = A['r' + i + '.lv']; if(L && p.lv && p.lv[L]){ out.push({ i, label:p.t + ': chose the questions', v:L }); p.lv[L].forEach((q, n) => { const k = 'r' + i + '.' + L + '.' + n; if(q.a == null && A[k]) out.push({ i, label:q.q, v:String(A[k]) }); }); } }
      else if(p.kind === 'rank'){ const R = String(A['k' + i] || '').split(',').filter(x => x !== '').map(Number); if(R.length) out.push({ i, label:p.t + ' (least to most enjoyable)', v:R.map(n => (p.items[n] || [])[0]).join(' → ') }); }
      else if(p.kind === 'write'){ const t = A['w' + i + '.text']; if(t) out.push({ i, label:p.t, v:String(t) }); (p.boxes || []).forEach((bx, n) => { const v = A['w' + i + '.b' + n]; if(v) out.push({ i, label:bx, v:String(v) }); }); const ticks = (p.sc || []).filter((x, n) => A['w' + i + '.sc' + n] === '1'); if(ticks.length) out.push({ i, label:'Ticked for themselves', v:ticks.join(' · ') }); }
      else if((p.kind === 'conf' || p.kind === 'exit') && !b.afl){ const v = confRows(p, b).filter(r => A[r.k]).map(r => r.n + ' ' + A[r.k] + ' of 5'); if(v.length) out.push({ i, label:p.kind === 'conf' ? 'Confidence before' : 'Confidence after', v:v.join(' · ') });
        if(p.kind === 'exit'){ if(A['x.can']) out.push({ i, label:'One thing I can do now', v:String(A['x.can']) }); if(A['x.help']) out.push({ i, label:'One thing I’d like help with', v:String(A['x.help']) }); } } });
    return out;
  }
  function mark(b, A){
    const items = markItems(b, A), strands = {}, pages = {};
    items.forEach(it => { const S1 = strands[it.s] = strands[it.s] || { got:0, tried:0, of:0 }, P = pages[it.i] = pages[it.i] || { got:0, tried:0, of:0 };
      [S1, P].forEach(x => { x.of++; if(it.ok != null) x.tried++; if(it.ok) x.got++; }); });
    return { items, strands, pages, of:items.length, tried:items.filter(x => x.ok != null).length, got:items.filter(x => x.ok).length };
  }
  const BANDS = { G:'Secure', A:'Developing', R:'Needs support' }, THIN = 6;
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
      ${b.run ? `<details class="bk-run"><summary>How to run this booklet</summary><div style="overflow-x:auto"><table class="st-table"><thead><tr>${b.run.head.map(c => `<th>${h(c)}</th>`).join('')}</tr></thead><tbody>${b.run.rows.map(r => `<tr>${r.map(c => `<td>${h(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>` : ''}${unitHTML(b)}${notesHTML(b)}${praiseBtn(code, b)}
      <p class="hint">Marks are worked out on this device from the answers kept in this viewer. Writing and open answers are never marked by the app.</p></div>`;
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
    const fpName = id => { try{ const pk = window.FabBurrow.packById(id); return pk && pk.title ? pk.title : ''; }catch(e){ return ''; } };
    const list = Object.keys(rows).map(k => { const r = rows[k], bd = band(r), fp = NEXTFOR[r.s] || '', nm = fp ? (fpName(fp) || 'the flightpath') : '', next = [];
      if(bd === 'R'){ if(fp) next.push({ k:'p:' + fp, l:'Support: ' + nm + ', from an earlier step' }); if(/^(Adding|Subtracting)$/.test(r.s)) next.push({ k:'b:L:number-toolkit', l:'Support: My Number Toolkit' }); }
      else if(bd === 'A'){ if(fp) next.push({ k:'p:' + fp, l:'Practice: ' + nm }); }
      else if(bd === 'G'){ if(r.harder) next.push({ k:'b:L:' + r.harder, l:'Challenge: ' + byId(r.harder).short }); else if(fp) next.push({ k:'p:' + fp, l:'Challenge: ' + nm + ', from a later step' }); }
      /* a band from a handful of answers is a first impression, not a judgement (stress test, 28 Nov: "a label from four questions is a guess") */
      const thin = !!bd && r.tried < THIN;
      return Object.assign(r, { band:bd, thin, bandName:bd ? (thin ? 'Early signs: ' + BANDS[bd].toLowerCase() : BANDS[bd]) : 'Not enough yet', next }); });
    /* the same next step is offered once per child, on the first strand that calls for it */
    const seen = new Set(); list.forEach(r => { const n0 = r.next.length; r.next = r.next.filter(n => !seen.has(n.k) && seen.add(n.k)); r.above = n0 > 0 && !r.next.length; });
    return { code, rows:list, books };
  }

  /* ---------- booklets made by teachers with Claude: checked here before they are kept ---------- */
  const IMPORT_KINDS = ['conf', 'exit', 'quick', 'hinge', 'levels', 'asn', 'steps', 'text', 'read', 'write', 'rank'];
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
      if(p.kind === 'conf' || p.kind === 'exit'){ p.k = p.kind === 'conf' ? 'c1' : 'c8'; if(p.rows != null){ p.rows = arr(p.rows).filter(x => str(x, 40)).slice(0, 6); if(!p.rows.length) delete p.rows; } }
      if(p.kind === 'quick'){ if(!arr(p.items).length || p.items.length > 12) E.push(at + ' needs 1 to 12 questions.'); arr(p.items).forEach((q, n) => { if(!q || !str(q.q, 60) || num(q.a) == null) E.push(`${at}, question ${n + 1} needs words ("q") and a number answer ("a").`); else { q.id = 'ABCDEFGHIJKL'[n]; q.a = num(q.a); if(q.op && !OPS[q.op]) delete q.op; sum(q.q, q.a, at); } }); }
      if(p.kind === 'hinge'){ if(!arr(p.items).length || p.items.length > 4) E.push(at + ' needs 1 to 4 questions.'); arr(p.items).forEach((q, n) => { const o = arr(q && q.opts).map(String), ok = 'ABCD'.indexOf(q && q.ok);
        if(!q || !str(q.q, 120) || o.length < 2 || o.length > 4 || ok < 0 || ok >= o.length) E.push(`${at}, question ${n + 1} needs words, 2 to 4 options and the right letter ("ok").`); else { q.opts = o; q.id = 'i' + i + 'n' + n; if(q.op && !OPS[q.op]) delete q.op; q.why = o.map((x, k) => k === ok ? 'Correct' : String(arr(q.why)[k] || 'Not yet right').slice(0, 120)); const c = calc(q.q); if(c != null && num(o[ok]) != null && Math.abs(c - num(o[ok])) > 1e-9) E.push(`${at}: “${q.q}” is ${c}, but option ${q.ok} says ${o[ok]}.`); } }); }
      if(p.kind === 'levels'){ const L = p.lv && typeof p.lv === 'object' ? Object.keys(p.lv) : []; if(L.length < 2 || L.length > 3) E.push(at + ' needs two or three levels.'); L.forEach(k => { if(!/^[A-Za-z ]{1,12}$/.test(k) || !arr(p.lv[k]).length || p.lv[k].length > 6) E.push(`${at}: the level “${k}” needs a short name and 1 to 6 questions.`); arr(p.lv[k]).forEach(q => { if(!Array.isArray(q) || !str(q[0], 60) || num(q[1]) == null) E.push(`${at}, level ${k}: each question is ["words", number].`); else { q[1] = num(q[1]); sum(q[0], q[1], at); } }); }); }
      if(p.kind === 'asn'){ if(!arr(p.items).length || p.items.length > 6) E.push(at + ' needs 1 to 6 statements.'); arr(p.items).forEach((q, n) => { if(!q || !str(q.q, 140) || !['always', 'sometimes', 'never'].includes(q.a)) E.push(`${at}, statement ${n + 1} needs words and an answer: always, sometimes or never.`); }); }
      if(p.kind === 'read'){ if(!arr(p.body).length || p.body.length > 10 || !arr(p.body).every(x => str(x, 900))) E.push(at + ' needs 1 to 10 paragraphs to read ("body").'); p.words = arr(p.words).filter(w => Array.isArray(w) && str(w[0], 40) && str(w[1], 120)).slice(0, 14); if(p.src != null && !str(p.src, 160)) delete p.src;
        const L = p.lv && typeof p.lv === 'object' && !Array.isArray(p.lv) ? Object.keys(p.lv) : []; if(L.length > 3) E.push(at + ' can have up to three levels of questions.');
        L.forEach(k => { if(!/^[A-Za-z ]{1,16}$/.test(k) || !arr(p.lv[k]).length || p.lv[k].length > 5) E.push(`${at}: the level “${k}” needs a short name and 1 to 5 questions.`);
          arr(p.lv[k]).forEach((q, n) => { if(!q || !str(q.q, 160)){ E.push(`${at}, level ${k}, question ${n + 1} needs words ("q").`); return; }
            if(q.opts != null){ q.opts = arr(q.opts).map(String).slice(0, 4); if(q.opts.length < 2) E.push(`${at}, level ${k}, question ${n + 1}: choices need at least two options.`); else if(q.a != null && !q.opts.includes(String(q.a))) E.push(`${at}, level ${k}, question ${n + 1}: the answer must be one of the options.`); } }); }); }
      if(p.kind === 'rank'){ p.items = arr(p.items).map(x => typeof x === 'string' ? [x, ''] : x).filter(x => Array.isArray(x) && str(x[0], 40)).map(x => [x[0], String(x[1] || '').slice(0, 140)]).slice(0, 8); if(p.items.length < 2) E.push(at + ' needs 2 to 8 things to put in order ("items").'); }
      if(p.fin != null && !str(p.fin, 200)) delete p.fin;
      if(p.kind === 'write'){ if(!str(p.task, 400)) E.push(at + ' needs the writing task ("task").'); const list = (f, n, len) => { p[f] = arr(p[f]).filter(x => str(x, len)).slice(0, n); };
        list('model', 4, 600); list('stems', 8, 60); list('bank', 16, 30); list('sc', 6, 80); list('boxes', 3, 30); if(p.low != null && !str(p.low, 160)) delete p.low; }
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
- "conf": How confident do you feel? (first page). Give "rows": ["Reading the text", "Finding answers in it"] to say what the child rates (up to 6 lines). "exit": the same again plus two sentences (last page).
- "steps": { "s": "strand name, e.g. Fractions", "parts": [ { "h": "Watch me", "say": "the model, step by step" }, { "h": "Let’s do it together", "say": "...", "items": [ { "q": "6 + 4", "a": 10 } ] }, { "h": "My turn", "items": [ { "q": "7 + 2", "a": 9 }, { "q": "Which is a noun?", "a": "fox", "opts": ["ran", "fox", "quickly"] }, { "q": "Tell me how you know." } ] } ] }
  A part may also have "seq": [20, 17, 14, "_11", "_8"] (a gap is "_answer") or "aid": { "type": "line", "from": 0, "to": 10, "at": 5, "hop": 3 } | { "type": "frame", "n": 7 } | { "type": "pw", "w": 10, "a": 7, "b": "?" }.
  A question with "a" is marked by the app; with no "a" it is for the teacher to read. "a" may be a list of accepted answers.
- "quick": { "items": [ { "q": "46 + 23", "a": 69 } ] } up to 12 quick questions with number answers.
- "hinge": { "items": [ { "q": "358 + 167", "opts": ["415", "525", "425", "625"], "ok": "B", "why": ["No carrying at all", "Correct", "Carried to tens, not hundreds", "Carried too much"] } ] } each wrong option stands for one misconception.
- "levels": { "lv": { "Mild": [["34 + 25", 59]], "Spicy": [["368 + 145", 513]], "Hot": [["2,476 + 1,385", 3861]] } } the child chooses.
- "asn": { "items": [ { "q": "Multiplying makes a number bigger.", "a": "sometimes", "why": "not × 1 or × 0" } ] } always, sometimes or never.
- "read": { "body": ["A short paragraph."], "src": "From … by …", "words": [["bleak", "cold and miserable"]], "lv": { "Find it": [ { "q": "What day is it?", "opts": ["Monday", "Friday"], "a": "Friday" } ], "Think about it": [ { "q": "…", "opts": ["…", "…"], "a": "…" } ], "Dig deeper": [ { "q": "An open question for the teacher to read." } ] } } a text with questions at up to three levels; the child chooses the level. Public-domain texts only.
- "write": { "task": "What to write", "model": ["A model text to read first."], "stems": ["Scrooge is"], "bank": ["mean", "cold"], "sc": ["I checked my capital letters and full stops"], "low": "Tired? One sentence is plenty." } never marked by the app; the teacher reads it.
- "rank": { "items": [["Slate writing", "Copying letters on a slate"], ["Drill", "Strict exercises in rows"]] } the child taps them in order; no right answer.
- Any page may have "fin": "If you finish: …" for a child who finishes first. A "write" page may have "boxes": ["Then", "Both", "Now"] instead of one writing box.
- "text": { "body": ["A paragraph to read."], "words": [["bleak", "cold, grey and miserable"]] } for reading; public-domain texts only.

Write sums with spaces and these signs: + − × ÷. Give me the JSON only, in a code block, so I can save it as a .json file.`;

  /* ---------- the screen ---------- */
  function build(){
    if(document.getElementById('screen-booklet')) return true;
    const hub = document.getElementById('screen-hub'); if(!hub) return false;
    hub.parentNode.insertAdjacentHTML('beforeend', `<section id="screen-booklet" class="screen" aria-label="Booklet"><div class="screen-top"><button class="btn-back" data-go="screen-hub">← Back</button><h1 class="screen-title">Booklet</h1></div><div id="bookletBody"></div></section>`);
    const st2 = document.createElement('style'); st2.textContent = EXTRA_CSS; document.head.appendChild(st2);
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
  window.FabBooklets = { all, byId, act, open, read, known, codes, afl, teacherHTML, state:S, render, mark, profile, check, add, remove, mine, hashFor, brief:BRIEF, bands:BANDS, unitHTML, confRows, sayStop, notesHTML, notesWire, started:(id, code) => { const d = read(id, code); return !!(d.t && !d.a.done && (d.p > 0 || Object.keys(d.a).length)); } };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
