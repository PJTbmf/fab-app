/* ============ 🎨 Make and do (Explorer Worlds) ============
   A fourth thing to do in every Explorer World, inspired by Make More Fab: making, designing and writing.
     🧩 Put it in order   a timeline (or the planets), built by tapping the cards in order
     🎨 Tile art          a mosaic, a jewelled collar, a patterned tile or a mission patch
     ✍️ My report         a non-chronological report at three levels; the child's timeline and art slot straight in
   Everything is saved on this device only (fab-make-<Fab code>). Nothing is sent anywhere.
   Each world's activities are plain data at the bottom of this file. Facts are a draft for a teacher to check. */
(() => {
  'use strict';
  const X = window.FabExplore; if(!X) return;
  const h = X.kit.h, q1 = s => document.querySelector(s);
  const KEY = () => 'fab-make-' + X.code();
  const load = () => { try{ return JSON.parse(localStorage.getItem(KEY()) || '{}') || {}; }catch(e){ return {}; } };
  const save = d => { try{ localStorage.setItem(KEY(), JSON.stringify(d)); }catch(e){} };
  const mine = (d, id) => (d[id] = d[id] || { order:0, art:'', png:'', artDone:0, rep:{} });
  const M = { view:'home', seq:null, note:null, col:1, grid:null };
  const star = () => { try{ fabWorldAward(1); }catch(e){} X.snd('jingle'); };
  const sentences = t => (String(t).match(/[^.!?]+[.!?]+/g) || [String(t)]).map(x => x.trim());
  const MASK = {
    collar:(x, y, W) => { const d = Math.hypot(x - (W - 1) / 2, y + 1.5); return d >= 4.6 && d <= 12.4; },
    circle:(x, y, W, H) => Math.hypot(x - (W - 1) / 2, y - (H - 1) / 2) <= W / 2 - .2
  };
  const inMask = (a, x, y) => !a.mask || MASK[a.mask](x, y, a.W, a.H);
  const note = n => n ? `<div class="fab-say"><span class="fab-char ${n.k === 'win' ? 'elder' : 'doc'}" role="img" aria-label="${n.k === 'win' ? 'Mr Elder' : 'Doctor McPhee'}"></span><div class="bubble"><b>${h(n.h)}</b>${h(n.t)}</div></div>` : '';
  const back = '<button type="button" class="btn small soft" data-mk="home">⬅ Back to Make and do</button>';

  /* ---------- the menu ---------- */
  function homeHTML(w, me){
    const k = w.make, card = (id, e, t, sub, done) => `<button type="button" class="mk-card ${done ? 'done' : ''}" data-mk="open" data-id="${id}"><span class="mk-e" aria-hidden="true">${e}</span><b>${h(t)}</b><small>${h(sub)}</small>${done ? '<span class="mk-tick">✓ Made</span>' : ''}</button>`;
    return `<div class="fab-say"><span class="fab-char fab" role="img" aria-label="Fab"></span><div class="bubble"><b>Make and do</b>Choose something to make. Your work is saved here, and it slots into your report.</div></div>
      <div class="mk-cards">${card('order', '🧩', k.order.h, k.order.sub, me.order)}${card('art', '🎨', k.art.h, k.art.sub, me.artDone)}${card('report', '✍️', 'Write my report', 'Your facts, timeline and art in one place', me.rep && me.rep.done)}</div>`;
  }

  /* ---------- 🧩 put it in order ---------- */
  function orderItem(it){ return `${it.c ? `<i class="mk-dot" style="background:${it.c}" aria-hidden="true"></i>` : ''}${it.d ? `<b>${h(it.d)}</b> ` : ''}<span>${h(it.n)}</span>`; }
  function orderHTML(w){
    const o = w.make.order, S = M.seq, placed = S.placed.map(id => o.items.find(x => x.id === id));
    return `<h3 class="mk-h">🧩 ${h(o.h)}</h3><p class="mk-ask">${h(o.ask)}</p>
      <ol class="mk-strip" aria-label="${h(o.noun)}">${placed.map(it => `<li>${orderItem(it)}</li>`).join('')}${S.left.length ? `<li class="mk-slot" aria-hidden="true">${placed.length ? 'What came next?' : h(o.first || 'What came first?')}</li>` : ''}</ol>
      <div class="mk-pool" role="group" aria-label="Cards to put in order">${S.left.map(id => { const it = o.items.find(x => x.id === id); return `<button type="button" class="mk-chip" data-mk="put" data-id="${id}">${orderItem(it)}</button>`; }).join('')}</div>
      <div class="tm-notebox" role="status">${note(M.note)}</div><div class="choice-row tm-row">${S.left.length ? '' : '<button type="button" class="btn small leaf" data-mk="open" data-id="report">✍️ Put it in my report</button>'}${back}</div>`;
  }
  function startOrder(w){ const ids = w.make.order.items.map(x => x.id); let sh = ids.slice(); for(let n = 0; n < 6 && sh.join() === ids.join(); n++) sh = sh.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(v => v[1]); M.seq = { left:sh, placed:[] }; M.note = null; }

  /* ---------- 🎨 tile art ---------- */
  function artHTML(w, me){
    const a = w.make.art;
    return `<h3 class="mk-h">🎨 ${h(a.h)}</h3><p class="mk-ask">${h(a.tip)}</p>
      <div class="mk-artwrap"><canvas id="mkArt" class="mk-art" width="${a.W * 30}" height="${a.H * 30}" role="img" aria-label="${h(a.noun)}: a grid of ${a.W} by ${a.H} tiles to colour"></canvas>
        <div class="mk-pal" role="group" aria-label="Colours">${a.pal.map((c, i) => `<button type="button" class="mk-sw ${M.col === i + 1 ? 'sel' : ''}" data-mk="col" data-id="${i + 1}" style="background:${c[0]}" aria-label="${h(c[1])}" aria-pressed="${M.col === i + 1}"></button>`).join('')}<button type="button" class="mk-sw mk-rub ${M.col === 0 ? 'sel' : ''}" data-mk="col" data-id="0" aria-label="Rubber" aria-pressed="${M.col === 0}">⌫</button></div></div>
      <div class="tm-notebox" role="status">${note(M.note)}</div>
      <div class="choice-row tm-row"><button type="button" class="btn small leaf" data-mk="artdone">⭐ I’ve finished</button>${me.artDone ? '<button type="button" class="btn small leaf" data-mk="open" data-id="report">✍️ Put it in my report</button>' : ''}<button type="button" class="btn small soft" data-mk="artclear">Start again</button>${back}</div>`;
  }
  function drawArt(w){
    const a = w.make.art, cv = q1('#mkArt'); if(!cv) return; const g = cv.getContext('2d'), s = 30;
    g.clearRect(0, 0, cv.width, cv.height);
    for(let y = 0; y < a.H; y++) for(let x = 0; x < a.W; x++){
      if(!inMask(a, x, y)) continue; const v = +M.grid[y * a.W + x];
      g.fillStyle = v ? a.pal[v - 1][0] : '#efe6d2'; g.beginPath();
      if(g.roundRect) g.roundRect(x * s + 1.5, y * s + 1.5, s - 3, s - 3, 5); else g.rect(x * s + 1.5, y * s + 1.5, s - 3, s - 3);
      g.fill(); if(!v){ g.strokeStyle = 'rgba(43,26,18,.18)'; g.lineWidth = 1; g.stroke(); }
    }
  }
  function paint(w, x, y){
    const a = w.make.art; if(x < 0 || y < 0 || x >= a.W || y >= a.H || !inMask(a, x, y)) return false;
    const pts = [[x, y]]; if(a.sym === 'mirror' || a.sym === 'four') pts.push([a.W - 1 - x, y]); if(a.sym === 'four') pts.push([x, a.H - 1 - y], [a.W - 1 - x, a.H - 1 - y]);
    const g = M.grid.split(''); let ch = false; pts.forEach(p => { const i = p[1] * a.W + p[0]; if(g[i] !== String(M.col)){ g[i] = String(M.col); ch = true; } });
    if(ch){ M.grid = g.join(''); drawArt(w); } return ch;
  }
  function startArt(w, me){ const a = w.make.art, n = a.W * a.H; M.grid = me.art && me.art.length === n ? me.art : '0'.repeat(n); M.col = 1; M.note = null; }

  /* ---------- ✍️ my report ---------- */
  const LV = [['1', '🌱', 'Build it with taps', 'Tap the sentences you want'], ['2', '🌿', 'Sentence starters', 'Starters and a word bank to help'], ['3', '🌳', 'On my own', 'Just the headings']];
  function repState(w, me){ const r = me.rep = me.rep || {}; r.lvl = r.lvl || ''; r.title = r.title == null ? w.make.report.title : r.title; r.intro = r.intro || ''; r.dyk = r.dyk || ''; r.s = r.s || [{ id:'', text:'', pick:[] }, { id:'', text:'', pick:[] }]; r.ipick = r.ipick == null ? -1 : r.ipick; r.dpick = r.dpick || ''; return r; }
  function repText(w, r){
    const spot = id => w.spots.find(x => x.id === id), one = r.lvl === '1';
    const secs = r.s.map(x => { const sp = spot(x.id); if(!sp) return null; const sen = sentences(sp.t); return { h:sp.n, t:one ? x.pick.slice().sort().map(i => sen[i]).filter(Boolean).join(' ') : (x.text || '').trim() }; }).filter(Boolean);
    const dsp = spot(r.dpick);
    return { title:(r.title || '').trim(), intro:one ? (w.make.report.intro[r.ipick] || '') : (r.intro || '').trim(), secs, dyk:one ? (dsp ? dsp.k : '') : (r.dyk || '').trim().replace(/^did you know(\s+that)?[,:]?\s*/i, '').replace(/^./, c => c.toUpperCase()) };
  }
  function checks(w, me){ const t = repText(w, me.rep); return [['A title', !!t.title], ['An introduction', !!t.intro], ['Two subheadings with facts', t.secs.filter(x => x.t).length >= 2], ['A “Did you know?” fact', !!t.dyk], ['A picture or a timeline', !!(me.png || me.order)]]; }
  function chips(list, target){ return `<div class="mk-words" role="group" aria-label="Words to help">${list.map(x => `<button type="button" class="mk-word" data-mk="ins" data-for="${target}" data-t="${h(x)}">${h(x)}</button>`).join('')}</div>`; }
  function reportHTML(w, me){
    const k = w.make.report, r = repState(w, me);
    if(!r.lvl) return `<h3 class="mk-h">✍️ Write my report</h3><p class="mk-ask">A report tells people facts about one thing. Choose how you would like to write today.</p>
      <div class="mk-cards">${LV.map(l => `<button type="button" class="mk-card" data-mk="lvl" data-id="${l[0]}"><span class="mk-e" aria-hidden="true">${l[1]}</span><b>${l[2]}</b><small>${l[3]}</small></button>`).join('')}</div><div class="choice-row tm-row">${back}</div>`;
    const one = r.lvl === '1', two = r.lvl === '2';
    const pickStop = n => `<div class="mk-words" role="group" aria-label="Choose what part ${n + 1} is about">${w.spots.map(s => `<button type="button" class="mk-word ${r.s[n].id === s.id ? 'sel' : ''}" data-mk="stop" data-n="${n}" data-id="${s.id}" ${r.s[1 - n].id === s.id ? 'disabled' : ''}><span aria-hidden="true">${s.e}</span> ${h(s.n)}</button>`).join('')}</div>`;
    const sec = n => { const sp = w.spots.find(x => x.id === r.s[n].id); if(!sp) return `<section class="mk-sec"><h4>Part ${n + 1}: choose a subheading</h4>${pickStop(n)}</section>`;
      const sen = sentences(sp.t);
      return `<section class="mk-sec"><h4>${h(sp.n)} <button type="button" class="mk-link" data-mk="stop" data-n="${n}" data-id="">change</button></h4>
        ${one ? `<p class="hint">Tap the facts you want in this part.</p><div class="mk-picks">${sen.map((t, i) => `<button type="button" class="mk-pick ${r.s[n].pick.includes(i) ? 'sel' : ''}" data-mk="pick" data-n="${n}" data-id="${i}" aria-pressed="${r.s[n].pick.includes(i)}">${h(t)}</button>`).join('')}</div>`
          : `${two ? `<p class="mk-fact"><b>Fact card:</b> ${h(sp.t)}</p>${chips(['One interesting fact is that', 'It was used for', 'People', 'I was surprised that'], 'mkS' + n)}` : ''}<label class="sr-only" for="mkS${n}">Write about ${h(sp.n)}</label><textarea id="mkS${n}" class="mk-ta" data-mkf="s${n}" rows="3" maxlength="600" placeholder="Write your facts in your own words.">${h(r.s[n].text)}</textarea>`}</section>`; };
    const chosen = r.s.map(x => w.spots.find(s => s.id === x.id)).filter(Boolean);
    return `<h3 class="mk-h">✍️ Write my report <button type="button" class="mk-link" data-mk="lvl" data-id="">change how I write</button></h3>
      <div class="mk-rep"><div class="mk-form">
        <section class="mk-sec"><h4><label for="mkTitle">Title</label></h4><input id="mkTitle" class="mk-in" data-mkf="title" maxlength="60" value="${h(r.title)}"></section>
        <section class="mk-sec"><h4>Introduction</h4>${one ? `<p class="hint">Tap one sentence to start your report.</p><div class="mk-picks">${k.intro.map((t, i) => `<button type="button" class="mk-pick ${r.ipick === i ? 'sel' : ''}" data-mk="ipick" data-id="${i}" aria-pressed="${r.ipick === i}">${h(t)}</button>`).join('')}</div>`
          : `${two ? chips(['This report is about', 'Long ago,', 'Did you know that'], 'mkIntro') : ''}<label class="sr-only" for="mkIntro">Introduction</label><textarea id="mkIntro" class="mk-ta" data-mkf="intro" rows="2" maxlength="400" placeholder="Tell your reader what this report is about.">${h(r.intro)}</textarea>`}</section>
        ${sec(0)}${sec(1)}
        <section class="mk-sec"><h4>Did you know?</h4>${one ? (chosen.length ? `<p class="hint">Tap one amazing fact.</p><div class="mk-picks">${chosen.map(sp => `<button type="button" class="mk-pick ${r.dpick === sp.id ? 'sel' : ''}" data-mk="dpick" data-id="${sp.id}" aria-pressed="${r.dpick === sp.id}">${h(sp.k)}</button>`).join('')}</div>` : '<p class="hint">Choose your two subheadings first.</p>')
          : `${two ? chips(['Did you know that', 'Amazingly,'], 'mkDyk') : ''}<label class="sr-only" for="mkDyk">Did you know?</label><textarea id="mkDyk" class="mk-ta" data-mkf="dyk" rows="2" maxlength="300" placeholder="Share one amazing fact.">${h(r.dyk)}</textarea>`}</section>
        ${two ? `<section class="mk-sec"><h4>Word bank</h4><p class="hint">Tap a box above first, then tap a word to add it.</p>${chips(k.words, '')}</section>` : ''}
      </div>
      <aside class="mk-side"><h4>My report has…</h4><ul class="mk-checks" id="mkChecks">${checksHTML(w, me)}</ul>
        <p class="hint">${me.png ? '🎨 ' + h(w.make.art.noun) + ' is in your report.' : 'Make your art and it will appear in your report.'}<br>${me.order ? '🧩 ' + h(w.make.order.noun) + ' is in your report.' : 'Finish the order cards and they will appear too.'}</p>
        <button type="button" class="btn leaf" data-mk="open" data-id="paper">👀 See my report</button></aside></div>
      <div class="choice-row tm-row">${back}</div>`;
  }
  function checksHTML(w, me){ return checks(w, me).map(c => `<li class="${c[1] ? 'ok' : ''}">${c[1] ? '✅' : '⬜'} ${c[0]}</li>`).join(''); }
  function paperHTML(w, me){
    const t = repText(w, repState(w, me)), o = w.make.order, ok = checks(w, me).slice(0, 4).every(c => c[1]);
    return `<div class="tm-notebox" role="status">${note(M.note)}</div>
      <article class="mk-paper"><h2>${h(t.title || w.make.report.title)}</h2>${t.intro ? `<p class="mk-intro">${h(t.intro)}</p>` : ''}
        ${t.secs.filter(x => x.t).map(x => `<h3>${h(x.h)}</h3><p>${h(x.t)}</p>`).join('')}
        ${me.png ? `<figure class="mk-fig"><img src="${me.png}" alt="${h(w.make.art.noun)}"><figcaption>${h(w.make.art.noun)}</figcaption></figure>` : ''}
        ${me.order ? `<h3>${h(o.noun.replace(/^My /, ''))}</h3><ol class="mk-strip paper">${o.items.map(it => `<li>${orderItem(it)}</li>`).join('')}</ol>` : ''}
        ${t.dyk ? `<aside class="mk-dyk"><b>Did you know?</b> ${h(t.dyk)}</aside>` : ''}
        <p class="mk-by">Made in Explorer Worlds${X.code() !== 'local' ? ' · Fab code ' + h(X.code()) : ''}</p></article>
      <div class="choice-row tm-row"><button type="button" class="btn small leaf" data-mk="print">🖨️ Print my report</button><button type="button" class="btn small soft" data-mk="open" data-id="report">✏️ Keep writing</button>${back}</div>
      ${ok ? '' : '<p class="hint">Your report is saved. Add the parts with an empty box on your list when you are ready.</p>'}`;
  }

  /* ---------- wiring ---------- */
  function html(w){ const d = load(), me = mine(d, w.id);
    return `<div class="mk">${M.view === 'order' && M.seq ? orderHTML(w) : M.view === 'art' && M.grid ? artHTML(w, me) : M.view === 'report' ? reportHTML(w, me) : M.view === 'paper' ? paperHTML(w, me) : homeHTML(w, me)}</div>`; }
  function mount(w){
    if(M.view !== 'art') return; drawArt(w); const cv = q1('#mkArt'); if(!cv) return; let down = false, ch = false;
    const at = e => { const r = cv.getBoundingClientRect(); return [Math.floor((e.clientX - r.left) / r.width * w.make.art.W), Math.floor((e.clientY - r.top) / r.height * w.make.art.H)]; };
    cv.addEventListener('pointerdown', e => { down = true; try{ cv.setPointerCapture(e.pointerId); }catch(err){} const c = at(e); ch = paint(w, c[0], c[1]) || ch; e.preventDefault(); });
    cv.addEventListener('pointermove', e => { if(!down) return; const c = at(e); ch = paint(w, c[0], c[1]) || ch; });
    const up = () => { if(!down) return; down = false; if(ch){ ch = false; const d = load(); mine(d, w.id).art = M.grid; save(d); } };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  }
  function home(){ M.view = 'home'; M.note = null; }
  function click(e){
    const b = e.target.closest('[data-mk]'); if(!b || !b.closest('#screen-time')) return;
    const w = X.world(); if(!w || !w.make) return; const a = b.dataset.mk, id = b.dataset.id, d = load(), me = mine(d, w.id), r = repState(w, me);
    if(a === 'home'){ home(); X.snd('tick'); return X.render(); }
    if(a === 'open'){ M.note = null; if(id === 'order') startOrder(w); if(id === 'art') startArt(w, me);
      if(id === 'paper' && !r.done && checks(w, me).slice(0, 4).every(c => c[1])){ r.done = 1; save(d); star(); M.note = { k:'win', h:'Your report is finished!', t:'What a lot you know. That earned a star for Fab Fox World.' }; }
      M.view = id; X.snd('tick'); return X.render(); }
    if(a === 'put'){ const o = w.make.order, S = M.seq, want = o.items[S.placed.length];
      if(want && want.id === id){ S.placed.push(id); S.left = S.left.filter(x => x !== id); M.note = null; X.snd('ding');
        if(!S.left.length){ const first = !me.order; me.order = 1; save(d); if(first) star(); M.note = { k:'win', h:'All in order!', t:first ? 'That earned a star for Fab Fox World. It is ready to go in your report.' : 'It is ready to go in your report.' }; } }
      else { M.note = { k:'fix', h:'Not that one yet.', t:o.hint }; X.snd('gentle'); }
      return X.render(); }
    if(a === 'col'){ M.col = +id; document.querySelectorAll('.mk-sw').forEach(x => { const on = x.dataset.id === id; x.classList.toggle('sel', on); x.setAttribute('aria-pressed', String(on)); }); return; }
    if(a === 'artclear'){ M.grid = '0'.repeat(w.make.art.W * w.make.art.H); me.art = M.grid; save(d); M.note = null; X.snd('tick'); return X.render(); }
    if(a === 'artdone'){ if(!/[1-9]/.test(M.grid)){ M.note = { k:'fix', h:'Add some colour first.', t:'Pick a colour, then tap a tile.' }; return X.render(); }
      const cv = q1('#mkArt'), first = !me.artDone; me.art = M.grid; try{ me.png = cv.toDataURL('image/png'); }catch(err){} me.artDone = 1; save(d); if(first) star(); else X.snd('ding');
      M.note = { k:'win', h:'What a design!', t:first ? 'That earned a star for Fab Fox World. It is saved for your report.' : 'It is saved for your report.' }; return X.render(); }
    if(a === 'lvl'){ r.lvl = id; save(d); X.snd('tick'); return X.render(); }
    if(a === 'stop'){ const n = +b.dataset.n; r.s[n] = { id:id, text:r.s[n].id === id ? r.s[n].text : '', pick:[] }; if(r.dpick && !r.s.some(x => x.id === r.dpick)) r.dpick = ''; save(d); X.snd('tick'); return X.render(); }
    if(a === 'pick'){ const n = +b.dataset.n, i = +id, pk = r.s[n].pick; r.s[n].pick = pk.includes(i) ? pk.filter(x => x !== i) : pk.concat(i); save(d); X.snd('tick'); return X.render(); }
    if(a === 'ipick'){ r.ipick = r.ipick === +id ? -1 : +id; save(d); X.snd('tick'); return X.render(); }
    if(a === 'dpick'){ r.dpick = r.dpick === id ? '' : id; save(d); X.snd('tick'); return X.render(); }
    if(a === 'ins'){ const el = q1('#' + (b.dataset.for || M.last || 'mkIntro')); if(!el) return; const t = b.dataset.t, v = el.value; el.value = (v && !/\s$/.test(v) ? v + ' ' : v) + t + ' '; el.focus(); return field(el); }
    if(a === 'print'){ document.body.classList.add('mk-printing'); const done = () => { document.body.classList.remove('mk-printing'); window.removeEventListener('afterprint', done); }; window.addEventListener('afterprint', done); try{ window.print(); }catch(err){ done(); } setTimeout(done, 60000); return; }
  }
  function field(el){
    const w = X.world(), f = el && el.dataset && el.dataset.mkf; if(!w || !w.make || !f) return; const d = load(), me = mine(d, w.id), r = repState(w, me);
    if(f === 'title') r.title = el.value; else if(f === 'intro') r.intro = el.value; else if(f === 'dyk') r.dyk = el.value; else if(/^s\d$/.test(f)) r.s[+f[1]].text = el.value;
    save(d); const c = q1('#mkChecks'); if(c) c.innerHTML = checksHTML(w, me);
  }
  document.addEventListener('click', click);
  document.addEventListener('input', e => { if(e.target.closest && e.target.closest('.mk')) field(e.target); });
  document.addEventListener('focusin', e => { if(e.target.classList && e.target.classList.contains('mk-ta')) M.last = e.target.id; });

  const css = document.createElement('style'); css.textContent = `
.mk-h{margin:0 0 6px;font-family:var(--disp);font-size:var(--t-head,1.5rem)}.mk-ask{margin:0 0 12px;font-size:var(--t-lead,1.2rem)}
.mk-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-top:14px}
.mk-card{display:grid;gap:4px;justify-items:start;text-align:left;border:3px solid var(--ink,#2B1A12);border-radius:20px;background:#fff;padding:16px;cursor:pointer;font:inherit;color:inherit;min-height:120px;box-shadow:0 4px 0 rgba(43,26,18,.25)}
.mk-card:hover{background:#fffaf0}.mk-card:focus-visible,.mk-chip:focus-visible,.mk-word:focus-visible,.mk-pick:focus-visible,.mk-sw:focus-visible{outline:4px solid var(--sky,#5aa9e6);outline-offset:3px}
.mk-card .mk-e{font-size:2.4rem;line-height:1}.mk-card b{font-family:var(--disp);font-size:var(--t-lead,1.25rem)}.mk-card small{font-size:var(--t-small,.95rem);opacity:.85}.mk-card.done{background:#eef7e6}.mk-tick{font-weight:800;color:#3d6b2a}
.mk-strip{list-style:none;margin:0 0 12px;padding:0;display:grid;gap:8px;counter-reset:mk}.mk-strip li{counter-increment:mk;display:flex;gap:10px;align-items:center;background:#eef7e6;border:3px solid var(--ink,#2B1A12);border-radius:14px;padding:8px 14px;font-size:var(--t-body,1.05rem)}
.mk-strip li::before{content:counter(mk);font-family:var(--disp);font-size:1.3rem;min-width:1.4em}.mk-strip li.mk-slot{background:transparent;border-style:dashed;opacity:.75}.mk-strip li.mk-slot::before{content:'?'}
.mk-strip.paper li{background:#fff;border-width:2px;padding:6px 12px}
.mk-pool{display:flex;flex-wrap:wrap;gap:10px}.mk-chip{display:flex;gap:10px;align-items:center;border:3px solid var(--ink,#2B1A12);background:var(--cream,#FFF6E6);border-radius:14px;padding:10px 14px;font:inherit;font-size:var(--t-body,1.05rem);color:inherit;cursor:pointer;min-height:56px;text-align:left}
.mk-dot{display:inline-block;width:26px;height:26px;border-radius:50%;border:2px solid var(--ink,#2B1A12);flex:none}
.mk-artwrap{display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start}.mk-art{width:min(100%,560px);height:auto;touch-action:none;cursor:crosshair;background:#fbf6ea;border:4px solid var(--ink,#2B1A12);border-radius:16px}
.mk-pal{display:grid;grid-template-columns:repeat(3,56px);gap:10px}.mk-sw{width:56px;height:56px;border-radius:14px;border:3px solid var(--ink,#2B1A12);cursor:pointer;font-size:1.3rem}.mk-sw.sel{outline:5px solid var(--flame,#FE4D02);outline-offset:2px}.mk-rub{background:#fff}
.mk-rep{display:grid;grid-template-columns:minmax(0,1fr) minmax(220px,300px);gap:18px;align-items:start}.mk-sec{margin:0 0 14px}.mk-sec h4,.mk-side h4{margin:0 0 6px;font-family:var(--disp);font-size:var(--t-lead,1.2rem)}
.mk-in,.mk-ta{width:100%;box-sizing:border-box;font:inherit;font-size:1.1rem;padding:10px 14px;border:3px solid var(--ink,#2B1A12);border-radius:14px;background:#fff;color:inherit}.mk-in{min-height:52px}.mk-ta{resize:vertical;line-height:1.5}
.mk-words{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 8px}.mk-word{border:2px solid var(--ink,#2B1A12);background:#fff;border-radius:999px;padding:6px 14px;font:inherit;font-weight:700;color:inherit;cursor:pointer;min-height:44px}.mk-word.sel{background:var(--sunshine,#FFD483)}.mk-word[disabled]{opacity:.4;cursor:default}
.mk-picks{display:grid;gap:8px}.mk-pick{text-align:left;border:3px solid var(--ink,#2B1A12);background:#fff;border-radius:14px;padding:10px 14px;font:inherit;font-size:var(--t-body,1.05rem);color:inherit;cursor:pointer;min-height:52px}.mk-pick.sel{background:#eef7e6}.mk-pick.sel::before{content:'✓ ';font-weight:800}
.mk-fact{background:#fff6dd;border-radius:12px;padding:8px 12px;margin:0 0 8px}.mk-link{border:0;background:none;font:inherit;font-size:.9rem;text-decoration:underline;color:inherit;cursor:pointer;opacity:.8}
.mk-side{background:#fffaf0;border:3px dashed rgba(43,26,18,.35);border-radius:16px;padding:14px;position:sticky;top:10px}.mk-checks{list-style:none;margin:0 0 10px;padding:0;display:grid;gap:6px;font-weight:700}.mk-checks li.ok{color:#2f5d1f}
.mk-paper{background:#fff;border:3px solid var(--ink,#2B1A12);border-radius:10px;padding:28px clamp(18px,5vw,48px);max-width:820px;margin:0 auto;box-shadow:0 6px 0 rgba(43,26,18,.2)}.mk-paper h2{font-family:var(--disp);font-size:2rem;margin:0 0 10px;text-align:center}.mk-paper h3{font-family:var(--disp);font-size:1.35rem;margin:18px 0 4px;text-decoration:underline}.mk-paper p{font-size:1.15rem;line-height:1.6;margin:0 0 8px}
.mk-fig{margin:16px auto;text-align:center}.mk-fig img{max-width:min(100%,360px);height:auto}.mk-fig figcaption{font-weight:700}.mk-dyk{background:#fff6dd;border:3px solid var(--ink,#2B1A12);border-radius:14px;padding:12px 16px;margin:16px 0;font-size:1.15rem}.mk-by{font-size:.85rem;opacity:.7;text-align:right;margin-top:16px}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@media (max-width:760px){.mk-rep{grid-template-columns:1fr}.mk-side{position:static}}
@media print{body.mk-printing *{visibility:hidden!important}body.mk-printing .mk-paper,body.mk-printing .mk-paper *{visibility:visible!important}body.mk-printing .mk-paper{position:absolute;left:0;top:0;width:100%;max-width:none;border:0;box-shadow:none}}`;
  document.head.appendChild(css);

  /* ---------- each world's activities (facts are a draft for a teacher to check) ---------- */
  const set = (id, make) => { if(X.worlds[id]) X.worlds[id].make = make; };
  set('rome', {
    order:{ h:'Make a Roman timeline', sub:'Put six events in order', noun:'My Roman timeline', ask:'Tap the events in order. Start with the one that happened first.', hint:'Look for the earliest date that is left. BC comes before AD, and BC numbers count down.',
      items:[{ id:'a', d:'753 BC', n:'The city of Rome begins, the old stories say' }, { id:'b', d:'55 BC', n:'Julius Caesar sails to Britain for the first time' }, { id:'c', d:'AD 43', n:'The Roman army arrives in Britain to stay' }, { id:'d', d:'AD 80', n:'The Colosseum opens in Rome' }, { id:'e', d:'AD 122', n:'Building begins on Hadrian’s Wall' }, { id:'f', d:'AD 410', n:'The Roman army leaves Britain' }] },
    art:{ h:'Make a mosaic', sub:'Tile art, like a Roman floor', noun:'My mosaic', tip:'Roman mosaics often have a patterned border and a picture in the middle. Pick a colour, then tap or drag across the tiles.', W:16, H:16, sym:'none',
      pal:[['#b5533c', 'Terracotta red'], ['#d9a441', 'Ochre yellow'], ['#2b2622', 'Black'], ['#f8f4ea', 'White'], ['#5d7a94', 'Blue grey'], ['#6b7b3a', 'Olive green'], ['#c98f72', 'Pink brown'], ['#8a5a36', 'Brown']] },
    report:{ title:'All about the Romans', intro:['The Romans lived about 2,000 years ago.', 'The Romans built towns with shops, fountains and temples.', 'This report is about life in a Roman town.'], words:['Roman', 'aqueduct', 'mosaic', 'amphorae', 'fountain', 'bakery', 'temple', 'milestone'] } });
  set('egypt', {
    order:{ h:'Make an Egyptian timeline', sub:'Put six events in order', noun:'My Egyptian timeline', ask:'Tap the events in order. Start with the one that happened first.', hint:'These are all BC dates, so the biggest number happened first.',
      items:[{ id:'a', d:'About 2560 BC', n:'The Great Pyramid is finished' }, { id:'b', d:'About 2500 BC', n:'The Sphinx is carved from the rock' }, { id:'c', d:'About 1470 BC', n:'Hatshepsut rules Egypt as pharaoh' }, { id:'d', d:'About 1330 BC', n:'Tutankhamun becomes pharaoh as a boy' }, { id:'e', d:'About 1250 BC', n:'The great temples at Abu Simbel are built' }, { id:'f', d:'51 BC', n:'Cleopatra becomes the last pharaoh' }] },
    art:{ h:'Design a jewelled collar', sub:'Jewellery made from rows of beads', noun:'My jewelled collar', tip:'Egyptians wore wide collars made from rows of coloured beads. Your pattern is copied on the other side, so the collar matches.', W:21, H:12, sym:'mirror', mask:'collar',
      pal:[['#d9a441', 'Gold'], ['#1f4e9c', 'Deep blue'], ['#2aa6a1', 'Turquoise'], ['#b8402a', 'Red'], ['#3e8f4f', 'Green'], ['#f8f4ea', 'White'], ['#2b2622', 'Black']] },
    report:{ title:'All about Ancient Egypt', intro:['The Ancient Egyptians lived beside the River Nile.', 'Ancient Egypt was ruled by kings and queens called pharaohs.', 'This report is about life in Ancient Egypt.'], words:['pharaoh', 'pyramid', 'River Nile', 'papyrus', 'scribe', 'hieroglyphs', 'shaduf', 'Sphinx'] } });
  set('victorian', {
    order:{ h:'Make a Victorian timeline', sub:'Put seven events in order', noun:'My Victorian timeline', ask:'Tap the events in order. Start with the one that happened first.', hint:'Look for the smallest number that is left. That year came first.',
      items:[{ id:'a', d:'1837', n:'Victoria becomes queen' }, { id:'b', d:'1840', n:'The first postage stamp, the Penny Black' }, { id:'c', d:'1851', n:'The Great Exhibition opens in London' }, { id:'d', d:'1863', n:'The first underground railway opens' }, { id:'e', d:'1876', n:'The telephone is invented' }, { id:'f', d:'1894', n:'Tower Bridge opens' }, { id:'g', d:'1897', n:'The Diamond Jubilee: 60 years as queen' }] },
    art:{ h:'Design a Victorian tile', sub:'A pattern that matches in every corner', noun:'My Victorian tile', tip:'Victorian halls and porches had patterned floor tiles. Your pattern is copied into all four corners.', W:12, H:12, sym:'four',
      pal:[['#a8432f', 'Brick red'], ['#e3c58f', 'Buff'], ['#2b2622', 'Black'], ['#3d5a80', 'Blue'], ['#f8f4ea', 'White'], ['#6b4a2f', 'Brown'], ['#4f7f5b', 'Green']] },
    report:{ title:'All about the Victorians', intro:['The Victorians lived when Victoria was queen, from 1837 to 1901.', 'In Victorian times, steam trains changed how people travelled.', 'This report is about life in Victorian times.'], words:['Victorian', 'steam train', 'gas lamp', 'slate', 'pillar box', 'penny-farthing', 'Queen Victoria', 'invention'] } });
  set('space', {
    order:{ h:'Put the planets in order', sub:'From the Sun outwards', noun:'The planets in order', first:'Which planet is nearest the Sun?', ask:'Tap the planets in order. Start with the one nearest the Sun.', hint:'Try this: My Very Easy Method Just Speeds Up Naming. The first letters are the planets in order.',
      items:[{ id:'a', c:'#9a8f85', n:'Mercury, the smallest planet' }, { id:'b', c:'#e6c36a', n:'Venus, the hottest planet' }, { id:'c', c:'#3b82c4', n:'Earth, our home' }, { id:'d', c:'#c1532f', n:'Mars, the red planet' }, { id:'e', c:'#d9a066', n:'Jupiter, the biggest planet' }, { id:'f', c:'#e3cf8f', n:'Saturn, famous for its rings' }, { id:'g', c:'#8fd3d8', n:'Uranus, which spins on its side' }, { id:'h', c:'#3f5fbf', n:'Neptune, the furthest from the Sun' }] },
    art:{ h:'Design a mission patch', sub:'A badge for your space crew', noun:'My mission patch', tip:'Every space crew designs a badge called a mission patch. What will yours show? A rocket, a planet, some stars?', W:16, H:16, sym:'none', mask:'circle',
      pal:[['#1c2a5e', 'Navy blue'], ['#f8f4ea', 'White'], ['#c8372d', 'Red'], ['#e3b23c', 'Gold'], ['#5aa9e6', 'Sky blue'], ['#3e8f4f', 'Green'], ['#e8792b', 'Orange'], ['#2b2622', 'Black']] },
    report:{ title:'All about the Space Station', intro:['The Space Station is a home and a science lab in space.', 'Astronauts live and work on the Space Station.', 'This report is about life on the Space Station.'], words:['astronaut', 'orbit', 'gravity', 'solar panels', 'Cupola', 'spacesuit', 'experiment', 'Earth'] } });

  window.FabMake = { html, mount, home, state:M, load, checks, mask:MASK };
  try{ if(X.state.era && q1('#screen-time') && q1('#screen-time').classList.contains('active')) X.render(); }catch(e){}
})();
