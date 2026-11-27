/* teacher.js — the Teachers' area (first version, 27 Nov 2026).
   Patrick: "an admin/teacher area that allows us to quick assign tasks or whole topics ... monitor progress, celebrate children,
   print certificates", with "a quick access button on the app landing page".
   What it is: one page for teachers, opened from the landing page.
     - My classes: named groups of Fab codes (Adventurers, Pioneers), kept in this browser only.
     - Quick assign: one flightpath, topic, activity, challenge or well done for a whole class; one link per child. A class link ADDS to
       what a child already has in their Burrow.
     - Progress and certificates: what this device holds for each Fab code, with a certificate for anything earned.
   What it is not, yet: a sign-in, or one place that shows every child. There is no server. Each child's progress lives in their own
   viewer, so a teacher sees it by opening this page on that viewer. Seeing everyone at once needs progress saved online (a BMF decision:
   DPIA, privacy notice). The door is two taps on a child's viewer: it keeps a child out by accident, it is not a lock.
   Fab codes only. Never a child's name. Loaded after burrow.js, checkpoint.js, me.js and classroom.js. */
(function(){
  'use strict';
  const h = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const arr = v => Array.isArray(v) ? v : [];
  const snd = k => { try{ Sound[k](); }catch(e){} };
  const CODE_RE = /^[a-z]{2,12}-\d{3}$/;
  const ls = { json(k, f){ try{ const v = JSON.parse(localStorage.getItem(k)); return v == null ? f : v; }catch(e){ return f; } }, set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} } };
  const B = () => window.FabBurrow;
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const me = () => { try{ return (typeof fabLearnerCode === 'function' && fabLearnerCode()) || ''; }catch(e){ return ''; } };
  const ic = (name, emoji) => { try{ if(window.FabIcon && FabIcon.names.includes(name)) return FabIcon.svg(name); }catch(e){} return `<span aria-hidden="true">${emoji}</span>`; };
  const parse = t => [...new Set(String(t || '').toLowerCase().split(/[\s,;]+/).map(x => x.replace(/[^a-z0-9-]/g, '').slice(0, 20)).filter(Boolean))];
  const cleanName = v => String(v || '').replace(/[^A-Za-z0-9 &'’-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 24);
  const TERMS = ['Autumn 1', 'Autumn 2', 'Spring 1', 'Spring 2', 'Summer 1', 'Summer 2'];

  /* ---------- my classes (this browser only) ---------- */
  const CK = 'fab-teach-classes', LK = 'fab-teach-log';
  const classes = () => arr(ls.json(CK, [])).filter(c => c && c.n).map(c => ({ n:cleanName(c.n), codes:arr(c.codes).filter(x => CODE_RE.test(x)) }));
  const saveClasses = a => ls.set(CK, a.slice(0, 12));

  const T = { cls:0, one:'', what:'', step:'own', text:'', label:'', day:'', note:'', links:[], msg:'', edit:null, en:'', ec:'', emsg:'', rm:-1, open:'', own:'' };

  /* ---------- what can be assigned ---------- */
  function whatOptions(){
    const P = B() ? B().paths() : [], A = B() ? B().acts.filter(a => a.id) : [];
    const topics = A.filter(a => a.id.indexOf('explore:') === 0), acts = A.filter(a => a.id.indexOf('explore:') !== 0);
    const o = (v, t) => `<option value="${h(v)}" ${T.what === v ? 'selected' : ''}>${h(t)}</option>`;
    return `<option value="" ${T.what ? '' : 'selected'}>Choose…</option>
      <optgroup label="A whole topic (Explorer Worlds)">${topics.map(a => o('a:' + a.id, a.n.replace('Explorer Worlds: ', ''))).join('')}</optgroup>
      <optgroup label="A flightpath">${P.map(p => o('p:' + p.id, p.title + (p.years ? ' (' + p.years + ')' : ''))).join('')}</optgroup>
      <optgroup label="An activity in the app">${acts.map(a => o('a:' + a.id, a.n)).join('')}</optgroup>
      <optgroup label="In your own words">${o('c', 'A challenge in my own words')}${o('k', 'A well done for the whole class')}</optgroup>`;
  }
  function whatName(){
    if(T.what === 'c') return T.text; if(T.what === 'k') return 'Well done: ' + T.text;
    const [k, id] = [T.what.slice(0, 1), T.what.slice(2)];
    if(k === 'p'){ const p = B().packById(id); return p ? p.title : ''; }
    const a = B().acts.find(x => x.id === id); return a ? a.n + (T.text ? ': ' + T.text : '') : '';
  }
  function targets(){ const C = classes(); if(T.cls === 'one') return CODE_RE.test(T.one) ? [T.one] : []; const c = C[Number(T.cls)]; return c ? c.codes : []; }
  function makeLinks(){
    const codes = targets(), k = T.what.slice(0, 1), id = T.what.slice(2), d = T.day || today();
    if(!B()) return 'The Burrow is not ready on this page. Reload and try again.';
    if(!codes.length) return T.cls === 'one' ? 'Type a Fab code first: an animal, a dash and three numbers, like otter-482. Never a name.' : 'Add a class with at least one Fab code first.';
    if(!T.what) return 'Choose what to set first.';
    if((T.what === 'c' || T.what === 'k') && !T.text.trim()) return T.what === 'k' ? 'Say what the well done is for, in a few words.' : 'Type the challenge first, in a few words.';
    let rows = [], opt = { cls:true, merge:true, extras:[] };
    if(k === 'p') rows = [{ p:id, s:T.step === 'own' ? null : Number(T.step) || 0, d, n:T.note, th:T.label }];
    else if(k === 'a') opt.extras = [{ a:id, t:T.text, n:T.note, th:T.label, d }];
    else if(T.what === 'c') opt.extras = [{ a:'', t:T.text, n:T.note, th:T.label, d }];
    else if(T.what === 'k') opt.praise = T.text;
    T.links = codes.map(c => ({ c, l:B().linkFor(c, rows, [], opt) }));
    const C = classes(), cn = T.cls === 'one' ? T.one : (C[Number(T.cls)] || {}).n || '';
    const log = arr(ls.json(LK, [])); log.unshift({ t:Date.now(), c:cn, w:whatName().slice(0, 80), l:T.label, n:codes.length }); ls.set(LK, log.slice(0, 20));
    return '';
  }

  /* ---------- what this device knows about a Fab code ---------- */
  function knownCodes(){
    const out = new Set(); const m = me(); if(CODE_RE.test(m)) out.add(m);
    try{ for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i) || ''; const c = k.indexOf('fab-burrow-') === 0 ? k.slice(11) : k.indexOf('fabimpact-') === 0 ? k.slice(10) : ''; if(CODE_RE.test(c)) out.add(c); } }catch(e){}
    try{ FabCheck.Store.all().forEach(r => { if(CODE_RE.test(r.code)) out.add(r.code); }); }catch(e){}
    return [...out].sort();
  }
  function look(code){
    const b = B(), paths = [], earned = [];
    b.paths().forEach(p => { const pr = b.progress(code, p), po = b.pathOf(p); if(!pr) return;
      paths.push({ t:p.title, step:pr.step + 1, sec:pr.secured.length, n:pr.n });
      pr.secured.slice().sort((x, y) => x - y).forEach(i => { const st = po.s.steps[i]; if(st) earned.push({ did:'for climbing a step on the flightpath', t:'Step ' + (i + 1) + ': ' + st.name, s:p.title + (st.year ? ' · ' + st.year : '') }); }); });
    let checks = []; try{ checks = FabCheck.Store.all().filter(r => r.passed && r.code === code); }catch(e){}
    checks.forEach(r => earned.push({ did:'for completing the checkpoint', t:r.title, s:r.packTitle + (r.year ? ' · ' + r.year : '') }));
    const bw = b.read(code); let set = 0, done = 0;
    bw.items.forEach(it => { set++; if(b.status(code, it).done) done++; });
    bw.extras.forEach(x => { set++; if(x.dn){ done++; earned.push({ did:'for finishing', t:b.extraTitle(x), s:x.th || 'Set by your teacher' }); } });
    let stars = 0, days = 0, last = 0; try{ const s = FabImpact.summary(code); stars = s.stars; days = s.days; last = s.last; }catch(e){}
    let made = 0; try{ made = b.made(code).length; }catch(e){}
    return { code, paths, earned, set, done, stars, days, last, checks:checks.length, made };
  }

  /* ---------- certificates (the look of the checkpoint certificate; the name is typed or written by hand and never saved) ---------- */
  function certHTML(code, e){
    const d = new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' });
    return `<div class="fc-cert-wrap" role="dialog" aria-label="Certificate"><div class="fc-cert" id="tcCert">
      <div class="fc-cert-band"></div>
      <h2>Certificate of Achievement</h2><p class="fc-cert-for">This certificate is for</p>
      <input class="fc-cert-name" aria-label="Write the child's name, or leave it empty and write it by hand (it is not saved)" placeholder="write the name here">
      <p class="fc-cert-did">${h(e.did)}</p><p class="fc-cert-title">${ic('star', '🏅')} ${h(e.t)}</p>
      <p class="fc-cert-sub">${e.s ? h(e.s) + ' · ' : ''}${h(d)}</p>
      <div class="fc-cert-sign"><span class="fab-char elder" aria-hidden="true"></span><div>Mr Elder says: well done!<br><small>BeMoreFab Virtual School</small></div></div></div>
      <div class="st-row fc-cert-btns"><button type="button" class="btn leaf" data-tcprint>Print or save as PDF</button><button type="button" class="btn soft" data-tcclose>Close</button></div>
      <p class="hint fc-cert-btns">The name you type is only on this page and is never saved. You can also leave it empty and write it by hand.</p></div>`;
  }
  function showCert(code, e){
    document.querySelectorAll('.fc-cert-wrap').forEach(x => x.remove());
    const d = document.createElement('div'); d.innerHTML = certHTML(code, e); const w = d.firstElementChild; document.body.appendChild(w);
    w.querySelector('[data-tcclose]').addEventListener('click', () => w.remove());
    w.querySelector('[data-tcprint]').addEventListener('click', () => { document.body.classList.add('fc-printing'); setTimeout(() => { try{ window.print(); }catch(err){} setTimeout(() => document.body.classList.remove('fc-printing'), 400); }, 60); });
    snd('ding');
  }

  /* ---------- the page ---------- */
  function classesHTML(){
    const C = classes();
    const form = (i) => `<div class="bw-row tc-edit"><label><span>Class name</span><input type="text" id="tcEn" maxlength="24" value="${h(T.en)}" placeholder="Adventurers" autocomplete="off"></label>
      <label class="bw-note"><span>Fab codes, one per line</span><textarea id="tcEc" rows="4" autocapitalize="none" spellcheck="false" placeholder="otter-482&#10;robin-317">${h(T.ec)}</textarea></label>
      <div class="st-row"><button type="button" class="btn small leaf" id="tcSave">Save this class</button><button type="button" class="btn small soft" id="tcCancel">Cancel</button></div>
      ${T.emsg ? `<p class="learn-msg" aria-live="polite">${h(T.emsg)}</p>` : ''}</div>`;
    return `<div class="me-card" id="tcClasses"><h2>${ic('paw', '🐾')} My classes</h2>
      <p>A class is a name and its children’s Fab codes. It is kept in this browser only, so set it up on the computer you plan from.</p>
      ${C.length ? `<ul class="tc-list">${C.map((c, i) => `<li><b>${h(c.n)}</b><span>${c.codes.length === 1 ? '1 child' : c.codes.length + ' children'}: ${c.codes.map(h).join(', ') || 'no codes yet'}</span>
        <button type="button" class="btn small soft" data-tcedit="${i}">Change</button><button type="button" class="btn small soft" data-tcrm="${i}">${T.rm === i ? 'Tap again to remove' : 'Remove'}</button></li>`).join('')}</ul>` : '<p class="hint">No classes yet.</p>'}
      ${T.edit == null ? `<div class="st-row"><button type="button" class="btn small leaf" id="tcNew">Add a class</button></div>` : form(T.edit)}
      <p class="hint">Use a class name such as Adventurers, never a child’s name. The list of which child has which code stays on Beacon.</p></div>`;
  }
  function assignHTML(){
    const C = classes(), k = T.what.slice(0, 1), id = T.what.slice(2);
    if(T.cls !== 'one' && !C[Number(T.cls)]) T.cls = C.length ? 0 : 'one';
    const po = k === 'p' && B() ? B().pathOf(B().packById(id)) : null;
    const log = arr(ls.json(LK, []));
    return `<div class="me-card" id="tcAssign"><h2>${ic('target', '📌')} Quick assign</h2>
      <p>Set one thing for a whole class. You get one link per child. Paste each link into that child’s viewer and it is <b>added</b> to their Today: nothing they already have is taken away.</p>
      <div class="bw-row"><label><span>Who for</span><select id="tcCls">${C.map((c, i) => `<option value="${i}" ${T.cls === i ? 'selected' : ''}>${h(c.n)} (${c.codes.length})</option>`).join('')}<option value="one" ${T.cls === 'one' ? 'selected' : ''}>One child</option></select></label>
        ${T.cls === 'one' ? `<label><span>Fab code</span><input type="text" id="tcOne" value="${h(T.one)}" placeholder="otter-482" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="20"></label>` : ''}
        <label><span>What</span><select id="tcWhat">${whatOptions()}</select></label>
        ${po ? `<label><span>Start at</span><select id="tcStep"><option value="own" ${T.step === 'own' ? 'selected' : ''}>Each child’s own step</option>${po.s.steps.map((s, i) => `<option value="${i}" ${String(T.step) === String(i) ? 'selected' : ''}>${i + 1}. ${h(s.name)}${s.year ? ' (' + h(s.year) + ')' : ''}</option>`).join('')}</select></label>` : ''}
        ${k === 'a' || T.what === 'c' || T.what === 'k' ? `<label class="bw-note"><span>${T.what === 'k' ? 'What the well done is for' : T.what === 'c' ? 'The challenge, in your own words' : 'A challenge to go with it (optional)'}</span><input type="text" id="tcText" maxlength="60" value="${h(T.text)}" placeholder="${T.what === 'k' ? 'Super effort with your times tables' : 'Find three facts about Victorian schools'}"></label>` : ''}
        ${T.what && T.what !== 'k' ? `<label><span>Half term or theme (optional)</span><input type="text" id="tcLabel" maxlength="30" list="tcLabels" value="${h(T.label)}" placeholder="Autumn 1"></label>
        <label><span>Shows from</span><input type="date" id="tcDay" value="${h(T.day || today())}"></label>
        <label class="bw-note"><span>Note for the children (optional)</span><input type="text" id="tcNote" maxlength="80" value="${h(T.note)}"></label>` : ''}</div>
      <datalist id="tcLabels">${TERMS.concat(B() ? Object.keys(B().themes) : []).map(t => `<option value="${h(t)}">`).join('')}</datalist>
      <div class="st-row"><button type="button" class="btn leaf" id="tcMake">Make the links</button>${T.links.length > 1 ? '<button type="button" class="btn small soft" id="tcCopyAll">Copy all links</button>' : ''}</div>
      <p class="learn-msg" id="tcMsg" aria-live="polite">${h(T.msg)}</p>
      ${T.links.length ? `<div class="cl-links">${T.links.map(x => `<div><b>${h(x.c)}</b><input readonly value="${h(x.l)}" aria-label="Link for ${h(x.c)}"><button type="button" class="btn small soft" data-tccopy="${h(x.c)}">Copy link</button></div>`).join('')}</div>` : ''}
      ${log.length ? `<details class="tc-log"><summary><b>Set from this browser</b> (${log.length})</summary><div style="overflow-x:auto"><table class="st-table"><thead><tr><th>When</th><th>Who for</th><th>What</th><th>Half term or theme</th><th>Children</th></tr></thead><tbody>${log.map(r => `<tr><td>${h(new Date(r.t).toLocaleDateString('en-GB', { day:'numeric', month:'short' }))}</td><td>${h(r.c)}</td><td>${h(r.w)}</td><td>${h(r.l || '–')}</td><td>${Number(r.n) || 0}</td></tr>`).join('')}</tbody></table></div></details>` : ''}
      <p class="hint">Topics in the app today: the Victorians, Ancient Egypt, the Romans and the Space Station. Your words travel inside the link, so please keep names and personal details out of them.</p></div>`;
  }
  function progressHTML(){
    if(!B()) return '';
    const codes = knownCodes(), L = codes.map(look);
    const row = r => `<tr><td><b>${h(r.code)}</b></td><td>${r.paths.length ? r.paths.map(p => `${h(p.t)}: step ${p.step}, ${p.sec} of ${p.n} secure`).join('<br>') : '–'}</td><td>${r.set ? r.done + ' of ' + r.set + ' done' : '–'}</td><td>${r.stars}</td><td>${r.checks}</td><td>${r.made}</td><td>${r.last ? h(new Date(r.last).toLocaleDateString('en-GB', { day:'numeric', month:'short' })) : '–'}</td>
      <td><button type="button" class="btn small ${T.open === r.code ? 'amber' : 'leaf'}" data-tcopen="${h(r.code)}">${T.open === r.code ? 'Close' : 'Celebrate'}</button></td></tr>
      ${T.open === r.code ? `<tr class="tc-earned"><td colspan="8"><b>Earned by ${h(r.code)}</b>
        ${r.earned.length ? `<ul>${r.earned.map((e, i) => `<li><span>${ic('star', '⭐')} ${h(e.t)} <small>${h(e.s)}</small></span><button type="button" class="btn small soft" data-tccert="${h(r.code)}:${i}">Certificate</button></li>`).join('')}</ul>` : '<p class="hint">Nothing earned on this device yet.</p>'}
        <div class="bw-row"><label class="bw-note"><span>Or a certificate in your own words: “for…”</span><input type="text" id="tcOwn" maxlength="60" value="${h(T.own)}" placeholder="super effort in every session this half term"></label><button type="button" class="btn small leaf" data-tcowncert="${h(r.code)}">Certificate</button></div></td></tr>` : ''}`;
    return `<div class="me-card" id="tcProgress"><h2>${ic('star', '⭐')} Progress and certificates on this device</h2>
      ${L.length ? `<div style="overflow-x:auto"><table class="st-table"><thead><tr><th>Fab code</th><th>Flightpaths</th><th>Set work</th><th>Stars</th><th>Checkpoints</th><th>Things made</th><th>Last seen</th><th></th></tr></thead><tbody>${L.map(row).join('')}</tbody></table></div>`
        : '<p>No child has used this browser yet.</p>'}
      <p class="hint"><b>Each child’s progress is saved in their own viewer.</b> To see a child’s progress, open the Teachers’ area on their viewer. Seeing every child on one page needs progress saved online under the Fab code, which is a decision for BMF (privacy notice and DPIA first).</p></div>`;
  }
  function render(){
    const box = document.getElementById('teachBody'); if(!box) return;
    box.innerHTML = `<p class="tc-top"><b>Fab codes only, never a child’s name.</b> Everything on this page stays in this browser.</p>
      ${assignHTML()}${classesHTML()}${progressHTML()}
      <div class="me-card" id="tcMore"><h2>${ic('toolbox', '🧰')} More for teachers</h2>
        <div class="st-row"><button type="button" class="btn small soft" id="tcStaff">Fab codes, class links, set work for one child, the impact log</button><button type="button" class="btn small soft" id="tcAll">Every flightpath and lesson</button></div></div>`;
    wire(box);
  }
  function wire(box){
    const $ = s => box.querySelector(s), on = (s, ev, f) => { const el = $(s); if(el) el.addEventListener(ev, f); };
    const redraw = () => render();
    /* quick assign */
    on('#tcCls', 'change', e => { T.cls = e.target.value === 'one' ? 'one' : Number(e.target.value); T.links = []; T.msg = ''; redraw(); });
    on('#tcOne', 'input', e => { T.one = String(e.target.value || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 20); T.links = []; });
    on('#tcWhat', 'change', e => { T.what = e.target.value; T.step = 'own'; T.text = ''; T.links = []; T.msg = ''; redraw(); });
    on('#tcStep', 'change', e => { T.step = e.target.value; T.links = []; });
    on('#tcText', 'input', e => { T.text = e.target.value.slice(0, 60); T.links = []; });
    on('#tcLabel', 'input', e => { T.label = e.target.value.slice(0, 30); T.links = []; });
    on('#tcDay', 'change', e => { T.day = e.target.value; T.links = []; });
    on('#tcNote', 'input', e => { T.note = e.target.value.slice(0, 80); T.links = []; });
    on('#tcMake', 'click', () => { const err = makeLinks(); if(err){ T.links = []; T.msg = err; snd('gentle'); } else { T.msg = (T.links.length === 1 ? '1 link is ready.' : T.links.length + ' links are ready, one per child.') + ' Each holds the work and your words, and nothing else.'; snd('ding'); } redraw(); });
    on('#tcCopyAll', 'click', e => { const t = T.links.map(x => x.c + '\t' + x.l).join('\n'); try{ navigator.clipboard.writeText(t); e.target.textContent = 'Copied ✓'; }catch(err){ e.target.textContent = 'Copy each link below'; } });
    box.querySelectorAll('[data-tccopy]').forEach(b => b.addEventListener('click', () => { const x = T.links.find(l => l.c === b.dataset.tccopy); if(!x) return; try{ navigator.clipboard.writeText(x.l); b.textContent = 'Copied ✓'; }catch(err){ const i = b.parentNode.querySelector('input'); if(i) i.select(); b.textContent = 'Press Ctrl+C'; } }));
    /* my classes */
    on('#tcNew', 'click', () => { T.edit = 'new'; T.en = ''; T.ec = ''; T.emsg = ''; snd('tick'); redraw(); });
    box.querySelectorAll('[data-tcedit]').forEach(b => b.addEventListener('click', () => { const i = Number(b.dataset.tcedit), c = classes()[i]; if(!c) return; T.edit = i; T.en = c.n; T.ec = c.codes.join('\n'); T.emsg = ''; snd('tick'); redraw(); }));
    box.querySelectorAll('[data-tcrm]').forEach(b => b.addEventListener('click', () => { const i = Number(b.dataset.tcrm); if(T.rm !== i){ T.rm = i; redraw(); return; } const C = classes(); C.splice(i, 1); saveClasses(C); T.rm = -1; T.cls = 0; T.links = []; snd('tick'); redraw(); }));
    on('#tcEn', 'input', e => { T.en = e.target.value.slice(0, 24); });
    on('#tcEc', 'input', e => { T.ec = e.target.value; });
    on('#tcCancel', 'click', () => { T.edit = null; T.emsg = ''; redraw(); });
    on('#tcSave', 'click', () => {
      const n = cleanName(T.en), all = parse(T.ec), good = all.filter(c => CODE_RE.test(c)), bad = all.filter(c => !CODE_RE.test(c));
      if(!n){ T.emsg = 'Give the class a name, such as Adventurers.'; snd('gentle'); redraw(); return; }
      if(bad.length){ T.emsg = 'Not a Fab code: ' + bad.join(', ') + '. Fab codes look like otter-482. Please never use a name.'; snd('gentle'); redraw(); return; }
      if(!good.length){ T.emsg = 'Add at least one Fab code.'; snd('gentle'); redraw(); return; }
      const C = classes(); if(T.edit === 'new'){ C.push({ n, codes:good.slice(0, 30) }); T.cls = C.length - 1; } else if(C[T.edit]) C[T.edit] = { n, codes:good.slice(0, 30) };
      saveClasses(C); T.edit = null; T.emsg = ''; T.links = []; snd('ding'); redraw(); });
    /* progress and certificates */
    box.querySelectorAll('[data-tcopen]').forEach(b => b.addEventListener('click', () => { T.open = T.open === b.dataset.tcopen ? '' : b.dataset.tcopen; T.own = ''; snd('tick'); redraw(); }));
    box.querySelectorAll('[data-tccert]').forEach(b => b.addEventListener('click', () => { const [c, i] = b.dataset.tccert.split(':'); const e = look(c).earned[Number(i)]; if(e) showCert(c, e); }));
    on('#tcOwn', 'input', e => { T.own = e.target.value.slice(0, 60); });
    box.querySelectorAll('[data-tcowncert]').forEach(b => b.addEventListener('click', () => { const t = String(T.own || '').replace(/[<>]/g, '').trim(); if(!t){ const i = $('#tcOwn'); if(i) i.focus(); snd('gentle'); return; } showCert(b.dataset.tcowncert, { did:'for', t, s:'' }); }));
    /* more */
    on('#tcStaff', 'click', () => { const bk = document.querySelector('#screen-staff .btn-back'); if(bk) bk.dataset.go = 'screen-teach'; showScreen('screen-staff'); });
    on('#tcAll', 'click', () => { if(B()) B().openAll(); else showScreen('screen-learn'); });
  }

  /* ---------- the door on the landing page ---------- */
  let arm = 0;
  function open(){ showScreen('screen-teach'); }
  function door(){
    const hub = document.getElementById('screen-hub'); if(!hub || document.getElementById('teachDoor')) return;
    const grid = hub.querySelector('.hub-grid'); if(!grid) return;
    grid.insertAdjacentHTML('afterend', `<p class="teach-door"><button type="button" class="btn small soft" id="teachDoor">${ic('door', '🚪')} <span>Teachers’ area</span></button></p>`);
    const b = document.getElementById('teachDoor'), lab = b.querySelector('span');
    b.addEventListener('click', () => { snd('tick');
      /* on a child's viewer: two taps, so a child does not land here by accident */
      if(me() && Date.now() - arm > 6000){ arm = Date.now(); lab.textContent = 'Teachers: tap again to open'; b.classList.add('amber'); setTimeout(() => { if(Date.now() - arm >= 6000){ lab.textContent = 'Teachers’ area'; b.classList.remove('amber'); } }, 6100); return; }
      arm = 0; lab.textContent = 'Teachers’ area'; b.classList.remove('amber'); open(); });
  }
  function build(){
    if(document.getElementById('screen-teach')) return;
    const hub = document.getElementById('screen-hub'); if(!hub) return;
    hub.parentNode.insertAdjacentHTML('beforeend', `<section id="screen-teach" class="screen" aria-label="Teachers’ area">
      <div class="screen-top"><button class="btn-back" data-go="screen-hub">← Back</button><h1 class="screen-title">Teachers’ area</h1></div>
      <div id="teachBody"></div></section>`);
    const st = document.createElement('style'); st.textContent = `
.teach-door{text-align:center;margin:14px 0 4px}
.teach-door .btn{display:inline-flex;align-items:center;gap:8px}.teach-door svg{width:1.3em;height:1.3em}
#screen-teach .me-card{text-align:left}#screen-teach .me-card h2{display:flex;align-items:center;gap:10px}#screen-teach .me-card h2 svg{width:1.4em;height:1.4em;flex:none}
.tc-top{text-align:center;margin:4px 0 12px}
.tc-list{list-style:none;margin:8px 0;padding:0;display:grid;gap:8px}
.tc-list li{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;background:#FFF6E6;border:2px solid #E3C9A0;border-radius:14px;padding:8px 12px}
.tc-list li span{flex:1 1 240px;min-width:0;overflow-wrap:anywhere}
.tc-edit{align-items:end}.tc-edit textarea{width:100%;min-height:96px;font:inherit;border:2px solid #2B1A12;border-radius:12px;padding:8px 10px;background:#fff;box-sizing:border-box}
.tc-log{margin:10px 0}.tc-log summary{cursor:pointer}
.tc-earned td{background:#FFF6E6;text-align:left}
.tc-earned ul{list-style:none;margin:8px 0;padding:0;display:grid;gap:6px}
.tc-earned li{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;border-bottom:1px dashed #E3C9A0;padding:4px 0}
.tc-earned li svg{width:1.1em;height:1.1em;vertical-align:-.15em}.tc-earned small{opacity:.75;margin-left:6px}
#tcProgress .st-table td{vertical-align:top}`;
    document.head.appendChild(st);
    const base = window.showScreen;
    if(typeof base === 'function' && !base._tc){
      const w = function(id){ const r = base.apply(this, arguments); if(id === 'screen-teach'){ T.rm = -1; render(); } else if(id === 'screen-hub') door(); return r; };
      w._tc = true; window.showScreen = w;
    }
    /* the staff page's Back returns to wherever it was opened from */
    document.addEventListener('click', e => { if(e.target.closest('#staffLink')){ const bk = document.querySelector('#screen-staff .btn-back'); if(bk) bk.dataset.go = 'screen-learn'; } }, true);
    door();
  }
  window.FabTeach = { open, render, classes, look, form:T, known:knownCodes };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
