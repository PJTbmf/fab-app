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
  /* Slides: the step taught as a short deck, one job per character (dual coding).
     💡 the big idea and 👀 I do: Miss Bell · 🤝 We do: Bramble and Moss · ⭐ You do: Fab · 🛑 a good place to stop: Mrs Lark.
     Every slide is a board page, so the teacher can write on it. */
  const BAND = { idea:'#E3F1F8', ido:'#FFE2CC', think:'#FFE2CC', wedo:'#FFF1B8', ydo:'#DDEFD3', stop:'#EFE4F7' };
  const cast = (ks, w) => { const out = []; const list = [].concat(ks); const step = w * 0.78; let x = 1560 - w - (list.length - 1) * step;
    list.forEach((k, i) => out.push({ t:'c', k, x:x + i * step, y:1000 - w * 1.42 - 20, w, lock:true })); return out; };
  const band = (kind, head) => [{ t:'r', x:0, y:0, w:1600, h:150, f:BAND[kind] || '#fff8d6', c:BAND[kind] || '#fff8d6', lw:1, lock:true }, { t:'x', x:60, y:38, s:74, c:INK, txt:head, lock:true }];
  const roomFor = ks => 1600 - 80 - ([].concat(ks).length > 1 ? 470 : 300);
  function qItems(qq, maths, width){
    const out = modelItems(qq, maths, width);
    if(qq.mode === 'choice' && Array.isArray(qq.choices) && !(maths && /[+−\-×÷]/.test(qq.say || ''))){
      const y = 230 + 92 * Math.max(1, out[0] && out[0].txt ? out[0].txt.split('\n').length : 1) + 40;
      qq.choices.forEach((ch, i) => out.push(words(`${'abcd'[i]})  ${pwShow(ch)}`, 120, y + i * 96, 70, INK, width)));
    }
    return out;
  }
  function slidesFor(c){
    if(!c || !c.stp) return null;
    const stp = c.stp, tc = stp.teach || {}, maths = isMaths(c), paper = maths ? 'squares' : 'plain', base = c.p.id + ':' + c.i;
    const q = () => { const k = kidNow(); return (k && (k.ex || k.q)) || pwQuestion(stp); };
    const pg = (kind, head, who, items, bg) => ({ key:'', title:'', prompt:'', bg:bg || 'plain', items:[...band(kind, head), ...items, ...cast(who, [].concat(who).length > 1 ? 230 : 270)] });
    return () => {
      const list = [];
      const W1 = roomFor('bell'), W2 = roomFor(['yellow', 'green']);
      list.push({ icon:'💡', name:'The big idea', kind:'idea', make:() => pg('idea', `💡 ${stp.name}`, 'bell', [words(tc.idea || stp.task || 'Today we are learning something new, one small step at a time.', 80, 220, 64, INK, W1)]) });
      list.push({ icon:'👀', name:'I do', kind:'ido', make:() => { const qq = q(); return pg('ido', '👀 I do: watch me', 'bell', qItems(qq, maths, W1), paper); } });
      list.push({ icon:'💭', name:'My thinking', kind:'think', make:() => {
        const qq = q(); let worked = '';
        try{ worked = PW_WORKED[qq.kind] ? PW_WORKED[qq.kind](qq) : pwFindHint(stp, qq, null).text; }catch(e){}
        const ans = qq.say ? `${qq.say} = ${pwShow(qq.ans)}` : `The answer is ${pwShow(qq.ans)}`;
        return pg('think', '💭 My thinking', 'bell', [words(worked || '', 80, 210, 58, INK, W1), words(ans, 80, 760, 76, FLAME, W1)]);
      } });
      list.push({ icon:'🤝', name:'We do', kind:'wedo', make:() => { const qq = pwQuestion(stp); return pg('wedo', '🤝 We do: one together', ['yellow', 'green'], [...qItems(qq, maths, W2), words(tc.we || 'Let’s try one together. The hint is open.', 80, 850, 44, '#5C6B52', W2)], paper); } });
      list.push({ icon:'⭐', name:'You do', kind:'ydo', make:() => { const qq = pwQuestion(stp); return pg('ydo', '⭐ You do: your turn', 'fab', [...qItems(qq, maths, W1), words('Have a go on your own. Hints are always there.', 80, 850, 44, '#5C6B52', W1)], paper); } });
      list.push({ icon:'🛑', name:'A good place to stop', kind:'stop', make:() => pg('stop', '🛑 A good place to stop', 'lark', [words('Well done for your thinking today. You can stop here and it still counts, or carry on if you would like to.', 80, 230, 62, INK, W1)]) });
      return list;
    };
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
      if(FabBoard.hasLive()) out.push({ k:'live', icon:'📡', name:'Teacher’s board', on:pg.key === 'live', go:() => FabBoard.goWhere(p => p.key === 'live') });
      if(B.visHTML) out.push({ k:'vis', icon:'🖼️', name:'Picture', on:pg.bg === 'vis', go:() => FabBoard.goWhere(p => p.bg === 'vis') });
      out.push({ k:'slides', icon:'📽️', name:'Slides', on:pg.deck === deck, go:() => { if(pg.deck === deck) return; if(!FabBoard.goWhere(p => p.deck === deck)) showSlides(c); } });
      out.push({ k:'mine', icon:'✏️', name:'My page', on:pg.step === stepKey, go:() => FabBoard.goWhere(p => p.step === stepKey) });
      if(window.FabModelKit) out.push({ k:'tools', icon:'🧰', name:'Modelling tools', on:!!pg.tool, go:() => FabModelKit.open(kitInfo(c)) });
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
