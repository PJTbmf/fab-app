/* Joins the Learning Board (board.js) and Show a link (coview.js) to the Learning Hub and lessons. */
(function(){
  'use strict';
  /* where the child is right now: the lesson, the screen, and (in a flightpath) their step */
  function current(){
    try{
      const p = Learn.pack; if(!p) return null;
      const s = p.screens[Learn.step]; if(!s) return { p };
      if(s.type === 'pathway'){
        const st = Learn.state[Learn.step], kid = st && pwKid(st, pwMe());
        if(kid && kid.step != null) return { p, s, stp:s.steps[kid.step], i:kid.step };
      }
      return { p, s };
    }catch(e){ return null; }
  }
  /* ---------- slides: the step's own teaching, ready to write on ---------- */
  const INK = '#2b2f3a', FLAME = '#FE4D02';
  const isMaths = c => /maths/i.test((c && c.p && c.p.subject) || '');
  function wrap(text, size, width){
    const per = Math.max(12, Math.floor((width || 1460) / (size * 0.52))), out = [];
    String(text || '').split('\n').forEach(par => {
      let ln = '';
      par.split(/\s+/).forEach(w => { if(!w) return; if((ln + ' ' + w).trim().length > per){ if(ln) out.push(ln); ln = w; } else ln = (ln + ' ' + w).trim(); });
      out.push(ln);
    });
    return out.join('\n');
  }
  const words = (txt, x, y, size, col, width) => ({ t:'x', x, y, s:size, c:col || INK, txt:wrap(txt, size, (width || 1600 - x - 60) - (width ? x - 80 : 0)) });
  /* A sum laid out in columns on squared paper, one digit to a square, ready for the teacher to work through. */
  function columnItems(a, op, b){
    const A = String(a).replace(/,/g, ''), Bn = String(b).replace(/,/g, '');
    if(!/^\d+$/.test(A) || !/^\d+$/.test(Bn)) return null;
    const G = 100, right = 11, top = 2, S = 88, items = [];
    const digit = (d, col, row, c) => items.push({ t:'x', x:(right - col) * G + 24, y:(top + row) * G + 4, s:S, c:c || INK, txt:d });
    [...A].reverse().forEach((d, i) => digit(d, i, 0));
    [...Bn].reverse().forEach((d, i) => digit(d, i, 1));
    const width = Math.max(A.length, Bn.length) + 1;
    digit(op === '-' ? '−' : op, width - 1, 1, FLAME);
    const y = (top + 2) * G + 6, x0 = (right - width + 1) * G - 6, x1 = (right + 1) * G + 6;
    items.push({ t:'s', m:'pen', c:INK, w:7, p:[x0, y, x1, y] });
    return items;
  }
  /* Short or long division as a "bus stop". */
  function busStopItems(a, b){
    const A = String(a).replace(/,/g, ''), Bn = String(b).replace(/,/g, '');
    if(!/^\d+$/.test(A) || !/^\d+$/.test(Bn)) return null;
    const G = 100, left = 5, top = 3, S = 88, items = [];
    [...Bn].forEach((d, i) => items.push({ t:'x', x:(left - Bn.length + i) * G + 24, y:top * G + 4, s:S, c:FLAME, txt:d }));
    [...A].forEach((d, i) => items.push({ t:'x', x:(left + i) * G + 24 + 20, y:top * G + 4, s:S, c:INK, txt:d }));
    const x0 = left * G + 4, x1 = (left + A.length) * G + 40, y = top * G - 6;
    items.push({ t:'s', m:'pen', c:INK, w:7, p:[x0, y + G + 8, x0 + 10, y + 36, x0 + 4, y, x1, y] });
    return items;
  }
  function modelItems(q, maths, width){
    const m = /^([\d,]+)\s*([+−\-×÷])\s*([\d,]+)$/.exec(String(q.say || '').trim());
    const written = /^(columnAdd|columnSub|mulWritten|longMul|shortDiv|longDiv)$/.test(q.kind || '') || (Array.isArray(q.vis) && q.vis.includes('column'));
    if(maths && m && (written || (m[2] === '÷' && /^(remainder|shortDiv|longDiv|divFacts|division)$/i.test(q.kind || '')))){
      const op = m[2] === '−' ? '-' : m[2];
      const it = op === '÷' ? busStopItems(m[1], m[3]) : columnItems(m[1], op, m[3]);
      if(it) return it;
    }
    return [words(q.ask || q.say || '', 80, 230, 84, INK, width)];
  }
  function kidNow(){ try{ const st = Learn.state[Learn.step]; return st && pwKid(st, pwMe()); }catch(e){ return null; } }
  /* Slides: the step taught as a short deck that shows the learning, not the same words again.
     Each slide is a ready-made picture (HTML laid under the page, so the teacher can still write on it) with one job per
     character: 💡 the big idea and 👀 I do: Miss Bell · 💭 my thinking · 🤝 We do: Bramble and Moss · ⭐ You do: Fab ·
     🛑 a good place to stop: Mrs Lark. The models are the app's own: fraction bars and circles, place value blocks, groups,
     number tracks, columns, maps, timelines and diagrams, drawn from the step's real questions. */
  const escH = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const CAST = { idea:['bell'], ido:['bell'], think:['bell'], wedo:['yellow', 'green'], ydo:['fab'], stop:['lark'] };
  const CAST_NAME = { bell:'Miss Bell', yellow:'Bramble', green:'Moss', fab:'Fab', lark:'Mrs Lark' };
  const TAG = { idea:'💡 The big idea', ido:'👀 I do: watch me', think:'💭 My thinking', wedo:'🤝 We do: together', ydo:'⭐ You do: your turn', stop:'🛑 A good place to stop' };
  function slideHTML(kind, title, body){
    return `<div class="bsl sl-${kind}"><div class="sl-band"><span class="sl-tag">${TAG[kind]}</span><span class="sl-title">${escH(title)}</span></div>` +
      `<div class="sl-body">${body}</div><div class="sl-cast" aria-hidden="true">${CAST[kind].map(k => `<span class="fab-char ${k}" title="${CAST_NAME[k]}"></span>`).join('')}</div></div>`;
  }
  const range = n => Array.from({ length:n }, (_, i) => i);
  const isFrac = stp => /^(frac|equalParts)/.test((stp && stp.kind) || '');
  const firstSentence = t => { const m = String(t || '').match(/^.*?[.!?](\s|$)/); return (m ? m[0] : String(t || '')).trim(); };
  /* the picture for one question: hidden answer, or revealed */
  function modelHTML(stp, qq, reveal){
    if(!qq) return '';
    if(qq.mode === 'shade'){ const k = (qq.vars && qq.vars.k) || 1; return pwFracFigure(qq.shade.d, reveal ? range(k) : [], qq.shade.shape, {}); }
    let h = ''; try{ h = pwVisHTML(qq) || ''; }catch(e){}
    if(!h && window.FabVis){
      try{ const spec = pwVisSpec(stp, qq); if(spec){ const fv = qq.fv || {}; const v = FabVis.html(spec, { ask:qq.ask || '', ans:qq.ans, vq:fv.vq, va:fv.va, vx:fv.vx, reveal:!!reveal }); if(v) h = `<div class="pw-vis sl-fv">${v}</div>`; } }catch(e){}
    }
    if(!h) h = mathsModel(qq, reveal);
    return h ? `<div class="sl-model">${h}</div>` : '';
  }
  /* When a maths question has no picture of its own, draw the maths: an array for ×, equal groups (and what is left over)
     for ÷, counters or a bar model for + and −, a number line for counting on. */
  function mathsModel(qq, reveal){
    const m = /^\s*([\d,]+)\s*([×x÷+−\-])\s*([\d,]+)/.exec(String(qq.say || qq.ask || '').replace(/\(|\)/g, ''));
    if(!m) return '';
    const a = Number(m[1].replace(/,/g, '')), op = m[2], b = Number(m[3].replace(/,/g, ''));
    const dot = c => `<i class="${c || ''}"></i>`;
    if((op === '×' || op === 'x') && a <= 12 && b <= 12){
      return `<div class="sl-arr" style="--c:${b}" role="img" aria-label="${a} rows of ${b}">${Array.from({ length:a }, () => `<span>${dot().repeat(b)}</span>`).join('')}</div><p class="sl-cap">${a} rows of ${b}${reveal ? ` = ${a * b}` : ''}</p>`;
    }
    if(op === '÷' && b >= 2 && b <= 12 && a <= 144){
      const g = Math.floor(a / b), r = a % b;
      if(g > 12) return '';
      return `<div class="sl-groups" role="img" aria-label="${a} in groups of ${b}">${Array.from({ length:g }, () => `<span class="sl-grp">${dot().repeat(b)}</span>`).join('')}${r ? `<span class="sl-grp left">${dot('left').repeat(r)}</span>` : ''}</div><p class="sl-cap">${a} in groups of ${b}${reveal ? `: ${g} groups${r ? `, ${r} left over` : ''}` : ''}</p>`;
    }
    if((op === '+' || op === '−' || op === '-') && a <= 20 && b <= 20){
      const sub = op !== '+';
      return `<div class="sl-count" role="img" aria-label="counters">${dot().repeat(sub ? a - b : a)}${sub ? dot('gone').repeat(b) : dot('two').repeat(b)}</div><p class="sl-cap">${sub ? `${a}, take away ${b}` : `${a} and ${b} more`}${reveal ? ` = ${sub ? a - b : a + b}` : ''}</p>`;
    }
    if(op === '+' || op === '−' || op === '-'){
      const sub = op !== '+', whole = sub ? a : a + b, p1 = sub ? a - b : a, p2 = b;
      const w1 = Math.max(18, Math.round(p1 / whole * 100));
      return `<div class="sl-bar"><div class="sl-bar-whole">${sub || reveal ? pwShow(whole) : '?'}</div><div class="sl-bar-parts"><span style="flex:${w1}">${!sub || reveal ? pwShow(p1) : '?'}</span><span style="flex:${100 - w1}">${pwShow(p2)}</span></div></div><p class="sl-cap">A bar model: the whole and its parts</p>`;
    }
    return '';
  }
  function questionHTML(stp, qq, reveal, maths){
    const ask = qq.mode === 'orient' ? `Which ${qq.d} is the right way round?` : (qq.ask || qq.say || '');
    const choices = qq.mode === 'choice' && Array.isArray(qq.choices) ? `<div class="sl-choices">${qq.choices.map((c, i) => `<span class="${reveal && pwNorm(c) === pwNorm(qq.ans) ? 'ok' : ''}">${'abcd'[i]}) ${escH(pwShow(c))}</span>`).join('')}</div>` : '';
    const ans = reveal ? `<div class="sl-ans">${escH(qq.say ? `${qq.say} = ${pwShow(qq.ans)}` : pwShow(qq.ans))}</div>` : (qq.mode === 'choice' ? '' : '<div class="sl-ans blank">?</div>');
    return `<div class="sl-q">${escH(ask)}</div>${modelHTML(stp, qq, reveal)}${choices}${ans}`;
  }
  /* the big idea, shown: for fractions, the equal parts themselves */
  function ideaHTML(stp, tc, qq){
    if(isFrac(stp)){
      const P = stp.params || {}, dens = (Array.isArray(P.dens) && P.dens.length ? P.dens : [2, 3, 4]).slice(0, 3);
      const NAME = { 2:'a half', 3:'a third', 4:'a quarter', 5:'a fifth', 6:'a sixth', 8:'an eighth', 10:'a tenth' };
      const rows = dens.map(d => `<div class="sl-frow"><span class="sl-flab"><b>1/${d}</b> ${NAME[d] || 'one ' + d + 'th'}<small>${d} equal parts</small></span>${pwFracFigure(d, [0], 'bar', { labels:true })}</div>`).join('');
      const big = dens[dens.length - 1], k = Math.max(2, big - 1);
      const eg = big >= 3 ? `<div class="sl-frow eg"><span class="sl-flab"><b>${k}/${big}</b><small>${k} of ${big} equal parts</small></span>${pwFracFigure(big, range(k), 'bar', {})}${pwFracFigure(big, range(k), 'circle', {})}</div>` : '';
      return `<div class="sl-fracs">${rows}${eg}</div><p class="sl-note">The bottom number: how many equal parts. The top number: how many we have.</p>`;
    }
    const m = modelHTML(stp, qq, true);
    return `${m || ''}<p class="sl-note big">${escH(firstSentence(tc.idea || stp.task || stp.name))}</p>`;
  }
  function slidesFor(c){
    if(!c || !c.stp) return null;
    const stp = c.stp, tc = stp.teach || {}, maths = isMaths(c);
    const q = () => { const k = kidNow(); return (k && (k.ex || k.q)) || pwQuestion(stp); };
    const page = (kind, body) => ({ key:'', title:'', prompt:'', bg:'html', html:slideHTML(kind, stp.name, body), items:[] });
    return () => { const ex = q(); return [
      { icon:'💡', name:'The big idea', kind:'idea', make:() => page('idea', ideaHTML(stp, tc, ex)) },
      { icon:'👀', name:'I do', kind:'ido', make:() => page('ido', questionHTML(stp, ex, false, maths)) },
      { icon:'💭', name:'My thinking', kind:'think', make:() => {
        const qq = ex; let worked = '';
        try{ worked = PW_WORKED[qq.kind] ? PW_WORKED[qq.kind](qq) : pwFindHint(stp, qq, null).text; }catch(e){}
        return page('think', `<p class="sl-worked">${escH(worked)}</p>${questionHTML(stp, qq, true, maths)}`);
      } },
      { icon:'🤝', name:'We do', kind:'wedo', make:() => page('wedo', questionHTML(stp, pwQuestion(stp), false, maths) + '<p class="sl-note">Let’s work it out together.</p>') },
      { icon:'⭐', name:'You do', kind:'ydo', make:() => page('ydo', questionHTML(stp, pwQuestion(stp), false, maths) + '<p class="sl-note">Your turn. Hints are always there.</p>') },
      { icon:'🛑', name:'A good place to stop', kind:'stop', make:() => page('stop', '<p class="sl-note big">Well done for your thinking today.</p><p class="sl-note">You can stop here and it still counts, or carry on if you would like to.</p>') },
    ]; };
  }
  /* Build the whole deck for the step, or rebuild it with fresh examples, and open it (on a chosen slide). */
  function showSlides(c, kind){
    const sl = slidesFor(c); if(!sl) return false;
    const list = sl(), pages = list.map(x => { let p = null; try{ p = x.make(); }catch(e){} return p; }).filter(Boolean);
    if(!pages.length) return false;
    FabBoard.setDeck('slides:' + c.p.id + ':' + c.i, pages);
    if(kind){ const i = list.findIndex(x => x.kind === kind); if(i > 0){ const B = FabBoard.state(); FabBoard.go(B.page + i); } }
    return true;
  }
  function stepPage(c){
    const maths = isMaths(c), stp = c.stp;
    return { key:c.p.id + ':' + c.i, title:`Step ${c.i + 1}: ${stp.name}`,
      prompt:stp.task || 'Show what you know, your way: draw it, write it, add stickers or a picture.', bg:maths ? 'squares' : 'lines' };
  }
  function boardFor(c, withBooklet, extra){
    if(!c || !c.p) return FabBoard.open({ id:'workbook', title:'My workbook', back:'screen-learn' });
    const maths = isMaths(c);
    const stp = c.stp, opts = { id:'lesson:' + c.p.id, title:(c.p.emoji ? c.p.emoji + ' ' : '') + c.p.title, back:'screen-lesson', dock:true, slides:slidesFor(c) };
    if(extra) Object.assign(opts, extra);
    if(stp){
      opts.step = stepPage(c);
      if(withBooklet && stp.booklet && stp.booklet.url) opts.booklet = { url:stp.booklet.url, pages:stp.booklet.pages, title:stp.booklet.title };
    } else if(c.s){
      opts.step = { key:c.p.id + ':screen' + Learn.step, title:c.s.title || 'My page', prompt:'Write or draw your ideas here.', bg:maths ? 'squares' : 'lines' };
    }
    return FabBoard.open(opts);
  }

  /* ---------- the board in the centre of a flightpath ----------
     After every redraw of the lesson, the board moves into the new centre column and gets the step's picture.
     When the child moves to another step, the board turns to that step: its picture if it has one, otherwise their page. */
  let lastKey = null, lastVis = false;
  async function openBooklet(c){
    const bk = c && c.stp && c.stp.booklet; if(!bk || !bk.url) return;
    if(FabBoard.goWhere(p => p.src === bk.url && (!bk.pages || p.srcPage === bk.pages[0]))) return;
    const at = await FabBoard.addBooklet({ url:bk.url, pages:bk.pages, title:bk.title });
    if(at >= 0) FabBoard.go(at);
  }
  function centreViews(c){
    const stepKey = c.p.id + ':' + c.i, deck = 'slides:' + stepKey;
    return () => {
      const pg = FabBoard.page() || {}, B = FabBoard.state(), stp = c.stp, out = [];
      if(FabBoard.hasLive()) out.push({ k:'live', icon:'📡', name:'Teacher', on:pg.key === 'live', go:() => FabBoard.goWhere(p => p.key === 'live') });
      if(B.visHTML) out.push({ k:'vis', icon:'🖼️', name:'Picture', on:pg.bg === 'vis', go:() => FabBoard.goWhere(p => p.bg === 'vis') });
      out.push({ k:'slides', icon:'📽️', name:'Slides', on:pg.deck === deck, go:() => { if(pg.deck === deck) return; if(!FabBoard.goWhere(p => p.deck === deck)) showSlides(c); } });
      out.push({ k:'mine', icon:'✏️', name:'My page', on:pg.step === stepKey, go:() => FabBoard.goWhere(p => p.step === stepKey) });
      if(window.FabModelKit) out.push({ k:'tools', icon:'🧰', name:'Tools', on:!!pg.tool, go:() => FabModelKit.open(kitInfo(c)) });
      if(stp && stp.booklet && stp.booklet.url) out.push({ k:'book', icon:'📄', name:'Booklet', on:pg.src === stp.booklet.url, go:() => openBooklet(c) });
      return out;
    };
  }
  /* what the modelling tools need to know: subject, year group and the step */
  function kitInfo(c){
    const p = c.p || {}, stp = c.stp || {};
    const yr = String(stp.year || (stp.nc && stp.nc.year ? 'Y' + stp.nc.year : '') || p.years || '');
    const n = /rec|eyfs|nursery/i.test(yr + ' ' + (p.years || '')) ? 0 : (Number((/\d+/.exec(yr) || [])[0]) || 3);
    return { subject:String(p.subject || ''), topic:String(p.topic || p.title || ''), year:n, step:stp, pack:p };
  }
  function openFor(c, hasVis, fresh){
    return boardFor(c, false, { inlay:true, dock:false, views:centreViews(c), visPage:hasVis, freshVis:fresh, go:hasVis ? 'vis' : 'step' });
  }
  function afterRender(stage){
    if(!window.FabBoard) return;
    const host = stage.querySelector('.pw-centre');
    if(!host){ if(FabBoard.inlaid()) FabBoard.unmount(); lastKey = null; return; }
    const tpl = host.querySelector('template.pw-visslot');
    let vis = '';
    if(tpl){ const t = document.createElement('div'); t.innerHTML = tpl.innerHTML; const pv = t.querySelector('.pw-vis'); vis = pv ? pv.innerHTML : ''; tpl.remove(); }
    FabBoard.mount(host);
    FabBoard.setVis(vis);
    const c = current(), key = c && c.stp ? c.p.id + ':' + c.i : null;
    if(!key) return;
    if(key !== lastKey){ lastKey = key; lastVis = !!vis; openFor(c, !!vis, true); }
    else if(!!vis !== lastVis){ lastVis = !!vis; if(vis) openFor(c, true, false); }
    else FabBoard.refresh();
  }

  function stepLinks(c){
    if(!c || !c.stp) return [];
    const out = [];
    (Array.isArray(c.stp.media) ? c.stp.media : []).forEach(m => { if(m && m.url) out.push({ u:m.url, t:m.title }); });
    try{ ((pwMediaSaved()[c.i]) || []).forEach(m => out.push({ u:m.u, t:m.t })); }catch(e){}
    return out;
  }
  function paintShare(){
    const can = window.CoView && CoView.canShare();
    ['learnLinkBtn', 'lpLink'].forEach(id => { const b = document.getElementById(id); if(b) b.hidden = !can; });
  }
  document.getElementById('learnBoardBtn').addEventListener('click', () => FabBoard.open({ id:'workbook', title:'My workbook', back:'screen-learn' }));
  /* 📋 Board at the top of a lesson: in a flightpath the board is already in the middle, so this makes it fill the screen. */
  document.getElementById('lpBoard').addEventListener('click', () => { if(FabBoard.inlaid()) FabBoard.setBig(true); else boardFor(current(), false); });
  document.getElementById('lpLink').addEventListener('click', () => CoView.launcher({ links:stepLinks(current()) }));
  /* "Show it on the board": the I do slide, with this example, on the board. */
  async function modelOnBoard(){
    const c = current();
    if(FabBoard.inlaid()){ showSlides(c, 'ido'); return; }
    await boardFor(c, false);
    showSlides(c, 'ido');
  }
  /* Leaving the lesson closes a board that was docked beside it. */
  if(typeof window.showScreen === 'function'){
    const show = window.showScreen;
    window.showScreen = function(id){ if(id !== 'screen-lesson' && id !== 'screen-board' && window.FabBoard){ if(FabBoard.docked()) FabBoard.undock(); FabBoard.setBig(false); } return show.apply(this, arguments); };
  }
  /* 🗺️ My flightpath opens as a drawer over the right-hand side, so teaching and the board share the screen 50/50.
     It closes on ✕, a tap outside it, Escape, or choosing a step. */
  const drawer = on => { document.body.classList.toggle('pw-drawer-open', on); if(on){ const x = document.querySelector('.pw-drawer-x'); if(x) try{ x.focus({ preventScroll:true }); }catch(err){} } };
  document.addEventListener('click', e => {
    if(e.target.closest('[data-pwdrawer]')){ e.preventDefault(); drawer(!document.body.classList.contains('pw-drawer-open')); }
    else if(e.target.closest('[data-pwdrawer-close]')) drawer(false);
    else if(e.target.closest('[data-pwpick], [data-pwact="up"], [data-pwact="down"], [data-pwact="view-teacher"], .btn-back')) drawer(false);
  }, true);
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && document.body.classList.contains('pw-drawer-open')) drawer(false); });
  document.addEventListener('click', e => {
    const c = () => current();
    if(e.target.closest('[data-lbmodel]')){ e.preventDefault(); modelOnBoard(); }
    else if(e.target.closest('[data-lbwrite]')){ e.preventDefault(); const k = c(); if(FabBoard.inlaid() && k && k.stp) FabBoard.goWhere(p => p.step === k.p.id + ':' + k.i); else boardFor(k, false); }
    else if(e.target.closest('[data-lbbook]')){ e.preventDefault(); const k = c(); if(FabBoard.inlaid()) openBooklet(k); else boardFor(k, true); }
  });
  /* a link shared before this file loaded */
  try{ if(typeof Live !== 'undefined' && Live.pendingView){ CoView.fromShared(Live.pendingView); Live.pendingView = null; } }catch(e){}
  paintShare(); setInterval(paintShare, 3000);
  window.FabLearnBoard = { current, boardFor, slidesFor, showSlides, modelOnBoard, afterRender, kitInfo };
  /* the lesson may already be on screen */
  try{ const st = document.getElementById('lpStage'); if(st && st.querySelector('.pw-centre')) afterRender(st); }catch(e){}
})();
