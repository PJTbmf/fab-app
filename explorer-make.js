/* ============ 🎨 Make and do (Explorer Worlds) ============
   Things to make, play and write in every Explorer World, inspired by Make More Fab.
     Play with facts   🧩 Put it in order · 🃏 Find the pairs · ❓ Fact or fib?
     Design            🎨 Tile art, with Miss Bell's example and tips beside the child's work
     Plan and write    🕸️ Mind map · ✍️ My report: read a model first, then one small step at a time, at three levels
   The child's timeline, design and mind map slot straight into the report.
   Everything is saved on this device only (fab-make-<Fab code>). Nothing is sent anywhere.
   Each world's activities are plain data at the bottom of this file. Facts are a draft for a teacher to check. */
(() => {
  'use strict';
  const X = window.FabExplore; if(!X) return;
  const h = X.kit.h, q1 = s => document.querySelector(s);
  const KEY = () => 'fab-make-' + X.code();
  const load = () => { try{ return JSON.parse(localStorage.getItem(KEY()) || '{}') || {}; }catch(e){ return {}; } };
  const save = d => { try{ localStorage.setItem(KEY(), JSON.stringify(d)); }catch(e){} };
  const mine = (d, id) => { const m = d[id] = d[id] || {}; m.rep = m.rep || {}; m.map = m.map || []; m.notes = m.notes || {}; m.art = m.art || ''; m.png = m.png || ''; return m; };
  const M = { view:'home', seq:null, note:null, col:1, grid:null, pairs:null, quiz:null, rstep:0, last:'', sel:'' };
  const star = () => { try{ fabWorldAward(1); }catch(e){} X.snd('jingle'); };
  const sentences = t => (String(t).match(/[^.!?]+[.!?]+/g) || [String(t)]).map(x => x.trim());
  const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(v => v[1]);
  const MASK = {
    collar:(x, y, W) => { const d = Math.hypot(x - (W - 1) / 2, y + 1.5); return d >= 4.6 && d <= 12.4; },
    circle:(x, y, W, H) => Math.hypot(x - (W - 1) / 2, y - (H - 1) / 2) <= W / 2 - .2
  };
  /* Miss Bell's examples (what a good one looks like), drawn from little rules so they stay small */
  const MODEL = {
    mosaic:(x, y, W, H) => { const e = Math.min(x, y, W - 1 - x, H - 1 - y); if(e === 0) return 3; if(e === 1) return (x + y) % 2 ? 1 : 2; if(x === 5 && y === 7) return 4; const fx = (x - 7) / 3.4, fy = (y - 7.5) / 2.6; if(fx * fx + fy * fy < 1) return 5; if((x === 11 && y === 7) || (x === 12 && y >= 6 && y <= 8)) return 5; return 0; },
    collar:(x, y, W) => [1, 2, 1, 3, 4, 1, 2, 1][Math.max(0, Math.min(7, Math.floor(Math.hypot(x - (W - 1) / 2, y + 1.5) - 4.6)))],
    tile:(x, y, W, H) => { const a = Math.min(x, W - 1 - x), b = Math.min(y, H - 1 - y); if(a === 0 || b === 0) return 3; if(a === b) return 1; if(a + b === 6) return 4; return (a + b) % 2 ? 5 : 2; },
    patch:(x, y) => { if(Math.hypot(x - 7.5, y - 7.5) > 6.6) return 4; if(['4,4', '11,5', '5,11', '10,12', '12,8', '3,8'].includes(x + ',' + y)) return 2; if(x >= 7 && x <= 8 && y >= 4 && y <= 9) return y === 4 ? 3 : 2; if((x === 6 || x === 9) && y >= 8 && y <= 9) return 3; if(x >= 7 && x <= 8 && y === 10) return 7; return 1; }
  };
  const inMask = (a, x, y) => !a.mask || MASK[a.mask](x, y, a.W, a.H);
  const modelGrid = a => { let g = ''; for(let y = 0; y < a.H; y++) for(let x = 0; x < a.W; x++) g += inMask(a, x, y) ? MODEL[a.model](x, y, a.W, a.H) : 0; return g; };
  const note = n => n ? `<div class="fab-say"><span class="fab-char ${n.k === 'win' ? 'elder' : 'doc'}" role="img" aria-label="${n.k === 'win' ? 'Mr Elder' : 'Doctor McPhee'}"></span><div class="bubble"><b>${h(n.h)}</b>${h(n.t)}</div></div>` : '';
  const back = '<button type="button" class="btn small soft" data-mk="home">⬅ Back to Make and do</button>';
  const toReport = '<button type="button" class="btn small leaf" data-mk="open" data-id="report">✍️ Put it in my report</button>';

  /* ---------- the menu ---------- */
  function homeHTML(w, me){
    const k = w.make, card = (id, e, t, sub, done) => `<button type="button" class="mk-card ${done ? 'done' : ''}" data-mk="open" data-id="${id}"><span class="mk-e" aria-hidden="true">${e}</span><b>${h(t)}</b><small>${h(sub)}</small>${done ? '<span class="mk-tick">✓ Made</span>' : ''}</button>`;
    return `<div class="fab-say"><span class="fab-char fab" role="img" aria-label="Fab"></span><div class="bubble"><b>Make and do</b>Choose something to play, make or write. Your work is saved here, and it slots into your report.</div></div>
      <h3 class="mk-group">Play with facts</h3><div class="mk-cards">${card('order', '🧩', k.order.h, k.order.sub, me.order)}${card('pairs', '🃏', 'Find the pairs', 'Match each picture to its name', me.pairs)}${card('quiz', '❓', 'Fact or fib?', 'Six things to think about', me.quiz)}</div>
      <h3 class="mk-group">Design</h3><div class="mk-cards">${card('art', '🎨', k.art.h, k.art.sub, me.artDone)}</div>
      <h3 class="mk-group">Plan and write</h3><div class="mk-cards">${card('map', '🕸️', 'Make a mind map', 'Gather your ideas before you write', me.mapDone)}${card('report', '✍️', 'Write my report', 'Read a model, then one step at a time', me.rep.done)}</div>`;
  }

  /* ---------- 🧩 put it in order ---------- */
  function orderItem(it){ return `${it.c ? `<i class="mk-dot" style="background:${it.c}" aria-hidden="true"></i>` : ''}${it.d ? `<b>${h(it.d)}</b> ` : ''}<span>${h(it.n)}</span>`; }
  function orderHTML(w){
    const o = w.make.order, S = M.seq, placed = S.placed.map(id => o.items.find(x => x.id === id));
    return `<h3 class="mk-h">🧩 ${h(o.h)}</h3><p class="mk-ask">${h(o.ask)}</p>
      <ol class="mk-strip" aria-label="${h(o.noun)}">${placed.map(it => `<li>${orderItem(it)}</li>`).join('')}${S.left.length ? `<li class="mk-slot" aria-hidden="true">${placed.length ? 'What came next?' : h(o.first || 'What came first?')}</li>` : ''}</ol>
      <div class="mk-pool" role="group" aria-label="Cards to put in order">${S.left.map(id => `<button type="button" class="mk-chip" data-mk="put" data-id="${id}">${orderItem(o.items.find(x => x.id === id))}</button>`).join('')}</div>
      <div class="tm-notebox" role="status">${note(M.note)}</div><div class="choice-row tm-row">${S.left.length ? '' : toReport}${back}</div>`;
  }
  function startOrder(w){ const ids = w.make.order.items.map(x => x.id); let sh = ids.slice(); for(let n = 0; n < 6 && sh.join() === ids.join(); n++) sh = shuffle(ids); M.seq = { left:sh, placed:[] }; M.note = null; }

  /* ---------- 🃏 find the pairs ---------- */
  function startPairs(w){ const six = w.spots.slice(0, 6); M.pairs = { cards:shuffle(six.map(s => ({ k:s.id, t:'pic' })).concat(six.map(s => ({ k:s.id, t:'word' })))), open:[], done:[], lock:false }; M.note = null; }
  function pairsHTML(w){
    const P = M.pairs;
    return `<h3 class="mk-h">🃏 Find the pairs</h3><p class="mk-ask">Turn over two cards. Can you match each picture to its name? Take your time.</p>
      <div class="mk-pairs" role="group" aria-label="Twelve cards">${P.cards.map((c, i) => { const s = w.spots.find(x => x.id === c.k), up = P.open.includes(i) || P.done.includes(c.k);
        return `<button type="button" class="mk-pc ${up ? 'up' : ''} ${P.done.includes(c.k) ? 'got' : ''}" data-mk="flip" data-id="${i}" aria-label="${up ? h(c.t === 'pic' ? 'Picture: ' + s.n : s.n) : 'Card ' + (i + 1) + ', face down'}">${up ? (c.t === 'pic' ? `<span class="mk-pe" aria-hidden="true">${s.e}</span>` : `<span class="mk-pw">${h(s.n)}</span>`) : '<span class="mk-paw" aria-hidden="true">🐾</span>'}</button>`; }).join('')}</div>
      <div class="tm-notebox" role="status">${note(M.note)}</div><div class="choice-row tm-row">${P.done.length === 6 ? '<button type="button" class="btn small soft" data-mk="open" data-id="pairs">Play again</button>' : ''}${back}</div>`;
  }

  /* ---------- ❓ fact or fib ---------- */
  function quizHTML(w){
    const Q = M.quiz, list = w.make.quiz, it = list[Q.i];
    if(!it) return `<h3 class="mk-h">❓ Fact or fib?</h3><div class="tm-notebox" role="status">${note(M.note)}</div><div class="choice-row tm-row"><button type="button" class="btn small soft" data-mk="open" data-id="quiz">Play again</button>${back}</div>`;
    return `<h3 class="mk-h">❓ Fact or fib? <small class="mk-count">${Q.i + 1} of ${list.length}</small></h3>
      <p class="mk-state">${h(it.t)}</p>
      ${Q.ans == null ? `<div class="choice-row tm-row mk-tf"><button type="button" class="btn leaf" data-mk="tf" data-id="1">✅ Fact</button><button type="button" class="btn soft" data-mk="tf" data-id="0">🤔 Fib</button></div>`
        : `${Q.ans === it.a ? `<p class="tm-yes" role="status">${it.a ? 'Yes, that is a fact.' : 'Yes, well spotted. That was a fib.'} ${h(it.why)}</p>` : `<div class="tm-notebox" role="status">${note({ k:'fix', h:it.a ? 'This one is a fact.' : 'This one is a fib.', t:it.why })}</div>`}
          <div class="choice-row tm-row"><button type="button" class="btn small leaf" data-mk="qnext">${Q.i + 1 < list.length ? 'Next one ➡' : 'Finish ⭐'}</button></div>`}
      <div class="choice-row tm-row">${back}</div>`;
  }

  /* ---------- 🎨 tile art ---------- */
  function artHTML(w, me){
    const a = w.make.art;
    return `<h3 class="mk-h">🎨 ${h(a.h)}</h3><p class="mk-ask">${h(a.tip)}</p>
      <div class="mk-artwrap"><canvas id="mkArt" class="mk-art" width="${a.W * 30}" height="${a.H * 30}" role="img" aria-label="${h(a.noun)}: a grid of ${a.W} by ${a.H} tiles to colour"></canvas>
        <div class="mk-pal" role="group" aria-label="Colours">${a.pal.map((c, i) => `<button type="button" class="mk-sw ${M.col === i + 1 ? 'sel' : ''}" data-mk="col" data-id="${i + 1}" style="background:${c[0]}" aria-label="${h(c[1])}" aria-pressed="${M.col === i + 1}"></button>`).join('')}<button type="button" class="mk-sw mk-rub ${M.col === 0 ? 'sel' : ''}" data-mk="col" data-id="0" aria-label="Rubber" aria-pressed="${M.col === 0}">⌫</button></div>
        <aside class="mk-model" aria-label="Miss Bell’s example and tips"><div class="mk-modelhead"><span class="fab-char bell" role="img" aria-label="Miss Bell"></span><b>Here is one I made</b></div>
          <canvas id="mkModel" class="mk-modelcv" width="${a.W * 16}" height="${a.H * 16}" role="img" aria-label="Miss Bell’s example: ${h(a.modelAlt)}"></canvas>
          <ul class="mk-tips">${a.tips.map(t => `<li>${h(t)}</li>`).join('')}</ul></aside></div>
      <div class="tm-notebox" role="status">${note(M.note)}</div>
      <div class="choice-row tm-row"><button type="button" class="btn small leaf" data-mk="artdone">⭐ I’ve finished</button>${me.artDone ? toReport : ''}<button type="button" class="btn small soft" data-mk="artclear">Start again</button>${back}</div>`;
  }
  function drawGrid(cv, a, grid){
    const g = cv.getContext('2d'), s = cv.width / a.W, p = s / 20, r = s / 6; g.clearRect(0, 0, cv.width, cv.height);
    for(let y = 0; y < a.H; y++) for(let x = 0; x < a.W; x++){
      if(!inMask(a, x, y)) continue; const v = +grid[y * a.W + x];
      g.fillStyle = v ? a.pal[v - 1][0] : '#efe6d2'; g.beginPath();
      if(g.roundRect) g.roundRect(x * s + p, y * s + p, s - 2 * p, s - 2 * p, r); else g.rect(x * s + p, y * s + p, s - 2 * p, s - 2 * p);
      g.fill(); if(!v){ g.strokeStyle = 'rgba(43,26,18,.18)'; g.lineWidth = 1; g.stroke(); }
    }
  }
  function drawArt(w){ const a = w.make.art, cv = q1('#mkArt'), m = q1('#mkModel'); if(cv) drawGrid(cv, a, M.grid); if(m) drawGrid(m, a, modelGrid(a)); }
  function paint(w, x, y){
    const a = w.make.art; if(x < 0 || y < 0 || x >= a.W || y >= a.H || !inMask(a, x, y)) return false;
    const pts = [[x, y]]; if(a.sym === 'mirror' || a.sym === 'four') pts.push([a.W - 1 - x, y]); if(a.sym === 'four') pts.push([x, a.H - 1 - y], [a.W - 1 - x, a.H - 1 - y]);
    const g = M.grid.split(''); let ch = false; pts.forEach(p => { const i = p[1] * a.W + p[0]; if(g[i] !== String(M.col)){ g[i] = String(M.col); ch = true; } });
    if(ch){ M.grid = g.join(''); drawArt(w); } return ch;
  }
  function startArt(w, me){ const a = w.make.art, n = a.W * a.H; M.grid = me.art && me.art.length === n ? me.art : '0'.repeat(n); M.col = 1; M.note = null; }

  /* ---------- 🕸️ mind map ---------- */
  function endDot(t){ t = String(t || '').trim(); return !t || /[.!?…]$/.test(t) ? t : t + '.'; }
  /* a report part that starts from the mind map: facts ticked on the map are ticked here, and the child's own thoughts come too */
  function secFor(w, me, sid, keep){ const sp = w.spots.find(x => x.id === sid), ns = (me.notes && me.notes[sid]) || [], sen = sp ? sentences(sp.t) : [];
    return { id:sid, text:keep != null ? keep : ns.filter(n => n.own).map(n => endDot(n.t)).join(' '), pick:ns.filter(n => !n.own).map(n => sen.indexOf(n.t)).filter(k => k >= 0), own:ns.filter(n => n.own).map(n => n.t) }; }
  function wrap2(t, max){ const out = ['']; String(t).split(/\s+/).forEach(wd => { const L = out[out.length - 1]; if(!L) out[out.length - 1] = wd; else if((L + ' ' + wd).length <= max) out[out.length - 1] = L + ' ' + wd; else out.push(wd); });
    if(out.length > 2){ const rest = out.slice(1).join(' '); out.length = 2; out[1] = rest.length > max ? rest.slice(0, max - 1).replace(/\s+\S*$/, '') + '…' : rest; } return out; }
  /* The mind map: the topic in the middle, ideas to the left and right, and up to two facts or thoughts hanging off each idea.
     o.edit makes each idea a button (tap to add to it); o.sel is the idea being added to. */
  function mapSVG(w, ids, notes, o){
    notes = notes || {}; o = o || {}; const any = !!o.edit || ids.some(id => (notes[id] || []).length), INK = '#2B1A12';
    const R = [], L = []; ids.forEach((id, i) => (i % 2 ? L : R).push(id));
    const rows = Math.max(R.length, L.length, 1), W = any ? 1620 : 1040, H = Math.max(any ? 250 : 200, rows * 190 + 40), cx = W / 2, cy = H / 2;
    const place = (arr, side) => arr.map((id, i) => ({ id, s:w.spots.find(x => x.id === id), side, x:cx + side * 335, y:cy + (i - (arr.length - 1) / 2) * 190, ns:(notes[id] || []).slice(0, 2) }));
    const nodes = place(R, 1).concat(place(L, -1)).filter(n => n.s), at = (n, j) => ({ x:n.x + n.side * 318, y:n.y + (j - (n.ns.length - 1) / 2) * 80 });
    const label = nodes.map(n => n.s.n + (n.ns.length ? ' (' + n.ns.map(x => x.t).join(' ') + ')' : '')).join(', ') || 'no ideas yet';
    return `<svg class="mk-map${any ? ' big' : ''}" viewBox="0 0 ${W} ${H}" role="${o.edit ? 'group' : 'img'}" aria-label="Mind map about ${h(w.n)}: ${h(label)}">
      ${nodes.map(n => `<line x1="${cx}" y1="${cy}" x2="${n.x}" y2="${n.y}" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>` + n.ns.map((x, j) => { const p = at(n, j); return `<line x1="${n.x + n.side * 140}" y1="${n.y}" x2="${p.x - n.side * 152}" y2="${p.y}" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`; }).join('')).join('')}
      <ellipse cx="${cx}" cy="${cy}" rx="160" ry="60" fill="#FFD483" stroke="${INK}" stroke-width="4"/><text x="${cx}" y="${cy + 10}" text-anchor="middle" font-size="29" font-weight="800" fill="${INK}">${h(w.n)}</text>
      ${nodes.map(n => `<g${o.edit ? ` class="mk-node" data-mk="mapsel" data-id="${n.id}" role="button" tabindex="0" aria-pressed="${o.sel === n.id}" aria-label="${h(n.s.n)}: add a fact or a thought"` : ''}><rect x="${n.x - 140}" y="${n.y - 37}" width="280" height="74" rx="22" fill="${o.sel === n.id ? '#FFD483' : '#fff'}" stroke="${INK}" stroke-width="${o.sel === n.id ? 6 : 4}"/><text x="${n.x}" y="${n.y + 9}" text-anchor="middle" font-size="${n.s.n.length > 19 ? 21 : 24}" font-weight="700" fill="${INK}">${n.s.e} ${h(n.s.n)}</text>${o.edit && n.ns.length < 2 ? `<circle cx="${n.x + n.side * 140}" cy="${n.y - 37}" r="18" fill="#F0B913" stroke="${INK}" stroke-width="3"/><text x="${n.x + n.side * 140}" y="${n.y - 28}" text-anchor="middle" font-size="28" font-weight="800" fill="${INK}">+</text>` : ''}</g>`
        + n.ns.map((x, j) => { const p = at(n, j), ls = wrap2(x.t, 25); return `<g><rect x="${p.x - 152}" y="${p.y - 35}" width="304" height="70" rx="18" fill="${x.own ? '#CFE7F2' : '#FFF6E6'}" stroke="${INK}" stroke-width="3"/>${ls.map((t, k) => `<text x="${p.x}" y="${p.y + (ls.length === 1 ? 7 : k ? 23 : -4)}" text-anchor="middle" font-size="21" font-weight="600" fill="${INK}">${h(t)}</text>`).join('')}</g>`; }).join('')).join('')}</svg>`;
  }
  function mapHTML(w, me){
    const sel = me.map.includes(M.sel) ? M.sel : '', sp = sel && w.spots.find(x => x.id === sel), ns = sel ? (me.notes[sel] || []) : [], facts = sp ? sentences(sp.t) : [];
    const panel = sp ? `<section class="mk-sec mk-noteadd" aria-label="Add to ${h(sp.n)}"><h4><span aria-hidden="true">${sp.e}</span> Add to “${h(sp.n)}”</h4>
        ${ns.length ? `<ul class="mk-notes">${ns.map((n, i) => `<li><span>${h(n.t)}</span> <button type="button" class="mk-link" data-mk="notedel" data-id="${i}" aria-label="Take away: ${h(n.t)}">take away</button></li>`).join('')}</ul>` : ''}
        ${ns.length >= 2 ? '<p class="hint">Two is plenty for one idea. Tap another idea on your map.</p>' : `<p class="mk-ask">Tap a fact you remember, or write a thought of your own.</p>
        <div class="mk-picks">${facts.map((t, i) => ns.some(n => n.t === t) ? '' : `<button type="button" class="mk-pick" data-mk="notefact" data-id="${i}">${h(t)}</button>`).join('')}</div>
        <div class="mk-noterow"><label class="sr-only" for="mkNote">My own fact or thought about ${h(sp.n)}</label><input id="mkNote" class="mk-in" maxlength="90" placeholder="My own fact or thought" autocomplete="off"><button type="button" class="btn small leaf" data-mk="noteown">➕ Add mine</button></div>
        ${chips(['I know that', 'I wonder why', 'It was used for', 'I like this because'], 'mkNote')}<p class="hint">Write about the topic. Please do not type names.</p>`}</section>`
      : (me.map.length ? '<p class="mk-ask mk-nudge">👆 Tap an idea on your map to add a fact or a thought to it.</p>' : '');
    return `<h3 class="mk-h">🕸️ Make a mind map</h3><p class="mk-ask">A mind map gathers your ideas before you write. First tap up to six things you know about. Then tap an idea on your map and add a fact or a thought to it.</p>
      <div class="mk-words" role="group" aria-label="Things to add to the mind map">${w.spots.map(s => `<button type="button" class="mk-word ${me.map.includes(s.id) ? 'sel' : ''}" data-mk="mapadd" data-id="${s.id}" aria-pressed="${me.map.includes(s.id)}"><span aria-hidden="true">${s.e}</span> ${h(s.n)}</button>`).join('')}</div>
      ${mapSVG(w, me.map, me.notes, { edit:true, sel })}
      ${panel}
      <div class="tm-notebox" role="status">${note(M.note)}</div>
      <div class="choice-row tm-row"><button type="button" class="btn small leaf" data-mk="mapdone">⭐ I’ve finished</button>${me.mapDone ? toReport : ''}${back}</div>`;
  }

  /* ---------- ✍️ my report ---------- */
  const LV = [['1', '🌱', 'Build it with taps', 'Tap the sentences you want'], ['2', '🌿', 'Sentence starters', 'Starters and a word bank to help'], ['3', '🌳', 'On my own', 'Just the headings']];
  const STEPS = ['Read a model', 'Title and introduction', 'Part 1', 'Part 2', 'Did you know?', 'Finish'];
  function repState(w, me){ const r = me.rep; r.lvl = r.lvl || ''; r.title = r.title == null ? w.make.report.title : r.title; r.intro = r.intro || ''; r.dyk = r.dyk || ''; r.s = r.s || [{ id:'', text:'', pick:[] }, { id:'', text:'', pick:[] }]; r.ipick = r.ipick == null ? -1 : r.ipick; r.dpick = r.dpick || ''; return r; }
  function repText(w, r){
    const spot = id => w.spots.find(x => x.id === id), one = r.lvl === '1';
    const secs = r.s.map(x => { const sp = spot(x.id); if(!sp) return null; const sen = sentences(sp.t); return { h:sp.n, t:one ? x.pick.slice().sort().map(i => sen[i]).filter(Boolean).concat((x.own || []).map(endDot)).join(' ') : (x.text || '').trim() }; }).filter(Boolean);
    const dsp = spot(r.dpick);
    return { title:(r.title || '').trim(), intro:one ? (w.make.report.intro[r.ipick] || '') : (r.intro || '').trim(), secs, dyk:one ? (dsp ? dsp.k : '') : (r.dyk || '').trim().replace(/^did you know(\s+that)?[,:]?\s*/i, '').replace(/^./, c => c.toUpperCase()) };
  }
  function checks(w, me){ const t = repText(w, repState(w, me)); return [['A title', !!t.title, 1], ['An introduction', !!t.intro, 1], ['Two subheadings with facts', t.secs.filter(x => x.t).length >= 2, t.secs[0] && t.secs[0].t ? 3 : 2], ['A “Did you know?” fact', !!t.dyk, 4], ['A picture, a timeline or a mind map', !!(me.png || me.order || me.mapDone), 5]]; }
  function checksHTML(w, me){ return checks(w, me).map(c => `<li class="${c[1] ? 'ok' : ''}"><button type="button" class="mk-jump" data-mk="rstep" data-id="${c[2]}">${c[1] ? '✅' : '⬜'} ${c[0]}</button></li>`).join(''); }
  function chips(list, target){ return `<div class="mk-words" role="group" aria-label="Words to help">${list.map(x => `<button type="button" class="mk-word" data-mk="ins" data-for="${target}" data-t="${h(x)}">${h(x)}</button>`).join('')}</div>`; }
  function modelHTML(w){ const m = w.make.report.model;
    return `<article class="mk-paper mk-modelrep" aria-label="A model report"><span class="mk-tag">Title</span><h2>${h(m.title)}</h2><span class="mk-tag">Introduction</span><p class="mk-intro">${h(m.intro)}</p>
      ${m.secs.map(x => `<span class="mk-tag">Subheading, then facts</span><h3>${h(x[0])}</h3><p>${h(x[1])}</p>`).join('')}<span class="mk-tag">Did you know?</span><aside class="mk-dyk"><b>Did you know?</b> ${h(m.dyk)}</aside></article>`; }
  const modelText = w => { const m = w.make.report.model; return [m.title + '.', m.intro].concat(m.secs.map(x => x[0] + '. ' + x[1]), ['Did you know? ' + m.dyk]).join(' '); };
  function reportHTML(w, me){
    const k = w.make.report, r = repState(w, me);
    if(!r.lvl) return `<h3 class="mk-h">✍️ Write my report</h3><p class="mk-ask">A report tells people facts about one thing. Choose how you would like to write today.</p>
      <div class="mk-cards">${LV.map(l => `<button type="button" class="mk-card" data-mk="lvl" data-id="${l[0]}"><span class="mk-e" aria-hidden="true">${l[1]}</span><b>${l[2]}</b><small>${l[3]}</small></button>`).join('')}</div><div class="choice-row tm-row">${back}</div>`;
    const one = r.lvl === '1', two = r.lvl === '2', st = Math.max(0, Math.min(5, M.rstep));
    const pickStop = n => `<p class="mk-ask">What is this part about? Choose one.</p><div class="mk-words" role="group" aria-label="Choose what part ${n + 1} is about">${w.spots.map(s => `<button type="button" class="mk-word ${r.s[n].id === s.id ? 'sel' : ''}" data-mk="stop" data-n="${n}" data-id="${s.id}" ${r.s[1 - n].id === s.id ? 'disabled' : ''}><span aria-hidden="true">${s.e}</span> ${h(s.n)}</button>`).join('')}</div>`;
    const sec = n => { const sp = w.spots.find(x => x.id === r.s[n].id); if(!sp) return `<section class="mk-sec"><h4>Part ${n + 1}: choose a subheading</h4>${pickStop(n)}</section>`;
      const sen = sentences(sp.t), mm = (me.notes[sp.id] || []), mine2 = mm.filter(x => x.own).map(x => x.t);
      const fromMap = one ? (mine2.length ? `<p class="mk-ask">From your mind map:</p><div class="mk-picks">${mine2.map(t => `<button type="button" class="mk-pick ${(r.s[n].own || []).includes(t) ? 'sel' : ''}" data-mk="ownpick" data-n="${n}" data-t="${h(t)}" aria-pressed="${(r.s[n].own || []).includes(t)}">✏️ ${h(t)}</button>`).join('')}</div>` : '') : (mm.length ? `<p class="hint">From your mind map: tap one to add it.</p>${chips(mm.map(x => endDot(x.t)), 'mkS' + n)}` : '');
      return `<section class="mk-sec"><h4>${h(sp.n)} <button type="button" class="mk-link" data-mk="stop" data-n="${n}" data-id="">change</button></h4>
        ${one ? `<p class="mk-ask">Tap the facts you want in this part.</p><div class="mk-picks">${sen.map((t, i) => `<button type="button" class="mk-pick ${r.s[n].pick.includes(i) ? 'sel' : ''}" data-mk="pick" data-n="${n}" data-id="${i}" aria-pressed="${r.s[n].pick.includes(i)}">${h(t)}</button>`).join('')}</div>${fromMap}`
          : `${two ? `<p class="mk-fact"><b>Fact card:</b> ${h(sp.t)}</p>${chips(['One interesting fact is that', 'It was used for', 'People', 'I was surprised that'], 'mkS' + n)}` : ''}<label class="sr-only" for="mkS${n}">Write about ${h(sp.n)}</label><textarea id="mkS${n}" class="mk-ta" data-mkf="s${n}" rows="4" maxlength="600" placeholder="Write your facts in your own words.">${h(r.s[n].text)}</textarea>${fromMap}${two ? `<p class="hint">Word bank: tap a word to add it.</p>${chips(k.words, 'mkS' + n)}` : ''}`}</section>`; };
    const chosen = r.s.map(x => w.spots.find(s => s.id === x.id)).filter(Boolean);
    const body = [
      `<div class="fab-say"><span class="fab-char bell" role="img" aria-label="Miss Bell"></span><div class="bubble"><b>Read mine first</b>Look at how my report is built: a title, an introduction, subheadings with facts, and a “Did you know?”.</div></div>
        ${X.say.ok ? `<div class="choice-row tm-row"><button type="button" class="btn small soft" data-mk="saymodel" data-saykey="mk:model" data-idle="🔊 Read it to me">${X.say.label('mk:model', '🔊 Read it to me')}</button></div>` : ''}${modelHTML(w)}`,
      `<section class="mk-sec"><h4><label for="mkTitle">Title</label></h4><input id="mkTitle" class="mk-in" data-mkf="title" maxlength="60" value="${h(r.title)}"></section>
        <section class="mk-sec"><h4>Introduction</h4>${one ? `<p class="mk-ask">Tap one sentence to start your report.</p><div class="mk-picks">${k.intro.map((t, i) => `<button type="button" class="mk-pick ${r.ipick === i ? 'sel' : ''}" data-mk="ipick" data-id="${i}" aria-pressed="${r.ipick === i}">${h(t)}</button>`).join('')}</div>`
          : `${two ? chips(['This report is about', 'Long ago,', 'Did you know that'], 'mkIntro') : ''}<label class="sr-only" for="mkIntro">Introduction</label><textarea id="mkIntro" class="mk-ta" data-mkf="intro" rows="3" maxlength="400" placeholder="Tell your reader what this report is about.">${h(r.intro)}</textarea>`}</section>`,
      sec(0), sec(1),
      `<section class="mk-sec"><h4>Did you know?</h4>${one ? (chosen.length ? `<p class="mk-ask">Tap one amazing fact.</p><div class="mk-picks">${chosen.map(sp => `<button type="button" class="mk-pick ${r.dpick === sp.id ? 'sel' : ''}" data-mk="dpick" data-id="${sp.id}" aria-pressed="${r.dpick === sp.id}">${h(sp.k)}</button>`).join('')}</div>` : '<p class="mk-ask">Choose your two subheadings first.</p>')
          : `${two ? chips(['Did you know that', 'Amazingly,'], 'mkDyk') : ''}<label class="sr-only" for="mkDyk">Did you know?</label><textarea id="mkDyk" class="mk-ta" data-mkf="dyk" rows="3" maxlength="300" placeholder="Share one amazing fact.">${h(r.dyk)}</textarea>`}</section>`,
      `<section class="mk-sec"><h4>Your makes go in too</h4><ul class="mk-in-list"><li>${me.png ? '✅ ' + h(w.make.art.noun) + ' is in your report.' : '🎨 Finish your design and it will appear in your report.'}</li><li>${me.order ? '✅ ' + h(w.make.order.noun) + ' is in your report.' : '🧩 Finish the order cards and they will appear too.'}</li><li>${me.mapDone ? '✅ Your mind map is in your report.' : '🕸️ Finish a mind map and it will appear too.'}</li></ul>
        <button type="button" class="btn leaf" data-mk="open" data-id="paper">👀 See my report</button></section>`
    ][st];
    return `<h3 class="mk-h">✍️ Write my report <button type="button" class="mk-link" data-mk="lvl" data-id="">change how I write</button></h3>
      <ol class="mk-steps" aria-label="Steps">${STEPS.map((t, i) => `<li><button type="button" class="${i === st ? 'on' : ''}" data-mk="rstep" data-id="${i}" ${i === st ? 'aria-current="step"' : ''}>${i + 1}<span class="sr-only"> ${t}</span></button></li>`).join('')}</ol>
      <p class="mk-stepname">Step ${st + 1} of 6: <b>${STEPS[st]}</b></p>
      <div class="mk-rep"><div class="mk-form">${body}
        <div class="choice-row tm-row mk-nav">${st > 0 ? `<button type="button" class="btn small soft" data-mk="rstep" data-id="${st - 1}">⬅ Back</button>` : ''}${st < 5 ? `<button type="button" class="btn small leaf" data-mk="rstep" data-id="${st + 1}">${st === 0 ? 'I have read it. Start writing ➡' : 'Next ➡'}</button>` : ''}</div></div>
      <aside class="mk-side"><h4>My report has…</h4><ul class="mk-checks" id="mkChecks">${checksHTML(w, me)}</ul>${st > 0 ? '<button type="button" class="btn small soft" data-mk="rstep" data-id="0">📖 Read the model again</button>' : ''}</aside></div>
      <div class="choice-row tm-row">${back}</div>`;
  }
  function paperHTML(w, me){
    const t = repText(w, repState(w, me)), o = w.make.order, ok = checks(w, me).slice(0, 4).every(c => c[1]), code = X.code() !== 'local' ? X.code() : '';
    /* The finished report is a "proud page" (proud.js, the template for finished work across the Learning Hub): each part on its own card,
       and the child's design beside the words it belongs to (or on a card of its own), so no picture is bigger than its section. */
    const cards = t.secs.filter(x => x.t).map(x => ({ h:x.h, text:x.t }));
    if(me.png){ const noun = String(w.make.art.noun || ''), word = noun.replace(/^My /i, '').toLowerCase(), own = word && cards.find(c => String(c.h).toLowerCase().includes(word));
      if(own) own.pic = { src:me.png, alt:noun, cap:noun }; else cards.push({ h:noun, pic:{ src:me.png, alt:noun } }); }
    if(me.mapDone && me.map.length) cards.push({ h:'My mind map', html:mapSVG(w, me.map, me.notes), wide:me.map.some(id => (me.notes[id] || []).length) });
    if(me.order) cards.push({ h:o.noun.replace(/^My /, ''), html:`<ol class="mk-strip paper">${o.items.map(it => `<li>${orderItem(it)}</li>`).join('')}</ol>`, wide:true });
    /* keep the picture in proportion: if its own card would have to stretch across the page, it sits beside the last part's words instead */
    { const pc = cards.find(c => c.pic && !c.text && !c.html), host = pc && cards.filter(c => !c.wide).length % 2 ? [...cards].reverse().find(c => c.text && !c.pic) : null;
      if(host){ host.pic = { src:pc.pic.src, alt:pc.pic.alt, cap:pc.h }; cards.splice(cards.indexOf(pc), 1); } }
    const paper = window.FabProud.page({ theme:w.id, cls:'mk-paper mk-final', kicker:code ? 'A report by Explorer ' + code : 'My report', title:t.title || w.make.report.title, lead:t.intro, cards,
      fact:t.dyk ? { label:'Did you know?', text:t.dyk } : null, when:me.rep.when, seal:'Finished!' });
    return `<div class="tm-notebox" role="status">${note(M.note)}</div>
      ${paper}
      <div class="choice-row tm-row"><button type="button" class="btn small leaf" data-mk="print">🖨️ Print my report</button><button type="button" class="btn small soft" data-mk="open" data-id="report">✏️ Keep writing</button>${back}</div>
      ${ok ? '' : '<p class="hint">Your report is saved. Add the parts with an empty box on your list when you are ready.</p>'}`;
  }

  /* ---------- wiring ---------- */
  function html(w){ const d = load(), me = mine(d, w.id), v = M.view;
    return `<div class="mk">${v === 'order' && M.seq ? orderHTML(w) : v === 'pairs' && M.pairs ? pairsHTML(w) : v === 'quiz' && M.quiz ? quizHTML(w) : v === 'art' && M.grid ? artHTML(w, me) : v === 'map' ? mapHTML(w, me) : v === 'report' ? reportHTML(w, me) : v === 'paper' ? paperHTML(w, me) : homeHTML(w, me)}</div>`; }
  function mount(w){
    if(M.view !== 'art') return; drawArt(w); const cv = q1('#mkArt'); if(!cv) return; let down = false, ch = false;
    const at = e => { const r = cv.getBoundingClientRect(); return [Math.floor((e.clientX - r.left) / r.width * w.make.art.W), Math.floor((e.clientY - r.top) / r.height * w.make.art.H)]; };
    cv.addEventListener('pointerdown', e => { down = true; try{ cv.setPointerCapture(e.pointerId); }catch(err){} const c = at(e); ch = paint(w, c[0], c[1]) || ch; e.preventDefault(); });
    cv.addEventListener('pointermove', e => { if(!down) return; const c = at(e); ch = paint(w, c[0], c[1]) || ch; });
    const up = () => { if(!down) return; down = false; if(ch){ ch = false; const d = load(); mine(d, w.id).art = M.grid; save(d); } };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  }
  function home(){ M.view = 'home'; M.note = null; try{ X.say.stop(); }catch(e){} }
  function click(e){
    const b = e.target.closest('[data-mk]'); if(!b || !b.closest('#screen-time')) return;
    const w = X.world(); if(!w || !w.make) return; const a = b.dataset.mk, id = b.dataset.id, d = load(), me = mine(d, w.id), r = repState(w, me);
    if(a === 'home'){ home(); X.snd('tick'); return X.render(); }
    if(a === 'open'){ M.note = null; try{ X.say.stop(); }catch(err){}
      if(id === 'order') startOrder(w); if(id === 'art') startArt(w, me); if(id === 'pairs') startPairs(w); if(id === 'quiz') M.quiz = { i:0, ans:null };
      if(id === 'report' && M.view !== 'paper') M.rstep = r.read ? Math.max(1, M.rstep) : 0;
      if(id === 'paper' && !r.done && checks(w, me).slice(0, 4).every(c => c[1])){ r.done = 1; r.when = window.FabProud.stamp(); save(d); star(); M.note = { k:'win', h:'Your report is finished!', t:'What a lot you know. That earned a star for Fab Fox World.' }; }
      if(id === 'paper' && r.done && !r.when){ r.when = window.FabProud.stamp(); save(d); }
      M.view = id; X.snd('tick'); return X.render(); }
    if(a === 'put'){ const o = w.make.order, S = M.seq, want = o.items[S.placed.length];
      if(want && want.id === id){ S.placed.push(id); S.left = S.left.filter(x => x !== id); M.note = null; X.snd('ding');
        if(!S.left.length){ const first = !me.order; me.order = 1; save(d); if(first) star(); M.note = { k:'win', h:'All in order!', t:first ? 'That earned a star for Fab Fox World. It is ready to go in your report.' : 'It is ready to go in your report.' }; } }
      else { M.note = { k:'fix', h:'Not that one yet.', t:o.hint }; X.snd('gentle'); }
      return X.render(); }
    if(a === 'flip'){ const P = M.pairs, i = +id, c = P.cards[i]; if(P.lock || P.open.includes(i) || P.done.includes(c.k)) return; P.open.push(i); X.snd('tick');
      if(P.open.length === 2){ const o = P.cards[P.open[0]];
        if(o.k === c.k){ P.done.push(c.k); P.open = []; X.snd('ding'); if(P.done.length === 6){ const first = !me.pairs; me.pairs = 1; save(d); if(first) star(); M.note = { k:'win', h:'You found every pair!', t:first ? 'That earned a star for Fab Fox World.' : 'Brilliant remembering.' }; } }
        else { P.lock = true; setTimeout(() => { P.open = []; P.lock = false; if(M.view === 'pairs') X.render(); }, 1300); } }
      return X.render(); }
    if(a === 'tf'){ const Q = M.quiz, it = w.make.quiz[Q.i]; Q.ans = id === '1'; X.snd(Q.ans === it.a ? 'ding' : 'gentle'); return X.render(); }
    if(a === 'qnext'){ const Q = M.quiz; Q.i++; Q.ans = null; if(Q.i >= w.make.quiz.length){ const first = !me.quiz; me.quiz = 1; save(d); if(first) star(); M.note = { k:'win', h:'You sorted the facts from the fibs!', t:first ? 'That earned a star for Fab Fox World.' : 'Great thinking.' }; } else X.snd('tick'); return X.render(); }
    if(a === 'col'){ M.col = +id; document.querySelectorAll('.mk-sw').forEach(x => { const on = x.dataset.id === id; x.classList.toggle('sel', on); x.setAttribute('aria-pressed', String(on)); }); return; }
    if(a === 'artclear'){ M.grid = '0'.repeat(w.make.art.W * w.make.art.H); me.art = M.grid; save(d); M.note = null; X.snd('tick'); return X.render(); }
    if(a === 'artdone'){ if(!/[1-9]/.test(M.grid)){ M.note = { k:'fix', h:'Add some colour first.', t:'Pick a colour, then tap a tile.' }; return X.render(); }
      const cv = q1('#mkArt'), first = !me.artDone; me.art = M.grid; try{ me.png = cv.toDataURL('image/png'); }catch(err){} me.artDone = 1; save(d); if(first) star(); else X.snd('ding');
      M.note = { k:'win', h:'What a design!', t:first ? 'That earned a star for Fab Fox World. It is saved for your report.' : 'It is saved for your report.' }; return X.render(); }
    if(a === 'mapadd'){ if(me.map.includes(id)){ me.map = me.map.filter(x => x !== id); if(M.sel === id) M.sel = ''; } else if(me.map.length < 6){ me.map.push(id); M.sel = id; } else { M.note = { k:'fix', h:'Six is plenty.', t:'Tap one to take it away, then choose another.' }; return X.render(); } M.note = null; save(d); X.snd('tick'); return X.render(); }
    if(a === 'mapsel'){ M.sel = M.sel === id ? '' : id; M.note = null; X.snd('tick'); return X.render(); }
    if(a === 'notefact' || a === 'noteown'){ const sid = M.sel; if(!me.map.includes(sid)) return; const ns = me.notes[sid] = me.notes[sid] || []; if(ns.length >= 2) return X.render();
      let t = ''; if(a === 'notefact'){ const sp = w.spots.find(x => x.id === sid); t = (sp && sentences(sp.t)[+id]) || ''; } else { const el = q1('#mkNote'); t = el ? el.value.replace(/\s+/g, ' ').trim().slice(0, 90) : ''; }
      if(!t){ M.note = { k:'fix', h:'Nothing to add yet.', t:'Tap a fact, or type a thought first.' }; return X.render(); }
      if(!ns.some(n => n.t === t)) ns.push({ t, own:a === 'noteown' }); M.note = null; save(d); X.snd('tick'); return X.render(); }
    if(a === 'notedel'){ const ns = me.notes[M.sel] || []; ns.splice(+id, 1); save(d); X.snd('tick'); return X.render(); }
    if(a === 'ownpick'){ const n = +b.dataset.n, t = b.dataset.t, ow = r.s[n].own || []; r.s[n].own = ow.includes(t) ? ow.filter(x => x !== t) : ow.concat(t); save(d); X.snd('tick'); return X.render(); }
    if(a === 'mapdone'){ if(me.map.length < 3){ M.note = { k:'fix', h:'Add a few more ideas.', t:'Try to choose at least three things.' }; return X.render(); }
      const first = !me.mapDone; me.mapDone = 1; me.map.slice(0, 2).forEach((sid, n) => { if(!r.s[n].id && r.s[1 - n].id !== sid) r.s[n] = secFor(w, me, sid); }); save(d); if(first) star(); else X.snd('ding');
      M.note = { k:'win', h:'Your ideas are ready!', t:'Your first two ideas are now the subheadings in your report, with the facts and thoughts you added.' }; return X.render(); }
    if(a === 'lvl'){ r.lvl = id; save(d); M.rstep = r.read ? 1 : 0; X.snd('tick'); return X.render(); }
    if(a === 'rstep'){ try{ X.say.stop(); }catch(err){} M.rstep = +id; if(M.rstep > 0 && !r.read){ r.read = 1; save(d); } X.snd('tick'); X.render(); const top = q1('.mk-steps'); if(top) try{ top.scrollIntoView({ block:'nearest' }); }catch(err){} return; }
    if(a === 'saymodel'){ return X.say.toggle('mk:model', modelText(w), 'f'); }
    if(a === 'stop'){ const n = +b.dataset.n; r.s[n] = id ? secFor(w, me, id, r.s[n].id === id ? r.s[n].text : null) : { id:'', text:'', pick:[], own:[] }; if(r.dpick && !r.s.some(x => x.id === r.dpick)) r.dpick = ''; save(d); X.snd('tick'); return X.render(); }
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
  document.addEventListener('keydown', e => { if(e.key === 'Enter' && e.target && e.target.id === 'mkNote'){ e.preventDefault(); const b = q1('[data-mk="noteown"]'); if(b) b.click(); } });
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
.mk-in,.mk-ta{width:100%;box-sizing:border-box;font:inherit;font-size:1.3rem;padding:10px 14px;border:3px solid var(--ink,#2B1A12);border-radius:14px;background:#fff;color:inherit}.mk-in{min-height:52px}.mk-ta{resize:vertical;line-height:1.5}
.mk-words{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 8px}.mk-word{border:2px solid var(--ink,#2B1A12);background:#fff;border-radius:999px;padding:6px 14px;font:inherit;font-size:1.15rem;font-weight:700;color:inherit;cursor:pointer;min-height:48px}.mk-word.sel{background:var(--sunshine,#FFD483)}.mk-word[disabled]{opacity:.4;cursor:default}
.mk-picks{display:grid;gap:8px}.mk-pick{text-align:left;border:3px solid var(--ink,#2B1A12);background:#fff;border-radius:14px;padding:10px 14px;font:inherit;font-size:var(--t-body,1.05rem);color:inherit;cursor:pointer;min-height:52px}.mk-pick.sel{background:#eef7e6}.mk-pick.sel::before{content:'✓ ';font-weight:800}
.mk-fact{background:#fff6dd;border-radius:12px;padding:8px 12px;margin:0 0 8px}.mk-link{border:0;background:none;font:inherit;font-size:.9rem;text-decoration:underline;color:inherit;cursor:pointer;opacity:.8}
.mk-side{font-size:1.1rem;background:#fffaf0;border:3px dashed rgba(43,26,18,.35);border-radius:16px;padding:14px;position:sticky;top:10px}.mk-checks{list-style:none;margin:0 0 10px;padding:0;display:grid;gap:6px;font-weight:700}.mk-checks li.ok{color:#2f5d1f}
.mk-paper{background:#fff;border:3px solid var(--ink,#2B1A12);border-radius:10px;padding:28px clamp(18px,5vw,48px);max-width:820px;margin:0 auto;box-shadow:0 6px 0 rgba(43,26,18,.2)}.mk-paper h2{font-family:var(--disp);font-size:2rem;margin:0 0 10px;text-align:center}.mk-paper h3{font-family:var(--disp);font-size:1.35rem;margin:18px 0 4px;text-decoration:underline}.mk-paper p{font-size:1.15rem;line-height:1.6;margin:0 0 8px}
.mk-fig{margin:16px auto;text-align:center}.mk-fig img{max-width:min(100%,360px);height:auto}.mk-fig figcaption{font-weight:700}.mk-dyk{background:#fff6dd;border:3px solid var(--ink,#2B1A12);border-radius:14px;padding:12px 16px;margin:16px 0;font-size:1.15rem}.mk-by{font-size:.85rem;opacity:.7;text-align:right;margin-top:16px}
.mk-group{margin:18px 0 0;font-family:var(--disp);font-size:var(--t-lead,1.3rem)}.mk-count{font:400 1rem var(--body,Aleo),serif;opacity:.75;margin-left:8px}
.mk-model{flex:1 1 220px;max-width:320px;background:#fffaf0;border:3px dashed rgba(43,26,18,.35);border-radius:16px;padding:12px}.mk-modelhead{display:flex;gap:8px;align-items:center;margin-bottom:8px;font-family:var(--disp);font-size:1.25rem}.mk-modelhead .fab-char{width:56px;flex:none}
.mk-modelcv{display:block;width:100%;max-width:256px;height:auto;margin:0 auto;border:3px solid var(--ink,#2B1A12);border-radius:12px;background:#fbf6ea}.mk-tips{margin:10px 0 0;padding-left:1.2em;font-size:1.15rem;line-height:1.45}.mk-tips li{margin:4px 0}
.mk-pairs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;max-width:760px}.mk-pc{aspect-ratio:4/3;border:3px solid var(--ink,#2B1A12);border-radius:16px;background:var(--flame,#FE4D02);color:#fff;font:inherit;cursor:pointer;display:grid;place-items:center;padding:6px;min-height:92px}
.mk-pc.up{background:#fff;color:var(--ink,#2B1A12)}.mk-pc.got{background:#eef7e6}.mk-pe{font-size:3rem;line-height:1}.mk-pw{font-weight:800;font-size:1.25rem;text-align:center}.mk-paw{font-size:2rem;opacity:.9}.mk-pc:focus-visible,.mk-jump:focus-visible,.mk-steps button:focus-visible{outline:4px solid var(--sky,#5aa9e6);outline-offset:3px}
.mk-state{font-size:1.7rem;line-height:1.4;font-weight:700;background:#fff;border:3px solid var(--ink,#2B1A12);border-radius:18px;padding:18px 22px;margin:8px 0 14px;max-width:820px}.mk-tf .btn{font-size:1.4rem;min-width:150px}
.mk-map{display:block;width:100%;max-width:900px;height:auto;margin:10px auto;background:#fffaf0;border-radius:16px}.mk-map.big{max-width:1180px}.mk-map text{font-family:Aleo,Georgia,serif}
.mk-node{cursor:pointer}.mk-node:focus-visible rect{stroke:#FE4D02;stroke-width:7}.mk-node:hover rect{fill:#FFE9B8}
.mk-noteadd{background:#FFF6E6;border:3px solid var(--ink,#2B1A12);border-radius:18px;padding:12px 16px;margin:10px auto;max-width:1180px}.mk-noteadd h4{margin:0 0 8px;font-size:var(--t-lead,1.25rem)}
.mk-noterow{display:flex;gap:10px;align-items:center;margin:10px 0 8px}.mk-noterow .mk-in{flex:1;min-width:0;margin:0}
.mk-notes{list-style:none;margin:0 0 10px;padding:0;display:grid;gap:6px}.mk-notes li{background:#fff;border:2px solid var(--ink,#2B1A12);border-radius:12px;padding:6px 12px;font-size:var(--t-body,1.1rem)}.mk-nudge{text-align:center;font-weight:700}
.mk-steps{list-style:none;display:flex;gap:8px;margin:6px 0 4px;padding:0}.mk-steps button{width:44px;height:44px;border-radius:50%;border:3px solid var(--ink,#2B1A12);background:#fff;font:800 1.1rem var(--body,Aleo),serif;color:inherit;cursor:pointer}.mk-steps button.on{background:var(--sunshine,#FFD483)}
.mk-stepname{margin:0 0 12px;font-size:var(--t-lead,1.3rem)}.mk-nav{margin-top:14px}.mk-jump{border:0;background:none;font:inherit;font-weight:700;color:inherit;cursor:pointer;text-align:left;padding:4px 0}.mk-in-list{list-style:none;padding:0;margin:0 0 14px;display:grid;gap:8px}
.mk-tag{display:inline-block;background:var(--sky,#5aa9e6);color:#fff;font-weight:800;font-size:.95rem;border-radius:999px;padding:2px 12px;margin:10px 0 2px}.mk-modelrep{margin:12px 0;max-width:none}.mk-modelrep h2{text-align:left}
@media (max-width:640px){.mk-pairs{grid-template-columns:repeat(3,minmax(0,1fr))}.mk-state{font-size:1.4rem}}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@media (max-width:760px){.mk-rep{grid-template-columns:1fr}.mk-side{position:static}}
@media print{body.mk-printing *{visibility:hidden!important}body.mk-printing .mk-paper,body.mk-printing .mk-paper *{visibility:visible!important}body.mk-printing .mk-paper{position:absolute;left:0;top:0;width:100%;max-width:none;border:0;box-shadow:none}}`;
  document.head.appendChild(css);

  /* ---------- each world's activities (facts are a draft for a teacher to check) ---------- */
  const set = (id, make) => { if(X.worlds[id]) X.worlds[id].make = make; };
  set('rome', {
    quiz:[{ t:'An aqueduct carried clean water into the town.', a:true, why:'It was like a bridge for water.' }, { t:'Every Roman home had taps.', a:false, why:'Most homes had no taps. People filled their jugs at a fountain in the street.' }, { t:'A mosaic is made from tiny cubes of coloured stone.', a:true, why:'Hundreds of little cubes make one picture.' }, { t:'Roman milestones told people the time.', a:false, why:'Milestones told travellers how far they had come.' }, { t:'Amphorae are tall jars for olive oil and wine.', a:true, why:'They were carried on carts and ships.' }, { t:'Roman bakers bought their flour ready-made in paper bags.', a:false, why:'Bakers ground wheat into flour themselves, with heavy stone mills.' }],
    order:{ h:'Make a Roman timeline', sub:'Put six events in order', noun:'My Roman timeline', ask:'Tap the events in order. Start with the one that happened first.', hint:'Look for the earliest date that is left. BC comes before AD, and BC numbers count down.',
      items:[{ id:'a', d:'753 BC', n:'The city of Rome begins, the old stories say' }, { id:'b', d:'55 BC', n:'Julius Caesar sails to Britain for the first time' }, { id:'c', d:'AD 43', n:'The Roman army arrives in Britain to stay' }, { id:'d', d:'AD 80', n:'The Colosseum opens in Rome' }, { id:'e', d:'AD 122', n:'Building begins on Hadrian’s Wall' }, { id:'f', d:'AD 410', n:'The Roman army leaves Britain' }] },
    art:{ h:'Make a mosaic', sub:'Tile art, like a Roman floor', noun:'My mosaic', tip:'Roman mosaics often have a patterned border and a picture in the middle. Pick a colour, then tap or drag across the tiles.', W:16, H:16, sym:'none', model:'mosaic', modelAlt:'a blue fish inside a patterned border', tips:['Start with the border.', 'Then make a simple picture in the middle.', 'Three or four colours are plenty.'],
      pal:[['#b5533c', 'Terracotta red'], ['#d9a441', 'Ochre yellow'], ['#2b2622', 'Black'], ['#f8f4ea', 'White'], ['#5d7a94', 'Blue grey'], ['#6b7b3a', 'Olive green'], ['#c98f72', 'Pink brown'], ['#8a5a36', 'Brown']] },
    report:{ title:'All about the Romans', model:{ title:'All about Roman roads', intro:'The Romans built long, straight roads across their empire.', secs:[['How they were built', 'Workers dug a trench and filled it with layers of stones. The top was made from flat paving stones.'], ['Who used them', 'Soldiers marched along the roads. Carts carried food and goods from town to town.']], dyk:'Some roads in Britain today follow the lines of old Roman roads.' }, intro:['The Romans lived about 2,000 years ago.', 'The Romans built towns with shops, fountains and temples.', 'This report is about life in a Roman town.'], words:['Roman', 'aqueduct', 'mosaic', 'amphorae', 'fountain', 'bakery', 'temple', 'milestone'] } });
  set('egypt', {
    quiz:[{ t:'Papyrus reeds were made into sheets for writing on.', a:true, why:'Strips of the reed were pressed together.' }, { t:'The pyramids were built for farmers.', a:false, why:'They were built for the pharaohs, the kings of Egypt.' }, { t:'A shaduf lifts water up from the river.', a:true, why:'A heavy weight on one end helps to lift the bucket.' }, { t:'Egyptian houses were built from blocks of ice.', a:false, why:'Houses were built from mud bricks, dried in the sun.' }, { t:'Hieroglyphs are a kind of picture-writing.', a:true, why:'Each little picture stands for a sound or a word.' }, { t:'Senet is a kind of boat.', a:false, why:'Senet is a board game for two players.' }],
    order:{ h:'Make an Egyptian timeline', sub:'Put six events in order', noun:'My Egyptian timeline', ask:'Tap the events in order. Start with the one that happened first.', hint:'These are all BC dates, so the biggest number happened first.',
      items:[{ id:'a', d:'About 2560 BC', n:'The Great Pyramid is finished' }, { id:'b', d:'About 2500 BC', n:'The Sphinx is carved from the rock' }, { id:'c', d:'About 1470 BC', n:'Hatshepsut rules Egypt as pharaoh' }, { id:'d', d:'About 1330 BC', n:'Tutankhamun becomes pharaoh as a boy' }, { id:'e', d:'About 1250 BC', n:'The great temples at Abu Simbel are built' }, { id:'f', d:'51 BC', n:'Cleopatra becomes the last pharaoh' }] },
    art:{ h:'Design a jewelled collar', sub:'Jewellery made from rows of beads', noun:'My jewelled collar', tip:'Egyptians wore wide collars made from rows of coloured beads. Your pattern is copied on the other side, so the collar matches.', W:21, H:12, sym:'mirror', mask:'collar', model:'collar', modelAlt:'rows of gold, blue, turquoise and red beads', tips:['Work in rows, like strings of beads.', 'Repeat your colours to make a pattern.', 'Gold and deep blue were favourites.'],
      pal:[['#d9a441', 'Gold'], ['#1f4e9c', 'Deep blue'], ['#2aa6a1', 'Turquoise'], ['#b8402a', 'Red'], ['#3e8f4f', 'Green'], ['#f8f4ea', 'White'], ['#2b2622', 'Black']] },
    report:{ title:'All about Ancient Egypt', model:{ title:'All about the River Nile', intro:'The River Nile is the longest river in Africa. Ancient Egypt grew up along its banks.', secs:[['Farming', 'Every year the river flooded and left rich, dark mud on the fields. Farmers grew wheat and barley in it.'], ['Travel', 'People sailed boats along the river. The boats carried food, stone and visitors.']], dyk:'The Egyptians called their land Kemet. It means the black land, after the dark mud.' }, intro:['The Ancient Egyptians lived beside the River Nile.', 'Ancient Egypt was ruled by kings and queens called pharaohs.', 'This report is about life in Ancient Egypt.'], words:['pharaoh', 'pyramid', 'River Nile', 'papyrus', 'scribe', 'hieroglyphs', 'shaduf', 'Sphinx'] } });
  set('victorian', {
    quiz:[{ t:'Victorian children wrote on slates.', a:true, why:'They wiped the slate clean and used it again.' }, { t:'A penny-farthing has two wheels the same size.', a:false, why:'The front wheel is huge and the back wheel is tiny.' }, { t:'VR on a pillar box stands for Victoria Regina.', a:true, why:'Regina means queen.' }, { t:'The street lamps in Ada’s street are electric.', a:false, why:'They burn gas. A lamplighter lights each one in the evening.' }, { t:'Sweets were weighed on scales and tipped into a paper bag.', a:true, why:'The shopkeeper kept them in big glass jars.' }, { t:'Every Victorian home had taps.', a:false, why:'Many homes had no taps. Families fetched water from a pump in the street.' }],
    order:{ h:'Make a Victorian timeline', sub:'Put seven events in order', noun:'My Victorian timeline', ask:'Tap the events in order. Start with the one that happened first.', hint:'Look for the smallest number that is left. That year came first.',
      items:[{ id:'a', d:'1837', n:'Victoria becomes queen' }, { id:'b', d:'1840', n:'The first postage stamp, the Penny Black' }, { id:'c', d:'1851', n:'The Great Exhibition opens in London' }, { id:'d', d:'1863', n:'The first underground railway opens' }, { id:'e', d:'1876', n:'The telephone is invented' }, { id:'f', d:'1894', n:'Tower Bridge opens' }, { id:'g', d:'1897', n:'The Diamond Jubilee: 60 years as queen' }] },
    art:{ h:'Design a Victorian tile', sub:'A pattern that matches in every corner', noun:'My Victorian tile', tip:'Victorian halls and porches had patterned floor tiles. Your pattern is copied into all four corners.', W:12, H:12, sym:'four', model:'tile', modelAlt:'a red cross and a blue diamond on a chequered tile', tips:['Colour one corner and watch the others copy you.', 'Try a diagonal line or a diamond.', 'Leave some tiles plain so the pattern stands out.'],
      pal:[['#a8432f', 'Brick red'], ['#e3c58f', 'Buff'], ['#2b2622', 'Black'], ['#3d5a80', 'Blue'], ['#f8f4ea', 'White'], ['#6b4a2f', 'Brown'], ['#4f7f5b', 'Green']] },
    report:{ title:'All about the Victorians', model:{ title:'All about Victorian schools', intro:'In Victorian times, more and more children began going to school.', secs:[['The classroom', 'Children sat in rows at wooden desks. They wrote on slates with slate pencils.'], ['Lessons', 'They learned reading, writing and arithmetic. These were called the three Rs.']], dyk:'By 1880, children aged five to ten had to go to school.' }, intro:['The Victorians lived when Victoria was queen, from 1837 to 1901.', 'In Victorian times, steam trains changed how people travelled.', 'This report is about life in Victorian times.'], words:['Victorian', 'steam train', 'gas lamp', 'slate', 'pillar box', 'penny-farthing', 'Queen Victoria', 'invention'] } });
  set('space', {
    quiz:[{ t:'Solar panels turn sunlight into electricity.', a:true, why:'They power the whole station.' }, { t:'Astronauts float because there is no gravity at all.', a:false, why:'There is gravity up there. Astronauts float because the station is falling around the Earth all the time.' }, { t:'The Cupola has seven windows.', a:true, why:'It is the best place to look down at the Earth.' }, { t:'Astronauts make their sandwiches with crusty bread.', a:false, why:'They use wraps, because floating crumbs could get into the machines.' }, { t:'Astronauts exercise for about two hours every day.', a:true, why:'It keeps their muscles and bones strong.' }, { t:'Astronauts sleep standing on the floor.', a:false, why:'There is no up or down, so they sleep in a sleeping bag fixed to the wall.' }],
    order:{ h:'Put the planets in order', sub:'From the Sun outwards', noun:'The planets in order', first:'Which planet is nearest the Sun?', ask:'Tap the planets in order. Start with the one nearest the Sun.', hint:'Try this: My Very Easy Method Just Speeds Up Naming. The first letters are the planets in order.',
      items:[{ id:'a', c:'#9a8f85', n:'Mercury, the smallest planet' }, { id:'b', c:'#e6c36a', n:'Venus, the hottest planet' }, { id:'c', c:'#3b82c4', n:'Earth, our home' }, { id:'d', c:'#c1532f', n:'Mars, the red planet' }, { id:'e', c:'#d9a066', n:'Jupiter, the biggest planet' }, { id:'f', c:'#e3cf8f', n:'Saturn, famous for its rings' }, { id:'g', c:'#8fd3d8', n:'Uranus, which spins on its side' }, { id:'h', c:'#3f5fbf', n:'Neptune, the furthest from the Sun' }] },
    art:{ h:'Design a mission patch', sub:'A badge for your space crew', noun:'My mission patch', tip:'Every space crew designs a badge called a mission patch. What will yours show? A rocket, a planet, some stars?', W:16, H:16, sym:'none', mask:'circle', model:'patch', modelAlt:'a white rocket and stars on a navy badge with a gold edge', tips:['Give your badge an edge in one colour.', 'Put one big thing in the middle.', 'Add a few stars to fill the space.'],
      pal:[['#1c2a5e', 'Navy blue'], ['#f8f4ea', 'White'], ['#c8372d', 'Red'], ['#e3b23c', 'Gold'], ['#5aa9e6', 'Sky blue'], ['#3e8f4f', 'Green'], ['#e8792b', 'Orange'], ['#2b2622', 'Black']] },
    report:{ title:'All about the Space Station', model:{ title:'All about astronauts', intro:'Astronauts are people who travel into space to live and work.', secs:[['Training', 'Astronauts train for years. They practise spacewalks in a huge swimming pool.'], ['Working in space', 'On the Space Station they do science experiments. They also look after the station.']], dyk:'Astronauts grow a little taller in space, because their backbones stretch out.' }, intro:['The Space Station is a home and a science lab in space.', 'Astronauts live and work on the Space Station.', 'This report is about life on the Space Station.'], words:['astronaut', 'orbit', 'gravity', 'solar panels', 'Cupola', 'spacesuit', 'experiment', 'Earth'] } });

  window.FabMake = { html, mount, home, state:M, load, checks, mask:MASK, modelGrid };
  try{ if(X.state.era && q1('#screen-time') && q1('#screen-time').classList.contains('active')) X.render(); }catch(e){}
})();
