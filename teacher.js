/* teacher.js — the Teachers' area (second version, 27 Nov 2026, evening).
   Patrick, 17:08: "Can the teacher page be set out in a similar style to the landing page with buttons for 'assign a task'; View task
   progress; suggest a resource!; Print achievements", and for Assign a task: "I don't think a teacher will want to scroll through dozens
   of flightpaths and resources. Perhaps separating by either subject area or key stage might assist", and "being able to assign booklet
   activities as opposed to relying on flightpaths alone". 23:00: "Suggest a resource could go into an ideas bank that then sends a
   spreadsheet to the teacher@ ... email every week or month".
   What it is: a landing page of four cards for teachers, opened from the app's landing page.
     - Assign a task: who for, what kind (booklet, flightpath, topic, activity, challenge, well done), then subject and key stage, then
       a short list of cards to pick from. One link per child; a class link ADDS to what a child already has.
     - View task progress: what this device holds for each Fab code, task by task.
     - Suggest a resource: a short form into an ideas bank kept in this browser, which can be emailed or downloaded as a spreadsheet.
     - Print achievements: a certificate for anything earned, or in the teacher's own words.
     - My classes: named groups of Fab codes (Explorers, Voyagers, Adventurers, Pioneers), kept in this browser only.
   What it is not, yet: a sign-in, or one place that shows every child. There is no server. Each child's progress lives in their own
   viewer. Seeing everyone at once, and an ideas bank that posts itself every week, both need something online (a BMF decision).
   The door is two taps on a child's viewer: it keeps a child out by accident, it is not a lock.
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
  const words = (v, n) => String(v || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
  const TERMS = ['Autumn 1', 'Autumn 2', 'Spring 1', 'Spring 2', 'Summer 1', 'Summer 2'];

  /* ---------- subjects and key stages (Patrick: Explorers are EYFS, Voyagers KS1, Adventurers lower KS2, Pioneers upper KS2,
     "but that isn't strictly how we assign flightpaths given children's gaps and school absences": so the class's usual stage is
     offered first and any other stage is one tap away) ---------- */
  const STAGES = [{ k:'eyfs', n:'EYFS', y:['R'] }, { k:'ks1', n:'KS1', y:['Y1', 'Y2'] }, { k:'lks2', n:'Lower KS2', y:['Y3', 'Y4'] }, { k:'uks2', n:'Upper KS2', y:['Y5', 'Y6'] }];
  const SUBJECTS = ['Maths', 'English', 'Phonics', 'Science', 'Topic'];
  const stageName = k => (STAGES.find(s => s.k === k) || { n:'' }).n;
  const usualStage = name => { const n = String(name || '').toLowerCase(); return /explorer/.test(n) ? 'eyfs' : /voyager/.test(n) ? 'ks1' : /adventurer/.test(n) ? 'lks2' : /pioneer/.test(n) ? 'uks2' : ''; };
  function stagesOfPack(p){
    const po = B().pathOf(p), ys = new Set();
    (po ? po.s.steps : []).forEach(s => String(s.year || '').split('/').forEach(y => ys.add(y.trim())));
    return STAGES.filter(s => s.y.some(y => ys.has(y))).map(s => s.k);
  }
  /* Explorer Worlds: where each usually sits in the National Curriculum (a draft for a teacher to check) */
  const TOPICS = { victorian:{ sub:'Topic', st:['ks1', 'lks2', 'uks2'] }, egypt:{ sub:'Topic', st:['lks2', 'uks2'] }, greece:{ sub:'Topic', st:['lks2', 'uks2'] }, rome:{ sub:'Topic', st:['lks2', 'uks2'] }, space:{ sub:'Science', st:['lks2', 'uks2'] } };
  /* a booklet's title often says where it sits ("Place value: Year 1"): used only when the teacher leaves the boxes empty */
  const stageIn = t => { const m = /\b(?:year|y)\s*([1-6])\b/i.exec(t); return m ? STAGES[Math.ceil(Number(m[1]) / 2)].k : /\b(reception|eyfs)\b/i.test(t) ? 'eyfs' : ''; };
  const subjectIn = t => /phonics/i.test(t) ? 'Phonics' : /\b(maths?|number|place value|fractions?|times tables?|addition|subtraction|multiplication|division|shape|measure)/i.test(t) ? 'Maths' : /\b(english|reading|writing|grammar|spelling|punctuation)/i.test(t) ? 'English' : /\bscience\b/i.test(t) ? 'Science' : /\b(history|geography|topic)\b/i.test(t) ? 'Topic' : '';
  const KINDS = [
    { k:'b', n:'A booklet', ic:'books', e:'📚', say:'You open the booklet on the board. The child sees which part to do and taps “I did it”.' },
    { k:'p', n:'A flightpath', ic:'map', e:'🗺️', say:'Steps the child works through in the app, each with a place to stop.' },
    { k:'t', n:'A whole topic', ic:'compass', e:'🧭', say:'An Explorer World to visit: look around, find, sort, match and make.' },
    { k:'a', n:'An activity in the app', ic:'canvas', e:'🎨', say:'Fox Blocks, the Studio, music, the canvas or Fab’s Sanctuary.' },
    { k:'c', n:'A challenge in my own words', ic:'pencil', e:'✏️', say:'Paper, the board or talking. The child taps “I did it”.' },
    { k:'k', n:'A well done', ic:'star', e:'⭐', say:'Your words show at the top of each child’s Burrow.' }
  ];

  /* ---------- kept in this browser only ---------- */
  const CK = 'fab-teach-classes', LK = 'fab-teach-log', BK = 'fab-teach-booklets', IK = 'fab-teach-ideas';
  const classes = () => arr(ls.json(CK, [])).filter(c => c && c.n).map(c => ({ n:cleanName(c.n), codes:arr(c.codes).filter(x => CODE_RE.test(x)) }));
  const saveClasses = a => ls.set(CK, a.slice(0, 12));
  const booklets = () => arr(ls.json(BK, [])).filter(b => b && b.t).map(b => ({ t:words(b.t, 40), sub:SUBJECTS.includes(b.sub) ? b.sub : '', st:stageName(b.st) ? b.st : '' }));
  const ideas = () => arr(ls.json(IK, [])).filter(x => x && x.w).map(x => ({ t:Number(x.t) || 0, w:words(x.w, 200), k:words(x.k, 30), sub:words(x.sub, 20), st:words(x.st, 20), y:words(x.y, 200) }));
  /* Where the ideas bank goes. A Microsoft Form that fills a spreadsheet and posts it each week needs a BMF account to create it:
     paste the form's address here when it exists and the button appears. Until then the bank is emailed or downloaded by hand. */
  const IDEAS_FORM = '';
  const IDEAS_TO = ['teacher', 'bemorefab.co.uk'].join('@');

  const T = { view:'home', cls:0, one:'', kind:'', sub:'all', st:'auto', pick:'', step:'own', text:'', part:'', label:'', day:'', note:'', links:[], msg:'',
    edit:null, en:'', ec:'', emsg:'', rm:-1, open:'', own:'', badd:false, bt:'', bsub:'', bst:'', bmsg:'', brm:-1,
    iw:'', ik:'A booklet', isub:'', ist:'', iy:'', imsg:'', irm:-1, iclear:0 };
  const TITLES = { home:'Teachers’ area', assign:'Assign a task', progress:'View task progress', suggest:'Suggest a resource', print:'Print achievements', classes:'My classes' };

  /* ---------- assign: who, what kind, which one ---------- */
  function targets(){ const C = classes(); if(T.cls === 'one') return CODE_RE.test(T.one) ? [T.one] : []; const c = C[Number(T.cls)]; return c ? c.codes : []; }
  function clsName(){ const C = classes(); return T.cls === 'one' ? T.one : (C[Number(T.cls)] || {}).n || ''; }
  function stageNow(){ return T.st === 'auto' ? (T.cls === 'one' ? '' : usualStage(clsName())) || 'all' : T.st; }
  function items(){
    if(!B()) return [];
    const st = stageNow(), okS = x => T.sub === 'all' || [].concat(x.sub).includes(T.sub), okT = x => st === 'all' || !x.st.length || x.st.includes(st);
    let L = [];
    if(T.kind === 'p') L = B().paths().map(p => ({ id:p.id, t:p.title, e:p.emoji || '📘', s:[p.subject, p.years].filter(Boolean).join(' · '), sub:p.subject || '', st:stagesOfPack(p) }));
    else if(T.kind === 't') L = B().acts.filter(a => a.id.indexOf('explore:') === 0).map(a => { const id = a.id.slice(8), m = TOPICS[id] || { sub:'Topic', st:[] };
      return { id, t:a.n.replace('Explorer Worlds: ', ''), i:a.ic, e:a.e, s:m.sub + (m.st.length ? ' · ' + m.st.map(stageName).join(', ') : ''), sub:m.sub, st:m.st }; });
    else if(T.kind === 'b') L = lib().map(b => ({ id:'L:' + b.id, t:b.t, i:'books', e:'📚', s:[[].concat(b.sub).join(' and '), b.st.map(stageName).join(', ')].join(' · '), tag:b.app ? 'In the app' : 'On the board', sub:b.sub, st:b.st, lib:b }))
      .concat(booklets().map((b, i) => ({ id:String(i), t:b.t, i:'books', e:'📚', s:[b.sub, stageName(b.st)].filter(Boolean).join(' · ') || 'Any subject, any stage', tag:'My own list', sub:b.sub, st:b.st ? [b.st] : [], own:true })));
    else if(T.kind === 'a') return B().acts.filter(a => a.id && a.id !== 'booklet' && a.id.indexOf('explore:') !== 0).map(a => ({ id:a.id, t:a.n, i:a.ic, e:a.e, s:'', sub:'', st:[] }));
    return L.filter(x => (T.kind === 'b' && !x.sub ? true : okS(x)) && okT(x));
  }
  const lib = () => { try{ return window.FabBooklets ? FabBooklets.all() : []; }catch(e){ return []; } };
  function picked(){ return items().find(x => x.id === T.pick) || null; }
  function whatName(){
    const p = picked();
    if(T.kind === 'c') return T.text; if(T.kind === 'k') return 'Well done: ' + T.text;
    if(!p) return '';
    if(T.kind === 'b') return 'Booklet: ' + (p.lib ? p.lib.short : p.t) + (p.lib && p.lib.app ? (T.step === 'own' ? '' : ', from page ' + (Number(T.step) + 1)) : T.part ? ': ' + T.part : '');
    return p.t + (T.text ? ': ' + T.text : '');
  }
  function makeLinks(){
    const codes = targets(), d = T.day || today(), p = picked();
    if(!B()) return 'The Burrow is not ready on this page. Reload and try again.';
    if(!codes.length) return T.cls === 'one' ? 'Type a Fab code first: an animal, a dash and three numbers, like otter-482. Never a name.' : 'Add a class with at least one Fab code first (My classes).';
    if(!T.kind) return 'Choose what kind of task first.';
    if((T.kind === 'c' || T.kind === 'k') && !T.text.trim()) return T.kind === 'k' ? 'Say what the well done is for, in a few words.' : 'Type the challenge first, in a few words.';
    if(!p && T.kind !== 'c' && T.kind !== 'k') return T.kind === 'b' ? 'Choose a booklet first, or add one to your list.' : 'Choose one of the cards first.';
    let rows = [], opt = { cls:true, merge:true, extras:[] };
    if(T.kind === 'p') rows = [{ p:p.id, s:T.step === 'own' ? null : Number(T.step) || 0, d, n:T.note, th:T.label }];
    else if(T.kind === 't') opt.extras = [{ a:'explore:' + p.id, t:T.text, n:T.note, th:T.label, d }];
    else if(T.kind === 'a') opt.extras = [{ a:p.id, t:T.text, n:T.note, th:T.label, d }];
    else if(T.kind === 'b' && p.lib) opt.extras = [{ a:'bk:' + p.lib.id + (p.lib.app && T.step !== 'own' ? ':' + (Number(T.step) + 1) : ''), t:p.lib.app ? '' : words(T.part, 60), n:T.note, th:T.label, d }];
    else if(T.kind === 'b') opt.extras = [{ a:'booklet', t:p.t + (T.part.trim() ? ': ' + T.part.trim() : ''), n:T.note, th:T.label, d }];
    else if(T.kind === 'c') opt.extras = [{ a:'', t:T.text, n:T.note, th:T.label, d }];
    else if(T.kind === 'k') opt.praise = T.text;
    T.links = codes.map(c => ({ c, l:B().linkFor(c, rows, [], opt) }));
    const log = arr(ls.json(LK, [])); log.unshift({ t:Date.now(), c:clsName(), w:whatName().slice(0, 90), l:T.label, n:codes.length }); ls.set(LK, log.slice(0, 20));
    return '';
  }

  /* ---------- what this device knows about a Fab code ---------- */
  function knownCodes(){
    const out = new Set(); const m = me(); if(CODE_RE.test(m)) out.add(m);
    try{ for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i) || ''; const c = k.indexOf('fab-burrow-') === 0 ? k.slice(11) : k.indexOf('fabimpact-') === 0 ? k.slice(10) : ''; if(CODE_RE.test(c)) out.add(c); } }catch(e){}
    try{ FabCheck.Store.all().forEach(r => { if(CODE_RE.test(r.code)) out.add(r.code); }); }catch(e){}
    try{ FabBooklets.codes().forEach(c => out.add(c)); }catch(e){}
    return [...out].sort();
  }
  function look(code){
    const b = B(), paths = [], earned = [], tasks = [];
    b.paths().forEach(p => { const pr = b.progress(code, p), po = b.pathOf(p); if(!pr) return;
      paths.push({ t:p.title, step:pr.step + 1, sec:pr.secured.length, n:pr.n });
      pr.secured.slice().sort((x, y) => x - y).forEach(i => { const st = po.s.steps[i]; if(st) earned.push({ did:'for climbing a step on the flightpath', t:'Step ' + (i + 1) + ': ' + st.name, s:p.title + (st.year ? ' · ' + st.year : '') }); }); });
    let checks = []; try{ checks = FabCheck.Store.all().filter(r => r.passed && r.code === code); }catch(e){}
    checks.forEach(r => earned.push({ did:'for completing the checkpoint', t:r.title, s:r.packTitle + (r.year ? ' · ' + r.year : '') }));
    const bw = b.read(code); let set = 0, done = 0;
    bw.items.forEach(it => { set++; const S = b.status(code, it); if(!S.po) return; if(S.done) done++;
      tasks.push({ t:S.pack.title + (it.s != null ? ', step ' + (it.s + 1) + ': ' + S.po.s.steps[it.s].name : ', the child’s own step'), th:it.th || '', d:it.d || '', s:S.done ? 'Done' : S.started ? 'Started' : 'Not started yet' }); });
    bw.extras.forEach(x => { set++; if(x.dn){ done++; earned.push({ did:'for finishing', t:b.extraTitle(x), s:x.th || 'Set by your teacher' }); }
      const lb = String(x.a || '').indexOf('bk:') === 0 ? b.act(x.a) : null;
      tasks.push({ t:lb ? lb.n + (x.t ? ': ' + x.t : '') : (x.a === 'booklet' ? 'Booklet: ' : '') + b.extraTitle(x), th:x.th || '', d:x.d || '', s:x.dn ? 'Done' : 'Not done yet' }); });
    let stars = 0, days = 0, last = 0; try{ const s = FabImpact.summary(code); stars = s.stars; days = s.days; last = s.last; }catch(e){}
    let made = 0; try{ made = b.made(code).length; }catch(e){}
    return { code, paths, earned, tasks, set, done, stars, days, last, checks:checks.length, made };
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

  /* ---------- the home page: four cards, like the app's landing page ---------- */
  function homeHTML(){
    const C = classes(), tile = (id, v, name, emoji, t, p) => `<button type="button" class="tile category-tile tc-tile" id="${id}" data-tcview="${v}"><span class="emoji">${ic(name, emoji)}</span><h2>${t}</h2><p>${p}</p></button>`;
    return `<p class="tc-top"><b>Fab codes only, never a child’s name.</b> Everything on these pages stays in this browser.</p>
      <div class="hub-grid category-grid tc-home">
        ${tile('tcGoAssign', 'assign', 'target', '📌', 'Assign a task', 'A booklet, flightpath, topic or activity, for a class or one child')}
        ${tile('tcGoProgress', 'progress', 'map', '🗺️', 'View task progress', 'What is set, started and finished')}
        ${tile('tcGoSuggest', 'suggest', 'pencil', '💡', 'Suggest a resource', 'Tell us what would help. It goes into the ideas bank')}
        ${tile('tcGoPrint', 'print', 'star', '🏅', 'Print achievements', 'Certificates for steps, checkpoints and super effort')}
      </div>
      <div class="me-card tc-foot" id="tcMore"><div class="st-row"><button type="button" class="btn small soft" id="tcGoClasses" data-tcview="classes">${ic('paw', '🐾')} My classes${C.length ? ' (' + C.length + ')' : ''}</button>
        <button type="button" class="btn small soft" id="tcAll">Every flightpath and lesson</button><button type="button" class="btn small soft" id="tcStaff">Fab codes, set work for one child, the impact log</button></div></div>`;
  }

  /* ---------- my classes ---------- */
  function classesHTML(){
    const C = classes();
    const form = () => `<div class="bw-row tc-edit"><label><span>Class name</span><input type="text" id="tcEn" maxlength="24" list="tcClsNames" value="${h(T.en)}" placeholder="Adventurers" autocomplete="off"></label>
      <datalist id="tcClsNames"><option value="Explorers"><option value="Voyagers"><option value="Adventurers"><option value="Pioneers"></datalist>
      <label class="bw-note"><span>Fab codes, one per line</span><textarea id="tcEc" rows="4" autocapitalize="none" spellcheck="false" placeholder="otter-482&#10;robin-317">${h(T.ec)}</textarea></label>
      <div class="st-row"><button type="button" class="btn small leaf" id="tcSave">Save this class</button><button type="button" class="btn small soft" id="tcCancel">Cancel</button></div>
      ${T.emsg ? `<p class="learn-msg" aria-live="polite">${h(T.emsg)}</p>` : ''}</div>`;
    return `<div class="me-card" id="tcClasses"><h2>${ic('paw', '🐾')} My classes</h2>
      <p>A class is a name and its children’s Fab codes. It is kept in this browser only, so set it up on the computer you plan from.</p>
      ${C.length ? `<ul class="tc-list">${C.map((c, i) => `<li><b>${h(c.n)}</b><span>${c.codes.length === 1 ? '1 child' : c.codes.length + ' children'}: ${c.codes.map(h).join(', ') || 'no codes yet'}${usualStage(c.n) ? ' · usually ' + stageName(usualStage(c.n)) : ''}</span>
        <button type="button" class="btn small soft" data-tcedit="${i}">Change</button><button type="button" class="btn small soft" data-tcrm="${i}">${T.rm === i ? 'Tap again to remove' : 'Remove'}</button></li>`).join('')}</ul>` : '<p class="hint">No classes yet.</p>'}
      ${T.edit == null ? `<div class="st-row"><button type="button" class="btn small leaf" id="tcNew">Add a class</button></div>` : form()}
      <p class="hint">Explorers are EYFS, Voyagers KS1, Adventurers lower KS2 and Pioneers upper KS2. That only sets which tasks are offered first: you can set any task for any class. Use a class name, never a child’s name. The list of which child has which code stays on Beacon.</p></div>`;
  }

  /* ---------- assign a task ---------- */
  const chip = (attr, v, label, onNow) => `<button type="button" class="btn small ${onNow ? 'leaf' : 'soft'} tc-chip" ${attr}="${h(v)}" aria-pressed="${onNow ? 'true' : 'false'}">${label}</button>`;
  function bookletFormHTML(){
    return `<div class="bw-row tc-edit tc-bform"><label class="bw-note"><span>Booklet title</span><input type="text" id="tcBt" maxlength="40" value="${h(T.bt)}" placeholder="Place value: Year 1" autocomplete="off"></label>
      <label><span>Subject</span><select id="tcBsub"><option value="">Any subject</option>${SUBJECTS.map(s => `<option ${T.bsub === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
      <label><span>Key stage</span><select id="tcBst"><option value="">Any stage</option>${STAGES.map(s => `<option value="${s.k}" ${T.bst === s.k ? 'selected' : ''}>${s.n}</option>`).join('')}</select></label>
      <div class="st-row"><button type="button" class="btn small leaf" id="tcBsave">Add to my booklets</button><button type="button" class="btn small soft" id="tcBcancel">Cancel</button></div>
      ${T.bmsg ? `<p class="learn-msg" aria-live="polite">${h(T.bmsg)}</p>` : ''}</div>`;
  }
  function assignHTML(){
    const C = classes(), L = items(), p = picked(), st = stageNow(), usual = T.cls === 'one' ? '' : usualStage(clsName());
    if(T.cls !== 'one' && !C[Number(T.cls)]) T.cls = C.length ? 0 : 'one';
    const K = KINDS.find(k => k.k === T.kind), filtered = T.kind === 'b' || T.kind === 'p' || T.kind === 't';
    const po = T.kind === 'p' && p ? B().pathOf(B().packById(p.id)) : null;
    const ready = T.kind === 'c' || T.kind === 'k' || !!p;
    const cards = L.map(x => `<button type="button" class="tc-pick ${x.id === T.pick ? 'on' : ''}" data-tcpick="${h(x.id)}" aria-pressed="${x.id === T.pick ? 'true' : 'false'}"><span class="tc-pic" aria-hidden="true">${x.i ? ic(x.i, x.e) : h(x.e)}</span><b>${h(x.t)}</b>${x.s ? `<small>${h(x.s)}</small>` : ''}${x.tag ? `<i class="tc-tag ${x.lib && x.lib.app ? 'app' : ''}">${x.tag}</i>` : ''}</button>`).join('');
    const none = T.kind === 'b' ? 'No booklet matches that subject and stage. Tap All, or add one of your own.'
      : 'Nothing matches that subject and stage. Tap All to see everything.';
    return `<div class="me-card tc-step" id="tcAssign">
      <h2><span class="tc-n">1</span> Who is it for?</h2>
      <div class="tc-chips" id="tcWho">${C.map((c, i) => chip('data-tccls', i, h(c.n) + ' (' + c.codes.length + ')', T.cls === i)).join('')}${chip('data-tccls', 'one', 'One child', T.cls === 'one')}<button type="button" class="btn small soft" data-tcview="classes">${C.length ? 'Change my classes' : 'Add a class'}</button></div>
      ${T.cls === 'one' ? `<div class="bw-row"><label><span>Fab code</span><input type="text" id="tcOne" value="${h(T.one)}" placeholder="otter-482" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="20"></label></div>` : ''}
      <h2><span class="tc-n">2</span> What kind of task?</h2>
      <div class="tc-chips" id="tcKinds">${KINDS.map(k => chip('data-tckind', k.k, ic(k.ic, k.e) + ' ' + k.n, T.kind === k.k)).join('')}</div>
      ${K ? `<p class="hint tc-say">${h(K.say)}</p>` : ''}
      ${T.kind && T.kind !== 'c' && T.kind !== 'k' ? `<h2><span class="tc-n">3</span> Choose ${T.kind === 'b' ? 'the booklet' : T.kind === 'p' ? 'the flightpath' : T.kind === 't' ? 'the topic' : 'the activity'}</h2>
        ${filtered ? `<div class="tc-filter"><span>Subject</span><div class="tc-chips" id="tcSubs">${chip('data-tcsub', 'all', 'All', T.sub === 'all')}${SUBJECTS.map(s => chip('data-tcsub', s, s, T.sub === s)).join('')}</div></div>
        <div class="tc-filter"><span>Key stage</span><div class="tc-chips" id="tcStages">${chip('data-tcst', 'all', 'All', st === 'all')}${STAGES.map(s => chip('data-tcst', s.k, s.n, st === s.k)).join('')}</div></div>
        ${usual && st === usual && T.st === 'auto' ? `<p class="hint">${h(clsName())} usually work in ${stageName(usual)}, so that is shown first. For a child with gaps, tap another stage or All.</p>` : ''}` : ''}
        ${cards ? `<div class="tc-picks" id="tcPicks">${cards}</div>` : `<p class="hint" id="tcNone">${none}</p>`}
        ${T.kind === 'b' ? (T.badd ? bookletFormHTML() : `<div class="st-row"><button type="button" class="btn small soft" id="tcBadd">Add a booklet to my list</button>${p && p.own ? `<button type="button" class="btn small soft" id="tcBrm">${T.brm === Number(p.id) ? 'Tap again to take it off my list' : 'Take this booklet off my list'}</button>` : ''}</div>`) : ''}` : ''}
      ${ready ? `<h2><span class="tc-n">${T.kind === 'c' || T.kind === 'k' ? 3 : 4}</span> ${T.kind === 'k' ? 'Your words' : 'The details'}</h2>
        <div class="bw-row">
        ${po ? `<label><span>Start at</span><select id="tcStep"><option value="own" ${T.step === 'own' ? 'selected' : ''}>Each child’s own step</option>${po.s.steps.map((s, i) => `<option value="${i}" ${String(T.step) === String(i) ? 'selected' : ''}>${i + 1}. ${h(s.name)}${s.year ? ' (' + h(s.year) + ')' : ''}</option>`).join('')}</select></label>` : ''}
        ${T.kind === 'b' && p.lib && p.lib.app ? `<label><span>Start at</span><select id="tcStep"><option value="own" ${T.step === 'own' ? 'selected' : ''}>Where each child left off</option>${p.lib.pages.map((pg, i) => `<option value="${i}" ${String(T.step) === String(i) ? 'selected' : ''}>Page ${i + 1}: ${h(pg.t)}</option>`).join('')}</select></label>` : ''}
        ${T.kind === 'b' && !(p.lib && p.lib.app) ? `<label class="bw-note"><span>Which part? (a page, a section or one activity)</span><input type="text" id="tcPart" maxlength="${p.lib ? 60 : 38}" list="tcParts" value="${h(T.part)}" placeholder="${p.lib ? h(p.lib.parts[0]) : 'Pages 4 and 5: tens and ones'}"></label><datalist id="tcParts">${(p.lib ? p.lib.parts : []).map(x => `<option value="${h(x)}">`).join('')}</datalist>` : ''}
        ${T.kind === 't' || T.kind === 'a' || T.kind === 'c' || T.kind === 'k' ? `<label class="bw-note"><span>${T.kind === 'k' ? 'What the well done is for' : T.kind === 'c' ? 'The challenge, in your own words' : 'A challenge to go with it (optional)'}</span><input type="text" id="tcText" maxlength="60" value="${h(T.text)}" placeholder="${T.kind === 'k' ? 'Super effort with your times tables' : 'Find three facts about Victorian schools'}"></label>` : ''}
        ${T.kind !== 'k' ? `<label><span>Half term or theme (optional)</span><input type="text" id="tcLabel" maxlength="30" list="tcLabels" value="${h(T.label)}" placeholder="Autumn 1"></label>
        <label><span>Shows from</span><input type="date" id="tcDay" value="${h(T.day || today())}"></label>
        <label class="bw-note"><span>Note for the children (optional)</span><input type="text" id="tcNote" maxlength="80" value="${h(T.note)}"></label>` : ''}</div>
        <datalist id="tcLabels">${TERMS.concat(B() ? Object.keys(B().themes) : []).map(t => `<option value="${h(t)}">`).join('')}</datalist>
        ${T.kind === 'b' && p.lib ? `<div class="tc-about"><p><b>${h(p.lib.t)}</b>${p.lib.time ? ' · ' + h(p.lib.time) : ''}. ${h(p.lib.about)}</p>${p.lib.care ? `<p><b>With care:</b> ${h(p.lib.care)}</p>` : ''}
          ${p.lib.app ? `<p>This booklet is built into the app. The child works through it in their own viewer; nothing is marked in front of them. You read their answers, the hinge letters and draft next steps under <b>View task progress</b>.</p><div class="st-row"><button type="button" class="btn small soft" id="tcLook">Look inside</button></div>`
            : '<p>This booklet is opened <b>on the board</b> from your own files. The app lists the part in the child’s Today and they tap “I did it”. Set one part at a time: a part a child can finish in one sitting.</p>'}</div>`
          : T.kind === 'b' ? '<p class="hint">Set one part of a booklet at a time: a part a child can finish in one sitting, with a place to stop. The app lists it in the child’s Today; you open the booklet itself on the board.</p>' : ''}` : ''}
      <div class="st-row"><button type="button" class="btn leaf" id="tcMake">Make the links</button>${T.links.length > 1 ? '<button type="button" class="btn small soft" id="tcCopyAll">Copy all links</button>' : ''}</div>
      <p class="learn-msg" id="tcMsg" aria-live="polite">${h(T.msg)}</p>
      ${T.links.length ? `<div class="cl-links">${T.links.map(x => `<div><b>${h(x.c)}</b><input readonly value="${h(x.l)}" aria-label="Link for ${h(x.c)}"><button type="button" class="btn small soft" data-tccopy="${h(x.c)}">Copy link</button></div>`).join('')}</div>` : ''}
      <p class="hint">You get one link per child. Paste each link into that child’s viewer and the task is <b>added</b> to their Today: nothing they already have is taken away. Your words travel inside the link, so please keep names and personal details out of them.</p></div>`;
  }

  /* ---------- view task progress ---------- */
  function logHTML(){
    const log = arr(ls.json(LK, []));
    return log.length ? `<div class="me-card" id="tcLog"><h2>${ic('target', '📌')} Set from this browser</h2><div style="overflow-x:auto"><table class="st-table tc-log"><thead><tr><th>When</th><th>Who for</th><th>What</th><th>Half term or theme</th><th>Children</th></tr></thead><tbody>${log.map(r => `<tr><td>${h(new Date(r.t).toLocaleDateString('en-GB', { day:'numeric', month:'short' }))}</td><td>${h(r.c)}</td><td>${h(r.w)}</td><td>${h(r.l || '–')}</td><td>${Number(r.n) || 0}</td></tr>`).join('')}</tbody></table></div>
      <p class="hint">This is a list of what you set, not of what was done. It is kept in this browser only.</p></div>` : '';
  }
  const whereHint = '<p class="hint"><b>Each child’s progress is saved in their own viewer.</b> To see a child’s progress, open the Teachers’ area on their viewer. Seeing every child on one page needs progress saved online under the Fab code, which is a decision for BMF (privacy notice and DPIA first).</p>';
  function progressHTML(){
    if(!B()) return '';
    const L = knownCodes().map(look);
    const row = r => `<tr><td><b>${h(r.code)}</b></td><td>${r.set ? r.done + ' of ' + r.set + ' done' : '–'}</td><td>${r.paths.length ? r.paths.map(p => `${h(p.t)}: step ${p.step}, ${p.sec} of ${p.n} secure`).join('<br>') : '–'}</td><td>${r.stars}</td><td>${r.checks}</td><td>${r.made}</td><td>${r.last ? h(new Date(r.last).toLocaleDateString('en-GB', { day:'numeric', month:'short' })) : '–'}</td></tr>
      ${r.tasks.length ? `<tr class="tc-earned"><td colspan="7"><ul class="tc-tasks">${r.tasks.map(t => `<li><span>${t.th ? `<i class="bw-theme">${h(t.th)}</i> ` : ''}${h(t.t)}</span><b class="tc-s ${t.s === 'Done' ? 'done' : t.s === 'Started' ? 'go' : ''}">${t.s === 'Done' ? ic('star', '⭐') + ' ' : ''}${t.s}</b></li>`).join('')}</ul></td></tr>` : ''}`;
    return `<div class="me-card" id="tcProgress"><h2>${ic('map', '🗺️')} Task progress on this device</h2>
      ${L.length ? `<div style="overflow-x:auto"><table class="st-table"><thead><tr><th>Fab code</th><th>Set tasks</th><th>Flightpaths</th><th>Stars</th><th>Checkpoints</th><th>Things made</th><th>Last seen</th></tr></thead><tbody>${L.map(row).join('')}</tbody></table></div>
        <div class="st-row"><button type="button" class="btn small soft" data-tcview="print">Print achievements</button></div>`
        : '<p>No child has used this browser yet.</p>'}
      ${whereHint}</div>${aflHTML(L)}${logHTML()}`;
  }

  /* booklets a child has worked on in the app: the teacher's reading of them (assessment for learning) */
  function aflHTML(L){
    let out = ''; try{ L.forEach(r => FabBooklets.known(r.code).forEach(x => { out += FabBooklets.teacherHTML(r.code, x.b.id); })); }catch(e){}
    return out ? `<div class="me-card" id="tcAfl"><h2>${ic('books', '📚')} Booklets: what the answers tell you</h2>${out}</div>` : '';
  }

  /* ---------- print achievements ---------- */
  function printHTML(){
    if(!B()) return '';
    const L = knownCodes().map(look); if(L.length === 1 && !T.open) T.open = L[0].code;
    return `<div class="me-card" id="tcPrint"><h2>${ic('star', '🏅')} Achievements on this device</h2>
      ${L.length ? L.map(r => `<div class="tc-kid ${T.open === r.code ? 'on' : ''}"><div class="tc-kidtop"><b>${h(r.code)}</b><span>${r.earned.length === 1 ? '1 thing earned' : r.earned.length + ' things earned'} · ${r.stars} ${r.stars === 1 ? 'star' : 'stars'}</span>
          <button type="button" class="btn small ${T.open === r.code ? 'amber' : 'leaf'}" data-tcopen="${h(r.code)}">${T.open === r.code ? 'Close' : 'Celebrate'}</button></div>
        ${T.open === r.code ? `${r.earned.length ? `<ul class="tc-earnlist">${r.earned.map((e, i) => `<li><span>${ic('star', '⭐')} ${h(e.t)} <small>${h(e.s)}</small></span><button type="button" class="btn small soft" data-tccert="${h(r.code)}:${i}">Certificate</button></li>`).join('')}</ul>` : '<p class="hint">Nothing earned on this device yet. You can still make a certificate in your own words.</p>'}
          <div class="bw-row"><label class="bw-note"><span>A certificate in your own words: “for…”</span><input type="text" id="tcOwn" maxlength="60" value="${h(T.own)}" placeholder="super effort in every session this half term"></label><button type="button" class="btn small leaf" data-tcowncert="${h(r.code)}">Certificate</button></div>` : ''}</div>`).join('')
        : '<p>No child has used this browser yet.</p>'}
      <p class="hint">A certificate opens ready to print or save as a PDF. The child’s name is typed on the certificate or written by hand, and is never saved.</p>
      ${whereHint}</div>`;
  }

  /* ---------- suggest a resource: the ideas bank ---------- */
  const IDEA_KINDS = ['A booklet', 'A flightpath', 'A topic world', 'A game or activity', 'Something else'];
  const cell = v => { v = String(v == null ? '' : v); if(/^[=+\-@]/.test(v)) v = '\'' + v; return v; };
  function ideaRows(){ return [['When', 'What would help', 'Kind', 'Subject', 'Key stage', 'Why or when']].concat(ideas().map(x => [new Date(x.t).toLocaleDateString('en-GB'), x.w, x.k, x.sub, x.st, x.y].map(cell))); }
  function ideasMail(){
    const I = ideas().slice(0, 12), body = ['Ideas bank from the Fab App', ''].concat(I.map((x, i) => `${i + 1}. ${x.w}\n   ${[x.k, x.sub, x.st].filter(Boolean).join(' · ')}${x.y ? '\n   Why or when: ' + x.y : ''}`)).join('\n');
    return 'mailto:' + IDEAS_TO + '?subject=' + encodeURIComponent('Fab App ideas bank: ' + I.length + (I.length === 1 ? ' idea' : ' ideas')) + '&body=' + encodeURIComponent(body);
  }
  function suggestHTML(){
    const I = ideas(), sel = (id, cur, opts, any) => `<select id="${id}">${any ? `<option value="">${any}</option>` : ''}${opts.map(o => `<option ${cur === o ? 'selected' : ''}>${h(o)}</option>`).join('')}</select>`;
    return `<div class="me-card" id="tcSuggest"><h2>${ic('pencil', '💡')} Suggest a resource</h2>
      <p>What would help your children? A booklet, a flightpath, a topic, a game: anything. It takes a minute, and every idea goes into the ideas bank for the team to look at together.</p>
      <div class="bw-row"><label class="bw-note"><span>What would help?</span><textarea id="tcIw" rows="3" maxlength="200" placeholder="A Year 1 place value booklet with tens frames and a short low-energy version">${h(T.iw)}</textarea></label>
        <label><span>Kind</span>${sel('tcIk', T.ik, IDEA_KINDS)}</label>
        <label><span>Subject</span>${sel('tcIsub', T.isub, SUBJECTS.concat(['Wellbeing', 'Computing', 'Art and music']), 'Any subject')}</label>
        <label><span>Key stage</span>${sel('tcIst', T.ist, STAGES.map(s => s.n), 'Any stage')}</label>
        <label class="bw-note"><span>Why, or when would you use it? (optional)</span><input type="text" id="tcIy" maxlength="200" value="${h(T.iy)}" placeholder="For children coming back after a long gap in maths"></label></div>
      <div class="st-row"><button type="button" class="btn leaf" id="tcIsave">Add to the ideas bank</button></div>
      <p class="learn-msg" id="tcImsg" aria-live="polite">${h(T.imsg)}</p>
      <p class="hint"><b>Please describe the need, never a child.</b> No names, initials, schools, health or treatment details.</p></div>
      <div class="me-card" id="tcBank"><h2>${ic('books', '📚')} The ideas bank on this browser (${I.length})</h2>
      ${I.length ? `<ul class="tc-ideas">${I.map((x, i) => `<li><span><b>${h(x.w)}</b><small>${h([x.k, x.sub, x.st].filter(Boolean).join(' · '))}${x.y ? ' · ' + h(x.y) : ''}</small></span><button type="button" class="btn small soft" data-tcirm="${i}">${T.irm === i ? 'Tap again to remove' : 'Remove'}</button></li>`).join('')}</ul>
        <div class="st-row">${IDEAS_FORM ? `<a class="btn small leaf" id="tcIform" href="${h(IDEAS_FORM)}" target="_blank" rel="noopener">Open the ideas form</a>` : ''}<a class="btn small leaf" id="tcImail" href="${h(ideasMail())}">Email the ideas bank</a><button type="button" class="btn small soft" id="tcIcsv">Download as a spreadsheet</button><button type="button" class="btn small soft" id="tcIcopy">Copy for a spreadsheet</button><button type="button" class="btn small soft" id="tcIclear">${T.iclear ? 'Tap again to empty the bank' : 'Empty the bank after sending'}</button></div>`
        : '<p class="hint">No ideas yet. The first one is the hardest.</p>'}
      <p class="hint">For now the bank is kept in this browser until you send it: “Email the ideas bank” opens a draft to ${h(IDEAS_TO)} in your own email, and you press send. A bank that collects every teacher’s ideas and emails a spreadsheet each week or month needs a short online form set up by someone with a BMF account. The steps are in the handover.</p></div>`;
  }

  /* ---------- the page ---------- */
  function render(){
    const box = document.getElementById('teachBody'); if(!box) return;
    if(!TITLES[T.view]) T.view = 'home';
    const ttl = document.querySelector('#screen-teach .screen-title'); if(ttl) ttl.textContent = TITLES[T.view];
    const bk = document.querySelector('#screen-teach .btn-back'); if(bk) bk.textContent = T.view === 'home' ? '← Back' : '← Teachers’ area';
    box.dataset.view = T.view;
    box.innerHTML = T.view === 'assign' ? assignHTML() : T.view === 'progress' ? progressHTML() : T.view === 'print' ? printHTML() : T.view === 'suggest' ? suggestHTML() : T.view === 'classes' ? classesHTML() : homeHTML();
    wire(box);
  }
  function go(v){ T.view = TITLES[v] ? v : 'home'; T.rm = -1; T.irm = -1; T.iclear = 0; T.brm = -1; if(v !== 'classes'){ T.edit = null; T.emsg = ''; } render(); try{ window.scrollTo(0, 0); }catch(e){} }
  /* for tests and for links from other pages: FabTeach.choose('p:christmas-flightpath'), 'a:explore:victorian', 'a:studio', 'b:0', 'c', 'k' */
  function choose(v){
    v = String(v || ''); let k = v.slice(0, 1), id = v.slice(2);
    if(k === 'a' && id.indexOf('explore:') === 0){ k = 't'; id = id.slice(8); }
    T.view = 'assign'; T.kind = KINDS.some(x => x.k === k) ? k : ''; T.sub = 'all'; T.st = 'all'; T.pick = id; T.step = 'own'; T.text = ''; T.part = ''; T.links = []; T.msg = ''; render();
  }
  function wire(box){
    const $ = s => box.querySelector(s), on = (s, ev, f) => { const el = $(s); if(el) el.addEventListener(ev, f); };
    const all = (s, f) => box.querySelectorAll(s).forEach(el => el.addEventListener('click', () => f(el)));
    const redraw = () => render(), stale = () => { T.links = []; };
    all('[data-tcview]', b => { snd('tick'); go(b.dataset.tcview); });
    /* assign a task */
    all('[data-tccls]', b => { const v = b.dataset.tccls; T.cls = v === 'one' ? 'one' : Number(v); T.st = 'auto'; T.pick = T.kind === 'b' || T.kind === 'p' || T.kind === 't' ? '' : T.pick; T.links = []; T.msg = ''; snd('tick'); redraw(); });
    on('#tcOne', 'input', e => { T.one = String(e.target.value || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 20); stale(); });
    all('[data-tckind]', b => { T.kind = b.dataset.tckind; T.pick = ''; T.step = 'own'; T.text = ''; T.part = ''; T.sub = 'all'; T.badd = false; T.brm = -1; T.links = []; T.msg = ''; snd('tick'); redraw(); });
    all('[data-tcsub]', b => { T.sub = b.dataset.tcsub; T.pick = ''; T.links = []; snd('tick'); redraw(); });
    all('[data-tcst]', b => { T.st = b.dataset.tcst; T.pick = ''; T.links = []; snd('tick'); redraw(); });
    all('[data-tcpick]', b => { T.pick = T.pick === b.dataset.tcpick ? '' : b.dataset.tcpick; T.step = 'own'; T.brm = -1; T.links = []; T.msg = ''; snd('tick'); redraw(); });
    on('#tcStep', 'change', e => { T.step = e.target.value; stale(); });
    on('#tcLook', 'click', () => { const p = picked(); if(p && p.lib) FabBooklets.open(p.lib.id, T.step === 'own' ? 1 : Number(T.step) + 1, { teach:true, back:'screen-teach' }); });
    on('#tcText', 'input', e => { T.text = e.target.value.slice(0, 60); stale(); });
    on('#tcPart', 'input', e => { T.part = e.target.value.slice(0, 60); stale(); });
    on('#tcLabel', 'input', e => { T.label = e.target.value.slice(0, 30); stale(); });
    on('#tcDay', 'change', e => { T.day = e.target.value; stale(); });
    on('#tcNote', 'input', e => { T.note = e.target.value.slice(0, 80); stale(); });
    on('#tcMake', 'click', () => { const err = makeLinks(); if(err){ T.links = []; T.msg = err; snd('gentle'); } else { T.msg = (T.links.length === 1 ? '1 link is ready.' : T.links.length + ' links are ready, one per child.') + ' Each holds the task and your words, and nothing else.'; snd('ding'); } redraw(); });
    on('#tcCopyAll', 'click', e => { const t = T.links.map(x => x.c + '\t' + x.l).join('\n'); try{ navigator.clipboard.writeText(t); e.target.textContent = 'Copied ✓'; }catch(err){ e.target.textContent = 'Copy each link below'; } });
    all('[data-tccopy]', b => { const x = T.links.find(l => l.c === b.dataset.tccopy); if(!x) return; try{ navigator.clipboard.writeText(x.l); b.textContent = 'Copied ✓'; }catch(err){ const i = b.parentNode.querySelector('input'); if(i) i.select(); b.textContent = 'Press Ctrl+C'; } });
    /* my booklets */
    on('#tcBadd', 'click', () => { T.badd = true; T.bt = ''; T.bmsg = ''; T.bsub = T.sub === 'all' ? '' : T.sub; T.bst = T.st === 'auto' || T.st === 'all' ? '' : T.st; snd('tick'); redraw(); const i = document.getElementById('tcBt'); if(i) i.focus(); });
    on('#tcBt', 'input', e => { T.bt = e.target.value.slice(0, 40); });
    on('#tcBsub', 'change', e => { T.bsub = e.target.value; });
    on('#tcBst', 'change', e => { T.bst = e.target.value; });
    on('#tcBcancel', 'click', () => { T.badd = false; T.bmsg = ''; redraw(); });
    on('#tcBsave', 'click', () => { const t = words(T.bt, 40), L = booklets();
      if(!t){ T.bmsg = 'Type the booklet’s title first.'; snd('gentle'); redraw(); return; }
      if(L.some(b => b.t.toLowerCase() === t.toLowerCase())){ T.bmsg = 'That booklet is already on your list.'; snd('gentle'); redraw(); return; }
      L.push({ t, sub:T.bsub || subjectIn(t), st:T.bst || stageIn(t) }); ls.set(BK, L.slice(-40)); T.badd = false; T.bmsg = ''; T.sub = 'all'; T.st = 'all'; T.pick = String(Math.min(L.length, 40) - 1); T.links = []; snd('ding'); redraw(); });
    on('#tcBrm', 'click', () => { const i = Number(T.pick); if(T.brm !== i){ T.brm = i; redraw(); return; } const L = booklets(); L.splice(i, 1); ls.set(BK, L); T.brm = -1; T.pick = ''; T.links = []; snd('tick'); redraw(); });
    /* my classes */
    on('#tcNew', 'click', () => { T.edit = 'new'; T.en = ''; T.ec = ''; T.emsg = ''; snd('tick'); redraw(); });
    all('[data-tcedit]', b => { const i = Number(b.dataset.tcedit), c = classes()[i]; if(!c) return; T.edit = i; T.en = c.n; T.ec = c.codes.join('\n'); T.emsg = ''; snd('tick'); redraw(); });
    all('[data-tcrm]', b => { const i = Number(b.dataset.tcrm); if(T.rm !== i){ T.rm = i; redraw(); return; } const C = classes(); C.splice(i, 1); saveClasses(C); T.rm = -1; T.cls = 0; T.links = []; snd('tick'); redraw(); });
    on('#tcEn', 'input', e => { T.en = e.target.value.slice(0, 24); });
    on('#tcEc', 'input', e => { T.ec = e.target.value; });
    on('#tcCancel', 'click', () => { T.edit = null; T.emsg = ''; redraw(); });
    on('#tcSave', 'click', () => {
      const n = cleanName(T.en), list = parse(T.ec), good = list.filter(c => CODE_RE.test(c)), bad = list.filter(c => !CODE_RE.test(c));
      if(!n){ T.emsg = 'Give the class a name, such as Adventurers.'; snd('gentle'); redraw(); return; }
      if(bad.length){ T.emsg = 'Not a Fab code: ' + bad.join(', ') + '. Fab codes look like otter-482. Please never use a name.'; snd('gentle'); redraw(); return; }
      if(!good.length){ T.emsg = 'Add at least one Fab code.'; snd('gentle'); redraw(); return; }
      const C = classes(); if(T.edit === 'new'){ C.push({ n, codes:good.slice(0, 30) }); T.cls = C.length - 1; } else if(C[T.edit]) C[T.edit] = { n, codes:good.slice(0, 30) };
      saveClasses(C); T.edit = null; T.emsg = ''; T.links = []; T.st = 'auto'; snd('ding'); redraw(); });
    /* print achievements */
    all('[data-tcopen]', b => { T.open = T.open === b.dataset.tcopen ? ' ' : b.dataset.tcopen; T.own = ''; snd('tick'); redraw(); });
    all('[data-tccert]', b => { const [c, i] = b.dataset.tccert.split(':'); const e = look(c).earned[Number(i)]; if(e) showCert(c, e); });
    on('#tcOwn', 'input', e => { T.own = e.target.value.slice(0, 60); });
    all('[data-tcowncert]', b => { const t = words(T.own, 60); if(!t){ const i = $('#tcOwn'); if(i) i.focus(); snd('gentle'); return; } showCert(b.dataset.tcowncert, { did:'for', t, s:'' }); });
    /* suggest a resource */
    on('#tcIw', 'input', e => { T.iw = e.target.value.slice(0, 200); });
    on('#tcIk', 'change', e => { T.ik = e.target.value; });
    on('#tcIsub', 'change', e => { T.isub = e.target.value; });
    on('#tcIst', 'change', e => { T.ist = e.target.value; });
    on('#tcIy', 'input', e => { T.iy = e.target.value.slice(0, 200); });
    on('#tcIsave', 'click', () => { const w = words(T.iw, 200);
      if(!w){ T.imsg = 'Say what would help first, in a sentence or two.'; snd('gentle'); redraw(); const i = document.getElementById('tcIw'); if(i) i.focus(); return; }
      const I = ideas(); I.unshift({ t:Date.now(), w, k:T.ik, sub:T.isub, st:T.ist, y:words(T.iy, 200) }); ls.set(IK, I.slice(0, 50));
      T.iw = ''; T.iy = ''; T.imsg = 'Thank you. That is in the ideas bank.'; snd('ding'); redraw(); });
    all('[data-tcirm]', b => { const i = Number(b.dataset.tcirm); if(T.irm !== i){ T.irm = i; T.iclear = 0; redraw(); return; } const I = ideas(); I.splice(i, 1); ls.set(IK, I); T.irm = -1; snd('tick'); redraw(); });
    on('#tcIclear', 'click', () => { if(!T.iclear){ T.iclear = 1; T.irm = -1; redraw(); return; } ls.set(IK, []); T.iclear = 0; T.imsg = 'The ideas bank is empty again.'; snd('tick'); redraw(); });
    on('#tcIcopy', 'click', e => { const t = ideaRows().map(r => r.map(c => String(c).replace(/[\t\n]+/g, ' ')).join('\t')).join('\n'); try{ navigator.clipboard.writeText(t); e.target.textContent = 'Copied ✓ Paste into Excel'; }catch(err){ e.target.textContent = 'Copying is blocked here: use Download'; } });
    on('#tcIcsv', 'click', e => { try{ const csv = '﻿' + ideaRows().map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\r\n');
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type:'text/csv' })); a.download = 'fab-app-ideas-bank-' + today() + '.csv'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); e.target.textContent = 'Downloaded ✓'; }catch(err){ e.target.textContent = 'Downloading is blocked here: use Copy'; } });
    /* more */
    on('#tcStaff', 'click', () => { const bk = document.querySelector('#screen-staff .btn-back'); if(bk) bk.dataset.go = 'screen-teach'; showScreen('screen-staff'); });
    on('#tcAll', 'click', () => { if(B()) B().openAll(); else showScreen('screen-learn'); });
  }

  /* ---------- the door on the landing page ---------- */
  let arm = 0;
  function open(){ T.view = 'home'; showScreen('screen-teach'); }
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
    /* Back from a page inside the Teachers' area returns to its four cards, not to the app's landing page */
    document.querySelector('#screen-teach .btn-back').addEventListener('click', e => { if(T.view !== 'home'){ e.stopPropagation(); e.preventDefault(); snd('tick'); go('home'); } }, true);
    const st = document.createElement('style'); st.textContent = `
.teach-door{text-align:center;margin:14px 0 4px}
.teach-door .btn{display:inline-flex;align-items:center;gap:8px}.teach-door svg{width:1.3em;height:1.3em}
#screen-teach .me-card{text-align:left}#screen-teach .me-card h2{display:flex;align-items:center;gap:10px}#screen-teach .me-card h2 svg{width:1.4em;height:1.4em;flex:none}
.tc-top{text-align:center;margin:4px 0 12px}
.tc-home{grid-template-columns:repeat(2,minmax(0,1fr));max-width:820px}
@media (max-width:620px){.tc-home{grid-template-columns:1fr}}
.tc-tile .emoji svg,.tc-tile .emoji .fi{width:1.5em;height:1.5em}
.tc-foot{max-width:820px;margin:18px auto 0;background:transparent;border:0;box-shadow:none;padding:0}.tc-foot .st-row{justify-content:center}
.tc-foot .btn{display:inline-flex;align-items:center;gap:8px}.tc-foot .btn svg{width:1.2em;height:1.2em}
.tc-step h2{margin:18px 0 8px;font-size:1.25rem}.tc-step h2:first-child{margin-top:0}
.tc-n{display:inline-grid;place-items:center;width:1.7em;height:1.7em;flex:none;border-radius:50%;background:#FFD483;border:2.5px solid #2B1A12;font-size:.95em}
.tc-chips{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.tc-chip{display:inline-flex;align-items:center;gap:6px}.tc-chip svg{width:1.2em;height:1.2em}
.tc-chip[aria-pressed="true"]{box-shadow:0 0 0 3px #2B1A12}
.tc-filter{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;margin:8px 0}.tc-filter > span{min-width:5.2em;font-weight:700}
.tc-say{margin:8px 0 0}
.tc-picks{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;margin:12px 0}
.tc-pick{display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;font:inherit;color:inherit;cursor:pointer;background:#fff;border:3px solid #E3C9A0;border-radius:16px;padding:12px 10px;min-height:112px}
.tc-pick:hover{border-color:#2B1A12}.tc-pick.on{border-color:#2B1A12;background:#DDF0CF;box-shadow:0 3px 0 #2B1A12}
.tc-pick b{font-weight:700;line-height:1.2}.tc-pick small{opacity:.8}
.tc-tag{font-style:normal;font-size:.8rem;font-weight:700;border:2px solid #2B1A12;border-radius:999px;padding:0 9px;background:#FFF6E6;margin-top:auto}.tc-tag.app{background:#CFE7F2}
.tc-about{background:#EAF3F1;border:2px dashed #2F5458;border-radius:14px;padding:8px 14px;margin:10px 0}.tc-about p{margin:6px 0}
.tc-pic{font-size:1.9rem;line-height:1}.tc-pic svg{width:44px;height:44px;display:block}
.tc-list{list-style:none;margin:8px 0;padding:0;display:grid;gap:8px}
.tc-list li{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;background:#FFF6E6;border:2px solid #E3C9A0;border-radius:14px;padding:8px 12px}
.tc-list li span{flex:1 1 240px;min-width:0;overflow-wrap:anywhere}
.tc-edit{align-items:end}.tc-edit textarea,#tcSuggest textarea{width:100%;min-height:84px;font:inherit;border:2px solid #2B1A12;border-radius:12px;padding:8px 10px;background:#fff;box-sizing:border-box}
.tc-bform{background:#FFF6E6;border:2px dashed #E3C9A0;border-radius:14px;padding:10px 12px;margin-top:8px}
.tc-earned td{background:#FFF6E6;text-align:left}
.tc-tasks,.tc-earnlist,.tc-ideas{list-style:none;margin:8px 0;padding:0;display:grid;gap:6px}
.tc-tasks li,.tc-earnlist li,.tc-ideas li{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;border-bottom:1px dashed #E3C9A0;padding:4px 0}
.tc-tasks li span,.tc-ideas li span{flex:1 1 260px;min-width:0;overflow-wrap:anywhere}
.tc-ideas small{display:block;opacity:.8}
.tc-tasks .bw-theme{font-style:normal;display:inline-block}
.tc-s{white-space:nowrap;border:2px solid #E3C9A0;border-radius:999px;padding:1px 10px;background:#fff;font-weight:700}
.tc-s.done{background:#DDF0CF;border-color:#2B1A12}.tc-s.go{background:#FFD483;border-color:#2B1A12}
.tc-s svg,.tc-earnlist li svg{width:1.1em;height:1.1em;vertical-align:-.15em}.tc-earnlist small{opacity:.75;margin-left:6px}
.tc-kid{border:2px solid #E3C9A0;border-radius:14px;padding:8px 12px;margin:8px 0;background:#fff}.tc-kid.on{background:#FFF6E6}
.tc-kidtop{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px}.tc-kidtop span{flex:1 1 200px}
#tcProgress .st-table td{vertical-align:top}
#tcBank a.btn{text-decoration:none;display:inline-block}`;
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
  window.FabTeach = { open, render, go, choose, classes, booklets, ideas, look, form:T, known:knownCodes, stages:STAGES };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
