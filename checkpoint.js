/* checkpoint.js — Checkpoints on a flightpath: a step can ask the child to show what they know
   (put a life cycle in order, or build a mind map) before the next step opens.
   The child hands it in, it is marked straight away with kind feedback, and passes appear on the
   staff page under "Celebrate" with a certificate and a short note for the child's own school.
   Pupil codes only. Free text a child types stays in the lesson; only the ideas it matched are kept.
   Everything stays on this device. Draft for BMF to check (AI and data policy, DPIA). */
(function(){
  'use strict';
  const h = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const arr = v => Array.isArray(v) ? v : (v && typeof v === 'object' ? Object.keys(v).sort((a, b) => a - b).map(k => v[k]) : []);
  const norm = s => ' ' + String(s || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
  const snd = k => { try{ Sound[k](); }catch(e){} };
  const KEY = 'fab-handins';
  const code = () => { try{ return fabLearnerCode() || 'local'; }catch(e){ return 'local'; } };
  const shuffle = a => { const b = a.slice(); for(let i = b.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

  /* ---------- the record of hand-ins on this device ---------- */
  const Store = {
    all(){ try{ const a = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a : []; }catch(e){ return []; } },
    save(a){ try{ localStorage.setItem(KEY, JSON.stringify(a.slice(-400))); }catch(e){} },
    add(r){ const a = this.all(); a.push(r); this.save(a); return r; },
    passed(c, pack, step){ return this.all().some(r => r.passed && r.code === c && r.pack === pack && r.step === step); },
    set(id, k, v){ const a = this.all(), r = a.find(x => x.id === id); if(r){ r[k] = v; this.save(a); } return r; }
  };

  function packId(){ return (typeof Learn !== 'undefined' && Learn.pack && Learn.pack.id) || 'x'; }
  function packTitle(){ return (typeof Learn !== 'undefined' && Learn.pack && Learn.pack.title) || ''; }
  function isPassed(kid, i){ return arr(kid.passed).includes(i) || Store.passed(code(), packId(), i); }

  function init(kid, stp){
    const c = stp.check;
    if(c.kind === 'cycle') kid.chk = { step:kid.step, kind:'cycle', placed:c.stages.map(() => -1), tray:(() => { let t; do{ t = shuffle(c.stages.map((_, i) => i)); }while(t.every((x, i) => x === i)); return t; })(), sel:-1, tries:0, res:null };
    else kid.chk = { step:kid.step, kind:'map', words:['', '', '', '', '', ''], tries:0, res:null };
  }

  /* Called after every right answer. Once a step with a checkpoint is secure, the checkpoint takes the place of "try the next step". */
  function afterRight(s, kid){
    const stp = s.steps[kid.step];
    if(!stp || !stp.check || kid.phase === 'check') return;
    if(!arr(kid.secured).includes(kid.step) || isPassed(kid, kid.step)) return;
    kid.offer = false; kid.phase = 'check'; kid.streak = 0;
    if(!kid.chk || kid.chk.step !== kid.step) init(kid, stp);
  }

  /* ---------- marking ---------- */
  function mark(stp, k){
    const c = stp.check;
    if(c.kind === 'cycle'){
      const n = c.stages.length, p = arr(k.placed);
      if(p.some(x => x < 0)) return { empty:true };
      /* a cycle has no fixed start: try every starting circle and keep the best */
      let best = 0, rot = 0;
      for(let r = 0; r < n; r++){ let m = 0; for(let i = 0; i < n; i++) if(p[i] === (i + r) % n) m++; if(m > best){ best = m; rot = r; } }
      const ok = p.map((x, i) => x === (i + rot) % n);
      return { score:best, of:n, passed:best === n, ok, ideas:[c.stages.map(s => s.w).join(' → ')] };
    }
    const groups = arr(c.groups), words = arr(k.words).map(norm), hit = [];
    groups.forEach((g, gi) => { if(words.some(w => w.trim() && arr(g.words).some(x => w.includes(' ' + String(x).toLowerCase() + ' ') || w.includes(' ' + String(x).toLowerCase() + 's ')))) hit.push(gi); });
    const need = c.need || Math.min(4, groups.length), filled = words.filter(w => w.trim()).length;
    if(!filled) return { empty:true };
    const boxOk = words.map(w => !!w.trim() && groups.some(g => arr(g.words).some(x => w.includes(' ' + String(x).toLowerCase() + ' ') || w.includes(' ' + String(x).toLowerCase() + 's '))));
    const miss = groups.find((g, gi) => !hit.includes(gi));
    return { score:hit.length, of:need, passed:hit.length >= need, ok:boxOk, ideas:hit.map(i => groups[i].label), prompt:miss ? miss.prompt : '' };
  }

  function handIn(s, st, id, kid){
    const stp = s.steps[kid.step], k = kid.chk, res = mark(stp, k);
    if(res.empty){ k.res = { empty:true }; snd('gentle'); return; }
    k.tries = (k.tries || 0) + 1; k.res = res;
    if(res.passed){
      const p = arr(kid.passed); if(!p.includes(kid.step)) p.push(kid.step); kid.passed = p;
      Store.add({ id:Date.now().toString(36) + Math.random().toString(36).slice(2, 6), code:code(), pack:packId(), packTitle:packTitle(), step:kid.step, stepName:stp.name,
        year:stp.year || '', title:stp.check.title, kind:stp.check.kind, score:res.score, of:res.of, tries:k.tries, ideas:res.ideas, objective:(stp.nc && stp.nc.objective) || '',
        passed:true, at:Date.now(), d:today(), how:'self' });
      try{ fabWorldAward(3); fabWorldTreasure('🏅'); }catch(e){}
      try{ FabImpact.log('handin', 'pass', { pack:packId(), step:stp.name }); }catch(e){}
      snd('jingle');
    } else snd('gentle');
  }

  /* ---------- the child's screen ---------- */
  function cycleHTML(c, k){
    const n = c.stages.length, R = 36, res = k.res && !k.res.empty ? k.res : null;
    const slot = i => {
      const a = -Math.PI / 2 + i / n * Math.PI * 2, x = 50 + R * Math.cos(a), y = 50 + R * Math.sin(a) * .92, v = k.placed[i];
      const st = c.stages[v], cls = res && res.ok ? (res.ok[i] ? 'ok' : 'fix') : '';
      return `<button type="button" class="fc-slot ${v >= 0 ? 'full' : ''} ${cls}" style="left:${x}%;top:${y}%" data-fcslot="${i}" aria-label="Circle ${i + 1}${st ? ': ' + h(st.w) : ', empty'}">
        ${st ? `<span class="fc-e">${h(st.e || '')}</span><span class="fc-w">${h(st.w)}</span>` : `<span class="fc-n">${i + 1}</span>`}</button>`;
    };
    const arrows = Array.from({ length:n }, (_, i) => { const a = -Math.PI / 2 + (i + .5) / n * Math.PI * 2, x = 50 + R * .98 * Math.cos(a), y = 50 + R * .98 * Math.sin(a) * .92, deg = (i + .5) / n * 360;
      return `<span class="fc-arrow" style="left:${x}%;top:${y}%;transform:translate(-50%,-50%) rotate(${deg}deg)" aria-hidden="true">➜</span>`; }).join('');
    const tray = arr(k.tray).filter(i => !k.placed.includes(i)).map(i => `<button type="button" class="fc-card ${k.sel === i ? 'sel' : ''}" data-fccard="${i}"><span class="fc-e">${h(c.stages[i].e || '')}</span>${h(c.stages[i].w)}</button>`).join('');
    return `<div class="fc-cycle">${arrows}${c.centre ? `<span class="fc-centre" aria-hidden="true">${h(c.centre)}</span>` : ''}${Array.from({ length:n }, (_, i) => slot(i)).join('')}</div>
      <div class="fc-tray" aria-label="Cards to place">${tray || '<span class="fc-done">All the cards are in place.</span>'}</div>`;
  }
  function mapHTML(c, k){
    const res = k.res && !k.res.empty ? k.res : null;
    const box = i => `<label class="fc-box b${i} ${res && k.words[i] ? (res.ok[i] ? 'ok' : 'fix') : ''}"><span class="sr">Idea ${i + 1}</span><input type="text" maxlength="40" data-fcword="${i}" value="${h(k.words[i] || '')}" placeholder="Idea ${i + 1}" autocomplete="off" spellcheck="true"></label>`;
    return `<div class="fc-map"><div class="fc-hub">${h(c.centre || c.title)}</div>${[0, 1, 2, 3, 4, 5].map(box).join('')}</div>
      ${c.bank ? `<div class="fc-bank"><b>Low-energy version: tap a word to add it</b><div>${arr(c.bank).map(w => `<button type="button" class="fc-chip" data-fcbank="${h(w)}">${h(w)}</button>`).join('')}</div></div>` : ''}`;
  }
  function feedbackHTML(stp, k){
    const r = k.res; if(!r) return '';
    if(r.empty) return `<div class="fab-say doc"><span class="fab-char doc" role="img" aria-label="Doctor McPhee"></span><div class="bubble"><b>Nothing to hand in yet.</b>${stp.check.kind === 'cycle' ? 'Put a card in each circle first.' : 'Add at least one idea first.'}</div></div>`;
    if(r.passed) return `<div class="fc-pass"><div class="fab-say"><span class="fab-char elder" role="img" aria-label="Mr Elder, the head teacher"></span><div class="bubble"><b>Handed in and marked: ${r.score} out of ${r.of}. Brilliant!</b>
      ${stp.check.kind === 'cycle' ? 'Every stage is in the right order.' : 'You thought of ' + h(r.ideas.join(', ')) + '.'} Your teacher will see this, and you earned 3 stars and a 🏅 for Fab Fox World.</div></div>
      <div class="choice-row"><button class="btn leaf" data-fcact="next">${k.step < (stp._last || 0) ? 'On to the next step ➡️' : 'Back to practice'}</button></div></div>`;
    const fix = stp.check.kind === 'cycle'
      ? `${r.score} of ${r.of} are in the right place (they have a green tick). ${h(stp.check.hint || 'Start with the very first stage and follow the arrows.')}`
      : `You have ${r.score} of the ${r.of} ideas I'm looking for${r.ideas.length ? ' (' + h(r.ideas.join(', ')) + ')' : ''}. ${h(r.prompt || 'Can you add another idea?')}`;
    return `<div class="fab-say doc"><span class="fab-char doc" role="img" aria-label="Doctor McPhee"></span><div class="bubble"><b>Nearly there. Let’s fix it together.</b>${fix}</div></div>`;
  }
  function html(s, st, kid){
    const stp = s.steps[kid.step], c = stp.check;
    if(!kid.chk || kid.chk.step !== kid.step) init(kid, stp);
    const k = kid.chk; stp._last = s.steps.length - 1;
    const done = k.res && k.res.passed;
    const side = `<div class="pw-drawer-back" data-pwdrawer-close aria-hidden="true"></div><aside class="pw-side" id="pwDrawer" aria-label="My flightpath"><div class="pw-side-head"><div class="pw-side-title">My flightpath</div><button type="button" class="pw-drawer-x" data-pwdrawer-close aria-label="Close My flightpath">✕</button></div>${pwLadderHTML(s, kid, false)}${pwCollectionHTML(s, kid)}</aside>`;
    return `<div class="pw-child has-board fc-wrap"><div class="pw-main fc-main">
      <div class="pw-stephead"><span class="pw-steptag fc-tag">🚧 Checkpoint</span> ${h(c.title)}</div><button type="button" class="pw-pathbtn" data-pwdrawer aria-controls="pwDrawer">🗺️ My flightpath</button>
      ${done ? '' : `<div class="fab-say fc-you"><span class="fab-char fab" role="img" aria-label="Fab"></span><div class="bubble"><b>Your turn to show what you know</b>${h(c.task || (c.kind === 'cycle' ? 'Tap a card, then tap the circle where it goes. Follow the arrows round.' : 'Write an idea in each box, or tap the words below.'))} When you’re happy, hand it in. The next step opens when it’s done.</div></div>`}
      <div class="fc-fb" aria-live="polite">${feedbackHTML(stp, k)}</div>
      ${done ? '' : `<div class="choice-row fc-hand"><button class="btn big leaf" data-fcact="handin">📮 Hand it in</button></div>`}
      <div class="pw-flags">
        ${done ? '' : `<button class="btn small soft" data-fcact="clear">🔄 Start again</button>`}
        <button class="btn small ${kid.help ? 'amber' : 'soft'}" data-pwact="help">${kid.help ? '✋ Your teacher knows' : '🙋 Do it with my teacher'}</button>
        <button class="btn small soft" data-pwact="rest">😴 I need a break</button>
        ${done ? '' : '<button class="btn small soft" data-fcact="back">⬅️ More practice first</button>'}
      </div>
    </div><section class="fc-board" aria-label="Checkpoint activity"><div class="fc-board-title">${h(c.title)}</div>${c.kind === 'cycle' ? cycleHTML(c, k) : mapHTML(c, k)}</section>${side}</div>`;
  }

  function nextStep(s, st, me, kid){
    const keep = kid.done, passed = arr(kid.passed);
    if(kid.step < s.steps.length - 1){ pwStart(s, st, me, kid.step + 1); }
    else { kid.phase = 'ydo'; kid.chk = null; kid.q = pwQuestion(s.steps[kid.step]); }
    const nk = st.kids[me]; nk.done = keep; nk.passed = passed;
    try{ pwOpenStage = null; }catch(e){}
  }

  /* returns true (handled, redraw), false (handled, no redraw) or null (not ours) */
  function click(t, s, st, me){
    const mk = t.closest('[data-fcmark]');
    if(mk && pwIsTeacher(st)){
      const k = st.kids && st.kids[mk.dataset.fcmark]; if(!k) return false;
      const stp = s.steps[k.step];
      const p = arr(k.passed); if(!p.includes(k.step)) p.push(k.step); k.passed = p;
      Store.add({ id:Date.now().toString(36) + Math.random().toString(36).slice(2, 6), code:/^[a-z]{2,12}-\d{3}$/.test(mk.dataset.fcmark) ? mk.dataset.fcmark : code(), pack:packId(), packTitle:packTitle(), step:k.step, stepName:stp.name,
        year:stp.year || '', title:stp.check.title, kind:stp.check.kind, score:null, of:null, tries:0, ideas:[], objective:(stp.nc && stp.nc.objective) || '', passed:true, at:Date.now(), d:today(), how:'teacher' });
      if(!k.chk || k.chk.step !== k.step) init(k, stp);
      k.chk.res = { passed:true, score:'✓', of:'✓', ideas:['done with the teacher'], ok:[] }; k.help = false;
      snd('jingle'); return true;
    }
    const kid = st.kids && st.kids[me];
    if(!kid || kid.phase !== 'check' || !kid.chk) return null;
    const stp = s.steps[kid.step], k = kid.chk;
    const a = t.closest('[data-fcact]');
    if(a){
      const v = a.dataset.fcact;
      if(v === 'handin'){ handIn(s, st, me, kid); return true; }
      if(v === 'clear'){ init(kid, stp); snd('tick'); return true; }
      if(v === 'back'){ kid.phase = 'ydo'; kid.stepDone = 0; kid.last = null; kid.q = pwQuestion(stp); snd('tick'); return true; }
      if(v === 'next'){ nextStep(s, st, me, kid); snd('jingle'); return true; }
    }
    if(k.res && k.res.passed) return null;
    const card = t.closest('[data-fccard]');
    if(card){ const i = Number(card.dataset.fccard); k.sel = k.sel === i ? -1 : i; snd('tick'); return true; }
    const slot = t.closest('[data-fcslot]');
    if(slot){
      const i = Number(slot.dataset.fcslot), p = arr(k.placed);
      if(k.sel >= 0){ const was = p.indexOf(k.sel); if(was >= 0) p[was] = -1; p[i] = k.sel; k.sel = -1; }
      else if(p[i] >= 0){ k.sel = p[i]; p[i] = -1; }
      k.placed = p; if(k.res && !k.res.passed) k.res = null; snd('tick'); return true;
    }
    const chip = t.closest('[data-fcbank]');
    if(chip){
      const w = arr(k.words), i = w.findIndex(x => !String(x || '').trim());
      if(i < 0 || w.some(x => norm(x) === norm(chip.dataset.fcbank))) return false;
      w[i] = chip.dataset.fcbank; k.words = w; if(k.res && !k.res.passed) k.res = null; snd('tick'); return true;
    }
    if(t.closest('[data-fcword]')) return false;
    return null;
  }

  /* Typing into a mind-map box is kept without redrawing, so the cursor stays put. */
  document.addEventListener('input', e => {
    const el = e.target.closest && e.target.closest('[data-fcword]'); if(!el) return;
    try{
      const st = Learn.state[Learn.step], kid = st && st.kids && st.kids[pwMe()];
      if(kid && kid.chk){ const w = arr(kid.chk.words); w[Number(el.dataset.fcword)] = el.value.slice(0, 40); kid.chk.words = w; el.closest('.fc-box').classList.remove('ok', 'fix'); }
    }catch(err){}
  });
  document.addEventListener('keydown', e => {
    const el = e.target.closest && e.target.closest('[data-fcword]'); if(!el) return;
    e.stopPropagation();
    if(e.key === 'Enter'){ e.preventDefault(); const nx = document.querySelector(`[data-fcword="${Number(el.dataset.fcword) + 1}"]`); if(nx) nx.focus(); }
  }, true);

  /* ---------- teacher view ---------- */
  function teacherLine(k, stp, id){
    if(!stp || !stp.check) return '';
    const passed = arr(k.passed).includes(k.step);
    if(passed){ const r = k.chk && k.chk.res; return `<div class="pw-card-hint">🏅 Checkpoint handed in${r && r.score != null && r.score !== '✓' ? `: ${r.score}/${r.of}` : ''} ✓</div>`; }
    if(k.phase !== 'check') return `<div class="pw-card-hint">🚧 Checkpoint after this step: ${h(stp.check.title)}</div>`;
    const tr = k.chk && k.chk.tries ? ` · handed in ${k.chk.tries} time${k.chk.tries === 1 ? '' : 's'}, not yet` : '';
    return `<div class="pw-card-hint">🚧 On the checkpoint${tr}</div><div class="pw-card-btns"><button class="btn small leaf" data-fcmark="${h(id)}">🏅 Mark done (did it with me)</button></div>`;
  }

  /* ---------- staff page: Celebrate ---------- */
  function celebrateHTML(){
    const a = Store.all().filter(r => r.passed).sort((x, y) => y.at - x.at);
    const fresh = a.filter(r => !r.praised).length;
    const animal = c => { const w = String(c).split('-')[0]; return (typeof PUPIL_EMOJI !== 'undefined' && PUPIL_EMOJI[w]) || '🦊'; };
    const row = r => `<li class="fc-cel ${r.praised ? 'praised' : ''}"><div class="fc-cel-top"><b>${animal(r.code)} ${h(r.code)}</b> <span>${h(new Date(r.at).toLocaleDateString('en-GB', { day:'numeric', month:'short' }))}</span></div>
      <div class="fc-cel-what">🏅 ${h(r.title)}${r.score != null ? ` · ${r.score}/${r.of}` : ''}${r.how === 'teacher' ? ' · done with the teacher' : r.tries === 1 ? ' · first go' : ` · after ${r.tries} tries`}</div>
      <div class="fc-cel-sub">${h(r.packTitle)} · ${h(r.stepName)}${r.year ? ' · ' + h(r.year) : ''}</div>
      <div class="st-row"><button type="button" class="btn small leaf" data-celcert="${h(r.id)}">🏅 Certificate</button><button type="button" class="btn small soft" data-celnote="${h(r.id)}">🏫 Note for school</button><button type="button" class="btn small ${r.praised ? 'soft' : 'amber'}" data-celdone="${h(r.id)}">${r.praised ? '✓ Praised' : 'Mark as praised'}</button></div></li>`;
    return `<div class="me-card" id="celCard"><h2>🎉 Celebrate${fresh ? ` <span class="fc-new">${fresh} new</span>` : ''}</h2>
      <p>Checkpoints children have handed in and passed on this device. Praise them, print a certificate, or send a short note to their school.</p>
      ${a.length ? `<ul class="fc-cels">${a.slice(0, 40).map(row).join('')}</ul>` : '<p class="hint">Nothing yet. When a child passes a checkpoint in a Learning flightpath, it appears here.</p>'}
      <p class="hint">Only the pupil code and what was achieved are kept, never a name or what the child typed. Alerts to other staff need a shared database later (for example Beacon).</p>
      <div id="celOut"></div></div>`;
  }
  function schoolNote(r){
    const obj = String(r.objective || '').replace(/\s*\(to be checked[^)]*\)\s*$/i, '').replace(/\.$/, '');
    return `Hello,\n\nA quick update from BeMoreFab's Primary Virtual School. This week your pupil completed a learning checkpoint: “${r.title}” (${r.packTitle}${r.year ? ', ' + r.year : ''}).${obj ? `\n\nThis links to the National Curriculum objective: ${obj}.` : ''}\n\n${r.how === 'teacher' ? 'They completed it with their BMF teacher.' : `They handed it in and it was marked ${r.score} out of ${r.of}${r.tries === 1 ? ', on their first go' : ''}.`} We're really proud of them.\n\nWith best wishes,\nBMF Primary Virtual School`;
  }
  function certHTML(r){
    return `<div class="fc-cert-wrap" role="dialog" aria-label="Certificate"><div class="fc-cert" id="fcCert">
      <div class="fc-cert-band"></div><img class="fc-cert-fox" src="" alt="" aria-hidden="true">
      <h2>Certificate of Achievement</h2><p class="fc-cert-for">This certificate is for</p>
      <input class="fc-cert-name" aria-label="Write the child's name (it is not saved)" placeholder="write the name here">
      <p class="fc-cert-did">for completing the checkpoint</p><p class="fc-cert-title">🏅 ${h(r.title)}</p>
      <p class="fc-cert-sub">${h(r.packTitle)}${r.year ? ' · ' + h(r.year) : ''} · ${h(new Date(r.at).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' }))}</p>
      <div class="fc-cert-sign"><span class="fab-char elder" aria-hidden="true"></span><div>Mr Elder says: well done!<br><small>BMF Primary Virtual School</small></div></div></div>
      <div class="st-row fc-cert-btns"><button type="button" class="btn leaf" data-celprint>🖨️ Print or save as PDF</button><button type="button" class="btn soft" data-celclose>Close</button></div>
      <p class="hint fc-cert-btns">The name you type is only on this page. It isn't saved.</p></div>`;
  }
  function celebrateWire(box, redraw){
    const out = box.querySelector('#celOut'); if(!out) return;
    box.querySelectorAll('[data-celdone]').forEach(b => b.addEventListener('click', () => { const r = Store.all().find(x => x.id === b.dataset.celdone); Store.set(b.dataset.celdone, 'praised', !(r && r.praised)); snd('tick'); redraw(); }));
    box.querySelectorAll('[data-celnote]').forEach(b => b.addEventListener('click', () => {
      const r = Store.all().find(x => x.id === b.dataset.celnote); if(!r) return; const t = schoolNote(r);
      out.innerHTML = `<h3>Note for the child's school</h3><textarea class="fc-note" rows="9" aria-label="Note for the child's school">${h(t)}</textarea><div class="st-row"><button type="button" class="btn small leaf" data-celcopy>Copy note</button></div><p class="hint">Add the child's name yourself when you send it from your secure email or Beacon.</p>`;
      out.querySelector('[data-celcopy]').addEventListener('click', e => { const ta = out.querySelector('textarea'); try{ navigator.clipboard.writeText(ta.value); e.target.textContent = 'Copied ✓'; }catch(err){ ta.select(); e.target.textContent = 'Press Ctrl+C'; } });
      out.scrollIntoView({ block:'nearest', behavior:'smooth' }); snd('tick');
    }));
    box.querySelectorAll('[data-celcert]').forEach(b => b.addEventListener('click', () => {
      const r = Store.all().find(x => x.id === b.dataset.celcert); if(!r) return;
      document.querySelectorAll('.fc-cert-wrap').forEach(x => x.remove());
      const d = document.createElement('div'); d.innerHTML = certHTML(r); const w = d.firstElementChild; document.body.appendChild(w);
      w.querySelector('[data-celclose]').addEventListener('click', () => w.remove());
      w.querySelector('[data-celprint]').addEventListener('click', () => { document.body.classList.add('fc-printing'); setTimeout(() => { window.print(); setTimeout(() => document.body.classList.remove('fc-printing'), 400); }, 60); });
      w.querySelector('.fc-cert-name').focus(); snd('ding');
    }));
  }

  const CSS = `
.pw-child.has-board.fc-wrap{display:grid;grid-template-columns:minmax(280px,.85fr) minmax(0,1.35fr);gap:16px;align-items:start}
.pw-child.has-board.fc-wrap > .fc-board{grid-column:2;grid-row:1}
.fc-main{text-align:left}.fc-main .pw-stephead{text-align:left}
.fc-tag{background:var(--amber,#e0a63a)!important}
.fc-you .bubble b,.fc-fb .bubble b{display:block;margin-bottom:2px}
.fc-fb{margin:10px 0;min-height:8px}
.fc-hand{justify-content:flex-start;margin:6px 0 4px}
.fc-board{background:#fffdf6;border:3px solid var(--leaf,#4F7A2E);border-radius:22px;padding:14px;box-shadow:0 4px 0 rgba(43,26,18,.12);min-width:0}
.fc-board-title{font-family:var(--headline,Canda),var(--disp);font-size:var(--t-head,1.6rem);color:var(--flame-dark,#C93C00);text-align:center;margin:0 0 6px}
.fc-cycle{position:relative;width:100%;max-width:560px;aspect-ratio:1/0.92;margin:0 auto}
.fc-slot{position:absolute;transform:translate(-50%,-50%);width:clamp(96px,24%,140px);aspect-ratio:1;border-radius:50%;border:4px dashed var(--leaf,#4F7A2E);background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font:700 1.05rem var(--body,Aleo),Georgia,serif;color:var(--ink,#2B1A12);cursor:pointer;padding:4px}
.fc-slot.full{border-style:solid;background:#f3fbe9}
.fc-slot.ok{border-color:#3e9b3a;box-shadow:0 0 0 5px rgba(62,155,58,.25)}.fc-slot.ok::after{content:'✓';position:absolute;top:-6px;right:-2px;background:#3e9b3a;color:#fff;border-radius:50%;width:28px;height:28px;display:grid;place-items:center;font-size:1rem}
.fc-slot.fix{border-color:var(--amber,#e0a63a);background:#fff7dd}
.fc-n{font-size:1.6rem;opacity:.35}.fc-e{font-size:2.1rem;line-height:1}.fc-w{font-size:1rem;text-align:center;line-height:1.1}
.fc-arrow{position:absolute;font-size:1.8rem;color:#b89a6a;pointer-events:none}
.fc-centre{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:3.2rem;opacity:.85}
.fc-tray{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:10px;min-height:64px}
.fc-card{border:3px solid var(--ink,#2B1A12);background:var(--cream,#FFF6E6);border-radius:16px;padding:8px 14px;font:700 1.1rem var(--body,Aleo),Georgia,serif;color:var(--ink,#2B1A12);cursor:pointer;display:flex;align-items:center;gap:8px;min-height:56px;box-shadow:0 3px 0 rgba(43,26,18,.18)}
.fc-card .fc-e{font-size:1.6rem}.fc-card.sel{background:var(--sunshine,#FFD483);transform:translateY(-3px);box-shadow:0 0 0 4px rgba(254,77,2,.45)}
.fc-done{font-weight:700;opacity:.7;align-self:center}
.fc-map{display:grid;grid-template-columns:1fr 1fr 1fr;grid-template-rows:auto auto auto;gap:12px;align-items:center;max-width:640px;margin:0 auto;position:relative}
.fc-hub{grid-column:2;grid-row:2;background:var(--flame,#FE4D02);color:#fff;border-radius:50%;aspect-ratio:1;display:grid;place-items:center;text-align:center;font:700 1.15rem var(--body,Aleo),Georgia,serif;padding:10px;box-shadow:0 4px 0 rgba(43,26,18,.2)}
.fc-box{display:block;position:relative}.fc-box input{width:100%;box-sizing:border-box;min-height:58px;border-radius:16px;border:3px solid #d9c9a8;background:#fff;padding:8px 10px;font:700 1.05rem var(--body,Aleo),Georgia,serif;color:var(--ink,#2B1A12);text-align:center}
.fc-box input:focus{outline:none;border-color:var(--flame,#FE4D02)}
.fc-box.ok input{border-color:#3e9b3a;background:#f0faea}.fc-box.fix input{border-color:var(--amber,#e0a63a);background:#fff7dd}
.fc-box.b0{grid-column:1;grid-row:1}.fc-box.b1{grid-column:2;grid-row:1}.fc-box.b2{grid-column:3;grid-row:1}.fc-box.b3{grid-column:1;grid-row:3}.fc-box.b4{grid-column:2;grid-row:3}.fc-box.b5{grid-column:3;grid-row:3}
.fc-bank{margin-top:12px;text-align:center}.fc-bank b{display:block;font-size:.95rem;margin-bottom:6px;opacity:.8}.fc-bank div{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.fc-chip{border:2px solid var(--ink,#2B1A12);background:#fff;border-radius:999px;padding:8px 14px;font:700 1rem var(--body,Aleo),Georgia,serif;cursor:pointer;min-height:48px}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.fc-pass .bubble{background:#fffbe6}
@media (max-width:860px){.pw-child.has-board.fc-wrap{grid-template-columns:1fr}.pw-child.has-board.fc-wrap > .fc-board{grid-column:1;grid-row:1}.pw-child.has-board.fc-wrap > .pw-main{grid-row:2}}
.fc-new{background:var(--flame,#FE4D02);color:#fff;border-radius:999px;padding:2px 10px;font-size:.9rem;vertical-align:middle}
.fc-cels{list-style:none;padding:0;margin:8px 0;display:grid;gap:10px}
.fc-cel{background:#fff;border-radius:14px;padding:10px 12px;border-left:8px solid var(--amber,#e0a63a)}.fc-cel.praised{border-left-color:#3e9b3a;opacity:.85}
.fc-cel-top{display:flex;justify-content:space-between;gap:8px}.fc-cel-what{font-weight:700;margin-top:2px}.fc-cel-sub{font-size:.9rem;opacity:.8}
.fc-note{width:100%;box-sizing:border-box;font:1rem/1.45 var(--body,Aleo),Georgia,serif;border-radius:12px;border:2px solid #e6d8b8;padding:10px}
.fc-cert-wrap{position:fixed;inset:0;z-index:2000;background:rgba(43,26,18,.82);backdrop-filter:blur(4px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px;overflow:auto}
.fc-cert-wrap .hint{color:#fff}
.fc-cert{position:relative;width:min(760px,94vw);aspect-ratio:1.414;background:#FFF6E6;border:10px solid var(--flame,#FE4D02);border-radius:18px;box-shadow:inset 0 0 0 6px #F3BB17;text-align:center;padding:4% 6%;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#2B1A12}
.fc-cert h2{font-family:var(--headline,Canda),serif;font-size:clamp(1.8rem,5vw,3rem);color:#C93C00;margin:0 0 4px}
.fc-cert-for,.fc-cert-did{margin:4px 0;font-size:1.1rem}
.fc-cert-name{border:0;border-bottom:3px dashed #C93C00;background:transparent;font:700 clamp(1.4rem,4vw,2.2rem) var(--body,Aleo),Georgia,serif;text-align:center;width:70%;color:#2B1A12}
.fc-cert-title{font:700 clamp(1.2rem,3.2vw,1.7rem) var(--body,Aleo),Georgia,serif;margin:6px 0}
.fc-cert-sub{opacity:.8;margin:2px 0 8px}
.fc-cert-sign{display:flex;align-items:center;gap:12px;text-align:left;font-weight:700}.fc-cert-sign .fab-char{width:76px;margin:0}
.fc-cert-fox{display:none}
@media print{body.fc-printing > *:not(.fc-cert-wrap){display:none!important}body.fc-printing .fc-cert-wrap{position:static;background:none;padding:0}body.fc-printing .fc-cert-btns{display:none!important}body.fc-printing .fc-cert{width:100%;box-shadow:inset 0 0 0 6px #F3BB17;-webkit-print-color-adjust:exact;print-color-adjust:exact}body.fc-printing .fc-cert-name{border-bottom-color:transparent}}
`;
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

  window.FabCheck = { afterRight, html, click, teacherLine, celebrateHTML, celebrateWire, mark, Store, isPassed };
})();
