/* lessontimer.js — A gentle timer for one 15-minute subject slot of a BMF lesson.
   I do (4) · We do (3) · You do (7) · A place to stop (1). A low-energy slot is 10 minutes (3 · 2 · 4 · 1).
   The teacher starts it; it moves through the phases by itself and cues a calm stop.
   Children never see a ticking clock: only which part we are in, and a soft bar. The teacher sees whole minutes.
   In a live Pencil Space the timer travels with the lesson, so everyone sees the same phase.
   Loaded after the main script. */
(function(){
  'use strict';
  const h = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const snd = k => { try{ Sound[k](); }catch(e){} };
  const PH = {
    ido:  { e:'👀', n:'I do',  who:'Miss Bell shows us how',            t:'Teach the idea live, for everyone. Miss Bell’s slides are on the board.' },
    wedo: { e:'🤝', n:'We do', who:'Together, with Bramble and Moss',  t:'One question together. Everyone answers on their own board.' },
    ydo:  { e:'✏️', n:'You do', who:'Your own step, with Fab',          t:'Everyone works on their own step. Watch the help queue.' },
    stop: { e:'🌙', n:'A place to stop', who:'Finish the one you’re on. Your stars are going to Fab Fox World.', t:'Finish well. Praise the effort, then move to the next subject or the goodbye.' }
  };
  const PLANS = {
    '15': { n:'15-minute slot', m:[['ido', 4], ['wedo', 3], ['ydo', 7], ['stop', 1]] },
    '10': { n:'Low-energy 10-minute slot', m:[['ido', 3], ['wedo', 2], ['ydo', 4], ['stop', 1]] }
  };
  const MIN = 60000;
  let seenStamp = null, skew = 0, setup = false, lastPhaseSeen = null;

  const live = () => typeof Live !== 'undefined' && Live.on;
  const canControl = () => !(live() && !Live.isHost());
  const childLink = () => { try{ return !!new URLSearchParams(location.search).get('learner'); }catch(e){ return false; } };
  const T = () => (typeof Learn !== 'undefined' && Learn.pack && Learn.state && Learn.state._timer) || null;
  const plan = t => (PLANS[t.plan] || PLANS['15']).m;
  const hostNow = () => Date.now() - skew;

  function write(t){
    t.now = Date.now(); t.stamp = (t.stamp || 0) + 1;
    Learn.state._timer = t; seenStamp = t.stamp; skew = 0;
    paint(); try{ learnLivePush(); }catch(e){}
  }
  function left(t){ return t.paused != null ? t.paused : Math.max(0, t.end - hostNow()); }
  function start(p){ setup = false; write({ on:true, plan:p, i:0, end:Date.now() + plan({ plan:p })[0][1] * MIN, paused:null }); snd('ding'); }
  function next(t){
    const m = plan(t);
    if(t.i >= m.length - 1){ write(Object.assign({}, t, { i:m.length, paused:null, end:Date.now() })); snd('jingle'); return; }
    write(Object.assign({}, t, { i:t.i + 1, paused:null, end:Date.now() + m[t.i + 1][1] * MIN })); snd('ding');
  }

  function html(){
    const t = T(), ctl = canControl() && !childLink();
    if(!t || !t.on){
      if(!setup || !ctl) return '';
      return `<div class="lt-bar lt-setup" role="group" aria-label="Start a lesson timer"><b>⏱️ Start a timer for this subject</b>
        <div class="lt-ctl">${['15', '10'].map(k => `<button type="button" class="btn small ${k === '15' ? 'leaf' : 'soft'}" data-lt="start" data-plan="${k}">${h(PLANS[k].n)} <small>${PLANS[k].m.map(x => x[1]).join(' · ')}</small></button>`).join('')}
        <button type="button" class="btn small soft" data-lt="cancel">Not now</button></div>
        <p class="lt-note">I do · We do · You do · A place to stop. Children see the part we’re in and a soft bar, never a ticking clock.</p></div>`;
    }
    const m = plan(t), done = t.i >= m.length;
    const chips = m.map(([k], j) => `<li class="lt-ph ${j < t.i ? 'done' : j === t.i ? 'now' : ''}"><span aria-hidden="true">${PH[k].e}</span> ${h(PH[k].n)}</li>`).join('');
    if(done) return `<div class="lt-bar lt-over" role="status"><ol class="lt-phases">${chips}</ol><p class="lt-nowline"><b>🌙 This part of the lesson is finished.</b> Well done, everyone.</p>
      ${ctl ? `<div class="lt-ctl"><button type="button" class="btn small leaf" data-lt="again">Start another slot</button><button type="button" class="btn small soft" data-lt="end">Put the timer away</button></div>` : ''}</div>`;
    const k = m[t.i][0], P = PH[k];
    const lark = k === 'stop' && !document.querySelector('#lpStage .fab-char.lark');
    return `<div class="lt-bar" data-phase="${k}" role="status" aria-label="Lesson timer: ${h(P.n)}"><ol class="lt-phases">${chips}</ol>
      <div class="lt-track" aria-hidden="true"><i id="ltFill"></i></div>
      <div class="lt-row">${lark ? '<span class="fab-char lark lt-lark" role="img" aria-label="Mrs Lark"></span>' : ''}<p class="lt-nowline"><b>Now: ${h(P.n)}.</b> <span id="ltWho">${h(P.who)}</span></p>
      ${ctl ? `<div class="lt-ctl"><span class="lt-left" id="ltLeft"></span><button type="button" class="btn small soft" data-lt="pause">${t.paused != null ? '▶ Carry on' : '⏸ Pause'}</button><button type="button" class="btn small soft" data-lt="more">+1 min</button><button type="button" class="btn small leaf" data-lt="next">${t.i >= m.length - 1 ? 'Finish' : 'Next part ▶'}</button><button type="button" class="btn small soft" data-lt="end" aria-label="End the timer">✕</button></div>` : ''}</div>
      ${ctl ? `<p class="lt-note">${h(P.t)}</p>` : ''}</div>`;
  }

  function host(){
    let el = document.getElementById('lpTimer');
    if(!el){
      const head = document.querySelector('#screen-lesson .lp-head'); if(!head) return null;
      el = document.createElement('div'); el.id = 'lpTimer'; head.parentNode.insertBefore(el, head.nextSibling);
      el.addEventListener('click', onClick);
    }
    return el;
  }
  function button(){
    const tools = document.querySelector('#screen-lesson .lp-tools'); if(!tools) return;
    let b = document.getElementById('lpTimerBtn');
    if(!b){ b = document.createElement('button'); b.type = 'button'; b.id = 'lpTimerBtn'; b.className = 'btn small soft'; b.textContent = '⏱️ Timer'; tools.insertBefore(b, tools.firstChild);
      b.addEventListener('click', () => { const t = T(); if(t && t.on) return; setup = !setup; snd('tick'); paint(); }); }
    const t = T(), show = canControl() && !childLink() && !(t && t.on);
    b.hidden = !show;
    /* in a flightpath the lesson's own tool row is hidden, so the teacher view carries the button too */
    const row = document.querySelector('#lpStage .pw-guide-toggle');
    if(row && !show){ const old = row.querySelector('[data-ltopen]'); if(old) old.remove(); }
    if(row && show && !row.querySelector('[data-ltopen]')){
      const c = document.createElement('button'); c.type = 'button'; c.className = 'pill-choice lt-open'; c.dataset.ltopen = '1'; c.textContent = '⏱️ Timer';
      c.addEventListener('click', e => { e.stopPropagation(); setup = !setup; snd('tick'); paint(); const el = document.getElementById('lpTimer'); if(el && setup) el.scrollIntoView({ block:'nearest', behavior:'smooth' }); });
      row.appendChild(c);
    }
  }
  function paint(){
    const el = host(); if(!el) return;
    let t = T();
    /* a timer left over from an earlier visit (saved with a child's progress) is put away */
    if(t && t.on && !live() && t.paused == null && t.i < plan(t).length && t.end < Date.now() - 90000){ delete Learn.state._timer; t = null; }
    if(t && t.stamp !== seenStamp){ seenStamp = t.stamp; skew = canControl() ? 0 : Date.now() - (t.now || Date.now()); }
    if(!t){ seenStamp = null; }
    el.innerHTML = html(); button(); tick(true);
    /* a soft chime when the part changes on a child's screen */
    const ph = t && t.on ? t.i : null;
    if(ph !== lastPhaseSeen){ if(lastPhaseSeen != null && ph != null && !canControl()) snd('ding'); lastPhaseSeen = ph; }
  }
  function tick(quiet){
    const t = T(); if(!t || !t.on) return;
    const m = plan(t); if(t.i >= m.length) return;
    const total = m[t.i][1] * MIN, l = left(t);
    const fill = document.getElementById('ltFill'); if(fill) fill.style.width = Math.max(0, Math.min(100, 100 - 100 * l / Math.max(total, l || 1))) + '%';
    const lab = document.getElementById('ltLeft');
    if(lab) lab.textContent = t.paused != null ? 'Paused' : l <= MIN ? 'Under a minute' : 'About ' + Math.ceil(l / MIN) + ' min left';
    const who = document.getElementById('ltWho');
    if(who && m[t.i][0] === 'ydo' && l <= MIN && t.paused == null) who.textContent = 'Nearly time to stop. Finish the one you’re on.';
    if(!quiet && canControl() && !childLink() && t.paused == null && l <= 0) next(t);
  }
  function onClick(e){
    const b = e.target.closest('[data-lt]'); if(!b || !canControl()) return;
    const a = b.dataset.lt, t = T();
    if(a === 'start'){ start(b.dataset.plan); return; }
    if(a === 'cancel'){ setup = false; snd('tick'); paint(); return; }
    if(a === 'again'){ delete Learn.state._timer; setup = true; snd('tick'); paint(); try{ learnLivePush(); }catch(err){} return; }
    if(!t) return;
    if(a === 'end'){ delete Learn.state._timer; setup = false; snd('tick'); paint(); try{ learnLivePush(); }catch(err){} return; }
    if(a === 'pause'){ if(t.paused != null) write(Object.assign({}, t, { end:Date.now() + t.paused, paused:null })); else write(Object.assign({}, t, { paused:left(t) })); snd('tick'); return; }
    if(a === 'more'){ if(t.paused != null) write(Object.assign({}, t, { paused:t.paused + MIN })); else write(Object.assign({}, t, { end:Math.max(t.end, Date.now()) + MIN })); snd('tick'); return; }
    if(a === 'next'){ next(t); return; }
  }

  const CSS = `
#lpTimer:empty{display:none}
.lt-bar{max-width:1120px;margin:0 auto 10px;background:var(--cream,#FFF6E6);border:3px solid var(--ink,#2B1A12);border-radius:20px;padding:10px 14px;box-shadow:0 4px 0 rgba(43,26,18,.14);color:var(--ink,#2B1A12)}
body.lp-path .lt-bar{max-width:1500px}
.lt-phases{list-style:none;display:flex;flex-wrap:wrap;gap:8px;margin:0 0 8px;padding:0}
.lt-ph{flex:1 1 120px;text-align:center;border-radius:999px;padding:6px 10px;font:700 var(--t-body,1.05rem) var(--body,Aleo),Georgia,serif;background:#fff;border:2px solid var(--cream-deep,#f0dfbd);opacity:.7}
.lt-ph.done{background:#eef7e6;border-color:#b9d8a3;opacity:.85}.lt-ph.done::after{content:' ✓'}
.lt-ph.now{background:var(--sunshine,#FFD483);border-color:var(--flame,#FE4D02);opacity:1;box-shadow:0 0 0 3px rgba(254,77,2,.22)}
.lt-track{height:12px;border-radius:999px;background:#fff;border:2px solid var(--cream-deep,#f0dfbd);overflow:hidden;margin-bottom:8px}
.lt-track i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--golden,#F3BB17),var(--flame,#FE4D02));border-radius:999px;transition:width 1s linear}
.lt-bar[data-phase="stop"] .lt-track i{background:var(--sky,#3F6A8C)}
.lt-row{display:flex;flex-wrap:wrap;align-items:center;gap:10px}
.lt-nowline{margin:0;flex:1 1 260px;font-size:var(--t-lead,1.15rem)}
.lt-ctl{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.lt-ctl .btn small{font-weight:400;opacity:.8;margin-left:4px}
.lt-left{font-weight:700;background:#fff;border-radius:999px;padding:6px 12px;border:2px solid var(--cream-deep,#f0dfbd)}
.lt-note{margin:8px 0 0;font-size:var(--t-small,.95rem);opacity:.85}
.lt-setup b{display:block;margin-bottom:8px;font-size:var(--t-lead,1.15rem)}
.lt-lark.fab-char{width:54px;margin:0;flex:none}
#screen-lesson:has(.pw-centre) .lt-bar{padding:8px 12px;margin-bottom:8px}
#screen-lesson:has(.pw-centre) .lt-bar .lt-note{display:none}
#screen-lesson:has(.pw-centre) .lt-phases{margin-bottom:6px}
#screen-lesson:has(.pw-centre) .lt-ph{padding:3px 10px}
#screen-lesson:has(.pw-centre) .lt-track{height:8px;margin-bottom:6px}
@media (prefers-reduced-motion:reduce){.lt-track i{transition:none}}
`;
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

  /* repaint with every lesson redraw (including changes that arrive from the live Space) */
  if(typeof learnRenderView === 'function'){
    const base = learnRenderView;
    window.learnRenderView = function(){ base.apply(this, arguments); try{ paint(); }catch(e){} };
  }
  setInterval(() => { try{ if(document.getElementById('screen-lesson').classList.contains('active')) tick(false); }catch(e){} }, 1000);

  window.FabLessonTimer = { start, paint, state:T, PLANS, _left:() => { const t = T(); return t ? left(t) : null; }, _set:o => { const t = T(); if(t) write(Object.assign({}, t, o)); } };
})();
