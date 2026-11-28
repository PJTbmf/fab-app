/* burrow.js — My Burrow: each Fab code's home.
   Shelves: Today (work the teacher set), My flightpaths (in progress), Free choice, My certificates.
   Setting work needs no server: the staff page makes a Burrow link for one Fab code, with the work inside the link.
   Pasted into that child's Pencil Spaces Web Viewer, it fills their Burrow on that device.
   Fab codes only. No names. Everything stays on the device. Draft for BMF to check (privacy notice, DPIA).
   Loaded after me.js and checkpoint.js.
   27 Nov 2026 (Patrick, after logging in as a child): the Burrow is the child's home. For a signed-in child the Learning Hub's door
   opens the Burrow and nothing else: they see what their teacher set, their own flightpaths and the things they made, never the
   whole list ("children should not be swamped with every flightpath"). The whole list is the teacher's view: with no Fab code it
   opens as before, and on a child's viewer a small "For teachers" button at the foot of the Burrow opens it (two taps).
   ?home=0 turns this off for one viewer (the old behaviour); ?home=burrow turns it back on. */
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
  function read(code){ const b = ls.json(KEY(code), null); if(!(b && Array.isArray(b.items))) return { t:0, items:[], free:[], extras:[] }; if(!Array.isArray(b.extras)) b.extras = []; return b; }
  /* Things a teacher can set besides a flightpath: an activity in the app, a challenge in their own words, or both, with a theme tag
     (Anti-Bullying Week, Children in Need). Patrick, 27 Nov: a child sees only what is set for them. */
  const clean = (v, n) => String(v || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
  const ACTS = [
    { id:'', n:'No app activity (paper, the board or talking)', ic:'pencil', e:'✏️' },
    { id:'explore:victorian', n:'Explorer Worlds: the Victorians', ic:'compass', e:'🧭' },
    { id:'explore:egypt', n:'Explorer Worlds: Ancient Egypt', ic:'compass', e:'🧭' },
    { id:'explore:greece', n:'Explorer Worlds: Ancient Greece', ic:'compass', e:'🧭' },
    { id:'explore:rome', n:'Explorer Worlds: the Romans', ic:'compass', e:'🧭' },
    { id:'explore:space', n:'Explorer Worlds: the Space Station', ic:'rocket', e:'🚀' },
    { id:'code:bush', n:'Fox Blocks: To the bramble bush', ic:'code', e:'🧩' },
    { id:'code:dance', n:'Fox Blocks: Fab’s dance', ic:'code', e:'🧩' },
    { id:'code:tap', n:'Fox Blocks: Tap and play', ic:'code', e:'🧩' },
    { id:'code:goal', n:'Fox Blocks: Score a goal', ic:'code', e:'🧩' },
    { id:'sanct', n:'Fab’s Sanctuary', ic:'hedgehog', e:'🦔' },
    { id:'studio', n:'Make More FAB Studio', ic:'canvas', e:'🎨' },
    { id:'world', n:'Fab Fox World', ic:'fox', e:'🦊' },
    { id:'canvas', n:'Canvas: draw, write, add pictures', ic:'picture', e:'📋' },
    { id:'music', n:'Music: the keyboard or the beat maker', ic:'piano', e:'🎹' },
    /* a booklet (Patrick, 27 Nov: "being able to assign booklet activities as opposed to relying on flightpaths alone"). The teacher
       opens the booklet on the board; the app lists the part to do and the child taps "I did it". Nothing opens in the app. */
    { id:'booklet', n:'Booklet', ic:'books', e:'📚', show:'Your teacher will open this booklet with you.' }
  ];
  /* a booklet from the library travels as 'bk:<id>' or 'bk:<id>:<page>' (booklets.js): one rebuilt as pages opens in the app, the others are opened on the board */
  const actOf = id => ACTS.find(a => a.id === id) || (String(id || '').indexOf('bk:') === 0 && window.FabBooklets ? FabBooklets.act(id) : String(id || '').indexOf('fp:') === 0 ? fpAct(id) : null);
  /* a flightpath set as the day's practice in a week plan: 'fp:<pack id>', at the child's own step */
  function fpAct(id){ let p = null; try{ p = packById(String(id).slice(3)); }catch(e){} return p && pathOf(p) ? { id:'fp:' + p.id, n:'Flightpath: ' + p.title, ic:'map', e:'🗺️' } : null; }
  /* theme weeks: a few gentle starters a teacher can tap (drafts for a teacher to check and change) */
  const THEMES = {
    'Anti-Bullying Week': [['studio', 'Make a kindness poster'], ['world', 'Pop a bubble and pick a kind thing to do today'], ['', 'Tell your teacher about a good friend']],
    'Children in Need': [['studio', 'Make a spotty picture'], ['sanct', 'Run the sanctuary for a day and share some berries'], ['music', 'Make a cheerful beat for a fundraising day']],
    'World Book Day': [['canvas', 'Draw your favourite book character'], ['', 'Tell your teacher about a book you love']],
    'Safer Internet Day': [['canvas', 'Draw three ways to stay safe online']],
    'National Coding Week': [['code:bush', 'Solve a Fox Blocks puzzle'], ['code:dance', 'Code a dance for Fab'], ['code:tap', 'Make Fab do something when you tap']],
    'Make More FAB': [['studio', 'Make a picture to go with your Make More FAB box'], ['', 'Show your teacher something you made from your box']]
  };
  function extraOK(x){ return !!(x && (x.t || (x.a && actOf(x.a)))); }
  function extraTitle(x){ const a = actOf(x.a); return x.t || (a ? a.n : ''); }
  function openAct(code, id){
    const [k, v, pg] = String(id || '').split(':');
    try{
      if(k === 'bk'){ FabBooklets.open(v, pg || null, { code, back:'screen-me' }); return; }
      if(k === 'fp'){ const p = packById(String(id).slice(3)); if(p) openPack(p); return; }
      if(k === 'explore') FabExplore.open('screen-me', v);
      else if(k === 'code'){ window.fabCodeFrom = 'screen-me'; showScreen('screen-code'); document.getElementById('codeFrame').src = 'code.html?embed=1&back=app&learner=' + encodeURIComponent(code) + '&project=' + encodeURIComponent(v); }
      else if(k === 'sanct'){ fabOpenSanct(); window.fabSanctFrom = 'screen-me'; }
      else if(k === 'studio'){ window.fabWorldOpen = 'studio'; showScreen('screen-world'); }
      else if(k === 'world') showScreen('screen-world');
      else if(k === 'canvas') FabBoard.open({ id:'workbook', title:'My workbook', back:'screen-me' });
      else if(k === 'music') FabMusic.open(null, { back:'screen-me' });
    }catch(e){}
  }
  /* work arriving in a link: checked, trimmed, and kept only if it is newer than what is there */
  function apply(code, o){
    if(!o || typeof o !== 'object' || !CODE_RE.test(code)) return false;
    const items = arr(o.a).slice(0, 6).map(r => { r = arr(r); const p = packById(String(r[0] || '')), po = pathOf(p); if(!po) return null;
      const s = r[1] == null || r[1] === '' ? null : Math.max(0, Math.min(po.s.steps.length - 1, Number(r[1]) || 0));
      return { p:p.id, s, d:/^\d{4}-\d\d-\d\d$/.test(String(r[2] || '')) ? String(r[2]) : '', n:String(r[3] || '').replace(/[<>]/g, '').slice(0, 80), th:clean(r[4], 30) }; }).filter(Boolean);
    const free = arr(o.f).slice(0, 8).map(String).filter(id => pathOf(packById(id)));
    const extras = arr(o.x).slice(0, o.w ? 30 : 4).map(r => { r = arr(r); const a = String(r[0] || ''); return { r:['m', 'p', 'f'].includes(r[5]) ? r[5] : '', a:actOf(a) ? a : '', t:clean(r[1], a === 'booklet' || a.indexOf('bk:') === 0 ? 80 : 60), n:clean(r[2], 80), th:clean(r[3], 30), d:/^\d{4}-\d\d-\d\d$/.test(String(r[4] || '')) ? String(r[4]) : '' }; }).filter(extraOK);
    /* a well done from the teacher, in their own words (the Teachers' area) */
    const praise = arr(cur0(code).praise).concat(arr(o.k).slice(0, 3).map(r => ({ t:clean(arr(r)[0], 60), d:today() })).filter(x => x.t));
    const t = Number(o.t) || 0, cur = read(code);
    if(cur.t && cur.t >= t) return true;
    if(o.m){ /* a class link adds to what the child already has; it never takes work away */
      const its = cur.items.slice(), exs = cur.extras.slice(), fr = arr(cur.free).slice();
      items.forEach(n => { if(!its.some(x => x.p === n.p && x.s === n.s)) its.push(n); });
      extras.forEach(n => { if(!exs.some(x => x.a === n.a && x.t === n.t && x.th === n.th && (!n.r || (x.d === n.d && x.r === n.r)))) exs.push(n); });
      free.forEach(id => { if(!fr.includes(id)) fr.push(id); });
      ls.set(KEY(code), { t, items:its.slice(-10), free:fr.slice(-8), extras:exs.slice(-60), praise:praise.slice(-5) }); return true; }
    ls.set(KEY(code), { t, items, free, extras, praise:praise.slice(-5) }); return true;
  }
  function cur0(code){ return ls.json(KEY(code), null) || {}; }
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
  /* Set work shows from its day onwards. Work from a WEEK PLAN (it has a role) belongs to its own day: today's main task and practice;
     "if you finish" only once today's main task is done; a main task not finished earlier in the week stays, marked "if you like". */
  function todaysExtras(code){
    const d = today(), all = read(code).extras.map((x, i) => Object.assign({ i }, x)), t0 = new Date(); t0.setDate(t0.getDate() - 6);
    const since = t0.getFullYear() + '-' + String(t0.getMonth() + 1).padStart(2, '0') + '-' + String(t0.getDate()).padStart(2, '0');
    const mains = all.filter(x => x.r === 'm' && x.d === d), mainsDone = mains.length > 0 && mains.every(x => x.dn);
    return all.filter(x => !x.r ? (!x.d || x.d <= d) : x.d === d ? (x.r !== 'f' || mainsDone || x.dn) : (x.r === 'm' && !x.dn && x.d < d && x.d >= since))
      .map(x => Object.assign(x, { late:!!x.r && x.d < d })).sort((a, b) => (a.late ? 1 : 0) - (b.late ? 1 : 0) || 'mpf'.indexOf(a.r || 'm') - 'mpf'.indexOf(b.r || 'm'));
  }
  const dayName = d => { const m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(d || ''); return m ? new Date(m[1], m[2] - 1, m[3]).toLocaleDateString('en-GB', { weekday:'long' }) : ''; };
  function extraDone(code, idx){
    const b = read(code), x = b.extras[idx]; if(!x || x.dn) return;
    x.dn = today(); ls.set(KEY(code), b);
    try{ FabImpact.log('setwork', x.a || 'challenge', x.th ? { step:x.th } : null); }catch(e){}
    try{ fabWorldAward(1); }catch(e){}
  }

  /* a booklet finished in the app marks its task done, as "I did it" would */
  function actDone(code, id){ const i = read(code).extras.findIndex(x => !x.dn && String(x.a || '').indexOf(id) === 0); if(i >= 0) extraDone(code, i); }

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
    try{ if(v === 'burrow') localStorage.setItem('fab-home', 'burrow'); else if(v === '0') localStorage.setItem('fab-home', 'off'); }catch(e){} })();
  const homeOn = () => raw.get('fab-home') !== 'off';
  let learnAll = false;   /* true after the teacher's button, until the Burrow or the menu is shown again */
  let teachArm = 0;
  const ic = (name, emoji) => { try{ if(window.FabIcon && FabIcon.names.includes(name)) return FabIcon.svg(name); }catch(e){} return `<span aria-hidden="true">${emoji}</span>`; };

  /* Things I made: what this Fab code has finished or kept, read from what the app already saves on this device */
  function made(code){
    const out = [];
    pathPacks().forEach(p => { const pr = progress(code, p); if(!pr || !pr.secured.length || !window.FabFlightPoster || !window.FabProud) return;
      out.push({ k:'poster', id:p.id, ic:ic('star', '⭐'), t:p.title, s:pr.secured.length === 1 ? '1 step climbed' : pr.secured.length + ' steps climbed', b:'See my poster' }); });
    try{ const mk = raw.json('fab-make-' + code, {}), X = window.FabExplore;
      if(X) X.order.forEach(id => { const m = mk[id], w = X.worlds[id]; if(!m || !w) return;
        const rep = m.rep || {}, wrote = !!(rep.intro || rep.dyk || arr(rep.s).some(x => x && x.t)), drew = !!(m.png || (m.art && /[1-9]/.test(m.art)));
        const posters = m.how ? Object.keys(m.how).filter(k => m.how[k] && m.how[k].done).length : 0, chart = !!(m.same && m.same.done);
        if(!wrote && !drew && !posters && !chart) return;
        const bits = []; if(drew) bits.push(String((w.make.art && w.make.art.noun) || 'My design')); if(posters) bits.push(posters === 1 ? 'an explanation poster' : posters + ' explanation posters'); if(chart) bits.push('a same-but-different chart'); if(wrote) bits.push('my report');
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
        <div class="bw-what">${it.th ? `<span class="bw-theme">${h(it.th)}</span>` : ''}<b>${h(S.pack.title)}</b><span>${h(stepName)}</span>${it.n ? `<em>Your teacher says: ${h(it.n)}</em>` : ''}</div>
        ${S.done ? '<span class="bw-status">⭐ Done</span>' : ''}
        <button type="button" class="btn ${S.done ? 'soft small' : 'leaf'}" data-bwgo="${it.i}">${S.done ? 'Do more' : S.started ? 'Carry on ➡️' : 'Start ➡️'}</button></li>`; }).join('');
    const xs = todaysExtras(code);
    const xrows = xs.map(x => { const a = actOf(x.a) || ACTS[0];
      return `<li class="bw-item bw-x ${x.dn ? 'done' : ''}"><span class="bw-xic" aria-hidden="true">${ic(a.ic, a.e)}</span>
        <div class="bw-what">${x.r === 'f' ? '<span class="bw-theme bw-role">If you finish</span>' : x.late ? `<span class="bw-theme bw-role">From ${h(dayName(x.d))}, if you like</span>` : x.r === 'p' ? '<span class="bw-theme bw-role">Practise</span>' : ''}${x.th ? `<span class="bw-theme">${h(x.th)}</span>` : ''}<b>${h(extraTitle(x))}</b>${x.t && x.a ? `<span>${h(a.n)}</span>` : ''}${a.show ? `<span class="bw-show">${h(a.show)}</span>` : ''}${x.n ? `<em>Your teacher says: ${h(x.n)}</em>` : ''}</div>
        ${x.dn ? '<span class="bw-status">⭐ Done</span>' : ''}
        ${x.a && !a.show ? `<button type="button" class="btn ${x.dn ? 'soft small' : 'leaf'}" data-bwxgo="${x.i}">${x.dn ? 'Do more' : 'Start ➡️'}</button>` : ''}
        ${x.dn ? '' : `<button type="button" class="btn soft small" data-bwxdone="${x.i}">I did it</button>`}</li>`; }).join('');
    const xn = xs.filter(x => !x.late && x.r !== 'f');
    const total = list.length + xn.length;
    const nDone = list.filter(it => statusOf(code, it).done).length + xn.filter(x => x.dn).length, all = total && nDone === total;
    const say = !total ? (homeOn() ? '<p class="bw-none">Nothing is set for today yet. Your teacher will choose something with you.</p>' : '<p class="bw-none">Nothing is set for today. Choose anything you like.</p>')
      : all ? '<div class="fab-say"><span class="fab-char elder" role="img" aria-label="Mr Elder, the head teacher"></span><div class="bubble"><b>All done for today. Brilliant!</b>Your stars are waiting in Fab Fox World.</div></div>'
      : `<div class="fab-say"><span class="fab-char fab" role="img" aria-label="Fab"></span><div class="bubble"><b>${total === 1 ? 'One thing to do today' : total + ' things to do today'}</b>Start at the top. You can stop for a rest at any time.</div></div>`;
    const inProg = pathPacks().map(p => ({ p, pr:progress(code, p) })).filter(x => x.pr).sort((x, y) => y.pr.saved - x.pr.saved).slice(0, 6);
    const card = (p, sub, label) => `<button type="button" class="bw-card" data-bwopen="${h(p.id)}"><span class="bw-emoji" aria-hidden="true">${h(p.emoji || '📘')}</span><b>${h(p.title)}</b>${sub}<span class="bw-cta">${label}</span></button>`;
    const free = arr(b.free).map(packById).filter(Boolean);
    let certs = []; try{ certs = FabCheck.Store.all().filter(r => r.passed && r.code === code).slice(-8).reverse(); }catch(e){}
    const pr = arr(b.praise).slice(-3).reverse();
    const praiseHTML = pr.length ? `<div class="me-card bw-shelf bw-praise" id="bwPraise"><h3 class="bw-h">${ic('star', '⭐')} Well done from your teacher</h3><ul>${pr.map(x => `<li>${h(x.t)}</li>`).join('')}</ul></div>` : '';
    return `${praiseHTML}<div class="me-card bw-shelf" id="bwToday"><h3>📌 Today</h3>${say}${rows || xrows ? `<ol class="bw-list">${rows}${xrows}</ol>` : ''}</div>
      ${inProg.length ? `<div class="me-card bw-shelf" id="bwPaths"><h3>🗺️ My flightpaths</h3><div class="bw-cards">${inProg.map(x => card(x.p,
        `<span class="bw-bar" role="img" aria-label="${x.pr.secured.length} of ${x.pr.n} steps secure"><i style="width:${Math.round(100 * x.pr.secured.length / x.pr.n)}%"></i></span><small>On step ${x.pr.step + 1} · ${x.pr.secured.length} of ${x.pr.n} secure</small>`, 'Carry on ➡️')).join('')}</div></div>` : ''}
      ${free.length ? `<div class="me-card bw-shelf" id="bwFree"><h3>🎈 Free choice</h3><p class="hint">Your teacher has opened these for any time you like.</p><div class="bw-cards">${free.map(p => card(p, `<small>${h(p.subject || '')} · ${h(p.years || '')}</small>`, 'Open ➡️')).join('')}</div></div>` : ''}
      ${certs.length ? `<div class="me-card bw-shelf" id="bwCerts"><h3>🏅 My checkpoints</h3><div class="me-tre">${certs.map(r => `<span>🏅 ${h(r.title)}</span>`).join('')}</div></div>` : ''}
      ${homeOn() ? madeHTML(code) + `<p class="bw-teach" id="bwTeach"><button type="button" class="btn small soft" data-bwmore>For teachers</button></p>` : ''}`;
  }
  function wire(box, code){
    box.querySelectorAll('[data-bwgo]').forEach(b => b.addEventListener('click', () => { snd('ding'); go(code, Number(b.dataset.bwgo)); }));
    box.querySelectorAll('[data-bwopen]').forEach(b => b.addEventListener('click', () => { const p = packById(b.dataset.bwopen); if(!p) return; snd('tick'); openPack(p, null); }));
    box.querySelectorAll('[data-bwxgo]').forEach(b => b.addEventListener('click', () => { const x = read(code).extras[Number(b.dataset.bwxgo)]; if(!x) return; snd('ding'); openAct(code, x.a); }));
    box.querySelectorAll('[data-bwxdone]').forEach(b => b.addEventListener('click', () => { extraDone(code, Number(b.dataset.bwxdone)); snd('jingle'); try{ showScreen('screen-me'); }catch(e){} }));
    box.querySelectorAll('[data-bwmade]').forEach(b => b.addEventListener('click', () => { snd('tick'); openMade(code, b.dataset.bwmade, b.dataset.id || ''); }));
    /* the teacher's door: two taps, so a child does not land in the whole list by accident */
    box.querySelectorAll('[data-bwmore]').forEach(b => b.addEventListener('click', () => { snd('tick');
      if(Date.now() - teachArm > 6000){ teachArm = Date.now(); b.textContent = 'Teachers: tap again to open the Teachers’ area'; b.classList.add('amber'); setTimeout(() => { if(b.isConnected && Date.now() - teachArm >= 6000){ b.textContent = 'For teachers'; b.classList.remove('amber'); } }, 6100); return; }
      teachArm = 0; if(window.FabTeach) FabTeach.open(); else openAll(); }));
  }

  /* the whole list of flightpaths and lessons: the teachers' view */
  function openAll(){ learnAll = true; showScreen('screen-learn'); try{ learnRenderList(); }catch(e){} }

  /* ---------- staff: set work and make the link ---------- */
  const F = { code:'', rows:[{ p:'', s:0, d:'', n:'' }], free:[], extras:[], link:'', msg:'', cls:true, home:true, init:false };
  /* one link per child: who they are, class mode (their code and Help in the top bar, sounds start off), the draft Burrow home, and the work */
  function linkFor(code, rows, free, opt){
    const a = rows.filter(r => r.p).map(r => { const row = [r.p, r.s == null ? null : Number(r.s), r.d || '', (r.n || '').trim().slice(0, 80)]; if(r.th) row.push(clean(r.th, 30)); return row; });
    opt = opt || {};
    const x = arr(opt.extras).map(e => ({ a:actOf(e.a) ? e.a : '', t:clean(e.t, e.a === 'booklet' || String(e.a).indexOf('bk:') === 0 ? 80 : 60), n:clean(e.n, 80), th:clean(e.th, 30), d:e.d || '', r:['m', 'p', 'f'].includes(e.r) ? e.r : '' })).filter(extraOK).slice(0, opt.week ? 30 : 4).map(e => e.r ? [e.a, e.t, e.n, e.th, e.d, e.r] : [e.a, e.t, e.n, e.th, e.d]);
    const o = { t:Date.now(), a, f:free }; if(x.length) o.x = x;
    const k = clean(opt.praise, 60); if(k) o.k = [[k]];
    if(opt.merge || k) o.m = 1;
    if(opt.week) o.w = 1;
    return location.origin + location.pathname + '?learner=' + encodeURIComponent(code) + (opt.cls ? '&class=1&quiet=1' : '') + (opt.home ? '&home=burrow' : '') + '&burrow=' + enc(o);
  }
  function staffHTML(){
    const P = pathPacks();
    if(!F.init && P[0]){ F.init = true; F.rows[0].p = P[0].id; F.rows[0].d = today(); }
    let known = []; try{ known = [...new Set([].concat(typeof pwCodes !== 'undefined' ? pwCodes : [], FabImpact.codes().filter(c => CODE_RE.test(c))))]; }catch(e){}
    const row = (r, i) => { const po = pathOf(packById(r.p));
      return `<div class="bw-row" data-row="${i}"><label><span>Flightpath</span><select data-bwf="p"><option value="" ${r.p ? '' : 'selected'}>No flightpath</option>${P.map(p => `<option value="${h(p.id)}" ${p.id === r.p ? 'selected' : ''}>${h((p.emoji || '') + ' ' + p.title + ' (' + (p.years || '') + ')')}</option>`).join('')}</select></label>
        <label><span>Start at</span><select data-bwf="s">${po ? po.s.steps.map((s, k) => `<option value="${k}" ${Number(r.s) === k ? 'selected' : ''}>${k + 1}. ${h(s.name)}${s.year ? ' (' + h(s.year) + ')' : ''}</option>`).join('') : ''}</select></label>
        <label><span>Day</span><input type="date" data-bwf="d" value="${h(r.d || '')}"></label>
        <label class="bw-note"><span>Note for the child (optional)</span><input type="text" data-bwf="n" maxlength="80" value="${h(r.n || '')}" placeholder="Start with the 3 times table"></label>
        ${F.rows.length > 1 ? `<button type="button" class="btn small soft" data-bwdel="${i}" aria-label="Remove this piece of work">✕</button>` : ''}</div>`; };
    return `<div class="me-card" id="bwStaff"><h2>📌 Set work for a child’s Burrow</h2>
      <p>Pick a Fab code and the work for a session. You get one link for that child. Paste it into their Pencil Spaces Web Viewer and their Burrow opens with <b>Today</b> filled in. <b>A signed-in child sees only what you set here</b>, their own flightpaths and the things they made: the full list on this page is the teachers’ view.</p>
      <div class="bw-row"><label><span>Fab code</span><input type="text" id="bwCode" list="bwCodes" value="${h(F.code)}" placeholder="otter-482" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="20"></label><datalist id="bwCodes">${known.map(c => `<option value="${h(c)}">`).join('')}</datalist></div>
      ${F.rows.map(row).join('')}
      <div class="st-row">${F.rows.length < 4 ? '<button type="button" class="btn small soft" id="bwAdd">➕ Add another piece of work</button>' : ''}</div>
      <h3 class="bw-sub">Activities, challenges and theme weeks</h3>
      <p class="hint">Set an activity from the app, a challenge in your own words, or both. A theme shows as a tag on the child’s card.</p>
      ${F.extras.map((x, i) => `<div class="bw-row bw-xrow" data-xrow="${i}">
        <label><span>Activity in the app</span><select data-bwx="a">${ACTS.map(a => `<option value="${h(a.id)}" ${a.id === x.a ? 'selected' : ''}>${h(a.n)}</option>`).join('')}</select></label>
        <label class="bw-note"><span>Challenge in your own words (optional)</span><input type="text" data-bwx="t" maxlength="60" value="${h(x.t || '')}" placeholder="Make a kindness poster"></label>
        <label><span>Theme (optional)</span><input type="text" data-bwx="th" maxlength="30" list="bwThemes" value="${h(x.th || '')}" placeholder="Anti-Bullying Week"></label>
        <label><span>Day</span><input type="date" data-bwx="d" value="${h(x.d || '')}"></label>
        <label class="bw-note"><span>Note for the child (optional)</span><input type="text" data-bwx="n" maxlength="80" value="${h(x.n || '')}"></label>
        <button type="button" class="btn small soft" data-bwxdel="${i}" aria-label="Remove this activity or challenge">✕</button>
        ${THEMES[x.th] ? `<div class="bw-ideas"><span>Ideas for ${h(x.th)}:</span>${THEMES[x.th].map((t, k) => `<button type="button" class="btn small soft" data-bwidea="${i}:${k}">${h(t[1])}</button>`).join('')}</div>` : ''}</div>`).join('')}
      <datalist id="bwThemes">${Object.keys(THEMES).map(t => `<option value="${h(t)}">`).join('')}</datalist>
      <div class="st-row">${F.extras.length < 4 ? '<button type="button" class="btn small soft" id="bwXAdd">➕ Add an activity or a challenge</button>' : ''}</div>
      <details class="bw-freepick" ${F.free.length ? 'open' : ''}><summary><b>Free choice</b>: flightpaths this child may open at any time</summary><div class="bw-chips">${P.map(p => `<label><input type="checkbox" data-bwfree="${h(p.id)}" ${F.free.includes(p.id) ? 'checked' : ''}> ${h((p.emoji || '') + ' ' + p.title + (p.years ? ' (' + p.years + ')' : ''))}</label>`).join('')}</div></details>
      <div class="bw-opts"><label><input type="checkbox" id="bwCls" ${F.cls ? 'checked' : ''}> <span><b>Class link</b>: the child’s code and a Help button show in the top bar, and sounds start off</span></label>
</div>
      <div class="st-row"><button type="button" class="btn leaf" id="bwMake">🔗 Make the Burrow link</button></div>
      <p class="learn-msg" id="bwMsg" aria-live="polite">${h(F.msg)}</p>
      ${F.link ? `<div class="st-codes"><div><input readonly id="bwLink" value="${h(F.link)}" aria-label="Burrow link for ${h(F.code)}"><button type="button" class="btn small soft" id="bwCopy">Copy link</button></div></div>` : ''}
      <p class="hint">Fab codes only. Notes, challenges and themes travel inside the link, so please keep names and personal details out of them. A new link replaces the work from an older one. Work with no day shows straight away; work with a day shows from that day.</p></div>`;
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
    card.querySelectorAll('[data-bwx]').forEach(el => { const i = Number(el.closest('[data-xrow]').dataset.xrow), f = el.dataset.bwx;
      el.addEventListener(f === 'a' || f === 'd' ? 'change' : 'input', () => { const x = F.extras[i]; if(!x) return; x[f] = f === 'a' || f === 'd' ? el.value : el.value.slice(0, f === 't' ? 60 : f === 'th' ? 30 : 80); F.link = ''; });
      if(f === 'th') el.addEventListener('change', () => redraw()); });
    card.querySelectorAll('[data-bwxdel]').forEach(b => b.addEventListener('click', () => { F.extras.splice(Number(b.dataset.bwxdel), 1); F.link = ''; snd('tick'); redraw(); }));
    card.querySelectorAll('[data-bwidea]').forEach(b => b.addEventListener('click', () => { const [i, k] = b.dataset.bwidea.split(':').map(Number), x = F.extras[i], t = x && THEMES[x.th] && THEMES[x.th][k]; if(!t) return; x.a = t[0]; x.t = t[1]; F.link = ''; snd('tick'); redraw(); }));
    const xadd = card.querySelector('#bwXAdd'); if(xadd) xadd.addEventListener('click', () => { F.extras.push({ a:'', t:'', n:'', th:'', d:F.rows[0] ? F.rows[0].d || today() : today() }); F.link = ''; snd('tick'); redraw(); });
    const add = card.querySelector('#bwAdd'); if(add) add.addEventListener('click', () => { const P = pathPacks(); F.rows.push({ p:P[0] ? P[0].id : '', s:0, d:F.rows[0].d || today(), n:'' }); F.link = ''; snd('tick'); redraw(); });
    card.querySelectorAll('[data-bwfree]').forEach(c => c.addEventListener('change', () => { const id = c.dataset.bwfree; F.free = c.checked ? F.free.concat(id).slice(0, 8) : F.free.filter(x => x !== id); F.link = ''; }));
    const cls = card.querySelector('#bwCls'); if(cls) cls.addEventListener('change', () => { F.cls = cls.checked; F.link = ''; });
    card.querySelector('#bwMake').addEventListener('click', () => {
      F.code = String(code.value || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 20);
      if(!CODE_RE.test(F.code)){ F.link = ''; F.msg = 'Type a Fab code first: an animal, a dash and three numbers, like otter-482. Never a name.'; snd('gentle'); redraw(); return; }
      if(!F.rows.some(r => r.p) && !F.extras.some(extraOK) && !F.free.length){ F.link = ''; F.msg = 'Choose a flightpath, an activity or a challenge first.'; snd('gentle'); redraw(); return; }
      F.link = linkFor(F.code, F.rows, F.free, { cls:F.cls, extras:F.extras }); F.msg = 'Link ready for ' + F.code + '. It holds the work, the day and your note, and nothing else.'; snd('ding'); redraw();
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
.bw-sub{margin:14px 0 2px}.bw-xrow{border:2px dashed #e6d8b8}
.bw-ideas{flex:1 1 100%;display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-weight:700;font-size:.95rem}
.bw-xic{display:grid;place-items:center;width:52px;height:52px;flex:none;background:#FFD483;border:2.5px solid #2B1A12;border-radius:12px;font-size:1.6rem}.bw-xic svg{width:38px;height:38px}
.bw-praise ul{margin:6px 0 0;padding-left:1.3em;text-align:left}.bw-praise li{font-weight:700;margin:3px 0}
.bw-show{font-style:italic;opacity:.85}
.bw-theme.bw-role{background:#CFE7F2;margin-right:6px}
.bw-theme{align-self:flex-start;background:#CFE7F2;border:2px solid #2B1A12;border-radius:999px;padding:1px 10px;font-size:.85rem;font-weight:700}
.bw-opts{display:grid;gap:6px;margin:8px 0}.bw-opts label{display:flex;gap:10px;align-items:flex-start;background:#fffdf6;border-radius:12px;padding:8px 10px}.bw-opts input{width:22px;height:22px;flex:none;margin-top:2px}
.bw-h{display:flex;align-items:center;gap:8px}.bw-h svg{width:1.6em;height:1.6em;flex:none}
.bw-made{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px}
.bw-mcard{display:flex;flex-direction:column;gap:4px;align-items:flex-start;text-align:left;background:#FFF6E6;border:3px solid #2B1A12;border-radius:16px 18px 15px 19px;padding:10px 12px 12px;font:inherit;color:#2B1A12;cursor:pointer;min-height:150px;box-shadow:none}
.bw-mcard:hover,.bw-mcard:focus-visible{background:#FFD483;outline:none}
.bw-mcard img{width:100%;height:92px;object-fit:cover;border:2.5px solid #2B1A12;border-radius:10px;background:#fff}
.bw-mic{display:grid;place-items:center;width:100%;height:92px;background:#FFD483;border:2.5px solid #2B1A12;border-radius:10px;font-size:2.6rem}.bw-mic svg{width:64px;height:64px}
.bw-mcard b{font-size:1.05rem;line-height:1.25}.bw-mcard small{opacity:.85;line-height:1.3}.bw-mcard .bw-cta{margin-top:auto;font-style:italic}
.bw-teach{max-width:880px;margin:0 auto 14px;text-align:right}.bw-teach .btn{opacity:.8;font-size:.9rem}
`;
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

  window.FabBurrow = { shelvesHTML, wire, staffHTML, staffWire, read, apply, enc, dec, linkFor, progress, form:F, home:homeOn, made, acts:ACTS, act:actOf, actDone, themes:THEMES,
    paths:pathPacks, pathOf, packById, status:statusOf, extraTitle, openAll, today, codeRe:CODE_RE };

  /* the Learning Hub's door leads to the Burrow for a signed-in child; the teacher's button opens the full list */
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
