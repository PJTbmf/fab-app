/* me.js — Fab codes (signing in), My Burrow (was My Fab space; shelves in burrow.js), and the soft impact log.
   Pupil codes only (like otter-482): the app never asks for, shows or stores a child's name.
   Everything is kept in this browser on this device. Nothing is sent anywhere.
   Loaded after the main script. Draft for BMF to check (privacy notice, DPIA, AI and data policy). */
(function(){
  'use strict';
  const q1 = s => document.querySelector(s);
  const h = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const ls = { get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }, set(k, v){ try{ localStorage.setItem(k, v); }catch(e){} }, del(k){ try{ localStorage.removeItem(k); }catch(e){} },
    json(k, f){ try{ const v = JSON.parse(localStorage.getItem(k)); return v == null ? f : v; }catch(e){ return f; } } };
  const tick = () => { try{ Sound.tick(); }catch(e){} }, ding = () => { try{ Sound.ding(); }catch(e){} };
  const CODE_RE = /^[a-z]{2,12}-\d{3}$/;
  const FEEL = { happy:'😊', calm:'😌', excited:'🤩', loved:'🥰', proud:'😎', curious:'🤔', sleepy:'😴', okay:'🙂' };
  const BRIGHT = ['happy', 'excited', 'loved', 'proud'], SETTLED = ['calm', 'curious', 'okay'];
  const LIKES = ['⚽','🏏','🩰','🎸','🎮','🎨','📚','🦖','🐴','🚀','🎤','🧁','🐶','🐱','🏊','🧩','🎹','🌳'];
  const COLOURS = ['#FE4D02','#FE4D02','#EF915E','#F3BB17','#4F7A2E','#3F6A8C','#5aa9e6','#9b6bd1','#ff8fab'];
  const STAGE = ['a tiny cub', 'a growing cub', 'a big, happy fox'];

  /* ================= Soft impact log ================= */
  const FabImpact = {
    key(c){ return 'fabimpact-' + (c || fabLearnerCode() || 'local'); },
    read(c){ const a = ls.json(this.key(c), []); return Array.isArray(a) ? a : []; },
    write(c, a){ ls.set(this.key(c), JSON.stringify(a.slice(-800))); },
    log(k, v, extra){ const c = fabLearnerCode() || 'local', a = this.read(c); a.push(Object.assign({ t:Date.now(), d:today(), k, v }, extra || {})); this.write(c, a); },
    count(k){ return this.read().filter(e => e.k === k).length; },
    asked(){ return this.read().some(e => e.k === 'ask' && e.d === today()); },
    markAsked(){ this.log('ask', 1); },
    visit(id, m){ const c = fabLearnerCode() || 'local', a = this.read(c); let e = a.find(x => x.k === 'visit' && x.id === id); if(!e){ e = { t:Date.now(), d:today(), k:'visit', id }; a.push(e); } Object.assign(e, m); this.write(c, a); },
    codes(){ const out = []; try{ for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); if(k && k.indexOf('fabimpact-') === 0) out.push(k.slice(10)); } }catch(e){} return out.sort(); },
    summary(c){
      const a = this.read(c), s = { code:c, days:0, mins:0, stars:0, checkins:0, feel:{}, enjoy:[], conf:[], steps:{ easy:0, right:0, tricky:0 }, first:0, last:0 }, days = new Set();
      a.forEach(e => {
        if(e.k !== 'ask') days.add(e.d);
        s.last = Math.max(s.last, e.t || 0); s.first = s.first ? Math.min(s.first, e.t || s.first) : (e.t || 0);
        if(e.k === 'visit'){ s.mins += Number(e.mins) || 0; s.stars += Number(e.stars) || 0; }
        if(e.k === 'checkin'){ s.checkins++; if(e.q === 'feel') s.feel[e.v] = (s.feel[e.v] || 0) + 1; else if(e.q === 'enjoy') s.enjoy.push(Number(e.v)); else if(e.q === 'confidence') s.conf.push(Number(e.v)); }
        if(e.k === 'step' && s.steps[e.v] != null) s.steps[e.v]++;
      });
      s.days = days.size; s.mins = Math.round(s.mins);
      return s;
    },
    csv(codes){
      const rows = [['code','date','time','kind','value','question','minutes','stars','detail']];
      (codes || this.codes()).forEach(c => this.read(c).forEach(e => {
        const d = new Date(e.t || 0), tm = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
        rows.push([c, e.d || '', tm, e.k || '', e.v == null ? '' : e.v, e.q || '', e.mins == null ? '' : e.mins, e.stars == null ? '' : e.stars, e.step || e.pack || '']);
      }));
      return rows.map(r => r.map(x => { x = String(x); return /[",\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x; }).join(',')).join('\n');
    },
    importCSV(text){
      const lines = String(text || '').split(/\r?\n/).filter(Boolean); if(!lines.length) return 0;
      const split = l => { const out = []; let cur = '', qd = false; for(let i = 0; i < l.length; i++){ const ch = l[i]; if(qd){ if(ch === '"' && l[i + 1] === '"'){ cur += '"'; i++; } else if(ch === '"') qd = false; else cur += ch; } else if(ch === '"') qd = true; else if(ch === ','){ out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out; };
      const head = split(lines[0]); if(head[0] !== 'code' || head[3] !== 'kind') return 0;
      let n = 0; const byCode = {};
      lines.slice(1).forEach(l => {
        const r = split(l), c = fabCodeClean(r[0]); if(!c || !r[1]) return;
        const [hh, mm] = (r[2] || '00:00').split(':').map(Number), dt = new Date(r[1] + 'T00:00:00'); dt.setHours(hh || 0, mm || 0, 0, 0);
        const e = { t:dt.getTime(), d:r[1], k:r[3], v:isNaN(Number(r[4])) || r[4] === '' ? r[4] : Number(r[4]) };
        if(r[5]) e.q = r[5]; if(r[6] !== '') e.mins = Number(r[6]); if(r[7] !== '') e.stars = Number(r[7]); if(r[8]) e.step = r[8];
        (byCode[c] = byCode[c] || []).push(e);
      });
      Object.keys(byCode).forEach(c => {
        const a = this.read(c), seen = new Set(a.map(e => [e.d, e.k, e.v, e.q, e.t].join('|')));
        byCode[c].forEach(e => { const k = [e.d, e.k, e.v, e.q, e.t].join('|'); if(!seen.has(k)){ seen.add(k); a.push(e); n++; } });
        a.sort((x, y) => (x.t || 0) - (y.t || 0)); this.write(c, a);
      });
      return n;
    },
    clearAll(){ this.codes().forEach(c => ls.del('fabimpact-' + c)); }
  };
  window.FabImpact = FabImpact;

  /* ================= Screens ================= */
  const CSS = `
.me-voices{ display:flex; flex-wrap:wrap; gap:8px; margin:6px 0; }
.me-voices button{ border:3px solid var(--ink,#2B1A12); background:var(--cream,#FFF6E6); border-radius:14px; padding:8px 14px; font:inherit; font-weight:700; cursor:pointer; min-height:48px; }
.me-voices button.on{ background:var(--sunshine,#FFD483); box-shadow:0 0 0 3px rgba(254,77,2,.35); }
.me-voices small{ font-weight:400; opacity:.75; }
.whobar{display:flex;justify-content:center;margin:2px 0 10px}
.who-btn{border:0;border-radius:999px;background:#fff;padding:10px 18px;font:700 1.05rem Aleo,Georgia,serif;color:var(--ink,#2B1A12);cursor:pointer;box-shadow:0 3px 0 rgba(43,26,18,.16);min-height:48px;display:inline-flex;align-items:center;gap:8px}
.who-btn .dot{width:14px;height:14px;border-radius:50%;display:inline-block}
.me-card{background:rgba(255,255,255,.88);border-radius:22px;padding:16px 18px;box-shadow:0 4px 0 rgba(43,26,18,.1);margin:0 auto 14px;max-width:880px}
.me-card h2{margin:4px 0 6px;color:var(--flame-dark,#C93C00)}.me-card h3{margin:0 0 8px}
.me-login{text-align:center}.me-fox{font-size:3.4rem}
.me-form{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:10px 0}
.me-form input{font:700 1.5rem Aleo,Georgia,serif;padding:10px 14px;border-radius:16px;border:3px solid #f3bb17;width:min(280px,80vw);text-align:center;background:#fffdf6;color:var(--ink,#2B1A12)}
.me-msg{min-height:1.4em;font-weight:700;color:var(--flame-dark,#C93C00);margin:4px 0}
.me-tap{margin-top:8px}.me-animals{display:grid;grid-template-columns:repeat(auto-fill,minmax(86px,1fr));gap:8px;margin:8px 0}
.me-animals button,.me-keys button,.me-likes button,.me-cols button{border:0;border-radius:16px;background:#fff;cursor:pointer;box-shadow:0 3px 0 rgba(43,26,18,.16);font:700 .9rem Aleo,Georgia,serif;color:var(--ink,#2B1A12);min-height:56px}
.me-animals button{display:flex;flex-direction:column;align-items:center;padding:8px 4px}.me-animals button i{font-style:normal;font-size:1.8rem}
.me-animals button.on,.me-likes button.on{background:#ffd483;outline:3px solid var(--ink,#2B1A12)}
.me-built{font:700 1.8rem Aleo,Georgia,serif;margin:6px 0;letter-spacing:1px}
.me-keys{display:grid;grid-template-columns:repeat(5,minmax(52px,72px));gap:8px;justify-content:center}.me-keys button{font-size:1.4rem}
.me-hello{display:flex;align-items:center;gap:16px;border-left:12px solid var(--me,#f3bb17)}
.me-ava{font-size:3.6rem;width:84px;height:84px;border-radius:50%;background:var(--me,#f3bb17);display:flex;align-items:center;justify-content:center;flex:0 0 auto;box-shadow:inset 0 -6px 0 rgba(0,0,0,.12)}
.me-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;max-width:880px;margin:0 auto 14px}
.me-tile{text-align:left;min-height:120px}.me-tile .emoji{font-size:2rem}.me-tile h3{margin:4px 0 2px;color:var(--flame-dark,#C93C00)}.me-tile p{margin:0}
.me-tre{display:flex;flex-wrap:wrap;gap:8px;font-size:1.3rem}.me-tre span{background:#fff7e6;border-radius:12px;padding:4px 8px}
.me-art{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px}.me-art img{width:100%;border-radius:10px;box-shadow:0 2px 0 rgba(43,26,18,.2)}
.me-likes{display:grid;grid-template-columns:repeat(auto-fill,minmax(56px,1fr));gap:8px}.me-likes button{font-size:1.6rem}
.me-cols{display:flex;flex-wrap:wrap;gap:8px}.me-cols button{width:48px;height:48px;border-radius:50%;min-height:0;border:4px solid #fff}.me-cols button.on{outline:4px solid var(--ink,#2B1A12)}
.me-foot{max-width:880px;margin:0 auto;display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.st-table{width:100%;border-collapse:collapse;font-size:.92rem;background:#fff;border-radius:12px;overflow:hidden}
.st-table th,.st-table td{padding:7px 8px;border-bottom:1px solid #f0e2c8;text-align:left;vertical-align:top}.st-table th{background:#fff1d6}
.st-table tr.tot td{font-weight:700;background:#fff8ea}
.st-codes{display:flex;flex-direction:column;gap:6px;margin-top:8px}.st-codes div{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.st-codes input{flex:1;min-width:220px;font-size:.85rem;padding:6px 8px;border-radius:10px;border:1px solid #e3d3b5}
.st-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0}
.st-note{font-size:.9rem;line-height:1.45}.st-note li{margin-bottom:4px}
.say-btn{border:0;background:#fff;border-radius:999px;width:44px;height:44px;margin-left:8px;font-size:1.2rem;cursor:pointer;box-shadow:0 2px 0 rgba(43,26,18,.2);vertical-align:middle}
.mx-text .say-btn{float:right;margin:0 0 6px 8px}
.pw-how{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:8px;font-weight:700}.pw-how button{border:0;border-radius:999px;background:#fff;padding:8px 12px;font:700 .95rem Aleo,Georgia,serif;cursor:pointer;box-shadow:0 2px 0 rgba(43,26,18,.16);min-height:44px;color:var(--ink,#2B1A12)}
`;
  const HTML = `
<section id="screen-me" class="screen" aria-label="My Burrow">
  <div class="screen-top"><button class="btn-back" data-go="screen-hub">← Back</button><h1 class="screen-title">🦊 My Burrow</h1></div>
  <div id="meBody"></div>
</section>
<section id="screen-staff" class="screen" aria-label="For staff: Fab codes and soft impact">
  <div class="screen-top"><button class="btn-back" data-go="screen-learn">← Back</button><h1 class="screen-title">🧑‍🏫 For staff</h1></div>
  <div id="staffBody"></div>
</section>`;

  function worldOf(code){ return ls.json('fabworld-v2-' + code, null); }
  function animalOf(code){ const w = String(code).split('-')[0]; return (typeof PUPIL_EMOJI !== 'undefined' && PUPIL_EMOJI[w]) || '🦊'; }
  function colourOf(code){ return ls.get('fab-colour-' + code) || COLOURS[3]; }

  function renderWho(){
    const b = q1('#whoBtn'); if(!b) return;
    const c = fabLearnerCode();
    b.innerHTML = c ? `<span class="dot" style="background:${h(colourOf(c))}"></span>${animalOf(c)} ${h(c)} · My Burrow` : '👋 Sign in with your Fab code';
    b.setAttribute('aria-label', c ? 'My Burrow for ' + c : 'Sign in with your Fab code');
  }

  /* ---- signing in ---- */
  function signIn(code){
    code = fabCodeClean(code);
    if(!CODE_RE.test(code)) return false;
    ls.set('fab-me', code); ls.del('fab-guest'); ding(); renderMe(); renderWho(); return true;
  }
  function codeProblem(raw){
    const c = fabCodeClean(raw);
    if(!c) return 'Type your Fab code, or tap your animal below.';
    if(!/\d/.test(c)) return 'Fab codes have numbers in them, like otter-482. Please never type your name. Ask your teacher for your code.';
    if(!CODE_RE.test(c)) return 'That does not look like a Fab code yet. It is an animal, a dash and three numbers, like otter-482.';
    return '';
  }
  function loginHTML(){
    const words = (typeof PUPIL_WORDS !== 'undefined' ? PUPIL_WORDS : ['otter','fox','owl']);
    return `<div class="me-card me-login">
      <div class="me-fox" aria-hidden="true">🦊</div>
      <h2>Welcome! What is your Fab code?</h2>
      <p>Your teacher gives you a code, like <b>otter-482</b>. It keeps your stars, treasure, cub and learning safe on this device. <b>Please never type your name.</b></p>
      <form id="meForm" class="me-form" autocomplete="off"><input id="meCode" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="20" placeholder="otter-482" aria-label="Your Fab code"><button class="btn leaf" type="submit">Let's go ➡️</button></form>
      <p class="me-msg" id="meMsg" aria-live="polite"></p>
      <details class="me-tap"><summary><b>Or tap to make your code</b> (no typing)</summary>
        <p>1. Tap your animal.</p><div class="me-animals">${words.map(w => `<button type="button" data-meanimal="${h(w)}"><i>${(typeof PUPIL_EMOJI !== 'undefined' && PUPIL_EMOJI[w]) || '🐾'}</i>${h(w)}</button>`).join('')}</div>
        <p>2. Tap your three numbers.</p><div class="me-built" id="meBuilt" aria-live="polite">?-___</div>
        <div class="me-keys">${[1,2,3,4,5,6,7,8,9,0].map(n => `<button type="button" data-mekey="${n}">${n}</button>`).join('')}</div>
        <div class="st-row" style="justify-content:center"><button type="button" class="btn soft small" data-mekey="back">⌫ Rub out</button><button type="button" class="btn leaf" id="meTapGo" disabled>That's me ➡️</button></div>
      </details>
      <div class="st-row" style="justify-content:center"><button type="button" class="btn soft small" id="meGuest">Just look around for now</button></div>
      <p class="hint">No code yet? That is fine. Ask your teacher. Teachers can make codes in the Learning Hub, under “For staff”.</p>
    </div>`;
  }
  function wireLogin(box){
    const msg = box.querySelector('#meMsg');
    box.querySelector('#meForm').addEventListener('submit', e => { e.preventDefault(); const v = box.querySelector('#meCode').value; const p = codeProblem(v); if(p){ msg.textContent = p; tick(); return; } signIn(v); });
    let animal = '', digits = '';
    const built = box.querySelector('#meBuilt'), go = box.querySelector('#meTapGo');
    const paint = () => { built.textContent = (animal || '?') + '-' + (digits + '___').slice(0, 3); go.disabled = !(animal && digits.length === 3); };
    box.querySelectorAll('[data-meanimal]').forEach(b => b.addEventListener('click', () => { animal = b.dataset.meanimal; box.querySelectorAll('[data-meanimal]').forEach(x => x.classList.toggle('on', x === b)); tick(); paint(); }));
    box.querySelectorAll('[data-mekey]').forEach(b => b.addEventListener('click', () => { const k = b.dataset.mekey; if(k === 'back') digits = digits.slice(0, -1); else if(digits.length < 3) digits += k; tick(); paint(); }));
    go.addEventListener('click', () => signIn(animal + '-' + digits));
    box.querySelector('#meGuest').addEventListener('click', () => { ls.set('fab-guest', '1'); tick(); showScreen('screen-hub'); });
  }

  /* ---- My Burrow ---- */
  function renderMe(){
    const box = q1('#meBody'); if(!box) return;
    const code = fabLearnerCode();
    if(!code){ box.innerHTML = loginHTML(); wireLogin(box); return; }
    const W = worldOf(code) || {}, col = W.col || {}, makes = W.makes || [], cub = W.cub || {};
    const last = ls.json('fab-last-' + code, null), pack = last && typeof Learn !== 'undefined' ? Learn.all().find(p => p.id === last.id) : null;
    const likes = ls.json('fab-likes-' + code, []), me = colourOf(code);
    const nTre = Object.keys(col).length, stage = cub.has ? (cub.name ? h(cub.name) + ' is ' : 'Your cub is ') + STAGE[Math.max(0, Math.min(2, (cub.care || 0) >= 25 ? 2 : (cub.care || 0) >= 8 ? 1 : 0))] : 'An egg is waiting by the treehouse';
    const fromUrl = (() => { try{ return !!new URLSearchParams(location.search).get('learner'); }catch(e){ return false; } })();
    box.innerHTML = `
      <div class="me-card me-hello" style="--me:${h(me)}"><div class="me-ava" aria-hidden="true">${animalOf(code)}</div>
        <div><h2>Hello, ${h(code)}!</h2><p>This is your Burrow. Your work, your flightpaths and the things you make all live here.</p></div></div>
      ${window.FabBurrow ? FabBurrow.shelvesHTML(code) : ''}
      <div class="me-grid">
        <button class="tile me-tile" data-me="learn"><span class="emoji">📚</span><h3>${pack ? 'Carry on learning' : 'Learning'}</h3><p>${pack ? h((pack.emoji || '📘') + ' ' + pack.title) : 'Pick a lesson in the Learning Hub'}</p></button>
        <button class="tile me-tile" data-me="world"><span class="emoji">🌍</span><h3>Fab Fox World</h3><p>⭐ ${Number(W.spk) || 0} stars · ${stage}</p></button>
        <button class="tile me-tile" data-me="studio"><span class="emoji">🎨</span><h3>Make More FAB Studio</h3><p>${makes.length ? makes.length + ' ' + (makes.length === 1 ? 'picture' : 'pictures') + ' made by you' : 'Make, create, discover and explore'}</p></button>
        <button class="tile me-tile" data-me="hello"><span class="emoji">👋</span><h3>Today's hello</h3><p>Say hello and share how you are</p></button>
      </div>
      <div class="me-card"><h3>🧺 My treasure</h3>${nTre ? `<div class="me-tre">${Object.keys(col).map(e => `<span>${h(e)} ×${Number(col[e]) || 0}</span>`).join('')}</div>` : '<p>No treasure yet. Win it in Learning and games, or find it in Fab Fox World.</p>'}</div>
      ${makes.length ? `<div class="me-card"><h3>🖼️ My art</h3><div class="me-art">${makes.slice(0, 8).map(m => `<img src="${h(m.d)}" alt="A picture you made">`).join('')}</div></div>` : ''}
      <div class="me-card"><h3>💛 Things I love</h3><p class="hint">Pick up to three. They help your teacher choose things you will enjoy.</p><div class="me-likes">${LIKES.map(l => `<button type="button" data-melike="${l}" class="${likes.indexOf(l) >= 0 ? 'on' : ''}" aria-pressed="${likes.indexOf(l) >= 0}">${l}</button>`).join('')}</div></div>
      ${window.speechSynthesis ? `<div class="me-card"><h3>🗣️ My reading voice</h3>${voicePickerHTML()}</div>` : ''}
      <div class="me-card"><h3>🎨 My colour</h3><div class="me-cols">${COLOURS.map(c => `<button type="button" data-mecol="${c}" class="${c === me ? 'on' : ''}" style="background:${c}" aria-label="Choose this colour"></button>`).join('')}</div></div>
      <div class="me-foot">${fromUrl ? '<span class="hint">This link is just for you. Your teacher set it up.</span>' : '<button type="button" class="btn soft small" id="meSwitch">Not you? Use a different code</button><span class="hint">This device remembers your code. On a shared computer, press this when you finish.</span>'}</div>`;
    if(window.FabBurrow) FabBurrow.wire(box, code);
    box.querySelectorAll('[data-me]').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.me; tick();
      if(k === 'learn'){ if(pack) learnOpen(pack); else showScreen('screen-learn'); }
      else if(k === 'world') showScreen('screen-world');
      else if(k === 'studio'){ window.fabWorldOpen = 'studio'; showScreen('screen-world'); }
      else if(k === 'hello') showScreen('screen-hello');
    }));
    box.querySelectorAll('[data-melike]').forEach(b => b.addEventListener('click', () => {
      let L = ls.json('fab-likes-' + code, []); const l = b.dataset.melike;
      if(L.indexOf(l) >= 0) L = L.filter(x => x !== l); else { L.push(l); if(L.length > 3) L = L.slice(-3); }
      ls.set('fab-likes-' + code, JSON.stringify(L)); tick(); renderMe();
    }));
    wireVoices(box, () => { if(q1('#screen-me') && q1('#screen-me').classList.contains('active')) renderMe(); });
    box.querySelectorAll('[data-mecol]').forEach(b => b.addEventListener('click', () => { ls.set('fab-colour-' + code, b.dataset.mecol); tick(); renderMe(); renderWho(); }));
    const sw = box.querySelector('#meSwitch'); if(sw) sw.addEventListener('click', () => { ls.del('fab-me'); tick(); renderMe(); renderWho(); });
  }

  /* ---- For staff: codes and the soft impact log ---- */
  let staffCodes = [], clearArm = false;
  function avg(a){ return a.length ? (a.reduce((x, y) => x + y, 0) / a.length) : null; }
  function feelCell(f){ const k = Object.keys(f).sort((a, b) => f[b] - f[a]); return k.length ? k.slice(0, 4).map(x => (FEEL[x] || '•') + '×' + f[x]).join(' ') : '–'; }
  function renderStaff(){
    const box = q1('#staffBody'); if(!box) return;
    const codes = FabImpact.codes(), S = codes.map(c => FabImpact.summary(c));
    const all = { days:0, mins:0, stars:0, checkins:0, feel:{}, enjoy:[], conf:[], steps:{ easy:0, right:0, tricky:0 } };
    S.forEach(s => { all.days += s.days; all.mins += s.mins; all.stars += s.stars; all.checkins += s.checkins; Object.keys(s.feel).forEach(k => all.feel[k] = (all.feel[k] || 0) + s.feel[k]); all.enjoy = all.enjoy.concat(s.enjoy); all.conf = all.conf.concat(s.conf); Object.keys(s.steps).forEach(k => all.steps[k] += s.steps[k]); });
    const nFeel = Object.values(all.feel).reduce((a, b) => a + b, 0), brightOrSettled = BRIGHT.concat(SETTLED).reduce((a, k) => a + (all.feel[k] || 0), 0);
    const nSteps = all.steps.easy + all.steps.right + all.steps.tricky;
    const confGood = all.conf.filter(v => v >= 2).length;
    const e1 = avg(all.enjoy);
    const row = s => { const ea = avg(s.enjoy); const c0 = s.conf[0], c1 = s.conf[s.conf.length - 1];
      return `<tr><td><b>${h(animalOf(s.code))} ${h(s.code)}</b></td><td>${s.days}</td><td>${s.mins}</td><td>${s.stars}</td><td>${s.checkins}</td><td>${feelCell(s.feel)}</td><td>${ea == null ? '–' : '★ ' + ea.toFixed(1) + ' <small>(' + s.enjoy.length + ')</small>'}</td><td>${s.conf.length ? ['','🌱','😊','🌟'][c0] + (s.conf.length > 1 ? ' → ' + ['','🌱','😊','🌟'][c1] : '') + ' <small>(' + s.conf.length + ')</small>' : '–'}</td><td>${s.steps.easy + s.steps.right + s.steps.tricky ? '😌' + s.steps.easy + ' 😊' + s.steps.right + ' 🧗' + s.steps.tricky : '–'}</td><td>${s.last ? new Date(s.last).toLocaleDateString('en-GB') : '–'}</td></tr>`; };
    box.innerHTML = `
      <div class="me-card"><h2>Fab codes for children</h2>
        <p>Give each child a Fab code instead of using their name. Keep the list of which child has which code in your secure records (for example Beacon), never in the app.</p>
        <div class="st-row"><button type="button" class="btn small leaf" id="stMake">Make 4 new codes</button></div>
        <div class="st-codes" id="stCodes">${staffCodes.map(c => `<div><b>${h(animalOf(c))} ${h(c)}</b><input readonly value="${h(location.origin + location.pathname + '?learner=' + c)}" aria-label="App link for ${h(c)}"><button type="button" class="btn small soft" data-stcopy="${h(c)}">Copy link</button></div>`).join('')}</div>
        <p class="hint">A child can use their own link (best in Pencil Spaces: one Web Viewer per child), or type or tap their code on the welcome screen.</p></div>
      ${window.FabClass ? FabClass.staffHTML() : ''}
      ${window.FabBurrow ? FabBurrow.staffHTML() : ''}
      ${window.FabCheck ? FabCheck.celebrateHTML() : ''}
      <div class="me-card"><h2>Soft impact on this device</h2>
        ${codes.length ? `<div style="overflow-x:auto"><table class="st-table"><thead><tr><th>Code</th><th>Days</th><th>Minutes in World</th><th>Stars earned</th><th>Check-ins</th><th>Feelings</th><th>Enjoyment</th><th>Confidence (first → latest)</th><th>How learning felt</th><th>Last seen</th></tr></thead>
          <tbody>${S.map(row).join('')}<tr class="tot"><td>All (${codes.length})</td><td>${all.days}</td><td>${all.mins}</td><td>${all.stars}</td><td>${all.checkins}</td><td>${nFeel ? Math.round(100 * brightOrSettled / nFeel) + '% bright or settled' : '–'}</td><td>${e1 == null ? '–' : '★ ' + e1.toFixed(1)}</td><td>${all.conf.length ? Math.round(100 * confGood / all.conf.length) + '% getting there or strong' : '–'}</td><td>${nSteps ? Math.round(100 * all.steps.right / nSteps) + '% just right' : '–'}</td><td></td></tr></tbody></table></div>`
          : '<p>No check-ins on this device yet. They appear once children have used Fab Fox World or Learning with a Fab code.</p>'}
        <div class="st-row"><button type="button" class="btn small leaf" id="stCsv">Download CSV</button><button type="button" class="btn small soft" id="stCopy">Copy CSV</button>
          <label class="btn small soft" style="cursor:pointer">Add CSV from another device<input type="file" id="stFile" accept=".csv,text/csv" hidden></label>
          <button type="button" class="btn small soft" id="stClear">${clearArm ? 'Tap again to clear this device’s log' : 'Clear this device’s log'}</button></div>
        <p class="learn-msg" id="stMsg" aria-live="polite"></p></div>
      ${window.speechSynthesis ? `<div class="me-card"><h2>🗣️ Reading voice on this device</h2><p>Read to me uses a voice built into the device. We pick the warmest British voice we can find. Tap one to hear it and choose it. On Microsoft Edge, look for <b>Maisie</b>, a young British voice.</p>${voicePickerHTML()}</div>` : ''}
      <div class="me-card st-note"><h2>How the soft impact log works</h2><ul>
        <li><b>Low-key and optional.</b> Once a day, after some play, Pip asks one gentle question when the child goes home in Fab Fox World: how they feel, how much they enjoyed Fab time, or how they feel about their learning. “Not today” is always there, and every answer earns a thank-you star.</li>
        <li><b>Positive by design.</b> The choices are all non-negative (for example “Still growing”, “Getting there”, “Feeling strong”). Low energy is shown as context, not as a problem.</li>
        <li><b>After Learning treasure</b> the child can say how the step felt: easy, just right, or tricky but kept going. This helps pitch the next lesson.</li>
        <li><b>Engagement</b> (days, minutes in Fab Fox World, stars earned) is counted automatically.</li>
        <li><b>Pupil codes only.</b> No names, health information or free text are collected.</li>
        <li><b>Stays on the device.</b> Nothing is sent anywhere. To build a service-wide picture, download the CSV on each device and add it here, or move to a central database later.</li>
        <li><b>Before using with children:</b> include this in BMF's privacy notice, DPIA and AI and data policy, and tell families in plain words. This is a draft for BMF to check.</li></ul></div>`;
    if(window.FabCheck) FabCheck.celebrateWire(box, renderStaff);
    if(window.FabBurrow) FabBurrow.staffWire(box, renderStaff);
    if(window.FabClass) FabClass.staffWire(box, renderStaff);
    wireVoices(box, () => { if(q1('#screen-staff') && q1('#screen-staff').classList.contains('active')) renderStaff(); });
    box.querySelector('#stMake').addEventListener('click', () => { staffCodes = staffCodes.concat(typeof pupilMakeCodes === 'function' ? pupilMakeCodes(4) : []); tick(); renderStaff(); });
    box.querySelectorAll('[data-stcopy]').forEach(b => b.addEventListener('click', () => { const link = location.origin + location.pathname + '?learner=' + b.dataset.stcopy; try{ navigator.clipboard.writeText(link); b.textContent = 'Copied ✓'; }catch(e){ const i = b.parentNode.querySelector('input'); if(i) i.select(); b.textContent = 'Press Ctrl+C'; } }));
    const msg = box.querySelector('#stMsg');
    box.querySelector('#stCsv').addEventListener('click', () => {
      const blob = new Blob([FabImpact.csv()], { type:'text/csv' }), a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'fab-soft-impact-' + today() + '.csv'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      msg.textContent = 'CSV downloaded. It holds pupil codes only.';
    });
    box.querySelector('#stCopy').addEventListener('click', () => { try{ navigator.clipboard.writeText(FabImpact.csv()); msg.textContent = 'CSV copied.'; }catch(e){ msg.textContent = 'Copying is blocked here. Use Download CSV instead.'; } });
    box.querySelector('#stFile').addEventListener('change', e => { const f = e.target.files && e.target.files[0]; if(!f) return; const r = new FileReader(); r.onload = () => { const n = FabImpact.importCSV(r.result); renderStaff(); const m = q1('#stMsg'); if(m) m.textContent = n ? n + ' new entries added.' : 'Nothing new found. Is it a Fab soft impact CSV?'; }; r.readAsText(f); });
    box.querySelector('#stClear').addEventListener('click', () => { if(!clearArm){ clearArm = true; renderStaff(); return; } clearArm = false; FabImpact.clearAll(); renderStaff(); const m = q1('#stMsg'); if(m) m.textContent = 'This device’s log is cleared.'; });
  }

  /* ---- Learning: "How did that feel?" after winning treasure ---- */
  window.fabHowHTML = function(kid){
    if(!kid) return '';
    if(kid.howDone) return '<div class="pw-how">💛 Thanks for telling us.</div>';
    return '<div class="pw-how" role="group" aria-label="How did that feel?">How did that feel? <button type="button" data-pwhow="easy">😌 Easy</button><button type="button" data-pwhow="right">😊 Just right</button><button type="button" data-pwhow="tricky">🧗 Tricky, but I kept going</button></div>';
  };

  /* ---- Read to me: every flightpath question (and reading passage) gets a speaker button. Uses the device's own voice.
     Devices offer very different voices, so we rank them: warm British voices first (Edge's young "Maisie", natural and
     enhanced voices, then Libby, Sonia, Martha, Kate, Serena...), stern or novelty voices last. A child or teacher can pick
     another in My Burrow or on the staff page; the choice is remembered on this device. Later, BMF's own recorded
     voices can play instead (see the voice plan in the project notes). */
  const VOICE_KEY = 'fab-voice';
  function voiceScore(v){
    const n = v.name || '', l = String(v.lang || '').replace('_', '-'); let s = 0;
    if(/^en-GB/i.test(l)) s += 50; else if(/^en-(IE|AU|NZ)/i.test(l)) s += 25; else if(/^en/i.test(l)) s += 10; else return -999;
    if(/Maisie/i.test(n)) s += 45;
    if(/Natural|Neural|Premium|Enhanced/i.test(n)) s += 30;
    if(/Libby|Sonia|Martha|Kate|Serena|Stephanie|Google UK English Female|Hazel|Susan|Fiona|Moira|Tessa|Karen|Mia|Bella|Holly|Abbi|Hollie|Olivia/i.test(n)) s += 18;
    if(/Daniel|Arthur|Oliver|Ryan|Thomas|George|\bMale\b|Fred|Albert|Bahh|Bells|Boing|Bubbles|Cellos|Wobble|Whisper|Zarvox|Trinoids|Organ|Junior|Ralph|Jester|Superstar|Grandma|Grandpa|Rocko|Eddy|Flo|Reed|Sandy|Shelley|Bad News|Good News/i.test(n)) s -= 40;
    if(/Google UK English Female/i.test(n)) s += 12; /* smoother than the old Windows voices (Hazel, Susan) */
    if(v.localService === false) s += 4;
    return s;
  }
  /* Read to me is Miss Bell's voice, so a man's voice is only ever the last resort (when the device has nothing else in English). */
  const MALE_VOICE = /\b(Daniel|Arthur|Oliver|Ryan|Thomas|George|Male|Fred|Albert|Ralph|Junior|Grandpa|Rocko|Eddy|Reed|Alex|Aaron|Bruce|David|Mark|James|Guy|Brian|Liam|Noah|Elliot|Alfie|Ethan|Tom|Lee|Rishi|Gordon|William|Nathan|Evan|Christopher|Eric|Roger|Steffan|Andrew|Davis|Jason|Tony|Connor|Duncan|Mitchell|Prabhat|Sam|Luke|Wayne|Abeo|Chilemba|Elimu|James)\b/i;
  function isMaleVoice(v){ return MALE_VOICE.test(String((v && v.name) || '')); }
  function bestVoices(){ try{ const vs = (window.speechSynthesis && speechSynthesis.getVoices()) || []; const all = vs.map(v => ({ v, s:voiceScore(v) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s).map(x => x.v), women = all.filter(v => !isMaleVoice(v)); return women.length ? women : all; }catch(e){ return []; } }
  function chosenVoice(){ const vs = bestVoices(); let want = null; try{ want = localStorage.getItem(VOICE_KEY); if(want && vs.length && !vs.some(v => v.name === want)){ localStorage.removeItem(VOICE_KEY); want = null; } }catch(e){} return vs.find(v => v.name === want) || vs[0] || null; }
  function voiceLabel(v){ const n = String(v.name || 'Voice').replace(/^(Microsoft|Google|Apple)\s+/i, '').replace(/\s*[-(].*$/, '').replace(/\bOnline\b/i, '').trim(); return n || 'Voice'; }
  /* Miss Bell's own voice. Her fixed lines (the big idea of every step, and her model example and thinking on the fixed-bank steps)
     are recorded once with an open-source British voice and kept in voice/bell/, one file per subject pack. bell-voices.js lists where
     each line sits, by a fingerprint of its words, so a line only ever plays for exactly the words on screen. Anything else
     (questions made fresh each time, such as sums) is read by the device's best woman's voice. */
  const bellNorm = t => String(t == null ? '' : t).replace(/\s+/g, ' ').trim();
  const bellKey = t => { let n = 5381; for(let j = 0; j < t.length; j++) n = ((n << 5) + n + t.charCodeAt(j)) >>> 0; return n.toString(36) + '-' + t.length.toString(36); };
  function bellClip(text){ const B = window.FAB_BELL; if(!B || !B.clips) return null; const c = B.clips[bellKey(bellNorm(text))]; return c ? { file:'voice/' + B.files[c[0]] + '.mp3', start:c[1], end:c[1] + c[2] } : null; }
  let bellNow = null;
  function bellStop(){ const b = bellNow; bellNow = null; if(b){ try{ b.a.pause(); }catch(e){} } }
  function bellPlay(clip, text, fallback, after){
    const a = new Audio(clip.file + '#t=' + Math.max(0, clip.start - .04).toFixed(2) + ',' + (clip.end + .08).toFixed(2)), me = { a, text, file:clip.file }; bellNow = me;
    const fail = () => { if(bellNow === me){ bellNow = null; fallback(); } };
    /* when her line ends by itself (not because someone stopped it), carry on with whatever comes next */
    const finish = () => { if(bellNow !== me) return; bellNow = null; if(after){ try{ after(); }catch(e){} } };
    a.addEventListener('timeupdate', () => { if(a.currentTime >= clip.end + .1){ a.pause(); finish(); } });
    a.addEventListener('ended', finish);
    a.addEventListener('pause', () => { if(a.currentTime >= clip.end) finish(); });
    a.addEventListener('error', fail, { once:true });
    try{ const pr = a.play(); if(pr && pr.catch) pr.catch(fail); }catch(e){ fail(); }
  }
  function deviceSay(text, voice){
    try{ const sp = window.speechSynthesis; if(!sp || !window.SpeechSynthesisUtterance) return false; sp.cancel();
      const go = () => { try{
        const u = new SpeechSynthesisUtterance(text), v = voice || chosenVoice();
        if(v){ u.voice = v; u.lang = v.lang; } else u.lang = 'en-GB';
        u.rate = .9; u.pitch = v && /Maisie/i.test(v.name) ? 1 : 1.08;
        sp.speak(u); }catch(e){} };
      /* Browsers load their voices a moment after the page opens. Speaking before they arrive falls back to the device's default voice, which is often a man's, so wait briefly for the list. */
      let have = 0; try{ have = sp.getVoices().length; }catch(e){}
      if(voice || have) go();
      else { let done = false; const once = () => { if(done) return; done = true; go(); }; try{ sp.addEventListener('voiceschanged', once, { once:true }); }catch(e){} setTimeout(once, 600); }
      return true; }catch(e){ return false; }
  }
  /* Read to me: Miss Bell's recording when there is one for these exact words (tap again to stop), otherwise the device voice. */
  function readAloud(text, voice, more){
    try{ window.speechSynthesis && speechSynthesis.cancel(); }catch(e){}
    const was = bellNow; bellStop();
    if(!voice){ const clip = bellClip(text); if(clip){ if(was && was.text === text) return true; bellPlay(clip, text, () => deviceSay(more ? text + ' ' + more : text), more ? () => deviceSay(more) : null); return true; } }
    return deviceSay(more ? text + ' ' + more : text, voice);
  }
  /* Ask for the voice list as soon as the app opens, so it is ready before the first tap. */
  try{ if(window.speechSynthesis){ speechSynthesis.getVoices(); speechSynthesis.addEventListener && speechSynthesis.addEventListener('voiceschanged', () => { try{ speechSynthesis.getVoices(); }catch(e){} }); } }catch(e){}
  /* A small voice chooser: up to five of the best voices on this device, each one says hello when tapped. */
  function voicePickerHTML(){
    const vs = bestVoices().slice(0, 5); if(!vs.length) return '<p class="hint">This device has no reading voice. Read to me will not show.</p>';
    const cur = chosenVoice();
    return '<div class="me-voices">' + vs.map((v, i) => `<button type="button" data-voice="${h(v.name)}" class="${cur && cur.name === v.name ? 'on' : ''}">🗣️ ${h(voiceLabel(v))}${i === 0 ? ' <small>(our pick)</small>' : ''}</button>`).join('') + '</div><p class="hint">Tap a voice to hear it. Your choice is remembered on this device.</p>';
  }
  function wireVoices(root, rerender){
    root.querySelectorAll('[data-voice]').forEach(b => b.addEventListener('click', () => {
      try{ localStorage.setItem(VOICE_KEY, b.dataset.voice); }catch(e){}
      const v = bestVoices().find(x => x.name === b.dataset.voice);
      readAloud('Hello! I am going to read with you today.', v);
      root.querySelectorAll('[data-voice]').forEach(x => x.classList.toggle('on', x === b));
    }));
    try{ if(window.speechSynthesis && !wireVoices.hooked){ wireVoices.hooked = true; speechSynthesis.addEventListener('voiceschanged', () => { try{ rerender && rerender(); }catch(e){} }); } }catch(e){}
  }
  window.FabVoice = { bestVoices, chosenVoice, voiceScore, voiceLabel, isMaleVoice, bellClip, bellKey, bellNow:() => bellNow && { text:bellNow.text, file:bellNow.file, t:bellNow.a.currentTime, paused:bellNow.a.paused }, bellStop };
  function sayBtn(label, fn){ const b = document.createElement('button'); b.type = 'button'; b.className = 'say-btn'; b.textContent = '🔊'; b.setAttribute('aria-label', label); b.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); fn(); }); return b; }
  function addSay(root){
    if(!window.speechSynthesis && !window.FAB_BELL) return;
    root.querySelectorAll('.pw-idea:not([data-say])').forEach(p => { const txt = p.textContent.trim(); if(!txt) return; p.dataset.say = '1';
      p.appendChild(sayBtn('Miss Bell reads the big idea', () => { window.__fabSaid = txt; readAloud(txt); })); });
    root.querySelectorAll('.pw-teach .fab-say.bell .bubble:not([data-say])').forEach(b => { const txt = [...b.childNodes].filter(n => n.nodeName !== 'B').map(n => n.textContent).join(' ').replace(/\s+/g, ' ').trim(); if(!txt) return; b.dataset.say = '1';
      b.appendChild(sayBtn('Miss Bell reads her thinking', () => { window.__fabSaid = txt; readAloud(txt); })); });
    root.querySelectorAll('.pw-ask:not([data-say])').forEach(p => {
      p.dataset.say = '1';
      p.appendChild(sayBtn('Read this to me', () => {
        const box = p.closest('.pw-main') || p.parentNode;
        const ch = [...new Set([...box.querySelectorAll('.pw-choices button, button.pw-choice')].map(x => x.textContent.trim()).filter(Boolean))];
        const qt = p.textContent.replace('🔊', '').trim();
        if(bellClip(qt)){ const rest = ch.length ? 'Is it: ' + ch.join(', or ') + '?' : ''; window.__fabSaid = qt + (rest ? ' ' + rest : ''); readAloud(qt, null, rest); return; } /* Miss Bell's recording of the question, then the choices in the device voice */
        window.__fabSaid = qt + (/[?.!]$/.test(qt) ? '' : '.') + (ch.length ? ' Is it: ' + ch.join(', or ') + '?' : '');
        readAloud(window.__fabSaid);
      }));
    });
    root.querySelectorAll('.mx-text:not([data-say])').forEach(t => { t.dataset.say = '1'; t.insertBefore(sayBtn('Read the passage to me', () => { window.__fabSaid = t.textContent.replace('🔊', '').trim(); readAloud(window.__fabSaid); }), t.firstChild); });
  }
  window.fabReadAloud = readAloud;

  /* ---- wire up ---- */
  function init(){
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const main = q1('main'); if(main && !q1('#screen-me')) main.insertAdjacentHTML('beforeend', HTML);
    const hub = q1('#screen-hub .ritual-bar');
    if(hub && !q1('#whoBtn')) hub.insertAdjacentHTML('beforebegin', '<div class="whobar"><button type="button" class="who-btn" id="whoBtn" data-go="screen-me"></button></div>');
    const lt = q1('#learnTeacher');
    if(lt && !q1('#staffLink')) lt.insertAdjacentHTML('afterend', '<p class="centered"><button type="button" class="btn small soft" id="staffLink" data-go="screen-staff">🧑‍🏫 For staff: Fab codes and soft impact</button></p>');
    const base = window.showScreen;
    if(typeof base === 'function' && !base._me){
      const wrapped = function(id){ base(id); if(id === 'screen-me') renderMe(); else if(id === 'screen-hub') renderWho(); else if(id === 'screen-staff') renderStaff(); };
      wrapped._me = true; window.showScreen = wrapped;
    }
    renderWho();
    const lp = q1('#lpStage'); if(lp){ addSay(lp); new MutationObserver(() => addSay(lp)).observe(lp, { childList:true, subtree:true }); }
  }
  window.FabMe = { renderMe, renderWho, renderStaff, signIn, codeProblem };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
