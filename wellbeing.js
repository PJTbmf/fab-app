/* The Wellbeing Hub, redesigned on the BMF principles: wellbeing and confidence first, choice, short chunks,
   a low-energy option, a clear place to stop, and the same friend doing the same job everywhere.
   Nurse Willow welcomes and asks about energy (rest and calm) · Mr Elder celebrates you · Bramble and Moss do things together
   · Fab gets you moving (you do) · Mrs Lark is the place to stop. Each activity, once a day, sends a star to Fab Fox World.
   The energy choice is only used on screen to suggest activities; it is not saved or logged. */
(function(){
  'use strict';
  const sec = document.getElementById('screen-wellbeing'), menu = document.getElementById('wbMenu');
  if(!sec || !menu) return;
  const ch = c => `<span class="fab-char ${c}" aria-hidden="true"></span>`;
  const ACT = {
    breathe:{ e:'🫧', n:'Bubble Breathing', d:'Five slow breaths with a bubble', energy:['low','some'] },
    calm:{ e:'🐢', n:'Take-It-Slow Ideas', d:'Gentle things to try today', energy:['low','some'] },
    affirm:{ e:'💛', n:'Sunshine Affirmations', d:'A kind thought just for you', energy:['low','some','lots'] },
    grateful:{ e:'🌻', n:'Three Sunny Things', d:'Three good things about today', energy:['some','lots'] },
    compliment:{ e:'🎁', n:'Compliment Cart', d:'Kind words to give away', energy:['some','lots'] },
    mood:{ e:'🙂', n:'How Are You Feeling?', d:'All feelings are welcome', energy:['low','some','lots'] },
    move:{ e:'🤸', n:'Fab Says', d:'Copy Fab’s moves, sitting or standing', energy:['some','lots'], world:'move' },
    beat:{ e:'🥁', n:'Beat Maker', d:'Make a happy beat', energy:['some','lots'], world:'music' }
  };
  const GROUPS = [
    { who:'nurse', t:'Calm and rest', s:'Nurse Willow', a:['breathe', 'calm'] },
    { who:'elder', t:'Feel good about me', s:'Mr Elder', a:['affirm', 'grateful'] },
    { who:'pair', t:'Kind and together', s:'Bramble and Moss', a:['compliment', 'mood'] },
    { who:'fab', t:'Move and play', s:'Fab', a:['move', 'beat'] }
  ];
  const face = w => w === 'pair' ? ch('yellow') + ch('green') : ch(w);
  const css = `
  #screen-wellbeing .screen-top{margin-bottom:6px}
  .wb2-hello{display:flex;align-items:center;gap:14px;max-width:980px;margin:0 auto 14px;background:#FFF6E6;border:3px solid var(--ink,#2B1A12);border-radius:var(--wob,22px);padding:12px 18px;box-shadow:var(--shadow)}
  .wb2-hello .fab-char{width:76px;margin:0}
  .wb2-hello b{display:block;font-size:var(--t-lead,1.3rem)}
  .wb2-hello p{margin:2px 0 8px;font-size:var(--t-body,1.05rem);color:#4A2A18}
  .wb2-energy{display:flex;flex-wrap:wrap;gap:8px}
  .wb2-energy button{border:3px solid #fff;border-radius:999px;padding:6px 16px;min-height:48px;background:linear-gradient(#fffdf6,#ffeccc);font:inherit;font-weight:800;font-size:var(--t-btn,1.05rem);cursor:pointer;box-shadow:0 3px 0 rgba(176,127,0,.35)}
  .wb2-energy button[aria-pressed=true]{background:linear-gradient(#ffe38a,#f0b913);border-color:#2B1A12}
  #wbMenu.wb2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;max-width:980px;margin:0 auto}
  .wb2-group{background:rgba(255,255,255,.55);border:3px solid var(--ink,#2B1A12);border-radius:var(--wob,22px);padding:12px 14px 14px;box-shadow:var(--shadow)}
  .wb2-gh{display:flex;align-items:center;gap:10px;margin:0 0 10px}
  .wb2-gh .fab-char{width:52px;margin:0}.wb2-gh .fab-char+.fab-char{margin-left:-20px}
  .wb2-gh b{display:block;font-size:var(--t-head,1.35rem);font-family:'Aleo',Georgia,serif;font-weight:700}
  .wb2-gh small{font-size:var(--t-small,.95rem);color:#6b5a48;font-weight:700}
  .wb2-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  #wbMenu .wb-tile{position:relative;display:flex;flex-direction:column;align-items:center;gap:4px;padding:14px 10px;min-height:132px;cursor:pointer;background:#fff}
  #wbMenu .wb-tile .emoji{font-size:2.2rem!important;line-height:1}
  #wbMenu .wb-tile h3{margin:2px 0 0;font-size:calc(var(--t-head,1.35rem) * .9);color:#4A2A18}
  #wbMenu .wb-tile p{margin:0;font-size:var(--t-small,.95rem)}
  #wbMenu .wb-tile.today{border-color:#F3BB17;box-shadow:0 0 0 4px rgba(243,187,23,.45),var(--shadow)}
  #wbMenu .wb-tile.today::after{content:"✨ Good for today";position:absolute;top:-12px;left:50%;transform:translateX(-50%);white-space:nowrap;background:#F3BB17;color:#2B1A12;border-radius:999px;padding:1px 10px;font-weight:800;font-size:.8rem}
  #wbMenu .wb-tile.done h3::after{content:" ✓";color:#437039}
  .wb2-stop{display:flex;justify-content:center;margin:16px auto 0;max-width:980px}
  .wb2-stop button{display:inline-flex;align-items:center;gap:10px;border:3px solid var(--ink,#2B1A12);border-radius:999px;padding:4px 20px 4px 6px;background:#fff6e6;font:inherit;font-weight:800;font-size:var(--t-btn,1.05rem);cursor:pointer;box-shadow:var(--shadow);min-height:52px}
  .wb2-stop .fab-char{width:40px;margin:0}
  #screen-wellbeing .card-panel{max-width:860px}
  .wb2-ph{display:flex;align-items:center;gap:12px;justify-content:center;margin:0 0 6px}
  .wb2-ph .fab-char{width:62px;margin:0}.wb2-ph .fab-char+.fab-char{margin-left:-22px}
  .wb2-ph b{font-size:var(--t-head,1.35rem)}
  #screen-wellbeing .big-card{font-size:var(--t-display,2rem)!important;line-height:1.3}
  #screen-wellbeing #moodReply{font-size:var(--t-lead,1.3rem)!important}
  @media (max-width:760px){#wbMenu.wb2{grid-template-columns:1fr}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* the welcome and energy check */
  const hello = document.createElement('div'); hello.className = 'wb2-hello';
  hello.innerHTML = `${ch('nurse')}<div><b>Hello. Let’s look after you.</b><p>How much energy have you got today? There’s no wrong answer.</p>
    <div class="wb2-energy" role="group" aria-label="How much energy have you got?"><button type="button" data-en="low" aria-pressed="false">🪫 A little</button><button type="button" data-en="some" aria-pressed="false">🙂 Some</button><button type="button" data-en="lots" aria-pressed="false">🔋 Lots</button></div></div>`;
  menu.before(hello);
  /* the activities, grouped by the friend who looks after them */
  const tiles = {}; menu.querySelectorAll('.wb-tile').forEach(t => { tiles[t.dataset.wb] = t; });
  ['move', 'beat'].forEach(k => { const a = ACT[k], b = document.createElement('button'); b.className = 'wb-tile'; b.dataset.wb2 = k; b.innerHTML = `<span class="emoji">${a.e}</span><h3>${a.n}</h3><p class="hint">${a.d}</p>`; tiles[k] = b; });
  Object.keys(ACT).forEach(k => { const t = tiles[k]; if(!t) return; const p = t.querySelector('p'); if(p) p.textContent = ACT[k].d; const h = t.querySelector('h3'); if(h) h.textContent = ACT[k].n; });
  menu.innerHTML = ''; menu.classList.add('wb2');
  GROUPS.forEach(g => { const box = document.createElement('section'); box.className = 'wb2-group'; box.setAttribute('aria-label', g.t);
    box.innerHTML = `<div class="wb2-gh">${face(g.who)}<div><b>${g.t}</b><small>with ${g.s}</small></div></div>`;
    const row = document.createElement('div'); row.className = 'wb2-row'; g.a.forEach(k => tiles[k] && row.appendChild(tiles[k])); box.appendChild(row); menu.appendChild(box); });
  const stop = document.createElement('div'); stop.className = 'wb2-stop'; stop.innerHTML = `<button type="button">${ch('lark')} A good place to stop</button>`; menu.after(stop);
  /* the world activities open Fab Fox World at the right place */
  menu.addEventListener('click', e => { const t = e.target.closest('[data-wb2]'); if(!t) return; const k = t.dataset.wb2; mark(k); window.fabWorldOpen = ACT[k].world; showScreen('screen-world'); });
  /* friend headers on each activity panel, and a clearer way back */
  const PANEL = { wbAffirm:['elder', 'Mr Elder: a kind thought for you'], wbBreathe:['nurse', 'Nurse Willow: breathe with the bubble'], wbMood:['pair', 'Bramble and Moss: how are you feeling?'],
    wbGrateful:['elder', 'Mr Elder: three sunny things'], wbCompliment:['pair', 'Bramble and Moss: kind words to give'], wbCalm:['nurse', 'Nurse Willow: take it slow'] };
  Object.entries(PANEL).forEach(([id, [w, t]]) => { const p = document.getElementById(id); if(!p) return; const h = document.createElement('div'); h.className = 'wb2-ph'; h.innerHTML = face(w) + `<b>${t}</b>`; p.prepend(h);
    p.querySelectorAll('[data-wbback]').forEach(b => { b.textContent = '← All feel-good things'; }); });
  /* the energy check suggests activities (on this screen only) */
  hello.addEventListener('click', e => { const b = e.target.closest('[data-en]'); if(!b) return; const en = b.dataset.en;
    hello.querySelectorAll('[data-en]').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
    Object.keys(ACT).forEach(k => tiles[k] && tiles[k].classList.toggle('today', ACT[k].energy.includes(en) && (en !== 'some' || ['breathe', 'affirm', 'move'].includes(k))));
    hello.querySelector('p').textContent = en === 'low' ? 'Thank you for telling me. Quiet, cosy things are marked ✨. Rest is always OK.' : en === 'lots' ? 'Brilliant! Things with a bit of bounce are marked ✨.' : 'Lovely. A few nice ones are marked ✨, or pick anything you like.';
    try{ Sound.gentle(); }catch(_){} });
  /* a star once a day for each activity */
  const who = () => { try{ return (typeof fabLearnerCode === 'function' && fabLearnerCode()) || 'local'; }catch(e){ return 'local'; } };
  const key = () => 'fab-wellbeing-' + who() + '-' + new Date().toISOString().slice(0, 10);
  const got = () => { try{ return JSON.parse(localStorage.getItem(key()) || '{}'); }catch(e){ return {}; } };
  function mark(k){
    const g = got(); if(g[k]) return; g[k] = 1; try{ localStorage.setItem(key(), JSON.stringify(g)); }catch(e){}
    try{ fabWorldAward(1); }catch(e){} if(tiles[k]) tiles[k].classList.add('done');
    const t = document.createElement('div'); t.className = 'gc-cheer'; t.setAttribute('role', 'status');
    t.innerHTML = `${ch('elder')}<div><b>Mr Elder: lovely! 🎉</b><small>⭐ waiting for you in Fab Fox World</small></div>`;
    document.body.appendChild(t); setTimeout(() => t.classList.add('show'), 30); setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 500); }, 3600);
  }
  const count = {};
  const after = (id, k, n) => { const b = document.getElementById(id); if(b) b.addEventListener('click', () => { count[k] = (count[k] || 0) + 1; if(count[k] >= n) mark(k); }); };
  after('affirmNext', 'affirm', 2); after('gratefulNext', 'grateful', 2); after('complimentNext', 'compliment', 1); after('calmNext', 'calm', 1);
  document.querySelectorAll('#wbMood .mood-btn').forEach(b => b.addEventListener('click', () => mark('mood')));
  const circle = document.getElementById('breathCircle');
  if(circle) new MutationObserver(() => { if(/Lovely and calm/.test(circle.textContent)) mark('breathe'); }).observe(circle, { childList:true, characterData:true, subtree:true });
  const refresh = () => { const g = got(); Object.keys(ACT).forEach(k => tiles[k] && tiles[k].classList.toggle('done', !!g[k])); };
  /* Mrs Lark: a good place to stop */
  stop.querySelector('button').addEventListener('click', () => {
    const n = Object.keys(got()).length;
    const o = document.createElement('div'); o.className = 'gc-back'; o.id = 'gcCard';
    o.innerHTML = `<div class="gc-card" role="dialog" aria-modal="true"><div class="gc-who">${ch('lark')}<div><b>Mrs Lark: a good place to stop</b><small>Wellbeing Hub</small></div></div>
      <p class="gc-say">${n ? `You did ${n} feel-good thing${n === 1 ? '' : 's'} today. That’s you looking after yourself.` : 'Just coming here is looking after yourself.'} You can come back any time.</p>
      <div class="gc-row"><button type="button" class="btn soft" data-x>Stay a bit longer</button><button type="button" class="btn" data-home>Back to the start</button></div></div>`;
    document.body.appendChild(o); o.querySelector('[data-x]').focus();
    o.addEventListener('click', e => { if(e.target === o || e.target.closest('[data-x]')) o.remove(); if(e.target.closest('[data-home]')){ o.remove(); showScreen('screen-hub'); } });
  });
  const show0 = window.showScreen;
  if(typeof show0 === 'function') window.showScreen = function(id){ const r = show0.apply(this, arguments); if(id === 'screen-wellbeing') refresh(); return r; };
  /* the home tile describes the new hub */
  const ht = document.querySelector('#screen-hub [data-go="screen-wellbeing"] p'); if(ht) ht.textContent = 'Calm, kind and feel-good things, at your energy level';
  new MutationObserver(() => { const on = menu.style.display !== 'none'; hello.style.display = on ? '' : 'none'; stop.style.display = on ? '' : 'none'; }).observe(menu, { attributes:true, attributeFilter:['style'] });
  refresh();
})();
