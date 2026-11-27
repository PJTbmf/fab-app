/* burrow.js — My Burrow: each Fab code's home.
   Shelves: Today (work the teacher set), My flightpaths (in progress), Free choice, My certificates.
   Setting work needs no server: the staff page makes a Burrow link for one Fab code, with the work inside the link.
   Pasted into that child's Pencil Spaces Web Viewer, it fills their Burrow on that device.
   Fab codes only. No names. Everything stays on the device. Draft for BMF to check (privacy notice, DPIA).
   Loaded after me.js and checkpoint.js.
   DRAFT, 27 Nov 2026 (only with a test link, ?home=burrow, until Patrick has reviewed it): the Burrow as the child's home.
   The Learning Hub opens on the Burrow; set work comes first and the full list sits behind "More to explore";
   a "Things I made" shelf gathers posters, Explorer makes, dances, pictures, builds and the sanctuary;
   one link per child can carry the work, class mode and this draft together. ?home=0 turns the draft off for that viewer. */
(function(){
  'use strict';
  const h = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const arr = v => Array.isArray(v) ? v : (v && typeof v === 'object' ? Object.keys(v).sort((a, b) => a - b).map(k => v[k]) : []);
  const snd = k => { try{ Sound[k](); }catch(e){} };
  const CODE_RE = /^[a-z]{2,12}-\d{3}$/;
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const ls = { json(k, f){ try{ const v = JSON.parse(localStorage.getItem(k)); return v == null ? f : v; }catch(e){ return f; } }, set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} } };
  const enc = o => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const dec = s => { try{ s = String(s).replace(/-/g, '+').replace(/_/g, '/'); while(s.length % 4) s += '='; return JSON.parse(decodeURIComponent(escape(atob(s)))); }catch(e){ return null; } };
  let _packs = null, _at = 0;
  const allPacks = () => { if(_packs && Date.now() - _at < 1500) return _packs; try{ _packs = Learn.all(); }catch(e){ _packs = []; } _at = Date.now(); return _packs; };
  const pathOf = p => { const i = p ? p.screens.findIndex(s => s.type === 'pathway') : -1; return i < 0 ? null : { i, s:p.screens[i] }; };
  const pathPacks = () => allPacks().filter(p => pathOf(p));
  const packById = id => allPacks().find(p => p.id === id);
  const KEY = c => 'fab-burrow-' + c;

  /* ---------- what is in a Burrow ---------- */
  function read(code){ const b = ls.json(KEY(code), null); return b && Array.isArray(b.items) ? b : { t:0, items:[], free:[] }; }
  /* work arriving in a link: checked, trimmed, and kept only if it is newer than what is there */
  function apply(code, o){
    if(!o || typeof o !== 'object' || !CODE_RE.test(code)) return false;
    const items = arr(o.a).slice(0, 6).map(r => { r = arr(r); const p = packById(String(r[0] || '')), po = pathOf(p); if(!po) return null;
      const s = r[1] == null || r[1] === '' ? null : Math.max(0, Math.min(po.s.steps.length - 1, Number(r[1]) || 0));
      return { p:p.id, s, d:/^\d{4}-\d\d-\d\d$/.test(String(r[2] || '')) ? String(r[2]) : '', n:String(r[3] || '').replace(/[<>]/g, '').slice(0, 80) }; }).filter(Boolean);
    const free = arr(o.f).slice(0, 8).map(String).filter(id => pathOf(packById(id)));
    const t = Number(o.t) || 0, cur = read(code);
    if(cur.t && cur.t >= t) return true;
    ls.set(KEY(code), { t, items, free }); return true;
  }
  function progress(code, pack){
    const po = pathOf(pack); if(!po) return null;
    let saved = null; try{ saved = store.getJSON(`bmf_progress_${pack.id}_${code}`, null); }catch(e){}
    if(!saved || !saved.state || (saved.rev || 1) !== (pack.rev || 1)) return null;
    const st = saved.state[po.i], kid = st && st.kids && st.kids['learner:' + code];
    if(!kid) return null;
    return { step:Number(kid.step) || 0, secured:arr(kid.secured), n:po.s.steps.length, saved:saved.saved || 0, kid };
  }
  function statusOf(code, it){
    const pack = packById(it.p), po = pathOf(pack), pr = progress(code, pack);
    const done = !!pr && (it.s != null ? pr.secured.includes(it.s) : pr.secured.length > 0);
    return { pack, po, pr, done, started:!!it.st || (!!pr && it.s == null) };
  }
  function todays(code){ const d = today(); return read(code).items.map((it, i) => Object.assign({ i }, it)).filter(it => !it.d || it.d <= d); }

  function openPack(pack, startStep){
    const po = pathOf(pack);
    learnOpen(pack);
    if(!po) return;
    Learn.step = po.i;
    if(startStep != null){ const st = Learn.state[po.i] = Learn.state[po.i] || {}; pwStart(po.s, st, pwMe(), startStep); try{ pwOpenStage = null; }catch(e){} }
    learnRender();
  }
  function go(code, idx){
    const b = read(code), it = b.items[idx]; if(!it) return;
    const pack = packById(it.p); if(!pack) return;
    /* the teacher's starting step is used the first time; after that the child carries on where they were */
    const first = it.s != null && !it.st;
    if(first){ it.st = 1; ls.set(KEY(code), b); }
    openPack(pack, first ? it.s : null);
  }

  /* ---------- draft: the Burrow as home ---------- */
  const raw = { get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }, json(k, f){ try{ const v = JSON.parse(localStorage.getItem(k)); return v == null ? f : v; }catch(e){ return f; } } };
  (() => { let q; try{ q = new URLSearchParams(location.search); }catch(e){ return; } const v = q.get('home');
    try{ if(v === 'burrow') localStorage.setItem('fab-home', 'burrow'); else if(v === '0') localStorage.removeItem('fab-home'); }catch(e){} })();
  const homeOn = () => raw.get('fab-home') === 'burrow';
  let learnAll = false;   /* true after "More to explore", until the child is back in the Burrow or on the menu */
  const ic = (name, emoji) => { try{ if(window.FabIcon && FabIcon.names.includes(name)) return FabIcon.svg(name); }catch(e){} return `<span aria-hidden="true">${emoji}</span>`; };

  /* Things I made: what this Fab code has finished or kept, read from what the app already saves on this device */
  function made(code){
    const out = [];
    pathPacks().forEach(p => { const pr = progress(code, p); if(!pr || !pr.secured.length || !window.FabFlightPoster || !window.FabProud) return;
      out.push({ k:'poster', id:p.id, ic:ic('star', '⭐'), t:p.title, s:pr.secured.length === 1 ? '1 step climbed' : pr.secured.length + ' steps climbed', b:'See my poster' }); });
    try{ const mk = raw.json('fab-make-' + code, {}), X = window.FabExplore;
      if(X) X.order.forEach(id => { const m = mk[id], w = X.worlds[id]; if(!m || !w) return;
        const rep = m.rep || {}, wrote = !!(rep.intro || rep.dyk || arr(rep.s).some(x => x && x.t)), drew = !!(m.png || (m.art && /[1-9]/.test(m.art)));
        if(!wrote && !drew) return;
        const bits = []; if(drew) bits.push(String((w.make.art && w.make.art.noun) || 'My design')); if(wrote) bits.push('my report');
        out.push({ k:'explore', id, pic:m.png || '', ic:ic('compass', '🧭'), t:w.n, s:bits.join(' and ').replace(/^./, c => c.toUpperCase()), b:'Open' }); }); }catch(e){}
    arr(raw.json('fabcode-makes-' + code, [])).filter(d => d && d.k === 'dance').slice(0, 3).forEach(d =>
      out.push({ k:'dance', id:String(d.t), pic:d.pic || '', ic:ic('code', '💃'), t:'My dance', s:(Number(d.n) || 0) + ' blocks in Fox Blocks', b:'Watch it' }));
    const W = raw.json('fabworld-v2-' + code, null) || {}, pics = arr(W.makes).filter(m => m && m.d), shows = arr(W.shows).length || (W.onShow ? 1 : 0);
    if(pics.length) out.push({ k:'studio', id:'', pic:pics[0].d, ic:ic('canvas', '🎨'), t:'My pictures', s:pics.length === 1 ? '1 picture from the Studio' : pics.length + ' pictures from the Studio', b:'Open the Studio' });
    if(shows) out.push({ k:'builds', id:'', ic:ic('toolbox', '🧰'), t:'My builds', s:shows === 1 ? '1 build on the show bench' : shows + ' builds on the show bench', b:'Go and see' });
    const sn = raw.json('fabsanct-v1-' + code, null);
    if(sn && (Number(sn.day) || Object.keys(sn.homes || {}).length)){ const n = Object.keys(sn.homes || {}).length;
      out.push({ k:'sanct', id:'', ic:ic('hedgehog', '🦔'), t:'Fab’s Sanctuary', s:(n === 1 ? '1 animal has a home' : n + ' animals have a home') + (Number(sn.day) ? ' · day ' + Number(sn.day) : ''), b:'Open' }); }
    return out;
  }
  function madeHTML(code){
    const list = made(code);
    return `<div class="me-card bw-shelf" id="bwMade"><h3 class="bw-h">${ic('picture', '🖼️')} Things I made</h3>
      ${list.length ? `<div class="bw-made">${list.map(m => `<button type="button" class="bw-mcard" data-bwmade="${h(m.k)}" data-id="${h(m.id)}">
        ${m.pic ? `<img src="${h(m.pic)}" alt="">` : `<span class="bw-mic">${m.ic}</span>`}<b>${h(m.t)}</b><small>${h(m.s)}</small><span class="bw-cta">${h(m.b)}</span></button>`).join('')}</div>`
        : '<p class="bw-none">Nothing here yet. Posters, dances, pictures and builds you make will wait for you here.</p>'}</div>`;
  }
  function openMade(code, k, id){
    if(k === 'poster'){ const p = packById(id), po = pathOf(p), pr = progress(code, p); if(!po || !pr) return;
      if(FabFlightPoster.open(po.s, pr.kid, p)){ const b = document.querySelector('.fp-layer [data-fp="close"]'); if(b && b.lastChild && b.lastChild.nodeType === 3) b.lastChild.textContent = 'Back to my Burrow'; } }
    else if(k === 'explore'){ try{ FabExplore.open('screen-me', id); }catch(e){} }
    else if(k === 'dance'){ window.fabCodeFrom = 'screen-me'; showScreen('screen-code');
      document.getElementById('codeFrame').src = 'code.html?embed=1&back=app&learner=' + encodeURIComponent(code) + '&project=dance&play=' + encodeURIComponent(id); }
    else if(k === 'studio'){ window.fabWorldOpen = 'studio'; showScreen('screen-world'); }
    else if(k === 'builds') showScreen('screen-world');
    else if(k === 'sanct'){ try{ fabOpenSanct(); window.fabSanctFrom = 'screen-me'; }catch(e){} }
  }

  /* ---------- the child's shelves ---------- */
  function shelvesHTML(code){
    const list = todays(code), b = read(code);
    const rows = list.map(it => { const S = statusOf(code, it); if(!S.po) return '';
      const stepName = it.s != null ? `Step ${it.s + 1}: ${S.po.s.steps[it.s].name}` : 'Your own step';
      return `<li class="bw-item ${S.done ? 'done' : ''}"><span class="bw-emoji" aria-hidden="true">${h(S.pack.emoji || '📘')}</span>
        <div class="bw-what"><b>${h(S.pack.title)}</b><span>${h(stepName)}</span>${it.n ? `<em>Your teacher says: ${h(it.n)}</em>` : ''}</div>
        ${S.done ? '<span class="bw-status">⭐ Done</span>' : ''}
        <button type="button" class="btn ${S.done ? 'soft small' : 'leaf'}" data-bwgo="${it.i}">${S.done ? 'Do more' : S.started ? 'Carry on ➡️' : 'Start ➡️'}</button></li>`; }).join('');
    const nDone = list.filter(it => statusOf(code, it).done).length, all = list.length && nDone === list.length;
    const say = !list.length ? '<p class="bw-none">Nothing is set for today. Choose anything you like.</p>'
      : all ? '<div class="fab-say"><span class="fab-char elder" role="img" aria-label="Mr Elder, the head teacher"></span><div class="bubble"><b>All done for today. Brilliant!</b>Your stars are waiting in Fab Fox World.</div></div>'
      : `<div class="fab-say"><span class="fab-char fab" role="img" aria-label="Fab"></span><div class="bubble"><b>${list.length === 1 ? 'One thing to do today' : list.length + ' things to do today'}</b>Start at the top. You can stop for a rest at any time.</div></div>`;
    const inProg = pathPacks().map(p => ({ p, pr:progress(code, p) })).filter(x => x.pr).sort((x, y) => y.pr.saved - x.pr.saved).slice(0, 6);
    const card = (p, sub, label) => `<button type="button" class="bw-card" data-bwopen="${h(p.id)}"><span class="bw-emoji" aria-hidden="true">${h(p.emoji || '📘')}</span><b>${h(p.title)}</b>${sub}<span class="bw-cta">${label}</span></button>`;
    const free = arr(b.free).map(packById).filter(Boolean);
    let certs = []; try{ certs = FabCheck.Store.all().filter(r => r.passed && r.code === code).slice(-8).reverse(); }catch(e){}
    return `<div class="me-card bw-shelf" id="bwToday"><h3>📌 Today</h3>${say}${rows ? `<ol class="bw-list">${rows}</ol>` : ''}</div>
      ${inProg.length ? `<div class="me-card bw-shelf" id="bwPaths"><h3>🗺️ My flightpaths</h3><div class="bw-cards">${inProg.map(x => card(x.p,
        `<span class="bw-bar" role="img" aria-label="${x.pr.secured.length} of ${x.pr.n} steps secure"><i style="width:${Math.round(100 * x.pr.secured.length / x.pr.n)}%"></i></span><small>On step ${x.pr.step + 1} · ${x.pr.secured.length} of ${x.pr.n} secure</small>`, 'Carry on ➡️')).join('')}</div></div>` : ''}
      ${free.length ? `<div class="me-card bw-shelf" id="bwFree"><h3>🎈 Free choice</h3><p class="hint">Your teacher has opened these for any time you like.</p><div class="bw-cards">${free.map(p => card(p, `<small>${h(p.subject || '')} · ${h(p.years || '')}</small>`, 'Open ➡️')).join('')}</div></div>` : ''}
      ${certs.length ? `<div class="me-card bw-shelf" id="bwCerts"><h3>🏅 My checkpoints</h3><div class="me-tre">${certs.map(r => `<span>🏅 ${h(r.title)}</span>`).join('')}</div></div>` : ''}
      ${homeOn() ? madeHTML(code) + `<div class="me-card bw-shelf bw-more" id="bwMore"><h3 class="bw-h">${ic('door', '🚪')} More to explore</h3><p>Every flightpath and lesson lives in the Learning Hub. You can look any time.</p><button type="button" class="btn soft" data-bwmore>${ic('books', '📚')} <span>Open the Learning Hub</span></button></div>` : ''}`;
  }
  function wire(box, code){
    box.querySelectorAll('[data-bwgo]').forEach(b => b.addEventListener('click', () => { snd('ding'); go(code, Number(b.dataset.bwgo)); }));
    box.querySelectorAll('[data-bwopen]').forEach(b => b.addEventListener('click', () => { const p = packById(b.dataset.bwopen); if(!p) return; snd('tick'); openPack(p, null); }));
    box.querySelectorAll('[data-bwmade]').forEach(b => b.addEventListener('click', () => { snd('tick'); openMade(code, b.dataset.bwmade, b.dataset.id || ''); }));
    box.querySelectorAll('[data-bwmore]').forEach(b => b.addEventListener('click', () => { snd('tick'); learnAll = true; showScreen('screen-learn'); try{ learnRenderList(); }catch(e){} }));
  }

  /* ---------- staff: set work and make the link ---------- */
  const F = { code:'', rows:[{ p:'', s:0, d:'', n:'' }], free:[], link:'', msg:'', cls:true, home:true };
  /* one link per child: who they are, class mode (their code and Help in the top bar, sounds start off), the draft Burrow home, and the work */
  function linkFor(code, rows, free, opt){
    const a = rows.filter(r => r.p).map(r => [r.p, r.s == null ? null : Number(r.s), r.d || '', (r.n || '').trim().slice(0, 80)]);
    opt = opt || {};
    return location.origin + location.pathname + '?learner=' + encodeURIComponent(code) + (opt.cls ? '&class=1&quiet=1' : '') + (opt.home ? '&home=burrow' : '') + '&burrow=' + enc({ t:Date.now(), a, f:free });
  }
  function staffHTML(){
    const P = pathPacks();
    if(!F.rows[0].p && P[0]){ F.rows[0].p = P[0].id; F.rows[0].d = today(); }
    let known = []; try{ known = [...new Set([].concat(typeof pwCodes !== 'undefined' ? pwCodes : [], FabImpact.codes().filter(c => CODE_RE.test(c))))]; }catch(e){}
    const row = (r, i) => { const po = pathOf(packById(r.p));
      return `<div class="bw-row" data-row="${i}"><label><span>Flightpath</span><select data-bwf="p">${P.map(p => `<option value="${h(p.id)}" ${p.id === r.p ? 'selected' : ''}>${h((p.emoji || '') + ' ' + p.title + ' (' + (p.years || '') + ')')}</option>`).join('')}</select></label>
        <label><span>Start at</span><select data-bwf="s">${po ? po.s.steps.map((s, k) => `<option value="${k}" ${Number(r.s) === k ? 'selected' : ''}>${k + 1}. ${h(s.name)}${s.year ? ' (' + h(s.year) + ')' : ''}</option>`).join('') : ''}</select></label>
        <label><span>Day</span><input type="date" data-bwf="d" value="${h(r.d || '')}"></label>
        <label class="bw-note"><span>Note for the child (optional)</span><input type="text" data-bwf="n" maxlength="80" value="${h(r.n || '')}" placeholder="Start with the 3 times table"></label>
        ${F.rows.length > 1 ? `<button type="button" class="btn small soft" data-bwdel="${i}" aria-label="Remove this piece of work">✕</button>` : ''}</div>`; };
    return `<div class="me-card" id="bwStaff"><h2>📌 Set work for a child’s Burrow</h2>
      <p>Pick a Fab code and the work for a session. You get one link for that child. Paste it into their Pencil Spaces Web Viewer and their Burrow opens with <b>Today</b> filled in.</p>
      <div class="bw-row"><label><span>Fab code</span><input type="text" id="bwCode" list="bwCodes" value="${h(F.code)}" placeholder="otter-482" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="20"></label><datalist id="bwCodes">${known.map(c => `<option value="${h(c)}">`).join('')}</datalist></div>
      ${F.rows.map(row).join('')}
      <div class="st-row">${F.rows.length < 4 ? '<button type="button" class="btn small soft" id="bwAdd">➕ Add another piece of work</button>' : ''}</div>
      <details class="bw-freepick" ${F.free.length ? 'open' : ''}><summary><b>Free choice</b>: flightpaths this child may open at any time</summary><div class="bw-chips">${P.map(p => `<label><input type="checkbox" data-bwfree="${h(p.id)}" ${F.free.includes(p.id) ? 'checked' : ''}> ${h((p.emoji || '') + ' ' + p.title + (p.years ? ' (' + p.years + ')' : ''))}</label>`).join('')}</div></details>
      <div class="bw-opts"><label><input type="checkbox" id="bwCls" ${F.cls ? 'checked' : ''}> <span><b>Class link</b>: the child’s code and a Help button show in the top bar, and sounds start off</span></label>
        ${homeOn() ? `<label><input type="checkbox" id="bwHome" ${F.home ? 'checked' : ''}> <span><b>Draft:</b> the Learning Hub opens on the Burrow for this child</span></label>` : ''}</div>
      <div class="st-row"><button type="button" class="btn leaf" id="bwMake">🔗 Make the Burrow link</button></div>
      <p class="learn-msg" id="bwMsg" aria-live="polite">${h(F.msg)}</p>
      ${F.link ? `<div class="st-codes"><div><input readonly id="bwLink" value="${h(F.link)}" aria-label="Burrow link for ${h(F.code)}"><button type="button" class="btn small soft" id="bwCopy">Copy link</button></div></div>` : ''}
      <p class="hint">Fab codes only. The note travels inside the link, so please keep names and personal details out of it. A new link replaces the work from an older one. Work with no day shows straight away; work with a day shows from that day.</p></div>`;
  }
  function staffWire(box, redraw){
    const card = box.querySelector('#bwStaff'); if(!card) return;
    const code = card.querySelector('#bwCode');
    code.addEventListener('input', () => { F.code = String(code.value || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 20); });
    card.querySelectorAll('[data-bwf]').forEach(el => {
      const i = Number(el.closest('[data-row]').dataset.row), f = el.dataset.bwf;
      el.addEventListener(f === 'n' ? 'input' : 'change', () => { const r = F.rows[i]; if(!r) return;
        if(f === 'p'){ r.p = el.value; r.s = 0; F.link = ''; redraw(); }
        else if(f === 's'){ r.s = Number(el.value) || 0; F.link = ''; }
        else if(f === 'd'){ r.d = el.value; F.link = ''; }
        else r.n = el.value.slice(0, 80); });
    });
    card.querySelectorAll('[data-bwdel]').forEach(b => b.addEventListener('click', () => { F.rows.splice(Number(b.dataset.bwdel), 1); F.link = ''; snd('tick'); redraw(); }));
    const add = card.querySelector('#bwAdd'); if(add) add.addEventListener('click', () => { const P = pathPacks(); F.rows.push({ p:P[0] ? P[0].id : '', s:0, d:F.rows[0].d || today(), n:'' }); F.link = ''; snd('tick'); redraw(); });
    card.querySelectorAll('[data-bwfree]').forEach(c => c.addEventListener('change', () => { const id = c.dataset.bwfree; F.free = c.checked ? F.free.concat(id).slice(0, 8) : F.free.filter(x => x !== id); F.link = ''; }));
    const cls = card.querySelector('#bwCls'); if(cls) cls.addEventListener('change', () => { F.cls = cls.checked; F.link = ''; });
    const hm = card.querySelector('#bwHome'); if(hm) hm.addEventListener('change', () => { F.home = hm.checked; F.link = ''; });
    card.querySelector('#bwMake').addEventListener('click', () => {
      F.code = String(code.value || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 20);
      if(!CODE_RE.test(F.code)){ F.link = ''; F.msg = 'Type a Fab code first: an animal, a dash and three numbers, like otter-482. Never a name.'; snd('gentle'); redraw(); return; }
      F.link = linkFor(F.code, F.rows, F.free, { cls:F.cls, home:F.home && homeOn() }); F.msg = 'Link ready for ' + F.code + '. It holds the work, the day and your note, and nothing else.'; snd('ding'); redraw();
    });
    const cp = card.querySelector('#bwCopy');
    if(cp) cp.addEventListener('click', () => { const i = card.querySelector('#bwLink'); try{ navigator.clipboard.writeText(i.value); cp.textContent = 'Copied ✓'; }catch(e){ i.select(); cp.textContent = 'Press Ctrl+C'; } });
  }

  /* ---------- a Burrow link opens the Burrow ---------- */
  function fromLink(){
    let q; try{ q = new URLSearchParams(location.search); }catch(e){ return false; }
    const raw = q.get('burrow'); if(!raw) return false;
    const code = (typeof fabLearnerCode === 'function' && fabLearnerCode()) || '';
    if(!apply(code, dec(raw))) return false;
    return !q.get('lesson');
  }

  const CSS = `
.bw-shelf h3{margin:0 0 8px}
.bw-none{margin:0;opacity:.85}
.bw-list{list-style:none;margin:10px 0 0;padding:0;display:grid;gap:10px}
.bw-item{display:flex;flex-wrap:wrap;align-items:center;gap:12px;background:#fff;border:3px solid var(--cream-deep,#f0dfbd);border-radius:18px;padding:10px 14px}
.bw-item.done{border-color:#b9d8a3;background:#f4fbee}
.bw-emoji{font-size:2rem;line-height:1}
.bw-what{flex:1 1 220px;display:flex;flex-direction:column;gap:2px;min-width:0}
.bw-what b{font-size:var(--t-lead,1.15rem)}.bw-what em{font-style:normal;background:var(--sunshine,#FFD483);border-radius:10px;padding:3px 8px;align-self:flex-start;margin-top:3px}
.bw-status{font-weight:700;color:#2f6b1f}
.bw-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px}
.bw-card{display:flex;flex-direction:column;gap:5px;align-items:flex-start;text-align:left;background:#fff;border:3px solid var(--cream-deep,#f0dfbd);border-radius:18px;padding:12px;font:inherit;color:var(--ink,#2B1A12);cursor:pointer;min-height:120px}
.bw-card:hover,.bw-card:focus-visible{border-color:var(--flame,#FE4D02);outline:none}
.bw-card b{font-size:1.05rem}.bw-card small{opacity:.8}.bw-cta{margin-top:auto;font-weight:700;color:var(--flame-dark,#C93C00)}
.bw-bar{display:block;width:100%;height:10px;border-radius:999px;background:#f3ecd9;overflow:hidden}.bw-bar i{display:block;height:100%;background:var(--leaf,#4F7A2E);border-radius:999px}
.bw-row{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;margin:8px 0;padding:8px;background:#fffdf6;border-radius:14px}
.bw-row label{display:flex;flex-direction:column;gap:3px;font-weight:700;font-size:.95rem;flex:1 1 170px;min-width:0}
.bw-row label.bw-note{flex:2 1 260px}
.bw-row select,.bw-row input{font:1rem var(--body,Aleo),Georgia,serif;padding:8px 10px;border-radius:12px;border:2px solid #e6d8b8;background:#fff;color:var(--ink,#2B1A12);min-height:46px;max-width:100%}
.bw-freepick{margin:6px 0}.bw-chips{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:6px;margin-top:8px}
.bw-chips label{background:#fff;border-radius:12px;padding:8px 10px;display:flex;gap:8px;align-items:center}
.bw-opts{display:grid;gap:6px;margin:8px 0}.bw-opts label{display:flex;gap:10px;align-items:flex-start;background:#fffdf6;border-radius:12px;padding:8px 10px}.bw-opts input{width:22px;height:22px;flex:none;margin-top:2px}
.bw-h{display:flex;align-items:center;gap:8px}.bw-h svg{width:1.6em;height:1.6em;flex:none}
.bw-made{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px}
.bw-mcard{display:flex;flex-direction:column;gap:4px;align-items:flex-start;text-align:left;background:#FFF6E6;border:3px solid #2B1A12;border-radius:16px 18px 15px 19px;padding:10px 12px 12px;font:inherit;color:#2B1A12;cursor:pointer;min-height:150px;box-shadow:none}
.bw-mcard:hover,.bw-mcard:focus-visible{background:#FFD483;outline:none}
.bw-mcard img{width:100%;height:92px;object-fit:cover;border:2.5px solid #2B1A12;border-radius:10px;background:#fff}
.bw-mic{display:grid;place-items:center;width:100%;height:92px;background:#FFD483;border:2.5px solid #2B1A12;border-radius:10px;font-size:2.6rem}.bw-mic svg{width:64px;height:64px}
.bw-mcard b{font-size:1.05rem;line-height:1.25}.bw-mcard small{opacity:.85;line-height:1.3}.bw-mcard .bw-cta{margin-top:auto;font-style:italic}
.bw-more .btn{display:inline-flex;align-items:center;gap:8px}.bw-more .btn svg{width:1.5em;height:1.5em;flex:none}
`;
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

  window.FabBurrow = { shelvesHTML, wire, staffHTML, staffWire, read, apply, enc, dec, linkFor, progress, form:F, home:homeOn, made };

  /* draft: with the Burrow as home, the Learning Hub's door leads to the Burrow for a signed-in child. "More to explore" opens the full list. */
  function hookHome(){
    const base = window.showScreen; if(typeof base !== 'function' || base._bw) return;
    const w = function(id){
      if(id === 'screen-me' || id === 'screen-hub') learnAll = false;
      /* go through the newest showScreen, so every script that listens for the Burrow opening hears about it */
      if(id === 'screen-learn' && homeOn() && !learnAll && typeof fabLearnerCode === 'function' && fabLearnerCode() && document.getElementById('screen-me')) return window.showScreen('screen-me');
      return base.apply(this, arguments);
    };
    w._bw = true; window.showScreen = w;
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hookHome); else hookHome();

  /* open the Burrow once the page (and me.js, which builds the screen) is ready */
  function openHome(n){ if(document.getElementById('screen-me')){ try{ showScreen('screen-me'); }catch(e){} } else if((n || 0) < 100) setTimeout(() => openHome((n || 0) + 1), 30); }
  if(fromLink()){ if(document.readyState === 'complete') openHome(); else window.addEventListener('load', () => openHome()); }
})();
