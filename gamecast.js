/* Fab Games: the same friends doing the same jobs in every game (dual coding), and every game feeding Fab Fox World.
   Miss Bell 🔔 shows how to play (I do) · Bramble and Moss play together (we do) · Fab is you (you do)
   Doctor McPhee 🩺 helps fix a slip · Nurse Willow 🛋️ is a rest · Mrs Lark 🌙 is a good place to stop · Mr Elder 🎉 celebrates.
   Rewards: finishing a game gives stars (2 for a win, 1 for any other ending, because every game counts),
   and a little treasure for a win. A few per game each day, so stars stay special. They wait in Fab Fox World. */
(function(){
  'use strict';
  const G = {
    'screen-c4':        { n:'Connect 4', how:['Take turns to drop a counter into a column.', 'It falls to the lowest empty space.', 'Make four in a row, across, up or slanting.'], together:true, help:'Look for three in a row. Can you finish it, or block it?' },
    'screen-ttt':       { n:'Noughts and Crosses', how:['Take turns to put your mark in a square.', 'Three in a row, across, down or slanting, wins.', 'A full board with no line is a draw.'], together:true, help:'If the middle square is free, it is a good place to start.' },
    'screen-bingo':     { n:'Bingo', how:['Everyone gets a card.', 'Call the next one together.', 'Tap it if it is on your card. A full line is Bingo!'], together:true, help:'After each call, check every row on your card.' },
    'screen-charades':  { n:'Charades', how:['One person acts. Everyone else looks away while they read the card.', 'Act it out with no words.', 'Everyone guesses together.'], together:true, help:'Show how many words with your fingers, then act one word at a time.' },
    'screen-wordle':    { n:'Word Detective', how:['Guess the mystery word.', 'Green means right letter, right place. Amber means right letter, wrong place.', 'Use the clues for your next guess.'], help:'Start with a word with lots of vowels, like AUDIO.' },
    'screen-battleships':{ n:'Battleships', how:['Place your ships together.', 'Take turns to fire at the hidden grid.', 'Find the whole fleet.'], together:true, help:'After a hit, try the squares next to it.' },
    'screen-battleships2':{ n:'Battleships', how:['Place your ships.', 'Take turns to fire at the hidden grid.', 'Find the whole fleet.'], together:true, help:'After a hit, try the squares next to it.' },
    'screen-checkers':  { n:'Checkers', how:['Move one square diagonally forward.', 'Jump over a piece to take it.', 'Reach the far side and your piece becomes a king.'], together:true, help:'Try the 💡 Hint button: it shows a good move.' },
    'screen-uno':       { n:'Uno', how:['Match the colour or the number.', 'Special cards skip a go, reverse, or make others pick up.', 'Play every card in your hand.'], together:true, help:'Keep a wild card for when you are stuck.' },
    'screen-countdown': { n:'Countdown', how:['Letters: pick vowels and consonants, then make the longest word.', 'Numbers: reach the target with + − × ÷.', 'Work together. The timer is only if you want it.'], together:true, help:'Try adding S, ED or ING to a word you already found.' },
    'screen-rainbow':   { n:'Rainbow Words', how:['Guess letters to find the mystery word.', 'Each miss brings a cloud.', 'Find the word and the rainbow bursts out.'], help:'Try the vowels first: A, E, I, O, U.' },
    'screen-fabfaves':  { n:'Fab Faves Wheel', how:['Spin the wheel.', 'Answer the question it lands on.', 'Everyone gets a turn.'], together:true, help:'There are no wrong answers. You can pass and spin again.' },
    'screen-spot':      { n:'Spot the Difference', how:['Look at both pictures.', 'Tap a difference in either picture.', 'Find them all.'], help:'Look at one corner at a time.' },
    'screen-chat':      { n:'Chatter Corner', how:['Tap for a card.', 'Take turns to answer.', 'There are no wrong answers.'], together:true, help:'You can always say "pass" and pick another card.' },
    'screen-pinball':   { n:'Pinball', how:['Press the flippers to keep the ball up.', 'Hit the bumpers and lights.', 'Play for as long as you like.'], help:'Wait for the ball to reach the flipper before you press.' },
    'screen-shuffleboard':{ n:'Shuffleboard', how:['Slide your puck.', 'Stop it in the scoring zones.', 'Take turns.'], together:true, help:'A gentle push goes further than you think.' },
    'screen-invaders':  { n:'Space Mission', how:['Move left and right.', 'Fire at the space blobs.', 'Rest whenever you like.'], help:'Stay near the middle so you can move either way.' },
    'screen-pairs':     { n:'Pairs', how:['Turn over two cards.', 'If they match, they stay.', 'Find every pair.'], help:'Try to remember where each picture was.' }
  };
  const TREAS = ['🍎', '🌰', '🌼', '⭐', '🍄', '🫐', '💎', '✨'];
  const day = () => new Date().toISOString().slice(0, 10);
  const who = () => { try{ return (typeof fabLearnerCode === 'function' && fabLearnerCode()) || 'local'; }catch(e){ return 'local'; } };
  const store = (k, v) => { const key = 'fab-gamecast-' + who(); let o = {}; try{ o = JSON.parse(localStorage.getItem(key) || '{}') || {}; }catch(e){} if(v === undefined) return o[k]; o[k] = v; try{ localStorage.setItem(key, JSON.stringify(o)); }catch(e){} };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
  const ch = (c, extra) => `<span class="fab-char ${c} gc-face${extra ? ' ' + extra : ''}" aria-hidden="true"></span>`;
  let cur = null, openedAt = 0, lastEnd = 0;

  function bar(id, g){
    const sec = document.getElementById(id); if(!sec || sec.querySelector('.gc-bar')) return;
    const top = sec.querySelector('.screen-top'); if(!top) return;
    const b = document.createElement('div'); b.className = 'gc-bar'; b.setAttribute('role', 'toolbar'); b.setAttribute('aria-label', 'Help from Fab’s friends');
    b.innerHTML = `<button type="button" class="gc-chip" data-gc="how">${ch('bell')}<span>How to play</span></button>` +
      (g.together ? `<button type="button" class="gc-chip" data-gc="together">${ch('yellow', 'gc-pair')}${ch('green', 'gc-pair')}<span>Play together</span></button>` : '') +
      `<button type="button" class="gc-chip" data-gc="help">${ch('doc')}<span>A tip</span></button>` +
      `<button type="button" class="gc-chip" data-gc="rest">${ch('nurse')}<span>Rest</span></button>` +
      `<button type="button" class="gc-chip" data-gc="stop">${ch('lark')}<span>Stop here</span></button>`;
    top.after(b);
    b.addEventListener('click', e => { const t = e.target.closest('[data-gc]'); if(!t) return; try{ Sound.tick(); }catch(_){} open(t.dataset.gc, id); });
    watch(sec, id);
  }
  function card(html, cls){
    close();
    const o = document.createElement('div'); o.className = 'gc-back'; o.id = 'gcCard';
    o.innerHTML = `<div class="gc-card ${cls || ''}" role="dialog" aria-modal="true">${html}</div>`;
    document.body.appendChild(o);
    o.addEventListener('click', e => { if(e.target === o || e.target.closest('[data-gcx]')) close(); });
    const f = o.querySelector('button'); if(f) f.focus();
    return o;
  }
  function close(){ const o = document.getElementById('gcCard'); if(o){ clearInterval(o._iv); o.remove(); } }
  function open(kind, id){
    const g = G[id]; if(!g) return;
    if(kind === 'how'){
      card(`<div class="gc-who">${ch('bell')}<div><b>Miss Bell shows you how</b><small>${esc(g.n)}</small></div></div>
        <ol class="gc-steps">${g.how.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
        <div class="gc-row"><button type="button" class="btn" data-gcx>${ch('fab', 'gc-mini')} Your turn!</button></div>`, 'gc-how');
      store('seen:' + id, 1);
    } else if(kind === 'together'){
      card(`<div class="gc-who">${ch('yellow')}${ch('green')}<div><b>Bramble and Moss play together</b><small>We do it as a team</small></div></div>
        <ul class="gc-steps"><li>Take turns and say “your go!”</li><li>If someone is stuck, give a clue, not the answer.</li><li>Cheer every turn, not just the winning one.</li></ul>
        <div class="gc-row"><button type="button" class="btn" data-gcx>Let’s play</button></div>`);
    } else if(kind === 'help'){
      card(`<div class="gc-who">${ch('doc')}<div><b>Doctor McPhee’s tip</b><small>Slips are how we learn</small></div></div>
        <p class="gc-say">${esc(g.help)}</p><div class="gc-row"><button type="button" class="btn" data-gcx>Thanks!</button></div>`);
    } else if(kind === 'rest'){
      const o = card(`<div class="gc-who">${ch('nurse')}<div><b>Nurse Willow: a little rest</b><small>The game will wait for you</small></div></div>
        <div class="gc-bubble" aria-hidden="true"></div><p class="gc-say" id="gcBreath" aria-live="polite">Breathe in…</p>
        <div class="gc-row"><button type="button" class="btn" data-gcx>I’m ready</button></div>`, 'gc-rest');
      let i = 0; o._iv = setInterval(() => { i++; const p = document.getElementById('gcBreath'); if(p) p.textContent = i % 2 ? 'and out…' : 'Breathe in…'; }, 4000);
    } else if(kind === 'stop'){
      const mins = Math.max(0, Math.round((Date.now() - openedAt) / 60000));
      const k = 'stop:' + id + ':' + day(); const earned = (Date.now() - openedAt > 60000) && !store(k);
      if(earned){ store(k, 1); try{ fabWorldAward(1); }catch(e){} }
      card(`<div class="gc-who">${ch('lark')}<div><b>Mrs Lark: a good place to stop</b><small>${esc(g.n)}</small></div></div>
        <p class="gc-say">${mins >= 1 ? `You played for ${mins} minute${mins === 1 ? '' : 's'}.` : 'Thank you for playing.'} You can always come back.</p>
        ${earned ? '<p class="gc-earn">⭐ +1 star is waiting for you in Fab Fox World.</p>' : ''}
        <div class="gc-row"><button type="button" class="btn soft" data-gcx>Keep playing</button><button type="button" class="btn" data-gcgo>All games</button></div>`);
      const go = document.querySelector('[data-gcgo]'); if(go) go.onclick = () => { close(); try{ showScreen('screen-games'); }catch(e){} };
    }
  }
  /* Mr Elder: when a game ends, celebrate and send stars to Fab Fox World */
  const END = /(wins|you win|you did it|found them all|well played|great game|good game|bingo|it.s a draw|this time|every card first|whole fleet|that.s as good as it gets)/i;
  const WIN = /(you win|you did it|found them all|well played|bingo|wins!|your group played every card|you found the whole)/i;
  function ended(id, text){
    if(Date.now() - lastEnd < 6000) return; lastEnd = Date.now();
    const g = G[id]; if(!g) return;
    const win = WIN.test(text) && !/computer|robot/i.test(text.split(/wins|played|found/i)[0]);
    const k = 'end:' + id + ':' + day(), n = store(k) || 0, stars = n < 4 ? (win ? 2 : 1) : 0;
    store(k, n + 1);
    let tre = '';
    if(stars){ try{ fabWorldAward(stars); }catch(e){} if(win && n < 2){ tre = TREAS[Math.floor(Math.random() * TREAS.length)]; try{ fabWorldTreasure(tre); }catch(e){} } }
    const t = document.createElement('div'); t.className = 'gc-cheer'; t.setAttribute('role', 'status');
    t.innerHTML = `${ch('elder')}<div><b>${win ? 'Mr Elder: what a game! 🎉' : 'Mr Elder: good game! Every game counts. 🎉'}</b>
      <small>${stars ? '⭐'.repeat(stars) + (tre ? ' and a ' + tre : '') + ' waiting in Fab Fox World' : 'Lots of games today. Great playing!'}</small></div>`;
    document.body.appendChild(t); setTimeout(() => t.classList.add('show'), 30); setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 500); }, 4200);
    try{ Sound.jingle(); }catch(e){}
  }
  function watch(sec, id){
    const ob = new MutationObserver(ms => {
      if(cur !== id) return;
      for(const m of ms){
        const el = m.target.nodeType === 3 ? m.target.parentElement : m.target; if(!el || el.closest('.gc-bar')) continue;
        if(!el.closest('.banner, [id$="OverText"], [id$="Over"], .over, [class*="over"]')) continue;
        const txt = (el.textContent || '').trim(); if(txt && END.test(txt)){ ended(id, txt); break; }
      }
    });
    ob.observe(sec, { subtree:true, childList:true, characterData:true });
  }
  /* games inside a frame (pinball and friends) tell the app when a round ends */
  window.addEventListener('message', e => { const d = e.data; if(d && d.fabGameEnd && cur){ ended(cur, d.win ? 'you win' : 'good game'); } });
  const show0 = window.showScreen;
  if(typeof show0 === 'function'){
    window.showScreen = function(id){
      const r = show0.apply(this, arguments);
      close();
      if(G[id]){ bar(id, G[id]); if(cur !== id){ cur = id; openedAt = Date.now(); } if(!store('seen:' + id)) setTimeout(() => { if(cur === id) open('how', id); }, 350); }
      else cur = null;
      return r;
    };
  }
  document.addEventListener('keydown', e => { if(e.key === 'Escape') close(); });
  window.FabGameCast = { games:G, open, ended, close };
})();
